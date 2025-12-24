// API Base URL
const API_BASE = '/api';

// Global variables
let currentLocation = null;
let userIssues = [];

// DOM Elements
const reportModal = document.getElementById('reportModal');
const reportForm = document.getElementById('reportForm');
const issueDetailsModal = document.getElementById('issueDetailsModal');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadMyIssues();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'citizen') {
        window.location.href = '/';
        return;
    }
}

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userWelcome').textContent = `Welcome, ${user.name}`;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Show report modal
function showReportModal() {
    reportModal.style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Get current location
function getCurrentLocation() {
    const locationStatus = document.getElementById('locationStatus');
    
    if (!navigator.geolocation) {
        locationStatus.innerHTML = '<div class="location-error">Geolocation is not supported by this browser.</div>';
        return;
    }
    
    locationStatus.innerHTML = '<div>Getting location...</div>';
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            locationStatus.innerHTML = `<div class="location-success">Location captured: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</div>`;
        },
        function(error) {
            locationStatus.innerHTML = '<div class="location-error">Error getting location. Please try again.</div>';
            console.error('Geolocation error:', error);
        }
    );
}

// Report form handler
reportForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentLocation) {
        alert('Please get your current location first.');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', document.getElementById('issueTitle').value);
    formData.append('description', document.getElementById('issueDescription').value);
    formData.append('category', document.getElementById('issueCategory').value);
    formData.append('latitude', currentLocation.latitude);
    formData.append('longitude', currentLocation.longitude);
    formData.append('image', document.getElementById('issueImage').files[0]);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/issues/report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Issue reported successfully!');
            closeModal('reportModal');
            reportForm.reset();
            currentLocation = null;
            document.getElementById('locationStatus').innerHTML = '';
            loadMyIssues();
        } else {
            alert(data.message || 'Failed to report issue');
        }
    } catch (error) {
        console.error('Report error:', error);
        alert('Failed to report issue. Please try again.');
    }
});

// Load user's issues
async function loadMyIssues() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/issues/my-issues`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        userIssues = await response.json();
        displayIssues(userIssues);
        updateStats();
    } catch (error) {
        console.error('Error loading issues:', error);
    }
}

// Display issues
function displayIssues(issues) {
    const issuesContainer = document.getElementById('myIssues');
    
    if (issues.length === 0) {
        issuesContainer.innerHTML = '<p>No issues reported yet. <a href="#" onclick="showReportModal()">Report your first issue</a></p>';
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
                <div class="issue-date">
                    Reported on: ${new Date(issue.createdAt).toLocaleDateString()}
                </div>
                <div class="issue-actions">
                    <button class="btn btn-outline" onclick="viewIssueDetails('${issue._id}')">View Details</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    const total = userIssues.length;
    const pending = userIssues.filter(issue => issue.status === 'Pending').length;
    const resolved = userIssues.filter(issue => issue.status === 'Resolved').length;
    
    document.getElementById('totalIssues').textContent = total;
    document.getElementById('pendingIssues').textContent = pending;
    document.getElementById('resolvedIssues').textContent = resolved;
}

// View issue details
async function viewIssueDetails(issueId) {
    try {
        const response = await fetch(`${API_BASE}/issues/${issueId}`);
        const issue = await response.json();
        
        const detailsContent = document.getElementById('issueDetailsContent');
        detailsContent.innerHTML = `
            <h2>${issue.title}</h2>
            <img src="${issue.imageUrl}" alt="Issue Image" style="width: 100%; max-height: 300px; object-fit: cover; margin: 1rem 0;">
            <p><strong>Description:</strong> ${issue.description}</p>
            <p><strong>Category:</strong> ${issue.category}</p>
            <p><strong>Status:</strong> <span class="issue-status status-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span></p>
            <p><strong>Location:</strong> ${issue.location.latitude.toFixed(6)}, ${issue.location.longitude.toFixed(6)}</p>
            <p><strong>Reported by:</strong> ${issue.reportedBy.name}</p>
            <p><strong>Reported on:</strong> ${new Date(issue.createdAt).toLocaleDateString()}</p>
            ${issue.updatedAt !== issue.createdAt ? `<p><strong>Last updated:</strong> ${new Date(issue.updatedAt).toLocaleDateString()}</p>` : ''}
        `;
        
        issueDetailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading issue details:', error);
        alert('Failed to load issue details');
    }
}