// --- Global Constants and Configuration ---
const AUTH_KEY = 'annas_users'; // Key for storing user data in localStorage
const CURRENT_USER_KEY = 'annas_current_user'; // Key for storing current user session in sessionStorage
const ADMIN_USERNAME = 'Anas';
const ADMIN_PASSWORD = '1'; // WARNING: In a real application, passwords should ALWAYS be hashed and stored on a secure backend, never hardcoded in frontend JS!

// --- UI Element References (Caching DOM elements for performance) ---
// Header and Navigation
const header = document.getElementById('header');
const navLinks = document.querySelector('.nav-links'); // Desktop nav
const menuToggle = document.getElementById('menuToggle'); // Mobile hamburger icon
const mobileNavOverlay = document.getElementById('mobileNavOverlay'); // Mobile nav container
const mobileNavLinks = document.querySelector('.mobile-nav-links'); // Mobile nav links
// System Info Section
const batteryElement = document.getElementById('battery');
const timeElement = document.getElementById('time');
const ipElement = document.getElementById('ip');
const regionElement = document.getElementById('region');
// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout; // To manage toast display duration
// Authentication Section
const authSection = document.getElementById('authSection');
const authCard = document.querySelector('.auth-card');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const toggleAuthText = document.getElementById('toggleAuthText');
// Admin Panel Section
const adminSection = document.getElementById('adminSection');
const adminUsersList = document.getElementById('adminUsersList');
const userStatusList = document.getElementById('userStatusList');
const totalUsersCount = document.getElementById('totalUsersCount');
const pendingApprovalsCount = document.getElementById('pendingApprovalsCount');
const activeSessionsCount = document.getElementById('activeSessionsCount');
const lastStatusUpdate = document.getElementById('lastStatusUpdate');
// Navigation Links (conditional visibility)
const authLink = document.getElementById('authLink');
const adminPanelLink = document.getElementById('adminPanelLink');
const logoutLink = document.getElementById('logoutLink');
const authLinkMobile = document.getElementById('authLinkMobile');
const adminPanelLinkMobile = document.getElementById('adminPanelLinkMobile');
const logoutLinkMobile = document.getElementById('logoutLinkMobile');
// Main Content Area
const mainContent = document.getElementById('mainContent');

// --- Global State Variables ---
let isRegisterMode = false; // Flag to track if the auth form is in 'register' mode
let activeUsersStatus = {}; // Object to store simulated real-time user activity data

// --- Utility Functions ---

/**
 * Displays a custom, animated toast notification to the user.
 * @param {string} message - The message content to display in the toast.
 * @param {'success'|'error'|'info'} type - The type of toast, which determines its color and icon.
 */
function showToast(message, type = 'success') {
    clearTimeout(toastTimeout); // Ensure only one toast is active at a time
    toastMessage.textContent = message;
    toast.className = 'toast'; // Reset all classes to default 'toast'
    toast.classList.add('show', type); // Add 'show' class for visibility and 'type' for styling

    // Set a timeout to automatically hide the toast after a few seconds
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show'); // Start fade-out/slide-down animation
        // After transition, ensure display is set to 'none' to remove from flow
        setTimeout(() => {
            toast.style.display = 'none';
            // Reset display to 'flex' after a short delay, ready for next display
            setTimeout(() => {
                toast.style.display = 'flex';
            }, 100);
        }, 500); // Matches CSS transition duration for 'show' removal
    }, 3500); // Toast remains visible for 3.5 seconds
}

/**
 * Smoothly scrolls the viewport to a specified HTML element.
 * @param {string} selector - The CSS selector of the target element to scroll to.
 */
function smoothScrollTo(selector) {
    const targetElement = document.querySelector(selector);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth', // Enable smooth scrolling animation
            block: 'start'      // Align the top of the element to the top of the viewport
        });
    }
}

/**
 * Copies a given endpoint path, prefixed with the current origin, to the user's clipboard.
 * Displays a toast notification indicating success or failure.
 * @param {string} path - The relative path of the API endpoint (e.g., '/api/bug/forcecall').
 */
