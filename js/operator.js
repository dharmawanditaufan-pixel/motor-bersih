/**
 * Operators and Commission Management Module
 * Handles operator data, commission calculations, and payout
 */

class OperatorManager {
    constructor() {
        this.operators = [];
        this.commissionRate = 30; // Default 30%
        this.init();
    }

    async init() {
        await this.loadOperators();
        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadOperators() {
        try {
            // Try to load from localStorage
            const storedOperators = localStorage.getItem('motowash_operators');
            
            if (storedOperators) {
                this.operators = JSON.parse(storedOperators);
            } else {
                // Load default operators
                await this.loadDefaultOperators();
            }
            
            console.log(`Loaded ${this.operators.length} operators`);
            return this.operators;
            
        } catch (error) {
            console.error('Error loading operators:', error);
            this.operators = [];
            return this.operators;
        }
    }

    async loadDefaultOperators() {
        // Default operators for demo
        const defaultOperators = [
            {
                id: 'OPR001',
                username: 'operator1',
                password: 'op123',
                name: 'Budi Santoso',
                role: 'operator',
                phone: '081234567891',
                email: 'budi@motowash.id',
                address: 'Jl. Merdeka No. 123, Jakarta',
                idCard: '3271234567890123',
                bankAccount: {
                    bankName: 'BCA',
                    accountNumber: '1234567890',
                    accountName: 'BUDI SANTOSO'
                },
                commissionRate: 30,
                baseSalary: 0,
                totalCommission: 0,
                pendingCommission: 0,
                paidCommission: 0,
                totalTransactions: 0,
                status: 'active',
                joinDate: '2024-01-15',
                lastLogin: null,
                performance: {
                    avgRating: 4.5,
                    totalWashes: 0,
                    monthlyTarget: 100,
                    monthlyAchievement: 0
                },
                schedule: {
                    monday: { start: '08:00', end: '17:00' },
                    tuesday: { start: '08:00', end: '17:00' },
                    wednesday: { start: '08:00', end: '17:00' },
                    thursday: { start: '08:00', end: '17:00' },
                    friday: { start: '08:00', end: '17:00' },
                    saturday: { start: '09:00', end: '15:00' },
                    sunday: 'off'
                }
            },
            {
                id: 'OPR002',
                username: 'operator2',
                password: 'op456',
                name: 'Siti Rahma',
                role: 'operator',
                phone: '081234567892',
                email: 'siti@motowash.id',
                address: 'Jl. Sudirman No. 456, Jakarta',
                idCard: '3279876543210987',
                bankAccount: {
                    bankName: 'Mandiri',
                    accountNumber: '0987654321',
                    accountName: 'SITI RAHMA'
                },
                commissionRate: 30,
                baseSalary: 0,
                totalCommission: 0,
                pendingCommission: 0,
                paidCommission: 0,
                totalTransactions: 0,
                status: 'active',
                joinDate: '2024-01-20',
                lastLogin: null,
                performance: {
                    avgRating: 4.7,
                    totalWashes: 0,
                    monthlyTarget: 100,
                    monthlyAchievement: 0
                },
                schedule: {
                    monday: { start: '12:00', end: '21:00' },
                    tuesday: { start: '12:00', end: '21:00' },
                    wednesday: { start: '12:00', end: '21:00' },
                    thursday: { start: '12:00', end: '21:00' },
                    friday: { start: '12:00', end: '21:00' },
                    saturday: { start: '09:00', end: '15:00' },
                    sunday: 'off'
                }
            },
            {
                id: 'OPR003',
                username: 'operator3',
                password: 'op789',
                name: 'Andi Wijaya',
                role: 'operator',
                phone: '081234567893',
                email: 'andi@motowash.id',
                address: 'Jl. Thamrin No. 789, Jakarta',
                idCard: '3274567890123456',
                bankAccount: {
                    bankName: 'BRI',
                    accountNumber: '5678901234',
                    accountName: 'ANDI WIJAYA'
                },
                commissionRate: 30,
                baseSalary: 0,
                totalCommission: 0,
                pendingCommission: 0,
                paidCommission: 0,
                totalTransactions: 0,
                status: 'inactive',
                joinDate: '2024-02-01',
                lastLogin: null,
                performance: {
                    avgRating: 4.2,
                    totalWashes: 0,
                    monthlyTarget: 100,
                    monthlyAchievement: 0
                },
                schedule: {
                    monday: 'off',
                    tuesday: 'off',
                    wednesday: { start: '08:00', end: '17:00' },
                    thursday: { start: '08:00', end: '17:00' },
                    friday: { start: '08:00', end: '17:00' },
                    saturday: { start: '09:00', end: '15:00' },
                    sunday: { start: '09:00', end: '15:00' }
                }
            }
        ];

        this.operators = defaultOperators;
        await this.saveOperators();
        return this.operators;
    }

    async loadSettings() {
        try {
            const settings = localStorage.getItem('motowash_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.commissionRate = parsed.commission_rate || 30;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Operator page specific listeners
        if (document.getElementById('operatorPage')) {
            this.setupOperatorPage();
        }
        
        // Commission payout page
        if (document.getElementById('commissionPage')) {
            this.setupCommissionPage();
        }
        
        // Schedule management page
        if (document.getElementById('schedulePage')) {
            this.setupSchedulePage();
        }
    }

    setupOperatorPage() {
        // Load operator list
        this.loadOperatorList();
        
        // Add operator button
        document.getElementById('addOperatorBtn')?.addEventListener('click', () => {
            this.showOperatorForm();
        });
        
        // Search operators
        document.getElementById('searchOperators')?.addEventListener('input', (e) => {
            this.searchOperators(e.target.value);
        });
        
        // Export operators
        document.getElementById('exportOperatorsBtn')?.addEventListener('click', () => {
            this.exportOperatorsToExcel();
        });
    }

    setupCommissionPage() {
        // Load commission data
        this.loadCommissionData();
        
        // Calculate commission button
        document.getElementById('calculateCommissionBtn')?.addEventListener('click', () => {
            this.calculateAllCommissions();
        });
        
        // Process payout button
        document.getElementById('processPayoutBtn')?.addEventListener('click', () => {
            this.processCommissionPayout();
        });
        
        // Date range filter
        document.getElementById('commissionDateRange')?.addEventListener('change', () => {
            this.filterCommissionByDate();
        });
    }

    setupSchedulePage() {
        // Load schedule
        this.loadOperatorSchedule();
        
        // Update schedule button
        document.getElementById('updateScheduleBtn')?.addEventListener('click', () => {
            this.updateOperatorSchedule();
        });
        
        // Print schedule
        document.getElementById('printScheduleBtn')?.addEventListener('click', () => {
            this.printSchedule();
        });
    }

    // OPERATOR MANAGEMENT METHODS

    async getOperators(filter = {}) {
        let filtered = [...this.operators];
        
        // Apply filters
        if (filter.status) {
            filtered = filtered.filter(op => op.status === filter.status);
        }
        
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filtered = filtered.filter(op => 
                op.name.toLowerCase().includes(searchTerm) ||
                op.phone.includes(searchTerm) ||
                op.email?.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    async getOperatorById(id) {
        return this.operators.find(op => op.id === id);
    }

    async addOperator(operatorData) {
        try {
            // Generate new ID
            const newId = this.generateOperatorId();
            
            // Create operator object
            const newOperator = {
                id: newId,
                ...operatorData,
                commissionRate: this.commissionRate,
                baseSalary: operatorData.baseSalary || 0,
                totalCommission: 0,
                pendingCommission: 0,
                paidCommission: 0,
                totalTransactions: 0,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
                lastLogin: null,
                performance: {
                    avgRating: 0,
                    totalWashes: 0,
                    monthlyTarget: 100,
                    monthlyAchievement: 0
                },
                schedule: this.getDefaultSchedule()
            };
            
            // Add to list
            this.operators.push(newOperator);
            
            // Save to storage
            await this.saveOperators();
            
            // Update user list in auth system
            await this.updateAuthUsers(newOperator);
            
            return {
                success: true,
                message: 'Operator berhasil ditambahkan',
                operator: newOperator
            };
            
        } catch (error) {
            console.error('Error adding operator:', error);
            return {
                success: false,
                message: 'Gagal menambahkan operator'
            };
        }
    }

    async updateOperator(id, updates) {
        try {
            const index = this.operators.findIndex(op => op.id === id);
            
            if (index === -1) {
                return {
                    success: false,
                    message: 'Operator tidak ditemukan'
                };
            }
            
            // Update operator data
            this.operators[index] = {
                ...this.operators[index],
                ...updates,
                id // Ensure ID doesn't change
            };
            
            // Save to storage
            await this.saveOperators();
            
            // Update auth users if username/password changed
            if (updates.username || updates.password) {
                await this.updateAuthUsers(this.operators[index]);
            }
            
            return {
                success: true,
                message: 'Data operator berhasil diperbarui',
                operator: this.operators[index]
            };
            
        } catch (error) {
            console.error('Error updating operator:', error);
            return {
                success: false,
                message: 'Gagal memperbarui data operator'
            };
        }
    }

    async deleteOperator(id) {
        try {
            const index = this.operators.findIndex(op => op.id === id);
            
            if (index === -1) {
                return {
                    success: false,
                    message: 'Operator tidak ditemukan'
                };
            }
            
            // Don't actually delete, just mark as inactive
            this.operators[index].status = 'inactive';
            
            // Save to storage
            await this.saveOperators();
            
            return {
                success: true,
                message: 'Operator dinonaktifkan'
            };
            
        } catch (error) {
            console.error('Error deleting operator:', error);
            return {
                success: false,
                message: 'Gagal menonaktifkan operator'
            };
        }
    }

    // COMMISSION MANAGEMENT METHODS

    async recordTransaction(operatorId, transactionData) {
        try {
            const operator = await this.getOperatorById(operatorId);
            
            if (!operator) {
                throw new Error('Operator not found');
            }
            
            const commissionAmount = this.calculateCommission(
                transactionData.amount,
                operator.commissionRate
            );
            
            // Update operator stats
            const index = this.operators.findIndex(op => op.id === operatorId);
            
            this.operators[index].totalTransactions += 1;
            this.operators[index].totalCommission += commissionAmount;
            this.operators[index].pendingCommission += commissionAmount;
            this.operators[index].performance.totalWashes += 1;
            
            // Update monthly achievement
            const currentMonth = new Date().getMonth();
            const lastUpdate = new Date(operator.lastCommissionUpdate || 0).getMonth();
            
            if (currentMonth !== lastUpdate) {
                this.operators[index].performance.monthlyAchievement = 0;
            }
            
            this.operators[index].performance.monthlyAchievement += 1;
            this.operators[index].lastCommissionUpdate = new Date().toISOString();
            
            // Save changes
            await this.saveOperators();
            
            // Return commission record
            const commissionRecord = {
                id: this.generateCommissionId(),
                operatorId,
                operatorName: operator.name,
                transactionId: transactionData.id,
                transactionAmount: transactionData.amount,
                commissionRate: operator.commissionRate,
                commissionAmount,
                transactionDate: transactionData.date || new Date().toISOString(),
                status: 'pending',
                payoutDate: null,
                notes: transactionData.notes || ''
            };
            
            // Save commission record
            await this.saveCommissionRecord(commissionRecord);
            
            return {
                success: true,
                commission: commissionRecord,
                operator: this.operators[index]
            };
            
        } catch (error) {
            console.error('Error recording transaction:', error);
            throw error;
        }
    }

    calculateCommission(amount, rate = null) {
        const commissionRate = rate || this.commissionRate;
        return Math.round((amount * commissionRate) / 100);
    }

    async calculateAllCommissions(dateRange = null) {
        try {
            // Get transactions for date range
            const transactions = await this.getTransactions(dateRange);
            
            // Group by operator and calculate
            const operatorCommissions = {};
            
            transactions.forEach(transaction => {
                if (!transaction.operatorId) return;
                
                if (!operatorCommissions[transaction.operatorId]) {
                    operatorCommissions[transaction.operatorId] = {
                        operatorId: transaction.operatorId,
                        totalAmount: 0,
                        commissionAmount: 0,
                        transactionCount: 0
                    };
                }
                
                const operator = this.operators.find(op => op.id === transaction.operatorId);
                const commissionRate = operator ? operator.commissionRate : this.commissionRate;
                const commission = this.calculateCommission(transaction.amount, commissionRate);
                
                operatorCommissions[transaction.operatorId].totalAmount += transaction.amount;
                operatorCommissions[transaction.operatorId].commissionAmount += commission;
                operatorCommissions[transaction.operatorId].transactionCount += 1;
            });
            
            // Convert to array
            const results = Object.values(operatorCommissions);
            
            // Update UI if on commission page
            this.updateCommissionDisplay(results);
            
            return {
                success: true,
                results,
                totalCommission: results.reduce((sum, item) => sum + item.commissionAmount, 0),
                totalTransactions: results.reduce((sum, item) => sum + item.transactionCount, 0)
            };
            
        } catch (error) {
            console.error('Error calculating commissions:', error);
            return {
                success: false,
                message: 'Gagal menghitung komisi'
            };
        }
    }

    async processCommissionPayout(operatorIds = []) {
        try {
            // If no specific operators, process all pending
            const operatorsToProcess = operatorIds.length > 0 
                ? this.operators.filter(op => operatorIds.includes(op.id) && op.pendingCommission > 0)
                : this.operators.filter(op => op.pendingCommission > 0);
            
            const payoutRecords = [];
            const today = new Date().toISOString().split('T')[0];
            
            for (const operator of operatorsToProcess) {
                // Create payout record
                const payoutRecord = {
                    id: this.generatePayoutId(),
                    operatorId: operator.id,
                    operatorName: operator.name,
                    amount: operator.pendingCommission,
                    payoutDate: today,
                    status: 'paid',
                    paymentMethod: 'transfer',
                    bankAccount: operator.bankAccount,
                    notes: `Pembayaran komisi periode ${today}`
                };
                
                // Update operator
                const index = this.operators.findIndex(op => op.id === operator.id);
                this.operators[index].paidCommission += operator.pendingCommission;
                this.operators[index].pendingCommission = 0;
                
                payoutRecords.push(payoutRecord);
                
                // Send notification to operator
                await this.sendPayoutNotification(operator, payoutRecord);
            }
            
            // Save changes
            await this.saveOperators();
            await this.savePayoutRecords(payoutRecords);
            
            // Show success message
            this.showNotification(
                `Berhasil memproses pembayaran komisi untuk ${payoutRecords.length} operator`,
                'success'
            );
            
            return {
                success: true,
                payouts: payoutRecords,
                totalPaid: payoutRecords.reduce((sum, record) => sum + record.amount, 0)
            };
            
        } catch (error) {
            console.error('Error processing payout:', error);
            return {
                success: false,
                message: 'Gagal memproses pembayaran komisi'
            };
        }
    }

    // SCHEDULE MANAGEMENT METHODS

    getDefaultSchedule() {
        return {
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '17:00' },
            saturday: { start: '09:00', end: '15:00' },
            sunday: 'off'
        };
    }

    async updateOperatorSchedule(operatorId, schedule) {
        try {
            const operator = await this.getOperatorById(operatorId);
            
            if (!operator) {
                return {
                    success: false,
                    message: 'Operator tidak ditemukan'
                };
            }
            
            // Update schedule
            const index = this.operators.findIndex(op => op.id === operatorId);
            this.operators[index].schedule = schedule;
            
            // Save changes
            await this.saveOperators();
            
            return {
                success: true,
                message: 'Jadwal berhasil diperbarui',
                operator: this.operators[index]
            };
            
        } catch (error) {
            console.error('Error updating schedule:', error);
            return {
                success: false,
                message: 'Gagal memperbarui jadwal'
            };
        }
    }

    getActiveOperatorsNow() {
        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const time = now.toTimeString().slice(0, 5); // HH:MM format
        
        return this.operators.filter(operator => {
            if (operator.status !== 'active') return false;
            
            const schedule = operator.schedule[day];
            
            if (!schedule || schedule === 'off') return false;
            
            return time >= schedule.start && time <= schedule.end;
        });
    }

    // UI METHODS

    async loadOperatorList() {
        const container = document.getElementById('operatorList');
        if (!container) return;
        
        const operators = await this.getOperators();
        
        if (operators.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Belum ada operator terdaftar</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="operator-stats">
                <div class="stat-card">
                    <i class="fas fa-user-check"></i>
                    <h3>${operators.filter(op => op.status === 'active').length}</h3>
                    <p>Aktif</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>${this.formatCurrency(operators.reduce((sum, op) => sum + op.pendingCommission, 0))}</h3>
                    <p>Komisi Tertunda</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <h3>${operators.reduce((sum, op) => sum + op.totalTransactions, 0)}</h3>
                    <p>Total Transaksi</p>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Status</th>
                            <th>Total Komisi</th>
                            <th>Komisi Tertunda</th>
                            <th>Total Transaksi</th>
                            <th>Rating</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        operators.forEach(operator => {
            const statusClass = operator.status === 'active' ? 'badge-success' : 'badge-danger';
            const ratingStars = '★'.repeat(Math.floor(operator.performance.avgRating)) + 
                              '☆'.repeat(5 - Math.floor(operator.performance.avgRating));
            
            html += `
                <tr>
                    <td>
                        <div class="operator-info">
                            <div class="operator-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div>
                                <strong>${operator.name}</strong>
                                <small>${operator.phone}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${statusClass}">${operator.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                    </td>
                    <td>${this.formatCurrency(operator.totalCommission)}</td>
                    <td>${this.formatCurrency(operator.pendingCommission)}</td>
                    <td>${operator.totalTransactions}</td>
                    <td>
                        <div class="rating">
                            <span class="stars">${ratingStars}</span>
                            <small>${operator.performance.avgRating.toFixed(1)}</small>
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-small" onclick="operatorManager.editOperator('${operator.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-small" onclick="operatorManager.viewDetails('${operator.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-small" onclick="operatorManager.payCommission('${operator.id}')">
                                <i class="fas fa-money-bill-wave"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }

    async loadCommissionData() {
        const container = document.getElementById('commissionData');
        if (!container) return;
        
        const result = await this.calculateAllCommissions();
        
        if (!result.success) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${result.message}</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="commission-summary">
                <h3>Ringkasan Komisi</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span>Total Komisi:</span>
                        <strong>${this.formatCurrency(result.totalCommission)}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Total Transaksi:</span>
                        <strong>${result.totalTransactions}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Jumlah Operator:</span>
                        <strong>${result.results.length}</strong>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Operator</th>
                            <th>Total Transaksi</th>
                            <th>Total Omzet</th>
                            <th>Komisi (${this.commissionRate}%)</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        result.results.forEach(item => {
            const operator = this.operators.find(op => op.id === item.operatorId);
            const hasPendingCommission = operator && operator.pendingCommission > 0;
            
            html += `
                <tr>
                    <td>
                        <strong>${operator?.name || 'Unknown'}</strong>
                        <small>ID: ${item.operatorId}</small>
                    </td>
                    <td>${item.transactionCount}</td>
                    <td>${this.formatCurrency(item.totalAmount)}</td>
                    <td>${this.formatCurrency(item.commissionAmount)}</td>
                    <td>
                        ${hasPendingCommission ? 
                            `<span class="badge badge-warning">Belum Dibayar</span>` :
                            `<span class="badge badge-success">Lunas</span>`
                        }
                    </td>
                    <td>
                        <button class="btn-action btn-small" onclick="operatorManager.paySingleCommission('${item.operatorId}')">
                            <i class="fas fa-money-check"></i> Bayar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="commission-actions">
                <button class="btn-primary" onclick="operatorManager.processCommissionPayout()">
                    <i class="fas fa-check-circle"></i> Proses Semua Pembayaran
                </button>
                <button class="btn-secondary" onclick="operatorManager.printCommissionReport()">
                    <i class="fas fa-print"></i> Cetak Laporan
                </button>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // HELPER METHODS

    generateOperatorId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `OPR${timestamp}${random}`;
    }

    generateCommissionId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        return `COM${timestamp}`;
    }

    generatePayoutId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        return `PAY${timestamp}`;
    }

    async saveOperators() {
        try {
            localStorage.setItem('motowash_operators', JSON.stringify(this.operators));
            return true;
        } catch (error) {
            console.error('Error saving operators:', error);
            return false;
        }
    }

    async saveCommissionRecord(record) {
        try {
            const records = JSON.parse(localStorage.getItem('motowash_commissions') || '[]');
            records.push(record);
            localStorage.setItem('motowash_commissions', JSON.stringify(records));
            return true;
        } catch (error) {
            console.error('Error saving commission record:', error);
            return false;
        }
    }

    async savePayoutRecords(records) {
        try {
            const allRecords = JSON.parse(localStorage.getItem('motowash_payouts') || '[]');
            allRecords.push(...records);
            localStorage.setItem('motowash_payouts', JSON.stringify(allRecords));
            return true;
        } catch (error) {
            console.error('Error saving payout records:', error);
            return false;
        }
    }

    async getTransactions(dateRange = null) {
        try {
            const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
            
            if (!dateRange) return transactions;
            
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            
            return transactions.filter(transaction => {
                const transDate = new Date(transaction.createdAt || transaction.date);
                return transDate >= startDate && transDate <= endDate;
            });
            
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    async updateAuthUsers(operator) {
        try {
            const users = JSON.parse(localStorage.getItem('motowash_users') || '[]');
            const index = users.findIndex(u => u.id === operator.id);
            
            if (index !== -1) {
                users[index] = {
                    ...users[index],
                    username: operator.username,
                    password: operator.password,
                    name: operator.name,
                    role: operator.role,
                    phone: operator.phone
                };
            } else {
                users.push({
                    id: operator.id,
                    username: operator.username,
                    password: operator.password,
                    name: operator.name,
                    role: operator.role,
                    phone: operator.phone,
                    commission_rate: operator.commissionRate,
                    permissions: ['create_transaction', 'view_dashboard']
                });
            }
            
            localStorage.setItem('motowash_users', JSON.stringify(users));
            return true;
            
        } catch (error) {
            console.error('Error updating auth users:', error);
            return false;
        }
    }

    async sendPayoutNotification(operator, payoutRecord) {
        // In production, send WhatsApp/email notification
        const message = `
Halo ${operator.name}!

💰 *PEMBAYARAN KOMISI TELAH DIPROSES*

📋 *Detail Pembayaran:*
• Jumlah: ${this.formatCurrency(payoutRecord.amount)}
• Tanggal: ${payoutRecord.payoutDate}
• Metode: Transfer Bank
• Bank: ${operator.bankAccount.bankName}
• Rekening: ${operator.bankAccount.accountNumber}

Terima kasih atas kerja keras Anda!

*MotoWash Management*
        `;
        
        console.log('Payout notification:', message);
        // Implement WhatsApp API integration here
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // PUBLIC API METHODS (for UI calls)

    editOperator(id) {
        // Show edit form
        this.showNotification(`Edit operator ${id}`, 'info');
        // Implement edit form modal
    }

    viewDetails(id) {
        // Show operator details
        const operator = this.operators.find(op => op.id === id);
        if (operator) {
            this.showOperatorDetails(operator);
        }
    }

    payCommission(id) {
        // Process single operator commission
        this.processCommissionPayout([id]);
    }

    paySingleCommission(operatorId) {
        this.processCommissionPayout([operatorId]);
    }

    printCommissionReport() {
        // Generate and print commission report
        window.print();
    }

    showOperatorForm() {
        // Show modal for adding new operator
        const modalHtml = `
            <div class="modal" id="operatorFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Tambah Operator Baru</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="newOperatorForm">
                            <!-- Form fields will be added here -->
                            <div class="form-group">
                                <label for="operatorName">Nama Lengkap *</label>
                                <input type="text" id="operatorName" required>
                            </div>
                            <div class="form-group">
                                <label for="operatorPhone">No. Handphone *</label>
                                <input type="tel" id="operatorPhone" required>
                            </div>
                            <div class="form-group">
                                <label for="operatorUsername">Username *</label>
                                <input type="text" id="operatorUsername" required>
                            </div>
                            <div class="form-group">
                                <label for="operatorPassword">Password *</label>
                                <input type="password" id="operatorPassword" required>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Simpan</button>
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add form submission handler
        document.getElementById('newOperatorForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Handle form submission
        });
    }

    showOperatorDetails(operator) {
        // Show operator details modal
        const modalHtml = `
            <div class="modal" id="operatorDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user"></i> Detail Operator</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="operator-details">
                            <div class="detail-section">
                                <h4>Informasi Pribadi</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span>Nama:</span>
                                        <strong>${operator.name}</strong>
                                    </div>
                                    <div class="detail-item">
                                        <span>Telepon:</span>
                                        <span>${operator.phone}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span>Email:</span>
                                        <span>${operator.email || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span>Status:</span>
                                        <span class="badge ${operator.status === 'active' ? 'badge-success' : 'badge-danger'}">
                                            ${operator.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informasi Bank</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span>Bank:</span>
                                        <span>${operator.bankAccount?.bankName || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span>No. Rekening:</span>
                                        <span>${operator.bankAccount?.accountNumber || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span>Atas Nama:</span>
                                        <span>${operator.bankAccount?.accountName || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Statistik Komisi</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span>Total Komisi:</span>
                                        <strong>${this.formatCurrency(operator.totalCommission)}</strong>
                                    </div>
                                    <div class="detail-item">
                                        <span>Komisi Tertunda:</span>
                                        <strong class="text-warning">${this.formatCurrency(operator.pendingCommission)}</strong>
                                    </div>
                                    <div class="detail-item">
                                        <span>Komisi Dibayar:</span>
                                        <strong class="text-success">${this.formatCurrency(operator.paidCommission)}</strong>
                                    </div>
                                    <div class="detail-item">
                                        <span>Total Transaksi:</span>
                                        <strong>${operator.totalTransactions}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    searchOperators(searchTerm) {
        const filtered = this.operators.filter(operator => 
            operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            operator.phone.includes(searchTerm) ||
            operator.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.updateOperatorListDisplay(filtered);
    }

    updateOperatorListDisplay(operators) {
        // Update the operator list table with filtered results
        const tbody = document.querySelector('#operatorList tbody');
        if (tbody) {
            // Implementation depends on your table structure
        }
    }

    updateCommissionDisplay(commissionData) {
        // Update commission table display
        const container = document.getElementById('commissionData');
        if (container) {
            // Implementation depends on your commission display structure
        }
    }

    filterCommissionByDate() {
        const dateRange = document.getElementById('commissionDateRange')?.value;
        if (dateRange) {
            const [start, end] = dateRange.split(' to ');
            this.calculateAllCommissions({ start, end });
        }
    }

    loadOperatorSchedule() {
        // Load and display operator schedule
        const container = document.getElementById('scheduleContainer');
        if (!container) return;
        
        let html = `
            <div class="schedule-grid">
                <div class="schedule-header">
                    <h4>Operator</h4>
                    ${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => `
                        <div class="day-header">${day}</div>
                    `).join('')}
                </div>
        `;
        
        this.operators.forEach(operator => {
            html += `
                <div class="schedule-row">
                    <div class="operator-name">${operator.name}</div>
                    ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const schedule = operator.schedule[day];
                        if (!schedule || schedule === 'off') {
                            return `<div class="day-cell off">OFF</div>`;
                        }
                        return `<div class="day-cell">${schedule.start} - ${schedule.end}</div>`;
                    }).join('')}
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }

    updateOperatorSchedule() {
        // Get schedule from form and update
        const form = document.getElementById('scheduleForm');
        if (form) {
            // Collect schedule data from form
            // Update operator schedule
            this.showNotification('Jadwal berhasil diperbarui', 'success');
        }
    }

    printSchedule() {
        // Print schedule
        window.print();
    }

    exportOperatorsToExcel() {
        // Export operators data to Excel
        const data = this.operators.map(op => ({
            'ID': op.id,
            'Nama': op.name,
            'Telepon': op.phone,
            'Email': op.email || '',
            'Status': op.status === 'active' ? 'Aktif' : 'Nonaktif',
            'Total Komisi': op.totalCommission,
            'Komisi Tertunda': op.pendingCommission,
            'Total Transaksi': op.totalTransactions,
            'Tanggal Bergabung': op.joinDate
        }));
        
        // Convert to CSV
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, 'operators.csv');
        
        this.showNotification('Data operator berhasil diekspor', 'success');
    }

    convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header], (key, val) => val === null ? '' : val)
            ).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize Operator Manager
let operatorManager = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize if on operator-related pages
    if (document.querySelector('[data-operator-module]') || 
        document.getElementById('operatorPage') ||
        document.getElementById('commissionPage') ||
        document.getElementById('schedulePage')) {
        
        operatorManager = new OperatorManager();
        window.operatorManager = operatorManager;
        
        // For transaction page, make sure operatorManager is available
        if (document.getElementById('operatorSelect')) {
            operatorManager.loadOperators().then(() => {
                // Populate operator dropdown
                const select = document.getElementById('operatorSelect');
                if (select) {
                    select.innerHTML = '<option value="">Pilih Operator</option>' +
                        operatorManager.operators
                            .filter(op => op.status === 'active')
                            .map(op => `<option value="${op.id}">${op.name}</option>`)
                            .join('');
                }
            });
        }
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.OperatorManager = OperatorManager;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperatorManager;
}
