// Enhanced Profile JavaScript - Fixed Authentication Issues and Email Updates

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';


async function checkAuth() {
  if (!authToken) {
    // Redirect to login if no token
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }

  try {
    // Verify token with backend
    const response = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    if (!response.ok) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
}

async function loadProfile() {
  try {
    const response = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });

    const data = await response.json();
    console.log('🔍 Backend profile response:', data);

    if (!data.success || !data.user) {
      throw new Error('User data not found or invalid response');
    }

    // 🧠 Set role only if not already set
    const savedRole = getCurrentRole();
    const defaultRole = data.user.roles.includes('organizer') ? 'organizer' :
                        data.user.roles.includes('artist') ? 'artist' : 'user';

    // Only override currentRole if needed
    if (!savedRole || !data.user.roles.includes(savedRole)) {
      setCurrentRole(defaultRole);
    }

    // ✅ Now populate the UI (HTML should be rendered already!)
    populateUserProfile(data.user, data.artistData, data.organizerData);

  } catch (err) {
    console.error('🚫 Error fetching profile:', err);
    showNotification('Failed to load profile data.', 'error');
  }

  const form = document.getElementById('profileForm');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    updateUserProfile();
  });
}
}

// Login form handler
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    
    // Redirect to original URL or profile page
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/profile.html';
    window.location.href = redirectUrl;
  } catch (error) {
    showLoginError(error.message);
  }
}
// Utility function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Get current user from API with proper error handling
async function getCurrentUser() {
    const token = getAuthToken();
    
    if (!token) {
        console.log('No token found');
        return null;
    }
    
    try {
        console.log('Fetching user profile from API...');
        
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Profile API response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Token expired or invalid');
                // Token is invalid, remove it and redirect
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('eventhub_user');
                window.location.href = 'login.html';
                return null;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Profile API response data:', data);
        
        if (data.success) {
            // Store user data in session storage for quick access
            sessionStorage.setItem('eventhub_user', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || 'Failed to fetch user profile');
        }
        
    } catch (error) {
        console.error('Get user error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showNotification('Unable to connect to server. Please check your internet connection.', 'error');
        }
        
        return null;
    }
}

// Enhanced populateUserProfile with role-based support
function populateUserProfile(user, artistData = null, organizerData = null) {
    console.log('Populating UI with user data:', { user, artistData, organizerData });

    try {
        // Header info (like name, email, location)
        updateProfileHeader(user);

        // Stats (events attended, organized, etc.)
        updateProfileStats(user);

        // Base profile form (name, email, phone, etc.)
        populateBaseProfileFields(user);

        const currentRole = getCurrentRole();

        switch(currentRole) {
            case 'artist':
                if (artistData) populateArtistFields(artistData);
                break;
            case 'organizer':
                if (organizerData) populateOrganizerFields(organizerData);
                break;
            case 'admin':
                // Add admin-specific UI population if needed
                break;
        }

        if (user.interests) {
            updateUserPreferences(user.interests);
            renderPreferences();
        }

        console.log('✅ UI populated successfully for role:', currentRole);
    } catch (error) {
        console.error('❌ Error populating UI:', error);
        showNotification('Error displaying profile data', 'error');
    }
}

// Helper functions for modularity:

function updateProfileHeader(user) {
    const nameElement = document.getElementById('userName') || 
                        document.getElementById('orgName') || 
                        document.getElementById('artistName') || 
                        document.getElementById('adminName');

    const emailElement = document.getElementById('userEmail') || 
                         document.getElementById('orgContact') || 
                         document.getElementById('adminEmail');

    const locationElement = document.getElementById('userLocation') || 
                            document.getElementById('orgLocation') || 
                            document.getElementById('artistLocation');

    if (nameElement) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        nameElement.textContent = fullName || user.name || 'User';
    }

    if (emailElement) {
        emailElement.textContent = user.email || user.contactEmail || 'Email not provided';
    }

    if (locationElement) {
        const displayLocation = user.location || user.orgLocation || user.artistLocation || 'Not specified';
        locationElement.textContent = `📍 ${displayLocation.charAt(0).toUpperCase()}${displayLocation.slice(1)}`;
    }
}

