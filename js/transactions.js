/**
 * Transaction processing module for MotoWash POS
 */

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('transactionId')) {
        initTransactionForm();
    }
});

let currentStep = 1;
let transactionData = {
    id: generateTransactionId(),
    customer: null,
    vehicle: null,
    services: [],
    total: 0,
    commission: 0,
    operator: null,
    paymentMethod: 'cash',
    status: 'pending',
    notes: '',
    createdAt: new Date().toISOString()
};

function initTransactionForm() {
    // Generate transaction ID
    updateTransactionId();
    
    // Initialize steps
    initStepNavigation();
    
    // Load motorcycle types and wash options
    loadMotorcycleTypes();
    
    // Load operators
    loadOperators();
    
    // Initialize form handlers
    initFormHandlers();
    
    // Check for URL parameters (e.g., from camera scan)
    checkUrlParameters();
}

function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TRX-${timestamp.toString(36).toUpperCase()}-${random.toString().padStart(3, '0')}`;
}

function updateTransactionId() {
    const idElement = document.getElementById('transactionId');
    if (idElement) {
        idElement.textContent = transactionData.id;
    }
}

function initStepNavigation() {
    // Step 1 next button
    document.getElementById('nextStep1')?.addEventListener('click', () => goToStep(2));
    
    // Step 2 navigation
    document.getElementById('prevStep2')?.addEventListener('click', () => goToStep(1));
    document.getElementById('nextStep2')?.addEventListener('click', () => goToStep(3));
    
    // Step 3 navigation
    document.getElementById('prevStep3')?.addEventListener('click', () => goToStep(2));
    document.getElementById('confirmTransaction')?.addEventListener('click', confirmTransaction);
    
    // Step 4 actions
    document.getElementById('newTransaction')?.addEventListener('click', startNewTransaction);
    document.getElementById('goToDashboard')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    document.getElementById('printReceipt')?.addEventListener('click', printReceipt);
    document.getElementById('resendWhatsApp')?.addEventListener('click', resendWhatsApp);
    
    // Camera button
    document.getElementById('useCamera')?.addEventListener('click', () => {
        window.location.href = 'camera-capture.html';
    });
}

function goToStep(step) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active');
        if (index + 1 <= step) {
            el.classList.add('active');
        }
    });
    
    // Update current step
    currentStep = step;
    
    // Load data for the step if needed
    if (step === 2) {
        updatePriceSummary();
    } else if (step === 3) {
        updateConfirmation();
    } else if (step === 4) {
        completeTransaction();
    }
}

function validateStep(step) {
    switch(step) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const licensePlate = document.getElementById('licensePlate')?.value.trim();
    const motorcycleType = document.getElementById('motorcycleType')?.value;
    
    if (!licensePlate) {
        showNotification('Masukkan plat nomor', 'error');
        return false;
    }
    
    if (!validateLicensePlate(licensePlate)) {
        showNotification('Format plat nomor tidak valid', 'error');
        return false;
    }
    
    if (!motorcycleType) {
        showNotification('Pilih jenis motor', 'error');
        return false;
    }
    
    // Save step 1 data
    transactionData.vehicle = {
        licensePlate: licensePlate.toUpperCase(),
        type: motorcycleType
    };
    
    // Check if using existing customer
    const existingCustomerInfo = document.getElementById('existingCustomerInfo');
    if (existingCustomerInfo && existingCustomerInfo.style.display !== 'none') {
        // Using existing customer
        transactionData.customer = {
            name: document.getElementById('existingName')?.textContent || '',
            phone: document.getElementById('existingPhone')?.textContent || '',
            isMember: document.getElementById('existingMember')?.textContent === 'Ya',
            washCount: parseInt(document.getElementById('existingWashCount')?.textContent || '0')
        };
    } else {
        // New customer
        const customerName = document.getElementById('customerName')?.value.trim();
        const customerPhone = document.getElementById('customerPhone')?.value.trim();
        const isMember = document.getElementById('registerMember')?.checked;
        
        if (!customerName) {
            showNotification('Masukkan nama pelanggan', 'error');
            return false;
        }
        
        if (customerPhone && !validatePhoneNumber(customerPhone)) {
            showNotification('Format nomor handphone tidak valid', 'error');
            return false;
        }
        
        transactionData.customer = {
            name: customerName,
            phone: customerPhone,
            isMember: isMember,
            washCount: 0
        };
    }
    
    return true;
}

function validateStep2() {
    const selectedWash = document.querySelector('input[name="washType"]:checked');
    
    if (!selectedWash) {
        showNotification('Pilih jenis cuci', 'error');
        return false;
    }
    
    // Save step 2 data
    transactionData.services = [
        {
            type: 'wash',
            name: selectedWash.value,
            price: parseInt(selectedWash.dataset.price || '0')
        }
    ];
    
    // Add additional services
    const additionalServices = document.querySelectorAll('.service-checkbox input:checked');
    additionalServices.forEach(service => {
        transactionData.services.push({
            type: 'additional',
            name: service.value,
            price: parseInt(service.dataset.price || '0')
        });
    });
    
    // Calculate totals
    calculateTotals();
    
    return true;
}

function validateStep3() {
    const operator = document.getElementById('operatorSelect')?.value;
    
    if (!operator) {
        showNotification('Pilih operator', 'error');
        return false;
    }
    
    // Save step 3 data
    transactionData.operator = operator;
    transactionData.paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';
    transactionData.notes = document.getElementById('transactionNotes')?.value || '';
    
    return true;
}

function loadMotorcycleTypes() {
    // In production, this would be an API call
    // For demo, use static data
    
    const motorcycleTypes = {
        'matic': [
            { id: 'regular', name: 'Cuci Regular', price: 25000, duration: '30 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 35000, duration: '45 menit' },
            { id: 'detail', name: 'Cuci Detail', price: 50000, duration: '60 menit' }
        ],
        'sport': [
            { id: 'regular', name: 'Cuci Regular', price: 30000, duration: '35 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 40000, duration: '50 menit' }
        ],
        'bigbike': [
            { id: 'regular', name: 'Cuci Regular', price: 50000, duration: '45 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 75000, duration: '60 menit' }
        ]
    };
    
    // Add change listener to motorcycle type select
    const motorcycleTypeSelect = document.getElementById('motorcycleType');
    if (motorcycleTypeSelect) {
        motorcycleTypeSelect.addEventListener('change', function() {
            updateWashTypes(this.value);
        });
    }
    
    // Initial update
    updateWashTypes(motorcycleTypeSelect?.value || 'matic');
}

function updateWashTypes(type) {
    const washTypesContainer = document.getElementById('washTypesContainer');
    if (!washTypesContainer) return;
    
    // Define wash types based on motorcycle type
    const washTypes = {
        'matic': [
            { id: 'regular', name: 'Cuci Regular', price: 25000, duration: '30 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 35000, duration: '45 menit' },
            { id: 'detail', name: 'Cuci Detail', price: 50000, duration: '60 menit' }
        ],
        'sport': [
            { id: 'regular', name: 'Cuci Regular', price: 30000, duration: '35 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 40000, duration: '50 menit' }
        ],
        'bigbike': [
            { id: 'regular', name: 'Cuci Regular', price: 50000, duration: '45 menit' },
            { id: 'premium', name: 'Cuci Premium', price: 75000, duration: '60 menit' }
        ]
    }[type] || [];
    
    // Clear container
    washTypesContainer.innerHTML = '';
    
    // Add wash type options
    washTypes.forEach(wash => {
        const label = document.createElement('label');
        label.className = 'wash-type-option';
        label.innerHTML = `
            <input type="radio" name="washType" value="${wash.id}" 
                   data-price="${wash.price}" data-duration="${wash.duration}">
            <div class="wash-type-card">
                <div class="wash-type-icon">
                    <i class="fas fa-spray-can"></i>
                </div>
                <div class="wash-type-info">
                    <h4>${wash.name}</h4>
                    <p class="wash-price">${formatCurrency(wash.price)}</p>
                    <p class="wash-duration">${wash.duration}</p>
                </div>
                <div class="wash-type-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `;
        
        // Add change listener to update price summary
        const input = label.querySelector('input');
        input.addEventListener('change', updatePriceSummary);
        
        washTypesContainer.appendChild(label);
    });
    
    // Add additional services prices
    document.querySelectorAll('.service-checkbox input').forEach(input => {
        const service = input.value;
        const price = {
            'wax': 25000,
            'vacuum': 15000,
            'engine': 30000
        }[service] || 0;
        
        input.dataset.price = price;
        input.nextElementSibling.querySelector('p').textContent = formatCurrency(price);
    });
    
    // Add change listeners to additional services
    document.querySelectorAll('.service-checkbox input').forEach(input => {
        input.addEventListener('change', updatePriceSummary);
    });
}

