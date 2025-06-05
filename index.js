// Sample event data
const sampleEvents = [
    {
        id: 1,
        title: "Afrobeats Night",
        date: "2024-06-15",
        location: "Nairobi",
        category: "music",
        price: "KSH 2,500",
        icon: "🎵"
    },
    {
        id: 2,
        title: "Tech Startup Summit",
        date: "2024-06-20",
        location: "Nairobi",
        category: "tech",
        price: "Free",
        icon: "💻"
    },
    {
        id: 3,
        title: "Art Gallery Opening",
        date: "2024-06-18",
        location: "Mombasa",
        category: "arts",
        price: "KSH 1,000",
        icon: "🎨"
    },
    {
        id: 4,
        title: "Football Match: Gor vs AFC",
        date: "2024-06-22",
        location: "Nairobi",
        category: "sports",
        price: "KSH 500",
        icon: "⚽"
    },
    {
        id: 5,
        title: "Food Festival",
        date: "2024-06-25",
        location: "Nakuru",
        category: "food",
        price: "KSH 1,500",
        icon: "🍽️"
    },
    {
        id: 6,
        title: "Jazz Evening",
        date: "2024-06-28",
        location: "Kisumu",
        category: "music",
        price: "KSH 3,000",
        icon: "🎷"
    }
];

let currentEvents = sampleEvents;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    displayEvents(currentEvents);
    document.getElementById('resultsSection').classList.add('active');
});

// Search functionality
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const price = document.getElementById('price').value;

    let filteredEvents = sampleEvents.filter(event => {
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
    
    switch(priceRange) {
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
        <div class="event-card" onclick="viewEventDetails(${event.id})">
            <div class="event-image">
                <span>${event.icon}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-details">📅 ${formatDate(event.date)}</p>
                <p class="event-details">📍 ${event.location}</p>
                <p class="event-price">${event.price}</p>
            </div>
        </div>
    `).join('');
}

// Search by category
function searchCategory(category) {
    document.getElementById('category').value = category;
    performSearch();
}

// Toggle map view
function toggleMap() {
    const mapView = document.getElementById('mapView');
    mapView.classList.toggle('active');
}

// View event details
function viewEventDetails(eventId) {
    const event = sampleEvents.find(e => e.id === eventId);
    if (event) {
        alert(`Event Details:\n\nTitle: ${event.title}\nDate: ${formatDate(event.date)}\nLocation: ${event.location}\nPrice: ${event.price}\n\nFor full details and booking, please sign up or log in.`);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add enter key support for search
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Add filter change handlers
document.getElementById('category').addEventListener('change', performSearch);
document.getElementById('location').addEventListener('change', performSearch);
document.getElementById('date').addEventListener('change', performSearch);
document.getElementById('price').addEventListener('change', performSearch);