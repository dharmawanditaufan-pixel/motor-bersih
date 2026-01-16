/**
 * Dashboard Module for MotoWash POS
 * Handles dashboard statistics, charts, and real-time updates
 */

// Global navigation helper used by inline onclick handlers
// Maps logical page keys to actual HTML files to avoid 404s
window.navigateTo = function(page) {
    const routes = {
        'dashboard': 'dashboard.html',
        'new-transaction': 'register-wash.html',
        'camera-capture': 'camera-capture.html',
        'transactions': 'transactions.html',
        'customers': 'customers.html',
        'operators': 'operators.html',
        'reports': 'reports.html',
        'expenses': 'expenses.html',
        'settings': 'settings.html'
    };

    const target = routes[page] || 'dashboard.html';
    
    // Check if we're already on a pages/ subdirectory
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
        window.location.href = target;
    } else {
        window.location.href = 'pages/' + target;
    }
};

class DashboardManager {
    constructor() {
        this.currentPeriod = 'today';
        this.charts = {};
        this.autoRefreshInterval = null;
        this.init();
    }

    async init() {
        // Check authentication first
        if (!this.checkAuth()) {
            return;
        }

        // Initialize all dashboard components
        await this.initializeComponents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start auto-refresh (every 30 seconds)
        this.startAutoRefresh();
        
        // Initial data load
        await this.loadDashboardData();
        
        console.log('Dashboard initialized successfully');
    }

    checkAuth() {
        // Check if user is authenticated
        const authManager = window.authManager;
        if (!authManager || !authManager.isAuthenticated) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }

    async initializeComponents() {
        // Initialize date and time display
        this.updateDateTime();
        
        // Initialize sidebar
        this.initializeSidebar();
        
        // Initialize page navigation
        this.initializePageNavigation();
        
        // Initialize charts
        this.initializeCharts();
        
        // Initialize quick actions
        this.initializeQuickActions();
    }