function calculateTotals() {
    // Calculate base price
    let subtotal = 0;
    transactionData.services.forEach(service => {
        subtotal += service.price;
    });
    
    // Check for free wash
    let discount = 0;
    if (transactionData.customer && isFreeWash(transactionData.customer.washCount + 1)) {
        // Find wash service
        const washService = transactionData.services.find(s => s.type === 'wash');
        if (washService) {
            discount = washService.price;
            transactionData.isFreeWash = true;
        }
    }
    
    // Calculate total
    const total = subtotal - discount;
    
    // Calculate commission (30% of total, or full price for free wash)
    const commissionBase = transactionData.isFreeWash ? subtotal : total;
    const commission = calculateCommission(commissionBase);
    
    // Update transaction data
    transactionData.subtotal = subtotal;
    transactionData.discount = discount;
    transactionData.total = total;
    transactionData.commission = commission;
    
    return { subtotal, discount, total, commission };
}

function updatePriceSummary() {
    // Get selected wash type
    const selectedWash = document.querySelector('input[name="washType"]:checked');
    if (!selectedWash) return;
    
    const washPrice = parseInt(selectedWash.dataset.price || '0');
    
    // Calculate additional services
    let servicesPrice = 0;
    const servicesList = [];
    
    document.querySelectorAll('.service-checkbox input:checked').forEach(service => {
        const price = parseInt(service.dataset.price || '0');
        servicesPrice += price;
        
        // Get service name
        const serviceName = service.parentElement.querySelector('h4')?.textContent || service.value;
        servicesList.push(serviceName);
    });
    
    // Calculate subtotal
    const subtotal = washPrice + servicesPrice;
    
    // Check for free wash
    let discount = 0;
    const freeWashInfo = document.getElementById('freeWashInfo');
    
    if (transactionData.customer && isFreeWash(transactionData.customer.washCount + 1)) {
        discount = washPrice;
        if (freeWashInfo) {
            freeWashInfo.style.display = 'block';
        }
    } else {
        if (freeWashInfo) {
            freeWashInfo.style.display = 'none';
        }
    }
    
    // Calculate total and commission
    const total = subtotal - discount;
    const commissionBase = discount > 0 ? subtotal : total;
    const commission = calculateCommission(commissionBase);
    
    // Update UI
    document.getElementById('washTypePrice').textContent = formatCurrency(washPrice);
    
    const servicesSummary = document.getElementById('servicesSummary');
    if (servicesSummary) {
        if (servicesPrice > 0) {
            servicesSummary.innerHTML = `
                <span>Layanan Tambahan:</span>
                <span>${formatCurrency(servicesPrice)}</span>
            `;
            servicesSummary.style.display = 'flex';
        } else {
            servicesSummary.style.display = 'none';
        }
    }
    
    // Update discount display
    const discountElement = document.querySelector('.member-discount');
    if (discountElement) {
        if (discount > 0) {
            document.getElementById('discountAmount').textContent = formatCurrency(discount);
            discountElement.style.display = 'flex';
        } else {
            discountElement.style.display = 'none';
        }
    }
    
    document.getElementById('totalPrice').textContent = formatCurrency(total);
    document.getElementById('commissionAmount').textContent = formatCurrency(commission);
}

