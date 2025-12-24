// API Base URL
const API_BASE = '/api';

// Global variables
let allIssues = [];
let filteredIssues = [];

// DOM Elements
const issueDetailsModal = document.getElementById('issueDetailsModal');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadAllIssues();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
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

// Load all issues
async function loadAllIssues() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/issues/admin/all`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        allIssues = await response.json();
        filteredIssues = [...allIssues];
        displayIssues(filteredIssues);
        updateStats();
    } catch (error) {
        console.error('Error loading issues:', error);
    }
}

// Filter issues
function filterIssues() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredIssues = allIssues.filter(issue => {
        const statusMatch = !statusFilter || issue.status === statusFilter;
        const categoryMatch = !categoryFilter || issue.category === categoryFilter;
        return statusMatch && categoryMatch;
    });
    
    displayIssues(filteredIssues);
}

// Display issues
function displayIssues(issues) {
    const issuesContainer = document.getElementById('allIssues');
    
    if (issues.length === 0) {
        issuesContainer.innerHTML = '<p>No issues found.</p>';
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
                <div class="issue-actions">
                    <button class="btn btn-outline" onclick="viewIssueDetails('${issue._id}')">View Details</button>
                    ${issue.status !== 'Resolved' ? `
                        <select onchange="updateIssueStatus('${issue._id}', this.value)" class="status-select">
                            <option value="">Update Status</option>
                            <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    const total = allIssues.length;
    const pending = allIssues.filter(issue => issue.status === 'Pending').length;
    const inProgress = allIssues.filter(issue => issue.status === 'In Progress').length;
    const resolved = allIssues.filter(issue => issue.status === 'Resolved').length;
    
    document.getElementById('totalIssues').textContent = total;
    document.getElementById('pendingIssues').textContent = pending;
    document.getElementById('inProgressIssues').textContent = inProgress;
    document.getElementById('resolvedIssues').textContent = resolved;
}

// Update issue status
async function updateIssueStatus(issueId, newStatus) {
    if (!newStatus) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/issues/${issueId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Issue status updated successfully!');
            loadAllIssues(); // Reload to get updated data
        } else {
            alert(data.message || 'Failed to update issue status');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update issue status. Please try again.');
    }
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
            <p><strong>Reported by:</strong> ${issue.reportedBy.name} (${issue.reportedBy.email})</p>
            <p><strong>Reported on:</strong> ${new Date(issue.createdAt).toLocaleDateString()}</p>
            ${issue.updatedAt !== issue.createdAt ? `<p><strong>Last updated:</strong> ${new Date(issue.updatedAt).toLocaleDateString()}</p>` : ''}
            
            <div style="margin-top: 2rem;">
                <h3>Update Status</h3>
                <select id="statusUpdate" class="form-control">
                    <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button class="btn btn-primary" onclick="updateIssueStatusFromModal('${issue._id}')" style="margin-top: 1rem;">Update Status</button>
            </div>
        `;
        
        issueDetailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading issue details:', error);
        alert('Failed to load issue details');
    }
}

// Update issue status from modal
async function updateIssueStatusFromModal(issueId) {
    const newStatus = document.getElementById('statusUpdate').value;
    await updateIssueStatus(issueId, newStatus);
    closeModal('issueDetailsModal');
}