function copyEndpoint(path) {
    const fullUrl = window.location.origin + path; // Construct the full URL
    navigator.clipboard.writeText(fullUrl) // Use Clipboard API to copy text
        .then(() => showToast('🎉 Endpoint URL copied to clipboard!', 'success'))
        .catch(() => showToast('❌ Failed to copy endpoint URL. Please copy manually.', 'error'));
}

/**
 * Opens a specified API endpoint URL in a new browser tab.
 * @param {string} path - The relative path of the API endpoint.
 */
function goToEndpoint(path) {
    window.open(window.location.origin + path, '_blank'); // Open in a new tab
}

// --- LocalStorage User Data Management (Simulation) ---

/**
 * Retrieves the array of all registered users from browser's localStorage.
 * @returns {Array<Object>} An array where each object represents a user (username, password, status, role, registrationDate).
 */
function getUsers() {
    try {
        const usersJson = localStorage.getItem(AUTH_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
        console.error("Error reading users from localStorage:", e);
        showToast("Error loading user data. Storage might be corrupted.", "error");
        return [];
    }
}

/**
 * Saves the current array of user objects back into browser's localStorage.
 * @param {Array<Object>} users - The updated array of user objects.
 */
function saveUsers(users) {
    try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Error saving users to localStorage:", e);
        showToast("Error saving user data. Local storage might be full.", "error");
    }
}

/**
 * Sets the currently logged-in user's information in sessionStorage.
 * This simulates a user session.
 * @param {string} username - The username of the logged-in user.
 * @param {string} role - The role of the user (e.g., 'user', 'admin').
 * @param {string} [status='active'] - The approval status of the user's account.
 */
function setCurrentUser(username, role, status = 'active') {
    const userSessionData = {
        username: username,
        role: role,
        status: status,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        currentFeature: 'Initializing Session' // Initial activity
    };
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSessionData)); // Store in sessionStorage for session-based persistence
    updateNavUI(); // Update UI after login
    showContentForUser(); // Redirect to appropriate content
    showToast(`Welcome back, ${username}! You are now logged in.`, 'success');
}

/**
 * Retrieves the current logged-in user's data from sessionStorage.
 * @returns {Object|null} The user object if logged in, otherwise null.
 */
function getCurrentUser() {
    try {
        const userSessionData = sessionStorage.getItem(CURRENT_USER_KEY);
        return userSessionData ? JSON.parse(userSessionData) : null;
    } catch (e) {
        console.error("Error reading current user from sessionStorage:", e);
        return null;
    }
}

/**
 * Clears the current user's session data from sessionStorage, effectively logging them out.
 */
function clearCurrentUser() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    updateNavUI(); // Update UI after logout
    showContentForUser(); // Redirect to login/public content
    showToast('You have been successfully logged out.', 'info');
}

// --- UI Update & Content Management ---

/**
 * Dynamically updates the visibility of navigation links (Login/Register, Admin Panel, Logout)
 * based on the current user's login status and role.
 */
