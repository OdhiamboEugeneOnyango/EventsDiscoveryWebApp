// Authentication JavaScript

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Form validation patterns
const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+254|0)[17]\d{8}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    adminInviteCode: /^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}$/ // Format: XXXXXXXX-XXXX-XXXX
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        initializeLoginForm();
    }
    
    if (signupForm) {
        initializeSignupForm();
    }
});

// Initialize Login Form
function initializeLoginForm() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateLoginForm()) {
            performLogin();
        }
    });
    
    // Add real-time validation
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    emailInput.addEventListener('blur', () => validateField('email', emailInput.value, 'emailError'));
    passwordInput.addEventListener('blur', () => validateField('password', passwordInput.value, 'passwordError'));
}

// Initialize Signup Form
function initializeSignupForm() {
    const form = document.getElementById('signupForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateSignupForm()) {
            performSignup();
        }
    });
    
    // Add real-time validation
    const inputs = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        role: document.getElementById('role'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        adminInviteCode: document.getElementById('adminInviteCode')
    };
        
    // Add event listeners for real-time validation
    Object.keys(inputs).forEach(key => {
        if (inputs[key]) {
            inputs[key].addEventListener('blur', () => {
                validateField(key, inputs[key].value, key + 'Error');
            });
            
            if (key === 'password') {
                inputs[key].addEventListener('input', () => {
                    checkPasswordStrength(inputs[key].value);
                    if (inputs.confirmPassword.value) {
                        validateField('confirmPassword', inputs.confirmPassword.value, 'confirmPasswordError');
                    }
                });
            }
            
            if (key === 'confirmPassword') {
                inputs[key].addEventListener('input', () => {
                    validateField('confirmPassword', inputs[key].value, 'confirmPasswordError');
                });
            }
        }
    });
    // Handle role selection changes
    handleRoleSelection();
}

// Handle role selection changes
function handleRoleSelection() {
    const roleSelect = document.getElementById('role');
    const adminSection = document.getElementById('adminInviteSection');
    
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            if (this.value === 'admin') {
                adminSection.style.display = 'block';
                document.getElementById('adminInviteCode').required = true;
            } else {
                adminSection.style.display = 'none';
                document.getElementById('adminInviteCode').required = false;
                document.getElementById('adminInviteCode').value = '';
                clearError('adminInviteCodeError');
            }
        });
    }
}

// Validate Login Form
function validateLoginForm() {
    let isValid = true;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginRole = document.getElementById('loginRole').value;
    
    if (!validateField('email', email, 'emailError')) {
        isValid = false;
    }
    
    if (!validateField('password', password, 'passwordError')) {
        isValid = false;
    }

     if (!validateField('loginRole', loginRole, 'loginRoleError')) {
        isValid = false;
    }
    
    return isValid;
}

// Validate Signup Form
function validateSignupForm() {
    let isValid = true;
    
    const fields = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        role: document.getElementById('role').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
    // Add admin invite code validation if role is admin
    const role = document.getElementById('role').value;
    if (role === 'admin') {
        const adminInviteCode = document.getElementById('adminInviteCode').value;
        if (!validateField('adminInviteCode', adminInviteCode, 'adminInviteCodeError')) {
            isValid = false;
        }
    }

    // Validate each field
    Object.keys(fields).forEach(key => {
        if (!validateField(key, fields[key], key + 'Error')) {
            isValid = false;
        }
    });
    
    // Check terms agreement
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
        showError('agreeTermsError', 'You must agree to the Terms of Service');
        isValid = false;
    } else {
        clearError('agreeTermsError');
    }
    
    return isValid;
}

