/**
 * API Client for Motor Bersih POS System
 * Handles all API communications with the backend
 */

class APIClient {
    constructor() {
        // Dynamically detect base URL
        this.baseURL = this.detectBaseURL();
        this.token = this.getStoredToken();
    }

    /**
     * Detect API base URL dynamically
     * Works with any folder structure
     */
    detectBaseURL() {
        // Check for production environment variable (set during build)
        if (typeof PRODUCTION_API_URL !== 'undefined' && PRODUCTION_API_URL) {
            return PRODUCTION_API_URL;
        }
        
        // Production backend URL (Vercel deployed)
        if (window.location.hostname.includes('vercel.app')) {
            // TEMPORARY: Use local backend for testing
            // TODO: Replace with actual Railway URL after backend deployment
            return 'http://localhost/motor-bersih/api/';
        }
        
        // Local development - detect path
        const pathArray = window.location.pathname.split('/').filter(p => p);
        const appIndex = pathArray.indexOf('motor-bersih');
        
        if (appIndex >= 0) {
            const basePath = '/' + pathArray.slice(0, appIndex + 1).join('/');
            return basePath + '/api/';
        }
        
        // Fallback to root
        return '/api/';
    }

    /**
     * Get stored token from storage with multi-tier fallback
     */
    getStoredToken() {
        try {
            // Priority 1: sessionStorage
            let token = sessionStorage.getItem('authToken');
            if (token) return token;
            
            // Priority 2: localStorage with age check
            token = localStorage.getItem('authToken');
            if (token) {
                const tokenTime = parseInt(localStorage.getItem('authTokenTime') || '0');
                const hoursSinceToken = (Date.now() - tokenTime) / (1000 * 60 * 60);
                
                // Token valid for 24 hours
                if (hoursSinceToken < 24) {
                    // Restore to sessionStorage
                    sessionStorage.setItem('authToken', token);
                    console.log('✓ Token restored from localStorage');
                    return token;
                }
            }
            
            return null;
        } catch (e) {
            console.error('Error getting token:', e);
            return null;
        }
    }

    /**
     * Set authentication token with dual storage
     * @param {string} token - JWT or demo token
     */
    setToken(token) {
        this.token = token;
        
        if (token) {
            // Store in both storages for persistence
            sessionStorage.setItem('authToken', token);
            localStorage.setItem('authToken', token);
            localStorage.setItem('authTokenTime', Date.now().toString());
            console.log('✓ Token stored in dual storage');
        } else {
            // Clear from both storages
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTokenTime');
        }
    }

    /**
     * Get stored token with auto-restore
     * @returns {string|null}
     */
    getToken() {
        // Priority 1: In-memory token
        if (this.token) return this.token;
        
        // Priority 2: Get from storage (with auto-restore)
        const token = this.getStoredToken();
        if (token) {
            this.token = token;
            return token;
        }
        
        return null;
    }
    
    /**
     * Refresh token timestamp to keep session alive
     */
    refreshToken() {
        const token = this.getToken();
        if (token) {
            localStorage.setItem('authTokenTime', Date.now().toString());
        }
    }

    /**
     * Initialize API client with token restoration
     */
    async init() {
        // Try to restore token from storage
        const token = this.getStoredToken();
        if (token) {
            this.token = token;
            console.log('✓ API Client initialized with stored token');
        } else {
            console.log('⚠ No stored token found');
        }
    }

    /**
     * Test API connection and database status
     * @returns {Promise<Object>} Connection status
     */
    async testConnection() {
        try {
            const response = await fetch(this.baseURL + 'status.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API connection test failed:', error);
            return {
                success: false,
                error: error.message,
                database: null,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Authenticate user
     * @param {string} username
     * @param {string} password
     * @param {string} role - admin/operator
     * @returns {Promise<Object>} Login result
     */
    async login(username, password, role) {
        try {
            const response = await fetch(this.baseURL + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // If login successful, store token
            if (data.success && data.token) {
                this.setToken(data.token);
            }

            return data;
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.message,
                message: 'Connection failed. Please check your internet connection.'
            };
        }
    }

    /**
     * Get dashboard data
     * @param {string} period - today/week/month
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboardData(period = 'today') {
        try {
            const token = this.getToken();
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}dashboard.php?period=${period}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Dashboard data fetch failed:', error);
            return {
                success: false,
                error: error.message,
                summary: null,
                recent_transactions: [],
                top_customers: [],
                operator_stats: [],
                chart_data: []
            };
        }
    }

    /**
     * Validate current token
     * @returns {Promise<Object>} Token validation result
     */
    async validateToken() {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, error: 'No token found' };
            }

            const response = await fetch(this.baseURL + 'auth.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Token validation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Logout - clear token from all storage
     */
    logout() {
        this.token = null;
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenTime');
        console.log('✓ Logged out - all tokens cleared');
    }
}

// Create global instance and initialize
const apiClient = new APIClient();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        apiClient.init();
    });
} else {
    apiClient.init();
}

window.apiClient = apiClient;
window.api = apiClient; // For backward compatibility