function updateProfileStats(user) {
    const stats = {
        'eventsAttended': user.eventsAttended,
        'eventsInterested': user.eventsInterested,
        'reviewsWritten': user.reviewsWritten,
        'eventsOrganized': user.eventsOrganized,
        'totalAttendees': user.totalAttendees,
        'orgRating': user.orgRating,
        'performances': user.performances,
        'merchItems': user.merchItems,
        'artistRating': user.artistRating,
        'totalUsers': user.totalUsers,
        'totalEvents': user.totalEvents,
        'reports': user.reports
    };

    Object.entries(stats).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value !== undefined ? value : '0';
    });
}

function populateBaseProfileFields(user) {
    const formFields = {
        'firstName': user.firstName || '',
        'lastName': user.lastName || '',
        'email': user.email || '',
        'phone': user.phone || '',
        'location': user.location || '',
        'role': user.roles?.[0] || 'user',
        'dateOfBirth': formatDateForInput(user.dateOfBirth),
        'bio': user.bio || '',
        'newsletter': !!user.newsletter
    };

    Object.entries(formFields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;

        if (field.type === 'checkbox') {
            field.checked = Boolean(value);
        } else {
            field.value = value || '';
            if (id === 'email') {
                field.readOnly = false;
                field.style.backgroundColor = '#f8f8f8';
                field.style.border = '1px solid #ddd';
            }
        }
    });
}

