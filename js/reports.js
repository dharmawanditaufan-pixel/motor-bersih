/**
 * Reports module for transaction and attendance reports
 */

let apiClient = null;
let currentFilters = {
    period: 'today',
    startDate: null,
    endDate: null,
    motorType: ''
};

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    apiClient = new APIClient();
    
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Initialize default dates
    initializeDates();
    
    // Load initial data
    await loadTransactionReport();
    await loadOperatorsList();
    
    // Initialize attendance tab with current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('monthFilter').value = currentMonth;
});

function initializeDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
}

function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.classList.remove('active', 'border-purple-600', 'text-purple-600');
        tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });
    
    const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    activeTab.classList.add('active', 'border-purple-600', 'text-purple-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    
    // Update tab content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.add('hidden'));
    
    const activeContent = document.getElementById(`content${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    activeContent.classList.remove('hidden');
    
    // Load data for the active tab
    if (tabName === 'transaksi') {
        loadTransactionReport();
    } else if (tabName === 'absensi') {
        loadAttendanceReport();
    }
}

function applyFilter() {
    const periodFilter = document.getElementById('periodFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const motorType = document.getElementById('motorTypeFilter').value;
    
    // Calculate date range based on period
    let calculatedStartDate, calculatedEndDate;
    const today = new Date();
    
    if (periodFilter === 'custom') {
        calculatedStartDate = startDate;
        calculatedEndDate = endDate;
    } else if (periodFilter === 'today') {
        calculatedStartDate = calculatedEndDate = today.toISOString().split('T')[0];
    } else if (periodFilter === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        calculatedStartDate = weekStart.toISOString().split('T')[0];
        calculatedEndDate = today.toISOString().split('T')[0];
    } else if (periodFilter === 'month') {
        calculatedStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = today.toISOString().split('T')[0];
    } else if (periodFilter === 'year') {
        calculatedStartDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        calculatedEndDate = today.toISOString().split('T')[0];
    }
    
    currentFilters = {
        period: periodFilter,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        motorType: motorType
    };
    
    loadTransactionReport();
}

function resetFilter() {
    document.getElementById('periodFilter').value = 'today';
    document.getElementById('motorTypeFilter').value = '';
    initializeDates();
    
    currentFilters = {
        period: 'today',
        startDate: null,
        endDate: null,
        motorType: ''
    };
    
    loadTransactionReport();
}

async function loadTransactionReport() {
    try {
        // Fetch transactions with filters
        const response = await apiClient.get('transactions');
        let transactions = response.data || [];
        
        // Apply filters
        transactions = filterTransactions(transactions);
        
        // Calculate summary
        const summary = calculateSummary(transactions);
        
        // Update UI
        displaySummary(summary);
        displayBreakdown(transactions);
        displayTransactionList(transactions);
        
    } catch (error) {
        console.error('Error loading transaction report:', error);
        showNotification('Gagal memuat laporan transaksi', 'error');
    }
}

function filterTransactions(transactions) {
    return transactions.filter(transaction => {
        // Date filter
        const transactionDate = new Date(transaction.created_at).toISOString().split('T')[0];
        if (currentFilters.startDate && transactionDate < currentFilters.startDate) return false;
        if (currentFilters.endDate && transactionDate > currentFilters.endDate) return false;
        
        // Motor type filter
        if (currentFilters.motorType && transaction.motorcycle_type !== currentFilters.motorType) return false;
        
        return true;
    });
}

function calculateSummary(transactions) {
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
    const uniqueMembers = new Set(transactions.filter(t => t.customer_id).map(t => t.customer_id)).size;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    return {
        totalTransactions,
        totalRevenue,
        activeMemberCount: uniqueMembers,
        avgTransaction
    };
}

function displaySummary(summary) {
    document.getElementById('totalTransactions').textContent = summary.totalTransactions;
    document.getElementById('totalRevenue').textContent = formatCurrency(summary.totalRevenue);
    document.getElementById('activeMemberCount').textContent = summary.activeMemberCount;
    document.getElementById('avgTransaction').textContent = formatCurrency(summary.avgTransaction);
}

function displayBreakdown(transactions) {
    const breakdown = {
        'motor_kecil': { count: 0, price: 15000, revenue: 0 },
        'motor_sedang': { count: 0, price: 20000, revenue: 0 },
        'motor_besar': { count: 0, price: 20000, revenue: 0 }
    };
    
    transactions.forEach(t => {
        const type = t.motorcycle_type;
        if (breakdown[type]) {
            breakdown[type].count++;
            breakdown[type].revenue += parseFloat(t.price || 0);
        }
    });
    
    const tableBody = document.getElementById('breakdownTableBody');
    let html = '';
    
    const typeNames = {
        'motor_kecil': 'Motor Kecil',
        'motor_sedang': 'Motor Sedang',
        'motor_besar': 'Motor Besar'
    };
    
    for (const [type, data] of Object.entries(breakdown)) {
        if (data.count > 0) {
            html += `
                <tr>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 bg-${getTypeColor(type)}-100 text-${getTypeColor(type)}-700 rounded text-xs font-semibold">
                            ${typeNames[type]}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-gray-900">${data.count} cuci</td>
                    <td class="px-6 py-4 text-gray-900">${formatCurrency(data.price)}</td>
                    <td class="px-6 py-4 font-semibold text-green-600">${formatCurrency(data.revenue)}</td>
                </tr>
            `;
        }
    }
    
    if (!html) {
        html = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">Belum ada data</td></tr>';
    }
    
    tableBody.innerHTML = html;
}

function displayTransactionList(transactions) {
    const tableBody = document.getElementById('transactionTableBody');
    
    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Belum ada data transaksi</td></tr>';
        return;
    }
    
    let html = '';
    transactions.forEach(t => {
        const date = new Date(t.created_at);
        const formattedDate = date.toLocaleDateString('id-ID');
        const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <tr>
                <td class="px-6 py-4 text-sm text-gray-900">#${t.id}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${formattedDate}<br>
                    <span class="text-xs text-gray-500">${formattedTime}</span>
                </td>
                <td class="px-6 py-4 text-sm font-mono font-semibold text-gray-900">${t.license_plate || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${t.customer_name || 'Guest'}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 bg-${getTypeColor(t.motorcycle_type)}-100 text-${getTypeColor(t.motorcycle_type)}-700 rounded text-xs font-semibold">
                        ${getTypeName(t.motorcycle_type)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-green-600">${formatCurrency(t.price)}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${t.operator_name || '-'}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

async function loadOperatorsList() {
    try {
        const response = await apiClient.get('operators');
        const operators = response.data || [];
        
        const operatorFilter = document.getElementById('operatorFilter');
        let html = '<option value="">Semua Operator</option>';
        
        operators.forEach(op => {
            html += `<option value="${op.id}">${op.name}</option>`;
        });
        
        operatorFilter.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading operators:', error);
    }
}

async function loadAttendanceReport() {
    try {
        const operatorId = document.getElementById('operatorFilter').value;
        const month = document.getElementById('monthFilter').value;
        
        // Fetch attendance data
        const response = await apiClient.get('attendance', { operator_id: operatorId, month: month });
        let attendanceData = response.data || [];
        
        // Calculate summary
        const summary = calculateAttendanceSummary(attendanceData);
        
        // Update UI
        displayAttendanceSummary(summary);
        displayAttendanceList(attendanceData);
        
    } catch (error) {
        console.error('Error loading attendance report:', error);
        showNotification('Gagal memuat laporan absensi', 'error');
    }
}

function calculateAttendanceSummary(attendanceData) {
    const summary = {
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
    };
    
    attendanceData.forEach(a => {
        if (a.status === 'present') summary.present++;
        else if (a.status === 'late') summary.late++;
        else if (a.status === 'absent') summary.absent++;
        else if (a.status === 'leave') summary.leave++;
    });
    
    return summary;
}

function displayAttendanceSummary(summary) {
    document.getElementById('totalPresent').textContent = summary.present;
    document.getElementById('totalLate').textContent = summary.late;
    document.getElementById('totalAbsent').textContent = summary.absent;
    document.getElementById('totalLeave').textContent = summary.leave;
}

function displayAttendanceList(attendanceData) {
    const tableBody = document.getElementById('attendanceTableBody');
    
    if (attendanceData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Belum ada data absensi</td></tr>';
        return;
    }
    
    let html = '';
    attendanceData.forEach(a => {
        const date = new Date(a.date);
        const formattedDate = date.toLocaleDateString('id-ID');
        const checkIn = a.check_in ? new Date(a.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        const checkOut = a.check_out ? new Date(a.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        const duration = calculateDuration(a.check_in, a.check_out);
        
        html += `
            <tr>
                <td class="px-6 py-4 text-sm text-gray-900">${formattedDate}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${a.operator_name}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${checkIn}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${checkOut}</td>
                <td class="px-6 py-4 text-sm">${getStatusBadge(a.status)}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${duration}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

function calculateDuration(checkIn, checkOut) {
    if (!checkIn || !checkOut) return '-';
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function getStatusBadge(status) {
    const badges = {
        'present': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Hadir</span>',
        'late': '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Terlambat</span>',
        'absent': '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Tidak Hadir</span>',
        'leave': '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Cuti</span>'
    };
    
    return badges[status] || '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">-</span>';
}

function getTypeColor(type) {
    const colors = {
        'motor_kecil': 'green',
        'motor_sedang': 'blue',
        'motor_besar': 'purple'
    };
    return colors[type] || 'gray';
}

function getTypeName(type) {
    const names = {
        'motor_kecil': 'Motor Kecil',
        'motor_sedang': 'Motor Sedang',
        'motor_besar': 'Motor Besar'
    };
    return names[type] || type;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function exportToExcel() {
    showNotification('Export Excel laporan transaksi dalam proses...', 'info');
    
    // In production, implement actual Excel export
    // For now, create CSV download
    try {
        const transactions = Array.from(document.querySelectorAll('#transactionTableBody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return null;
            
            return {
                ID: cells[0].textContent.trim(),
                Tanggal: cells[1].textContent.trim().replace(/\s+/g, ' '),
                Plat: cells[2].textContent.trim(),
                Customer: cells[3].textContent.trim(),
                Tipe: cells[4].textContent.trim(),
                Harga: cells[5].textContent.trim(),
                Operator: cells[6].textContent.trim()
            };
        }).filter(t => t !== null);
        
        if (transactions.length === 0) {
            showNotification('Tidak ada data untuk di-export', 'warning');
            return;
        }
        
        // Create CSV
        const headers = Object.keys(transactions[0]).join(',');
        const rows = transactions.map(t => Object.values(t).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Export berhasil!', 'success');
        
    } catch (error) {
        console.error('Error exporting:', error);
        showNotification('Gagal export data', 'error');
    }
}

function exportAttendanceToExcel() {
    showNotification('Export Excel laporan absensi dalam proses...', 'info');
    
    try {
        const attendance = Array.from(document.querySelectorAll('#attendanceTableBody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 6) return null;
            
            return {
                Tanggal: cells[0].textContent.trim(),
                Operator: cells[1].textContent.trim(),
                CheckIn: cells[2].textContent.trim(),
                CheckOut: cells[3].textContent.trim(),
                Status: cells[4].textContent.trim(),
                Durasi: cells[5].textContent.trim()
            };
        }).filter(a => a !== null);
        
        if (attendance.length === 0) {
            showNotification('Tidak ada data untuk di-export', 'warning');
            return;
        }
        
        // Create CSV
        const headers = Object.keys(attendance[0]).join(',');
        const rows = attendance.map(a => Object.values(a).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `laporan_absensi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Export berhasil!', 'success');
        
    } catch (error) {
        console.error('Error exporting:', error);
        showNotification('Gagal export data', 'error');
    }
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}
