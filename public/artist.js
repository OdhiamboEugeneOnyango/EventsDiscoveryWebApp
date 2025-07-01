document.addEventListener('DOMContentLoaded', () => {
    // Dummy Data for demonstration
    const artistData = {
        name: "Anya Sharma",
        bio: "Anya Sharma is a visionary artist known for her vibrant abstract paintings and thought-provoking sculptures. Her work explores themes of nature, human emotion, and the interconnectedness of life. With a unique blend of traditional techniques and modern digital art, Anya brings a fresh perspective to contemporary art.",
        profilePic: "https://via.placeholder.com/150/FF6347/FFFFFF?text=Anya", // Example: Tomato color
        social: {
            facebook: "https://facebook.com/anyasharmaart",
            instagram: "https://instagram.com/anyasharma_art",
            twitter: "https://twitter.com/anyasharmaart",
            youtube: "https://youtube.com/anyasharmaart"
        },
        merchandise: [
            {
                id: 1,
                name: "Abstract Canvas Print 'Harmony'",
                description: "High-quality Giclee print on canvas, limited edition.",
                price: 150.00,
                image: "https://via.placeholder.com/400x300/8A2BE2/FFFFFF?text=Harmony+Print" // Blue Violet
            },
            {
                id: 2,
                name: "Sculpture 'Growth'",
                description: "Hand-carved wooden sculpture, unique piece.",
                price: 750.00,
                image: "https://via.placeholder.com/400x300/DAA520/FFFFFF?text=Growth+Sculpture" // Goldenrod
            },
            {
                id: 3,
                name: "Digital Art Poster 'Dreamscape'",
                description: "Signed and numbered poster, archival ink.",
                price: 45.00,
                image: "https://via.placeholder.com/400x300/4682B4/FFFFFF?text=Dreamscape+Poster" // Steel Blue
            },
            {
                id: 4,
                name: "Artist T-Shirt 'Creative Flow'",
                description: "100% organic cotton, unisex fit.",
                price: 25.00,
                image: "https://via.placeholder.com/400x300/CD5C5C/FFFFFF?text=Art+T-Shirt" // Indian Red
            }
        ],
        upcomingEvents: [
            {
                id: 1,
                title: "Solo Exhibition: Echoes of Color",
                date: "2025-08-15",
                location: "The Grand Gallery, New York",
                time: "7:00 PM - 10:00 PM",
                ticketLink: "#"
            },
            {
                id: 2,
                title: "Art Fair: Creative Minds Expo",
                date: "2025-09-01",
                location: "Convention Center, London",
                time: "10:00 AM - 6:00 PM",
                ticketLink: "#"
            },
            {
                id: 3,
                title: "Live Painting Performance",
                date: "2025-10-20",
                location: "City Park Amphitheater",
                time: "4:00 PM - 6:00 PM",
                ticketLink: "#"
            }
        ],
        artGallery: [
            {
                id: 1,
                title: "Serenity",
                description: "Oil on canvas, 24x36 inches.",
                image: "https://via.placeholder.com/600x400/6A5ACD/FFFFFF?text=Serenity" // Slate Blue
            },
            {
                id: 2,
                title: "Urban Pulse",
                description: "Mixed media on wood, 30x40 inches.",
                image: "https://via.placeholder.com/600x400/FFD700/000000?text=Urban+Pulse" // Gold
            },
            {
                id: 3,
                title: "Forest Whisper",
                description: "Acrylic on linen, 18x24 inches.",
                image: "https://via.placeholder.com/600x400/3CB371/FFFFFF?text=Forest+Whisper" // Medium Sea Green
            },
            {
                id: 4,
                title: "Cosmic Dance",
                description: "Digital art print, 20x20 inches.",
                image: "https://via.placeholder.com/600x400/800080/FFFFFF?text=Cosmic+Dance" // Purple
            },
            {
                id: 5,
                title: "Ocean's Embrace",
                description: "Watercolor on paper, 16x20 inches.",
                image: "https://via.placeholder.com/600x400/4169E1/FFFFFF?text=Ocean's+Embrace" // Royal Blue
            }
        ]
    };


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
const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Message sent! (This is a demo. No actual email is sent.)');
            contactForm.reset();
        });
    }

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


});