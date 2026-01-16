/**
 * Settings Manager for Motor Bersih POS
 * Manages application configuration, prices, operators, and themes
 */

class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.operators = [];
        this.init();
    }

    init() {
        console.log('Initializing Settings Manager...');
        
        // Setup tab switching first (before loading data)
        this.setupTabs();
        
        // Load operators
        this.loadOperators();
        
        // Load current settings to UI
        this.populateUI();
        
        console.log('✓ Settings Manager initialized');
    }

    setupTabs() {
        // Ensure all tab buttons exist
        const tabButtons = document.querySelectorAll('[data-tab]');
        console.log(`Found ${tabButtons.length} tab buttons`);
        
        if (tabButtons.length === 0) {
            console.error('No tab buttons found! Check HTML structure');
            return;
        }
        
        // Set initial active tab
        showTab('wash-prices');
        
        // Make sure first tab content is visible
        const firstTabContent = document.getElementById('wash-prices-tab');
        if (firstTabContent) {
            firstTabContent.classList.remove('hidden');
            console.log('✓ First tab content displayed');
        }
    }

    loadSettings() {
        const defaultSettings = {
            washPrices: {
                basic: { price: 25000, duration: 15, commission: 10, active: true },
                standard: { price: 50000, duration: 25, commission: 15, active: true },
                premium: { price: 100000, duration: 40, commission: 20, active: true }
            },
            commission: {
                type: 'percentage', // 'percentage' or 'fixed'
                value: 15
            },
            theme: {
                color: 'purple',
                businessName: 'Motor Bersih',
                businessAddress: '',
                businessPhone: '',
                businessEmail: ''
            }
        };

        const stored = localStorage.getItem('appSettings');
        return stored ? JSON.parse(stored) : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        this.showToast('Pengaturan berhasil disimpan!');
    }

    populateUI() {
        // Populate wash prices
        if (this.settings.washPrices) {
            Object.keys(this.settings.washPrices).forEach(type => {
                const data = this.settings.washPrices[type];
                document.getElementById(`${type}-price`).value = data.price;
                document.getElementById(`${type}-duration`).value = data.duration;
                document.getElementById(`${type}-commission`).value = data.commission;
                document.getElementById(`${type}-active`).checked = data.active;
            });
        }

        // Populate commission
        if (this.settings.commission) {
            document.getElementById('commissionType').value = this.settings.commission.type;
            document.getElementById('commissionValue').value = this.settings.commission.value;
        }

        // Populate theme
        if (this.settings.theme) {
            document.getElementById('businessName').value = this.settings.theme.businessName || '';
            document.getElementById('businessAddress').value = this.settings.theme.businessAddress || '';
            document.getElementById('businessPhone').value = this.settings.theme.businessPhone || '';
            document.getElementById('businessEmail').value = this.settings.theme.businessEmail || '';
        }
    }

    async loadOperators() {
        try {
            // Try to fetch from API
            if (window.apiClient) {
                // Placeholder - implement API call when available
                // const response = await window.apiClient.getOperators();
                // this.operators = response.data || [];
            }

            // For now, use dummy data
            this.operators = [
                { id: 1, name: 'Budi Santoso', phone: '081234567890', active: true, totalTransactions: 145 },
                { id: 2, name: 'Agus Wijaya', phone: '081234567891', active: true, totalTransactions: 132 },
                { id: 3, name: 'Rudi Hermawan', phone: '081234567892', active: false, totalTransactions: 98 }
            ];

            this.renderOperators();
        } catch (error) {
            console.error('Failed to load operators:', error);
        }
    }

    renderOperators() {
        const container = document.getElementById('operatorList');
        if (!container) return;

        if (this.operators.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-users text-5xl mb-4 block opacity-30"></i>
                    <p>Belum ada operator terdaftar</p>
                    <p class="text-sm mt-2">Klik tombol "Tambah Operator" untuk menambahkan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.operators.map(op => `
            <div class="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${op.name}</h3>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-phone text-gray-400 mr-1"></i>${op.phone}
                            </p>
                            <p class="text-sm text-gray-600 mt-1">
                                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                                ${op.totalTransactions} transaksi
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm ${op.active ? 'text-green-600' : 'text-gray-400'} font-semibold">
                                ${op.active ? 'Aktif' : 'Nonaktif'}
                            </span>
                            <label class="relative inline-block w-12 h-6">
                                <input type="checkbox" ${op.active ? 'checked' : ''} 
                                    onchange="window.settingsManager.toggleOperator(${op.id})"
                                    class="sr-only peer">
                                <div class="w-full h-full bg-gray-300 peer-checked:bg-green-500 rounded-full peer transition-all"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                            </label>
                        </div>
                        <button onclick="window.settingsManager.editOperator(${op.id})" 
                            class="px-3 py-2 text-gray-600 hover:text-blue-600 transition">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.settingsManager.deleteOperator(${op.id})" 
                            class="px-3 py-2 text-gray-600 hover:text-red-600 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleOperator(id) {
        const operator = this.operators.find(op => op.id === id);
        if (operator) {
            operator.active = !operator.active;
            this.showToast(`Operator ${operator.active ? 'diaktifkan' : 'dinonaktifkan'}`);
        }
    }

    editOperator(id) {
        const operator = this.operators.find(op => op.id === id);
        if (operator) {
            alert(`Edit operator: ${operator.name}\n(Fitur dalam pengembangan)`);
        }
    }

    deleteOperator(id) {
        if (confirm('Apakah Anda yakin ingin menghapus operator ini?')) {
            this.operators = this.operators.filter(op => op.id !== id);
            this.renderOperators();
            this.showToast('Operator berhasil dihapus');
        }
    }

    showToast(message) {
        const toast = document.getElementById('successToast');
        const messageEl = document.getElementById('toastMessage');
        
        messageEl.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Global functions for buttons and tabs
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Update active button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-purple-100', 'text-purple-700');
        btn.classList.add('text-gray-700');
    });
    
    // Find and activate the clicked button
    const clickedBtn = event?.target?.closest('.tab-btn');
    if (clickedBtn) {
        clickedBtn.classList.add('active', 'bg-purple-100', 'text-purple-700');
        clickedBtn.classList.remove('text-gray-700');
    }
}

function saveWashPrices() {
    const manager = window.settingsManager;
    
    // Update settings
    ['basic', 'standard', 'premium'].forEach(type => {
        manager.settings.washPrices[type] = {
            price: parseInt(document.getElementById(`${type}-price`).value),
            duration: parseInt(document.getElementById(`${type}-duration`).value),
            commission: parseInt(document.getElementById(`${type}-commission`).value),
            active: document.getElementById(`${type}-active`).checked
        };
    });
    
    manager.saveSettings();
}

function saveCommissionSettings() {
    const manager = window.settingsManager;
    
    manager.settings.commission = {
        type: document.getElementById('commissionType').value,
        value: parseFloat(document.getElementById('commissionValue').value)
    };
    
    manager.saveSettings();
}

function saveThemeSettings() {
    const manager = window.settingsManager;
    
    manager.settings.theme = {
        ...manager.settings.theme,
        businessName: document.getElementById('businessName').value,
        businessAddress: document.getElementById('businessAddress').value,
        businessPhone: document.getElementById('businessPhone').value,
        businessEmail: document.getElementById('businessEmail').value
    };
    
    manager.saveSettings();
}

function selectTheme(color) {
    // Update active theme
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active', 'border-purple-500', 'border-blue-500', 'border-green-500', 'border-red-500');
        opt.classList.add('border-gray-300');
    });
    
    event.target.closest('.theme-option').classList.remove('border-gray-300');
    event.target.closest('.theme-option').classList.add('active', `border-${color}-500`);
    
    // Save to settings
    window.settingsManager.settings.theme.color = color;
    window.settingsManager.showToast(`Tema ${color} dipilih`);
}

function showAddOperatorModal() {
    alert('Form tambah operator\n(Fitur dalam pengembangan)');
}

function backupData() {
    const manager = window.settingsManager;
    
    const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        settings: manager.settings,
        operators: manager.operators
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motorbersih-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    manager.showToast('Backup berhasil diunduh!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const auth = window.authManager || window.AuthManager?.getInstance?.();
    if (auth && !auth.checkAuth()) {
        return;
    }
    
    // Initialize settings manager
    window.settingsManager = new SettingsManager();
});

// Restore file handler
document.getElementById('restoreFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (confirm('Restore data akan menimpa data yang ada. Lanjutkan?')) {
                const manager = window.settingsManager;
                manager.settings = backup.settings || manager.settings;
                manager.operators = backup.operators || manager.operators;
                
                manager.saveSettings();
                manager.populateUI();
                manager.renderOperators();
                
                manager.showToast('Data berhasil direstore!');
            }
        } catch (error) {
            alert('File backup tidak valid');
            console.error('Restore error:', error);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
});