function updateNavUI() {
    const currentUser = getCurrentUser();
    // Update desktop navigation links
    if (currentUser) {
        authLink.style.display = 'none';
        logoutLink.style.display = 'block';
        adminPanelLink.style.display = (currentUser.role === 'admin') ? 'block' : 'none';
    } else {
        authLink.style.display = 'block';
        logoutLink.style.display = 'none';
        adminPanelLink.style.display = 'none';
    }

    // Update mobile navigation links (if they exist)
    if (authLinkMobile && adminPanelLinkMobile && logoutLinkMobile) {
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
 * Controls which main content section is displayed to the user
 * (Authentication form, Admin Panel, or main API Documentation).
 * This ensures only relevant content is shown at any given time.
 */
function showContentForUser() {
    const currentUser = getCurrentUser();
    // Initially hide all main content sections to prevent flicker
    authSection.style.display = 'none';
    adminSection.style.display = 'none';
    mainContent.style.display = 'none';

    if (currentUser && currentUser.status === 'approved') {
        // If user is logged in and approved, show main API documentation
        mainContent.style.display = 'block';
        // Simulate activity for the logged-in user when they access content
        simulateUserActivity(currentUser.username, 'Browse API Documentation');
        smoothScrollTo('#hero'); // Scroll to hero section on login
    } else if (currentUser && currentUser.role === 'admin') {
        // If an admin is logged in, show the admin panel
        adminSection.style.display = 'block';
        showAdminPanel(); // Render admin-specific data
        simulateUserActivity(currentUser.username, 'Managing Admin Dashboard');
        smoothScrollTo('#adminSection'); // Scroll to admin section on admin login
    } else {
        // If no user logged in, or account is pending/rejected, show the authentication form
        authSection.style.display = 'flex'; // Use flexbox for centering
        smoothScrollTo('#authSection'); // Scroll to auth section
    }
}

// --- Authentication Form Logic ---

/**
 * Handles the submission of the login/registration form.
 * Performs client-side validation and interacts with localStorage for user management.
 * @param {Event} event - The DOM event object from form submission.
 */
function handleAuthSubmit(event) {
    event.preventDefault(); // Prevent default form submission behavior (page reload)
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showToast('Username and password cannot be empty. Please fill both fields.', 'error');
        return;
    }

    let users = getUsers(); // Get current list of users from localStorage

    if (isRegisterMode) {
        // Logic for User Registration
        if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            showToast(`Username '${username}' already exists. Please choose a different one.`, 'error');
            return;
        }
        // Create a new user object with 'pending' status
        const newUser = {
            username: username,
            password: password, // WARNING: In production, hash this password!
            status: 'pending', // New accounts require admin approval
            role: 'user',
            registrationDate: new Date().toISOString() // Timestamp registration
        };
        users.push(newUser); // Add new user to the list
        saveUsers(users); // Save updated user list to localStorage
        showToast(`Registration successful for '${username}'! Please wait for administrator approval to access your account.`, 'info');
        
        // After registration, switch back to login mode for convenience
        isRegisterMode = false;
        updateAuthFormUI();
        simulateUserActivity(username, 'Registered an account (Pending)');
    } else {
        // Logic for User Login
        // Special check for hardcoded admin login
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setCurrentUser(ADMIN_USERNAME, 'admin', 'approved'); // Admin is always approved
            return;
        }

        const userFound = users.find(u => u.username === username && u.password === password); // Find user by credentials
        
        if (userFound) {
            // Check user account status
            if (userFound.status === 'approved') {
                setCurrentUser(userFound.username, userFound.role, userFound.status);
                showToast(`Successfully logged in as '${userFound.username}'.`, 'success');
            } else if (userFound.status === 'pending') {
                showToast(`Your account for '${userFound.username}' is pending administrator approval. Please be patient.`, 'info');
            } else if (userFound.status === 'rejected') {
                showToast(`Your registration for '${userFound.username}' was rejected. Please contact support for more information.`, 'error');
            }
        } else {
            showToast('Invalid username or password. Please check your credentials.', 'error');
        }
    }
}

/**
 * Updates the text content and attributes of the authentication form elements
 * to switch between 'Login' and 'Register' modes.
 */
function updateAuthFormUI() {
    if (isRegisterMode) {
        authTitle.textContent = 'Register New Account';
        authSubmitBtn.textContent = 'Create Account';
        toggleAuthText.textContent = 'Already have an account? ';
        toggleAuthMode.textContent = 'Login here';
        passwordInput.setAttribute('autocomplete', 'new-password'); // Hint browser for new password
    } else {
        authTitle.textContent = 'Login to Annas API';
        authSubmitBtn.textContent = 'Login Securely';
        toggleAuthText.textContent = "Don't have an account? ";
        toggleAuthMode.textContent = 'Register now';
        passwordInput.setAttribute('autocomplete', 'current-password'); // Hint browser for current password
    }
    // Clear input fields after mode switch
    usernameInput.value = '';
    passwordInput.value = '';
}

