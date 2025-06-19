let currentEvents = [];
let currentView = 'grid';
let ticketQuantity = 1;
let currentEventId = null;
let userInteractions = {
    interested: [],
    going: [],
    saved: []
};

document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    setupEventListeners();
    console.log('EventHub Events page loaded successfully!');
});

// Fetch events from backend API
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (data.success) {
            currentEvents = data.events;
            displayEvents(currentEvents);
            updateResultsCount();
        } else {
            displayEvents([]);
            updateResultsCount();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        displayEvents([]);
        updateResultsCount();
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('category').addEventListener('change', performSearch);
    document.getElementById('location').addEventListener('change', performSearch);
    document.getElementById('date').addEventListener('change', performSearch);
    document.getElementById('price').addEventListener('change', performSearch);
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) closeAllModals();
    });
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

    let filteredEvents = currentEvents.filter(event => {
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

    displayEvents(filteredEvents);
    updateResultsCount(filteredEvents.length);
}

// Filter by price range
function filterByPrice(eventPrice, priceRange) {
    if (priceRange === 'free') {
        return eventPrice.toLowerCase().includes('free');
    }
    const price = parseInt(eventPrice.replace(/[^\d]/g, '')) || 0;
    switch(priceRange) {
        case '0-1000': return price >= 0 && price <= 1000;
        case '1000-5000': return price > 1000 && price <= 5000;
        case '5000+': return price > 5000;
        default: return true;
    }
}

// Display events
function displayEvents(events) {
    const eventGrid = document.getElementById('eventGrid');
    if (!eventGrid) return;
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
        <div class="event-card ${currentView === 'list' ? 'list-view' : ''}" onclick="openEventModal('${event._id || event.id}')">
            <div class="event-image">
                <span>${event.icon || ''}</span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-details">
                    <p>📅 ${formatDate(event.date)} • ${event.time}</p>
                    <p>📍 ${event.venue}, ${event.location}</p>
                </div>
                <div class="event-price">${event.price}</div>
                <div class="event-actions-preview">
                    <span class="quick-action" onclick="event.stopPropagation(); quickInterest('${event._id || event.id}')">
                        ${userInteractions.interested.includes(event._id || event.id) ? '❤️' : '🤍'} Interested
                    </span>
                    <span class="quick-action" onclick="event.stopPropagation(); quickSave('${event._id || event.id}')">
                        ${userInteractions.saved.includes(event._id || event.id) ? '🔖' : '📝'} Save
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
function updateResultsCount(count) {
    if (typeof count === 'undefined') count = currentEvents.length;
    document.getElementById('resultsCount').textContent = `${count} event${count !== 1 ? 's' : ''} found`;
}

// View toggle functions
function toggleView(view) {
    currentView = view;
    const eventGrid = document.getElementById('eventGrid');
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');
    if (view === 'list') {
        eventGrid.classList.add('list-view');
    } else {
        eventGrid.classList.remove('list-view');
    }
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
                <div style="margin: 10px; padding: 10px; background: white; border-radius: 8px; display: inline-block; cursor: pointer;" onclick="openEventModal('${event._id || event.id}')">
                    ${event.icon || ''} ${event.title}<br>
                    <small>${event.venue}, ${event.location}</small>
                </div>
            `).join('')}
        </div>
    `;
}

// Event modal functions
function openEventModal(eventId) {
    const event = currentEvents.find(e => (e._id || e.id) == eventId);
    if (!event) return;

    currentEventId = eventId;
    ticketQuantity = 1;

    document.getElementById('modalEventTitle').textContent = event.title;
    document.getElementById('modalEventIcon').textContent = event.icon || '';
    document.getElementById('modalEventDate').textContent = `${formatDate(event.date)} at ${event.time}`;
    document.getElementById('modalEventLocation').textContent = event.location;
    document.getElementById('modalEventVenue').textContent = event.venue;
    document.getElementById('modalEventPrice').textContent = event.price;
    document.getElementById('modalEventOrganizer').textContent = event.organizer;
    document.getElementById('modalEventDescription').textContent = event.description;

    const safetyStars = '⭐'.repeat(event.safetyRating || 0);
    document.getElementById('safetyRating').textContent = safetyStars;

    const ticketPrice = event.tickets && event.tickets.general ? event.tickets.general.price : 0;
    document.getElementById('ticketPrice').textContent = ticketPrice === 0 ? 'Free' : `KSH ${ticketPrice.toLocaleString()}`;
    document.getElementById('ticketQuantity').textContent = ticketQuantity;
    updateTotalPrice();

    document.getElementById('organizerName').textContent = event.organizer;
    document.getElementById('organizerBio').textContent = `Organizing events since 2020`;
    document.getElementById('groupMembers').textContent = `${event.attendees || 0} members`;

    updateActionButtonStates(eventId);

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
    const event = currentEvents.find(e => (e._id || e.id) == currentEventId);
    const ticketPrice = event.tickets && event.tickets.general ? event.tickets.general.price : 0;
    const total = ticketPrice * ticketQuantity;
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
    displayEvents(currentEvents);
}

function shareEvent() {
    if (!currentEventId) return;
    const event = currentEvents.find(e => (e._id || e.id) == currentEventId);
    const shareText = `Check out this event: ${event.title} on ${formatDate(event.date)} at ${event.venue}!`;
    if (navigator.share) {
        navigator.share({
            title: event.title,
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Event details copied to clipboard!');
        });
    }
}

function updateActionButtonStates(eventId) {
    const interestBtn = document.getElementById('interestBtn');
    const goingBtn = document.getElementById('goingBtn');
    const saveBtn = document.getElementById('saveBtn');
    if (userInteractions.interested.includes(eventId)) {
        interestBtn.textContent = '❤️ Interested';
        interestBtn.classList.add('active');
    } else {
        interestBtn.textContent = '🤍 Interested';
        interestBtn.classList.remove('active');
    }
    if (userInteractions.going.includes(eventId)) {
        goingBtn.textContent = '✅ Going';
        goingBtn.classList.add('active');
    } else {
        goingBtn.textContent = '⭕ Going';
        goingBtn.classList.remove('active');
    }
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
    const event = currentEvents.find(e => (e._id || e.id) == currentEventId);
    document.getElementById('purchaseEventTitle').textContent = event.title;
    document.getElementById('purchaseQuantity').textContent = `${ticketQuantity}x`;
    const ticketPrice = event.tickets && event.tickets.general ? event.tickets.general.price : 0;
    const total = ticketPrice * ticketQuantity;
    document.getElementById('purchaseTotal').textContent = total === 0 ? 'Free' : `KSH ${total.toLocaleString()}`;
    document.getElementById('purchaseModal').classList.add('active');
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.remove('active');
}

function togglePaymentForm(paymentMethod) {
    const mpesaForm = document.getElementById('mpesaForm');
    if (mpesaForm) {
        mpesaForm.style.display = paymentMethod === 'mpesa' ? 'block' : 'none';
    }
}

function processPayment(button) {
    const event = currentEvents.find(e => (e._id || e.id) == currentEventId);
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const loadingText = 'Processing payment...';
    const originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        closePurchaseModal();
        closeEventModal();
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
    const event = currentEvents.find(e => (e._id || e.id) == currentEventId);
    alert(`Joined the group chat for ${event.title}! You'll receive a notification with the chat link.`);
}

function showAllReviews() {
    alert('Reviews feature coming soon! This would show all event reviews and ratings.');
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('EventHub Events page loaded successfully!');
});