/**
 * Session Persistence Enhancement
 * Improves token handling and prevents premature logout
 */

// Extend APIClient with better token management
(function() {
    'use strict';
    
    // Store original methods
    const originalSetToken = APIClient.prototype.setToken;
    const originalGetToken = APIClient.prototype.getToken;
    
    // Enhanced setToken - also store in localStorage for persistence
    APIClient.prototype.setToken = function(token) {
        this.token = token;
        
        if (token) {
            // Store in both sessionStorage and localStorage
            sessionStorage.setItem('authToken', token);
            localStorage.setItem('authToken', token);
            localStorage.setItem('authTokenTime', Date.now().toString());
            
            console.log('✓ Token stored in both session and local storage');
        } else {
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTokenTime');
        }
    };
    
    // Enhanced getToken - check both storages with fallback
    APIClient.prototype.getToken = function() {
        // Priority 1: In-memory token
        if (this.token) {
            return this.token;
        }
        
        // Priority 2: sessionStorage (current session)
        let token = sessionStorage.getItem('authToken');
        if (token) {
            this.token = token;
            return token;
        }
        
        // Priority 3: localStorage (persistent across sessions)
        token = localStorage.getItem('authToken');
        if (token) {
            // Check if token is not too old (24 hours)
            const tokenTime = parseInt(localStorage.getItem('authTokenTime') || '0');
            const hoursSinceToken = (Date.now() - tokenTime) / (1000 * 60 * 60);
            
            if (hoursSinceToken < 24) {
                // Token still valid, restore to sessionStorage
                this.token = token;
                sessionStorage.setItem('authToken', token);
                console.log('✓ Token restored from localStorage');
                return token;
            } else {
                // Token too old, clear it
                console.log('⚠ Token expired, clearing...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('authTokenTime');
            }
        }
        
        return null;
    };
    
    // Add method to refresh token validity
    APIClient.prototype.refreshTokenTime = function() {
        const token = this.getToken();
        if (token) {
            localStorage.setItem('authTokenTime', Date.now().toString());
            console.log('✓ Token timestamp refreshed');
        }
    };
    
    // Auto-refresh token timestamp on any API call
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        
        // If this is an API call with auth header
        if (typeof url === 'string' && url.includes('/api/') && window.apiClient) {
            window.apiClient.refreshTokenTime();
        }
        
        return originalFetch.apply(this, args);
    };
    
    console.log('✓ Session Persistence Enhancement loaded');
})();

// Add heartbeat to keep session alive
(function() {
    'use strict';
    
    // Send heartbeat every 5 minutes to keep session alive
    const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    function sendHeartbeat() {
        if (window.apiClient && window.apiClient.getToken()) {
            console.log('💓 Session heartbeat');
            window.apiClient.refreshTokenTime();
        }
    }
    
    // Start heartbeat when page loads if user is authenticated
    if (window.apiClient && window.apiClient.getToken()) {
        setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
        console.log('✓ Session heartbeat started');
    }
})();

// Add visibility change handler to restore session
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.apiClient) {
        const token = window.apiClient.getToken();
        if (token) {
            console.log('✓ Page visible, session restored');
        }
    }
});

// Before page unload, ensure token is saved
window.addEventListener('beforeunload', function() {
    if (window.apiClient) {
        const token = window.apiClient.getToken();
        if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('authTokenTime', Date.now().toString());
        }
    }
});

console.log('✓ Session Persistence module loaded');