/**
 * Toggles the authentication form's mode between Login and Register.
 * @param {Event} event - The DOM event object from the click.
 */
function toggleAuthModeHandler(event) {
    event.preventDefault(); // Prevent default link behavior
    isRegisterMode = !isRegisterMode; // Flip the mode flag
    updateAuthFormUI(); // Update the form's appearance
    // Apply a subtle animation effect to the auth card
    authCard.style.transform = 'scale(0.98)';
    setTimeout(() => {
        authCard.style.transform = 'scale(1)';
    }, 100);
}

// --- Admin Panel Logic ---

/**
 * Initializes and renders the Admin Panel data.
 */
function showAdminPanel() {
    renderAdminUsersList();
    renderUserStatusList();
}

/**
 * Renders the list of all users for the administrator, categorized by status (pending, approved, rejected).
 * Includes action buttons for approval, rejection, and deletion.
 */
function renderAdminUsersList() {
    let allUsers = getUsers(); // Get all users
    // Filter out the admin account itself from the list presented to admin
    const filteredUsers = allUsers.filter(user => user.username !== ADMIN_USERNAME);

    const pendingUsers = filteredUsers.filter(user => user.status === 'pending');
    const registeredNonPendingUsers = filteredUsers.filter(user => user.status !== 'pending'); // Approved or Rejected

    adminUsersList.innerHTML = ''; // Clear previous list content

    // Update summary counts
    totalUsersCount.textContent = registeredNonPendingUsers.length + pendingUsers.length;
    pendingApprovalsCount.textContent = pendingUsers.length;

    if (filteredUsers.length === 0) {
        adminUsersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No user accounts found (excluding admin).</p>';
        return;
    }

    // Display Pending Registrations section
    if (pendingUsers.length > 0) {
        const pendingHeader = document.createElement('h4'); // Using h4 for sub-heading
        pendingHeader.classList.add('admin-list-category-title');
        pendingHeader.style.color = 'var(--pending-color)';
        pendingHeader.textContent = `Pending Registrations (${pendingUsers.length})`;
        adminUsersList.appendChild(pendingHeader);

        pendingUsers.forEach(user => {
            const userItem = createUserListItem(user, true); // True for pending actions
            adminUsersList.appendChild(userItem);
        });
        // Add a visual separator if there are also registered users
        if (registeredNonPendingUsers.length > 0) {
            const separator = document.createElement('hr');
            separator.style.borderTop = '1px dashed var(--border-color)';
            separator.style.margin = '1.5rem 0';
            adminUsersList.appendChild(separator);
        }
    }

    // Display Registered Users section (Approved/Rejected)
    if (registeredNonPendingUsers.length > 0) {
        const registeredHeader = document.createElement('h4');
        registeredHeader.classList.add('admin-list-category-title');
        registeredHeader.textContent = `Registered Accounts (${registeredNonPendingUsers.length})`;
        adminUsersList.appendChild(registeredHeader);

        registeredNonPendingUsers.forEach(user => {
            const userItem = createUserListItem(user, false); // False for non-pending actions
            adminUsersList.appendChild(userItem);
        });
    }
}

/**
 * Creates an HTML div element representing a user item in the admin user list.
 * Includes user information and action buttons (Approve, Reject, Delete).
 * @param {Object} user - The user object to display.
 * @param {boolean} isPending - True if the user's status is 'pending', which affects visible actions.
 * @returns {HTMLElement} The constructed div element for the user list item.
 */