function loadOperators() {
    // In production, this would be an API call
    // For demo, use static data
    
    const operators = [
        { id: 'OPR001', name: 'Budi Santoso' },
        { id: 'OPR002', name: 'Siti Rahma' },
        { id: 'OPR003', name: 'Andi Wijaya' }
    ];
    
    const operatorSelect = document.getElementById('operatorSelect');
    if (operatorSelect) {
        operatorSelect.innerHTML = '<option value="">Pilih Operator</option>';
        
        operators.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator.id;
            option.textContent = operator.name;
            operatorSelect.appendChild(option);
        });
    }
}

function updateConfirmation() {
    // Update confirmation display with transaction data
    if (!transactionData.vehicle || !transactionData.customer) return;
    
    // Vehicle info
    document.getElementById('confirmLicensePlate').textContent = transactionData.vehicle.licensePlate;
    document.getElementById('confirmMotorcycleType').textContent = 
        getMotorcycleTypeName(transactionData.vehicle.type);
    
    // Customer info
    document.getElementById('confirmCustomerName').textContent = transactionData.customer.name;
    document.getElementById('confirmCustomerPhone').textContent = transactionData.customer.phone || '-';
    document.getElementById('confirmMemberStatus').textContent = 
        transactionData.customer.isMember ? 'Member' : 'Non-Member';
    
    // Services info
    const washService = transactionData.services.find(s => s.type === 'wash');
    if (washService) {
        document.getElementById('confirmWashType').textContent = washService.name;
    }
    
    const additionalServices = transactionData.services.filter(s => s.type === 'additional');
    if (additionalServices.length > 0) {
        document.getElementById('confirmServices').textContent = 
            additionalServices.map(s => s.name).join(', ');
    } else {
        document.getElementById('confirmServices').textContent = 'Tidak ada';
    }
    
    // Payment info
    const totals = calculateTotals();
    document.getElementById('confirmTotalPrice').textContent = formatCurrency(totals.total);
    document.getElementById('confirmCommission').textContent = formatCurrency(totals.commission);
    
    // Wash status
    const washStatusElement = document.getElementById('confirmWashStatus');
    if (washStatusElement) {
        washStatusElement.textContent = 'Belum';
        washStatusElement.className = 'badge badge-info';
    }
}

