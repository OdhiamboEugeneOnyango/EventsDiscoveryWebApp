// Global variables
        let currentEvents = [];
        let currentUser = null;
        let editingEventId = null;

        // Initialize page
        document.addEventListener('DOMContentLoaded', async () => {
    setupRoleAwareUI();

    await checkAuthentication();
    await loadUserProfile();
    await loadEvents();
    await loadDashboardStats();
});

        function setupRoleAwareUI() {
    const token = localStorage.getItem('authToken');
    const currentRole = localStorage.getItem('currentRole');
    const isLoggedIn = !!token;

    const authButtons = document.querySelector('.auth-buttons');
    const profileDropdown = document.getElementById('profileDropdown');

    // Role switch links
    const switchToUser = document.querySelector('a[onclick*="switchRole(\'user\')"]');
    const switchToArtist = document.querySelector('a[onclick*="switchRole(\'artist\')"]');
    const switchToOrganizer = document.querySelector('a[onclick*="switchRole(\'organizer\')"]');

    if (token && currentRole) {
        // Hide login/signup
        if (authButtons) authButtons.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'block';

        // Show/hide switch options based on role
        if (switchToUser)     switchToUser.style.display     = currentRole === 'user'     ? 'none' : 'block';
        if (switchToArtist)   switchToArtist.style.display   = currentRole === 'artist'   ? 'none' : 'block';
        if (switchToOrganizer) switchToOrganizer.style.display = currentRole === 'organizer' ? 'none' : 'block';

    } else {
        // Show login/signup
        if (authButtons) authButtons.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
    }
}

        // Authentication check
        function checkAuthentication() {
            const token = localStorage.getItem('authToken');
            if (!token) {
                window.location.href = '/login';
                return;
            }
        }

        // Load user profile - FIXED
        async function loadUserProfile() {
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    currentUser = data.user;
                    document.getElementById('userName').textContent = `${data.user.firstName} ${data.user.lastName}`;
                    
                    // Check if user is organizer
                    if (data.user.role !== 'organizer' && data.user.role !== 'admin') {
                        showAlert('You do not have permission to access this page', 'error');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    }
                } else {
                    throw new Error('Failed to load profile');
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                showAlert('Error loading profile', 'error');
            }
        }

        // Load events - FIXED
        async function loadEvents() {
            try {
                const response = await fetch('/api/events', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    currentEvents = data.events;
                    displayEvents(currentEvents);
                } else {
                    throw new Error('Failed to load events');
                }
            } catch (error) {
                console.error('Error loading events:', error);
                document.getElementById('eventsTableBody').innerHTML = 
                    '<tr><td colspan="9" style="text-align: center; color: #e74c3c;">Error loading events</td></tr>';
            }
        }

        // Display events in table
        function displayEvents(events) {
            const tbody = document.getElementById('eventsTableBody');
            
            if (events.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #666;">No events found</td></tr>';
                return;
            }

            tbody.innerHTML = events.map(event => `
                <tr>
                    <td><strong>${event.name}</strong></td>
                    <td>${formatDate(event.date)}</td>
                    <td>${formatTime(event.time)}</td>
                    <td>${event.location}</td>
                    <td>${capitalizeFirst(event.category)}</td>
                    <td><span class="status-badge status-${event.status}">${event.status}</span></td>
                    <td>${event.attendees || 0}/${event.capacity || 'Unlimited'}</td>
                    <td>${event.price ? `KSh ${event.price}` : 'Free'}</td>
                    <td class="event-actions">
                        <button class="action-btn view-btn" onclick="viewEvent('${event._id}')">View</button>
                        <button class="action-btn edit-btn" onclick="editEvent('${event._id}')">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteEvent('${event._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }

        // Load dashboard statistics - FIXED
        async function loadDashboardStats() {
            try {
                const response = await fetch('/api/organizer/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('totalEvents').textContent = data.totalEvents || 0;
                    document.getElementById('activeEvents').textContent = data.activeEvents || 0;
                    document.getElementById('totalAttendees').textContent = data.totalAttendees || 0;
                    document.getElementById('totalRevenue').textContent = `KSh ${data.totalRevenue || 0}`;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Filter events
        function filterEvents() {
            const statusFilter = document.getElementById('statusFilter').value;
            const categoryFilter = document.getElementById('categoryFilter').value;
            const dateFilter = document.getElementById('dateFilter').value;
            const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

            let filteredEvents = currentEvents.filter(event => {
                const matchesStatus = !statusFilter || event.status === statusFilter;
                const matchesCategory = !categoryFilter || event.category === categoryFilter;
                const matchesDate = !dateFilter || event.date.startsWith(dateFilter);
                const matchesSearch = !searchFilter || 
                    event.name.toLowerCase().includes(searchFilter) ||
                    event.location.toLowerCase().includes(searchFilter);

                return matchesStatus && matchesCategory && matchesDate && matchesSearch;
            });

            displayEvents(filteredEvents);
        }

        // Open event modal
        function openEventModal(eventId = null) {
            const modal = document.getElementById('eventModal');
            const modalTitle = document.getElementById('modalTitle');
            const submitBtn = document.getElementById('submitBtn');
            const form = document.getElementById('eventForm');

            editingEventId = eventId;
            
            if (eventId) {
                modalTitle.textContent = 'Edit Event';
                submitBtn.textContent = 'Update Event';
                loadEventData(eventId);
            } else {
                modalTitle.textContent = 'Create New Event';
                submitBtn.textContent = 'Create Event';
                form.reset();
            }

            modal.classList.add('active');
        }

        // Close event modal
        function closeEventModal() {
            document.getElementById('eventModal').classList.remove('active');
            document.getElementById('eventForm').reset();
            editingEventId = null;
        }

        // Load event data for editing
        function loadEventData(eventId) {
            const event = currentEvents.find(e => e._id === eventId);
            if (event) {
                document.getElementById('eventName').value = event.name;
                document.getElementById('eventCategory').value = event.category;
                document.getElementById('eventDate').value = event.date.split('T')[0];
                document.getElementById('eventTime').value = event.time;
                document.getElementById('eventLocation').value = event.location;
                document.getElementById('eventPrice').value = event.price || '';
                document.getElementById('eventCapacity').value = event.capacity || '';
                document.getElementById('eventStatus').value = event.status;
                document.getElementById('eventDescription').value = event.description || '';
                document.getElementById('eventTags').value = event.tags ? event.tags.join(', ') : '';
            }
        }

        // Handle form submission - UPDATED WITH IMAGE UPLOAD
        document.getElementById('eventForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            // Handle tags properly
            const tagsValue = formData.get('tags');
            if (tagsValue) {
                formData.delete('tags');
                formData.append('tags', JSON.stringify(tagsValue.split(',').map(tag => tag.trim())));
            }

            try {
                const url = editingEventId ? `/api/organizer/events/${editingEventId}` : '/api/organizer/events';
                const method = editingEventId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: formData // Use FormData for file upload
                });

                if (response.ok) {
                    const data = await response.json();
                    showAlert(data.message, 'success');
                    closeEventModal();
                    loadEvents();
                    loadDashboardStats();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save event');
                }
            } catch (error) {
                console.error('Error saving event:', error);
                showAlert(error.message, 'error');
            }
        });

        // View event details
        function viewEvent(eventId) {
            const event = currentEvents.find(e => e._id === eventId);
            if (event) {
                let eventDetails = `Event: ${event.name}\n`;
                eventDetails += `Date: ${formatDate(event.date)}\n`;
                eventDetails += `Time: ${formatTime(event.time)}\n`;
                eventDetails += `Location: ${event.location}\n`;
                eventDetails += `Category: ${capitalizeFirst(event.category)}\n`;
                eventDetails += `Status: ${event.status}\n`;
                eventDetails += `Price: ${event.price ? `KSh ${event.price}` : 'Free'}\n`;
                eventDetails += `Capacity: ${event.capacity || 'Unlimited'}\n`;
                if (event.description) eventDetails += `Description: ${event.description}\n`;
                if (event.tags && event.tags.length > 0) eventDetails += `Tags: ${event.tags.join(', ')}`;
                
                alert(eventDetails);
            }
        }

        // Edit event
        function editEvent(eventId) {
            openEventModal(eventId);
        }

        // Delete event - FIXED
        async function deleteEvent(eventId) {
            if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch(`/api/organizer/events/${eventId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    showAlert(data.message, 'success');
                    loadEvents();
                    loadDashboardStats();
                } else {
                    throw new Error('Failed to delete event');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                showAlert('Error deleting event', 'error');
            }
        }

        // Export events - ENHANCED
        function exportEvents() {
            if (currentEvents.length === 0) {
                showAlert('No events to export', 'warning');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Date', 'Time', 'Location', 'Category', 'Status', 'Price', 'Capacity', 'Attendees'];
            const csvContent = [
                headers.join(','),
                ...currentEvents.map(event => [
                    `"${event.name}"`,
                    event.date,
                    event.time,
                    `"${event.location}"`,
                    event.category,
                    event.status,
                    event.price || 0,
                    event.capacity || 'Unlimited',
                    event.attendees || 0
                ].join(','))
            ].join('\n');

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showAlert('Events exported successfully', 'success');
        }

        // View analytics
        function viewAnalytics() {
            // Enhanced analytics display
            const totalEvents = currentEvents.length;
            const activeEvents = currentEvents.filter(e => e.status === 'active').length;
            const completedEvents = currentEvents.filter(e => e.status === 'completed').length;
            const totalAttendees = currentEvents.reduce((sum, event) => sum + (event.attendees || 0), 0);
            const totalRevenue = currentEvents.reduce((sum, event) => sum + ((event.attendees || 0) * (event.price || 0)), 0);

            let analytics = `Event Analytics:\n\n`;
            analytics += `Total Events: ${totalEvents}\n`;
            analytics += `Active Events: ${activeEvents}\n`;
            analytics += `Completed Events: ${completedEvents}\n`;
            analytics += `Total Attendees: ${totalAttendees}\n`;
            analytics += `Total Revenue: KSh ${totalRevenue.toFixed(2)}\n\n`;

            if (totalEvents > 0) {
                analytics += `Average Attendees per Event: ${(totalAttendees / totalEvents).toFixed(1)}\n`;
                analytics += `Average Revenue per Event: KSh ${(totalRevenue / totalEvents).toFixed(2)}`;
            }

            alert(analytics);
        }

        // Show alert message
        function showAlert(message, type = 'info') {
            const alertContainer = document.getElementById('alertContainer');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} show`;
            alertDiv.textContent = message;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alertDiv);
            
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 300);
            }, 5000);
        }

        // Logout
        function logout() {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }

        // Helper functions
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }

        function formatTime(timeString) {
            if (!timeString) return '';
            return timeString.substring(0, 5); // Just show HH:MM
        }

        function capitalizeFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }