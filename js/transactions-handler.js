/**
 * Transaction Manager for Motor Bersih
 * Handles vehicle data capture, operator selection, and transaction submission
 * With real-time price calculation and API integration
 */

class TransactionManager {
    constructor() {
        this.currentTransaction = {
            customer_id: null,
            operator_id: null,
            wash_type: 'standard',
            amount: 0,
            payment_method: 'cash',
            customer_name: '',
            license_plate: '',
            motorcycle_type: 'matic'
        };

        this.washPrices = {
            'basic': 25000,
            'standard': 50000,
            'premium': 100000
        };

        this.apiClient = null;
        this.operators = [];
        this.customers = [];

        this.init();
    }

    async init() {
        // Initialize API client first
        if (typeof APIClient === 'undefined') {
            console.error('APIClient not loaded');
            alert('System error: APIClient not available');
            return;
        }

        if (typeof window.apiClient === 'undefined') {
            window.apiClient = new APIClient();
            await window.apiClient.init();
        }
        this.apiClient = window.apiClient;

        // Refresh token to keep session alive
        this.apiClient.refreshToken();

        // Check authentication - let API client restore token if needed
        const token = this.apiClient.getToken();
        
        if (!token) {
            console.warn('No token found, redirecting to login...');
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            window.location.href = '../index.html';
            return;
        }

        console.log('✓ Token found:', token.substring(0, 20) + '...');
        console.log('✓ User authenticated');
        console.log('✓ Session refreshed');

        // Load operators
        await this.loadOperators();

        // Setup form listeners
        this.setupFormListeners();

        // Generate transaction ID
        this.generateTransactionId();

        console.log('✓ Transaction manager initialized');
    }

    checkAuth() {
        // Method 1: Check authManager
        const authManager = window.authManager;
        if (authManager && authManager.isAuthenticated) {
            return true;
        }

        // Method 2: Check token in storage
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        if (token) {
            console.log('Token found in storage, user is authenticated');
            return true;
        }

        // Method 3: Check if we have user data
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.username) {
                    return true;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        // No authentication found
        console.warn('No authentication found, redirecting to login');
        window.location.href = '../index.html';
        return false;
    }

    setupFormListeners() {
        // Vehicle form submission
        const vehicleForm = document.getElementById('vehicleForm');
        if (vehicleForm) {
            vehicleForm.addEventListener('submit', (e) => this.handleVehicleSubmit(e));
        }

        // Wash type selection
        document.querySelectorAll('input[name="washType"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePrice());
        });

        // Operator selection
        const operatorSelect = document.getElementById('operatorSelect');
        if (operatorSelect) {
            operatorSelect.addEventListener('change', (e) => {
                this.currentTransaction.operator_id = e.target.value;
            });
        }