function createUserListItem(user, isPending) {
    const userItem = document.createElement('div');
    userItem.classList.add('admin-user-item');
    userItem.dataset.username = user.username; // Store username as a data attribute

    const userInfo = document.createElement('div');
    userInfo.classList.add('admin-user-info');
    userInfo.innerHTML = `
        <span>${user.username}</span>
        <small>Status: <span class="status-text-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></small>
        <small>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</small>
        <small>Registered: ${new Date(user.registrationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
        ${user.status === 'rejected' ? `<small style="color: var(--error-color);">Rejected: ${new Date().toLocaleDateString()}</small>` : ''}
    `;
    userItem.appendChild(userInfo);

    const userActions = document.createElement('div');
    userActions.classList.add('admin-user-actions');

    if (isPending) {
        // Buttons for pending accounts
        const approveBtn = document.createElement('button');
        approveBtn.classList.add('approve');
        approveBtn.title = `Approve registration for ${user.username}`;
        approveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Approve`;
        approveBtn.onclick = () => approveUser(user.username);
        userActions.appendChild(approveBtn);

        const rejectBtn = document.createElement('button');
        rejectBtn.classList.add('reject');
        rejectBtn.title = `Reject registration for ${user.username}`;
        rejectBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Reject`;
        rejectBtn.onclick = () => rejectUser(user.username);
        userActions.appendChild(rejectBtn);
    } else {
        // Button for non-pending accounts (approved/rejected)
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete');
        deleteBtn.title = `Delete account for ${user.username}`;
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 16 7 16h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg> Delete`;
        deleteBtn.onclick = () => deleteUser(user.username);
        userActions.appendChild(deleteBtn);
    }

    userItem.appendChild(userActions);
    return userItem;
}

/**
 * Changes a user's status to 'approved' and saves the updated list.
 * @param {string} username - The username of the account to approve.
 */
function approveUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'approved';
        saveUsers(users);
        showToast(`Account for '${username}' has been successfully approved!`, 'success');
        renderAdminUsersList(); // Re-render the list to reflect changes
        simulateUserActivity(ADMIN_USERNAME, `Approved user ${username}'s account`);
    } else {
        showToast(`Error: User '${username}' not found.`, 'error');
    }
}

/**
 * Changes a user's status to 'rejected' and saves the updated list.
 * @param {string} username - The username of the account to reject.
 */
function rejectUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'rejected';
        saveUsers(users);
        showToast(`Account for '${username}' has been rejected.`, 'error');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Rejected user ${username}'s account`);
    } else {
        showToast(`Error: User '${username}' not found.`, 'error');
    }
}

/**
 * Deletes a user account from localStorage after confirmation.
 * Prevents deletion of the hardcoded administrator account.
 * @param {string} username - The username of the account to delete.
 */
function deleteUser(username) {
    if (username === ADMIN_USERNAME) {
        showToast("Access Denied: The primary administrator account cannot be deleted.", 'error');
        return;
    }
    // Confirmation dialog for deletion
    if (confirm(`Are you absolutely sure you want to permanently delete user '${username}'? This action cannot be undone.`)) {
        let users = getUsers();
        users = users.filter(u => u.username !== username); // Filter out the user to delete
        saveUsers(users); // Save updated list
        showToast(`Account for '${username}' has been permanently deleted.`, 'info');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Deleted user ${username}'s account`);
    }
}

// --- Live User Activity Monitoring (Simulation) ---

/**
 * Simulates user activity and updates a global object tracking "online" users.
 * In a real application, this data would come from a backend (e.g., via WebSockets)
 * that tracks actual user sessions and actions.
 * @param {string} username - The username performing the simulated activity.
 * @param {string} feature - A description of the feature or action being used.
 */
function simulateUserActivity(username, feature) {
    const now = new Date();
    // Update or add user's activity
    activeUsersStatus[username] = {
        username: username,
        lastActivity: now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        currentFeature: feature,
        // Get actual status from stored users, default to 'offline' if not found or rejected
        status: (getUsers().find(u => u.username === username && u.status === 'approved') ? 'approved' : 'offline') 
    };
    // If the admin panel is currently visible, re-render the status list
    if (adminSection.style.display === 'block') {
        renderUserStatusList();
    }
}

