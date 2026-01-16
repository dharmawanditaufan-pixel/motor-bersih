/**
 * API Client for MotoWash POS
 * Handles all API calls to backend
 */

class APIClient {
    constructor() {
        this.baseURL = '/motor-bersih/api';
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = {
            method,
            headers,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                this.removeToken();
                window.location.href = '../index.html';
                throw new Error('Session expired. Please login again.');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `API request failed with status ${response.status}`);
            }

            return result;

        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // AUTH ENDPOINTS
    async login(username, password, role) {
        return this.request('auth.php', 'POST', { username, password, role });
    }

    async logout() {
        return this.request('auth.php', 'GET');
    }

    // DASHBOARD ENDPOINTS
    async getDashboardData(period = 'today') {
        return this.request(`dashboard.php?period=${period}`, 'GET');
    }

    // TRANSACTION ENDPOINTS
    async getTransactions(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`transactions.php?${queryParams}`, 'GET');
    }

    async getTransaction(id) {
        return this.request(`transactions.php?id=${id}`, 'GET');
    }

    async createTransaction(transactionData) {
        return this.request('transactions.php', 'POST', transactionData);
    }

    async updateTransaction(id, updates) {
        return this.request(`transactions.php?id=${id}`, 'PUT', updates);
    }

    // CUSTOMER ENDPOINTS
    async getCustomers(filters = {}) {
        return this.request(`customers.php?${new URLSearchParams(filters)}`, 'GET');
    }

    async getCustomer(id) {
        return this.request(`customers.php?id=${id}`, 'GET');
    }

    async createCustomer(customerData) {
        return this.request('customers.php', 'POST', customerData);
    }

    async updateCustomer(id, updates) {
        return this.request(`customers.php?id=${id}`, 'PUT', updates);
    }

    // OPERATOR ENDPOINTS
    async getOperators(filters = {}) {
        return this.request(`operators.php?${new URLSearchParams(filters)}`, 'GET');
    }

    async getOperator(id) {
        return this.request(`operators.php?id=${id}`, 'GET');
    }

    async updateOperator(id, updates) {
        return this.request(`operators.php?id=${id}`, 'PUT', updates);
    }

    // COMMISSION ENDPOINTS
    async getCommissions(filters = {}) {
        return this.request(`commissions.php?${new URLSearchParams(filters)}`, 'GET');
    }

    async processCommissionPayout(operatorId, amount) {
        return this.request('commissions.php', 'POST', { operatorId, amount });
    }

    // SETTINGS ENDPOINTS
    async getSettings() {
        return this.request('settings.php', 'GET');
    }

    async updateSettings(settings) {
        return this.request('settings.php', 'PUT', settings);
    }

    // UTILITY METHODS
    async searchCustomers(query) {
        return this.request(`customers.php?search=${encodeURIComponent(query)}`, 'GET');
    }

    async getMotorcycleTypes() {
        return this.request('motorcycle-types.php', 'GET');
    }

    async getWashTypes(motorcycleTypeId) {
        return this.request(`wash-types.php?motorcycle_type_id=${motorcycleTypeId}`, 'GET');
    }

    async getAdditionalServices() {
        return this.request('additional-services.php', 'GET');
    }
}

// Initialize API Client
const apiClient = new APIClient();
window.apiClient = apiClient;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}