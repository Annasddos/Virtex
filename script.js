// --- Core UI Element References ---
const header = document.getElementById('header');
const batteryElement = document.getElementById('battery');
const timeElement = document.getElementById('time');
const ipElement = document.getElementById('ip');
const regionElement = document.getElementById('region');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

// --- Authentication and Admin UI References ---
const authSection = document.getElementById('authSection');
const adminSection = document.getElementById('adminSection');
const mainContent = document.getElementById('mainContent');
const authLink = document.getElementById('authLink');
const adminPanelLink = document.getElementById('adminPanelLink');
const logoutLink = document.getElementById('logoutLink');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const toggleAuthText = document.getElementById('toggleAuthText');
const adminUsersList = document.getElementById('adminUsersList');
const userStatusList = document.getElementById('userStatusList');

// --- Mobile Navigation References ---
const menuToggle = document.getElementById('menuToggle');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');
const authLinkMobile = document.getElementById('authLinkMobile');
const adminPanelLinkMobile = document.getElementById('adminPanelLinkMobile');
const logoutLinkMobile = document.getElementById('logoutLinkMobile');

// --- Constants for Auth System ---
const AUTH_KEY = 'annas_users'; // Key for storing user data in localStorage
const CURRENT_USER_KEY = 'annas_current_user'; // Key for storing current user in sessionStorage
const ADMIN_USERNAME = 'Anas';
const ADMIN_PASSWORD = '1'; // WARNING: Not secure. For production, use server-side hashing!

let isRegisterMode = false; // Tracks current mode of auth form (login/register)
let activeUsersStatus = {}; // Stores simulated real-time user activity

// --- Utility Functions ---

/**
 * Displays a custom toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - The type of toast.
 */
function showToast(message, type = 'success') {
    clearTimeout(toastTimeout); // Clear any existing timeout
    toastMessage.textContent = message;
    toast.className = 'toast'; // Reset classes
    toast.classList.add('show', type); // Add 'show' and type class
    
    // Hide after delay with complete removal
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        // A small delay to allow transition to complete before display:none
        setTimeout(() => {
            toast.style.display = 'none';
            setTimeout(() => {
                toast.style.display = 'flex'; // Reset display for next show
            }, 100);
        }, 500); 
    }, 3000); // Toast disappears after 3 seconds
}

/**
 * Smooth scrolls to a target element.
 * @param {string} selector - The CSS selector of the target element.
 */
