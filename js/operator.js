/**
 * Operator Management Module
 * Handles operator CRUD, commission calculation (30%), and attendance tracking
 */

class OperatorManager {
    constructor() {
        this.apiClient = new APIClient();
        this.operators = [];
        this.attendance = [];
        this.commissions = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedOperatorId = null;
        this.init();
    }

    init() {
        // Check auth
        const auth = window.authManager || window.AuthManager?.getInstance?.();
        if (auth && !auth.checkAuth()) {
            return;
        }

        this.loadOperators();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchOperator');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterOperators(e.target.value));
        }

        // Operator filter for attendance
        const operatorFilter = document.getElementById('operatorFilter');
        if (operatorFilter) {
            operatorFilter.addEventListener('change', (e) => {
                this.selectedOperatorId = e.target.value ? parseInt(e.target.value) : null;
                this.renderCalendar();
            });
        }

        // Month filter for commission
        const monthFilter = document.getElementById('monthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.loadCommissions());
        }
    }

    async loadOperators() {
        try {
            const response = await this.apiClient.get('/operators');
            
            if (response.success) {
                this.operators = response.data || [];
                this.renderOperators();
                this.updateStats();
                this.populateOperatorFilter();
            } else {
                this.showError('Gagal memuat data operator');
            }
        } catch (error) {
            console.error('Error loading operators:', error);
            this.showError('Gagal memuat data operator: ' + error.message);
        }
    }

    async loadAttendance() {
        try {
            const response = await this.apiClient.get(`/attendance?month=${this.currentMonth + 1}&year=${this.currentYear}`);
            
            if (response.success) {
                this.attendance = response.data || [];
                this.renderCalendar();
                this.renderAttendanceSummary();
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    }

    async loadCommissions() {
        try {
            const monthFilter = document.getElementById('monthFilter')?.value;
            const endpoint = monthFilter === 'last' ? '/commissions?month=last' : '/commissions';
            
            const response = await this.apiClient.get(endpoint);
            
            if (response.success) {
                this.commissions = response.data || [];
                this.renderCommissions();
            }
        } catch (error) {
            console.error('Error loading commissions:', error);
        }
    }

    renderOperators() {
        const tbody = document.getElementById('operatorsTableBody');
        if (!tbody) return;

        if (this.operators.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-3 block"></i>
                        <p>Belum ada data operator</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.operators.map(op => this.renderOperatorRow(op)).join('');
    }

    renderOperatorRow(operator) {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'on_leave': 'bg-yellow-100 text-yellow-800'
        };

        const statusLabels = {
            'active': 'Aktif',
            'inactive': 'Tidak Aktif',
            'on_leave': 'Cuti'
        };

        // Calculate monthly commission (30% of total transactions)
        const monthlyCommission = operator.total_commission || 0;
        const pendingCommission = operator.pending_commission || 0;

        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 rounded-full">
                            <span class="text-purple-600 font-semibold">${operator.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${operator.name}</div>
                            <div class="text-xs text-gray-500">ID: ${operator.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${operator.phone || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[operator.status]}">
                        ${statusLabels[operator.status]}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                        <div class="font-semibold text-purple-600">${operator.commission_rate}%</div>
                        <div class="text-xs text-gray-500">dari setiap transaksi</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${operator.total_washes || 0} cuci</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                        <div class="font-semibold text-gray-900">Rp ${this.formatCurrency(monthlyCommission)}</div>
                        ${pendingCommission > 0 ? `<div class="text-xs text-orange-600">Pending: Rp ${this.formatCurrency(pendingCommission)}</div>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <button 
                            onclick="operatorManager.editOperator(${operator.id})"
                            class="text-blue-600 hover:text-blue-900 transition"
                            title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="operatorManager.viewDetails(${operator.id})"
                            class="text-green-600 hover:text-green-900 transition"
                            title="Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button 
                            onclick="operatorManager.deleteOperator(${operator.id}, '${operator.name}')"
                            class="text-red-600 hover:text-red-900 transition"
                            title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Update month label
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const monthLabel = document.getElementById('calendarMonth');
        if (monthLabel) {
            monthLabel.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        // Calculate calendar days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        let html = '';

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day border border-gray-200 rounded-lg p-2 bg-gray-50"></div>';
        }

        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today.toISOString().split('T')[0];
            
            // Get attendance for this day
            const dayAttendance = this.attendance.filter(a => a.date === dateStr);
            
            html += `
                <div class="calendar-day border border-gray-200 rounded-lg p-2 ${isToday ? 'today bg-blue-50' : 'bg-white'}">
                    <div class="text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}">${day}</div>
                    <div class="space-y-1">
                        ${dayAttendance.map(a => this.renderAttendanceBadge(a)).join('')}
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    renderAttendanceBadge(attendance) {
        const colors = {
            'present': 'bg-green-100 text-green-800',
            'late': 'bg-yellow-100 text-yellow-800',
            'absent': 'bg-red-100 text-red-800',
            'leave': 'bg-blue-100 text-blue-800'
        };

        const icons = {
            'present': '✓',
            'late': '⏰',
            'absent': '✗',
            'leave': '🏖'
        };

        // Filter by selected operator if any
        if (this.selectedOperatorId && attendance.operator_id !== this.selectedOperatorId) {
            return '';
        }

        const operator = this.operators.find(o => o.id === attendance.operator_id);
        const operatorName = operator ? operator.name.split(' ')[0] : 'Op';

        return `
            <div class="attendance-badge ${colors[attendance.status]} flex items-center gap-1">
                <span>${icons[attendance.status]}</span>
                <span class="truncate">${operatorName}</span>
            </div>
        `;
    }

    renderAttendanceSummary() {
        const summary = document.getElementById('attendanceSummary');
        if (!summary) return;

        // Calculate attendance statistics
        const stats = {};
        this.operators.forEach(op => {
            const operatorAttendance = this.attendance.filter(a => a.operator_id === op.id);
            const present = operatorAttendance.filter(a => a.status === 'present').length;
            const total = operatorAttendance.length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            stats[op.id] = { name: op.name, present, total, percentage };
        });

        summary.innerHTML = Object.values(stats).map(s => `
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">${s.name}</span>
                <span class="text-sm font-semibold ${s.percentage >= 80 ? 'text-green-600' : 'text-red-600'}">
                    ${s.present}/${s.total} (${s.percentage}%)
                </span>
            </div>
        `).join('');
    }

    renderCommissions() {
        const tbody = document.getElementById('commissionTableBody');
        if (!tbody) return;

        if (this.operators.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-money-bill-wave text-4xl mb-3 block"></i>
                        <p>Belum ada data komisi</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.operators.map(op => {
            const totalOmzet = op.total_revenue || 0;
            const totalCommission = Math.round(totalOmzet * (op.commission_rate / 100));
            const paid = op.paid_commission || 0;
            const pending = totalCommission - paid;

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${op.name}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${op.total_washes || 0} transaksi
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp ${this.formatCurrency(totalOmzet)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                        Rp ${this.formatCurrency(totalCommission)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        Rp ${this.formatCurrency(paid)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                        Rp ${this.formatCurrency(pending)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${pending > 0 ? `
                            <button 
                                onclick="operatorManager.payCommission(${op.id}, ${pending})"
                                class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition">
                                <i class="fas fa-check mr-1"></i>Bayar
                            </button>
                        ` : `<span class="text-gray-400">Lunas</span>`}
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateStats() {
        // Total operators
        document.getElementById('totalOperators').textContent = this.operators.length;

        // Present today (mock data for now)
        const presentToday = this.operators.filter(o => o.status === 'active').length;
        document.getElementById('presentToday').textContent = presentToday;

        // Total commission this month
        const totalCommission = this.operators.reduce((sum, op) => sum + (op.total_commission || 0), 0);
        document.getElementById('totalCommission').textContent = 'Rp ' + this.formatCurrency(totalCommission);

        // Pending commission
        const pendingCommission = this.operators.reduce((sum, op) => sum + (op.pending_commission || 0), 0);
        document.getElementById('pendingCommission').textContent = 'Rp ' + this.formatCurrency(pendingCommission);
    }

    populateOperatorFilter() {
        const select = document.getElementById('operatorFilter');
        if (!select) return;

        const options = this.operators.map(op => 
            `<option value="${op.id}">${op.name}</option>`
        ).join('');

        select.innerHTML = '<option value="">Semua Operator</option>' + options;
    }

    filterOperators(query) {
        // Implement search filter if needed
        console.log('Search:', query);
    }

    async checkInOperator() {
        const operatorId = this.selectedOperatorId || this.operators[0]?.id;
        if (!operatorId) {
            this.showError('Pilih operator terlebih dahulu');
            return;
        }

        try {
            const response = await this.apiClient.post('/attendance/checkin', {
                operator_id: operatorId,
                check_in: new Date().toTimeString().split(' ')[0]
            });

            if (response.success) {
                this.showSuccess('Check-in berhasil!');
                this.loadAttendance();
            } else {
                this.showError(response.message || 'Gagal check-in');
            }
        } catch (error) {
            console.error('Error check-in:', error);
            this.showError('Gagal check-in: ' + error.message);
        }
    }

    async checkOutOperator() {
        const operatorId = this.selectedOperatorId || this.operators[0]?.id;
        if (!operatorId) {
            this.showError('Pilih operator terlebih dahulu');
            return;
        }

        try {
            const response = await this.apiClient.post('/attendance/checkout', {
                operator_id: operatorId,
                check_out: new Date().toTimeString().split(' ')[0]
            });

            if (response.success) {
                this.showSuccess('Check-out berhasil!');
                this.loadAttendance();
            } else {
                this.showError(response.message || 'Gagal check-out');
            }
        } catch (error) {
            console.error('Error check-out:', error);
            this.showError('Gagal check-out: ' + error.message);
        }
    }

    async payCommission(operatorId, amount) {
        if (!confirm(`Bayar komisi Rp ${this.formatCurrency(amount)}?`)) {
            return;
        }

        try {
            const response = await this.apiClient.post('/commissions/pay', {
                operator_id: operatorId,
                amount: amount
            });

            if (response.success) {
                this.showSuccess('Komisi berhasil dibayar!');
                this.loadOperators();
                this.loadCommissions();
            } else {
                this.showError(response.message || 'Gagal membayar komisi');
            }
        } catch (error) {
            console.error('Error paying commission:', error);
            this.showError('Gagal membayar komisi: ' + error.message);
        }
    }

    editOperator(id) {
        alert('Edit operator #' + id + ' (coming soon)');
    }

    viewDetails(id) {
        alert('View details operator #' + id + ' (coming soon)');
    }

    async deleteOperator(id, name) {
        if (!confirm(`Hapus operator "${name}"?`)) {
            return;
        }

        try {
            const response = await this.apiClient.delete(`/operators/${id}`);
            
            if (response.success) {
                this.showSuccess('Operator berhasil dihapus!');
                this.loadOperators();
            } else {
                this.showError(response.message || 'Gagal menghapus operator');
            }
        } catch (error) {
            console.error('Error deleting operator:', error);
            this.showError('Gagal menghapus operator: ' + error.message);
        }
    }

    formatCurrency(amount) {
        return amount.toLocaleString('id-ID');
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }
}

// Tab switching
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
        btn.classList.add('text-gray-600');
    });

    // Show selected tab content
    const content = document.getElementById(`content-${tabName}`);
    if (content) {
        content.classList.remove('hidden');
    }

    // Add active class to selected tab button
    const btn = document.getElementById(`tab-${tabName}`);
    if (btn) {
        btn.classList.remove('text-gray-600');
        btn.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    }

    // Load data based on tab
    if (tabName === 'attendance') {
        operatorManager.loadAttendance();
    } else if (tabName === 'commission') {
        operatorManager.loadCommissions();
    }
}

// Calendar navigation
function previousMonth() {
    operatorManager.currentMonth--;
    if (operatorManager.currentMonth < 0) {
        operatorManager.currentMonth = 11;
        operatorManager.currentYear--;
    }
    operatorManager.loadAttendance();
}

function nextMonth() {
    operatorManager.currentMonth++;
    if (operatorManager.currentMonth > 11) {
        operatorManager.currentMonth = 0;
        operatorManager.currentYear++;
    }
    operatorManager.loadAttendance();
}

function checkInOperator() {
    operatorManager.checkInOperator();
}

function checkOutOperator() {
    operatorManager.checkOutOperator();
}

function openAddOperatorModal() {
    alert('Tambah operator (coming soon)');
}

function exportCommissionReport() {
    alert('Export laporan komisi (coming soon)');
}

// Initialize operator manager
let operatorManager;
document.addEventListener('DOMContentLoaded', () => {
    operatorManager = new OperatorManager();
});
