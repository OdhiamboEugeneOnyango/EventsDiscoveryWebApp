// Sample event data
let currentEvents = [];

// Load events from backend
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const data = await response.json();

        if (data.success) {
            // Backend returns events with .name (from title)
            // We'll rename 'name' back to 'title' and fill in mock values for UI display
            currentEvents = data.events.map(event => ({
                id: event._id,
                title: event.name || 'Untitled Event',
                date: 'TBD', // Placeholder — can be replaced if you return real dates
                location: 'Nairobi', // Placeholder
                category: 'music', // Placeholder
                price: 'KSH 0', // Placeholder
                icon: '🎉' // Default emoji
            }));
            displayEvents(currentEvents);
        } else {
            console.error('Failed to fetch events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    document.getElementById('resultsSection').classList.add('active');
});

// Search functionality
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const price = document.getElementById('price').value;

    let filteredEvents = currentEvents.filter(event => {
        const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || event.category === category;
        const matchesLocation = !location || event.location.toLowerCase() === location;
        const matchesDate = !date || event.date === date;
        const matchesPrice = !price || filterByPrice(event.price, price);

        return matchesSearch && matchesCategory && matchesLocation && matchesDate && matchesPrice;
    });

    currentEvents = filteredEvents;
    displayEvents(filteredEvents);
    document.getElementById('resultsSection').classList.add('active');

    // Smooth scroll to results
    document.getElementById('resultsSection').scrollIntoView({
        behavior: 'smooth'
    });
}

// Filter by price range
function filterByPrice(eventPrice, priceRange) {
    if (priceRange === 'free') {
        return eventPrice.toLowerCase().includes('free');
    }

    const price = parseInt(eventPrice.replace(/[^\d]/g, '')) || 0;

    switch (priceRange) {
        case '0-1000':
            return price >= 0 && price <= 1000;
        case '1000-5000':
            return price > 1000 && price <= 5000;
        case '5000+':
            return price > 5000;
        default:
            return true;
    }
}

// Display events
function displayEvents(events) {
    const eventGrid = document.getElementById('eventGrid');

    if (events.length === 0) {
        eventGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No events found matching your criteria.</p>';
        return;
    }

    eventGrid.innerHTML = events.map(event => `
        <div class="event-card" onclick="viewEventDetails('${event.id}')">
            <div class="event-image">
                <span>${event.icon}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-details">📅 ${event.date}</p>
                <p class="event-details">📍 ${event.location}</p>
                <p class="event-price">${event.price}</p>
            </div>
        </div>
    `).join('');
}

// View details
function viewEventDetails(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (event) {
        alert(`Event Details:\n\nTitle: ${event.title}\nDate: ${event.date}\nLocation: ${event.location}\nPrice: ${event.price}`);
    }
}

// Category quick filter
function searchCategory(category) {
    document.getElementById('category').value = category;
    performSearch();
}

// Map toggle
function toggleMap() {
    const mapView = document.getElementById('mapView');
    mapView.classList.toggle('active');
}

// Format date (you can improve this later if needed)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Enter key search
document.getElementById('searchInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Auto-filter on dropdown change
['category', 'location', 'date', 'price'].forEach(id => {
    document.getElementById(id).addEventListener('change', performSearch);
});