function smoothScrollTo(selector) {
    const target = document.querySelector(selector);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Copies a given endpoint path to the clipboard.
 * @param {string} path - The endpoint path to copy.
 */
function copyEndpoint(path) {
    const fullUrl = window.location.origin + path;
    navigator.clipboard.writeText(fullUrl)
        .then(() => showToast('🎉 Endpoint URL copied successfully!', 'success'))
        .catch(() => showToast('❌ Failed to copy endpoint URL', 'error'));
}

/**
 * Opens a given endpoint URL in a new tab.
 * @param {string} path - The endpoint path to open.
 */
function goToEndpoint(path) {
    window.open(window.location.origin + path, '_blank');
}

// --- Data Management (localStorage Simulation) ---

/**
 * Retrieves all user data from localStorage.
 * @returns {Array<Object>} An array of user objects.
 */
function getUsers() {
    const users = localStorage.getItem(AUTH_KEY);
    return users ? JSON.parse(users) : [];
}

/**
 * Saves the current user data array to localStorage.
 * @param {Array<Object>} users - The array of user objects to save.
 */
function saveUsers(users) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

/**
 * Sets the current logged-in user in sessionStorage.
 * @param {string} username - The username of the logged-in user.
 * @param {string} role - The role of the user ('admin' or 'user').
 * @param {string} [status='active'] - The current status of the user.
 */
function setCurrentUser(username, role, status = 'active') {
    const user = { username, role, status, lastActivity: new Date().toISOString(), currentFeature: 'Browse Home' };
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    updateNavUI(); // Update navigation links
    showContentForUser(); // Show appropriate content based on user
    showToast(`Welcome, ${username}!`, 'info');
}

/**
 * Gets the current logged-in user from sessionStorage.
 * @returns {Object|null} The current user object or null if no user is logged in.
 */
function getCurrentUser() {
    const user = sessionStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Clears the current logged-in user from sessionStorage (logs out).
 */
function clearCurrentUser() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    updateNavUI();
    showContentForUser();
    showToast('You have been logged out.', 'info');
}

// --- UI Rendering & Logic ---

/**
 * Updates the visibility of navigation links based on login status and user role.
 */
function updateNavUI() {
    const currentUser = getCurrentUser();
    // Desktop navigation
    if (currentUser) {
        authLink.style.display = 'none';
        logoutLink.style.display = 'block';
        adminPanelLink.style.display = (currentUser.role === 'admin') ? 'block' : 'none';
    } else {
        authLink.style.display = 'block';
        logoutLink.style.display = 'none';
        adminPanelLink.style.display = 'none';
    }
    // Mobile navigation
    if (authLinkMobile) { // Check if mobile elements exist
        if (currentUser) {
            authLinkMobile.style.display = 'none';
            logoutLinkMobile.style.display = 'block';
            adminPanelLinkMobile.style.display = (currentUser.role === 'admin') ? 'block' : 'none';
        } else {
            authLinkMobile.style.display = 'block';
            logoutLinkMobile.style.display = 'none';
            adminPanelLinkMobile.style.display = 'none';
        }
    }
}

/**
 * Displays the appropriate section (auth, admin, or main content) based on user status.
 */
function showContentForUser() {
    const currentUser = getCurrentUser();
    // Hide all main sections first
    authSection.style.display = 'none';
    adminSection.style.display = 'none';
    mainContent.style.display = 'none';

    if (currentUser && currentUser.status === 'approved') {
        mainContent.style.display = 'block';
        // Simulate initial activity once content is shown
        simulateUserActivity(currentUser.username, 'Viewing API Documentation');
    } else if (currentUser && currentUser.role === 'admin') {
        adminSection.style.display = 'block';
        showAdminPanel(); // Render admin panel specific content
        simulateUserActivity(currentUser.username, 'Managing Users in Admin Panel');
    } else {
        // Default: show login/register form if not logged in or account is pending/rejected
        authSection.style.display = 'flex'; // Use flex for centering
    }
}

/**
 * Handles the submission of the login/registration form.
 * @param {Event} event - The form submit event.
 */
function handleAuthSubmit(event) {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showToast('Username and password cannot be empty.', 'error');
        return;
    }

    let users = getUsers();

    if (isRegisterMode) {
        // Registration Logic
        if (users.some(user => user.username === username)) {
            showToast('Username already exists. Please choose another.', 'error');
            return;
        }
        const newUser = { 
            username, 
            password, // WARNING: Store hashed password in real app!
            status: 'pending', 
            role: 'user', 
            registrationDate: new Date().toISOString() 
        };
        users.push(newUser);
        saveUsers(users);
        showToast('Registration successful! Please wait for administrator approval.', 'info');
        // Switch back to login mode after successful registration
        isRegisterMode = false;
        updateAuthFormUI();
    } else {
        // Login Logic
        // Check for admin login first
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setCurrentUser(ADMIN_USERNAME, 'admin');
            return;
        }

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            // In a real app: compare hashed password
            if (user.status === 'approved') {
                setCurrentUser(user.username, user.role, user.status);
            } else if (user.status === 'pending') {
                showToast('Your account is pending approval from the administrator.', 'info');
            } else if (user.status === 'rejected') {
                showToast('Your registration was rejected. Please contact support.', 'error');
            }
        } else {
            showToast('Invalid username or password.', 'error');
        }
    }
}

/**
 * Updates the UI elements of the authentication form based on login/register mode.
 */
