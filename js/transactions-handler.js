/**
 * Transaction Handler for Register Wash Page
 */

let apiClient = null;
let currentMemberData = null;
let currentTransactionId = null;

// Pricing configuration
const PRICING = {
    'motor_kecil': 15000,
    'motor_sedang': 20000,
    'motor_besar': 20000
};

const TYPE_NAMES = {
    'motor_kecil': 'Motor Kecil',
    'motor_sedang': 'Motor Sedang',
    'motor_besar': 'Motor Besar'
};

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    apiClient = new APIClient();
    
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Generate transaction ID
    generateTransactionId();
    
    // Load operators
    await loadOperators();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check URL parameters (from camera scan or member selection)
    checkUrlParameters();
    
    // Initialize today's date filter (if on transactions.html)
    if (document.getElementById('dateFilter')) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateFilter').value = today;
    }
});

function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    currentTransactionId = `TRX${timestamp.toString(36).toUpperCase()}${random.toString().padStart(3, '0')}`;
    
    const idElement = document.getElementById('transactionId');
    if (idElement) {
        idElement.textContent = currentTransactionId;
    }
}

function setupEventListeners() {
    // License plate input - check member on blur
    const licensePlateInput = document.getElementById('licensePlate');
    if (licensePlateInput) {
        licensePlateInput.addEventListener('blur', checkMemberByPlate);
        licensePlateInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    // Transaction form submit
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleSubmitTransaction);
    }
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // From camera scan
    const plate = urlParams.get('plate');
    const customerId = urlParams.get('customer_id');
    const name = urlParams.get('name');
    const type = urlParams.get('type');
    const loyalty = urlParams.get('loyalty');
    
    if (plate) {
        document.getElementById('licensePlate').value = plate;
        
        if (customerId) {
            // Member found from scan
            currentMemberData = {
                id: customerId,
                license_plate: plate,
                name: name,
                motorcycle_type: type,
                loyalty_count: parseInt(loyalty) || 0
            };
            
            displayMemberInfo();
            
            // Pre-fill form
            if (name) document.getElementById('customerName').value = name;
            if (type) {
                document.getElementById('motorcycleType').value = type;
                updatePrice();
            }
        } else {
            // Guest or new customer
            checkMemberByPlate();
        }
    }
}

async function checkMemberByPlate() {
    const licensePlate = document.getElementById('licensePlate').value.trim();
    
    if (!licensePlate) {
        hideMemberInfo();
        return;
    }
    
    try {
        const response = await apiClient.get('customers');
        const members = response.data || [];
        
        // Find member by license plate
        const normalizedPlate = licensePlate.replace(/\s/g, '').toUpperCase();
        const member = members.find(m => 
            m.license_plate && m.license_plate.replace(/\s/g, '').toUpperCase() === normalizedPlate
        );
        
        if (member) {
            currentMemberData = member;
            displayMemberInfo();
            
            // Auto-fill form
            if (member.name) document.getElementById('customerName').value = member.name;
            if (member.phone) document.getElementById('customerPhone').value = member.phone;
            if (member.motorcycle_type) {
                document.getElementById('motorcycleType').value = member.motorcycle_type;
                updatePrice();
            }
        } else {
            currentMemberData = null;
            hideMemberInfo();
        }
        
    } catch (error) {
        console.error('Error checking member:', error);
    }
}

function displayMemberInfo() {
    if (!currentMemberData) return;
    
    const memberInfo = document.getElementById('memberInfo');
    const memberName = document.getElementById('memberName');
    const loyaltyInfo = document.getElementById('loyaltyInfo');
    
    memberName.textContent = currentMemberData.name || 'Member';
    
    const loyaltyCount = currentMemberData.loyalty_count || 0;
    const loyaltyProgress = loyaltyCount % 5;
    
    if (loyaltyProgress === 0 && loyaltyCount >= 5) {
        loyaltyInfo.innerHTML = '<i class="fas fa-gift mr-1"></i>Gratis cuci (Loyalty reward)!';
    } else {
        loyaltyInfo.textContent = `Loyalty: ${loyaltyProgress}/5 cuci`;
    }
    
    memberInfo.classList.remove('hidden');
    updatePrice(); // Recalculate price with loyalty
}

function hideMemberInfo() {
    const memberInfo = document.getElementById('memberInfo');
    memberInfo.classList.add('hidden');
    updatePrice();
}