// Helper to format date string to YYYY-MM-DD for input[type="date"]
function formatDateForInput(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function populateArtistFields(artistData) {
    const artistFields = {
        'artistStageName': artistData.name || '',
        'artistBio': artistData.bio || '',
        'artistGenre': artistData.genre || 'other',
        'artistFacebook': artistData.social?.facebook || '',
        'artistInstagram': artistData.social?.instagram || '',
        'artistTwitter': artistData.social?.twitter || '',
        'artistYouTube': artistData.social?.youtube || '',
        'artistMinFee': artistData.minFee || '',
        'artistTravel': artistData.travelPreference || 'locally'
    };
    
    Object.entries(artistFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
}

function populateOrganizerFields(organizerData) {
    const organizerFields = {
        'orgName': organizerData.organizationName || '',
        'orgDescription': organizerData.description || '',
        'orgContactEmail': organizerData.contactEmail || '',
        'orgContactPhone': organizerData.contactPhone || '',
        'orgWebsite': organizerData.website || '',
        'orgLogo': organizerData.logo || ''
    };
    
    Object.entries(organizerFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
}

// Utility function to format date for input[type=date]
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// Helper function to get current role from UI
function getCurrentRole() {
    const roleSelect = document.getElementById('currentRole');
    return roleSelect ? roleSelect.value : 'user';
}

// Update user preferences
function updateUserPreferences(userInterests) {
    console.log('Updating preferences with user interests:', userInterests);
    preferences.forEach(pref => {
        pref.selected = userInterests.includes(pref.id);
    });
}

// Initialize preferences section
function initializePreferences() {
    renderPreferences();
}

// Render preferences in the UI
function renderPreferences() {
    const preferencesContainer = document.getElementById('preferencesContainer');
    if (!preferencesContainer) {
        console.log('Preferences container not found');
        return;
    }
    
    preferencesContainer.innerHTML = preferences.map(pref => `
        <div class="preference-item" data-id="${pref.id}">
            <span class="preference-icon">${pref.icon}</span>
            <span class="preference-name">${pref.name}</span>
            <input type="checkbox" ${pref.selected ? 'checked' : ''} onchange="togglePreference('${pref.id}')">
        </div>
    `).join('');
}

// Toggle preference selection
function togglePreference(preferenceId) {
    const preference = preferences.find(p => p.id === preferenceId);
    if (preference) {
        preference.selected = !preference.selected;
        console.log(`Toggled preference ${preferenceId}:`, preference.selected);
    }
}

// Initialize profile form with proper validation
function initializeProfileForm() {
    const profileForm = document.getElementById('profileForm');
    
    if (!profileForm) {
        console.log('Profile form not found');
        return;
    }
    
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Profile form submitted');
        updateUserProfile();
    });
    
    console.log('Profile form initialized');
}

// Enhanced email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Enhanced profile update function with role-based support
async function updateUserProfile() {
    console.log('Starting profile update...');
    
    // Check authentication before proceeding
    if (!isAuthenticated()) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }
    
    // Get base user form data
    const formData = {
        firstName: document.getElementById('firstName')?.value?.trim() || '',
        lastName: document.getElementById('lastName')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || '',
        location: document.getElementById('location')?.value || '',
        bio: document.getElementById('bio')?.value?.trim() || '',
        dateOfBirth: document.getElementById('dateOfBirth')?.value || '',
        newsletter: document.getElementById('newsletter')?.checked || false,
        interests: getSelectedInterests() // Helper function to get selected interests
    };

    // Get role-specific data based on current role
    const currentRole = getCurrentRole(); // Should return 'user', 'organizer', 'artist', or 'admin'
    
    // Prepare role-specific data objects
    if (currentRole === 'artist') {
        formData.artistData = {
            stageName: document.getElementById('artistStageName')?.value?.trim() || '',
            bio: document.getElementById('artistBio')?.value?.trim() || '',
            genre: document.getElementById('artistGenre')?.value || '',
            website: document.getElementById('artistWebsite')?.value?.trim() || '',
            facebook: document.getElementById('artistFacebook')?.value?.trim() || '',
            instagram: document.getElementById('artistInstagram')?.value?.trim() || '',
            twitter: document.getElementById('artistTwitter')?.value?.trim() || '',
            youtube: document.getElementById('artistYouTube')?.value?.trim() || '',
            profileImage: document.getElementById('artistProfileImage')?.value?.trim() || '',
            minFee: document.getElementById('artistMinFee')?.value || 0,
            travelPreference: document.getElementById('artistTravel')?.value || 'locally'
        };
    } else if (currentRole === 'organizer') {
        formData.organizerData = {
            organizationName: document.getElementById('orgName')?.value?.trim() || '',
            description: document.getElementById('orgDescription')?.value?.trim() || '',
            contactEmail: document.getElementById('orgContactEmail')?.value?.trim() || '',
            contactPhone: document.getElementById('orgContactPhone')?.value?.trim() || '',
            website: document.getElementById('orgWebsite')?.value?.trim() || '',
            logo: document.getElementById('orgLogo')?.value?.trim() || ''
        };
    }

    console.log('=== DEBUG: Form data before validation ===');
    console.log('Base profile data:', formData);
    if (currentRole === 'artist') console.log('Artist data:', formData.artistData);
    if (currentRole === 'organizer') console.log('Organizer data:', formData.organizerData);
    
    // Enhanced validation
    const validationErrors = validateProfileData(formData, currentRole);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => showNotification(error, 'error'));
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#profileForm button[type="submit"]') || 
                     document.querySelector(`#${currentRole}Tab button[type="button"]`);
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.textContent = '💾 Saving...';
        submitBtn.disabled = true;
    }
    
    try {
        // Send the update request
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const data = await response.json();
        
        // Update UI with new data
        updateProfileUI(data.user, data.artistData, data.organizerData);
        showNotification('Profile updated successfully!', 'success');
        console.log('Profile updated successfully:', data);
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Helper function to validate profile data
function validateProfileData(formData, currentRole) {
    const errors = [];
    const validLocations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'other'];
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Base profile validation
    if (!formData.firstName || !formData.lastName) {
        errors.push('First name and last name are required');
    } else if (formData.firstName.length < 2 || formData.lastName.length < 2) {
        errors.push('First name and last name must be at least 2 characters long');
    }

    if (!formData.email) {
        errors.push('Email address is required');
    } else if (!emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!formData.phone) {
        errors.push('Phone number is required');
    } else if (!phoneRegex.test(formData.phone)) {
        errors.push('Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)');
    }

    if (!formData.location) {
        errors.push('Location is required');
    } else if (!validLocations.includes(formData.location.toLowerCase())) {
        errors.push('Please select a valid location');
    }

    if (formData.bio && formData.bio.length > 500) {
        errors.push('Bio must be less than 500 characters');
    }

    // Role-specific validation
    if (currentRole === 'artist') {
        if (!formData.artistData.stageName) {
            errors.push('Stage name is required for artists');
        }
        if (!formData.artistData.genre) {
            errors.push('Genre is required for artists');
        }
    }

    if (currentRole === 'organizer') {
        if (!formData.organizerData.organizationName) {
            errors.push('Organization name is required for organizers');
        }
        if (!formData.organizerData.contactEmail) {
            errors.push('Contact email is required for organizers');
        }
        if (!formData.organizerData.contactPhone) {
            errors.push('Contact phone is required for organizers');
        }
    }

    return errors;
}

