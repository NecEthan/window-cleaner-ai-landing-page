// Replace with your backend URL
const API_BASE = 'https://route-optimiser-production.up.railway.app';
// const API_BASE = 'http://localhost:3000';
// const API_BASE = 'https://da45395e7876.ngrok-free.app';

let isLogin = true;

// DOM elements
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const authForm = document.getElementById('auth-form');
const authSubmit = document.getElementById('auth-submit');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleMode = document.getElementById('toggle-mode');
const toggleText = document.getElementById('toggle-text');
const nameGroup = document.getElementById('name-group');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const logoutBtn = document.getElementById('logout-btn');

// Stats elements
const totalJobsEl = document.getElementById('total-jobs');
const completedJobsEl = document.getElementById('completed-jobs');
const totalIncomeEl = document.getElementById('total-income');
const jobsList = document.getElementById('jobs-list');

// Check if user is already logged in
const token = localStorage.getItem('authToken');
if (token) {
    showDashboard();
}

// Toggle between login and register
toggleMode.addEventListener('click', () => {
    isLogin = !isLogin;
    if (isLogin) {
        authSubtitle.textContent = 'Sign in to your account';
        authSubmit.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleMode.textContent = 'Sign Up';
        nameGroup.style.display = 'none';
    } else {
        authSubtitle.textContent = 'Create your account';
        authSubmit.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleMode.textContent = 'Sign In';
        nameGroup.style.display = 'block';
    }
    hideMessages();
});

// Handle form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    hideMessages();
    authSubmit.disabled = true;
    authSubmit.textContent = isLogin ? 'Signing In...' : 'Signing Up...';

    try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin 
            ? { email, password }
            : { email, password, name };

        // Send registration data to Express backend
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.success) {
            if (isLogin) {
                localStorage.setItem('authToken', data.access_token);
                showSuccess('Login successful!');
                setTimeout(showDashboard, 1000);
            } else {
                showSuccess('Account created! Please sign in.');
                isLogin = true;
                toggleMode.click();
            }
        } else {
            showError(data.message || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError('Network error. Please check your connection.');
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = isLogin ? 'Sign In' : 'Sign Up';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    showAuth();
});

async function showDashboard() {
    authContainer.style.display = 'none';
    dashboard.style.display = 'block';
    document.body.style.background = '#f5f7fa';
    
    // Load dashboard data
    await loadDashboardData();
}

function showAuth() {
    authContainer.style.display = 'block';
    dashboard.style.display = 'none';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

async function loadDashboardData() {
    const token = localStorage.getItem('authToken');
    
    try {
        // Load jobs
        const jobsResponse = await fetch(`${API_BASE}/api/jobs`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const jobs = jobsData.data || [];
            
            // Update stats
            const completedJobs = jobs.filter(job => job.completed || job.last_completed);
            totalJobsEl.textContent = jobs.length;
            completedJobsEl.textContent = completedJobs.length;
            
            // Show recent jobs
            if (jobs.length > 0) {
                jobsList.innerHTML = jobs.slice(0, 5).map(job => `
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>${job.description || 'Untitled Job'}</strong><br>
                        <small>${job.customers?.name || 'Unknown Customer'} - $${job.price || 0}</small>
                    </div>
                `).join('');
            } else {
                jobsList.innerHTML = '<p>No jobs found.</p>';
            }
        }
        
        // Load income data
        const incomeResponse = await fetch(`${API_BASE}/api/income`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (incomeResponse.ok) {
            const incomeData = await incomeResponse.json();
            const income = incomeData.data || [];
            const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        jobsList.innerHTML = '<p style="color: red;">Error loading data</p>';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}