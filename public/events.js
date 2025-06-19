// Sample event data with detailed information
const sampleEvents = [
    {
        id: 1,
        title: "Afrobeats Night",
        date: "2024-06-15",
        time: "8:00 PM",
        location: "Nairobi",
        venue: "Carnivore Grounds",
        category: "music",
        price: "KSH 2,500",
        icon: "🎵",
        organizer: "Beat Masters Events",
        description: "Join us for an electrifying night of Afrobeats music featuring top artists from across East Africa. Dance the night away to the hottest beats and enjoy authentic African cuisine.",
        tickets: {
            general: { price: 2500, available: 150 },
            vip: { price: 5000, available: 50 }
        },
        safetyRating: 5,
        attendees: 245,
        interested: 120
    },
    {
        id: 2,
        title: "Tech Startup Summit",
        date: "2024-06-20",
        time: "9:00 AM",
        location: "Nairobi",
        venue: "KICC",
        category: "tech",
        price: "Free",
        icon: "💻",
        organizer: "Kenya Tech Hub",
        description: "Connect with entrepreneurs, investors, and tech enthusiasts in this comprehensive summit focusing on startup growth, funding opportunities, and innovation in Kenya's tech ecosystem.",
        tickets: {
            general: { price: 0, available: 500 }
        },
        safetyRating: 5,
        attendees: 450,
        interested: 200
    },
    {
        id: 3,
        title: "Art Gallery Opening",
        date: "2024-06-18",
        time: "6:00 PM",
        location: "Mombasa",
        venue: "Mombasa Art Center",
        category: "arts",
        price: "KSH 1,000",
        icon: "🎨",
        organizer: "Coastal Arts Society",
        description: "Experience contemporary East African art in this exclusive gallery opening. Meet the artists, enjoy wine and canapés, and discover unique pieces from emerging and established artists.",
        tickets: {
            general: { price: 1000, available: 80 }
        },
        safetyRating: 4,
        attendees: 65,
        interested: 40
    },
    {
        id: 4,
        title: "Football Match: Gor vs AFC",
        date: "2024-06-22",
        time: "3:00 PM",
        location: "Nairobi",
        venue: "Kasarani Stadium",
        category: "sports",
        price: "KSH 500",
        icon: "⚽",
        organizer: "Kenya Premier League",
        description: "Watch the thrilling match between Gor Mahia and AFC Leopards in this highly anticipated derby. Experience the passion and excitement of Kenyan football at its finest.",
        tickets: {
            general: { price: 500, available: 2000 },
            vip: { price: 1500, available: 100 }
        },
        safetyRating: 4,
        attendees: 1800,
        interested: 500
    },
    {
        id: 5,
        title: "Food Festival",
        date: "2024-06-25",
        time: "11:00 AM",
        location: "Nakuru",
        venue: "Nakuru Sports Club",
        category: "food",
        price: "KSH 1,500",
        icon: "🍽️",
        organizer: "Rift Valley Foodies",
        description: "Celebrate the diverse flavors of Kenya in this culinary extravaganza. Sample dishes from various regions, meet renowned chefs, and participate in cooking demonstrations.",
        tickets: {
            general: { price: 1500, available: 300 }
        },
        safetyRating: 5,
        attendees: 250,
        interested: 180
    },
    {
        id: 6,
        title: "Jazz Evening",
        date: "2024-06-28",
        time: "7:30 PM",
        location: "Kisumu",
        venue: "Kisumu Yacht Club",
        category: "music",
        price: "KSH 3,000",
        icon: "🎷",
        organizer: "Lake Basin Jazz Society",
        description: "Enjoy smooth jazz by the lakeside with local and international artists. This intimate venue provides the perfect setting for an evening of sophisticated music and fine dining.",
        tickets: {
            general: { price: 3000, available: 120 }
        },
        safetyRating: 5,
        attendees: 90,
        interested: 60
    }
];

