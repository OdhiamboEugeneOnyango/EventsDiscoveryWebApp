// safezone.js - Updated with API integration
// Global variables
let events = [];
let venues = [];
let incidents = [];
let lostFoundItems = [];

// API helper function
async function apiCall(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Data fetching functions
async function fetchEvents() {
    try {
        const result = await apiCall('/api/events');
        events = result.events || [];
        populateEventDropdowns();
    } catch (error) {
        console.error('Failed to fetch events:', error);
        showError('Failed to load events');
    }
}

async function fetchVenues() {
    try {
        const result = await apiCall('/api/venues');
        venues = result.venues || [];
        displayVenues();
    } catch (error) {
        console.error('Failed to fetch venues:', error);
        showError('Failed to load venues');
    }
}

async function fetchIncidents() {
    try {
        const result = await apiCall('/api/incidents');
        incidents = result.incidents || [];
        displayIncidents();
    } catch (error) {
        console.error('Failed to fetch incidents:', error);
        showError('Failed to load incidents');
    }
}

async function fetchLostFound() {
    try {
        const result = await apiCall('/api/lostfound');
        lostFoundItems = result.items || [];
        displayLostFound();
    } catch (error) {
        console.error('Failed to fetch lost & found items:', error);
        showError('Failed to load lost & found items');
    }
}

// Populate event dropdowns
function populateEventDropdowns() {
    const eventSelects = [
        document.getElementById('venueEvent'),
        document.getElementById('incidentEvent'),
        document.getElementById('lostFoundEvent')
    ];
    
    eventSelects.forEach(select => {
        if (select) {
            // Clear existing options except the first one
            select.innerHTML = '<option value="">Select Event</option>';
            
            // Add event options
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event._id;
                option.textContent = event.name;
                select.appendChild(option);
            });
        }
    });
}

// Display functions
function displayVenues() {
    const grid = document.getElementById('venueGrid');
    
    if (venues.length === 0) {
        grid.innerHTML = '<div class="no-data">No venue ratings yet. Be the first to rate a venue!</div>';
        return;
    }
    
    grid.innerHTML = venues.map(venue => {
        const eventName = events.find(e => e._id === venue.eventId)?.name || 'Unknown Event';
        return `
            <div class="venue-card">
                <div class="venue-name">${escapeHtml(venue.name)}</div>
                <div class="venue-event">${escapeHtml(eventName)}</div>
                <div class="safety-rating">
                    <div class="stars">
                        ${'⭐'.repeat(venue.rating)}${'☆'.repeat(5-venue.rating)}
                    </div>
                    <span class="rating-text">${venue.rating}/5</span>
                </div>
                <div class="venue-info">${escapeHtml(venue.comments)}</div>
                <div class="venue-date">${formatDate(venue.createdAt)}</div>
            </div>
        `;
    }).join('');
}

function displayIncidents() {
    const list = document.getElementById('incidentList');
    
    if (incidents.length === 0) {
        list.innerHTML = '<div class="no-data">No incidents reported yet.</div>';
        return;
    }
    
    list.innerHTML = incidents.map(incident => {
        const eventName = events.find(e => e._id === incident.eventId)?.name || 'Unknown Event';
        return `
            <div class="incident-item">
                <div class="incident-header">
                    <span class="incident-type">${incident.type.toUpperCase()}</span>
                    <span class="incident-date">${formatDate(incident.date)}</span>
                </div>
                <div><strong>Event:</strong> ${escapeHtml(eventName)}</div>
                <div><strong>Location:</strong> ${escapeHtml(incident.location)}</div>
                <div style="margin-top: 8px;">${escapeHtml(incident.description)}</div>
                <div class="incident-meta">${formatDate(incident.createdAt)}</div>
            </div>
        `;
    }).join('');
}