// Validate individual field
function validateField(fieldName, value, errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error
    clearError(errorElementId);
    
    switch (fieldName) {
        case 'firstName':
        case 'lastName':
            if (!value.trim()) {
                errorMessage = `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
                isValid = false;
            } else if (value.length < 2) {
                errorMessage = `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
                isValid = false;
            }
            break;
            
        case 'email':
            if (!value.trim()) {
                errorMessage = 'Email is required';
                isValid = false;
            } else if (!validationPatterns.email.test(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
            break;
            
        case 'phone':
            if (!value.trim()) {
                errorMessage = 'Phone number is required';
                isValid = false;
            } else if (!validationPatterns.phone.test(value)) {
                errorMessage = 'Please enter a valid Kenyan phone number (e.g., +254712345678)';
                isValid = false;
            }
            break;
            
        case 'location':
            if (!value) {
                errorMessage = 'Please select your location';
                isValid = false;
            }
            break;
            
        case 'password':
            if (!value) {
                errorMessage = 'Password is required';
                isValid = false;
            } else if (!validationPatterns.password.test(value)) {
                errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
                isValid = false;
            }
            break;
            
        case 'confirmPassword':
            const password = document.getElementById('password').value;
            if (!value) {
                errorMessage = 'Please confirm your password';
                isValid = false;
            } else if (value !== password) {
                errorMessage = 'Passwords do not match';
                isValid = false;
            }
            break;
    
        case 'role':
        case 'loginRole':
            if (!value) {
                errorMessage = fieldName === 'role' ? 'Please select an account type' : 'Please select your role';
                isValid = false;
            }
            break;

        case 'adminInviteCode':
            if (!value.trim()) {
                errorMessage = 'Admin invitation code is required';
                isValid = false;
            } else if (!validationPatterns.adminInviteCode.test(value)) {
                errorMessage = 'Invalid invitation code format';
                isValid = false;
            }
            break;

    }
    
    if (!isValid) {
        showError(errorElementId, errorMessage);
    }
    
    return isValid;
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Clear error message
function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    if (!strengthElement) return;
    
    let strength = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength++;
    else feedback.push('Lowercase letter');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('Uppercase letter');
    
    // Number check
    if (/\d/.test(password)) strength++;
    else feedback.push('Number');
    
    // Special character check
    if (/[@$!%*?&]/.test(password)) strength++;
    else feedback.push('Special character');
    
    // Update strength indicator
    let strengthText = '';
    let strengthClass = '';
    
    if (strength === 0) {
        strengthText = '';
    } else if (strength <= 2) {
        strengthText = 'Weak';
        strengthClass = 'weak';
    } else if (strength <= 4) {
        strengthText = 'Medium';
        strengthClass = 'medium';
    } else {
        strengthText = 'Strong';
        strengthClass = 'strong';
    }
    
    if (feedback.length > 0 && password.length > 0) {
        strengthText += ` - Missing: ${feedback.join(', ')}`;
    }
    
    strengthElement.textContent = strengthText;
    strengthElement.className = `password-strength ${strengthClass}`;
}

// Perform login
async function performLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                role: document.getElementById('loginRole').value // Include role in login request
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store session data
            if (rememberMe) {
                localStorage.setItem('eventhub_remember', email);
            }
            
            // Store token and user data
            localStorage.setItem('eventhub_token', data.token);
            sessionStorage.setItem('eventhub_user', JSON.stringify(data.user));
            
            showModal('success', 'Login Successful!', `Welcome back, ${data.user.firstName}! Redirecting...`, () => {
                redirectBasedOnRole(data.user);
            });
        } else {
            showModal('error', 'Login Failed', data.message || 'Invalid email or password. Please try again.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showModal('error', 'Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Perform signup
async function performSignup() {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        role: document.getElementById('role').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        interests: Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(cb => cb.value),
        newsletter: document.getElementById('newsletter').checked,
        adminInviteCode: document.getElementById('adminInviteCode') ? document.getElementById('adminInviteCode').value : null
    };
    
    // Show loading state
    const submitBtn = document.querySelector('#signupForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal('success', 'Account Created!', 'Your account has been created successfully. You can now sign in.', () => {
                window.location.href = 'login.html';
            });
        } else {
            showModal('error', 'Signup Failed', data.message || 'Unable to create account. Please try again.');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showModal('error', 'Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Redirect user based on role after login/signup
function redirectBasedOnRole(user) {
    switch (user.role) {
        case 'admin':
            window.location.href = 'admin.html';
            break;
        case 'organizer':
            window.location.href = 'organizer.html';
            break;
        case 'artist':
            window.location.href = 'artist.html';
            break;
        case 'user':
        default:
            window.location.href = 'index.html';
            break;
    }
}

// Get current user (for protected pages)
async function getCurrentUser() {
    const token = localStorage.getItem('eventhub_token');
    
    if (!token) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.user;
        } else {
            // Token is invalid, remove it
            localStorage.removeItem('eventhub_token');
            sessionStorage.removeItem('eventhub_user');
            return null;
        }
        
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('eventhub_token');
    localStorage.removeItem('eventhub_remember');
    sessionStorage.removeItem('eventhub_user');
    window.location.href = 'login.html';
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('eventhub_token') !== null;
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
}

// Social login
function socialLogin(provider) {
    showModal('info', 'Coming Soon', `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon!`);
}

// Modal functions
function showModal(type, title, message, callback = null) {
    const modal = document.getElementById('authModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalBtn = document.getElementById('modalBtn');
    
    // Set icon based on type
    switch (type) {
        case 'success':
            modalIcon.textContent = '✅';
            modalIcon.style.color = '#10b981';
            break;
        case 'error':
            modalIcon.textContent = '❌';
            modalIcon.style.color = '#ef4444';
            break;
        case 'info':
            modalIcon.textContent = 'ℹ️';
            modalIcon.style.color = '#3b82f6';
            break;
        default:
            modalIcon.textContent = '📋';
    }
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set up callback
    modalBtn.onclick = () => {
        closeModal();
        if (callback) callback();
    };
    
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('authModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Auto-fill remembered email on login page
window.addEventListener('load', function() {
    if (document.getElementById('loginForm')) {
        const rememberedEmail = localStorage.getItem('eventhub_remember');
        if (rememberedEmail) {
            document.getElementById('email').value = rememberedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }
});

// Form enhancement: Enter key navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        const inputs = Array.from(form.querySelectorAll('input:not([type="checkbox"]):not([type="submit"])'));
        const currentIndex = inputs.indexOf(e.target);
        
        if (currentIndex < inputs.length - 1) {
            e.preventDefault();
            inputs[currentIndex + 1].focus();
        }
    }
});

// Authentication check for protected pages
function requireAuth() {
    if (!isAuthenticated()) {
        showModal('error', 'Authentication Required', 'Please log in to access this page.', () => {
            window.location.href = 'login.html';
        });
        return false;
    }
    return true;
}

// Network error handling
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    showModal('error', 'Connection Lost', 'You are currently offline. Please check your internet connection.');
});

// Initialize authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on a protected page
    const currentPage = window.location.pathname;
    const protectedPages = ['/dashboard.html', '/profile.html', '/my-events.html'];
    
    if (protectedPages.some(page => currentPage.includes(page))) {
        requireAuth();
    }
    
    // Update UI based on authentication state
    updateAuthUI();
});

// Update UI elements based on authentication state
function updateAuthUI() {
    const isLoggedIn = isAuthenticated();
    const userData = JSON.parse(sessionStorage.getItem('eventhub_user') || '{}');
    
    // Update navigation or other UI elements
    const authButtons = document.querySelectorAll('.auth-button');
    const userMenus = document.querySelectorAll('.user-menu');
    
    authButtons.forEach(button => {
        button.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    userMenus.forEach(menu => {
        menu.style.display = isLoggedIn ? 'block' : 'none';
        if (isLoggedIn && userData.firstName) {
            const userNameElement = menu.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
            }
        }
    });
}

// Error boundary for unhandled errors
window.addEventListener('error', function(e) {
    console.error('Unhandled error:', e.error);
    
    // Don't show modal for network errors or script loading errors
    if (e.error && !e.error.message.includes('Loading')) {
        showModal('error', 'Something went wrong', 'An unexpected error occurred. Please refresh the page and try again.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
    
    if (e.reason && e.reason.message) {
        showModal('error', 'Error', e.reason.message);
    }

});