
        // Sample event data
        const events = [
            {
                id: 1,
                title: "Tech Conference 2025",
                category: "Conference",
                date: "2025-03-15",
                time: "09:00",
                venue: "Grand Convention Center",
                status: "active",
                attendees: 245,
                capacity: 500,
                revenue: 12250,
                rating: 4.8
            },
            {
                id: 2,
                title: "Design Workshop",
                category: "Workshop",
                date: "2025-04-08",
                time: "14:00",
                venue: "City Art Gallery",
                status: "active",
                attendees: 28,
                capacity: 50,
                revenue: 1400,
                rating: 4.9
            },
            {
                id: 3,
                title: "Networking Night",
                category: "Networking",
                date: "2025-02-20",
                time: "18:00",
                venue: "Downtown Hotel",
                status: "ended",
                attendees: 85,
                capacity: 100,
                revenue: 0,
                rating: 4.6
            },
            {
                id: 4,
                title: "AI Seminar",
                category: "Seminar",
                date: "2025-05-12",
                time: "10:00",
                venue: "University Hall",
                status: "draft",
                attendees: 0,
                capacity: 200,
                revenue: 0,
                rating: 0
            }
        ];

        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }

        // Modal functionality
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this.id);
                }
            });
        });

        // Event management functions
        function renderEvents() {
            const eventsGrid = document.getElementById('eventsGrid');
            eventsGrid.innerHTML = '';

            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                
                const statusClass = event.status === 'active' ? 'status-active' : 
                                  event.status === 'draft' ? 'status-draft' : 'status-ended';
                
                eventCard.innerHTML = `
                    <div class="event-image">
                        <div class="event-status ${statusClass}">${event.status.toUpperCase()}</div>
                        📅
                    </div>
                    <div class="event-content">
                        <div class="event-title">${event.title}</div>
                        <div class="event-details">
                            📍 ${event.venue}<br>
                            🗓️ ${formatDate(event.date)} at ${event.time}<br>
                            🏷️ ${event.category}
                        </div>
                        <div class="event-stats">
                            <div class="stat">
                                <div class="stat-value">${event.attendees}</div>
                                <div class="stat-label">Attendees</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${event.capacity}</div>
                                <div class="stat-label">Capacity</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${event.revenue}</div>
                                <div class="stat-label">Revenue</div>
                            </div>
                        </div>
                        <div class="event-actions">
                            <button class="action-btn" onclick="editEvent(${event.id})">✏️ Edit</button>
                            <button class="action-btn" onclick="viewAnalytics(${event.id})">📊 Analytics</button>
                            <button class="action-btn" onclick="manageAttendees(${event.id})">👥 Attendees</button>
                            <button class="action-btn" onclick="duplicateEvent(${event.id})">📋 Duplicate</button>
                            ${event.status === 'active' ? '<button class="action-btn" onclick="pauseEvent(' + event.id + ')">⏸️ Pause</button>' : ''}
                            ${event.status === 'draft' ? '<button class="action-btn" onclick="publishEvent(' + event.id + ')">🚀 Publish</button>' : ''}
                        </div>
                    </div>
                `;
                
                eventsGrid.appendChild(eventCard);
            });
        }

        // Utility functions
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }

        // Event action functions
        function editEvent(eventId) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                // Populate edit form with event data
                document.getElementById('editEventTitle').value = event.title;
                document.getElementById('editEventCategory').value = event.category;
                document.getElementById('editEventDescription').value = event.description || '';
                openModal('editEventModal');
            }
        }

        function viewAnalytics(eventId) {
            // Switch to analytics tab and filter by event
            switchTab('analytics');
            // Additional logic to filter analytics by specific event
            alert(`Viewing analytics for event ID: ${eventId}`);
        }

        function manageAttendees(eventId) {
            alert(`Managing attendees for event ID: ${eventId}`);
        }

        function duplicateEvent(eventId) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                const newEvent = {
                    ...event,
                    id: events.length + 1,
                    title: event.title + ' (Copy)',
                    status: 'draft',
                    attendees: 0,
                    revenue: 0
                };
                events.push(newEvent);
                renderEvents();
                alert('Event duplicated successfully!');
            }
        }

        function pauseEvent(eventId) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                event.status = 'draft';
                renderEvents();
                alert('Event paused successfully!');
            }
        }

        function publishEvent(eventId) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                event.status = 'active';
                renderEvents();
                alert('Event published successfully!');
            }
        }

        // File upload handling
        document.getElementById('eventImages').addEventListener('change', function(e) {
            const files = e.target.files;
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = '';

            Array.from(files).forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    
                    const img = document.createElement('div');
                    img.className = 'preview-image';
                    img.textContent = '🖼️';
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-image';
                    removeBtn.innerHTML = '×';
                    removeBtn.onclick = () => previewItem.remove();
                    
                    previewItem.appendChild(img);
                    previewItem.appendChild(removeBtn);
                    preview.appendChild(previewItem);
                }
            });
        });

        // Drag and drop functionality
        const fileUpload = document.querySelector('.file-upload');
        
        fileUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        fileUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        fileUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            document.getElementById('eventImages').files = files;
            document.getElementById('eventImages').dispatchEvent(new Event('change'));
        });

        // Form submission handling
        document.getElementById('createEventForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const eventData = {
                id: events.length + 1,
                title: document.getElementById('eventTitle').value,
                category: document.getElementById('eventCategory').value,
                description: document.getElementById('eventDescription').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                venue: document.getElementById('eventVenue').value,
                capacity: parseInt(document.getElementById('eventCapacity').value),
                status: 'active',
                attendees: 0,
                revenue: 0,
                rating: 0
            };
            
            events.push(eventData);
            renderEvents();
            closeModal('createEventModal');
            this.reset();
            document.getElementById('imagePreview').innerHTML = '';
            
            alert('Event created successfully!');
        });

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            renderEvents();
        });

        // Search and filter functionality
        function filterEvents(status) {
            const filteredEvents = status === 'all' ? events : events.filter(e => e.status === status);
            // Re-render events with filtered data
            renderEvents();
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                openModal('createEventModal');
            }
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    closeModal(modal.id);
                });
            }
        });
    