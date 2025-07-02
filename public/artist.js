document.addEventListener('DOMContentLoaded', async () => {
    // Get the artist ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('artistId');
        if (!artistId) {
            alert("No artist selected. Redirecting...");
            window.location.href = "/explore-artists.html"; // or a default view
            return;
        }
    
    // Check user authentication and role
    const currentUser = await getCurrentUser();
    const isArtistOwner = await checkIfArtistOwner(currentUser?.id, artistId);
    const hasArtistRole = currentUser ? await userHasArtistRole(currentUser.id) : false;
    
    // Initialize the page based on user permissions
    initializePageBasedOnRole(isArtistOwner, hasArtistRole);
    
    // Fetch artist data from the backend
    const artistData = await fetchArtistData(artistId);

    async function fetchArtistData(artistId) {
        try {
            const response = await fetch(`/api/artists/${artistId}`);
            const artistData = await response.json();
            return artistData;
        } catch (error) {
            console.error('Error fetching artist data:', error);
            return {
                name: "Artist Name",
                bio: "Artist bio not available",
                profilePic: "https://via.placeholder.com/150",
                social: {},
                merchandise: [],
                upcomingEvents: [],
                artGallery: []
            };
        }
    }

    // Get current user information
    async function getCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user', {
                credentials: 'include' // Include cookies for authentication
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

    // Function to check user role 
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
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        
        if (isOwner && hasArtistRole) {
            // User is the artist owner - show all editing capabilities
            showEditingCapabilities(true);
            setupFormHandlers();
        } else {
            // User is not the owner or not an artist - hide editing capabilities
            showEditingCapabilities(false);
            showViewOnlyMessage();
        }
    }

    // Show or hide editing capabilities
    function showEditingCapabilities(canEdit) {
        const editButtons = document.querySelectorAll('.add-item-btn');
        const formContainers = document.querySelectorAll('.add-form-container');
        
        editButtons.forEach(button => {
            if (canEdit) {
                button.style.display = 'inline-block';
            } else {
                button.style.display = 'none';
            }
        });
        
        formContainers.forEach(container => {
            if (!canEdit) {
                container.style.display = 'none';
            }
        });
    }

    // Show message for view-only users
    function showViewOnlyMessage() {
        if (!currentUser) {
            // Not logged in
            addViewOnlyBanner("Sign in as an artist to manage your profile");
        } else if (!hasArtistRole) {
            // Logged in but not an artist
            addViewOnlyBanner("Register as an artist to create your own profile");
        } else {
            // Is an artist but not the owner of this profile
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

    // Setup form handlers (only for artist owners)
    function setupFormHandlers() {
        // Add Item Form Handlers
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
        // Merchandise form
        const merchandiseForm = document.getElementById('merchandiseForm');
        if (merchandiseForm) {
            merchandiseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleMerchandiseSubmission(e.target);
            });
        }

        // Event form
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleEventSubmission(e.target);
            });
        }

        // Gallery form
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
        const formData = new FormData(form);
        const merchandiseData = {
            name: formData.get('merchName') || document.getElementById('merchName').value,
            description: formData.get('merchDescription') || document.getElementById('merchDescription').value,
            price: parseFloat(formData.get('merchPrice') || document.getElementById('merchPrice').value),
            image: formData.get('merchImage') || document.getElementById('merchImage').value
        };

        try {
            const response = await fetch(`/api/artists/${artistId}/merchandise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(merchandiseData)
            });

            if (response.ok) {
                alert('Merchandise added successfully!');
                form.reset();
                document.getElementById('addMerchandiseFormContainer').classList.add('hidden');
                location.reload(); // Refresh to show new item
            } else {
                alert('Error adding merchandise. Please try again.');
            }
        } catch (error) {
            alert('Error adding merchandise. Please try again.');
        }
    }

    // Handle event form submission
    async function handleEventSubmission(form) {
        const formData = new FormData(form);
        const eventData = {
            title: formData.get('eventTitle') || document.getElementById('eventTitle').value,
            date: formData.get('eventDate') || document.getElementById('eventDate').value,
            location: formData.get('eventLocation') || document.getElementById('eventLocation').value,
            time: formData.get('eventTime') || document.getElementById('eventTime').value,
            ticketLink: formData.get('eventTicketLink') || document.getElementById('eventTicketLink').value
        };

        try {
            const response = await fetch(`/api/artists/${artistId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                alert('Event added successfully!');
                form.reset();
                document.getElementById('addEventFormContainer').classList.add('hidden');
                location.reload();
            } else {
                alert('Error adding event. Please try again.');
            }
        } catch (error) {
            alert('Error adding event. Please try again.');
        }
    }

    // Handle gallery form submission
    async function handleGallerySubmission(form) {
        const formData = new FormData(form);
        const galleryData = {
            title: formData.get('artTitle') || document.getElementById('artTitle').value,
            description: formData.get('artDescription') || document.getElementById('artDescription').value,
            image: formData.get('artImage') || document.getElementById('artImage').value
        };

        try {
            const response = await fetch(`/api/artists/${artistId}/gallery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(galleryData)
            });

            if (response.ok) {
                alert('Art piece added successfully!');
                form.reset();
                document.getElementById('addGalleryFormContainer').classList.add('hidden');
                location.reload();
            } else {
                alert('Error adding art piece. Please try again.');
            }
        } catch (error) {
            alert('Error adding art piece. Please try again.');
        }
    }

    // Populate Artist Hero Section
    const artistNameElement = document.getElementById('artistName');
    const contactArtistNameElement = document.getElementById('contactArtistName');
    if (contactArtistNameElement) contactArtistNameElement.textContent = artistData.name;
    const artistBioElement = document.getElementById('artistBio');
    const artistProfilePicElement = document.querySelector('.artist-profile-pic');
    const socialLinksContainer = document.querySelector('.social-links');

    if (artistNameElement) artistNameElement.textContent = artistData.name;
    if (artistBioElement) artistBioElement.textContent = artistData.bio;
    if (artistProfilePicElement) artistProfilePicElement.src = artistData.profilePic;

    if (socialLinksContainer) {
        socialLinksContainer.innerHTML = '';
        for (const platform in artistData.social) {
            const link = document.createElement('a');
            link.href = artistData.social[platform];
            link.target = "_blank";
            link.innerHTML = `<i class="fab fa-${platform}"></i>`;
            socialLinksContainer.appendChild(link);
        }
    }

    // Populate Merchandise Section
    const merchandiseGrid = document.querySelector('.merchandise-grid');
    if (merchandiseGrid) {
        artistData.merchandise.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('merchandise-card');
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="merchandise-image">
                <div class="merchandise-content">
                    <h3 class="merchandise-title">${item.name}</h3>
                    <p class="merchandise-description">${item.description}</p>
                    <p class="merchandise-price">$${item.price.toFixed(2)}</p>
                    <button class="buy-btn">Add to Cart</button>
                    ${isArtistOwner ? '<button class="delete-btn" onclick="deleteMerchandise(\'' + item.id + '\')"><i class="fas fa-trash"></i></button>' : ''}
                </div>
            `;
            merchandiseGrid.appendChild(card);
        });
    }

    // Populate Upcoming Events Section
    const eventsList = document.querySelector('.events-list');
    if (eventsList) {
        artistData.upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        artistData.upcomingEvents.forEach(event => {
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
                    ${isArtistOwner ? '<button class="delete-btn" onclick="deleteEvent(\'' + event.id + '\')"><i class="fas fa-trash"></i></button>' : ''}
                </div>
            `;
            eventsList.appendChild(item);
        });
    }

    // Populate Art Gallery Section
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        artistData.artGallery.forEach(art => {
            const item = document.createElement('div');
            item.classList.add('gallery-item');
            item.innerHTML = `
                <img src="${art.image}" alt="${art.title}">
                <div class="gallery-item-overlay">
                    <h3>${art.title}</h3>
                    <p>${art.description}</p>
                    ${isArtistOwner ? '<button class="delete-btn overlay-delete" onclick="deleteArtPiece(\'' + art.id + '\')"><i class="fas fa-trash"></i></button>' : ''}
                </div>
            `;
            galleryGrid.appendChild(item);
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav .nav-links a, .artist-nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = document.querySelector('header').offsetHeight || 80;
                    const artistNavOffset = document.querySelector('.artist-nav') ? document.querySelector('.artist-nav').offsetHeight : 0;
                    const totalOffset = headerOffset + artistNavOffset + 20;

                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - totalOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                window.location.href = targetId;
            }
        });
    });

    // Highlight active link in artist-nav based on scroll position
    const sections = document.querySelectorAll('.section[id]');
    const artistNavLinks = document.querySelectorAll('.artist-nav-links a');

    function highlightArtistNavLink() {
        let currentActive = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - (document.querySelector('header').offsetHeight + (document.querySelector('.artist-nav')?.offsetHeight || 0) + 30);
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                currentActive = section.getAttribute('id');
            }
        });

        artistNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentActive)) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightArtistNavLink);
    highlightArtistNavLink();

    // Contact form submission (available to all users)
    const contactForm = document.getElementById('contactForm') || document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Please sign in to send a message to the artist.');
                return;
            }

            const formData = new FormData(contactForm);
            try {
                await fetch(`/api/artists/${artistId}/contact`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                alert('Message sent successfully!');
                contactForm.reset();
            } catch (error) {
                alert('Error sending message. Please try again.');
            }
        });
    }
});

// Global delete functions (only accessible to artist owners)
async function deleteMerchandise(itemId) {
    if (!confirm('Are you sure you want to delete this merchandise item?')) return;
    
    try {
        const response = await fetch(`/api/artists/merchandise/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error deleting item. Please try again.');
        }
    } catch (error) {
        alert('Error deleting item. Please try again.');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
        const response = await fetch(`/api/artists/events/${eventId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error deleting event. Please try again.');
        }
    } catch (error) {
        alert('Error deleting event. Please try again.');
    }
}

async function deleteArtPiece(artId) {
    if (!confirm('Are you sure you want to delete this art piece?')) return;
    
    try {
        const response = await fetch(`/api/artists/gallery/${artId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            location.reload();
        } else {
            alert('Error deleting art piece. Please try again.');
        }
    } catch (error) {
        alert('Error deleting art piece. Please try again.');
    }
}

// Function to handle role switching
function switchToArtistView(userId) {
    if (userHasArtistRole(userId)) {
        window.location.href = `artist.html?id=${userId}`;
    } else {
        alert('You need to set up your artist profile first');
        window.location.href = 'artist-setup.html';
    }
}