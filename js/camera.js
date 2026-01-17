/**
 * Camera module for license plate scanning
 * Integrates with member database for auto-fill
 */

let cameraStream = null;
let isProcessing = false;
let apiClient = null;
let currentMemberData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API client
    apiClient = new APIClient();
    
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Initialize camera
    await initCamera();
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Upload button
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileUpload);
    }
}

async function initCamera() {
    const video = document.getElementById('cameraFeed');
    const placeholder = document.getElementById('placeholderCamera');
    
    try {
        updateCameraStatus('Mengakses kamera...');
        
        // Request camera access
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set video source
        video.srcObject = cameraStream;
        
        // Hide placeholder, show video
        placeholder.classList.add('hidden');
        video.classList.remove('hidden');
        
        updateCameraStatus('Kamera aktif');
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        updateCameraStatus('Kamera tidak tersedia');
        placeholder.querySelector('p').textContent = 'Kamera tidak tersedia. Gunakan upload gambar.';
    }
}

async function capturePlate() {
    if (isProcessing) {
        showNotification('Sedang memproses...', 'warning');
        return;
    }
    
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('cameraCanvas');
    
    if (!video.srcObject) {
        showNotification('Kamera belum aktif', 'error');
        return;
    }
    
    isProcessing = true;
    updateCameraStatus('Mengambil foto...');
    
    try {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Get image data
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Add to scan history
        addToScanHistory(imageDataUrl);
        
        // Simulate OCR (in production, use real OCR library or backend API)
        await processPlateImage(imageDataUrl);
        
        updateCameraStatus('Kamera aktif');
        
    } catch (error) {
        console.error('Error capturing plate:', error);
        showNotification('Gagal mengambil foto', 'error');
        updateCameraStatus('Error');
    } finally {
        isProcessing = false;
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('File harus berupa gambar', 'error');
        return;
    }
    
    isProcessing = true;
    updateCameraStatus('Memproses gambar...');
    
    try {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const imageDataUrl = e.target.result;
            
            // Add to scan history
            addToScanHistory(imageDataUrl);
            
            // Process plate
            await processPlateImage(imageDataUrl);
            
            updateCameraStatus('Gambar diproses');
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('Gagal memproses gambar', 'error');
        updateCameraStatus('Error');
    } finally {
        isProcessing = false;
        event.target.value = ''; // Reset input
    }
}

async function processPlateImage(imageDataUrl) {
    updateCameraStatus('Membaca plat nomor...');
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, show manual input prompt
    // In production, integrate with OCR API (e.g., Tesseract.js, Google Vision API)
    const plateNumber = prompt('Masukkan nomor plat yang terdeteksi:', 'B 1234 ABC');
    
    if (plateNumber) {
        displayPlateNumber(plateNumber.toUpperCase());
        await searchMemberByPlate(plateNumber);
    } else {
        updateCameraStatus('Scan dibatalkan');
    }
}

function displayPlateNumber(plateNumber) {
    const plateDisplay = document.getElementById('plateDisplay');
    const noPlate = document.getElementById('noPlate');
    const plateNumberElement = document.getElementById('plateNumber');
    
    plateNumberElement.textContent = plateNumber;
    plateDisplay.classList.remove('hidden');
    noPlate.classList.add('hidden');
}

async function searchMemberByPlate(plateNumber) {
    updateCameraStatus('Mencari data member...');
    
    try {
        // Search for member with matching license plate
        const response = await apiClient.get('customers');
        const members = response.data || [];
        
        // Find member by license plate (case insensitive, ignore spaces)
        const normalizedPlate = plateNumber.replace(/\s/g, '').toUpperCase();
        const member = members.find(m => 
            m.license_plate && m.license_plate.replace(/\s/g, '').toUpperCase() === normalizedPlate
        );
        
        if (member) {
            // Member found
            displayMemberInfo(member);
            currentMemberData = member;
            updateCameraStatus('Member ditemukan!');
            showNotification(`Member ditemukan: ${member.name}`, 'success');
        } else {
            // Member not found
            displayNewCustomer();
            currentMemberData = { license_plate: plateNumber };
            updateCameraStatus('Member tidak ditemukan');
            showNotification('Plat nomor tidak terdaftar', 'info');
        }
        
    } catch (error) {
        console.error('Error searching member:', error);
        showNotification('Gagal mencari data member', 'error');
        updateCameraStatus('Error pencarian');
    }
}

