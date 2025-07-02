let events = [];
let currentUser = null;

// Authentication utilities
class AuthManager {
    static TOKEN_KEY = 'eventhub_token';
    static USER_KEY = 'eventhub_user';

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    static getCurrentUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    static setCurrentUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        currentUser = user;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    static canAccessOrganizer() {
        const user = this.getCurrentUser();
        return user && (user.role === 'organizer' || user.role === 'admin');
    }

    static async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.setCurrentUser(data.user);
                return true;
            } else {
                this.removeToken();
                return false;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.removeToken();
            return false;
        }
    }
}

// API utilities with authentication
class ApiClient {
    static async request(url, options = {}) {
        const token = AuthManager.getToken();
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    AuthManager.removeToken();
                    redirectToLogin();
                    throw new Error('Authentication required');
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    static get(url) {
        return this.request(url);
    }

    static post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static delete(url) {
        return this.request(url, {
            method: 'DELETE',
        });
    }
}

// Authentication check and redirect
function redirectToLogin() {
    const currentPage = window.location.pathname;
    if (currentPage.includes('organizer')) {
        alert('Please log in as an organizer to access this page');
        window.location.href = '/login.html';
    }
}

// Check authentication and authorization on page load
async function checkAuthentication() {
    const isValid = await AuthManager.verifyToken();
    
    if (!isValid) {
        redirectToLogin();
        return false;
    }

    if (!AuthManager.canAccessOrganizer()) {
        alert('Access denied. You need organizer privileges to access this page.');
        window.location.href = '/index.html';
        return false;
    }

    currentUser = AuthManager.getCurrentUser();
    updateUIForUser();
    return true;
}

// Update UI based on user role
function updateUIForUser() {
    if (!currentUser) return;

    // Update user display
    const userDisplay = document.querySelector('.user-menu span');
    if (userDisplay) {
        userDisplay.textContent = `${currentUser.name} (${currentUser.role})`;
    }

    // Add logout functionality
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.querySelector('.logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;
        userMenu.appendChild(logoutBtn);
    }

    // Hide admin-only features if user is not admin
    if (currentUser.role !== 'admin') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        AuthManager.removeToken();
        window.location.href = '/login.html';
    }
}