// Helper function to update UI after successful update
function updateProfileUI(userData, artistData, organizerData) {
    // Update base profile fields
    if (userData.firstName) document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
    if (userData.email) document.getElementById('userEmail').textContent = userData.email;
    if (userData.location) document.getElementById('userLocation').textContent = `📍 ${userData.location}`;
    
    // Update form fields
    const fieldsToUpdate = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        dateOfBirth: userData.dateOfBirth,
        newsletter: userData.newsletter
    };
    
    Object.entries(fieldsToUpdate).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value || '';
            }
        }
    });
    
    // Update role-specific UI
    const currentRole = getCurrentRole();
    if (currentRole === 'artist' && artistData) {
        const artistFields = {
            artistStageName: artistData.stageName,
            artistBio: artistData.bio,
            artistGenre: artistData.genre,
            artistWebsite: artistData.website,
            artistFacebook: artistData.facebook,
            artistInstagram: artistData.instagram,
            artistTwitter: artistData.twitter,
            artistYouTube: artistData.youtube,
            artistProfileImage: artistData.profileImage,
            artistMinFee: artistData.minFee,
            artistTravel: artistData.travelPreference
        };
        
        Object.entries(artistFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        });
    }
    
    if (currentRole === 'organizer' && organizerData) {
        const organizerFields = {
            orgName: organizerData.organizationName,
            orgDescription: organizerData.description,
            orgContactEmail: organizerData.contactEmail,
            orgContactPhone: organizerData.contactPhone,
            orgWebsite: organizerData.website,
            orgLogo: organizerData.logo
        };
        
        Object.entries(organizerFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        });
    }
    
    // Update stats and other UI elements as needed
    updateProfileStats(userData, artistData, organizerData);
}

// Helper function to get selected interests
function getSelectedInterests() {
    return Array.from(document.querySelectorAll('.interest-checkbox:checked')).map(el => el.value);
}

// Helper function to get current role
function getCurrentRole() {
    const roleSelect = document.getElementById('currentRole');
    return roleSelect ? roleSelect.value : 'user';
}

// Update profile API call with proper authentication and error handling
async function updateProfile(profileData) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('Sending profile update to API...');
    console.log('Profile data being sent:', profileData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(profileData)
        });
        
        console.log('Profile update response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Handle different response types
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const responseText = await response.text();
            console.log('Non-JSON response received:', responseText);
            
            // Try to parse as JSON anyway
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
            }
        }
        
        console.log('Profile update response data:', data);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('eventhub_user');
                throw new Error('Session expired. Please log in again.');
            } else if (response.status === 400) {
                // Validation error - show specific error message
                const errorMessage = data.message || 'Validation error occurred';
                console.error('Validation error details:', data);
                throw new Error(errorMessage);
            } else if (response.status === 409) {
                // Conflict - likely duplicate email
                throw new Error('Email address is already in use by another account');
            } else if (response.status >= 500) {
                // Server error
                console.error('Server error details:', data);
                throw new Error('Server error occurred. Please try again later.');
            } else {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
        }
        
        if (data.success) {
            // Update session storage with new user data
            sessionStorage.setItem('eventhub_user', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || 'Profile update failed');
        }
        
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        
        throw error;
    }
}