// Global variables
let currentEvents = sampleEvents;
let currentView = 'grid';
let ticketQuantity = 1;
let currentEventId = null;
let userInteractions = {
    interested: [],
    going: [],
    saved: []
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    displayEvents(currentEvents);
    updateResultsCount();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input enter key
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Filter change handlers
    document.getElementById('category').addEventListener('change', performSearch);
    document.getElementById('location').addEventListener('change', performSearch);
    document.getElementById('date').addEventListener('change', performSearch);
    document.getElementById('price').addEventListener('change', performSearch);

    // Modal close handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Payment method change
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            togglePaymentForm(this.value);
        });
    });
}

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
            event.category.toLowerCase().includes(searchTerm) ||
            event.venue.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || event.category === category;
        const matchesLocation = !location || event.location.toLowerCase() === location;
        const matchesDate = !date || event.date === date;
        const matchesPrice = !price || filterByPrice(event.price, price);

        return matchesSearch && matchesCategory && matchesLocation && matchesDate && matchesPrice;
    });

    currentEvents = filteredEvents;
    displayEvents(filteredEvents);
    updateResultsCount();
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
        eventGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <h3>No events found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    eventGrid.innerHTML = events.map(event => `
        <div class="event-card ${currentView === 'list' ? 'list-view' : ''}" onclick="openEventModal(${event.id})">
            <div class="event-image">
                <span>${event.icon}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-details">
                    <p>📅 ${formatDate(event.date)} • ${event.time}</p>
                    <p>📍 ${event.venue}, ${event.location}</p>
                </div>
                <div class="event-price">${event.price}</div>
                <div class="event-actions-preview">
                    <span class="quick-action" onclick="event.stopPropagation(); quickInterest(${event.id})">
                        ${userInteractions.interested.includes(event.id) ? '❤️' : '🤍'} Interested
                    </span>
                    <span class="quick-action" onclick="event.stopPropagation(); quickSave(${event.id})">
                        ${userInteractions.saved.includes(event.id) ? '🔖' : '📝'} Save
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Update results count
function updateResultsCount() {
    const count = currentEvents.length;
    document.getElementById('resultsCount').textContent = `${count} event${count !== 1 ? 's' : ''} found`;
}

// View toggle functions
function toggleView(view) {
    currentView = view;
    const eventGrid = document.getElementById('eventGrid');
    
    // Update button states
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');
    
    // Update grid class
    if (view === 'list') {
        eventGrid.classList.add('list-view');
    } else {
        eventGrid.classList.remove('list-view');
    }
    
    // Re-render events with new view
    displayEvents(currentEvents);
}

function toggleMap() {
    const mapSection = document.getElementById('mapSection');
    const mapToggle = document.getElementById('mapToggle');
    
    if (mapSection.classList.contains('active')) {
        mapSection.classList.remove('active');
        mapToggle.classList.remove('active');
    } else {
        mapSection.classList.add('active');
        mapToggle.classList.add('active');
        populateMapMarkers();
    }
}

function populateMapMarkers() {
    const mapMarkers = document.getElementById('mapMarkers');
    mapMarkers.innerHTML = `
        <div style="text-align: center;">
            <h4>Event Locations</h4>
            ${currentEvents.map(event => `
                <div style="margin: 10px; padding: 10px; background: white; border-radius: 8px; display: inline-block; cursor: pointer;" onclick="openEventModal(${event.id})">
                    ${event.icon} ${event.title}<br>
                    <small>${event.venue}, ${event.location}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// Event modal functions
function openEventModal(eventId) {
    const event = sampleEvents.find(e => e.id === eventId);
    if (!event) return;
    
    currentEventId = eventId;
    ticketQuantity = 1;
    
    // Populate modal content
    document.getElementById('modalEventTitle').textContent = event.title;
    document.getElementById('modalEventIcon').textContent = event.icon;
    document.getElementById('modalEventDate').textContent = `${formatDate(event.date)} at ${event.time}`;
    document.getElementById('modalEventLocation').textContent = event.location;
    document.getElementById('modalEventVenue').textContent = event.venue;
    document.getElementById('modalEventPrice').textContent = event.price;
    document.getElementById('modalEventOrganizer').textContent = event.organizer;
    document.getElementById('modalEventDescription').textContent = event.description;
    
    // Update safety rating
    const safetyStars = '⭐'.repeat(event.safetyRating);
    document.getElementById('safetyRating').textContent = safetyStars;
    
    // Update ticket price and total
    const ticketPrice = event.tickets.general.price;
    document.getElementById('ticketPrice').textContent = ticketPrice === 0 ? 'Free' : `KSH ${ticketPrice.toLocaleString()}`;
    document.getElementById('ticketQuantity').textContent = ticketQuantity;
    updateTotalPrice();
    
    // Update organizer info
    document.getElementById('organizerName').textContent = event.organizer;
    document.getElementById('organizerBio').textContent = `Organizing events since 2020`;
    
    // Update group members
    document.getElementById('groupMembers').textContent = `${event.attendees} members`;
    
    // Update action button states
    updateActionButtonStates(eventId);
    
    // Show modal
    document.getElementById('eventModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentEventId = null;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Ticket quantity functions
function changeQuantity(change) {
    const newQuantity = ticketQuantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
        ticketQuantity = newQuantity;
        document.getElementById('ticketQuantity').textContent = ticketQuantity;
        updateTotalPrice();
    }
}

function updateTotalPrice() {
    if (!currentEventId) return;
    
    const event = sampleEvents.find(e => e.id === currentEventId);
    const total = event.tickets.general.price * ticketQuantity;
    document.getElementById('totalPrice').textContent = total === 0 ? 'Free' : `KSH ${total.toLocaleString()}`;
}

// User interaction functions
function toggleInterest() {
    if (!currentEventId) return;
    
    const index = userInteractions.interested.indexOf(currentEventId);
    const btn = document.getElementById('interestBtn');
    
    if (index > -1) {
        userInteractions.interested.splice(index, 1);
        btn.textContent = '🤍 Interested';
        btn.classList.remove('active');
    } else {
        userInteractions.interested.push(currentEventId);
        btn.textContent = '❤️ Interested';
        btn.classList.add('active');
    }
    
    // Update the main grid display
    displayEvents(currentEvents);
}

function toggleGoing() {
    if (!currentEventId) return;
    
    const index = userInteractions.going.indexOf(currentEventId);
    const btn = document.getElementById('goingBtn');
    
    if (index > -1) {
        userInteractions.going.splice(index, 1);
        btn.textContent = '⭕ Going';
        btn.classList.remove('active');
    } else {
        userInteractions.going.push(currentEventId);
        btn.textContent = '✅ Going';
        btn.classList.add('active');
    }
}

function saveEvent() {
    if (!currentEventId) return;
    
    const index = userInteractions.saved.indexOf(currentEventId);
    const btn = document.getElementById('saveBtn');
    
    if (index > -1) {
        userInteractions.saved.splice(index, 1);
        btn.textContent = '📝 Save';
        btn.classList.remove('active');
    } else {
        userInteractions.saved.push(currentEventId);
        btn.textContent = '🔖 Saved';
        btn.classList.add('active');
    }
    
    // Update the main grid display
    displayEvents(currentEvents);
}

function shareEvent() {
    if (!currentEventId) return;
    
    const event = sampleEvents.find(e => e.id === currentEventId);
    const shareText = `Check out this event: ${event.title} on ${formatDate(event.date)} at ${event.venue}!`;
    
    if (navigator.share) {
        navigator.share({
            title: event.title,
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Event details copied to clipboard!');
        });
    }
}

function updateActionButtonStates(eventId) {
    const interestBtn = document.getElementById('interestBtn');
    const goingBtn = document.getElementById('goingBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Interest button
    if (userInteractions.interested.includes(eventId)) {
        interestBtn.textContent = '❤️ Interested';
        interestBtn.classList.add('active');
    } else {
        interestBtn.textContent = '🤍 Interested';
        interestBtn.classList.remove('active');
    }
    
    // Going button
    if (userInteractions.going.includes(eventId)) {
        goingBtn.textContent = '✅ Going';
        goingBtn.classList.add('active');
    } else {
        goingBtn.textContent = '⭕ Going';
        goingBtn.classList.remove('active');
    }
    
    // Save button
    if (userInteractions.saved.includes(eventId)) {
        saveBtn.textContent = '🔖 Saved';
        saveBtn.classList.add('active');
    } else {
        saveBtn.textContent = '📝 Save';
        saveBtn.classList.remove('active');
    }
}

// Quick action functions (for event cards)
function quickInterest(eventId) {
    const index = userInteractions.interested.indexOf(eventId);
    
    if (index > -1) {
        userInteractions.interested.splice(index, 1);
    } else {
        userInteractions.interested.push(eventId);
    }
    
    displayEvents(currentEvents);
}

function quickSave(eventId) {
    const index = userInteractions.saved.indexOf(eventId);
    
    if (index > -1) {
        userInteractions.saved.splice(index, 1);
    } else {
        userInteractions.saved.push(eventId);
    }
    
    displayEvents(currentEvents);
}

// Purchase functions
function purchaseTicket() {
    if (!currentEventId) return;
    
    const event = sampleEvents.find(e => e.id === currentEventId);
    
    // Populate purchase modal
    document.getElementById('purchaseEventTitle').textContent = event.title;
    document.getElementById('purchaseQuantity').textContent = `${ticketQuantity}x`;
    
    const total = event.tickets.general.price * ticketQuantity;
    document.getElementById('purchaseTotal').textContent = total === 0 ? 'Free' : `KSH ${total.toLocaleString()}`;
    
    // Show purchase modal
    document.getElementById('purchaseModal').classList.add('active');
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
}

function togglePaymentForm(paymentMethod) {
    const mpesaForm = document.getElementById('mpesaForm');
    
    if (paymentMethod === 'mpesa') {
        mpesaForm.style.display = 'block';
    } else {
        mpesaForm.style.display = 'none';
    }
}

function processPayment() {
    const event = sampleEvents.find(e => e.id === currentEventId);
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // Simulate payment processing
    const loadingText = 'Processing payment...';
    const button = event.target || document.querySelector('.btn-primary');
    const originalText = button.textContent;
    
    button.textContent = loadingText;
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        
        // Close modals and show success
        closePurchaseModal();
        closeEventModal();
        
        // Add to going list
        if (!userInteractions.going.includes(currentEventId)) {
            userInteractions.going.push(currentEventId);
        }
        
        alert(`🎉 Payment successful! You're going to ${event.title}. Check your email for tickets.`);
        displayEvents(currentEvents);
    }, 2000);
}

// Group and organizer functions
function joinGroup() {
    if (!currentEventId) return;
    
    const event = sampleEvents.find(e => e.id === currentEventId);
    alert(`Joined the group chat for ${event.title}! You'll receive a notification with the chat link.`);
}

function showAllReviews() {
    alert('Reviews feature coming soon! This would show all event reviews and ratings.');
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('EventHub Events page loaded successfully!');
});