    setupEventListeners() {
        // Period selector
        document.getElementById('chartPeriod')?.addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updateCharts();
        });

        // Date range filter
        document.getElementById('dateRangeFilter')?.addEventListener('change', (e) => {
            this.filterDataByDate(e.target.value);
        });

        // Refresh button
        document.getElementById('refreshDashboard')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Print report button
        document.getElementById('printReport')?.addEventListener('click', () => {
            this.printDashboardReport();
        });

        // Export data button
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportDashboardData();
        });

        // Quick transaction button
        document.getElementById('quickTransaction')?.addEventListener('click', () => {
            window.location.href = 'register-wash.html';
        });

        // Quick camera button
        document.getElementById('quickCamera')?.addEventListener('click', () => {
            window.location.href = 'camera-capture.html';
        });

        // Notification bell
        document.getElementById('notificationBell')?.addEventListener('click', () => {
            this.showNotifications();
        });

        // User profile dropdown
        document.getElementById('userProfile')?.addEventListener('click', () => {
            this.toggleUserMenu();
        });

        // Real-time updates toggle
        document.getElementById('realtimeToggle')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // View all buttons
        document.querySelectorAll('.view-all').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = button.dataset.target;
                this.viewAllItems(target);
            });
        });

        // Tab switching
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    initializeSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });

            // Restore sidebar state
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }

        // Update active menu item based on current page
        this.updateActiveMenuItem();
    }

    initializePageNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-menu a[data-page]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Omzet (Rp)',
                        data: [],
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#4361ee',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: this.getChartOptions('line')
            });
        }

        // Motorcycle Type Chart
        const motorcycleCtx = document.getElementById('motorcycleChart');
        if (motorcycleCtx) {
            this.charts.motorcycle = new Chart(motorcycleCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#4361ee',
                            '#7209b7',
                            '#4cc9f0',
                            '#f72585',
                            '#f8961e'
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: this.getChartOptions('doughnut')
            });
        }

        // Commission Chart
        const commissionCtx = document.getElementById('commissionChart');
        if (commissionCtx) {
            this.charts.commission = new Chart(commissionCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Komisi Operator (Rp)',
                        data: [],
                        backgroundColor: 'rgba(114, 9, 183, 0.8)',
                        borderColor: '#7209b7',
                        borderWidth: 1
                    }]
                },
                options: this.getChartOptions('bar')
            });
        }

        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            this.charts.performance = new Chart(performanceCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Transaksi', 'Omzet', 'Member Baru', 'Rating', 'Efisiensi'],
                    datasets: [{
                        label: 'Performansi',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(76, 201, 240, 0.2)',
                        borderColor: '#4cc9f0',
                        pointBackgroundColor: '#4cc9f0',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#4cc9f0'
                    }]
                },
                options: this.getChartOptions('radar')
            });
        }
    }

    getChartOptions(type) {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== undefined) {
                                label += new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        };

        switch(type) {
            case 'line':
                return {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    if (value >= 1000000) {
                                        return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
                                    } else if (value >= 1000) {
                                        return 'Rp ' + (value / 1000).toFixed(0) + 'K';
                                    }
                                    return 'Rp ' + value;
                                }
                            }
                        }
                    }
                };
            
            case 'bar':
                return {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                };
            
            default:
                return commonOptions;
        }
    }

    initializeQuickActions() {
        const quickActions = {
            'newTransaction': () => window.location.href = 'register-wash.html',
            'quickCamera': () => window.location.href = 'camera-capture.html',
            'addCustomer': () => this.showAddCustomerModal(),
            'printReceipt': () => this.printLastReceipt(),
            'viewReports': () => this.showReportsModal(),
            'manageOperators': () => window.location.href = 'operators.html'
        };

        Object.keys(quickActions).forEach(actionId => {
            const button = document.getElementById(actionId);
            if (button) {
                button.addEventListener('click', quickActions[actionId]);
            }
        });
    }

    async loadDashboardData() {
        try {
            // Show loading state
            this.showLoading(true);

            // Load all data in parallel
            const [
                summaryData,
                recentTransactions,
                topCustomers,
                operatorStats
            ] = await Promise.all([
                this.loadSummaryData(),
                this.loadRecentTransactions(),
                this.loadTopCustomers(),
                this.loadOperatorStats()
            ]);

            // Update UI components
            this.updateSummaryCards(summaryData);
            this.updateRecentTransactions(recentTransactions);
            this.updateTopCustomers(topCustomers);
            this.updateOperatorStats(operatorStats);
            this.updateCharts(summaryData);

            // Update last refresh time
            this.updateLastRefresh();

            // Show success notification
            this.showNotification('Dashboard data diperbarui', 'success');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Gagal memuat data dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadSummaryData() {
        try {
            // Initialize APIClient if not available
            if (typeof apiClient === 'undefined') {
                window.apiClient = new APIClient();
            }

            const result = await apiClient.getDashboardData();

            if (result && result.success) {
                const data = result;

                // Extract data from new API response format
                const totalRevenue = data.revenue?.total || 0;
                const totalTransactions = data.revenue?.count || 0;
                const totalCommission = data.commission?.total || 0;
                const totalMembers = data.members?.total || 0;
                const activeMembers = data.members?.active || 0;

                return {
                    totalRevenue: totalRevenue,
                    totalTransactions: totalTransactions,
                    totalCommission: totalCommission,
                    totalCustomers: totalMembers,
                    activeMembers: activeMembers,
                    revenueChange: 0, // Will implement trending
                    transactionChange: 0,
                    avgTransactionValue: totalTransactions > 0
                        ? totalRevenue / totalTransactions
                        : 0,
                    topOperators: data.top_operators || [],
                    statusSummary: data.status_summary || {},
                    paymentMethods: data.payment_methods || {},
                    motorcycleTypes: data.motorcycle_types || {}
                };
            } else {
                throw new Error((result && result.error) || 'API returned error');
            }
        } catch (error) {
            console.error('Error loading summary data:', error);
            // Fallback to localStorage implementation
            return this.loadSummaryDataFromLocalStorage();
        }
    }

    loadSummaryDataFromLocalStorage() {
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
        const customers = JSON.parse(localStorage.getItem('motowash_customers') || '[]');

        // Filter by current period
        const filteredTransactions = this.filterByPeriod(transactions, this.currentPeriod);
        const filteredCustomers = this.filterByPeriod(customers, this.currentPeriod, 'joinDate');

        // Calculate summary
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const totalTransactions = filteredTransactions.length;
        const totalCommission = filteredTransactions.reduce((sum, t) => sum + (t.commission || 0), 0);
        const totalCustomers = filteredCustomers.length;
        const newMembers = filteredCustomers.filter(c => c.isMember).length;
        const freeWashes = filteredTransactions.filter(t => t.isFreeWash).length;

        // Calculate changes from previous period
        // Note: this uses existing getPreviousPeriodData which reads localStorage
        const previousDataPromise = this.getPreviousPeriodData();

        // getPreviousPeriodData is async; handle accordingly
        return previousDataPromise.then(previousData => {
            const revenueChange = this.calculateChange(totalRevenue, previousData.revenue);
            const transactionChange = this.calculateChange(totalTransactions, previousData.transactions);

            return {
                totalRevenue,
                totalTransactions,
                totalCommission,
                totalCustomers,
                newMembers,
                freeWashes,
                revenueChange,
                transactionChange,
                avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
            };
        }).catch(err => {
            console.error('Error computing previous period data fallback:', err);
            return {
                totalRevenue,
                totalTransactions,
                totalCommission,
                totalCustomers,
                newMembers,
                freeWashes,
                revenueChange: 0,
                transactionChange: 0,
                avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
            };
        });
    }

    async loadRecentTransactions(limit = 10) {
        try {
            // Initialize APIClient if not available
            if (typeof apiClient === 'undefined') {
                window.apiClient = new APIClient();
            }

            // Get transactions from API
            const result = await fetch(apiClient.baseURL + 'transactions.php?limit=' + limit + '&page=1', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + apiClient.getToken()
                }
            });

            if (!result.ok) {
                throw new Error('Failed to load transactions');
            }

            const data = await result.json();

            if (data.success && Array.isArray(data.transactions)) {
                return data.transactions.map(t => ({
                    id: t.id,
                    date: t.created_at || t.date,
                    customerName: t.customer_name || 'Pelanggan',
                    licensePlate: t.license_plate || '-',
                    motorcycleType: t.motorcycle_type || '-',
                    washType: t.type || 'Regular',
                    total: t.amount || 0,
                    status: t.status || 'completed',
                    operator: t.operator_name || 'Operator',
                    code: t.transaction_code
                }));
            }

            throw new Error('Invalid API response');
        } catch (error) {
            console.error('Error loading recent transactions from API:', error);
            // Fallback to localStorage
            const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
            
            return transactions
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .slice(0, limit)
                .map(transaction => ({
                    id: transaction.id,
                    date: transaction.createdAt || transaction.date,
                    customerName: transaction.customerName || 'Pelanggan',
                    licensePlate: transaction.licensePlate || '-',
                    motorcycleType: transaction.motorcycleType || '-',
                    washType: transaction.washType || 'Regular',
                    total: transaction.total || 0,
                    status: transaction.status || 'completed',
                    operator: transaction.operatorName || 'Operator'
                }));
        }
    }

    async loadTopCustomers(limit = 5) {
        const customers = JSON.parse(localStorage.getItem('motowash_customers') || '[]');
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');

        // Calculate customer statistics
        const customerStats = customers.map(customer => {
            const customerTransactions = transactions.filter(t => 
                t.customerId === customer.id || 
                t.customerName === customer.name
            );

            return {
                ...customer,
                totalSpent: customerTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
                transactionCount: customerTransactions.length,
                lastVisit: customerTransactions.length > 0 
                    ? customerTransactions.sort((a, b) => 
                        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
                      )[0].createdAt || customerTransactions[0].date
                    : null,
                avgTransaction: customerTransactions.length > 0 
                    ? customerTransactions.reduce((sum, t) => sum + (t.total || 0), 0) / customerTransactions.length
                    : 0
            };
        });

        // Sort by total spent (descending)
        return customerStats
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
    }

    async loadOperatorStats() {
        const operators = JSON.parse(localStorage.getItem('motowash_operators') || '[]');
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');

        return operators.map(operator => {
            const operatorTransactions = transactions.filter(t => t.operatorId === operator.id);
            const recentTransactions = operatorTransactions
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .slice(0, 5);

            return {
                ...operator,
                totalTransactions: operatorTransactions.length,
                totalRevenue: operatorTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
                totalCommission: operatorTransactions.reduce((sum, t) => sum + (t.commission || 0), 0),
                pendingCommission: operator.pendingCommission || 0,
                recentTransactions,
                performance: {
                    ...operator.performance,
                    completionRate: operatorTransactions.length > 0 
                        ? (operatorTransactions.filter(t => t.status === 'completed').length / operatorTransactions.length * 100).toFixed(1)
                        : 0,
                    avgTransactionValue: operatorTransactions.length > 0 
                        ? operatorTransactions.reduce((sum, t) => sum + (t.total || 0), 0) / operatorTransactions.length
                        : 0
                }
            };
        });
    }

    filterByPeriod(data, period, dateField = 'createdAt') {
        const now = new Date();
        let startDate;

        switch(period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(0); // All time
        }

        return data.filter(item => {
            const itemDate = new Date(item[dateField] || item.date);
            return itemDate >= startDate;
        });
    }

    async getPreviousPeriodData() {
        // Get data for previous period for comparison
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
        
        const now = new Date();
        let startDate, endDate;

        switch(this.currentPeriod) {
            case 'today':
                startDate = new Date(now.setDate(now.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 14));
                endDate = new Date(now.setDate(now.getDate() + 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 2));
                endDate = new Date(now.setMonth(now.getMonth() + 1));
                break;
            default:
                return { revenue: 0, transactions: 0 };
        }

        const previousTransactions = transactions.filter(t => {
            const transDate = new Date(t.createdAt || t.date);
            return transDate >= startDate && transDate <= endDate;
        });

        return {
            revenue: previousTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
            transactions: previousTransactions.length
        };
    }

    calculateChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    }

    updateSummaryCards(data) {
        // Update revenue card
        this.updateCard('#todayRevenueCard', {
            value: this.formatCurrency(data.totalRevenue),
            change: data.revenueChange,
            label: 'Omzet Hari Ini'
        });

        // Update transactions card
        this.updateCard('#todayTransactions', {
            value: data.totalTransactions.toString(),
            change: data.transactionChange,
            label: 'Transaksi Hari Ini'
        });

        // Update commission card
        this.updateCard('#todayCommission', {
            value: this.formatCurrency(data.totalCommission),
            label: 'Komisi Operator'
        });

        // Update members card
        this.updateCard('#activeMembers', {
            value: data.newMembers.toString(),
            label: 'Member Baru'
        });

        // Update free washes card
        this.updateCard('#freeWashAvailable', {
            value: data.freeWashes.toString(),
            label: 'Cuci Gratis'
        });

        // Update customer count
        this.updateCard('#customerCount', {
            value: data.totalCustomers.toString(),
            label: 'Total Pelanggan'
        });

        // Update average transaction
        this.updateCard('#avgTransaction', {
            value: this.formatCurrency(data.avgTransactionValue),
            label: 'Rata-rata Transaksi'
        });
    }

    updateCard(selector, data) {
        const element = document.querySelector(selector);
        if (!element) return;

        if (selector.includes('Card')) {
            // For stat cards
            const valueElement = element.querySelector('.stat-value');
            const changeElement = element.querySelector('.stat-change');
            
            if (valueElement) valueElement.textContent = data.value;
            if (changeElement && data.change !== undefined) {
                const isPositive = parseFloat(data.change) >= 0;
                changeElement.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                    <span>${Math.abs(data.change)}%</span> dari periode sebelumnya
                `;
                changeElement.style.color = isPositive ? '#4cc9f0' : '#f72585';
            }
        } else {
            // For simple value display
            element.textContent = data.value;
        }
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Belum ada transaksi</p>
                        <small>Mulai dengan membuat transaksi baru</small>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        transactions.forEach(transaction => {
            const statusClass = this.getStatusClass(transaction.status);
            const date = new Date(transaction.date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <tr>
                    <td>${date}</td>
                    <td><strong>${transaction.licensePlate}</strong></td>
                    <td>${transaction.customerName}</td>
                    <td>${transaction.washType}</td>
                    <td>${this.formatCurrency(transaction.total)}</td>
                    <td>
                        <span class="badge ${statusClass}">
                            ${this.getStatusText(transaction.status)}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="btn-action btn-small" onclick="dashboardManager.viewTransactionDetail('${transaction.id}')" title="Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-small" onclick="dashboardManager.printTransaction('${transaction.id}')" title="Cetak">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
    }

    updateTopCustomers(customers) {
        const container = document.getElementById('topCustomers');
        if (!container) return;

        if (customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Belum ada data pelanggan</p>
                </div>
            `;
            return;
        }

        let html = '<div class="customers-list">';
        customers.forEach((customer, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const lastVisit = customer.lastVisit 
                ? new Date(customer.lastVisit).toLocaleDateString('id-ID')
                : 'Belum pernah';

            html += `
                <div class="customer-card">
                    <div class="customer-rank ${rankClass}">${index + 1}</div>
                    <div class="customer-info">
                        <h4>${customer.name}</h4>
                        <p class="customer-meta">
                            <span><i class="fas fa-phone"></i> ${customer.phone || '-'}</span>
                            <span><i class="fas fa-car"></i> ${customer.licensePlate || '-'}</span>
                        </p>
                        <div class="customer-stats">
                            <div class="stat">
                                <i class="fas fa-shopping-cart"></i>
                                <span>${customer.transactionCount || 0} transaksi</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>${this.formatCurrency(customer.totalSpent || 0)}</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-calendar"></i>
                                <span>${lastVisit}</span>
                            </div>
                        </div>
                    </div>
                    <div class="customer-actions">
                        <button class="btn-action btn-small" onclick="dashboardManager.viewCustomerDetail('${customer.id}')">
                            <i class="fas fa-user-circle"></i> Profil
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    updateOperatorStats(operators) {
        const container = document.getElementById('operatorStats');
        if (!container) return;

        const activeOperators = operators.filter(op => op.status === 'active');
        
        if (activeOperators.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>Tidak ada operator aktif</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="operator-stats-summary">
                <div class="stat-card">
                    <i class="fas fa-user-check"></i>
                    <h3>${activeOperators.length}</h3>
                    <p>Operator Aktif</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>${this.formatCurrency(activeOperators.reduce((sum, op) => sum + op.pendingCommission, 0))}</h3>
                    <p>Komisi Tertunda</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <h3>${activeOperators.reduce((sum, op) => sum + op.totalTransactions, 0)}</h3>
                    <p>Total Transaksi</p>
                </div>
            </div>
            
            <div class="operators-grid">
        `;

        activeOperators.forEach(operator => {
            const completionRate = operator.performance?.completionRate || 0;
            const progressWidth = Math.min(completionRate, 100);
            const progressColor = completionRate >= 80 ? '#4cc9f0' : 
                                completionRate >= 60 ? '#f8961e' : '#f72585';

            html += `
                <div class="operator-card">
                    <div class="operator-header">
                        <div class="operator-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="operator-info">
                            <h4>${operator.name}</h4>
                            <p class="operator-meta">
                                <span><i class="fas fa-phone"></i> ${operator.phone}</span>
                                <span><i class="fas fa-star"></i> ${operator.performance?.avgRating || 0}/5</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="operator-stats">
                        <div class="stat-row">
                            <span>Transaksi:</span>
                            <strong>${operator.totalTransactions}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Omzet:</span>
                            <strong>${this.formatCurrency(operator.totalRevenue)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Komisi:</span>
                            <strong class="text-success">${this.formatCurrency(operator.totalCommission)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Tertunda:</span>
                            <strong class="text-warning">${this.formatCurrency(operator.pendingCommission)}</strong>
                        </div>
                    </div>
                    
                    <div class="operator-progress">
                        <div class="progress-label">
                            <span>Completion Rate</span>
                            <span>${completionRate}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressWidth}%; background: ${progressColor};"></div>
                        </div>
                    </div>
                    
                    <div class="operator-actions">
                        <button class="btn-action btn-small" onclick="dashboardManager.viewOperatorDetail('${operator.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-small" onclick="dashboardManager.payCommission('${operator.id}')">
                            <i class="fas fa-money-bill-wave"></i>
                        </button>
                        <button class="btn-action btn-small" onclick="dashboardManager.viewSchedule('${operator.id}')">
                            <i class="fas fa-calendar"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    updateCharts(data) {
        // Update revenue chart
        if (this.charts.revenue) {
            const chartData = this.generateRevenueChartData();
            this.charts.revenue.data.labels = chartData.labels;
            this.charts.revenue.data.datasets[0].data = chartData.data;
            this.charts.revenue.update();
        }

        // Update motorcycle type chart
        if (this.charts.motorcycle) {
            const chartData = this.generateMotorcycleChartData();
            this.charts.motorcycle.data.labels = chartData.labels;
            this.charts.motorcycle.data.datasets[0].data = chartData.data;
            this.charts.motorcycle.update();
        }

        // Update commission chart
        if (this.charts.commission) {
            const chartData = this.generateCommissionChartData();
            this.charts.commission.data.labels = chartData.labels;
            this.charts.commission.data.datasets[0].data = chartData.data;
            this.charts.commission.update();
        }

        // Update performance chart
        if (this.charts.performance) {
            const chartData = this.generatePerformanceChartData();
            this.charts.performance.data.datasets[0].data = chartData;
            this.charts.performance.update();
        }
    }

    generateRevenueChartData() {
        // Generate sample data for revenue chart
        const periods = this.getChartPeriods();
        const data = periods.map(() => Math.floor(Math.random() * 5000000) + 1000000);
        
        return {
            labels: periods,
            data: data
        };
    }

    generateMotorcycleChartData() {
        const types = ['Matic', 'Sport/Bebek', 'Big Bike', 'Lainnya'];
        const data = types.map(() => Math.floor(Math.random() * 100));
        const total = data.reduce((sum, val) => sum + val, 0);
        
        // Normalize to 100%
        return {
            labels: types,
            data: data.map(val => Math.round((val / total) * 100))
        };
    }

    generateCommissionChartData() {
        const operators = JSON.parse(localStorage.getItem('motowash_operators') || '[]');
        const activeOperators = operators.filter(op => op.status === 'active');
        
        return {
            labels: activeOperators.map(op => op.name),
            data: activeOperators.map(op => op.pendingCommission || 0)
        };
    }

    generatePerformanceChartData() {
        // Generate random performance data
        return [
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 5,
            Math.random() * 100
        ];
    }

    getChartPeriods() {
        switch(this.currentPeriod) {
            case 'today':
                return ['Pagi', 'Siang', 'Sore', 'Malam'];
            case 'week':
                return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
            case 'month':
                return ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
            case 'year':
                return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            default:
                return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        }
    }

    updateDateTime() {
        // Update current time
        const updateTime = () => {
            const now = new Date();
            const timeElement = document.getElementById('currentTime');
            const dateElement = document.getElementById('currentDate');
            
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        };
        
        // Update immediately and set interval
        updateTime();
        setInterval(updateTime, 1000);
    }

    updateLastRefresh() {
        const element = document.getElementById('lastRefresh');
        if (element) {
            const now = new Date();
            element.textContent = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    updateActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop();
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        
        menuItems.forEach(item => {
            item.parentElement.classList.remove('active');
            const href = item.getAttribute('href');
            if (href && href.includes(currentPage)) {
                item.parentElement.classList.add('active');
            }
        });
    }

    // UI ACTION METHODS

    navigateToPage(page) {
        switch(page) {
            case 'dashboard':
                window.location.href = 'dashboard.html';
                break;
            case 'new-transaction':
                window.location.href = 'register-wash.html';
                break;
            case 'camera-capture':
                window.location.href = 'camera-capture.html';
                break;
            case 'transactions':
                window.location.href = 'transactions.html';
                break;
            case 'customers':
                window.location.href = 'customers.html';
                break;
            case 'operators':
                window.location.href = 'operators.html';
                break;
            case 'reports':
                window.location.href = 'reports.html';
                break;
            case 'expenses':
                window.location.href = 'expenses.html';
                break;
            case 'settings':
                window.location.href = 'settings.html';
                break;
            default:
                console.log('Page not found:', page);
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${tabName}Tab`);
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (tabContent) tabContent.classList.add('active');
        if (tabButton) tabButton.classList.add('active');
    }

    viewAllItems(type) {
        switch(type) {
            case 'transactions':
                window.location.href = 'transactions.html';
                break;
            case 'customers':
                window.location.href = 'customers.html';
                break;
            case 'operators':
                window.location.href = 'operators.html';
                break;
            default:
                console.log('Unknown type:', type);
        }
    }

    viewTransactionDetail(transactionId) {
        this.showNotification(`Membuka detail transaksi: ${transactionId}`, 'info');
        // In production, open transaction detail modal or page
    }

    printTransaction(transactionId) {
        this.showNotification(`Mencetak struk transaksi: ${transactionId}`, 'info');
        // In production, open print dialog for receipt
    }

    viewCustomerDetail(customerId) {
        this.showNotification(`Membuka profil pelanggan: ${customerId}`, 'info');
        // In production, open customer detail modal
    }

    viewOperatorDetail(operatorId) {
        this.showNotification(`Membuka detail operator: ${operatorId}`, 'info');
        // In production, open operator detail modal
    }

    payCommission(operatorId) {
        this.showNotification(`Memproses pembayaran komisi untuk operator: ${operatorId}`, 'info');
        // In production, open commission payment modal
    }

    viewSchedule(operatorId) {
        this.showNotification(`Membuka jadwal operator: ${operatorId}`, 'info');
        // In production, open schedule modal
    }

    showAddCustomerModal() {
        const modalHtml = `
            <div class="modal" id="addCustomerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Tambah Pelanggan Baru</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="customerForm">
                            <div class="form-group">
                                <label for="customerName">Nama Lengkap *</label>
                                <input type="text" id="customerName" required>
                            </div>
                            <div class="form-group">
                                <label for="customerPhone">No. Handphone *</label>
                                <input type="tel" id="customerPhone" required>
                            </div>
                            <div class="form-group">
                                <label for="customerPlate">Plat Nomor</label>
                                <input type="text" id="customerPlate">
                            </div>
                            <div class="form-group">
                                <label for="customerType">Jenis Motor</label>
                                <select id="customerType">
                                    <option value="">Pilih Jenis</option>
                                    <option value="matic">Matic</option>
                                    <option value="sport">Sport/Bebek</option>
                                    <option value="bigbike">Big Bike</option>
                                </select>
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
    }

    printLastReceipt() {
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
        if (transactions.length > 0) {
            const lastTransaction = transactions[transactions.length - 1];
            this.showNotification(`Mencetak struk terakhir: ${lastTransaction.id}`, 'info');
        } else {
            this.showNotification('Tidak ada transaksi untuk dicetak', 'warning');
        }
    }

    showReportsModal() {
        this.showNotification('Membuka laporan lengkap', 'info');
        window.location.href = 'reports.html';
    }

    showNotifications() {
        const notifications = [
            { id: 1, type: 'info', message: '3 transaksi menunggu konfirmasi', time: '5 menit lalu' },
            { id: 2, type: 'success', message: 'Komisi operator berhasil dibayarkan', time: '1 jam lalu' },
            { id: 3, type: 'warning', message: 'Stok sabun hampir habis', time: '2 jam lalu' }
        ];
        
        let html = '<div class="notifications-dropdown">';
        notifications.forEach(notif => {
            const icon = notif.type === 'info' ? 'info-circle' : 
                        notif.type === 'success' ? 'check-circle' : 'exclamation-triangle';
            
            html += `
                <div class="notification-item notification-${notif.type}">
                    <i class="fas fa-${icon}"></i>
                    <div class="notification-content">
                        <p>${notif.message}</p>
                        <small>${notif.time}</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // Show notifications dropdown
        this.showDropdown('notificationBell', html);
    }

    toggleUserMenu() {
        const userMenu = `
            <div class="user-menu-dropdown">
                <div class="user-info">
                    <i class="fas fa-user-circle"></i>
                    <div>
                        <strong>${window.authManager?.currentUser?.name || 'User'}</strong>
                        <small>${window.authManager?.currentUser?.role === 'admin' ? 'Administrator' : 'Operator'}</small>
                    </div>
                </div>
                <div class="menu-items">
                    <a href="profile.html" class="menu-item">
                        <i class="fas fa-user"></i> Profil Saya
                    </a>
                    <a href="settings.html" class="menu-item">
                        <i class="fas fa-cog"></i> Pengaturan
                    </a>
                    <div class="menu-divider"></div>
                    <a href="#" class="menu-item" onclick="window.authManager.logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        `;
        
        this.showDropdown('userProfile', userMenu);
    }

    showDropdown(triggerId, content) {
        // Remove existing dropdown
        const existing = document.querySelector('.dropdown-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dropdown-overlay';
        overlay.innerHTML = content;
        
        // Position near trigger
        const trigger = document.getElementById(triggerId);
        if (trigger) {
            const rect = trigger.getBoundingClientRect();
            overlay.style.top = `${rect.bottom + 5}px`;
            overlay.style.right = `${window.innerWidth - rect.right}px`;
        }
        
        document.body.appendChild(overlay);
        
        // Close on outside click
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!overlay.contains(e.target) && e.target.id !== triggerId) {
                    overlay.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
    }

    filterDataByDate(dateRange) {
        this.showNotification(`Memfilter data untuk periode: ${dateRange}`, 'info');
        this.currentPeriod = 'custom';
        this.loadDashboardData();
    }

    printDashboardReport() {
        const printWindow = window.open('', '_blank');
        const dashboardContent = document.querySelector('.main-content').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Dashboard - MotoWash</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; }
                    .stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Laporan Dashboard MotoWash</h1>
                    <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                </div>
                ${dashboardContent}
                <div class="print-footer">
                    <p>Dicetak dari MotoWash POS System</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    exportDashboardData() {
        const data = {
            summary: this.getExportSummary(),
            transactions: this.getExportTransactions(),
            customers: this.getExportCustomers(),
            operators: this.getExportOperators()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data dashboard berhasil diekspor', 'success');
    }

    getExportSummary() {
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
        const customers = JSON.parse(localStorage.getItem('motowash_customers') || '[]');
        
        return {
            totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
            totalTransactions: transactions.length,
            totalCustomers: customers.length,
            activeMembers: customers.filter(c => c.isMember).length,
            exportDate: new Date().toISOString()
        };
    }

    getExportTransactions() {
        return JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
    }

    getExportCustomers() {
        return JSON.parse(localStorage.getItem('motowash_customers') || '[]');
    }

    getExportOperators() {
        return JSON.parse(localStorage.getItem('motowash_operators') || '[]');
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000); // 30 seconds
        
        console.log('Auto-refresh started');
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }

    showLoading(show) {
        const loader = document.getElementById('dashboardLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    getStatusClass(status) {
        switch(status?.toLowerCase()) {
            case 'completed':
            case 'selesai':
                return 'badge-success';
            case 'processing':
            case 'proses':
                return 'badge-warning';
            case 'pending':
            case 'menunggu':
                return 'badge-info';
            case 'cancelled':
            case 'dibatalkan':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    }

    getStatusText(status) {
        switch(status?.toLowerCase()) {
            case 'completed':
            case 'selesai':
                return 'Selesai';
            case 'processing':
            case 'proses':
                return 'Proses';
            case 'pending':
            case 'menunggu':
                return 'Menunggu';
            case 'cancelled':
            case 'dibatalkan':
                return 'Dibatalkan';
            default:
                return status || 'Unknown';
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

// Initialize Dashboard Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}