// Load events with authentication
async function loadEvents() {
    try {
        showLoader();
        const data = await ApiClient.get('/api/events');
        
        if (data.success) {
            events = data.events;
            renderEvents();
            loadDashboardStats();
        } else {
            events = [];
            renderEvents();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        events = [];
        renderEvents();

        const eventsGrid = document.getElementById('eventsGrid');
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="error-message">
                    <h3>Failed to load events</h3>
                    <p>${error.message}</p>
                    <button onclick="loadEvents()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    } finally {
        hideLoader();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const data = await ApiClient.get('/api/analytics/dashboard');
        
        if (data.success) {
            renderStatsCards(data.analytics);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Render statistics cards
function renderStatsCards(analytics) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const stats = [
        { label: 'Total Events', value: analytics.totalEvents, icon: '📅', color: '#3b82f6' },
        { label: 'Active Events', value: analytics.activeEvents, icon: '🟢', color: '#10b981' },
        { label: 'Draft Events', value: analytics.draftEvents, icon: '📝', color: '#f59e0b' },
        { label: 'Total Attendees', value: analytics.totalAttendees, icon: '👥', color: '#8b5cf6' },
        { label: 'Total Revenue', value: `KSH ${analytics.totalRevenue.toLocaleString()}`, icon: '💰', color: '#06b6d4' },
        { label: 'Ended Events', value: analytics.endedEvents, icon: '✅', color: '#64748b' }
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: ${stat.color}20; color: ${stat.color}">
                ${stat.icon}
            </div>
            <div class="stat-content">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        </div>
    `).join('');
}

// Enhanced render events with better error handling
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    if (!events || events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="no-events">
                <div class="no-events-icon">📅</div>
                <h3>No events found</h3>
                <p>Create your first event to get started!</p>
                <button class="btn btn-primary" onclick="openModal('createEventModal')">
                    ➕ Create Event
                </button>
            </div>
        `;
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        const statusClass = event.status === 'active' ? 'status-active' :
            event.status === 'draft' ? 'status-draft' : 
            event.status === 'ended' ? 'status-ended' : 'status-cancelled';

        const price = event.price ? `KSH ${event.price.toLocaleString()}` : 'Free';
        const organizerInfo = currentUser.role === 'admin' && event.organizer ? 
            `<br>👤 ${event.organizer.name}` : '';

        eventCard.innerHTML = `
            <div class="event-image">
                <div class="event-status ${statusClass}">${event.status.toUpperCase()}</div>
                <div class="event-icon">📅</div>
            </div>
            <div class="event-content">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-details">
                    📍 ${escapeHtml(event.location)}<br>
                    🏢 ${escapeHtml(event.venue)}<br>
                    🗓️ ${formatDate(event.date)} at ${event.time}<br>
                    🏷️ ${escapeHtml(event.category)}<br>
                    💰 ${price}${organizerInfo}
                </div>
                <div class="event-stats">
                    <div class="stat">
                        <div class="stat-value">${event.attendees || 0}</div>
                        <div class="stat-label">Attendees</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${event.capacity}</div>
                        <div class="stat-label">Capacity</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">KSH ${(event.revenue || 0).toLocaleString()}</div>
                        <div class="stat-label">Revenue</div>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="action-btn" onclick="editEvent('${event._id}')" title="Edit Event">
                        ✏️ Edit
                    </button>
                    <button class="action-btn" onclick="viewAnalytics('${event._id}')" title="View Analytics">
                        📊 Analytics
                    </button>
                    <button class="action-btn" onclick="manageAttendees('${event._id}')" title="Manage Attendees">
                        👥 Attendees
                    </button>
                    <button class="action-btn" onclick="duplicateEvent('${event._id}')" title="Duplicate Event">
                        📋 Duplicate
                    </button>
                    ${event.status === 'active' ? 
                        `<button class="action-btn" onclick="pauseEvent('${event._id}')" title="Pause Event">⏸️ Pause</button>` : ''}
                    ${event.status === 'draft' ? 
                        `<button class="action-btn" onclick="publishEvent('${event._id}')" title="Publish Event">🚀 Publish</button>` : ''}
                    <button class="action-btn delete-btn" onclick="deleteEvent('${event._id}')" title="Delete Event">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
        eventsGrid.appendChild(eventCard);
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enhanced date formatting
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Enhanced CRUD Operations with better error handling

// Create Event
document.addEventListener('DOMContentLoaded', function() {
    const createForm = document.getElementById('createEventForm');
    if (createForm) {
        createForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating...';

                const eventData = {
                    title: document.getElementById('eventTitle').value.trim(),
                    category: document.getElementById('eventCategory').value,
                    description: document.getElementById('eventDescription').value.trim(),
                    date: document.getElementById('eventDate').value,
                    time: document.getElementById('eventTime').value,
                    location: document.getElementById('eventLocation').value.trim(),
                    venue: document.getElementById('eventVenue').value.trim(),
                    capacity: parseInt(document.getElementById('eventCapacity').value),
                    price: parseFloat(document.getElementById('eventPrice').value) || 0,
                    requireApproval: document.getElementById('requireApproval')?.checked || false
                };

                const data = await ApiClient.post('/api/events', eventData);
                
                if (data.success) {
                    await loadEvents();
                    closeModal('createEventModal');
                    this.reset();
                    document.getElementById('imagePreview').innerHTML = '';
                    showNotification('Event created successfully!', 'success');
                }
            } catch (error) {
                showNotification('Failed to create event: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Edit Event
async function editEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }

    // Only admin or the event's organizer can edit
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only edit your own events.', 'error');
        return;
    }

    // Populate the edit form with event data
    openModal('editEventModal');
    document.getElementById('editEventId').value = event._id;
    document.getElementById('editEventTitle').value = event.title;
    document.getElementById('editEventCategory').value = event.category;
    document.getElementById('editEventDescription').value = event.description;
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventTime').value = event.time;
    document.getElementById('editEventLocation').value = event.location;
    document.getElementById('editEventVenue').value = event.venue;
    document.getElementById('editEventCapacity').value = event.capacity;
    document.getElementById('editEventPrice').value = event.price;
    document.getElementById('editRequireApproval').checked = event.requireApproval || false;
}

// Save edited event
document.getElementById('editEventForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const eventId = document.getElementById('editEventId').value;
    const eventData = {
        title: document.getElementById('editEventTitle').value.trim(),
        category: document.getElementById('editEventCategory').value,
        description: document.getElementById('editEventDescription').value.trim(),
        date: document.getElementById('editEventDate').value,
        time: document.getElementById('editEventTime').value,
        location: document.getElementById('editEventLocation').value.trim(),
        venue: document.getElementById('editEventVenue').value.trim(),
        capacity: parseInt(document.getElementById('editEventCapacity').value),
        price: parseFloat(document.getElementById('editEventPrice').value) || 0,
        requireApproval: document.getElementById('editRequireApproval')?.checked || false
    };

    try {
        const data = await ApiClient.put(`/api/events/${eventId}`, eventData);
        if (data.success) {
            await loadEvents();
            closeModal('editEventModal');
            showNotification('Event updated successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to update event: ' + error.message, 'error');
    }
});

// Delete Event
async function deleteEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }

    // Only admin or the event's organizer can delete
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only delete your own events.', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const data = await ApiClient.delete(`/api/events/${eventId}`);
        if (data.success) {
            await loadEvents();
            showNotification('Event deleted successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to delete event: ' + error.message, 'error');
    }
}

// Hide create/edit/delete buttons for non-organizer/non-admin
function updateUIForUser() {
    if (!currentUser) return;

    // ...existing code...

    // Hide event creation for non-organizer/non-admin
    if (currentUser.role !== 'organizer' && currentUser.role !== 'admin') {
        const createBtn = document.querySelector('.btn-create-event');
        if (createBtn) createBtn.style.display = 'none';
    }
}

// View Analytics (only for organizer's own events or admin)
function viewAnalytics(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return showNotification('Event not found', 'error');
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only view analytics for your own events.', 'error');
        return;
    }
    // Implement analytics modal or redirect here
    alert('Analytics for event: ' + event.title);
}

// Manage Attendees (only for organizer's own events or admin)
function manageAttendees(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return showNotification('Event not found', 'error');
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only manage attendees for your own events.', 'error');
        return;
    }
    // Implement attendee management modal or redirect here
    alert('Manage attendees for event: ' + event.title);
}

// Duplicate Event (only for organizer's own events or admin)
async function duplicateEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return showNotification('Event not found', 'error');
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only duplicate your own events.', 'error');
        return;
    }
    try {
        const eventData = { ...event, title: event.title + ' (Copy)' };
        delete eventData._id;
        delete eventData.createdAt;
        delete eventData.updatedAt;
        const data = await ApiClient.post('/api/events', eventData);
        if (data.success) {
            await loadEvents();
            showNotification('Event duplicated successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to duplicate event: ' + error.message, 'error');
    }
}

// Publish Event (only for organizer's own events or admin)
async function publishEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return showNotification('Event not found', 'error');
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only publish your own events.', 'error');
        return;
    }
    try {
        const data = await ApiClient.put(`/api/events/${eventId}`, { status: 'active' });
        if (data.success) {
            await loadEvents();
            showNotification('Event published!', 'success');
        }
    } catch (error) {
        showNotification('Failed to publish event: ' + error.message, 'error');
    }
}

// Pause Event (only for organizer's own events or admin)
async function pauseEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (!event) return showNotification('Event not found', 'error');
    if (
        currentUser.role !== 'admin' &&
        event.organizer &&
        event.organizer._id !== currentUser.id
    ) {
        showNotification('You can only pause your own events.', 'error');
        return;
    }
    try {
        const data = await ApiClient.put(`/api/events/${eventId}`, { status: 'draft' });
        if (data.success) {
            await loadEvents();
            showNotification('Event paused.', 'success');
        }
    } catch (error) {
        showNotification('Failed to pause event: ' + error.message, 'error');
    }
}

// Modal helpers (implement as needed)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
}

// Notification helper
function showNotification(message, type = 'info') {
    // Implement your notification UI here
    alert(message);
}

// Loader helpers (implement as needed)
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
}
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

// On page load, check authentication and load events
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await checkAuthentication();
    if (ok) {
        await loadEvents();
    }
});

// --- Tab Switching Logic ---
function switchTab(tabId, e) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');
}

// --- Applications Tab Placeholder ---
function renderApplications() {
    const table = document.querySelector('.applications-table');
    if (!table) return;
    // Placeholder: Replace with real data fetching if needed
    table.innerHTML += `
        <div class="table-row">
            <div>Jane Doe</div>
            <div>Music Fest 2025</div>
            <div>2025-07-01</div>
            <div>Pending</div>
            <div><button class="btn btn-primary btn-sm">Review</button></div>
        </div>
        <div class="table-row">
            <div>John Smith</div>
            <div>Art Expo</div>
            <div>2025-06-20</div>
            <div>Approved</div>
            <div><button class="btn btn-secondary btn-sm" disabled>Reviewed</button></div>
        </div>
    `;
}

// --- Venue Requests Tab Placeholder ---
function renderVenueRequests() {
    const venueDiv = document.getElementById('venueRequests');
    if (!venueDiv) return;
    // Placeholder: Replace with real data fetching if needed
    venueDiv.innerHTML = `
        <div class="venue-request">
            <div><strong>Venue:</strong> Grand Hall</div>
            <div><strong>Event:</strong> Tech Conference</div>
            <div><strong>Date:</strong> 2025-08-10</div>
            <div><strong>Status:</strong> Pending</div>
            <button class="btn btn-primary btn-sm">Approve</button>
            <button class="btn btn-secondary btn-sm">Reject</button>
        </div>
        <div class="venue-request">
            <div><strong>Venue:</strong> Open Grounds</div>
            <div><strong>Event:</strong> Summer Jam</div>
            <div><strong>Date:</strong> 2025-09-05</div>
            <div><strong>Status:</strong> Approved</div>
            <button class="btn btn-secondary btn-sm" disabled>Approved</button>
        </div>
    `;
}

// --- Image Upload and Preview for Event Creation ---
document.getElementById('eventImages')?.addEventListener('change', function (e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = document.createElement('img');
            img.src = evt.target.result;
            img.className = 'preview-thumb';
            img.style.maxWidth = '80px';
            img.style.marginRight = '8px';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// --- Add event duration to event creation ---
document.getElementById('createEventForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        // Collect images (if any)
        const imagesInput = document.getElementById('eventImages');
        let images = [];
        if (imagesInput && imagesInput.files.length > 0) {
            // In a real app, upload images to server or cloud storage here
            // For now, just show preview (already handled above)
            // You may want to send images as FormData if backend supports it
        }

        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            category: document.getElementById('eventCategory').value,
            description: document.getElementById('eventDescription').value.trim(),
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            duration: parseInt(document.getElementById('eventDuration').value) || 2,
            location: document.getElementById('eventLocation').value.trim(),
            venue: document.getElementById('eventVenue').value.trim(),
            capacity: parseInt(document.getElementById('eventCapacity').value),
            price: parseFloat(document.getElementById('eventPrice').value) || 0,
            requireApproval: document.getElementById('requireApproval')?.checked || false,
            images // Placeholder: handle image upload as needed
        };

        const data = await ApiClient.post('/api/events', eventData);

        if (data.success) {
            await loadEvents();
            closeModal('createEventModal');
            this.reset();
            document.getElementById('imagePreview').innerHTML = '';
            showNotification('Event created successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to create event: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// --- Add event duration to event editing ---
document.getElementById('editEventForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const eventId = document.getElementById('editEventId').value;
    const eventData = {
        title: document.getElementById('editEventTitle').value.trim(),
        category: document.getElementById('editEventCategory').value,
        description: document.getElementById('editEventDescription').value.trim(),
        date: document.getElementById('editEventDate').value,
        time: document.getElementById('editEventTime').value,
        duration: parseInt(document.getElementById('eventDuration')?.value) || 2,
        location: document.getElementById('editEventLocation').value.trim(),
        venue: document.getElementById('editEventVenue').value.trim(),
        capacity: parseInt(document.getElementById('editEventCapacity').value),
        price: parseFloat(document.getElementById('editEventPrice').value) || 0,
        requireApproval: document.getElementById('editRequireApproval')?.checked || false
    };

    try {
        const data = await ApiClient.put(`/api/events/${eventId}`, eventData);
        if (data.success) {
            await loadEvents();
            closeModal('editEventModal');
            showNotification('Event updated successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to update event: ' + error.message, 'error');
    }
});

// --- Add "entertainment" to edit modal category options if missing ---
document.addEventListener('DOMContentLoaded', () => {
    const editCategory = document.getElementById('editEventCategory');
    if (editCategory && !Array.from(editCategory.options).some(opt => opt.value === 'entertainment')) {
        const option = document.createElement('option');
        option.value = 'entertainment';
        option.textContent = 'Entertainment';
        editCategory.appendChild(option);
    }
});

// --- Initialize applications and venues tabs on load ---
document.addEventListener('DOMContentLoaded', () => {
    renderApplications();
    renderVenueRequests();
});