function getMotorcycleTypeName(type) {
    const types = {
        'matic': 'Matic',
        'sport': 'Sport/Bebek',
        'bigbike': 'Big Bike (>250cc)'
    };
    
    return types[type] || type;
}

function initFormHandlers() {
    // Customer search
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('input', debounce(searchCustomers, 300));
    }
    
    // Use new customer button
    document.getElementById('useNewCustomer')?.addEventListener('click', function() {
        const existingCustomerInfo = document.getElementById('existingCustomerInfo');
        const newCustomerForm = document.getElementById('newCustomerForm');
        
        if (existingCustomerInfo) existingCustomerInfo.style.display = 'none';
        if (newCustomerForm) newCustomerForm.style.display = 'block';
        
        // Clear customer data
        transactionData.customer = null;
    });
}

function searchCustomers(query) {
    const searchTerm = query.target.value.toLowerCase().trim();
    if (searchTerm.length < 2) {
        clearCustomerResults();
        return;
    }
    
    // In production, this would be an API call
    // For demo, use mock data
    
    const mockCustomers = [
        { id: 'CUST001', name: 'Andi Wijaya', phone: '081234567892', plate: 'B 1234 ABC', washCount: 3, isMember: true },
        { id: 'CUST002', name: 'Siti Rahma', phone: '081234567893', plate: 'B 5678 XYZ', washCount: 1, isMember: false },
        { id: 'CUST003', name: 'Budi Santoso', phone: '081234567894', plate: 'B 9012 DEF', washCount: 5, isMember: true },
        { id: 'CUST004', name: 'Dewi Lestari', phone: '081234567895', plate: 'B 3456 GHI', washCount: 2, isMember: true }
    ];
    
    const results = mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        customer.plate.toLowerCase().includes(searchTerm)
    );
    
    displayCustomerResults(results);
}