function displayLostFound() {
    const grid = document.getElementById('lostFoundGrid');
    
    if (lostFoundItems.length === 0) {
        grid.innerHTML = '<div class="no-data">No lost & found items yet.</div>';
        return;
    }
    
    grid.innerHTML = lostFoundItems.map(item => {
        const eventName = events.find(e => e._id === item.eventId)?.name || 'Unknown Event';
        return `
            <div class="lost-found-item">
                <div class="item-type ${item.status}">${item.status.toUpperCase()}</div>
                <div style="font-weight: bold; margin-bottom: 8px;">${escapeHtml(item.description)}</div>
                <div style="font-size: 0.9rem; color: #666;">
                    🎉 ${escapeHtml(eventName)}<br>
                    📍 ${escapeHtml(item.location)}<br>
                    📅 ${formatDate(item.date)}<br>
                    📞 ${escapeHtml(item.contact)}
                </div>
                <div class="item-meta">${formatDate(item.createdAt)}</div>
            </div>
        `;
    }).join('');
}

// Form submission handlers
async function handleVenueSubmission(formData) {
    try {
        const result = await apiCall('/api/venues', 'POST', formData);
        venues.unshift(result.venue);
        displayVenues();
        showSuccess('Venue rating submitted successfully!');
        return true;
    } catch (error) {
        showError('Failed to submit venue rating: ' + error.message);
        return false;
    }
}

async function handleIncidentSubmission(formData) {
    try {
        const result = await apiCall('/api/incidents', 'POST', formData);
        incidents.unshift(result.incident);
        displayIncidents();
        showSuccess('Incident report submitted successfully!');
        return true;
    } catch (error) {
        showError('Failed to submit incident report: ' + error.message);
        return false;
    }
}

async function handleLostFoundSubmission(formData) {
    try {
        const result = await apiCall('/api/lostfound', 'POST', formData);
        lostFoundItems.unshift(result.item);
        displayLostFound();
        showSuccess('Lost & Found listing submitted successfully!');
        return true;
    } catch (error) {
        showError('Failed to submit lost & found listing: ' + error.message);
        return false;
    }
}

// Form setup
function setupFormHandlers() {
    // Venue rating form
    const venueForm = document.getElementById('venueRatingForm');
    if (venueForm) {
        venueForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                eventId: document.getElementById('venueEvent').value,
                name: document.getElementById('venueName').value,
                rating: parseInt(document.getElementById('venueRating').value),
                comments: document.getElementById('venueComments').value
            };
            
            if (formData.eventId && formData.name && formData.rating && formData.comments) {
                const success = await handleVenueSubmission(formData);
                if (success) {
                    this.reset();
                }
            }
        });
    }
    
    // Incident form
    const incidentForm = document.getElementById('incidentForm');
    if (incidentForm) {
        incidentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                eventId: document.getElementById('incidentEvent').value,
                type: document.getElementById('incidentType').value,
                location: document.getElementById('incidentLocation').value,
                date: document.getElementById('incidentDate').value,
                description: document.getElementById('incidentDescription').value,
                reporterContact: document.getElementById('reporterContact').value
            };
            
            if (formData.eventId && formData.type && formData.location && formData.description) {
                const success = await handleIncidentSubmission(formData);
                if (success) {
                    this.reset();
                }
            }
        });
    }
    
    // Lost & Found form
    const lostFoundForm = document.getElementById('lostFoundForm');
    if (lostFoundForm) {
        lostFoundForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                eventId: document.getElementById('lostFoundEvent').value,
                status: document.getElementById('itemStatus').value,
                description: document.getElementById('itemDescription').value,
                location: document.getElementById('itemLocation').value,
                date: document.getElementById('itemDate').value,
                contact: document.getElementById('itemContact').value
            };
            
            if (formData.eventId && formData.status && formData.description && formData.location && formData.date && formData.contact) {
                const success = await handleLostFoundSubmission(formData);
                if (success) {
                    this.reset();
                }
            }
        });
    }
}

// Tab functionality
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // Re-initialize icons for the new tab
                setTimeout(() => {
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }, 100);
            }
        });
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    // Create a simple success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Lucide icons first
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Setup tab functionality
    setupTabs();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Load initial data
    await fetchEvents();
    await fetchVenues();
    await fetchIncidents();
    await fetchLostFound();
    
    // Re-initialize icons after content is loaded
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});