function displayMemberInfo(member) {
    const memberInfo = document.getElementById('memberInfo');
    const newCustomer = document.getElementById('newCustomer');
    
    // Hide new customer, show member info
    newCustomer.classList.add('hidden');
    memberInfo.classList.remove('hidden');
    
    // Fill member data
    document.getElementById('memberName').textContent = member.name || '-';
    document.getElementById('memberWhatsApp').textContent = member.whatsapp_number || '-';
    document.getElementById('memberBrand').textContent = member.motorcycle_brand || '-';
    
    // Motor type badge
    const motorTypeBadge = document.getElementById('memberMotorType');
    const motorTypeMap = {
        'motor_kecil': { text: 'Motor Kecil', color: 'bg-green-100 text-green-700' },
        'motor_sedang': { text: 'Motor Sedang', color: 'bg-blue-100 text-blue-700' },
        'motor_besar': { text: 'Motor Besar', color: 'bg-purple-100 text-purple-700' }
    };
    
    const typeInfo = motorTypeMap[member.motorcycle_type] || { text: member.motorcycle_type, color: 'bg-gray-100 text-gray-700' };
    motorTypeBadge.textContent = typeInfo.text;
    motorTypeBadge.className = `px-2 py-1 rounded text-xs font-semibold ${typeInfo.color}`;
    
    // Loyalty progress
    const loyaltyCount = member.loyalty_count || 0;
    const loyaltyGoal = 5;
    const loyaltyProgress = loyaltyCount % loyaltyGoal;
    let loyaltyHTML = '';
    
    for (let i = 0; i < loyaltyGoal; i++) {
        if (i < loyaltyProgress) {
            loyaltyHTML += '<span class="text-2xl">🟢</span>';
        } else {
            loyaltyHTML += '<span class="text-2xl">⚪</span>';
        }
    }
    
    if (loyaltyProgress === 0 && loyaltyCount >= loyaltyGoal) {
        loyaltyHTML += '<div class="text-green-600 font-semibold mt-2">🎁 Gratis cuci!</div>';
    } else {
        loyaltyHTML += `<div class="text-sm text-gray-600 mt-2">${loyaltyProgress}/${loyaltyGoal} cuci</div>`;
    }
    
    document.getElementById('memberLoyalty').innerHTML = loyaltyHTML;
}

function displayNewCustomer() {
    const memberInfo = document.getElementById('memberInfo');
    const newCustomer = document.getElementById('newCustomer');
    
    // Hide member info, show new customer
    memberInfo.classList.add('hidden');
    newCustomer.classList.remove('hidden');
}

function addToScanHistory(imageDataUrl) {
    const scanHistory = document.getElementById('scanHistory');
    
    // Remove empty state if present
    const emptyState = scanHistory.querySelector('.text-center');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create history item
    const historyItem = document.createElement('div');
    historyItem.className = 'flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition';
    historyItem.innerHTML = `
        <img src="${imageDataUrl}" alt="Plat" class="w-16 h-12 object-cover rounded">
        <div class="flex-1 text-sm">
            <div class="font-semibold text-gray-700">Scan ${new Date().toLocaleTimeString('id-ID')}</div>
            <div class="text-gray-500 text-xs">${new Date().toLocaleDateString('id-ID')}</div>
        </div>
        <button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700">
            <i class="fas fa-trash text-sm"></i>
        </button>
    `;
    
    // Add to top of history
    scanHistory.insertBefore(historyItem, scanHistory.firstChild);
    
    // Limit history to 5 items
    while (scanHistory.children.length > 5) {
        scanHistory.removeChild(scanHistory.lastChild);
    }
}

function editPlateNumber() {
    const plateNumberElement = document.getElementById('plateNumber');
    const currentPlate = plateNumberElement.textContent;
    
    const newPlate = prompt('Edit nomor plat:', currentPlate);
    
    if (newPlate && newPlate.trim()) {
        const formattedPlate = newPlate.trim().toUpperCase();
        plateNumberElement.textContent = formattedPlate;
        searchMemberByPlate(formattedPlate);
    }
}

function useExistingMember() {
    if (!currentMemberData) {
        showNotification('Data member tidak ditemukan', 'error');
        return;
    }
    
    // Redirect to transaction page with member data
    const params = new URLSearchParams({
        customer_id: currentMemberData.id,
        plate: currentMemberData.license_plate,
        name: currentMemberData.name,
        type: currentMemberData.motorcycle_type,
        loyalty: currentMemberData.loyalty_count || 0
    });
    
    window.location.href = `register-wash.html?${params.toString()}`;
}

function registerNewMember() {
    if (!currentMemberData || !currentMemberData.license_plate) {
        showNotification('Nomor plat belum tersedia', 'error');
        return;
    }
    
    // Redirect to customer registration with pre-filled plate
    const params = new URLSearchParams({
        plate: currentMemberData.license_plate,
        new: 'true'
    });
    
    window.location.href = `customers.html?${params.toString()}`;
}

function continueAsGuest() {
    if (!currentMemberData || !currentMemberData.license_plate) {
        showNotification('Nomor plat belum tersedia', 'error');
        return;
    }
    
    // Redirect to transaction page as guest
    const params = new URLSearchParams({
        plate: currentMemberData.license_plate,
        guest: 'true'
    });
    
    window.location.href = `register-wash.html?${params.toString()}`;
}

function showManualInputModal() {
    const modal = document.getElementById('manualInputModal');
    modal.classList.remove('hidden');
    document.getElementById('manualPlateInput').focus();
}

function closeManualInputModal() {
    const modal = document.getElementById('manualInputModal');
    modal.classList.add('hidden');
    document.getElementById('manualPlateInput').value = '';
}

async function confirmManualInput() {
    const plateInput = document.getElementById('manualPlateInput');
    const plateNumber = plateInput.value.trim().toUpperCase();
    
    if (!plateNumber) {
        showNotification('Masukkan nomor plat', 'error');
        return;
    }
    
    // Validate format (basic Indonesian license plate)
    const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/;
    if (!plateRegex.test(plateNumber)) {
        showNotification('Format plat tidak valid. Contoh: B 1234 ABC', 'error');
        return;
    }
    
    closeManualInputModal();
    displayPlateNumber(plateNumber);
    await searchMemberByPlate(plateNumber);
}

function updateCameraStatus(status) {
    const statusElement = document.getElementById('cameraStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

function showNotification(message, type = 'info') {
    // Use utils.js notification if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
});
