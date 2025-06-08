
        // Sample data
        const userEvents = [
            {
                id: 1,
                title: "Jazz Night at the Rooftop",
                date: "2025-06-15",
                location: "Nairobi",
                status: "upcoming",
                icon: "🎵"
            },
            {
                id: 2,
                title: "Tech Conference 2025",
                date: "2025-05-20",
                location: "Nairobi",
                status: "attended",
                icon: "💻"
            },
            {
                id: 3,
                title: "Food Festival Weekend",
                date: "2025-07-10",
                location: "Mombasa",
                status: "interested",
                icon: "🍽️"
            },
            {
                id: 4,
                title: "Art Gallery Opening",
                date: "2025-04-15",
                location: "Nairobi",
                status: "attended",
                icon: "🎨"
            }
        ];

        const preferences = [
            { id: 'music', name: 'Music & Concerts', icon: '🎵', selected: true },
            { id: 'sports', name: 'Sports & Fitness', icon: '⚽', selected: false },
            { id: 'arts', name: 'Arts & Culture', icon: '🎨', selected: true },
            { id: 'food', name: 'Food & Drink', icon: '🍽️', selected: true },
            { id: 'tech', name: 'Technology', icon: '💻', selected: true },
            { id: 'business', name: 'Business', icon: '💼', selected: false },
            { id: 'health', name: 'Health & Wellness', icon: '🧘', selected: false },
            { id: 'education', name: 'Education', icon: '📚', selected: false }
        ];

        // Tab functionality
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + 'Tab').classList.add('active');
            event.target.classList.add('active');
            
            // Load tab-specific content
            if (tabName === 'events') {
                loadUserEvents();
            } else if (tabName === 'preferences') {
                loadPreferences();
            }
        }

        // Load user events
        function loadUserEvents() {
            const grid = document.getElementById('userEventsGrid');
            grid.innerHTML = userEvents.map(event => `
                <div class="event-card" data-status="${event.status}">
                    <div class="event-image">${event.icon}</div>
                    <div class="event-content">
                        <div class="event-title">${event.title}</div>
                        <div class="event-details">📅 ${new Date(event.date).toLocaleDateString()}</div>
                        <div class="event-details">📍 ${event.location}</div>
                        <span class="event-status status-${event.status}">
                            ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                    </div>
                </div>
            `).join('');
        }

        // Load preferences
        function loadPreferences() {
            const grid = document.getElementById('preferencesGrid');
            grid.innerHTML = preferences.map(pref => `
                <div class="preference-card ${pref.selected ? 'selected' : ''}" 
                     onclick="togglePreference('${pref.id}', this)">
                    <div class="preference-icon">${pref.icon}</div>
                    <h3>${pref.name}</h3>
                </div>
            `).join('');
        }

        // Toggle preference
        function togglePreference(id, element) {
            element.classList.toggle('selected');
            const pref = preferences.find(p => p.id === id);
            if (pref) {
                pref.selected = !pref.selected;
            }
        }

        // Filter events
        function filterEvents(filter) {
            const cards = document.querySelectorAll('.event-card');
            const buttons = document.querySelectorAll('[id^="filter"]');
            
            // Reset button styles
            buttons.forEach(btn => btn.classList.remove('btn-primary'));
            buttons.forEach(btn => btn.classList.add('btn-secondary'));}