// Tab functionality
function showTab(tabName) {
    console.log('Showing tab:', tabName);
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const clickedBtn = event ? event.target : document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to selected tab button
    const selectedBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Load tab-specific content
    if (tabName === 'events') {
        loadUserEvents();
    } else if (tabName === 'preferences') {
        renderPreferences();
    }
}

// Load user events
function loadUserEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = userEvents.map(event => `
        <div class="event-item ${event.status}">
            <div class="event-icon">${event.icon}</div>
            <div class="event-details">
                <h4>${event.title}</h4>
                <p>📅 ${new Date(event.date).toLocaleDateString()}</p>
                <p>📍 ${event.location}</p>
                <span class="event-status status-${event.status}">${event.status.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
}

// Add these functions after the loadUserEvents function
let currentFilter = 'all';

function filterEvents(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.event-filters button').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
    
    // Filter and display events
    const filteredEvents = filter === 'all' ? userEvents : userEvents.filter(event => event.status === filter);
    displayFilteredEvents(filteredEvents);
}

function displayFilteredEvents(events) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p class="no-events">No events found for this filter.</p>';
        return;
    }
    
    eventsContainer.innerHTML = events.map(event => `
        <div class="event-item ${event.status}">
            <div class="event-icon">${event.icon}</div>
            <div class="event-details">
                <h4>${event.title}</h4>
                <p>📅 ${new Date(event.date).toLocaleDateString()}</p>
                <p>📍 ${event.location}</p>
                <span class="event-status status-${event.status}">${event.status.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    
    // Add animation keyframes if not exists
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Allow manual close on click
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    });
}

// Utility function to format phone numbers
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 254, add +
    if (cleaned.startsWith('254')) {
        return '+' + cleaned;
    }
    
    // If starts with 0, replace with +254
    if (cleaned.startsWith('0')) {
        return '+254' + cleaned.substring(1);
    }
    
    // If 9 digits, assume it's missing country code
    if (cleaned.length === 9) {
        return '+254' + cleaned;
    }
    
    return phone; // Return as is if format is unclear
}

// Add phone number formatting to the phone input
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (this.value) {
                this.value = formatPhoneNumber(this.value);
            }
        });
    }
});

// Handle logout button
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out?')) {
                logout();
            }
        });
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAuthToken,
        isAuthenticated,
        formatPhoneNumber,
        validLocations,
        preferences,
        isValidEmail
    };
}

// Privacy Settings Functions
function toggleSetting(toggleElement) {
    toggleElement.classList.toggle('active');
    
    // Get the setting name from the label
    const label = toggleElement.parentElement.querySelector('label').textContent;
    const isActive = toggleElement.classList.contains('active');
    
    console.log(`Setting "${label}" changed to:`, isActive);
    
    // You can add logic here to save the setting to the backend
    // For now, just show a notification
    showNotification(`${label} ${isActive ? 'enabled' : 'disabled'}`, 'info');
}

