document.addEventListener('DOMContentLoaded', async () => {
    setupRoleAwareUI(); // 🔐 Make sure dropdown/auth buttons work properly

    let currentUser = null;
    let currentArtistId = null;
    let isArtistOwner = false;
    let hasArtistRole = false;
    let allArtists = [];

    await initializePage();

async function initializePage() {
    currentUser = await getCurrentUser();
    const currentRole = localStorage.getItem('currentRole');

    if (currentRole === 'artist') {
        try {
            const res = await fetch('/api/auth/verify', {
                headers: { Authorization: `Bearer ${getAuthToken()}` }
            });

            const data = await res.json();
            if (data && data.artist) {
                currentArtistId = data.artist.id;
                isArtistOwner = true;
                hasArtistRole = true;

                // Hide selector dropdown
                const selector = document.getElementById('artistSelectorSection');
                if (selector) selector.style.display = 'none';

                // Enable editing mode and load profile
                initializePageBasedOnRole(true, true);
                await populateArtistData(data.artist);
                return; // ✅ skip dropdown logic
            }
        } catch (err) {
            console.error('Error verifying artist:', err);
        }
    }

    // Fallback: load artist selector + handle dropdown logic
    await loadArtistDropdown();

    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('artistId');

    if (artistId) {
        const artistSelect = document.getElementById('artistSelect');
        artistSelect.value = artistId;
        await loadArtistProfile(artistId);
    }

    setupArtistDropdownHandler();
}


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

    
    // Load all artists for the dropdown
    async function loadArtistDropdown() {
        try {
            const response = await fetch('/api/artists');
            if (response.ok) {
                allArtists = await response.json();
                populateArtistDropdown(allArtists);
            } else {
                console.error('Failed to load artists');
            }
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }
    
    // Populate the artist dropdown
    function populateArtistDropdown(artists) {
        const artistSelect = document.getElementById('artistSelect');
        artistSelect.innerHTML = '<option value="">Select an artist...</option>';
        
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist.id;
            option.textContent = artist.name;
            artistSelect.appendChild(option);
        });
    }
    
    // Setup dropdown change handler
    function setupArtistDropdownHandler() {
        const artistSelect = document.getElementById('artistSelect');
        artistSelect.addEventListener('change', async (e) => {
            const selectedArtistId = e.target.value;
            
            if (selectedArtistId) {
                // Update URL without page reload
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('artistId', selectedArtistId);
                window.history.pushState({}, '', newUrl);
                
                // Load the selected artist's profile
                await loadArtistProfile(selectedArtistId);
            } else {
                // Clear the profile if no artist selected
                clearArtistProfile();
                // Remove artistId from URL
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('artistId');
                window.history.pushState({}, '', newUrl);
            }
        });
    }
    
    // Load artist profile data
    async function loadArtistProfile(artistId) {
        showLoadingSpinner(true);
        
        try {
            // Fetch artist data
            const artistData = await fetchArtistData(artistId);
            
            if (!artistData) {
                showErrorMessage('Artist profile not found');
                return;
            }
            
            // Update global variables
            currentArtistId = artistId;
            
            // Check permissions
            if (currentUser) {
                isArtistOwner = await checkIfArtistOwner(currentUser.id, artistId);
                hasArtistRole = await userHasArtistRole(currentUser.id);
            }
            
            // Initialize page based on permissions
            initializePageBasedOnRole(isArtistOwner, hasArtistRole);
            
            // Populate artist data
            await populateArtistData(artistData);
            
        } catch (error) {
            console.error('Error loading artist profile:', error);
            showErrorMessage('Failed to load artist profile');
        } finally {
            showLoadingSpinner(false);
        }
    }
    
    // Fetch artist data from backend
    async function fetchArtistData(artistId) {
        try {
            const response = await fetch(`/api/artists/${artistId}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching artist data:', error);
            return null;
        }
    }
    
    // Get current user information
    async function getCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user', {
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    // Check if current user is the owner of this artist profile
    async function checkIfArtistOwner(userId, artistId) {
        if (!userId) return false;
        try {
            const response = await fetch(`/api/artists/${artistId}/owner`, {
                credentials: 'include'
            });
            const data = await response.json();
            return data.isOwner;
        } catch (error) {
            console.error('Error checking artist ownership:', error);
            return false;
        }
    }
    
    // Check if user has artist role
    async function userHasArtistRole(userId) {
        try {
            const response = await fetch(`/api/users/${userId}/roles`, {
                credentials: 'include'
            });
            const roles = await response.json();
            return roles.includes('artist');
        } catch (error) {
            return false;
        }
    }
    
    // Initialize page based on user role and permissions
    function initializePageBasedOnRole(isOwner, hasArtistRole) {
        const editButtons = document.querySelectorAll('.add-item-btn');
        const formContainers = document.querySelectorAll('.add-form-container');
        
        if (isOwner && hasArtistRole) {
            showEditingCapabilities(true);
            setupFormHandlers();
        } else {
            showEditingCapabilities(false);
            if (currentUser) {
                showViewOnlyMessage();
            }
        }
    }
    
    // Show or hide editing capabilities
    function showEditingCapabilities(canEdit) {
        const editButtons = document.querySelectorAll('.add-item-btn');
        const formContainers = document.querySelectorAll('.add-form-container');
        
        editButtons.forEach(button => {
            button.style.display = canEdit ? 'inline-block' : 'none';
        });
        
        formContainers.forEach(container => {
            if (!canEdit) {
                container.classList.add('hidden');
            }
        });
    }
    
    // Show message for view-only users
    function showViewOnlyMessage() {
        // Remove existing banner
        const existingBanner = document.querySelector('.view-only-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        if (!currentUser) {
            addViewOnlyBanner("Sign in as an artist to manage your profile");
        } else if (!hasArtistRole) {
            addViewOnlyBanner("Register as an artist to create your own profile");
        } else if (!isArtistOwner) {
            addViewOnlyBanner("You can only edit your own artist profile");
        }
    }
    
    // Add banner message for view-only users
    function addViewOnlyBanner(message) {
        const banner = document.createElement('div');
        banner.className = 'view-only-banner';
        banner.innerHTML = `
            <div class="container">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
                ${!currentUser ? '<a href="login.html" class="btn btn-small btn-primary">Sign In</a>' : 
                  (!hasArtistRole ? '<a href="artist-setup.html" class="btn btn-small btn-primary">Become an Artist</a>' : '')}
            </div>
        `;
        document.querySelector('main').insertBefore(banner, document.querySelector('.artist-nav'));
    }
    
    // Show/hide loading spinner
    function showLoadingSpinner(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }
    
    // Show error message
    function showErrorMessage(message) {
        clearArtistProfile();
        const artistName = document.getElementById('artistName');
        const artistBio = document.getElementById('artistBio');
        
        if (artistName) artistName.textContent = 'Error';
        if (artistBio) artistBio.textContent = message;
    }
    
    // Clear artist profile data
    function clearArtistProfile() {
        // Clear hero section
        const artistName = document.getElementById('artistName');
        const artistBio = document.getElementById('artistBio');
        const artistProfilePic = document.querySelector('.artist-profile-pic');
        const socialLinks = document.querySelector('.social-links');
        
        if (artistName) artistName.textContent = 'Select an Artist';
        if (artistBio) artistBio.textContent = 'Choose an artist from the dropdown above to view their profile, upcoming events, merchandise, and art gallery.';
        if (artistProfilePic) artistProfilePic.src = 'https://via.placeholder.com/150';
        if (socialLinks) socialLinks.innerHTML = '';
        
        // Clear sections
        clearSection('.merchandise-grid', 'shopping-bag', 'Select an artist to view their merchandise');
        clearSection('.events-list', 'calendar-alt', 'Select an artist to view their upcoming events');
        clearSection('.gallery-grid', 'images', 'Select an artist to view their art gallery');
        clearContactSection();
        
        // Hide edit buttons
        showEditingCapabilities(false);
        
        // Remove view-only banner
        const existingBanner = document.querySelector('.view-only-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
    }
    
    // Clear a section with placeholder message
    function clearSection(selector, icon, message) {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-${icon}"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    // Clear contact section
    function clearContactSection() {
        const contactContent = document.getElementById('contactContent');
        if (contactContent) {
            contactContent.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-envelope"></i>
                    <p>Select an artist to send them a message</p>
                </div>
            `;
        }
    }
    
    // Populate artist data in the UI
    async function populateArtistData(artistData) {
        // Update hero section
        const artistName = document.getElementById('artistName');
        const artistBio = document.getElementById('artistBio');
        const artistProfilePic = document.querySelector('.artist-profile-pic');
        const socialLinks = document.querySelector('.social-links');
        
        if (artistName) artistName.textContent = artistData.name;
        if (artistBio) artistBio.textContent = artistData.bio;
        if (artistProfilePic) artistProfilePic.src = artistData.profilePic;
        
        // Update social links
        if (socialLinks) {
            socialLinks.innerHTML = '';
            for (const platform in artistData.social) {
                const link = document.createElement('a');
                link.href = artistData.social[platform];
                link.target = "_blank";
                link.innerHTML = `<i class="fab fa-${platform}"></i>`;
                socialLinks.appendChild(link);
            }
        }
        
        // Update page title
        document.title = `Artist Profile - ${artistData.name}`;
        
        // Populate sections
        populateMerchandise(artistData.merchandise);
        populateEvents(artistData.upcomingEvents);
        populateGallery(artistData.artGallery);
        populateContact(artistData.name);
    }
    
    // Populate merchandise section
    function populateMerchandise(merchandise) {
        const merchandiseGrid = document.querySelector('.merchandise-grid');
        if (!merchandiseGrid) return;
        
        merchandiseGrid.innerHTML = '';
        
        if (merchandise.length === 0) {
            merchandiseGrid.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-shopping-bag"></i>
                    <p>No merchandise available</p>
                </div>
            `;
            return;
        }
        
        merchandise.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('merchandise-card');
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="merchandise-image">
                <div class="merchandise-content">
                    <h3 class="merchandise-title">${item.name}</h3>
                    <p class="merchandise-description">${item.description}</p>
                    <p class="merchandise-price">$${item.price.toFixed(2)}</p>
                    <button class="buy-btn">Add to Cart</button>
                    ${isArtistOwner ? `<button class="delete-btn" onclick="deleteMerchandise('${item.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            `;
            merchandiseGrid.appendChild(card);
        });
    }
    
    // Populate events section
    function populateEvents(events) {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No upcoming events</p>
                </div>
            `;
            return;
        }
        
        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const month = eventDate.toLocaleString('default', { month: 'short' });
            
            const item = document.createElement('div');
            item.classList.add('event-item');
            item.innerHTML = `
                <div class="event-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="event-details-content">
                    <h3 class="event-title-item">${event.title}</h3>
                    <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <p class="event-time"><i class="fas fa-clock"></i> ${event.time}</p>
                </div>
                <div class="event-actions">
                    <a href="${event.ticketLink}" class="btn btn-primary" target="_blank">Tickets</a>
                    ${isArtistOwner ? `<button class="delete-btn" onclick="deleteEvent('${event.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            `;
            eventsList.appendChild(item);
        });
    }
    
    // Populate gallery section
    function populateGallery(artGallery) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;
        
        galleryGrid.innerHTML = '';
        
        if (artGallery.length === 0) {
            galleryGrid.innerHTML = `
                <div class="no-content-message">
                    <i class="fas fa-images"></i>
                    <p>No art pieces available</p>
                </div>
            `;
            return;
        }
        
        artGallery.forEach(art => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');
            item.innerHTML = `
                <img src="${art.image}" alt="${art.title}">
                <div class="gallery-item-overlay">
                    <h3>${art.title}</h3>
                    <p>${art.description}</p>
                    ${isArtistOwner ? `<button class="delete-btn overlay-delete" onclick="deleteArtPiece('${art.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            `;
            galleryGrid.appendChild(item);
        });
    }
    
    // Populate contact section
    function populateContact(artistName) {
        const contactContent = document.getElementById('contactContent');
        if (!contactContent) return;
        
        contactContent.innerHTML = `
            <p>Have a question or want to collaborate? Reach out to ${artistName}!</p>
            <form class="contact-form">
                <input type="text" name="name" placeholder="Your Name" required>
                <input type="email" name="email" placeholder="Your Email" required>
                <textarea name="message" placeholder="Your Message" rows="5" required></textarea>
                <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
        `;
        
        // Setup contact form handler
        setupContactFormHandler();
    }
    
    // Setup contact form handler
    function setupContactFormHandler() {
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (!currentUser) {
                    alert('Please sign in to send a message to the artist.');
                    return;
                }
                
                if (!currentArtistId) {
                    alert('Please select an artist first.');
                    return;
                }
                
                const formData = new FormData(contactForm);
                const contactData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                };
                
                try {
                    const response = await fetch(`/api/artists/${currentArtistId}/contact`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(contactData)
                    });
                    
                    if (response.ok) {
                        alert('Message sent successfully!');
                        contactForm.reset();
                    } else {
                        alert('Error sending message. Please try again.');
                    }
                } catch (error) {
                    alert('Error sending message. Please try again.');
                }
            });
        }
    }
    
    // Setup form handlers (only for artist owners)
    function setupFormHandlers() {
        const addMerchandiseBtn = document.getElementById('addMerchandiseBtn');
        const addEventBtn = document.getElementById('addEventBtn');
        const addGalleryBtn = document.getElementById('addGalleryBtn');
        
        const merchandiseFormContainer = document.getElementById('addMerchandiseFormContainer');
        const eventFormContainer = document.getElementById('addEventFormContainer');
        const galleryFormContainer = document.getElementById('addGalleryFormContainer');
        
        // Show/Hide forms
        if (addMerchandiseBtn) {
            addMerchandiseBtn.addEventListener('click', () => {
                merchandiseFormContainer.classList.toggle('hidden');
            });
        }
        
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                eventFormContainer.classList.toggle('hidden');
            });
        }
        
        if (addGalleryBtn) {
            addGalleryBtn.addEventListener('click', () => {
                galleryFormContainer.classList.toggle('hidden');
            });
        }
        
        // Cancel button handlers
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.add-form-container').classList.add('hidden');
            });
        });
        
        // Form submission handlers
        setupFormSubmissions();
    }
    
    // Setup form submission handlers
    function setupFormSubmissions() {
        const merchandiseForm = document.getElementById('merchandiseForm');
        if (merchandiseForm) {
            merchandiseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleMerchandiseSubmission(e.target);
            });
        }
        
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEventSubmission(e.target);
            });
        }
        
        const galleryForm = document.getElementById('galleryForm');
        if (galleryForm) {
            galleryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleGallerySubmission(e.target);
            });
        }
    }
    
    // Handle merchandise form submission
    async function handleMerchandiseSubmission(form) {
        const merchandiseData = {
            name: document.getElementById('merchName').value,
            description: document.getElementById('merchDescription').value,
            price: parseFloat(document.getElementById('merchPrice').value),
            image: document.getElementById('merchImage').value
        };
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/merchandise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(merchandiseData)
            });
            
            if (response.ok) {
                alert('Merchandise added successfully!');
                form.reset();
                document.getElementById('addMerchandiseFormContainer').classList.add('hidden');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error adding merchandise. Please try again.');
            }
        } catch (error) {
            alert('Error adding merchandise. Please try again.');
        }
    }
    // Handle event form submission
    async function handleEventSubmission(form) {
        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value,
            time: document.getElementById('eventTime').value,
            ticketLink: document.getElementById('eventTicketLink').value
        };
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                alert('Event added successfully!');
                form.reset();
                document.getElementById('addEventFormContainer').classList.add('hidden');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error adding event. Please try again.');
            }
        } catch (error) {
            alert('Error adding event. Please try again.');
        }
    }
    
    // Handle gallery form submission
    async function handleGallerySubmission(form) {
        const galleryData = {
            title: document.getElementById('artTitle').value,
            description: document.getElementById('artDescription').value,
            image: document.getElementById('artImage').value
        };
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/gallery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(galleryData)
            });
            
            if (response.ok) {
                alert('Art piece added successfully!');
                form.reset();
                document.getElementById('addGalleryFormContainer').classList.add('hidden');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error adding art piece. Please try again.');
            }
        } catch (error) {
            alert('Error adding art piece. Please try again.');
        }
    }
    
    // Delete merchandise item
    window.deleteMerchandise = async function(itemId) {
        if (!confirm('Are you sure you want to delete this merchandise item?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/merchandise/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Merchandise deleted successfully!');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error deleting merchandise. Please try again.');
            }
        } catch (error) {
            alert('Error deleting merchandise. Please try again.');
        }
    };
    
    // Delete event
    window.deleteEvent = async function(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Event deleted successfully!');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error deleting event. Please try again.');
            }
        } catch (error) {
            alert('Error deleting event. Please try again.');
        }
    };
    
    // Delete art piece
    window.deleteArtPiece = async function(artId) {
        if (!confirm('Are you sure you want to delete this art piece?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/artists/${currentArtistId}/gallery/${artId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                alert('Art piece deleted successfully!');
                await loadArtistProfile(currentArtistId); // Refresh data
            } else {
                alert('Error deleting art piece. Please try again.');
            }
        } catch (error) {
            alert('Error deleting art piece. Please try again.');
        }
    };
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', async (event) => {
        const urlParams = new URLSearchParams(window.location.search);
        const artistId = urlParams.get('artistId');
        
        if (artistId) {
            const artistSelect = document.getElementById('artistSelect');
            artistSelect.value = artistId;
            await loadArtistProfile(artistId);
        } else {
            const artistSelect = document.getElementById('artistSelect');
            artistSelect.value = '';
            clearArtistProfile();
        }
    });
    
    // Auto-save form data to prevent loss
    function setupAutoSave() {
        const forms = document.querySelectorAll('.item-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const formId = form.id;
                    const inputId = input.id;
                    const value = input.value;
                    
                    // Store in memory (not localStorage as per requirements)
                    if (!window.formData) window.formData = {};
                    if (!window.formData[formId]) window.formData[formId] = {};
                    window.formData[formId][inputId] = value;
                });
            });
        });
    }
    
    // Restore form data
    function restoreFormData() {
        if (window.formData) {
            Object.keys(window.formData).forEach(formId => {
                const formData = window.formData[formId];
                Object.keys(formData).forEach(inputId => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = formData[inputId];
                    }
                });
            });
        }
    }
    
    // Clear form data after successful submission
    function clearFormData(formId) {
        if (window.formData && window.formData[formId]) {
            delete window.formData[formId];
        }
    }
    
    // Initialize auto-save functionality
    setupAutoSave();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('.artist-nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
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
    
    // Add loading states to buttons
    function addLoadingState(button, originalText) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${originalText}...`;
    }
    
    function removeLoadingState(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
    
    // Enhanced form validation
    function validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        // Validate URLs
        const urlFields = form.querySelectorAll('input[type="url"]');
        urlFields.forEach(field => {
            if (field.value && !isValidURL(field.value)) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    // URL validation helper
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Image preload and validation
    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    // Add image validation to forms
    document.querySelectorAll('input[placeholder*="Image URL"]').forEach(input => {
        input.addEventListener('blur', async () => {
            const imageUrl = input.value.trim();
            if (imageUrl) {
                try {
                    await preloadImage(imageUrl);
                    input.classList.remove('error');
                } catch (error) {
                    input.classList.add('error');
                    console.warn('Invalid image URL:', imageUrl);
                }
            }
        });
    });
