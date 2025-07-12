// --- Core UI Functions (from original code) ---
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

const batteryElement = document.getElementById('battery');

if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
        updateBatteryInfo(battery);
        battery.addEventListener('levelchange', () => updateBatteryInfo(battery));
        battery.addEventListener('chargingchange', () => updateBatteryInfo(battery));
    });
} else {
    batteryElement.innerHTML = '<span style="color: var(--text-secondary)">Not Available</span>';
}

function updateBatteryInfo(battery) {
    const level = Math.floor(battery.level * 100);
    const charging = battery.charging ? '⚡ Charging' : '🔋 Battery';
    batteryElement.innerHTML = `${level}% ${charging}`;
}

const timeElement = document.getElementById('time');

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

updateTime();
setInterval(updateTime, 1000);

const ipElement = document.getElementById('ip');
const regionElement = document.getElementById('region');

fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
        ipElement.textContent = data.ip;
        regionElement.textContent = `${data.city}, ${data.country_name}`;
    })
    .catch(error => {
        ipElement.innerHTML = '<span style="color: var(--text-secondary)">Unable to fetch</span>';
        regionElement.innerHTML = '<span style="color: var(--text-secondary)">Unable to fetch</span>';
    });

function copyEndpoint(path) {
    const fullUrl = window.location.origin + path;
    navigator.clipboard.writeText(fullUrl)
        .then(() => {
            showToast('🎉 Endpoint URL copied successfully!');
        })
        .catch(err => {
            showToast('❌ Failed to copy endpoint URL');
        });
}

function goToEndpoint(path) {
    window.open(window.location.origin + path, '_blank');
}

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.className = 'toast'; // Reset classes
    toast.classList.add('show', type);
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
            setTimeout(() => {
                toast.style.display = 'flex'; // Reset display for next show
            }, 100);
        }, 500);
    }, 3000);
}

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.section, .animate-card').forEach(el => {
    observer.observe(el);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.querySelectorAll('.info-card, .endpoint').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        const speed = 0.5 + (index * 0.1);
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
    });
});

// --- New Auth and Admin Logic ---
const AUTH_KEY = 'annas_users';
const CURRENT_USER_KEY = 'annas_current_user';
const ADMIN_USERNAME = 'Anas';
const ADMIN_PASSWORD = '1admin'; // WARNING: In a real app, this should be hashed and stored securely on the backend.

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

let isRegisterMode = false;

// Admin Panel Elements
const adminUsersList = document.getElementById('adminUsersList');
const userStatusList = document.getElementById('userStatusList');

function getUsers() {
    const users = localStorage.getItem(AUTH_KEY);
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function setCurrentUser(username, role, status = 'active') {
    const user = { username, role, status, lastActivity: new Date().toISOString(), currentFeature: 'Browse Home' };
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)); // Use sessionStorage for current session
    updateNavUI();
    showContentForUser();
    showToast(`Welcome, ${username}!`, 'info');
}

function getCurrentUser() {
    const user = sessionStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
}

function clearCurrentUser() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    updateNavUI();
    showContentForUser();
    showToast('You have been logged out.', 'info');
}

function updateNavUI() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        authLink.style.display = 'none';
        logoutLink.style.display = 'block';
        if (currentUser.role === 'admin') {
            adminPanelLink.style.display = 'block';
        } else {
            adminPanelLink.style.display = 'none';
        }
    } else {
        authLink.style.display = 'block';
        logoutLink.style.display = 'none';
        adminPanelLink.style.display = 'none';
    }
}

