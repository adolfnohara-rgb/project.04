// API Base URL
const API_BASE = '/api';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadPublicIssues();
});

// Modal functions
function showLogin() {
    closeModal('signupModal');
    loginModal.style.display = 'block';
}

function showSignup() {
    closeModal('loginModal');
    signupModal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Login form handler
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/citizen';
            }
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Signup form handler
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/citizen';
            }
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Load public issues
async function loadPublicIssues() {
    try {
        const response = await fetch(`${API_BASE}/issues/public`);
        const issues = await response.json();
        
        const issuesContainer = document.getElementById('publicIssues');
        
        if (issues.length === 0) {
            issuesContainer.innerHTML = '<p>No issues reported yet.</p>';
            return;
        }
        
        issuesContainer.innerHTML = issues.map(issue => `
            <div class="issue-card">
                <img src="${issue.imageUrl}" alt="Issue Image" class="issue-image">
                <div class="issue-content">
                    <div class="issue-title">${issue.title}</div>
                    <div class="issue-description">${issue.description}</div>
                    <div class="issue-meta">
                        <span class="issue-category">${issue.category}</span>
                        <span class="issue-status status-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
                    </div>
                    <div class="issue-reporter">
                        Reported by: ${issue.reportedBy.name}
                    </div>
                    <div class="issue-date">
                        ${new Date(issue.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading public issues:', error);
    }
}