function updateAuthFormUI() {
    if (isRegisterMode) {
        authTitle.textContent = 'Register New Account';
        authSubmitBtn.textContent = 'Register Now';
        toggleAuthText.textContent = 'Already have an account? ';
        toggleAuthMode.textContent = 'Login here';
        passwordInput.setAttribute('autocomplete', 'new-password'); // Suggest new password
    } else {
        authTitle.textContent = 'Login to Annas API';
        authSubmitBtn.textContent = 'Login Securely';
        toggleAuthText.textContent = "Don't have an account? ";
        toggleAuthMode.textContent = 'Register now';
        passwordInput.setAttribute('autocomplete', 'current-password'); // Suggest current password
    }
    usernameInput.value = '';
    passwordInput.value = '';
}

/**
 * Toggles the authentication form between login and register modes.
 * @param {Event} event - The click event.
 */
function toggleAuthModeHandler(event) {
    event.preventDefault();
    isRegisterMode = !isRegisterMode;
    updateAuthFormUI();
}

/**
 * Renders the full admin panel, including user list and status list.
 */
function showAdminPanel() {
    renderAdminUsersList();
    renderUserStatusList();
}

/**
 * Renders the list of users for the admin panel (pending and registered).
 */
function renderAdminUsersList() {
    let users = getUsers();
    adminUsersList.innerHTML = ''; // Clear existing list

    const pendingUsers = users.filter(user => user.status === 'pending');
    const registeredUsers = users.filter(user => user.status !== 'pending' && user.role !== 'admin'); // Exclude admin from this list

    if (pendingUsers.length === 0 && registeredUsers.length === 0) {
        adminUsersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No pending registrations or registered users to display.</p>';
        return;
    }

    // Render Pending Users
    if (pendingUsers.length > 0) {
        const pendingHeader = document.createElement('h3');
        pendingHeader.classList.add('admin-card-subtitle'); // Reusing a subtitle style
        pendingHeader.style.color = 'var(--pending-color)';
        pendingHeader.textContent = 'Pending Registrations Awaiting Approval';
        adminUsersList.appendChild(pendingHeader);

        pendingUsers.forEach(user => {
            const userItem = createUserListItem(user, true); // true for pending actions
            adminUsersList.appendChild(userItem);
        });
        const separator = document.createElement('hr');
        separator.style.borderTop = '1px dashed var(--border-color)';
        separator.style.margin = '1.5rem 0';
        adminUsersList.appendChild(separator);
    }

    // Render Registered Users
    if (registeredUsers.length > 0) {
        const registeredHeader = document.createElement('h3');
        registeredHeader.classList.add('admin-card-subtitle');
        registeredHeader.textContent = 'Active & Rejected User Accounts';
        adminUsersList.appendChild(registeredHeader);

        registeredUsers.forEach(user => {
            const userItem = createUserListItem(user, false); // false for normal registered actions
            adminUsersList.appendChild(userItem);
        });
    }
}

/**
 * Creates an HTML list item for a user in the admin panel.
 * @param {Object} user - The user object.
 * @param {boolean} isPending - True if the user is in pending status.
 * @returns {HTMLElement} The created div element.
 */
function createUserListItem(user, isPending) {
    const userItem = document.createElement('div');
    userItem.classList.add('admin-user-item');
    userItem.dataset.username = user.username;

    const userInfo = document.createElement('div');
    userInfo.classList.add('admin-user-info');
    userInfo.innerHTML = `
        <span>${user.username}</span>
        <small>Status: <span class="status-text-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></small>
        <small>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</small>
        <small>Registered: ${new Date(user.registrationDate).toLocaleDateString()}</small>
    `;
    userItem.appendChild(userInfo);

    const userActions = document.createElement('div');
    userActions.classList.add('admin-user-actions');

    if (isPending) {
        const approveBtn = document.createElement('button');
        approveBtn.classList.add('approve');
        approveBtn.title = `Approve ${user.username}'s registration`;
        approveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Approve`;
        approveBtn.onclick = () => approveUser(user.username);
        userActions.appendChild(approveBtn);

        const rejectBtn = document.createElement('button');
        rejectBtn.classList.add('reject');
        rejectBtn.title = `Reject ${user.username}'s registration`;
        rejectBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Reject`;
        rejectBtn.onclick = () => rejectUser(user.username);
        userActions.appendChild(rejectBtn);
    } else {
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete');
        deleteBtn.title = `Delete ${user.username}'s account`;
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 16 7 16h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg> Delete`;
        deleteBtn.onclick = () => deleteUser(user.username);
        userActions.appendChild(deleteBtn);
    }

    userItem.appendChild(userActions);
    return userItem;
}

/**
 * Approves a user's registration.
 * @param {string} username - The username to approve.
 */
function approveUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'approved';
        saveUsers(users);
        showToast(`User '${username}' registration approved!`, 'success');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Approved user ${username}`);
    }
}

