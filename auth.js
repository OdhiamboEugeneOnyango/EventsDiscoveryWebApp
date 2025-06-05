// Authentication JavaScript

// Form validation patterns
const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+254|0)[17]\d{8}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Sample user data (in real app, this would be handled by backend)
let users = JSON.parse(localStorage.getItem('eventhub_users') || '[]');

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
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword')
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
}

// Validate Login Form
function validateLoginForm() {
    let isValid = true;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!validateField('email', email, 'emailError')) {
        isValid = false;
    }
    
    if (!validateField('password', password, 'passwordError')) {
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
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
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
function performLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Check if user exists (in real app, this would be server-side)
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store session
            if (rememberMe) {
                localStorage.setItem('eventhub_remember', email);
            }
            sessionStorage.setItem('eventhub_user', JSON.stringify({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }));
            
            showModal('success', 'Login Successful!', 'Welcome back! Redirecting to home page...', () => {
                window.location.href = 'index.html';
            });
        } else {
            showModal('error', 'Login Failed', 'Invalid email or password. Please try again.');
        }
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Perform signup
function performSignup() {
    const formData = {
        id: Date.now(),
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        password: document.getElementById('password').value,
        interests: Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(cb => cb.value),
        newsletter: document.getElementById('newsletter').checked,
        createdAt: new Date().toISOString()
    };
    
    // Show loading state
    const submitBtn = document.querySelector('#signupForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Check if user already exists
        const existingUser = users.find(u => u.email === formData.email);
        
        if (existingUser) {
            showModal('error', 'Account Exists', 'An account with this email already exists. Please try logging in.');
        } else {
            // Add new user
            users.push(formData);
            localStorage.setItem('eventhub_users', JSON.stringify(users));
            
            showModal('success', 'Account Created!', 'Your account has been created successfully. You can now sign in.', () => {
                window.location.href = 'login.html';
            });
        }
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
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

// Cleanup: Remove old sessions on page load
window.addEventListener('load', function() {
    // Clean up old sessions (older than 24 hours)
    const lastCleanup = localStorage.getItem('eventhub_last_cleanup');
    const now = Date.now();
    
    if (!lastCleanup || now - parseInt(lastCleanup) > 24 * 60 * 60 * 1000) {
        // Remove expired sessions
        const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('eventhub_'));
        sessionKeys.forEach(key => {
            try {
                const data = JSON.parse(sessionStorage.getItem(key));
                if (data.expires && now > data.expires) {
                    sessionStorage.removeItem(key);
                }
            } catch (e) {
                // Invalid JSON, remove it
                sessionStorage.removeItem(key);
            }
        });
        
        localStorage.setItem('eventhub_last_cleanup', now.toString());
    }
});