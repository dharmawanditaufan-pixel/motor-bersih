/**
 * Auth Guard - Protects pages from unauthenticated access
 * Load this BEFORE other scripts on protected pages
 */

(function() {
    'use strict';
    
    console.log('🛡️ Auth Guard loading...');
    
    // Function to check if user is authenticated
    function isAuthenticated() {
        // Check 1: Token in sessionStorage
        const sessionToken = sessionStorage.getItem('authToken');
        if (sessionToken) {
            console.log('✓ Session token found');
            return true;
        }
        
        // Check 2: Token in localStorage (persistent)
        const localToken = localStorage.getItem('authToken');
        if (localToken) {
            // Check token age
            const tokenTime = parseInt(localStorage.getItem('authTokenTime') || '0');
            const hoursSinceToken = (Date.now() - tokenTime) / (1000 * 60 * 60);
            
            if (hoursSinceToken < 24) {
                // Token still valid, restore to sessionStorage
                sessionStorage.setItem('authToken', localToken);
                console.log('✓ Token restored from localStorage');
                return true;
            } else {
                console.log('⚠️ Token expired');
            }
        }
        
        // Check 3: User data in localStorage
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.username) {
                    console.log('✓ User data found:', user.username);
                    return true;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        console.log('❌ No valid authentication found');
        return false;
    }
    
    // Function to redirect to login
    function redirectToLogin() {
        const currentPath = window.location.pathname;
        const isInPagesFolder = currentPath.includes('/pages/');
        const loginUrl = isInPagesFolder ? '../index.html' : 'index.html';
        
        console.log('Redirecting to login:', loginUrl);
        
        // Show message
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        
        // Redirect
        window.location.href = loginUrl;
    }
    
    // Pages that don't need authentication
    const publicPages = [
        'index.html',
        '',
        '/'
    ];
    
    // Check if current page is public
    const currentPage = window.location.pathname.split('/').pop();
    const isPublicPage = publicPages.includes(currentPage);
    
    // If not public page and not authenticated, redirect
    if (!isPublicPage && !isAuthenticated()) {
        console.log('🚫 Unauthorized access to protected page');
        redirectToLogin();
    } else if (!isPublicPage) {
        console.log('✓ Auth Guard: Access granted');
    }
    
    // Auto-refresh token timestamp on page activity
    let activityTimer;
    function refreshActivity() {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
            if (token) {
                localStorage.setItem('authTokenTime', Date.now().toString());
                console.log('💓 Token timestamp refreshed');
            }
        }, 1000); // Debounce 1 second
    }
    
    // Listen for user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, refreshActivity, { passive: true });
    });
    
    // Expose auth check function globally
    window.authGuard = {
        isAuthenticated: isAuthenticated,
        redirectToLogin: redirectToLogin
    };
    
    console.log('✓ Auth Guard ready');
})();
