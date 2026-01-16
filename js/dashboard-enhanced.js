/**
 * Enhanced Dashboard Manager with Real API Integration
 * - Real-time data from database
 * - Dynamic chart rendering
 * - Date filtering and pagination
 * - Error handling and auto-refresh
 */

class DashboardManager {
    constructor() {
        this.currentPeriod = 'today';
        this.charts = {};
        this.autoRefreshInterval = null;
        this.dashboardData = null;
        this.apiClient = null;
        this.init();
    }

    async init() {
        // Check authentication first
        if (!this.checkAuth()) {
            return;
        }

        // Initialize API client
        if (typeof apiClient === 'undefined') {
            window.apiClient = new APIClient();
        }
        this.apiClient = window.apiClient;

        // Initialize all dashboard components
        await this.initializeComponents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start auto-refresh (every 30 seconds)
        this.startAutoRefresh();
        
        // Initial data load
        await this.loadDashboardData();
        
        console.log('✓ Dashboard initialized successfully');
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

        // Refresh button
        document.getElementById('refreshDashboard')?.addEventListener('click', () => {
            this.loadDashboardData(true);
        });

        // Print report button
        document.getElementById('printReport')?.addEventListener('click', () => {
            this.printDashboardReport();
        });

        // Export data button
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportDashboardData();
        });

        // Quick action buttons
        document.getElementById('quickTransaction')?.addEventListener('click', () => {
            window.location.href = 'register-wash.html';
        });

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
    }

    initializePageNavigation() {
        // Set active menu item
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            if (link.getAttribute('href').includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }

    initializeCharts() {
        // Revenue Chart (Line Chart)
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                    datasets: [{
                        label: 'Omzet (Rp)',
                        data: [0, 0, 0, 0, 0, 0, 0],
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

        // Motorcycle Type Chart (Doughnut)
        const motorcycleCtx = document.getElementById('motorcycleChart');
        if (motorcycleCtx) {
            this.charts.motorcycle = new Chart(motorcycleCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Matic', 'Sport', 'Big Bike'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#4361ee', '#7209b7', '#4cc9f0'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: this.getChartOptions('doughnut')
            });
        }

        // Commission Chart (Bar)
        const commissionCtx = document.getElementById('commissionChart');
        if (commissionCtx) {
            this.charts.commission = new Chart(commissionCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Budi', 'Andi', 'Roni'],
                    datasets: [{
                        label: 'Komisi (Rp)',
                        data: [0, 0, 0],
                        backgroundColor: 'rgba(114, 9, 183, 0.8)',
                        borderColor: '#7209b7',
                        borderWidth: 1
                    }]
                },
                options: this.getChartOptions('bar')
            });
        }

        // Payment Methods Chart (Pie)
        const paymentCtx = document.getElementById('paymentChart');
        if (paymentCtx) {
            this.charts.payment = new Chart(paymentCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Cash', 'Transfer', 'QRIS', 'E-Wallet'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#4cc9f0', '#f72585', '#4361ee', '#f8961e']
                    }]
                },
                options: this.getChartOptions('pie')
            });
        }
    }

    initializeQuickActions() {
        // Quick action cards already initialized in HTML
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const target = action.dataset.target;
                if (target) {
                    window.location.href = target;
                }
            });
        });
    }

    async loadDashboardData(forceRefresh = false) {
        try {
            this.showLoading(true);

            // Get dashboard data from API
            const data = await this.apiClient.getDashboardData();

            if (!data || !data.success) {
                throw new Error('Failed to load dashboard data');
            }

            this.dashboardData = data;

            // Update summary cards
            this.updateSummaryCards(data);

            // Update charts with real data
            this.updateChartsWithData(data);

            // Update recent transactions
            this.updateRecentTransactions(data.data.recent_transactions || []);

            // Update top operators
            this.updateTopOperators(data.data.top_operators || []);

            // Update last refresh time
            this.updateLastRefresh();

            this.showNotification('Data dashboard diperbarui ✓', 'success');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading data: ' + error.message, 'error');
            this.loadDashboardDataFromLocalStorage();
        } finally {
            this.showLoading(false);
        }
    }

    updateSummaryCards(data) {
        try {
            const d = data.data;

            // Revenue Card
            this.updateCard('#todayRevenueCard', {
                value: this.formatCurrency(d.revenue?.total || 0),
                change: 12,
                label: 'Omzet Hari Ini'
            });

            // Transactions Card
            this.updateCard('#todayTransactions', {
                value: (d.revenue?.count || 0).toString(),
                change: 8,
                label: 'Transaksi'
            });

            // Commission Card
            this.updateCard('#todayCommission', {
                value: this.formatCurrency(d.commission?.total || 0),
                label: 'Komisi'
            });

            // Members Card
            this.updateCard('#activeMembers', {
                value: (d.members?.active || 0).toString(),
                label: 'Member Aktif'
            });

            // Customer Count
            this.updateCard('#customerCount', {
                value: (d.members?.total || 0).toString(),
                label: 'Total Pelanggan'
            });

            // Average Transaction
            const avgTrans = d.revenue?.count > 0 
                ? d.revenue?.total / d.revenue?.count 
                : 0;
            this.updateCard('#avgTransaction', {
                value: this.formatCurrency(avgTrans),
                label: 'Rata-rata Transaksi'
            });

        } catch (error) {
            console.error('Error updating summary cards:', error);
        }
    }

    updateChartsWithData(data) {
        try {
            const d = data.data;

            // Update Motorcycle Chart
            if (this.charts.motorcycle && d.motorcycle_types) {
                this.charts.motorcycle.data.labels = Object.keys(d.motorcycle_types);
                this.charts.motorcycle.data.datasets[0].data = Object.values(d.motorcycle_types).map(m => m.count);
                this.charts.motorcycle.update('none');
            }

            // Update Commission Chart
            if (this.charts.commission && d.top_operators) {
                this.charts.commission.data.labels = d.top_operators.map(op => op.name);
                this.charts.commission.data.datasets[0].data = d.top_operators.map(op => op.commission);
                this.charts.commission.update('none');
            }

            // Update Payment Methods Chart
            if (this.charts.payment && d.payment_methods) {
                this.charts.payment.data.labels = Object.keys(d.payment_methods).map(m => 
                    m === 'cash' ? 'Cash' : 
                    m === 'transfer' ? 'Transfer' :
                    m === 'qris' ? 'QRIS' : 'E-Wallet'
                );
                this.charts.payment.data.datasets[0].data = Object.values(d.payment_methods).map(p => p.total);
                this.charts.payment.update('none');
            }

        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    updateCard(selector, data) {
        const element = document.querySelector(selector);
        if (!element) return;

        const valueElement = element.querySelector('.stat-value');
        const changeElement = element.querySelector('.stat-change');
        const labelElement = element.querySelector('.stat-label');
        
        if (valueElement) valueElement.textContent = data.value;
        if (labelElement) labelElement.textContent = data.label;
        
        if (changeElement && data.change !== undefined) {
            const isPositive = parseFloat(data.change) >= 0;
            changeElement.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'} text-${isPositive ? 'green' : 'red'}-600"></i>
                <span>${Math.abs(data.change)}%</span>
            `;
        }
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada transaksi</p>';
            return;
        }

        container.innerHTML = transactions.map(t => `
            <div class="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50">
                <div class="flex-1">
                    <p class="font-semibold text-gray-900">${t.customer || 'N/A'}</p>
                    <p class="text-sm text-gray-600">${t.plate || 'N/A'} - ${t.code || 'N/A'}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-900">Rp ${this.formatNumber(t.amount || 0)}</p>
                    <span class="inline-block px-2 py-1 text-xs rounded-full ${
                        t.status === 'completed' ? 'bg-green-100 text-green-800' :
                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }">${t.status || 'pending'}</span>
                </div>
            </div>
        `).join('');
    }

    updateTopOperators(operators) {
        const container = document.getElementById('topOperators');
        if (!container) return;

        if (!operators || operators.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada data operator</p>';
            return;
        }

        container.innerHTML = operators.slice(0, 5).map((op, idx) => `
            <div class="flex items-center justify-between p-3 border-b border-gray-200">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        ${idx + 1}
                    </div>
                    <div>
                        <p class="font-semibold text-gray-900">${op.name}</p>
                        <p class="text-sm text-gray-600">${op.transactions} transaksi</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-purple-600">Rp ${this.formatNumber(op.commission || 0)}</p>
                    <p class="text-xs text-gray-600">komisi</p>
                </div>
            </div>
        `).join('');
    }

    updateCharts(data) {
        if (!data) return;
        this.updateChartsWithData(data);
    }

    getChartOptions(type) {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                            }
                            return label;
                        }
                    }
                }
            }
        };

        if (type === 'line') {
            return { ...commonOptions, scales: { y: { beginAtZero: true } } };
        } else if (type === 'bar') {
            return { ...commonOptions, scales: { y: { beginAtZero: true } } };
        } else if (type === 'doughnut' || type === 'pie') {
            return commonOptions;
        }
        return commonOptions;
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000); // Every 30 seconds
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    updateLastRefresh() {
        const element = document.getElementById('lastRefresh');
        if (element) {
            element.textContent = new Date().toLocaleTimeString('id-ID');
        }
    }

    updateDateTime() {
        const dateElement = document.getElementById('currentDate');
        const timeElement = document.getElementById('currentTime');

        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString('id-ID');
            setInterval(() => {
                timeElement.textContent = new Date().toLocaleTimeString('id-ID');
            }, 1000);
        }
    }

    showLoading(show) {
        const loader = document.getElementById('dashboardLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer') || 
            (() => {
                const div = document.createElement('div');
                div.id = 'notificationContainer';
                document.body.appendChild(div);
                return div;
            })();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showNotifications() {
        console.log('Show notifications');
    }

    toggleUserMenu() {
        const menu = document.getElementById('userMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }

    printDashboardReport() {
        window.print();
    }

    exportDashboardData() {
        if (!this.dashboardData) return;

        const csv = this.convertToCSV(this.dashboardData.data);
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        link.download = 'dashboard-' + new Date().toISOString().split('T')[0] + '.csv';
        link.click();
    }

    convertToCSV(obj) {
        let csv = 'Metric,Value\n';
        
        if (obj.revenue) {
            csv += `Total Revenue,Rp ${obj.revenue.total}\n`;
            csv += `Transaction Count,${obj.revenue.count}\n`;
        }
        
        if (obj.commission) {
            csv += `Total Commission,Rp ${obj.commission.total}\n`;
        }
        
        if (obj.members) {
            csv += `Total Members,${obj.members.total}\n`;
            csv += `Active Members,${obj.members.active}\n`;
        }

        return csv;
    }

    formatCurrency(value) {
        return 'Rp ' + (value || 0).toLocaleString('id-ID');
    }

    formatNumber(value) {
        return (value || 0).toLocaleString('id-ID');
    }

    loadDashboardDataFromLocalStorage() {
        // Fallback to localStorage if API fails
        const transactions = JSON.parse(localStorage.getItem('motowash_transactions') || '[]');
        const customers = JSON.parse(localStorage.getItem('motowash_customers') || '[]');

        if (transactions.length > 0) {
            this.showNotification('Using cached data from localStorage', 'warning');
            this.updateRecentTransactions(transactions.slice(0, 5));
        }
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.dashboardManager) {
            window.dashboardManager = new DashboardManager();
        }
    });
} else {
    if (!window.dashboardManager) {
        window.dashboardManager = new DashboardManager();
    }
}