function displayCustomerResults(customers) {
    const resultsContainer = document.getElementById('customerResults');
    if (!resultsContainer) return;
    
    clearCustomerResults();
    
    if (customers.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-empty">Tidak ditemukan</div>';
        return;
    }
    
    customers.forEach(customer => {
        const result = document.createElement('div');
        result.className = 'search-result';
        result.innerHTML = `
            <div class="result-info">
                <h4>${customer.name}</h4>
                <p>${customer.phone} • ${customer.plate}</p>
                <small>Cuci ke-${customer.washCount} • ${customer.isMember ? 'Member' : 'Non-Member'}</small>
            </div>
            <button class="result-select" data-customer='${JSON.stringify(customer)}'>
                Pilih
            </button>
        `;
        
        // Add select handler
        const selectBtn = result.querySelector('.result-select');
        selectBtn.addEventListener('click', function() {
            selectCustomer(JSON.parse(this.dataset.customer));
        });
        
        resultsContainer.appendChild(result);
    });
}

function clearCustomerResults() {
    const resultsContainer = document.getElementById('customerResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
}

function selectCustomer(customer) {
    // Update customer info display
    document.getElementById('existingName').textContent = customer.name;
    document.getElementById('existingPhone').textContent = customer.phone;
    document.getElementById('existingMember').textContent = customer.isMember ? 'Ya' : 'Tidak';
    document.getElementById('existingWashCount').textContent = customer.washCount;
    
    // Update license plate
    document.getElementById('licensePlate').value = customer.plate;
    
    // Show existing customer info, hide new customer form
    const existingCustomerInfo = document.getElementById('existingCustomerInfo');
    const newCustomerForm = document.getElementById('newCustomerForm');
    
    if (existingCustomerInfo) existingCustomerInfo.style.display = 'block';
    if (newCustomerForm) newCustomerForm.style.display = 'none';
    
    // Clear search results
    clearCustomerResults();
    
    // Update customer in transaction data
    transactionData.customer = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        isMember: customer.isMember,
        washCount: customer.washCount
    };
    
    showNotification(`Menggunakan data pelanggan: ${customer.name}`, 'success');
}