function showContentForUser() {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.status === 'approved') {
        authSection.style.display = 'none';
        adminSection.style.display = 'none';
        mainContent.style.display = 'block';
        // Simulate initial activity
        simulateUserActivity(currentUser.username, 'Viewing API Endpoints');
    } else if (currentUser && currentUser.role === 'admin') {
        authSection.style.display = 'none';
        mainContent.style.display = 'none';
        adminSection.style.display = 'block';
        showAdminPanel();
        simulateUserActivity(currentUser.username, 'Managing Users');
    }
     else {
        // If not logged in or pending/rejected, show login/register form
        authSection.style.display = 'flex';
        adminSection.style.display = 'none';
        mainContent.style.display = 'none';
    }
}

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
        const newUser = { username, password, status: 'pending', role: 'user', registrationDate: new Date().toISOString() };
        users.push(newUser);
        saveUsers(users);
        showToast('Registration successful! Please wait for administrator approval.', 'info');
        // Switch back to login after registration
        isRegisterMode = false;
        updateAuthFormUI();
    } else {
        // Login Logic
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setCurrentUser(ADMIN_USERNAME, 'admin');
            showContentForUser();
            return;
        }

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            if (user.status === 'approved') {
                setCurrentUser(user.username, user.role, user.status);
                showContentForUser();
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

function updateAuthFormUI() {
    if (isRegisterMode) {
        authTitle.textContent = 'Register';
        authSubmitBtn.textContent = 'Register';
        toggleAuthText.textContent = 'Already have an account? ';
        toggleAuthMode.textContent = 'Login here';
    } else {
        authTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        toggleAuthText.textContent = "Don't have an account? ";
        toggleAuthMode.textContent = 'Register now';
    }
    usernameInput.value = '';
    passwordInput.value = '';
}

function toggleAuthModeHandler(event) {
    event.preventDefault();
    isRegisterMode = !isRegisterMode;
    updateAuthFormUI();
}

function showAdminPanel() {
    renderAdminUsersList();
    renderUserStatusList();
}

function renderAdminUsersList() {
    let users = getUsers();
    adminUsersList.innerHTML = ''; // Clear existing list

    const pendingUsers = users.filter(user => user.status === 'pending');
    const registeredUsers = users.filter(user => user.status !== 'pending' && user.role !== 'admin'); // Exclude admin from this list

    if (pendingUsers.length === 0 && registeredUsers.length === 0) {
        adminUsersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No pending registrations or registered users.</p>';
        return;
    }

    // Render Pending Users
    if (pendingUsers.length > 0) {
        const pendingHeader = document.createElement('h3');
        pendingHeader.style.textAlign = 'left';
        pendingHeader.style.marginBottom = '1rem';
        pendingHeader.style.color = 'var(--pending-color)';
        pendingHeader.textContent = 'Pending Registrations';
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
        registeredHeader.style.textAlign = 'left';
        registeredHeader.style.marginBottom = '1rem';
        registeredHeader.textContent = 'Registered Users';
        adminUsersList.appendChild(registeredHeader);

        registeredUsers.forEach(user => {
            const userItem = createUserListItem(user, false); // false for normal registered actions
            adminUsersList.appendChild(userItem);
        });
    }
}

function createUserListItem(user, isPending) {
    const userItem = document.createElement('div');
    userItem.classList.add('admin-user-item');
    userItem.dataset.username = user.username;

    const userInfo = document.createElement('div');
    userInfo.classList.add('admin-user-info');
    userInfo.innerHTML = `
        <span>${user.username}</span>
        <small>Status: ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</small>
        <small>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</small>
    `;
    userItem.appendChild(userInfo);

    const userActions = document.createElement('div');
    userActions.classList.add('admin-user-actions');

    if (isPending) {
        const approveBtn = document.createElement('button');
        approveBtn.classList.add('approve');
        approveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Approve`;
        approveBtn.onclick = () => approveUser(user.username);
        userActions.appendChild(approveBtn);

        const rejectBtn = document.createElement('button');
        rejectBtn.classList.add('reject');
        rejectBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Reject`;
        rejectBtn.onclick = () => rejectUser(user.username);
        userActions.appendChild(rejectBtn);
    } else {
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete');
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 16 7 16h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg> Delete`;
        deleteBtn.onclick = () => deleteUser(user.username);
        userActions.appendChild(deleteBtn);
    }

    userItem.appendChild(userActions);
    return userItem;
}

function approveUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'approved';
        saveUsers(users);
        showToast(`User ${username} approved!`, 'success');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Approved ${username}`);
    }
}