async function loadOperators() {
    try {
        const response = await apiClient.get('operators');
        const operators = response.data || [];
        
        const operatorSelect = document.getElementById('operatorId');
        if (operatorSelect) {
            let html = '<option value="">- Pilih Operator -</option>';
            
            operators.forEach(op => {
                if (op.active) {
                    html += `<option value="${op.id}">${op.name}</option>`;
                }
            });
            
            operatorSelect.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Error loading operators:', error);
    }
}

function updatePrice() {
    const motorcycleType = document.getElementById('motorcycleType').value;
    const summaryType = document.getElementById('summaryType');
    const summaryNormalPrice = document.getElementById('summaryNormalPrice');
    const summaryTotal = document.getElementById('summaryTotal');
    const loyaltyDiscountRow = document.getElementById('loyaltyDiscountRow');
    const summaryDiscount = document.getElementById('summaryDiscount');
    
    if (!motorcycleType) {
        summaryType.textContent = '-';
        summaryNormalPrice.textContent = 'Rp 0';
        summaryTotal.textContent = 'Rp 0';
        loyaltyDiscountRow.classList.add('hidden');
        return;
    }
    
    const price = PRICING[motorcycleType];
    const typeName = TYPE_NAMES[motorcycleType];
    
    summaryType.textContent = typeName;
    summaryNormalPrice.textContent = formatCurrency(price);
    
    // Check loyalty discount
    let finalPrice = price;
    let isFreeWash = false;
    
    if (currentMemberData) {
        const loyaltyCount = currentMemberData.loyalty_count || 0;
        const loyaltyProgress = loyaltyCount % 5;
        
        if (loyaltyProgress === 0 && loyaltyCount >= 5) {
            // Free wash!
            isFreeWash = true;
            finalPrice = 0;
            loyaltyDiscountRow.classList.remove('hidden');
            summaryDiscount.textContent = `- ${formatCurrency(price)}`;
        } else {
            loyaltyDiscountRow.classList.add('hidden');
        }
    } else {
        loyaltyDiscountRow.classList.add('hidden');
    }
    
    summaryTotal.textContent = formatCurrency(finalPrice);
    summaryTotal.classList.toggle('text-green-600', isFreeWash);
    summaryTotal.classList.toggle('text-purple-600', !isFreeWash);
}

async function handleSubmitTransaction(event) {
    event.preventDefault();
    
    // Validate form
    const licensePlate = document.getElementById('licensePlate').value.trim();
    const motorcycleType = document.getElementById('motorcycleType').value;
    const operatorId = document.getElementById('operatorId').value;
    
    if (!licensePlate || !motorcycleType || !operatorId) {
        showNotification('Mohon lengkapi data yang wajib diisi', 'error');
        return;
    }
    
    // Prepare transaction data
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('notes').value.trim();
    
    const price = PRICING[motorcycleType];
    let finalPrice = price;
    let isLoyaltyFree = false;
    
    // Check loyalty
    if (currentMemberData) {
        const loyaltyCount = currentMemberData.loyalty_count || 0;
        const loyaltyProgress = loyaltyCount % 5;
        
        if (loyaltyProgress === 0 && loyaltyCount >= 5) {
            isLoyaltyFree = true;
            finalPrice = 0;
        }
    }
    
    const transactionData = {
        transaction_id: currentTransactionId,
        customer_id: currentMemberData ? currentMemberData.id : null,
        license_plate: licensePlate,
        customer_name: customerName || 'Guest',
        customer_phone: customerPhone,
        motorcycle_type: motorcycleType,
        price: finalPrice,
        original_price: price,
        is_loyalty_free: isLoyaltyFree,
        operator_id: operatorId,
        payment_method: paymentMethod,
        notes: notes,
        status: 'completed'
    };
    
    try {
        showNotification('Memproses transaksi...', 'info');
        
        // Submit transaction
        const response = await apiClient.post('transactions', transactionData);
        
        if (response.success) {
            // Update loyalty count if member
            if (currentMemberData) {
                await updateMemberLoyalty(currentMemberData.id, isLoyaltyFree);
            }
            
            // Show success modal
            showSuccessModal();
            
            showNotification('Transaksi berhasil dicatat!', 'success');
        } else {
            throw new Error(response.message || 'Gagal memproses transaksi');
        }
        
    } catch (error) {
        console.error('Error submitting transaction:', error);
        showNotification('Gagal memproses transaksi: ' + error.message, 'error');
    }
}

async function updateMemberLoyalty(customerId, wasFreewash) {
    try {
        const response = await apiClient.get(`customers/${customerId}`);
        const member = response.data;
        
        let newLoyaltyCount = member.loyalty_count || 0;
        
        if (wasFreewash) {
            // Reset loyalty count after free wash
            newLoyaltyCount = 0;
        } else {
            // Increment loyalty count
            newLoyaltyCount++;
        }
        
        await apiClient.put(`customers/${customerId}`, {
            ...member,
            loyalty_count: newLoyaltyCount,
            total_washes: (member.total_washes || 0) + 1
        });
        
    } catch (error) {
        console.error('Error updating loyalty:', error);
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const successTrxId = document.getElementById('successTrxId');
    
    successTrxId.textContent = currentTransactionId;
    modal.classList.remove('hidden');
}

function closeModal() {
    window.location.href = 'dashboard.html';
}

function newTransaction() {
    window.location.href = 'register-wash.html';
}

function printReceipt() {
    window.print();
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
