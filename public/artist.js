document.addEventListener('DOMContentLoaded', async () => {
    // Get the artist ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('artistId') || 'defaultArtistId'; // Fallback to a default ID if not found
    // Fetch artist data from the backend
    const artistData = await fetchArtistData(artistId);
    async function fetchArtistData(artistId) {
        try {
            // This would connect to your backend API
            const response = await fetch(`/api/artists/${artistId}`);
            const artistData = await response.json();
            return artistData;
        } catch (error) {
            console.error('Error fetching artist data:', error);
            // Fallback to default/empty data
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
        socialLinksContainer.innerHTML = ''; // Clear existing
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
            </div>
        `;
        merchandiseGrid.appendChild(card);
        });
    }

    // Populate Upcoming Events Section
    const eventsList = document.querySelector('.events-list');
    if (eventsList) {
        artistData.upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
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
                </div>
            `;
            galleryGrid.appendChild(item);
        });
    }

    // Smooth scrolling for navigation links
     document.querySelectorAll('nav .nav-links a, .artist-nav-links a').forEach(anchor => { // IMPORTANT CHANGE HERE
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');

            // Skip external links - only handle # anchors for smooth scroll
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Calculate offset for sticky header and sticky artist nav
                    const headerOffset = document.querySelector('header').offsetHeight || 80; // Default if not found
                    const artistNavOffset = document.querySelector('.artist-nav') ? document.querySelector('.artist-nav').offsetHeight : 0;
                    const totalOffset = headerOffset + artistNavOffset + 20; // Add some extra padding

                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - totalOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                // For external links, just navigate normally
                window.location.href = targetId;
        }
    });
    });

    // Optional: Highlight active link in artist-nav based on scroll position
    const sections = document.querySelectorAll('.section[id]');
    const artistNavLinks = document.querySelectorAll('.artist-nav-links a');

    function highlightArtistNavLink() {
        let currentActive = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - (document.querySelector('header').offsetHeight + (document.querySelector('.artist-nav')?.offsetHeight || 0) + 30); // Adjust offset
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
highlightArtistNavLink(); // Call on load to set initial active state   

// Simple form submission (for demonstration)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(contactForm);

        try {
            await fetch('/api/contact', {
                method: 'POST',
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

//  function to handle role switching
function switchToArtistView(userId) {
    // Check if user has artist role
    if (userHasArtistRole(userId)) {
        window.location.href = `artist.html?id=${userId}`;
    } else {
        // Redirect to artist registration or show error
        alert('You need to set up your artist profile first');
        window.location.href = 'artist-setup.html';
    }
}

// Function to check user role 
async function userHasArtistRole(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/roles`);
        const roles = await response.json();
        return roles.includes('artist');
    } catch (error) {
        return false;
    }
}