function rejectUser(username) {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        users[userIndex].status = 'rejected';
        saveUsers(users);
        showToast(`User ${username} rejected.`, 'error');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Rejected ${username}`);
    }
}

function deleteUser(username) {
    if (username === ADMIN_USERNAME) {
        showToast("Cannot delete the administrator account.", 'error');
        return;
    }
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
        let users = getUsers();
        users = users.filter(u => u.username !== username);
        saveUsers(users);
        showToast(`User ${username} deleted.`, 'info');
        renderAdminUsersList(); // Re-render the list
        simulateUserActivity(ADMIN_USERNAME, `Deleted ${username}`);
    }
}

// --- Simulate User Activity (for demonstration purposes) ---
// This is a placeholder. In a real app, this data would come from a backend.
let activeUsersStatus = {};

function simulateUserActivity(username, feature) {
    const now = new Date();
    activeUsersStatus[username] = {
        username: username,
        lastActivity: now.toLocaleString(),
        currentFeature: feature
    };
    // Update admin panel if visible
    if (adminSection.style.display === 'block') {
        renderUserStatusList();
    }
}

function renderUserStatusList() {
    userStatusList.innerHTML = '';
    const statuses = Object.values(activeUsersStatus);

    if (statuses.length === 0) {
        userStatusList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active users to display status.</p>';
        return;
    }

    statuses.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    statuses.forEach(status => {
        const statusItem = document.createElement('div');
        statusItem.classList.add('user-status-item');
        statusItem.innerHTML = `
            <strong>${status.username}</strong>
            <p>Last Activity: ${status.lastActivity}</p>
            <p>Doing: ${status.currentFeature}</p>
        `;
        userStatusList.appendChild(statusItem);
    });
}

// Initial setup and event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Ensure admin account exists initially for demonstration
    let users = getUsers();
    if (!users.some(u => u.username === ADMIN_USERNAME)) {
        users.push({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD, status: 'approved', role: 'admin', registrationDate: new Date().toISOString() });
        saveUsers(users);
    }
    
    showContentForUser(); // Determine which section to show on load
    updateNavUI(); // Update nav links based on login status

    authForm.addEventListener('submit', handleAuthSubmit);
    toggleAuthMode.addEventListener('click', toggleAuthModeHandler);

    authLink.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = false;
        updateAuthFormUI();
        showContentForUser(); // Will show auth section
    });

    adminPanelLink.addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.role === 'admin') {
            showContentForUser(); // Will show admin panel
        } else {
            showToast('Access Denied: Not an administrator.', 'error');
        }
    });

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearCurrentUser();
    });

    // Simulate some initial user activities (for demo)
    simulateUserActivity('guestUser', 'Browse Documentation');
    
    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) { // Only show welcome if not already logged in
            showToast('🚀 Welcome to Annas API Documentation! Please Login or Register.', 'info');
        }
    }, 2000);
});

// Set interval to update user statuses periodically for demo
setInterval(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const currentRoute = window.location.hash.substring(1) || 'home';
        simulateUserActivity(currentUser.username, `Navigating to #${currentRoute}`);
    }
    // Add some random activity for other "users" if they exist
    let users = getUsers();
    users.forEach(user => {
        if (user.username !== currentUser?.username && user.status === 'approved') {
            const randomFeatures = [
                'Checking Endpoints',
                'Reading System Info',
                'Considering Contact',
                'Looking for APIs',
                'Thinking...'
            ];
            const randomFeature = randomFeatures[Math.floor(Math.random() * randomFeatures.length)];
            simulateUserActivity(user.username, randomFeature);
        }
    });
}, 15000); // Update every 15 seconds for demonstration