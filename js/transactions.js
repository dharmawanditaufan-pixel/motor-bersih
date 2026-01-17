/**
 * Transactions List Module
 */

let apiClient = null;
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
const itemsPerPage = 20;

const TYPE_NAMES = {
    'motor_kecil': 'Motor Kecil',
    'motor_sedang': 'Motor Sedang',
    'motor_besar': 'Motor Besar'
};

const PAYMENT_METHODS = {
    'cash': 'Tunai',
    'transfer': 'Transfer',
    'qris': 'QRIS',
    'debit': 'Debit'
};

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    apiClient = new APIClient();
    
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Load transactions
    await loadTransactions();
});

async function loadTransactions() {
    try {
        const response = await apiClient.get('transactions');
        allTransactions = response.data || [];
        
        // Apply filters
        applyFilters();
        
        // Update UI
        updateSummary();
        renderTransactions();
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2 block"></i>
                    Gagal memuat data transaksi
                </td>
            </tr>
        `;
    }
}

function applyFilters() {
    let filtered = [...allTransactions];
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter').value;
    if (dateFilter) {
        filtered = filtered.filter(t => {
            const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
            return transactionDate === dateFilter;
        });
    }
    
    // Type filter
    const typeFilter = document.getElementById('typeFilter').value;
    if (typeFilter) {
        filtered = filtered.filter(t => t.motorcycle_type === typeFilter);
    }
    
    // Payment filter
    const paymentFilter = document.getElementById('paymentFilter').value;
    if (paymentFilter) {
        filtered = filtered.filter(t => t.payment_method === paymentFilter);
    }
    
    // Search by plate
    const searchPlate = document.getElementById('searchPlate').value.trim().toUpperCase();
    if (searchPlate) {
        filtered = filtered.filter(t => 
            t.license_plate && t.license_plate.toUpperCase().includes(searchPlate)
        );
    }
    
    filteredTransactions = filtered;
    currentPage = 1;
}

function filterTable() {
    applyFilters();
    updateSummary();
    renderTransactions();
}

function resetFilters() {
    document.getElementById('dateFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    document.getElementById('searchPlate').value = '';
    
    loadTransactions();
}

function updateSummary() {
    const totalCount = filteredTransactions.length;
    const todayRevenue = calculateTodayRevenue();
    const freeWashCount = filteredTransactions.filter(t => t.is_loyalty_free).length;
    const avgTransaction = totalCount > 0 
        ? filteredTransactions.reduce((sum, t) => sum + parseFloat(t.price || 0), 0) / totalCount 
        : 0;
    
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('todayRevenue').textContent = formatCurrency(todayRevenue);
    document.getElementById('freeWashCount').textContent = freeWashCount;
    document.getElementById('avgTransaction').textContent = formatCurrency(avgTransaction);
}

function calculateTodayRevenue() {
    const today = new Date().toISOString().split('T')[0];
    return filteredTransactions
        .filter(t => {
            const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
            return transactionDate === today;
        })
        .reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
}

function renderTransactions() {
    const tableBody = document.getElementById('transactionTableBody');
    
    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2 block"></i>
                    Tidak ada data transaksi
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    let html = '';
    pageTransactions.forEach(t => {
        const date = new Date(t.created_at);
        const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        const typeColor = getTypeColor(t.motorcycle_type);
        const typeName = TYPE_NAMES[t.motorcycle_type] || t.motorcycle_type;
        const paymentName = PAYMENT_METHODS[t.payment_method] || t.payment_method;
        
        const priceDisplay = t.is_loyalty_free 
            ? '<span class="text-green-600 font-semibold">GRATIS</span>' 
            : formatCurrency(t.price);
        
        html += `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-mono text-gray-900">#${t.id}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${formattedDate}<br>
                    <span class="text-xs text-gray-500">${formattedTime}</span>
                </td>
                <td class="px-6 py-4 text-sm font-mono font-semibold text-gray-900">${t.license_plate || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${t.customer_name || 'Guest'}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 bg-${typeColor}-100 text-${typeColor}-700 rounded text-xs font-semibold">
                        ${typeName}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-semibold">${priceDisplay}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${paymentName}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${t.operator_name || '-'}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="viewDetail(${t.id})" class="text-purple-600 hover:text-purple-800">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startItem = filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, filteredTransactions.length);
    
    document.getElementById('showingStart').textContent = startItem;
    document.getElementById('showingEnd').textContent = endItem;
    document.getElementById('showingTotal').textContent = filteredTransactions.length;
    
    const paginationContainer = document.getElementById('pagination');
    let html = '';
    
    if (totalPages > 1) {
        // Previous button
        html += `
            <button onclick="goToPage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1 border border-gray-300 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const isActive = i === currentPage;
            html += `
                <button onclick="goToPage(${i})" 
                    class="px-3 py-1 border rounded ${isActive ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        html += `
            <button onclick="goToPage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1 border border-gray-300 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTransactions();
}

function viewDetail(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const date = new Date(transaction.created_at);
    const formattedDate = date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    });
    const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const typeName = TYPE_NAMES[transaction.motorcycle_type] || transaction.motorcycle_type;
    const paymentName = PAYMENT_METHODS[transaction.payment_method] || transaction.payment_method;
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Informasi Transaksi</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">ID Transaksi:</span>
                    <span class="font-mono font-semibold">#${transaction.id}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Tanggal:</span>
                    <span class="font-semibold">${formattedDate}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Waktu:</span>
                    <span class="font-semibold">${formattedTime}</span>
                </div>
            </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Data Kendaraan</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Plat Nomor:</span>
                    <span class="font-mono font-bold">${transaction.license_plate}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Tipe Motor:</span>
                    <span class="font-semibold">${typeName}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Customer:</span>
                    <span class="font-semibold">${transaction.customer_name}</span>
                </div>
                ${transaction.customer_phone ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">No. HP:</span>
                        <span class="font-semibold">${transaction.customer_phone}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <h3 class="font-semibold text-purple-900 mb-3">Pembayaran</h3>
            <div class="space-y-2 text-sm">
                ${transaction.is_loyalty_free ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Harga Normal:</span>
                        <span class="line-through">${formatCurrency(transaction.original_price || transaction.price)}</span>
                    </div>
                    <div class="flex justify-between text-green-700">
                        <span><i class="fas fa-gift mr-1"></i>Diskon Loyalty:</span>
                        <span class="font-bold">GRATIS</span>
                    </div>
                ` : ''}
                <div class="flex justify-between text-lg font-bold">
                    <span>Total Bayar:</span>
                    <span class="${transaction.is_loyalty_free ? 'text-green-600' : 'text-purple-600'}">
                        ${transaction.is_loyalty_free ? 'GRATIS' : formatCurrency(transaction.price)}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Metode:</span>
                    <span class="font-semibold">${paymentName}</span>
                </div>
            </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Informasi Lainnya</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Operator:</span>
                    <span class="font-semibold">${transaction.operator_name || '-'}</span>
                </div>
                ${transaction.notes ? `
                    <div>
                        <span class="text-gray-600 block mb-1">Catatan:</span>
                        <p class="text-gray-900 bg-white p-2 rounded">${transaction.notes}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

function printDetail() {
    window.print();
}

function exportTransactions() {
    if (filteredTransactions.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    try {
        const csv = convertToCSV(filteredTransactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Export berhasil!', 'success');
    } catch (error) {
        console.error('Error exporting:', error);
        showNotification('Gagal export data', 'error');
    }
}

function convertToCSV(data) {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Plat Nomor', 'Customer', 'Tipe Motor', 'Harga', 'Pembayaran', 'Operator', 'Catatan'];
    
    const rows = data.map(t => {
        const date = new Date(t.created_at);
        return [
            t.id,
            date.toLocaleDateString('id-ID'),
            date.toLocaleTimeString('id-ID'),
            t.license_plate,
            t.customer_name,
            TYPE_NAMES[t.motorcycle_type],
            t.is_loyalty_free ? 'GRATIS' : t.price,
            PAYMENT_METHODS[t.payment_method],
            t.operator_name || '',
            (t.notes || '').replace(/,/g, ';')
        ].map(val => `"${val}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

function getTypeColor(type) {
    const colors = {
        'motor_kecil': 'green',
        'motor_sedang': 'blue',
        'motor_besar': 'purple'
    };
    return colors[type] || 'gray';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}
