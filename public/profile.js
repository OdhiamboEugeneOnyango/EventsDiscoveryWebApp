// Enhanced Profile JavaScript - Fixed Authentication Issues and Email Updates

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Authentication utility functions
function getAuthToken() {
    return localStorage.getItem('eventhub_token');
}

function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    
    try {
        // Check if token is expired (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        return payload.exp > now;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

function logout() {
    localStorage.removeItem('eventhub_token');
    localStorage.removeItem('eventhub_remember');
    sessionStorage.removeItem('eventhub_user');
    window.location.href = 'login.html';
}

// Sample data for demonstration
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

// Fixed preferences array - matches backend enum exactly
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

// Valid locations that match backend enum exactly
const validLocations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'other'];

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page initializing...');
    
    // Check authentication first
    if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        showNotification('Please log in to access this page', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('User authenticated, loading profile...');
    
    // Load user profile
    loadUserProfile();
    
    // Initialize form handlers
    initializeProfileForm();
    
    // Initialize preferences
    initializePreferences();
    
    // Load default tab content
    showTab('profile');
});

// Load user profile data
async function loadUserProfile() {
    console.log('Loading user profile...');
    
    try {
        const user = await getCurrentUser();
        if (user) {
            console.log('User data loaded:', user);
            populateUserProfile(user);
        } else {
            console.log('Failed to load user data');
            showNotification('Failed to load profile data', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data. Please refresh the page.', 'error');
    }
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Profile API response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Token expired or invalid');
                // Token is invalid, remove it and redirect
                localStorage.removeItem('eventhub_token');
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

// Populate user profile in UI
function populateUserProfile(user) {
    console.log('Populating UI with user data:', user);
    
    try {
        // Update header information
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userLocation = document.getElementById('userLocation');
        
        if (userName) {
            userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        }
        
        if (userEmail) {
            userEmail.textContent = user.email || '';
        }
        
        if (userLocation) {
            // Capitalize location for display
            const displayLocation = user.location ? 
                user.location.charAt(0).toUpperCase() + user.location.slice(1) : 'Not specified';
            userLocation.textContent = `📍 ${displayLocation}`;
        }
        
        // Update stats (these would come from API in real implementation)
        const eventsAttended = document.getElementById('eventsAttended');
        const eventsInterested = document.getElementById('eventsInterested');
        const reviewsWritten = document.getElementById('reviewsWritten');
        
        if (eventsAttended) eventsAttended.textContent = user.eventsAttended || '0';
        if (eventsInterested) eventsInterested.textContent = user.eventsInterested || '0';
        if (reviewsWritten) reviewsWritten.textContent = user.reviewsWritten || '0';
        
        // Populate form fields - EMAIL IS NOW EDITABLE
        const formFields = {
            'firstName': user.firstName || '',
            'lastName': user.lastName || '',
            'email': user.email || '', // Now editable
            'phone': user.phone || '',
            'location': user.location || '',
            'role': user.role || 'user', // Default to 'user' if not set
            'interests': user.interests || [],
            'dateOfBirth': user.dateOfBirth || '',
            'bio': user.bio || ''
        };
        
        Object.keys(formFields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = formFields[fieldId];
                // Remove readonly restriction from email field
                field.readOnly = false;
                field.style.backgroundColor = '';
                field.style.cursor = '';
            }
        });
        
        // Update newsletter checkbox
        const newsletterCheckbox = document.getElementById('newsletter');
        if (newsletterCheckbox) {
            newsletterCheckbox.checked = user.newsletter || false;
        }
        
        // Update preferences if available
        if (user.interests) {
            updateUserPreferences(user.interests);
            renderPreferences();
        }
        
        console.log('UI populated successfully');
        
    } catch (error) {
        console.error('Error populating UI:', error);
        showNotification('Error displaying profile data', 'error');
    }
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

// Update user profile with proper error handling and email support
async function updateUserProfile() {
    console.log('Starting profile update...');
    
    // Check authentication before proceeding
    if (!isAuthenticated()) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }
    
    // Get form data - NOW INCLUDING EMAIL
    const formData = {
        firstName: document.getElementById('firstName')?.value?.trim() || '',
        lastName: document.getElementById('lastName')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '', // Email is now included
        phone: document.getElementById('phone')?.value?.trim() || '',
        location: document.getElementById('location')?.value || '',
        role: document.getElementById('role')?.value || 'user', // Default to 'user'
        interests: preferences.filter(p => p.selected).map(p => p.id),                   
        newsletter: document.getElementById('newsletter')?.checked || false

    };
    
    // Include bio and dateOfBirth if they exist
    const bioField = document.getElementById('bio');
    const dobField = document.getElementById('dateOfBirth');
    
    if (bioField && bioField.value.trim()) {
        formData.bio = bioField.value.trim();
    }
    
    if (dobField && dobField.value) {
        formData.dateOfBirth = dobField.value;
    }
    
    console.log('=== DEBUG: Form data before validation ===');
    console.log('firstName:', formData.firstName);
    console.log('lastName:', formData.lastName);
    console.log('email:', formData.email);
    console.log('phone:', formData.phone);
    console.log('location:', formData.location);
    console.log('role:', formData.role);
    console.log('interests:', formData.interests);
    console.log('bio:', formData.bio);
    console.log('newsletter:', formData.newsletter);
    console.log('Full form data:', formData);
    
    // Enhanced validation with email
    if (!formData.firstName || !formData.lastName) {
        showNotification('First name and last name are required', 'error');
        return;
    }
    
    if (formData.firstName.length < 2 || formData.lastName.length < 2) {
        showNotification('First name and last name must be at least 2 characters long', 'error');
        return;
    }
    
    if (!formData.email) {
        showNotification('Email address is required', 'error');
        return;
    }
    
    if (!isValidEmail(formData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!formData.phone) {
        showNotification('Phone number is required', 'error');
        return;
    }
    
    if (!formData.location) {
        showNotification('Location is required', 'error');
        return;
    }
    if (!formData.role) {
        showNotification('Role is required', 'error');
        return;
    }

    if (formData.interests.length === 0) {
        showNotification('Please select at least one interest', 'error');
        return;
    }

    if (formData.bio && formData.bio.length > 500) {
        showNotification('Bio must be less than 500 characters', 'error');
        return;
    }

    if (formData.dateOfBirth && isNaN(new Date(formData.dateOfBirth).getTime())) {
        showNotification('Please enter a valid date of birth', 'error');
        return;
    }

    
    // Validate phone format
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
        showNotification('Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)', 'error');
        return;
    }
    
    // Validate location
    if (!validLocations.includes(formData.location.toLowerCase())) {
        showNotification('Please select a valid location', 'error');
        return;
    }
    // Validate role
    const validRoles = ['user', 'organizer', 'artist', 'admin'];
    if (!validRoles.includes(formData.role)) {
        showNotification('Please select a valid account type', 'error');
        return;
    }
    
    // Convert location to lowercase for backend
    formData.location = formData.location.toLowerCase();
    
    console.log('=== DEBUG: Form data after validation ===');
    console.log('Validated form data:', formData);
    
    // Show loading state
    const submitBtn = document.querySelector('#profileForm button[type="submit"]');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '💾 Saving...';
    submitBtn.disabled = true;
    
    try {
        const updatedUser = await updateProfile(formData);
        
        if (updatedUser) {
            // Update UI with new data
            populateUserProfile(updatedUser);
            showNotification('Profile updated successfully!', 'success');
            console.log('Profile updated successfully');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
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
                'Authorization': `Bearer ${token}`
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
                localStorage.removeItem('eventhub_token');
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