// Global variable to store events
let currentEvents = [];

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    // Load events and initialize UI
    loadEvents();
    setupRoleAwareUI();

    // Search/filter event listeners
    document.getElementById('searchInput')?.addEventListener('input', performSearch);
    document.getElementById('category')?.addEventListener('change', performSearch);
    document.getElementById('location')?.addEventListener('change', performSearch);
    document.getElementById('date')?.addEventListener('change', performSearch);
    document.getElementById('price')?.addEventListener('change', performSearch);

    

    if (token && currentRole) {
        // Logged in: hide auth buttons, show profile dropdown
        if (authButtons) authButtons.style.display = 'none';
        if (profileDropdown) profileDropdown.style.display = 'block';
    } else {
        // Not logged in: show auth buttons, hide dropdown
        if (authButtons) authButtons.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
    }
});


// Show/hide login/signup or profile dropdown based on auth
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

// Dropdown toggle
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Switch roles and redirect
function switchRole(role) {
    localStorage.setItem('currentRole', role);

    const redirects = {
        user: 'index.html',
        artist: 'artist.html',
        organizer: 'organizer.html',
        admin: 'admin.html'
    };

    window.location.href = redirects[role] || 'index.html';
}

// Load events from backend API
async function loadEvents() {
    try {
        showLoader();
        const response = await fetch('/api/events');

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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
        hideLoader();
    }
}

// Render events in the grid
function displayEvents(events) {
    const eventGrid = document.getElementById('eventGrid');

    if (!events || events.length === 0) {
        eventGrid.innerHTML = `
            <div class="no-events">
                <p>No events found</p>
            </div>
        `;
        return;
    }

    eventGrid.innerHTML = events.map(event => `
        <div class="event-card" onclick="viewEventDetails('${event.id}')">
            <div class="event-image">
                ${event.image ? `<img src="${event.image}" alt="${event.title}">`
                              : `<div class="event-icon">${getCategoryIcon(event.category)}</div>`}
                ${event.status !== 'active' ? `<div class="event-status ${event.status}">${event.status.toUpperCase()}</div>` : ''}
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

// Redirect to event details page
function viewEventDetails(eventId) {
    window.location.href = `event-details.html?id=${eventId}`;
}

// Return icon based on category
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

// Fallback image
function getDefaultEventImage(category) {
    return `/images/default-${category || 'event'}.jpg`;
}

// Escape potentially unsafe text
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date to readable string
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

// Search & Filter logic
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const price = document.getElementById('price').value;

    let filteredEvents = currentEvents.filter(event => {
        const matchesSearch = !searchTerm || (
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.venue.toLowerCase().includes(searchTerm)
        );

        const matchesCategory = !category || event.category === category;
        const matchesLocation = !location || event.location.toLowerCase().includes(location.toLowerCase());
        const matchesDate = !date || event.date.includes(date);
        const matchesPrice = filterByPrice(event.price, price);

        return matchesSearch && matchesCategory && matchesLocation && matchesDate && matchesPrice;
    });

    displayEvents(filteredEvents);
}

// Match price filter to event price
function filterByPrice(eventPrice, filterValue) {
    if (!filterValue) return true;
    const numeric = parseInt(eventPrice.replace(/[^\d]/g, '')) || 0;

    switch (filterValue) {
        case 'free': return numeric === 0;
        case '0-1000': return numeric <= 1000;
        case '1000-5000': return numeric > 1000 && numeric <= 5000;
        case '5000+': return numeric > 5000;
        default: return true;
    }
}

// UI loading indicator
function showLoader() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'block';
}

function hideLoader() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'none';
}

// Show error on screen
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }
}
