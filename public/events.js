// Events Frontend JavaScript
class EventsManager {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentView = 'grid';
        this.map = null;
        this.markers = [];
        this.selectedEvent = null;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.userInteractions = JSON.parse(localStorage.getItem('userInteractions')) || {
            interested: [],
            going: [],
            saved: []
        };
        
        this.init();
    }

    async init() {
        await this.loadEvents();
        this.setupEventListeners();
        this.initializeMap();
        this.updateResultsCount();
    }

    // Load events from backend
    // Load events from backend - Debug version
async loadEvents() {
    try {
        console.log('🔍 Loading events from API...');
        const response = await fetch('/api/events');
        console.log('📡 API Response Status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('📊 Raw API Data:', data);
        console.log('📋 Number of events received:', data.events ? data.events.length : 0);
        
        // Log first event to check structure
        if (data.events && data.events.length > 0) {
            console.log('🎯 First event structure:', data.events[0]);
            console.log('📝 First event keys:', Object.keys(data.events[0]));
        }
        
        // Validate and normalize the events data
        this.events = (data.events || []).map((event, index) => {
            console.log(`🎪 Processing event ${index + 1}:`, event.title || 'Untitled');
            
            return {
                id: event.id,
                title: event.title || 'Untitled Event',
                description: event.description || 'No description available',
                date: event.date || new Date().toISOString().split('T')[0],
                time: event.time || '19:00',
                location: event.location || 'Unknown Location',
                venue: event.venue || 'Unknown Venue',
                price: event.price || 0,
                icon: event.icon || '🎭',
                category: event.category || 'Other',
                organizer: event.organizer || 'Unknown Organizer',
                organizerBio: event.organizerBio || 'No bio available',
                rating: event.rating || 0,
                reviews: event.reviews || 0,
                attendees: event.attendees || 0,
                capacity: event.capacity || 100,
                coordinates: event.coordinates || { lat: -1.2921, lng: 36.8219 },
                featured: event.featured || false,
                status: event.status || 'active',
                image: event.image || '',
                safetyRating: event.safetyRating || 5
            };
        });
        
        console.log('✅ Processed events:', this.events.length);
        console.log('🎊 Final events array:', this.events);
        
        this.filteredEvents = [...this.events];
        this.displayEvents();
        this.updateResultsCount();
        
    } catch (error) {
        console.error('❌ Error loading events:', error);
        console.error('📍 Error details:', error.message);
        console.error('🔍 Stack trace:', error.stack);
        
        this.events = [];
        this.filteredEvents = [];
        this.displayEvents();
        this.updateResultsCount();
    }
}
    // Display events in the current view
    
    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }

        // Filter changes
        ['category', 'location', 'date', 'price'].forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => this.applyFilters());
            }
        });

        // Payment method selection
        const paymentMethods = document.querySelectorAll('input[name="payment"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                this.handlePaymentMethodChange(e.target.value);
            });
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeEventModal();
                this.closePurchaseModal();
            }
        });
    }

    // Initialize map
    async initializeMap() {
        try {
            // Using Leaflet.js with OpenStreetMap (free alternative to Google Maps)
            if (typeof L === 'undefined') {
                // Load Leaflet if not already loaded
                await this.loadLeaflet();
            }

            // Initialize map centered on Nairobi
            this.map = L.map('mapMarkers').setView([-1.2921, 36.8219], 12);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Add event markers
            this.updateMapMarkers();
        } catch (error) {
            console.error('Error initializing map:', error);
            // Fallback to simple text-based map
            this.initializeFallbackMap();
        }
    }

    // Load Leaflet library
    loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (typeof L !== 'undefined') {
                resolve();
                return;
            }

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Fallback map for when Leaflet fails
    initializeFallbackMap() {
        const mapContainer = document.getElementById('mapMarkers');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="fallback-map">
                    <h4>Event Locations</h4>
                    <div class="location-list" id="locationList"></div>
                </div>
            `;
            this.updateFallbackMap();
        }
    }

    // Update fallback map
    updateFallbackMap() {
        const locationList = document.getElementById('locationList');
        if (!locationList) return;

        const locations = {};
        this.filteredEvents.forEach(event => {
            if (!locations[event.location]) {
                locations[event.location] = [];
            }
            locations[event.location].push(event);
        });

        locationList.innerHTML = Object.entries(locations).map(([location, events]) => `
            <div class="location-group">
                <h5>📍 ${location}</h5>
                <div class="location-events">
                    ${events.map(event => `
                        <span class="location-event" onclick="eventsManager.showEventDetails(${event.id})">
                            ${event.icon} ${event.title}
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Update map markers
    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        this.filteredEvents.forEach(event => {
            if (event.coordinates) {
                const marker = L.marker([event.coordinates.lat, event.coordinates.lng])
                    .addTo(this.map)
                    .bindPopup(`
                        <div class="map-popup">
                            <h4>${event.title}</h4>
                            <p>${event.icon} ${event.venue}</p>
                            <p>📅 ${this.formatDate(event.date)} at ${event.time}</p>
                            <p>💰 ${event.price === 0 ? 'Free' : `KSH ${event.price.toLocaleString()}`}</p>
                            <button onclick="eventsManager.showEventDetails(${event.id})" class="btn btn-primary btn-sm">
                                View Details
                            </button>
                        </div>
                    `);
                
                this.markers.push(marker);
            }
        });
    }

    // Search functionality
    performSearch(query = '') {
        const searchInput = document.getElementById('searchInput');
        if (!query && searchInput) {
            query = searchInput.value.toLowerCase();
        }

        if (!query) {
            this.filteredEvents = [...this.events];
        } else {
            this.filteredEvents = this.events.filter(event => 
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.venue.toLowerCase().includes(query) ||
                event.organizer.toLowerCase().includes(query) ||
                event.category.toLowerCase().includes(query)
            );
        }

        this.applyFilters();
    }

    // Apply filters
    applyFilters() {
        let filtered = [...this.filteredEvents];

        // Category filter
        const category = document.getElementById('category')?.value;
        if (category) {
            filtered = filtered.filter(event => event.category === category);
        }

        // Location filter
        const location = document.getElementById('location')?.value;
        if (location) {
            filtered = filtered.filter(event => event.location.toLowerCase() === location.toLowerCase());
        }

        // Date filter
        const date = document.getElementById('date')?.value;
        if (date) {
            filtered = filtered.filter(event => event.date === date);
        }

        // Price filter
        const price = document.getElementById('price')?.value;
        if (price) {
            filtered = filtered.filter(event => {
                switch (price) {
                    case 'free':
                        return event.price === 0;
                    case '0-1000':
                        return event.price >= 0 && event.price <= 1000;
                    case '1000-5000':
                        return event.price > 1000 && event.price <= 5000;
                    case '5000+':
                        return event.price > 5000;
                    default:
                        return true;
                }
            });
        }

        this.filteredEvents = filtered;
        this.displayEvents();
        this.updateResultsCount();
        this.updateMapMarkers();
        this.updateFallbackMap();
    }

    // Display events
    displayEvents() {
        const eventGrid = document.getElementById('eventGrid');
        if (!eventGrid) return;

        if (this.filteredEvents.length === 0) {
            eventGrid.innerHTML = `
                <div class="no-events">
                    <h3>No events found</h3>
                    <p>Try adjusting your search criteria or filters.</p>
                </div>
            `;
            return;
        }

        eventGrid.className = `event-${this.currentView}`;
        eventGrid.innerHTML = this.filteredEvents.map(event => this.createEventCard(event)).join('');
    }

    // Create event card
    
createEventCard(event) {
    const isInterested = this.userInteractions.interested.includes(event.id);
    const isGoing = this.userInteractions.going.includes(event.id);
    const isSaved = this.userInteractions.saved.includes(event.id);

    // Safely handle missing description
    const description = event.description ? 
        event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 
        'No description available';

    return `
        <div class="event-card" onclick="eventsManager.showEventDetails(${event.id})">
            <div class="event-image">
                <span class="event-icon">${event.icon}</span>
                <div class="event-badges">
                    ${event.price === 0 ? '<span class="badge badge-free">Free</span>' : ''}
                    ${isInterested ? '<span class="badge badge-interested">❤️</span>' : ''}
                    ${isGoing ? '<span class="badge badge-going">✅</span>' : ''}
                    ${isSaved ? '<span class="badge badge-saved">🔖</span>' : ''}
                </div>
            </div>
            
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${description}</p>
                
                <div class="event-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span>${this.formatDate(event.date)} at ${event.time}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span>${event.venue}, ${event.location}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">💰</span>
                        <span>${event.price === 0 ? 'Free' : `KSH ${event.price.toLocaleString()}`}</span>
                    </div>
                </div>
                
                <div class="event-stats">
                    <div class="stat">
                        <span class="rating">⭐ ${event.rating}</span>
                        <span class="reviews">(${event.reviews} reviews)</span>
                    </div>
                    <div class="stat">
                        <span class="attendees">👥 ${event.attendees}/${event.capacity}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    // Show event details modal
    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.selectedEvent = event;
        
        // Populate modal content
        document.getElementById('modalEventTitle').textContent = event.title;
        document.getElementById('modalEventDate').textContent = `${this.formatDate(event.date)} at ${event.time}`;
        document.getElementById('modalEventLocation').textContent = event.location;
        document.getElementById('modalEventVenue').textContent = event.venue;
        document.getElementById('modalEventPrice').textContent = event.price === 0 ? 'Free' : `KSH ${event.price.toLocaleString()}`;
        document.getElementById('modalEventOrganizer').textContent = event.organizer;
        document.getElementById('modalEventDescription').textContent = event.description;
        document.getElementById('modalEventIcon').textContent = event.icon;
        document.getElementById('organizerName').textContent = event.organizer;
        document.getElementById('organizerBio').textContent = event.organizerBio;
        document.getElementById('ticketPrice').textContent = `KSH ${event.price.toLocaleString()}`;
        document.getElementById('totalPrice').textContent = `KSH ${event.price.toLocaleString()}`;

        // Update interaction buttons
        this.updateInteractionButtons();

        // Show modal
        document.getElementById('eventModal').style.display = 'block';
    }

    // Update interaction buttons
    updateInteractionButtons() {
        if (!this.selectedEvent) return;

        const eventId = this.selectedEvent.id;
        const interestBtn = document.getElementById('interestBtn');
        const goingBtn = document.getElementById('goingBtn');
        const saveBtn = document.getElementById('saveBtn');

        // Update interest button
        if (this.userInteractions.interested.includes(eventId)) {
            interestBtn.innerHTML = '💔 Remove Interest';
            interestBtn.classList.add('active');
        } else {
            interestBtn.innerHTML = '❤️ Interested';
            interestBtn.classList.remove('active');
        }

        // Update going button
        if (this.userInteractions.going.includes(eventId)) {
            goingBtn.innerHTML = '❌ Not Going';
            goingBtn.classList.add('active');
        } else {
            goingBtn.innerHTML = '✅ Going';
            goingBtn.classList.remove('active');
        }

        // Update save button
        if (this.userInteractions.saved.includes(eventId)) {
            saveBtn.innerHTML = '🗑️ Remove';
            saveBtn.classList.add('active');
        } else {
            saveBtn.innerHTML = '🔖 Save';
            saveBtn.classList.remove('active');
        }
    }

    // Close event modal
    closeEventModal() {
        document.getElementById('eventModal').style.display = 'none';
        this.selectedEvent = null;
    }

    // Toggle view
    toggleView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        
        // Update display
        this.displayEvents();
    }

    // Toggle map
    toggleMap() {
        const mapSection = document.getElementById('mapSection');
        const mapToggle = document.getElementById('mapToggle');
        
        if (mapSection.style.display === 'none' || !mapSection.style.display) {
            mapSection.style.display = 'block';
            mapToggle.classList.add('active');
            
            // Refresh map if it exists
            if (this.map) {
                setTimeout(() => this.map.invalidateSize(), 100);
            }
        } else {
            mapSection.style.display = 'none';
            mapToggle.classList.remove('active');
        }
    }

    // User interactions
    toggleInterest() {
        if (!this.selectedEvent) return;
        
        const eventId = this.selectedEvent.id;
        const index = this.userInteractions.interested.indexOf(eventId);
        
        if (index > -1) {
            this.userInteractions.interested.splice(index, 1);
        } else {
            this.userInteractions.interested.push(eventId);
        }
        
        this.saveUserInteractions();
        this.updateInteractionButtons();
    }

    toggleGoing() {
        if (!this.selectedEvent) return;
        
        const eventId = this.selectedEvent.id;
        const index = this.userInteractions.going.indexOf(eventId);
        
        if (index > -1) {
            this.userInteractions.going.splice(index, 1);
        } else {
            this.userInteractions.going.push(eventId);
        }
        
        this.saveUserInteractions();
        this.updateInteractionButtons();
    }

    saveEvent() {
        if (!this.selectedEvent) return;
        
        const eventId = this.selectedEvent.id;
        const index = this.userInteractions.saved.indexOf(eventId);
        
        if (index > -1) {
            this.userInteractions.saved.splice(index, 1);
        } else {
            this.userInteractions.saved.push(eventId);
        }
        
        this.saveUserInteractions();
        this.updateInteractionButtons();
    }

    saveUserInteractions() {
        localStorage.setItem('userInteractions', JSON.stringify(this.userInteractions));
    }

    shareEvent() {
        if (!this.selectedEvent) return;
        
        const shareData = {
            title: this.selectedEvent.title,
            text: this.selectedEvent.description,
            url: window.location.href + `?event=${this.selectedEvent.id}`
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            alert('Event details copied to clipboard!');
        }
    }

    // Ticket quantity management
    changeQuantity(change) {
        const quantityElement = document.getElementById('ticketQuantity');
        const currentQuantity = parseInt(quantityElement.textContent);
        const newQuantity = Math.max(1, Math.min(10, currentQuantity + change));
        
        quantityElement.textContent = newQuantity;
        
        // Update total price
        if (this.selectedEvent) {
            const totalPrice = this.selectedEvent.price * newQuantity;
            document.getElementById('totalPrice').textContent = `KSH ${totalPrice.toLocaleString()}`;
        }
    }

    // Purchase ticket
    purchaseTicket() {
        if (!this.selectedEvent) return;
        
        const quantity = parseInt(document.getElementById('ticketQuantity').textContent);
        const totalPrice = this.selectedEvent.price * quantity;
        
        // Populate purchase modal
        document.getElementById('purchaseEventTitle').textContent = this.selectedEvent.title;
        document.getElementById('purchaseQuantity').textContent = `${quantity}x`;
        document.getElementById('purchaseTotal').textContent = `KSH ${totalPrice.toLocaleString()}`;
        
        // Show purchase modal
        document.getElementById('purchaseModal').style.display = 'block';
    }

    // Close purchase modal
    closePurchaseModal() {
        document.getElementById('purchaseModal').style.display = 'none';
    }

    // Handle payment method change
    handlePaymentMethodChange(method) {
        const mpesaForm = document.getElementById('mpesaForm');
        
        if (method === 'mpesa') {
            mpesaForm.style.display = 'block';
        } else {
            mpesaForm.style.display = 'none';
        }
    }

    // Process payment
    async processPayment() {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const quantity = parseInt(document.getElementById('ticketQuantity').textContent);
        const totalAmount = this.selectedEvent.price * quantity;
        
        if (paymentMethod === 'mpesa') {
            const phoneNumber = document.getElementById('mpesaNumber').value;
            
            if (!phoneNumber) {
                alert('Please enter your M-Pesa number');
                return;
            }
            
            await this.processMpesaPayment(phoneNumber, totalAmount);
        } else {
            // Handle card payment
            await this.processCardPayment(totalAmount);
        }
    }

    // Process M-Pesa payment
    async processMpesaPayment(phoneNumber, amount) {
        try {
            const response = await fetch('/api/payments/mpesa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    amount,
                    eventId: this.selectedEvent.id,
                    quantity: parseInt(document.getElementById('ticketQuantity').textContent)
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Payment initiated! Please check your phone for the M-Pesa prompt.');
                this.closePurchaseModal();
                this.closeEventModal();
            } else {
                alert(`Payment failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        }
    }

    // Process card payment
    async processCardPayment(amount) {
        // Placeholder for card payment integration
        alert('Card payment integration coming soon!');
    }

    // Join group chat
    joinGroup() {
        if (!this.selectedEvent) return;
        
        // This would typically integrate with a chat service
        alert(`Joining group chat for ${this.selectedEvent.title}...`);
    }

    // Show all reviews
    showAllReviews() {
        // This would typically open a separate reviews modal
        alert('Reviews modal coming soon!');
    }

    // Update results count
    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `${this.filteredEvents.length} events found`;
        }
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Global functions for HTML onclick handlers
function performSearch() {
    eventsManager.performSearch();
}

function toggleView(view) {
    eventsManager.toggleView(view);
}

function toggleMap() {
    eventsManager.toggleMap();
}

function closeEventModal() {
    eventsManager.closeEventModal();
}

function closePurchaseModal() {
    eventsManager.closePurchaseModal();
}

function changeQuantity(change) {
    eventsManager.changeQuantity(change);
}

function purchaseTicket() {
    eventsManager.purchaseTicket();
}

function processPayment() {
    eventsManager.processPayment();
}

function toggleInterest() {
    eventsManager.toggleInterest();
}

function toggleGoing() {
    eventsManager.toggleGoing();
}

function saveEvent() {
    eventsManager.saveEvent();
}

function shareEvent() {
    eventsManager.shareEvent();
}

function joinGroup() {
    eventsManager.joinGroup();
}

function showAllReviews() {
    eventsManager.showAllReviews();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventsManager = new EventsManager();
});

// Hide map section initially
document.addEventListener('DOMContentLoaded', () => {
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
        mapSection.style.display = 'none';
    }
});