        // Payment method
        const paymentSelect = document.getElementById('paymentMethod');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', (e) => {
                this.currentTransaction.payment_method = e.target.value;
            });
        }

        // Submit transaction button
        const submitBtn = document.getElementById('submitTransaction');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitTransaction());
        }

        // New transaction button
        const newTransBtn = document.getElementById('newTransaction');
        if (newTransBtn) {
            newTransBtn.addEventListener('click', () => this.resetForm());
        }

        // Real-time price calculation
        document.getElementById('washType')?.addEventListener('change', () => this.updatePrice());
        document.getElementById('customAmount')?.addEventListener('input', (e) => {
            this.currentTransaction.amount = parseFloat(e.target.value) || 0;
            this.updatePriceDisplay();
        });

        // License plate input with validation
        const platInput = document.getElementById('licensePlate');
        if (platInput) {
            platInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
                this.validateLicensePlate(e.target.value);
            });
        }
    }

    async loadOperators() {
        try {
            // For now, using hardcoded operators
            // In production, fetch from /api/operators
            this.operators = [
                { id: 1, name: 'Budi Santoso', commission_rate: 5 },
                { id: 2, name: 'Andi Wijaya', commission_rate: 5 }
            ];

            this.populateOperatorSelect();
        } catch (error) {
            console.error('Error loading operators:', error);
            this.showError('Gagal memuat daftar operator');
        }
    }

    populateOperatorSelect() {
        const select = document.getElementById('operatorSelect');
        if (!select) return;

        select.innerHTML = '<option value="">- Pilih Operator -</option>' +
            this.operators.map(op => 
                `<option value="${op.id}">${op.name} (${op.commission_rate}%)</option>`
            ).join('');
    }

    generateTransactionId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const id = `TRX-${timestamp}-${random}`;
        
        const elem = document.getElementById('transactionId');
        if (elem) elem.textContent = id;
    }

    handleVehicleSubmit(e) {
        e.preventDefault();

        // Validate inputs
        const licensePlate = document.getElementById('licensePlate')?.value.trim();
        const motorcycleType = document.getElementById('motorcycleType')?.value;
        const customerName = document.getElementById('customerName')?.value.trim();
        const customerPhone = document.getElementById('customerPhone')?.value.trim();

        if (!licensePlate || !motorcycleType) {
            this.showError('Plat nomor dan jenis motor harus diisi');
            return;
        }

        // Save to current transaction
        this.currentTransaction.license_plate = licensePlate;
        this.currentTransaction.motorcycle_type = motorcycleType;
        this.currentTransaction.customer_name = customerName;
        this.currentTransaction.customer_phone = customerPhone;

        // Show next step
        this.showStep(2);
    }

    showStep(stepNumber) {
        document.querySelectorAll('[data-step]').forEach(step => {
            step.style.display = 'none';
        });

        const targetStep = document.querySelector(`[data-step="${stepNumber}"]`);
        if (targetStep) {
            targetStep.style.display = 'block';
            targetStep.scrollIntoView({ behavior: 'smooth' });
        }
    }

    validateLicensePlate(plate) {
        // Indonesian license plate pattern: B 1234 ABC or similar
        const pattern = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/;
        const isValid = pattern.test(plate) || plate.length === 0;

        const input = document.getElementById('licensePlate');
        if (input) {
            input.classList.toggle('border-red-500', !isValid && plate.length > 0);
            input.classList.toggle('border-green-500', isValid && plate.length > 0);
        }

        return isValid;
    }

    updatePrice() {
        const selectedType = document.querySelector('input[name="washType"]:checked')?.value || 'standard';
        this.currentTransaction.wash_type = selectedType;
        this.currentTransaction.amount = this.washPrices[selectedType] || 50000;
        this.updatePriceDisplay();
    }

    updatePriceDisplay() {
        const priceDisplay = document.getElementById('priceDisplay');
        if (priceDisplay) {
            priceDisplay.textContent = 'Rp ' + (this.currentTransaction.amount || 0).toLocaleString('id-ID');
        }

        // Update summary
        this.updateTransactionSummary();
    }

    updateTransactionSummary() {
        const summary = document.getElementById('transactionSummary');
        if (!summary) return;

        const operator = this.operators.find(op => op.id == this.currentTransaction.operator_id);
        const commissionRate = operator?.commission_rate || 0;
        const commissionAmount = (this.currentTransaction.amount * commissionRate) / 100;

        summary.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600">Plat Nomor:</span>
                    <span class="font-semibold">${this.currentTransaction.license_plate}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Jenis Motor:</span>
                    <span class="font-semibold">${this.currentTransaction.motorcycle_type}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Tipe Cuci:</span>
                    <span class="font-semibold">${this.currentTransaction.wash_type}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Operator:</span>
                    <span class="font-semibold">${operator?.name || '-'}</span>
                </div>
                <hr class="border-gray-200">
                <div class="flex justify-between text-lg">
                    <span class="font-semibold text-gray-900">Harga:</span>
                    <span class="font-bold text-purple-600">Rp ${(this.currentTransaction.amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Komisi (${commissionRate}%):</span>
                    <span class="text-gray-600">Rp ${commissionAmount.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Metode Bayar:</span>
                    <span class="font-semibold">${this.getPaymentMethodLabel(this.currentTransaction.payment_method)}</span>
                </div>
            </div>
        `;
    }

    getPaymentMethodLabel(method) {
        const labels = {
            'cash': 'Tunai',
            'transfer': 'Transfer Bank',
            'qris': 'QRIS',
            'ewallet': 'E-Wallet'
        };
        return labels[method] || method;
    }

    async submitTransaction() {
        try {
            // Check authentication first
            const token = this.apiClient.getToken();
            if (!token) {
                alert('Session expired. Please login again.');
                window.location.href = '../index.html';
                return;
            }

            // Validate required fields
            if (!this.currentTransaction.operator_id) {
                this.showError('Silakan pilih operator');
                return;
            }

            if (!this.currentTransaction.amount || this.currentTransaction.amount <= 0) {
                this.showError('Harga tidak valid');
                return;
            }

            // Show loading
            this.showLoading(true);

            console.log('Submitting transaction...');
            console.log('Token:', token.substring(0, 20) + '...');
            console.log('Base URL:', this.apiClient.baseURL);

            // Prepare transaction data
            const transactionData = {
                customer_id: 1, // Default customer for now
                operator_id: parseInt(this.currentTransaction.operator_id),
                wash_type: this.currentTransaction.wash_type,
                amount: this.currentTransaction.amount,
                payment_method: this.currentTransaction.payment_method,
                notes: `${this.currentTransaction.motorcycle_type} - ${this.currentTransaction.license_plate}`
            };

            console.log('Transaction data:', transactionData);

            // Submit to API
            const response = await fetch(this.apiClient.baseURL + 'transactions.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(transactionData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Handle non-OK responses
            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired. Please login again.');
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');
                    window.location.href = '../index.html';
                    return;
                }
                
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Response data:', result);

            if (!result.success) {
                throw new Error(result.message || result.error || 'Failed to create transaction');
            }

            // Show success
            this.showSuccess(result.transaction || result);

        } catch (error) {
            console.error('Error submitting transaction:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showSuccess(transaction) {
        const container = document.getElementById('successContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center space-y-4">
                <div class="text-6xl text-green-600 mb-4">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Transaksi Berhasil!</h2>
                <p class="text-gray-600">Cuci motor telah didaftarkan ke sistem</p>
                
                <div class="bg-gray-50 rounded-lg p-6 my-6">
                    <div class="space-y-2 text-left">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Kode Transaksi:</span>
                            <span class="font-mono font-bold text-purple-600">${transaction.transaction_code}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Nominal:</span>
                            <span class="font-semibold">Rp ${(transaction.amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Komisi:</span>
                            <span class="font-semibold">Rp ${(transaction.commission_amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Status:</span>
                            <span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">${transaction.status}</span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-4 justify-center">
                    <button onclick="window.location.href='dashboard.html'" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                        <i class="fas fa-home mr-2"></i>Kembali ke Dashboard
                    </button>
                    <button id="newTransaction" class="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold">
                        <i class="fas fa-plus mr-2"></i>Transaksi Baru
                    </button>
                </div>
            </div>
        `;

        container.style.display = 'block';
        document.getElementById('vehicleForm').style.display = 'none';
        document.getElementById('serviceForm').style.display = 'none';
    }

    resetForm() {
        this.currentTransaction = {
            customer_id: null,
            operator_id: null,
            wash_type: 'standard',
            amount: 0,
            payment_method: 'cash'
        };

        document.getElementById('vehicleForm').reset();
        document.getElementById('serviceForm').reset();
        document.getElementById('successContainer').style.display = 'none';
        document.getElementById('successContainer').innerHTML = '';

        this.showStep(1);
        this.generateTransactionId();
    }

    showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('errorContainer') || this.createAlertContainer('error');
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        container.appendChild(alert);

        setTimeout(() => alert.remove(), 5000);
    }

    showSuccess(message) {
        const container = document.getElementById('successContainer') || this.createAlertContainer('success');
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        container.appendChild(alert);

        setTimeout(() => alert.remove(), 5000);
    }

    createAlertContainer(type) {
        const container = document.createElement('div');
        container.id = type + 'Container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.transactionManager) {
            window.transactionManager = new TransactionManager();
        }
    });
} else {
    if (!window.transactionManager) {
        window.transactionManager = new TransactionManager();
    }
}