/**
 * Renders the list of simulated active user statuses in the admin panel.
 * Displays username, last activity time, and current feature/action.
 */
function renderUserStatusList() {
    userStatusList.innerHTML = ''; // Clear existing list
    const statuses = Object.values(activeUsersStatus);

    // Update active sessions count
    activeSessionsCount.textContent = statuses.filter(s => s.status === 'approved').length;
    lastStatusUpdate.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (statuses.length === 0) {
        userStatusList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No active user sessions to display.</p>';
        return;
    }

    // Sort statuses by last activity, newest first
    statuses.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    statuses.forEach(status => {
        const statusItem = document.createElement('div');
        statusItem.classList.add('user-status-item');
        statusItem.innerHTML = `
            <strong>${status.username} 
                <span class="status-indicator status-${status.status === 'approved' ? 'online' : 'offline'}">
                    ${status.status === 'approved' ? 'Active' : 'Inactive'}
                </span>
            </strong>
            <p>Last Seen: ${status.lastActivity}</p>
            <p>Currently: ${status.currentFeature}</p>
        `;
        userStatusList.appendChild(statusItem);
    });
}

// --- Dynamic System Information (Client-Side) ---

/**
 * Updates the displayed battery information.
 * @param {BatteryManager} battery - The BatteryManager object from Navigator API.
 */
function updateBatteryInfo(battery) {
    const level = Math.floor(battery.level * 100);
    const chargingStatus = battery.charging ? '⚡ Charging' : '🔋 Discharging';
    batteryElement.innerHTML = `${level}% <small>(${chargingStatus})</small>`;
}

/**
 * Updates the displayed current time.
 */
function updateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    timeElement.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Fetches and displays IP address and geographical location information.
 */
async function fetchIpAndLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        ipElement.textContent = data.ip || 'N/A';
        regionElement.textContent = `${data.city || 'Unknown City'}, ${data.country_name || 'Unknown Country'}`;
    } catch (error) {
        console.error("Error fetching IP and location:", error);
        ipElement.innerHTML = '<span style="color: var(--text-secondary)">Unable to fetch</span>';
        regionElement.innerHTML = '<span style="color: var(--text-secondary)">Unable to fetch</span>';
        showToast("Failed to fetch client IP and location data.", "error");
    }
}