async function confirmTransaction() {
    if (!validateStep(3)) return;
    
    // Show loading
    const confirmBtn = document.getElementById('confirmTransaction');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    confirmBtn.disabled = true;
    
    try {
        // In production, this would be an API call to save transaction
        // For demo, simulate API delay
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Save transaction to localStorage (for demo)
        saveTransaction();
        
        // Send WhatsApp notification if customer has phone
        if (transactionData.customer.phone) {
            await sendWhatsAppNotification();
        }
        
        // Go to completion step
        goToStep(4);
        
    } catch (error) {
        console.error('Error confirming transaction:', error);
        showNotification('Gagal menyimpan transaksi', 'error');
    } finally {
        // Restore button
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

function saveTransaction() {
    // In production, this would save to database via API
    // For demo, save to localStorage
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    const transactionToSave = {
        ...transactionData,
        id: transactionData.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
        operatorName: document.getElementById('operatorSelect')?.selectedOptions[0]?.text || 'Unknown'
    };
    
    transactions.push(transactionToSave);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update customer wash count if exists
    if (transactionData.customer && transactionData.customer.id) {
        updateCustomerWashCount(transactionData.customer.id);
    }
    
    showNotification('Transaksi berhasil disimpan', 'success');
}

function updateCustomerWashCount(customerId) {
    // In production, this would be an API call
    // For demo, update localStorage
    
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex !== -1) {
        customers[customerIndex].washCount += 1;
        customers[customerIndex].lastWash = new Date().toISOString();
        
        // Check for free wash
        if (isFreeWash(customers[customerIndex].washCount + 1)) {
            customers[customerIndex].freeWashAvailable = true;
        }
        
        localStorage.setItem('customers', JSON.stringify(customers));
    }
}

async function sendWhatsAppNotification() {
    // In production, this would use WhatsApp Business API
    // For demo, simulate API call
    
    try {
        const message = generateWhatsAppMessage();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show notification in UI
        const whatsappMessage = document.getElementById('whatsappMessage');
        if (whatsappMessage) {
            whatsappMessage.textContent = message;
        }
        
        console.log('WhatsApp message would be sent:', message);
        
        showNotification('Notifikasi WhatsApp terkirim', 'success');
        
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        showNotification('Gagal mengirim notifikasi WhatsApp', 'warning');
    }
}

function generateWhatsAppMessage() {
    const customer = transactionData.customer;
    const vehicle = transactionData.vehicle;
    const totals = calculateTotals();
    
    const nextWash = customer.washCount + 1;
    const isFree = isFreeWash(nextWash);
    
    let message = `Halo ${customer.name}!\n\n`;
    message += `Terima kasih telah menggunakan layanan MotoWash.\n\n`;
    message += `📋 *Rincian Transaksi:*\n`;
    message += `ID: ${transactionData.id}\n`;
    message += `Plat: ${vehicle.licensePlate}\n`;
    message += `Jenis: ${getMotorcycleTypeName(vehicle.type)}\n`;
    
    transactionData.services.forEach(service => {
        message += `• ${service.name}: ${formatCurrency(service.price)}\n`;
    });
    
    if (transactionData.discount > 0) {
        message += `• Diskon: -${formatCurrency(transactionData.discount)}\n`;
    }
    
    message += `\n💰 *Total: ${formatCurrency(totals.total)}*\n\n`;
    
    if (customer.isMember) {
        message += `🎯 *Status Member:*\n`;
        message += `Cuci ke-${nextWash}\n`;
        
        if (isFree) {
            message += `🎉 *SELAMAT!* Cuci berikutnya GRATIS!\n\n`;
        } else {
            const remaining = 5 - (nextWash % 5);
            message += `Sisa ${remaining} cuci lagi untuk dapat GRATIS!\n\n`;
        }
    }
    
    message += `Terima kasih & sampai jumpa lagi! 🏍️💨\n`;
    message += `*MotoWash - Cuci Motor Professional*`;
    
    return message;
}

function completeTransaction() {
    // Update receipt information
    document.getElementById('receiptId').textContent = transactionData.id;
    document.getElementById('receiptDate').textContent = formatDate(transactionData.createdAt);
    document.getElementById('receiptPlate').textContent = transactionData.vehicle.licensePlate;
    document.getElementById('receiptCustomer').textContent = transactionData.customer.name;
    
    const washService = transactionData.services.find(s => s.type === 'wash');
    document.getElementById('receiptService').textContent = washService?.name || '-';
    
    document.getElementById('receiptTotal').textContent = formatCurrency(transactionData.total);
    
    // Update WhatsApp message preview
    const whatsappMessage = document.getElementById('whatsappMessage');
    if (whatsappMessage) {
        whatsappMessage.textContent = generateWhatsAppMessage();
    }
}

function startNewTransaction() {
    // Reset form
    currentStep = 1;
    transactionData = {
        id: generateTransactionId(),
        customer: null,
        vehicle: null,
        services: [],
        total: 0,
        commission: 0,
        operator: null,
        paymentMethod: 'cash',
        status: 'pending',
        notes: '',
        createdAt: new Date().toISOString()
    };
    
    // Reset UI
    updateTransactionId();
    
    // Clear form fields
    document.getElementById('licensePlate').value = '';
    document.getElementById('motorcycleType').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('registerMember').checked = false;
    
    // Hide existing customer info
    const existingCustomerInfo = document.getElementById('existingCustomerInfo');
    if (existingCustomerInfo) {
        existingCustomerInfo.style.display = 'none';
    }
    
    // Show new customer form
    const newCustomerForm = document.getElementById('newCustomerForm');
    if (newCustomerForm) {
        newCustomerForm.style.display = 'block';
    }
    
    // Clear search results
    clearCustomerResults();
    
    // Go back to step 1
    goToStep(1);
}

function printReceipt() {
    // In production, this would generate a proper receipt
    // For demo, use browser print
    
    const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk MotoWash</title>
            <style>
                body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-header h1 { margin: 0; font-size: 24px; }
                .receipt-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .receipt-divider { border-top: 1px dashed #000; margin: 10px 0; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .thank-you { margin-top: 20px; text-align: center; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1>MotoWash</h1>
                <p>Cuci Motor Professional</p>
                <p>${formatDate(new Date())}</p>
            </div>
            
            <div class="receipt-item">
                <span>ID:</span>
                <span>${transactionData.id}</span>
            </div>
            
            <div class="receipt-item">
                <span>Waktu:</span>
                <span>${formatTime(transactionData.createdAt)}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-item">
                <span>Plat:</span>
                <span>${transactionData.vehicle.licensePlate}</span>
            </div>
            
            <div class="receipt-item">
                <span>Pelanggan:</span>
                <span>${transactionData.customer.name}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            ${transactionData.services.map(service => `
                <div class="receipt-item">
                    <span>${service.name}:</span>
                    <span>${formatCurrency(service.price)}</span>
                </div>
            `).join('')}
            
            ${transactionData.discount > 0 ? `
                <div class="receipt-item">
                    <span>Diskon Member:</span>
                    <span>-${formatCurrency(transactionData.discount)}</span>
                </div>
            ` : ''}
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-item">
                <strong>Total:</strong>
                <strong>${formatCurrency(transactionData.total)}</strong>
            </div>
            
            <div class="receipt-item">
                <span>Bayar:</span>
                <span>${formatCurrency(transactionData.total)}</span>
            </div>
            
            <div class="receipt-item">
                <span>Kembali:</span>
                <span>${formatCurrency(0)}</span>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="thank-you">
                <p>Terima kasih telah berkunjung!</p>
                <p>www.motowash.id</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
}

function resendWhatsApp() {
    showNotification('Mengirim ulang notifikasi WhatsApp...', 'info');
    sendWhatsAppNotification();
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const plate = urlParams.get('plate');
    const isNew = urlParams.get('new') === 'true';
    
    if (plate) {
        // Set license plate from URL (e.g., from camera scan)
        document.getElementById('licensePlate').value = plate;
        
        if (!isNew) {
            // Simulate search for this plate
            setTimeout(() => {
                searchCustomers({ target: { value: plate } });
            }, 500);
        }
    }
}

// Helper functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateLicensePlate(plate) {
    const regex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    return regex.test(plate);
}

function validatePhoneNumber(phone) {
    const regex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    return regex.test(phone);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateCommission(amount, rate = 30) {
    return Math.round((amount * rate) / 100);
}

function isFreeWash(washCount) {
    return washCount > 0 && washCount % 5 === 0;
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTransactionForm,
        validateStep1,
        validateStep2,
        validateStep3,
        calculateTotals,
        generateWhatsAppMessage,
        formatCurrency,
        validateLicensePlate
    };
}