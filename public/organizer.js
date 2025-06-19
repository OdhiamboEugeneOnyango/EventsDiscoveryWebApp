let events = [];

// Load events from backend API
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.success) {
            events = data.events;
            renderEvents();
        } else {
            events = [];
            renderEvents();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        events = [];
        renderEvents();

        const eventsGrid = document.getElementById('eventsGrid');
        eventsGrid.innerHTML = '<div class="error-message">Failed to load events. Please refresh the page.</div>';
    }
}

// Render events in the grid
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = '';

     if (!events || events.length === 0) {
        eventsGrid.innerHTML = '<div class="no-events">No events found. Create your first event!</div>';
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        const statusClass = event.status === 'active' ? 'status-active' :
            event.status === 'draft' ? 'status-draft' : 'status-ended';

        // Fixed: Handle missing price field gracefully
        const price = event.price ? `$${event.price}` : 'Free';

        eventCard.innerHTML = `
            <div class="event-image">
                <div class="event-status ${statusClass}">${event.status.toUpperCase()}</div>
                📅
            </div>
            <div class="event-content">
                <div class="event-title">${event.title}</div>
                <div class="event-details">
                    📍 ${event.location}<br>
                    📍 ${event.venue}<br>
                    🗓️ ${formatDate(event.date)} at ${event.time}<br>
                    🏷️ ${event.category}
                    💰 ${price}
                </div>
                <div class="event-stats">
                    <div class="stat">
                        <div class="stat-value">${event.attendees}</div>
                        <div class="stat-label">Attendees</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${event.capacity}</div>
                        <div class="stat-label">Capacity</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${event.revenue}</div>
                        <div class="stat-label">Revenue</div>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="action-btn" onclick="editEvent('${event._id}')">✏️ Edit</button>
                    <button class="action-btn" onclick="viewAnalytics('${event._id}')">📊 Analytics</button>
                    <button class="action-btn" onclick="manageAttendees('${event._id}')">👥 Attendees</button>
                    <button class="action-btn" onclick="duplicateEvent('${event._id}')">📋 Duplicate</button>
                    ${event.status === 'active' ? `<button class="action-btn" onclick="pauseEvent('${event._id}')">⏸️ Pause</button>` : ''}
                    ${event.status === 'draft' ? `<button class="action-btn" onclick="publishEvent('${event._id}')">🚀 Publish</button>` : ''}
                    <button class="action-btn" onclick="deleteEvent('${event._id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
        eventsGrid.appendChild(eventCard);
    });
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// CRUD Operations

// Create Event
document.getElementById('createEventForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const eventData = {
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        venue: document.getElementById('eventVenue').value,
        capacity: parseInt(document.getElementById('eventCapacity').value),
        price: parseFloat(document.getElementById('eventPrice').value) || 0,
        status: 'active',
        attendees: 0,
        revenue: 0,
        rating: 0
    };
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const data = await response.json();
        if (data.success) {
            await loadEvents();
            closeModal('createEventModal');
            this.reset();
            document.getElementById('imagePreview').innerHTML = '';
            alert('Event created successfully!');
        } else {
            alert('Failed to create event: ' + data.message);
        }
    } catch (error) {
        alert('Error creating event.');
    }
});

// Edit Event
async function editEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (event) {
        document.getElementById('editEventTitle').value = event.title;
        document.getElementById('editEventCategory').value = event.category;
        document.getElementById('editEventDescription').value = event.description || '';
        document.getElementById('editEventDate').value = event.date;
        document.getElementById('editEventTime').value = event.time;
        document.getElementById('editEventLocation').value = event.location;
        document.getElementById('editEventVenue').value = event.venue;
        document.getElementById('editEventCapacity').value = event.capacity;
        if (document.getElementById('editEventPrice')) {
            document.getElementById('editEventPrice').value = event.price || 0;
        }
        document.getElementById('editEventId').value = event._id;
        openModal('editEventModal');
    }
}

document.getElementById('editEventForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const eventId = document.getElementById('editEventId').value;
    const eventData = {
        title: document.getElementById('editEventTitle').value,
        category: document.getElementById('editEventCategory').value,
        description: document.getElementById('editEventDescription').value,
        date: document.getElementById('editEventDate').value,
        time: document.getElementById('editEventTime').value,
        location: document.getElementById('editEventLocation').value,
        venue: document.getElementById('editEventVenue').value,
        capacity: parseInt(document.getElementById('editEventCapacity').value)
    };
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const data = await response.json();
        if (data.success) {
            await loadEvents();
            closeModal('editEventModal');
            alert('Event updated successfully!');
        } else {
            alert('Failed to update event: ' + data.message);
        }
    } catch (error) {
        alert('Error updating event.');
    }
});

// Delete Event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            await loadEvents();
            alert('Event deleted successfully!');
        } else {
            alert('Failed to delete event: ' + data.message);
        }
    } catch (error) {
        alert('Error deleting event.');
    }
}

// Duplicate Event
async function duplicateEvent(eventId) {
    const event = events.find(e => e._id === eventId);
    if (event) {
        const newEvent = {
            ...event,
            title: event.title + ' (Copy)',
            status: 'draft',
            attendees: 0,
            revenue: 0,
            rating: 0
        };
        delete newEvent._id;
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });
            const data = await response.json();
            if (data.success) {
                await loadEvents();
                alert('Event duplicated successfully!');
            } else {
                alert('Failed to duplicate event: ' + data.message);
            }
        } catch (error) {
            alert('Error duplicating event.');
        }
    }
}

// Pause Event
async function pauseEvent(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'draft' })
        });
        const data = await response.json();
        if (data.success) {
            await loadEvents();
            alert('Event paused successfully!');
        } else {
            alert('Failed to pause event: ' + data.message);
        }
    } catch (error) {
        alert('Error pausing event.');
    }
}

// Publish Event
async function publishEvent(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
        });
        const data = await response.json();
        if (data.success) {
            await loadEvents();
            alert('Event published successfully!');
        } else {
            alert('Failed to publish event: ' + data.message);
        }
    } catch (error) {
        alert('Error publishing event.');
    }
}

// Analytics, Attendees, etc.
function viewAnalytics(eventId) {
    switchTab('analytics');
    alert(`Viewing analytics for event ID: ${eventId}`);
}

function manageAttendees(eventId) {
    alert(`Managing attendees for event ID: ${eventId}`);
}

// Modal functionality
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal(this.id);
        }
    });
});

// Tab switching functionality
function switchTab(tabName, event) {
    //remove active states from all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    //set new active states
    document.getElementById(tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
}
}
// File upload handling (unchanged)
document.getElementById('eventImages').addEventListener('change', function (e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {

            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const img = document.createElement('div');
            img.className = 'preview-image';
            img.textContent = '🖼️';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => previewItem.remove();
            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            preview.appendChild(previewItem);
        }
    });
});

// Drag and drop functionality
const fileUpload = document.querySelector('.file-upload');
fileUpload.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.classList.add('dragover');
});
fileUpload.addEventListener('dragleave', function (e) {
    e.preventDefault();
    this.classList.remove('dragover');
});
fileUpload.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('dragover');
    const files = e.dataTransfer.files;
    document.getElementById('eventImages').files = files;
    document.getElementById('eventImages').dispatchEvent(new Event('change'));
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openModal('createEventModal');
    }
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    loadEvents();
});