// --- Initial Setup and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Admin Account (if not exists)
    let initialUsers = getUsers();
    if (!initialUsers.some(u => u.username === ADMIN_USERNAME && u.role === 'admin')) {
        initialUsers.push({
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD,
            status: 'approved',
            role: 'admin',
            registrationDate: new Date().toISOString()
        });
        saveUsers(initialUsers);
    }
    
    // 2. Determine initial content view based on user status
    showContentForUser();
    
    // 3. Update navigation UI immediately
    updateNavUI();

    // 4. Attach Event Listeners
    // Authentication Form
    authForm.addEventListener('submit', handleAuthSubmit);
    toggleAuthMode.addEventListener('click', toggleAuthModeHandler);

    // Header Navigation Links (Desktop & Mobile)
    const allAuthNavLinks = [authLink, authLinkMobile, adminPanelLink, adminPanelLinkMobile, logoutLink, logoutLinkMobile].filter(Boolean); // Filter out nulls
    allAuthNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const linkId = e.target.id;
            if (linkId.includes('authLink')) {
                isRegisterMode = false;
                updateAuthFormUI();
                showContentForUser();
                smoothScrollTo('#authSection');
            } else if (linkId.includes('adminPanelLink')) {
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.role === 'admin') {
                    showContentForUser();
                    smoothScrollTo('#adminSection');
                } else {
                    showToast('Access Denied: Only administrators can access this panel.', 'error');
                }
            } else if (linkId.includes('logoutLink')) {
                clearCurrentUser();
                smoothScrollTo('#hero'); // Scroll to hero section after logout
            }
            // Close mobile menu if open
            if (mobileNavOverlay.classList.contains('open')) {
                mobileNavOverlay.classList.remove('open');
                menuToggle.classList.remove('active');
            }
        });
    });

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        mobileNavOverlay.classList.toggle('open');
        menuToggle.classList.toggle('active');
    });
    // Close mobile menu when clicking outside (simple click on overlay)
    mobileNavOverlay.addEventListener('click', (e) => {
        if (e.target === mobileNavOverlay) { // Only close if clicked on the overlay itself, not a link
            mobileNavOverlay.classList.remove('open');
            menuToggle.classList.remove('active');
        }
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            const wasActive = button.classList.contains('active');

            // Close all other open answers
            document.querySelectorAll('.faq-question.active').forEach(otherButton => {
                if (otherButton !== button) {
                    otherButton.classList.remove('active');
                    otherButton.nextElementSibling.classList.remove('open');
                }
            });

            // Toggle current answer
            if (!wasActive) {
                button.classList.add('active');
                answer.classList.add('open');
            }
        });
    });

    // 5. Initialize Client-Side System Info
    // Battery Status (if API available)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            updateBatteryInfo(battery);
            battery.addEventListener('levelchange', () => updateBatteryInfo(battery));
            battery.addEventListener('chargingchange', () => updateBatteryInfo(battery));
        }).catch(e => {
            console.warn("Battery status API not fully accessible:", e);
            batteryElement.innerHTML = '<span style="color: var(--text-secondary)">Access Denied</span>';
        });
    } else {
        batteryElement.innerHTML = '<span style="color: var(--text-secondary)">Not Available</span>';
    }

    // Current Time
    updateTime();
    setInterval(updateTime, 1000); // Update time every second

    // IP and Location
    fetchIpAndLocation();

    // 6. Simulate Initial User Activity (for demo purposes)
    simulateUserActivity('demoUser', 'Browse Public Documentation');
    
    // 7. Welcome Toast on first load if not logged in
    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) { 
            showToast('🚀 Welcome to Annas Elite API Platform! Login or Register to unlock full features.', 'info');
        }
    }, 2500); // Delay welcome toast slightly

    // 8. Periodic User Activity Update (Simulation)
    setInterval(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Determine current simulated feature based on scroll position or URL hash
            const currentHash = window.location.hash || '#hero'; 
            const featureMap = {
                '#hero': 'Exploring Homepage',
                '#info': 'Checking System Metrics',
                '#endpoints': 'Reviewing API Endpoints',
                '#features': 'Discovering Core Features',
                '#pricing': 'Comparing Pricing Plans',
                '#showcase': 'Viewing API Output Showcase',
                '#testimonials': 'Reading User Testimonials',
                '#faq': 'Consulting FAQ Section',
                '#contact': 'Preparing to Contact Support',
                '#authSection': 'Interacting with Login/Register Form',
                '#adminSection': 'Managing Admin Dashboard'
            };
            // Default activity if hash not mapped or user is just idle
            const currentFeature = featureMap[currentHash] || `Browse ${currentHash.substring(1) || 'Website'}`;
            simulateUserActivity(currentUser.username, currentFeature);
        }

        // Simulate activity for other 'approved' users who are not the current logged-in user
        getUsers().forEach(user => {
            if (user.username !== currentUser?.username && user.status === 'approved' && user.role === 'user') {
                const randomActivities = [
                    'Reviewing API usage statistics',
                    'Developing a new integration',
                    'Debugging API calls',
                    'Planning a feature implementation',
                    'Researching documentation for a specific endpoint',
                    'Testing API response structures',
                    'Optimizing API requests',
                    'Evaluating service uptime reports',
                    'Collaborating with team members',
                    'Considering premium features',
                    'Checking support forum for answers',
                    'Preparing a new project proposal'
                ];
                const randomFeature = randomActivities[Math.floor(Math.random() * randomActivities.length)];
                simulateUserActivity(user.username, randomFeature);
            }
        });
    }, 15000); // Update simulated status every 15 seconds
});

// End of script.js