// Save all privacy settings
async function savePrivacySettings() {
    try {
        // Collect all privacy settings
        const privacySettings = {
            profilePublic: document.querySelector('.privacy-toggle:nth-child(1) .toggle-switch').classList.contains('active'),
            showAttendedEvents: document.querySelector('.privacy-toggle:nth-child(2) .toggle-switch').classList.contains('active'),
            allowEmailDiscovery: document.querySelector('.privacy-toggle:nth-child(3) .toggle-switch').classList.contains('active'),
            receiveRecommendations: document.querySelector('.privacy-toggle:nth-child(4) .toggle-switch').classList.contains('active'),
            emailNotifications: document.querySelector('.privacy-toggle:nth-child(5) .toggle-switch').classList.contains('active'),
            smsNotifications: document.querySelector('.privacy-toggle:nth-child(6) .toggle-switch').classList.contains('active')
        };
        
        console.log('Saving privacy settings:', privacySettings);
        
        // Call API to save settings (you'll need to implement this endpoint)
        const response = await fetch(`${API_BASE_URL}/auth/privacy-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(privacySettings)
        });
        
        if (response.ok) {
            showNotification('Privacy settings updated successfully!', 'success');
        } else {
            throw new Error('Failed to save privacy settings');
        }
        
    } catch (error) {
        console.error('Error saving privacy settings:', error);
        showNotification('Failed to save privacy settings. Please try again.', 'error');
    }
}

// Security Functions
function changePassword() {
    // Create a modal for password change
    const modal = createModal('Change Password', `
        <form id="changePasswordForm">
            <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" name="currentPassword" required>
            </div>
            <div class="form-group">
                <label for="newPassword">New Password</label>
                <input type="password" id="newPassword" name="newPassword" required minlength="8">
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Change Password</button>
            </div>
        </form>
    `);
    
    // Handle form submission
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Password changed successfully!', 'success');
                closeModal();
            } else {
                showNotification(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('Failed to change password. Please try again.', 'error');
        }
    });
}

function setup2FA() {
    showNotification('Two-Factor Authentication setup coming soon!', 'info');
    // You can implement 2FA setup logic here
}

function manageSessions() {
    // Create a modal to show active sessions
    const modal = createModal('Active Sessions', `
        <div id="sessionsContainer">
            <div class="session-item">
                <div class="session-info">
                    <h4>Current Session</h4>
                    <p>🖥️ ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} - ${navigator.platform}</p>
                    <p>📍 Current Location</p>
                    <p>🕒 Active Now</p>
                </div>
                <span class="session-status current">Current</span>
            </div>
        </div>
        <div class="modal-buttons">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button type="button" class="btn btn-danger" onclick="logoutAllSessions()">Logout All Other Sessions</button>
        </div>
    `);
}

function logoutAllSessions() {
    if (confirm('Are you sure you want to logout all other sessions? This will end all active sessions except the current one.')) {
        // Implement logout all sessions logic
        showNotification('All other sessions have been terminated', 'success');
        closeModal();
    }
}

function logout() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('eventhub_user');
    localStorage.removeItem('currentRole');
    window.location.href = 'login.html';
}

async function downloadData() {
    try {
        showNotification('Preparing your data download...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/auth/download-data`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-eventhub-data.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Your data has been downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download data');
        }
    } catch (error) {
        console.error('Error downloading data:', error);
        showNotification('Failed to download data. Please try again.', 'error');
    }
}

function deleteAccount() {
    const modal = createModal('Delete Account', `
        <div class="warning-message">
            <h3>⚠️ This action cannot be undone!</h3>
            <p>Deleting your account will permanently remove:</p>
            <ul>
                <li>Your profile information</li>
                <li>Your event history</li>
                <li>Your preferences and settings</li>
                <li>All associated data</li>
            </ul>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input type="text" id="deleteConfirmation" placeholder="Type DELETE">
        </div>
        <div class="modal-buttons">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="confirmDeleteAccount()">Delete My Account</button>
        </div>
    `);
}

