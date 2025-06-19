// safezone.js
        // Sample data
        let venues = [
            {
                name: "Downtown Community Center",
                rating: 5,
                comments: "Well-lit parking, security cameras, friendly staff"
            },
            {
                name: "Riverside Park Pavilion", 
                rating: 4,
                comments: "Good visibility, some areas could use better lighting"
            },
            {
                name: "Metro Convention Hall",
                rating: 3,
                comments: "Large venue but exits can get crowded"
            }
        ];
        
        let incidents = [
            {
                type: "safety",
                location: "Main Street Plaza",
                date: "2025-06-15",
                description: "Loose handrail on stairs near entrance"
            },
            {
                type: "harassment", 
                location: "Community Center",
                date: "2025-06-10",
                description: "Inappropriate behavior reported in parking area"
            }
        ];
        
        let lostFoundItems = [
            {
                status: "lost",
                description: "Blue iPhone 14 with clear case",
                location: "Downtown Library",
                date: "2025-06-18",
                contact: "john@email.com"
            },
            {
                status: "found",
                description: "Black leather wallet",
                location: "Park Bench Area",
                date: "2025-06-17", 
                contact: "555-0123"
            }
        ];
        
        // Tab functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Lucide icons first
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
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
            
            // Initialize displays
            displayVenues();
            displayIncidents();
            displayLostFound();
            
            // Form handlers
            setupFormHandlers();
            
            // Re-initialize icons after content is loaded
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        });
        
        function displayVenues() {
            const grid = document.getElementById('venueGrid');
            grid.innerHTML = venues.map(venue => `
                <div class="venue-card">
                    <div class="venue-name">${venue.name}</div>
                    <div class="safety-rating">
                        <div class="stars">
                            ${'⭐'.repeat(venue.rating)}${'☆'.repeat(5-venue.rating)}
                        </div>
                        <span class="rating-text">${venue.rating}/5</span>
                    </div>
                    <div class="venue-info">${venue.comments}</div>
                </div>
            `).join('');
        }
        
        function displayIncidents() {
            const list = document.getElementById('incidentList');
            list.innerHTML = incidents.map(incident => `
                <div class="incident-item">
                    <div class="incident-header">
                        <span class="incident-type">${incident.type.toUpperCase()}</span>
                        <span class="incident-date">${incident.date}</span>
                    </div>
                    <div><strong>Location:</strong> ${incident.location}</div>
                    <div style="margin-top: 8px;">${incident.description}</div>
                </div>
            `).join('');
        }
        
        function displayLostFound() {
            const grid = document.getElementById('lostFoundGrid');
            grid.innerHTML = lostFoundItems.map(item => `
                <div class="lost-found-item">
                    <div class="item-type">${item.status.toUpperCase()}</div>
                    <div style="font-weight: bold; margin-bottom: 8px;">${item.description}</div>
                    <div style="font-size: 0.9rem; color: #666;">
                        📍 ${item.location}<br>
                        📅 ${item.date}<br>
                        📞 ${item.contact}
                    </div>
                </div>
            `).join('');
        }
        
        function setupFormHandlers() {
            // Venue rating form
            const venueForm = document.getElementById('venueRatingForm');
            if (venueForm) {
                venueForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const name = document.getElementById('venueName').value;
                    const rating = parseInt(document.getElementById('venueRating').value);
                    const comments = document.getElementById('venueComments').value;
                    
                    if (name && rating && comments) {
                        venues.unshift({name, rating, comments});
                        displayVenues();
                        this.reset();
                        alert('Venue rating submitted successfully!');
                    }
                });
            }
            
            // Incident form
            const incidentForm = document.getElementById('incidentForm');
            if (incidentForm) {
                incidentForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const type = document.getElementById('incidentType').value;
                    const location = document.getElementById('incidentLocation').value;
                    const dateTime = document.getElementById('incidentDate').value;
                    const date = dateTime ? dateTime.split('T')[0] : new Date().toISOString().split('T')[0];
                    const description = document.getElementById('incidentDescription').value;
                    
                    if (type && location && description) {
                        incidents.unshift({type, location, date, description});
                        displayIncidents();
                        this.reset();
                        alert('Incident report submitted successfully!');
                    }
                });
            }
            
            // Lost & Found form
            const lostFoundForm = document.getElementById('lostFoundForm');
            if (lostFoundForm) {
                lostFoundForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const status = document.getElementById('itemStatus').value;
                    const description = document.getElementById('itemDescription').value;
                    const location = document.getElementById('itemLocation').value;
                    const date = document.getElementById('itemDate').value;
                    const contact = document.getElementById('itemContact').value;
                    
                    if (status && description && location && date && contact) {
                        lostFoundItems.unshift({status, description, location, date, contact});
                        displayLostFound();
                        this.reset();
                        alert('Lost & Found listing submitted successfully!');
                    }
                });
            }
        }
    