// Global variable to store events
let currentEvents = [];

// Load events from backend API
async function loadEvents() {
    try {
        showLoader(); // Show loading indicator
        
        const response = await fetch('/api/events');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success && data.events) {
            currentEvents = data.events.map(event => ({
                id: event._id,
                title: event.title || 'Untitled Event',
                date: event.date ? formatDate(event.date) : 'TBD',
                time: event.time || '',
                location: event.location || 'Location not specified',
                venue: event.venue || '',
                category: event.category || 'general',
                price: event.price ? `KSH ${event.price.toLocaleString()}` : 'Free',
                description: event.description || '',
                image: event.image || getDefaultEventImage(event.category),
                organizer: event.organizer || {},
                status: event.status || 'active'
            }));
            
            displayEvents(currentEvents);
        } else {
            showError('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Error loading events. Please try again later.');
    } finally {
        hideLoader(); // Hide loading indicator
    }
}

// Display events in the grid
function displayEvents(events) {
    const eventGrid = document.getElementById('eventGrid');
    
    if (!events || events.length === 0) {
        eventGrid.innerHTML = `
            <div class="no-events">
                <p>No events found</p>
                ${currentUser?.role === 'organizer' ? 
                    '<button class="btn" onclick="showCreateEventModal()">Create Your First Event</button>' : 
                    '<p>Check back later for upcoming events</p>'}
            </div>
        `;
        return;
    }

    eventGrid.innerHTML = events.map(event => `
        <div class="event-card" onclick="viewEventDetails('${event.id}')">
            <div class="event-image">
                ${event.image ? 
                    `<img src="${event.image}" alt="${event.title}">` : 
                    `<div class="event-icon">${getCategoryIcon(event.category)}</div>`}
                ${event.status !== 'active' ? 
                    `<div class="event-status ${event.status}">${event.status.toUpperCase()}</div>` : ''}
            </div>
            <div class="event-content">
                <h3 class="event-title">${escapeHtml(event.title)}</h3>
                <div class="event-details">
                    <p>📍 ${escapeHtml(event.venue || event.location)}</p>
                    <p>📅 ${event.date} ${event.time ? `at ${event.time}` : ''}</p>
                    <p>🏷️ ${escapeHtml(event.category)}</p>
                    <p>💰 ${event.price}</p>
                </div>
                <div class="event-actions">
                    <button class="btn btn-sm" onclick="event.stopPropagation(); viewEventDetails('${event.id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper function to get category icon
function getCategoryIcon(category) {
    const icons = {
        music: '🎵',
        sports: '⚽',
        arts: '🎨',
        food: '🍔',
        tech: '💻',
        business: '💼',
        education: '📚',
        default: '🎉'
    };
    return icons[category?.toLowerCase()] || icons.default;
}

// Helper function to get default event image based on category
function getDefaultEventImage(category) {
    // In a real app, you might have default images for each category
    return `/images/default-${category || 'event'}.jpg`;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date for display
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString || 'Date not specified';
    }
}

// View event details - redirect to event page
function viewEventDetails(eventId) {
    window.location.href = `event-details.html?id=${eventId}`;
}

// Search and filter events
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;
    const dateRange = document.getElementById('dateFilter').value;
    
    let filteredEvents = currentEvents.filter(event => {
        // Text search
        const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.venue.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !category || event.category === category;
        
        // Location filter
        const matchesLocation = !location || 
            event.location.toLowerCase().includes(location.toLowerCase()) ||
            event.venue.toLowerCase().includes(location.toLowerCase());
        
        // Date filter
        const matchesDate = filterByDate(event.date, dateRange);
        
        return matchesSearch && matchesCategory && matchesLocation && matchesDate;
    });
    
    displayEvents(filteredEvents);
}

// Filter events by date range
function filterByDate(eventDate, range) {
    if (!range) return true;
    
    try {
        const date = new Date(eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch(range) {
            case 'today':
                return date.toDateString() === today.toDateString();
            case 'week':
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return date >= today && date <= nextWeek;
            case 'month':
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return date >= today && date <= nextMonth;
            case 'upcoming':
                return date >= today;
            default:
                return true;
        }
    } catch {
        return true;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    
    // Set up event listeners
    document.getElementById('searchInput').addEventListener('input', performSearch);
    document.getElementById('categoryFilter').addEventListener('change', performSearch);
    document.getElementById('locationFilter').addEventListener('change', performSearch);
    document.getElementById('dateFilter').addEventListener('change', performSearch);
    
    // Quick filter buttons
    document.querySelectorAll('.quick-filter').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            document.getElementById('categoryFilter').value = category;
            performSearch();
        });
    });
});

// UI Helper functions
function showLoader() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
}