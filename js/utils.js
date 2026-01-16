// Add these functions to your existing utils.js

// Session management
function checkSession() {
    const session = localStorage.getItem('motowash_session');
    if (!session) return false;
    
    try {
        const sessionData = JSON.parse(session);
        return Date.now() < sessionData.expiry;
    } catch (error) {
        console.error('Error checking session:', error);
        return false;
    }
}

function getCurrentUser() {
    const session = localStorage.getItem('motowash_session');
    if (!session) return null;
    
    try {
        const sessionData = JSON.parse(session);
        return sessionData.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

function requireAuth() {
    if (!checkSession()) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

function requireRole(role) {
    if (!requireAuth()) return false;
    
    const user = getCurrentUser();
    if (user.role !== role) {
        showNotification('Akses ditolak. Role tidak sesuai.', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return false;
    }
    return true;
}

// Password validation
function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
        errors: [
            password.length < minLength ? `Minimal ${minLength} karakter` : null,
            !hasUpperCase ? 'Harus mengandung huruf besar' : null,
            !hasLowerCase ? 'Harus mengandung huruf kecil' : null,
            !hasNumbers ? 'Harus mengandung angka' : null
        ].filter(error => error !== null)
    };
}

// Token generation (for API calls in production)
function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// API request helper with auth headers
async function apiRequest(endpoint, method = 'GET', data = null) {
    const session = localStorage.getItem('motowash_session');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (session) {
        headers['Authorization'] = `Bearer ${JSON.parse(session).token}`;
    }
    
    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
    };
    
    try {
        // In production, replace with your API URL
        const baseUrl = 'http://localhost:3000/api'; // Example
        const response = await fetch(`${baseUrl}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Export the new functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ...module.exports,
        checkSession,
        getCurrentUser,
        requireAuth,
        requireRole,
        validatePassword,
        generateToken,
        apiRequest
    };
}