/**
 * Rejects a user's registration.
 * @param {string} username - The username to reject.
 */
function rejectUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'rejected';
        saveUsers(users);
        showToast(`User '${username}' registration rejected.`, 'error');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Rejected user ${username}`);
    }
}

/**
 * Deletes a user account.
 * @param {string} username - The username to delete.
 */
function deleteUser(username) {
    if (username === ADMIN_USERNAME) {
        showToast("Cannot delete the administrator account.", 'error');
        return;
    }
    if (confirm(`Are you sure you want to permanently delete user '${username}'? This action cannot be undone.`)) {
        let users = getUsers();
        users = users.filter(u => u.username !== username);
        saveUsers(users);
        showToast(`User '${username}' deleted successfully.`, 'info');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Deleted user ${username}`);
    }
}

/**
 * Simulates user activity and updates a global status object.
 * In a real application, this data would come from a backend.
 * @param {string} username - The username performing the activity.
 * @param {string} feature - The feature being used.
 */
function simulateUserActivity(username, feature) {
    const now = new Date();
    activeUsersStatus[username] = {
        username: username,
        lastActivity: now.toLocaleString(),
        currentFeature: feature,
        status: getCurrentUser()?.username === username ? getCurrentUser().status : 'active' // For non-logged-in users, assume active
    };
    // Update admin panel if it's currently visible
    if (adminSection.style.display === 'block') {
        renderUserStatusList();
    }
}

/**
 * Renders the list of active user statuses in the admin panel.
 */
function renderUserStatusList() {
    userStatusList.innerHTML = ''; // Clear existing list
    const statuses = Object.values(activeUsersStatus);

    if (statuses.length === 0) {
        userStatusList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No active users to display status.</p>';
        return;
    }

    // Sort by last activity, newest first
    statuses.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    statuses.forEach(status => {
        const statusItem = document.createElement('div');
        statusItem.classList.add('user-status-item');
        statusItem.innerHTML = `
            <strong>${status.username} <span class="status-indicator status-${status.status === 'approved' ? 'online' : 'offline'}">${status.status === 'approved' ? 'Online' : 'Offline'}</span></strong>
            <p>Last Activity: ${status.lastActivity}</p>
            <p>Currently: ${status.currentFeature}</p>
        `;
        userStatusList.appendChild(statusItem);
    });
}

// --- Event Listeners and Initializations ---

// Header scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    mobileNavOverlay.classList.toggle('open');
    menuToggle.classList.toggle('active');
});

// Close mobile menu when a link is clicked
mobileNavOverlay.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileNavOverlay.classList.remove('open');
        menuToggle.classList.remove('active');
    });
});


// Intersection Observer for section and card animations
const observerOptions = {
    threshold: 0.1, // Trigger when 10% of the element is visible
    rootMargin: '0px 0px -50px 0px' // Adjust trigger point
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stop observing once visible if it's a section
            if (entry.target.classList.contains('section')) {
                sectionObserver.unobserve(entry.target);
            }
        }
    });
}, observerOptions);

// Observe all sections and animate cards
document.querySelectorAll('.section, .animate-card').forEach(el => {
    sectionObserver.observe(el);
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        smoothScrollTo(targetId);
    });
});

// FAQ Accordion Logic
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const answer = button.nextElementSibling;
        button.classList.toggle('active');
        answer.classList.toggle('open');
        // Close other open answers
        document.querySelectorAll('.faq-question.active').forEach(otherButton => {
            if (otherButton !== button) {
                otherButton.classList.remove('active');
                otherButton.nextElementSibling.classList.remove('open');
            }
        });
    });
});