async function confirmDeleteAccount() {
    const confirmation = document.getElementById('deleteConfirmation').value;
    
    if (confirmation !== 'DELETE') {
        showNotification('Please type DELETE to confirm', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            showNotification('Your account has been deleted successfully', 'success');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            throw new Error('Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account. Please try again.', 'error');
    }
}

// Modal utility functions
function createModal(title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not present
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .modal-content {
                background: white;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }
            .modal-body {
                padding: 20px;
            }
            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .warning-message {
                text-align: center;
                color: #dc2626;
            }
            .warning-message ul {
                text-align: left;
                margin: 15px 0;
            }
            .session-item {
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .session-status.current {
                background: #10b981;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    return modal;
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}

        // Current role state
        function getCurrentRole() {
  return localStorage.getItem('currentRole') || 'user';
}
        
        // Initialize the profile view
        function initProfile() {
            // Load the user's roles from the server
            // For demo purposes, we'll assume the user has all roles
            const userRoles = ['user', 'organizer', 'artist', 'admin'];
            
            // Populate the role selector
            const roleSelect = document.getElementById('currentRole');
            roleSelect.innerHTML = '';
            
            userRoles.forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = getRoleDisplayName(role);
                roleSelect.appendChild(option);
            });}
            
            // Set the initial role
// Switch between different role profiles
function switchRole(role, user = null, artistData = null, organizerData = null) {
    localStorage.setItem('currentRole', role);
    currentRole = role;

    // Inject templates into the DOM
    renderProfileContent(role);

    // Load role-specific stats (mock/stats)
    loadRoleData(role);

    // ✅ Populate user profile AFTER templates have been rendered
    if (user) {
        setTimeout(() => {
            populateUserProfile(user, artistData, organizerData);
        }, 100);
    }
}

// Get display name for a role
function getRoleDisplayName(role) {
    switch(role) {
        case 'user': return 'Event Attendee';
        case 'organizer': return 'Event Organizer';
        case 'artist': return 'Artist/Performer';
        case 'admin': return 'Administrator';
        default: return role;
    }
}

// Load data specific to the current role
function loadRoleData(role) {
    console.log(`Loading data for ${role} role`);
    setTimeout(() => {
        if (role === 'user') {
            document.getElementById('eventsAttended').textContent = '12';
            document.getElementById('eventsInterested').textContent = '5';
            document.getElementById('reviewsWritten').textContent = '8';
        } else if (role === 'organizer') {
            document.getElementById('eventsOrganized').textContent = '7';
            document.getElementById('totalAttendees').textContent = '1,245';
            document.getElementById('orgRating').textContent = '4.2';
        } else if (role === 'artist') {
            document.getElementById('performances').textContent = '32';
            document.getElementById('merchItems').textContent = '5';
            document.getElementById('artistRating').textContent = '4.7';
        } else if (role === 'admin') {
            document.getElementById('totalUsers').textContent = '1,542';
            document.getElementById('totalEvents').textContent = '287';
            document.getElementById('reports').textContent = '12';
        }
    }, 500);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (!isAuth) return;

    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        const data = await response.json();
        if (!data.success || !data.user) throw new Error('Invalid profile data');

        const role = localStorage.getItem('currentRole') ||
                     (data.user.roles.includes('organizer') ? 'organizer' :
                     data.user.roles.includes('artist') ? 'artist' : 'user');

        localStorage.setItem('currentRole', role);

        // ✅ Inject templates, then populate with user data
        switchRole(role, data.user, data.artistData, data.organizerData);

        initializeProfileForm();
        initializePreferences();
    } catch (err) {
        console.error('Profile loading failed:', err);
        showNotification('Failed to load profile data', 'error');
    }
});

   
// document.addEventListener('DOMContentLoaded', () => {
//     const form = document.getElementById('profileForm');
//     if (form) {
//         form.addEventListener('submit', function(e) {
//             e.preventDefault();
//             updateUserProfile();
//         });
//     }
// }); 

// window.onload = async function () {
//   const isAuth = await checkAuth();
//   if (!isAuth) return;

// //   const userData = await getCurrentUser();
//   if (!userData) return;

//   const defaultRole = userData.roles.includes('organizer') ? 'organizer' :
//                       userData.roles.includes('artist') ? 'artist' : 'user';
//   setCurrentRole(defaultRole);

//   renderProfileContent(defaultRole); // 👈 Load role-specific DOM structure
//   await loadProfile();               // 👈 Then populate it
// };