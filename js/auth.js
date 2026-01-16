/**
 * Authentication module for MotoWash POS
 * Handles user login, session management, and role-based access
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionTimeout = 60 * 60 * 1000; // 1 hour in milliseconds
        this.init();
    }

    init() {
        this.loadSession();
        this.setupEventListeners();
        this.checkAutoLogout();
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        console.log('Login form found:', !!loginForm);
        if (loginForm) {
            console.log('Attaching login submit handler');
            loginForm.addEventListener('submit', (e) => {
                console.log('Form submitted');
                this.handleLogin(e);
            });
        }

        // Password visibility toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Auto-check session on page load
        if (document.querySelector('.main-content') || document.getElementById('dashboardPage')) {
            this.checkAuth();
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const role = document.getElementById('role')?.value;

        // Validate inputs
        if (!username || !password || !role) {
            this.showMessage('Harap isi semua field', 'error');
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Authenticate user
            const user = await this.authenticate(username, password, role);
            
            if (user) {
                // Create session
                this.createSession(user);
                
                // Show success message
                this.showMessage('Login berhasil! Mengarahkan ke dashboard...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage('Username, password, atau role salah', 'error');
                this.showLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Terjadi kesalahan saat login', 'error');
            this.showLoading(false);
        }
    }

    async authenticate(username, password, role) {
        try {
            this.showLoading(true);

            console.log('Calling apiClient.login with:', {username, password, role});
            const result = await apiClient.login(username, password, role);
            console.log('API response:', result);

            if (result && result.success) {
                apiClient.setToken(result.token);

                const userData = {
                    id: result.user.id,
                    username: result.user.username,
                    name: result.user.name,
                    role: result.user.role,
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('isAuthenticated', 'true');

                this.showMessage('Login berhasil! Mengarahkan ke dashboard...', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

                return result.user;
            } else {
                this.showMessage((result && result.error) || 'Login failed', 'error');
                this.showLoading(false);
                return null;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login gagal. Periksa koneksi internet.', 'error');
            this.showLoading(false);
            return null;
        }
    }

    async getUsers() {
        // Try to load from localStorage first
        const storedUsers = localStorage.getItem('motowash_users');
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }

        // Default demo users
        const defaultUsers = [
            {
                id: 'USR001',
                username: 'admin',
                password: 'admin123',
                name: 'Administrator',
                role: 'admin',
                phone: '081234567890',
                created_at: '2024-01-01T00:00:00Z',
                permissions: ['all']
            },
            {
                id: 'OPR001',
                username: 'operator1',
                password: 'op123',
                name: 'Budi Santoso',
                role: 'operator',
                phone: '081234567891',
                commission_rate: 30,
                total_commission: 0,
                created_at: '2024-01-15T00:00:00Z',
                permissions: ['create_transaction', 'view_dashboard']
            },
            {
                id: 'OPR002',
                username: 'operator2',
                password: 'op456',
                name: 'Siti Rahma',
                role: 'operator',
                phone: '081234567892',
                commission_rate: 30,
                total_commission: 0,
                created_at: '2024-01-20T00:00:00Z',
                permissions: ['create_transaction', 'view_dashboard']
            }
        ];

        // Save to localStorage
        localStorage.setItem('motowash_users', JSON.stringify(defaultUsers));
        
        return defaultUsers;
    }

    createSession(user) {
        // Remove password from session data
        const { password, ...userData } = user;
        
        // Create session object
        const session = {
            user: userData,
            loginTime: new Date().toISOString(),
            expiry: Date.now() + this.sessionTimeout
        };

        // Save to localStorage
        localStorage.setItem('motowash_session', JSON.stringify(session));
        
        // Update instance state
        this.currentUser = userData;
        this.isAuthenticated = true;
        
        // Set timeout for auto logout
        this.setAutoLogout();
        
        console.log('Session created for:', userData.name);
    }

    loadSession() {
        try {
            const sessionData = localStorage.getItem('motowash_session');
            
            if (!sessionData) {
                this.isAuthenticated = false;
                this.currentUser = null;
                return;
            }

            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (Date.now() > session.expiry) {
                this.clearSession();
                this.isAuthenticated = false;
                return;
            }

            // Load user data
            this.currentUser = session.user;
            this.isAuthenticated = true;
            
            // Update UI if on dashboard
            this.updateUserUI();
            
            // Reset auto logout timer
            this.setAutoLogout();
            
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    }

    checkAuth() {
        if (!this.isAuthenticated || !this.currentUser) {
            // Redirect to login if not authenticated
            this.redirectToLogin();
            return false;
        }
        
        // Check role-based access if needed
        const currentPage = window.location.pathname;
        if (!this.hasPageAccess(currentPage)) {
            this.showMessage('Anda tidak memiliki akses ke halaman ini', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return false;
        }
        
        return true;
    }

    hasPageAccess(page) {
        if (!this.currentUser) return false;
        
        // Admin has access to all pages
        if (this.currentUser.role === 'admin') return true;
        
        // Operator access control
        const operatorPages = [
            'dashboard.html',
            'register-wash.html',
            'camera-capture.html'
        ];
        
        const pageName = page.split('/').pop();
        return operatorPages.includes(pageName);
    }

    updateUserUI() {
        // Update dashboard user info
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name;
        }
        
        if (userRoleElement && this.currentUser) {
            userRoleElement.textContent = 
                this.currentUser.role === 'admin' ? 'Administrator' : 'Operator';
        }
        
        // Update current time
        this.updateCurrentTime();
        
        // Start time updater
        if (!this.timeUpdater) {
            this.timeUpdater = setInterval(() => this.updateCurrentTime(), 1000);
        }
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePassword');
        
        if (passwordInput && toggleIcon) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update icon
            const icon = toggleIcon.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        }
    }

    logout() {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            this.clearSession();
            
            // Show logout message
            this.showMessage('Logout berhasil', 'success');
            
            // Redirect to login after delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        }
    }

    clearSession() {
        // Clear localStorage
        localStorage.removeItem('motowash_session');
        
        // Clear instance state
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Clear timers
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
        }
        
        if (this.timeUpdater) {
            clearInterval(this.timeUpdater);
        }
        
        console.log('Session cleared');
    }

    setAutoLogout() {
        // Clear existing timer
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
        }
        
        // Set new timer
        this.autoLogoutTimer = setTimeout(() => {
            this.showMessage('Sesi telah berakhir. Silakan login kembali.', 'warning');
            this.logout();
        }, this.sessionTimeout);
    }

    checkAutoLogout() {
        // Check on page load
        const sessionData = localStorage.getItem('motowash_session');
        
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const timeLeft = session.expiry - Date.now();
            
            if (timeLeft <= 0) {
                this.logout();
            } else if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
                this.showMessage(
                    `Sesi akan berakhir dalam ${Math.ceil(timeLeft / 60000)} menit`, 
                    'warning'
                );
            }
        }
    }

    redirectToLogin() {
        // Only redirect if not already on login page
        const currentPage = window.location.pathname;
        if (!currentPage.includes('index.html') && !currentPage.endsWith('/')) {
            window.location.href = '../index.html';
        }
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.innerHTML = `
            <div class="auth-message-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        const container = document.getElementById('loginMessage') || 
                         document.querySelector('.login-card') ||
                         document.body;
        
        if (container.id === 'loginMessage') {
            container.innerHTML = messageDiv.innerHTML;
            container.className = `auth-message auth-message-${type}`;
            container.style.display = 'block';
        } else {
            container.appendChild(messageDiv);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }, 5000);
        }
        
        // Add styles if not already added
        this.addMessageStyles();
    }

    getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    addMessageStyles() {
        if (document.getElementById('auth-message-styles')) return;
        
        const styles = `
            .auth-message {
                padding: 12px 16px;
                border-radius: 8px;
                margin: 10px 0;
                display: flex;
                align-items: center;
                animation: slideInDown 0.3s ease-out;
                border-left: 4px solid transparent;
            }
            
            .auth-message-success {
                background-color: rgba(76, 201, 240, 0.1);
                border-color: #4cc9f0;
                color: #0c5460;
            }
            
            .auth-message-error {
                background-color: rgba(247, 37, 133, 0.1);
                border-color: #f72585;
                color: #721c24;
            }
            
            .auth-message-warning {
                background-color: rgba(248, 150, 30, 0.1);
                border-color: #f8961e;
                color: #856404;
            }
            
            .auth-message-info {
                background-color: rgba(72, 149, 239, 0.1);
                border-color: #4895ef;
                color: #004085;
            }
            
            .auth-message-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .auth-message-content i {
                font-size: 18px;
            }
            
            @keyframes slideInDown {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'auth-message-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    showLoading(show = true) {
        const submitBtn = document.querySelector('.btn-login');
        
        if (submitBtn) {
            if (show) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
                submitBtn.disabled = true;
            } else {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                submitBtn.disabled = false;
            }
        }
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    isOperator() {
        return this.currentUser?.role === 'operator';
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.isAdmin()) return true;
        return this.currentUser.permissions?.includes(permission) || false;
    }

    // Public API
    static getInstance() {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = AuthManager.getInstance();
});

// Export for testing and other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Auto-initialize for pages that need it
(function() {
    // Check if we're on a page that needs auth
    const pagesNeedingAuth = [
        'dashboard.html',
        'register-wash.html',
        'camera-capture.html',
        'transactions.html',
        'customers.html',
        'operators.html',
        'reports.html',
        'expenses.html',
        'settings.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (pagesNeedingAuth.includes(currentPage)) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                const auth = AuthManager.getInstance();
                if (!auth.checkAuth()) {
                    console.warn('Authentication failed, redirecting to login');
                }
            });
        } else {
            const auth = AuthManager.getInstance();
            if (!auth.checkAuth()) {
                console.warn('Authentication failed, redirecting to login');
            }
        }
    }
})();