// Parallax effect for floating shapes
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, index) => {
        // Adjust speed for more dynamic parallax
        const speed = 0.3 + (index * 0.05) + Math.random() * 0.2; 
        const rotationSpeed = 0.05 + (index * 0.01);
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * rotationSpeed}deg)`;
    });
});

// Initial setup on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure admin account exists initially for demonstration
    let users = getUsers();
    if (!users.some(u => u.username === ADMIN_USERNAME && u.role === 'admin')) {
        users.push({ 
            username: ADMIN_USERNAME, 
            password: ADMIN_PASSWORD, 
            status: 'approved', 
            role: 'admin', 
            registrationDate: new Date().toISOString() 
        });
        saveUsers(users);
    }
    
    showContentForUser(); // Determine which section to show on load
    updateNavUI(); // Update nav links based on login status

    // Attach event listeners for auth form and toggles
    authForm.addEventListener('submit', handleAuthSubmit);
    toggleAuthMode.addEventListener('click', toggleAuthModeHandler);

    // Navigation link handlers for auth/admin/logout
    authLink.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = false;
        updateAuthFormUI();
        showContentForUser(); 
        smoothScrollTo('#authSection');
    });
    // For mobile nav too
    if (authLinkMobile) {
        authLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            isRegisterMode = false;
            updateAuthFormUI();
            showContentForUser();
            smoothScrollTo('#authSection');
        });
    }

    adminPanelLink.addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.role === 'admin') {
            showContentForUser();
            smoothScrollTo('#adminSection');
        } else {
            showToast('Access Denied: Not an administrator.', 'error');
        }
    });
    // For mobile nav too
    if (adminPanelLinkMobile) {
        adminPanelLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.role === 'admin') {
                showContentForUser();
                smoothScrollTo('#adminSection');
            } else {
                showToast('Access Denied: Not an administrator.', 'error');
            }
        });
    }

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearCurrentUser();
        smoothScrollTo('#hero'); // Scroll to hero after logout
    });
    // For mobile nav too
    if (logoutLinkMobile) {
        logoutLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            clearCurrentUser();
            smoothScrollTo('#hero');
        });
    }

    // Simulate some initial user activities (for demo, these are not real)
    simulateUserActivity('guestUser', 'Browse Documentation');
    
    // Initial welcome toast
    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) { 
            showToast('🚀 Welcome to Annas Elite API Platform! Please Login or Register.', 'info');
        }
    }, 2000);
});

// Set interval to update user statuses periodically for demo
setInterval(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const currentHash = window.location.hash || '#hero'; // Get current hash or default to hero
        const featureMap = {
            '#hero': 'Exploring Homepage',
            '#info': 'Checking System Metrics',
            '#endpoints': 'Reviewing API Endpoints',
            '#features': 'Discovering Core Features',
            '#testimonials': 'Reading User Testimonials',
            '#faq': 'Consulting FAQ Section',
            '#contact': 'Preparing to Contact Support',
            '#authSection': 'Interacting with Login/Register',
            '#adminSection': 'Managing Admin Dashboard'
        };
        const currentFeature = featureMap[currentHash] || `Navigating to ${currentHash}`;
        simulateUserActivity(currentUser.username, currentFeature);
    }
    // Add some random activity for other "users" if they exist
    let users = getUsers();
    users.forEach(user => {
        if (user.username !== currentUser?.username && user.status === 'approved' && user.role === 'user') {
            const randomFeatures = [
                'Checking API performance',
                'Exploring new endpoints',
                'Reviewing documentation',
                'Planning integration strategy',
                'Seeking support information',
                'Reading testimonials',
                'Considering API usage'
            ];
            const randomFeature = randomFeatures[Math.floor(Math.random() * randomFeatures.length)];
            simulateUserActivity(user.username, randomFeature);
        }
    });
}, 15000); // Update every 15 seconds for demonstration