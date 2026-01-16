/**
 * Camera and OCR module for license plate scanning
 */

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cameraPreview')) {
        initCamera();
    }
});

let cameraStream = null;
let currentCamera = 'environment';
let isScanning = false;
let tesseractWorker = null;

async function initCamera() {
    try {
        // Initialize camera
        await startCamera();
        
        // Initialize Tesseract.js for OCR
        await initOCR();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update camera status
        updateCameraStatus('Kamera siap digunakan');
        
    } catch (error) {
        console.error('Error initializing camera:', error);
        updateCameraStatus('Gagal mengakses kamera');
        showNotification('Tidak dapat mengakses kamera. Pastikan izin diberikan.', 'error');
    }
}

async function startCamera() {
    try {
        // Stop existing stream if any
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Get camera constraints
        const constraints = {
            video: {
                facingMode: currentCamera,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        // Get camera stream
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Display stream in video element
        const videoElement = document.getElementById('cameraFeed');
        if (videoElement) {
            videoElement.srcObject = cameraStream;
            videoElement.play();
        }
        
        // Show video element, hide placeholder
        const placeholder = document.querySelector('.camera-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Start auto-capture if enabled
        if (document.getElementById('autoCapture')?.checked) {
            startAutoCapture();
        }
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        throw error;
    }
}

async function initOCR() {
    try {
        // Load Tesseract.js worker
        if (!tesseractWorker) {
            const Tesseract = window.Tesseract;
            if (!Tesseract) {
                console.error('Tesseract.js not loaded');
                return;
            }
            
            // Create worker with Indonesian language
            tesseractWorker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => console.log('OCR:', m),
                errorHandler: (err) => console.error('OCR Error:', err)
            });
            
            // Configure for license plates (alphanumeric)
            await tesseractWorker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
                preserve_interword_spaces: '1'
            });
        }
    } catch (error) {
        console.error('Error initializing OCR:', error);
        showNotification('Gagal memuat OCR engine', 'error');
    }
}

function setupEventListeners() {
    // Capture button
    document.getElementById('captureButton')?.addEventListener('click', capturePlate);
    
    // Switch camera button
    document.getElementById('switchCamera')?.addEventListener('click', switchCamera);
    
    // Upload image button
    document.getElementById('uploadButton')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // File input change
    document.getElementById('fileInput')?.addEventListener('change', handleFileUpload);
    
    // Auto-capture toggle
    document.getElementById('autoCapture')?.addEventListener('change', function() {
        if (this.checked) {
            startAutoCapture();
        } else {
            stopAutoCapture();
        }
    });
    
    // Edit OCR result
    document.getElementById('editOCR')?.addEventListener('click', editOCRResult);
    
    // Use customer data
    document.getElementById('useCustomerData')?.addEventListener('click', useCustomerData);
    
    // New customer data
    document.getElementById('newCustomerData')?.addEventListener('click', newCustomerData);
    
    // Quick actions
    document.getElementById('quickRegister')?.addEventListener('click', quickRegister);
    document.getElementById('checkHistory')?.addEventListener('click', checkHistory);
    document.getElementById('savePlateImage')?.addEventListener('click', savePlateImage);
    
    // Manual plate input
    document.getElementById('confirmManualPlate')?.addEventListener('click', confirmManualPlate);
    
    // Camera settings changes
    document.getElementById('cameraQuality')?.addEventListener('change', updateCameraQuality);
    document.getElementById('autoDelay')?.addEventListener('change', updateAutoDelay);
}

async function capturePlate() {
    if (!cameraStream) {
        showNotification('Kamera belum siap', 'error');
        return;
    }
    
    if (isScanning) {
        showNotification('Sedang memproses scan sebelumnya', 'warning');
        return;
    }
    
    isScanning = true;
    updateCameraStatus('Memproses gambar...');
    
    try {
        // Get video element
        const video = document.getElementById('cameraFeed');
        const canvas = document.getElementById('cameraCanvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get plate area (center of image)
        const plateRect = getPlateRect(canvas);
        
        // Crop to plate area
        const plateCanvas = document.createElement('canvas');
        const plateContext = plateCanvas.getContext('2d');
        plateCanvas.width = plateRect.width;
        plateCanvas.height = plateRect.height;
        
        plateContext.drawImage(
            canvas,
            plateRect.x, plateRect.y, plateRect.width, plateRect.height,
            0, 0, plateRect.width, plateRect.height
        );
        
        // Process OCR on cropped image
        await processOCR(plateCanvas);
        
        // Add to scanned plates list
        addToScannedPlates(plateCanvas.toDataURL('image/jpeg', 0.8));
        
    } catch (error) {
        console.error('Error capturing plate:', error);
        showNotification('Gagal mengambil gambar', 'error');
    } finally {
        isScanning = false;
        updateCameraStatus('Kamera siap');
    }
}

function getPlateRect(canvas) {
    // Calculate plate area (center 60% of image)
    const width = canvas.width;
    const height = canvas.height;
    
    const plateWidth = width * 0.6;
    const plateHeight = height * 0.4;
    
    return {
        x: (width - plateWidth) / 2,
        y: (height - plateHeight) / 2,
        width: plateWidth,
        height: plateHeight
    };
}

async function processOCR(imageCanvas) {
    if (!tesseractWorker) {
        await initOCR();
        if (!tesseractWorker) {
            throw new Error('OCR not initialized');
        }
    }
    
    try {
        updateCameraStatus('Membaca plat nomor...');
        
        // Convert canvas to image data
        const imageData = imageCanvas.toDataURL('image/jpeg', 0.8);
        
        // Process with Tesseract
        const { data: { text, confidence } } = await tesseractWorker.recognize(imageData);
        
        // Clean and validate text
        const cleanedText = cleanOCRText(text);
        
        // Display results
        displayOCRResult(cleanedText, confidence);
        
        // Check if customer exists
        await checkCustomerExists(cleanedText);
        
        updateCameraStatus('OCR selesai');
        
        return { text: cleanedText, confidence };
        
    } catch (error) {
        console.error('OCR processing error:', error);
        throw error;
    }
}

function cleanOCRText(text) {
    // Remove unwanted characters and spaces
    let cleaned = text
        .replace(/[^A-Z0-9]/gi, ' ') // Keep only alphanumeric and spaces
        .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
        .trim()
        .toUpperCase();
    
    // Format as Indonesian plate (e.g., "B 1234 ABC")
    const parts = cleaned.split(' ');
    if (parts.length >= 2) {
        const letters = parts.filter(p => /[A-Z]/.test(p));
        const numbers = parts.filter(p => /[0-9]/.test(p));
        
        if (letters.length > 0 && numbers.length > 0) {
            return `${letters[0]} ${numbers[0]} ${letters.slice(1).join('')}`;
        }
    }
    
    return cleaned;
}

function displayOCRResult(text, confidence) {
    const ocrTextElement = document.getElementById('ocrText');
    const confidenceValueElement = document.getElementById('confidenceValue');
    const confidenceFillElement = document.getElementById('confidenceFill');
    
    if (ocrTextElement) {
        ocrTextElement.textContent = text || 'Tidak dapat membaca plat';
        ocrTextElement.style.color = text ? '#fff' : '#f72585';
    }
    
    if (confidenceValueElement) {
        const confidencePercent = Math.round(confidence);
        confidenceValueElement.textContent = `${confidencePercent}%`;
        
        if (confidenceFillElement) {
            confidenceFillElement.style.width = `${confidencePercent}%`;
            confidenceFillElement.style.backgroundColor = 
                confidencePercent > 80 ? '#4cc9f0' : 
                confidencePercent > 60 ? '#f8961e' : '#f72585';
        }
    }
}

async function checkCustomerExists(plateNumber) {
    try {
        // In production, this would be an API call
        // For demo, use mock data
        const mockCustomers = [
            {
                id: 'CUST001',
                name: 'Andi Wijaya',
                plate: 'B 1234 ABC',
                motorcycle: 'Honda Beat',
                washCount: 3,
                isMember: true
            },
            {
                id: 'CUST002',
                name: 'Siti Rahma',
                plate: 'B 5678 XYZ',
                motorcycle: 'Yamaha NMAX',
                washCount: 1,
                isMember: false
            }
        ];
        
        const customer = mockCustomers.find(c => 
            c.plate.replace(/\s/g, '') === plateNumber.replace(/\s/g, '')
        );
        
        if (customer) {
            displayCustomerMatch(customer);
        } else {
            hideCustomerMatch();
        }
        
    } catch (error) {
        console.error('Error checking customer:', error);
    }
}

function displayCustomerMatch(customer) {
    const matchElement = document.getElementById('customerMatch');
    const matchName = document.getElementById('matchName');
    const matchPlate = document.getElementById('matchPlate');
    const matchMotorcycle = document.getElementById('matchMotorcycle');
    const matchWashCount = document.getElementById('matchWashCount');
    
    if (matchElement && matchName && matchPlate && matchMotorcycle && matchWashCount) {
        matchName.textContent = customer.name;
        matchPlate.textContent = customer.plate;
        matchMotorcycle.textContent = customer.motorcycle;
        matchWashCount.textContent = customer.washCount;
        
        matchElement.style.display = 'block';
    }
}

function hideCustomerMatch() {
    const matchElement = document.getElementById('customerMatch');
    if (matchElement) {
        matchElement.style.display = 'none';
    }
}

function addToScannedPlates(imageDataUrl) {
    const scannedPlatesElement = document.getElementById('scannedPlates');
    
    if (!scannedPlatesElement) return;
    
    // Remove empty state if exists
    const emptyState = scannedPlatesElement.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create new plate element
    const plateElement = document.createElement('div');
    plateElement.className = 'scanned-plate';
    plateElement.innerHTML = `
        <div class="plate-image">
            <img src="${imageDataUrl}" alt="Plat Nomor">
        </div>
        <div class="plate-info">
            <div class="plate-number">${document.getElementById('ocrText')?.textContent || 'Unknown'}</div>
            <div class="plate-time">${new Date().toLocaleTimeString('id-ID')}</div>
        </div>
        <button class="plate-action" title="Hapus">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Add delete functionality
    const deleteBtn = plateElement.querySelector('.plate-action');
    deleteBtn.addEventListener('click', function() {
        plateElement.remove();
        updateScanCount();
        
        // Show empty state if no plates left
        if (scannedPlatesElement.children.length === 0) {
            showEmptyState(scannedPlatesElement);
        }
    });
    
    // Add to list
    scannedPlatesElement.insertBefore(plateElement, scannedPlatesElement.firstChild);
    
    // Update count
    updateScanCount();
}

function updateScanCount() {
    const countElement = document.getElementById('scanCount');
    const scannedPlatesElement = document.getElementById('scannedPlates');
    
    if (countElement && scannedPlatesElement) {
        const count = scannedPlatesElement.querySelectorAll('.scanned-plate').length;
        countElement.textContent = count;
    }
}

function showEmptyState(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <i class="fas fa-search"></i>
        <p>Belum ada plat yang discan</p>
        <small>Arahkan kamera ke plat nomor atau unggah gambar</small>
    `;
    
    container.appendChild(emptyState);
}

async function switchCamera() {
    try {
        currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
        await startCamera();
        showNotification(`Kamera diubah ke ${currentCamera === 'environment' ? 'belakang' : 'depan'}`, 'info');
    } catch (error) {
        console.error('Error switching camera:', error);
        showNotification('Gagal mengganti kamera', 'error');
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Harap pilih file gambar', 'error');
        return;
    }
    
    try {
        updateCameraStatus('Memproses gambar...');
        
        // Create image element
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            img.src = e.target.result;
            
            img.onload = async function() {
                // Create canvas from image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Process OCR
                await processOCR(canvas);
                
                // Add to scanned plates
                addToScannedPlates(canvas.toDataURL('image/jpeg', 0.8));
                
                updateCameraStatus('Gambar diproses');
            };
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error processing uploaded image:', error);
        showNotification('Gagal memproses gambar', 'error');
        updateCameraStatus('Error memproses');
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

function startAutoCapture() {
    if (!cameraStream || !document.getElementById('autoCapture')?.checked) {
        return;
    }
    
    // In production, this would use more sophisticated plate detection
    // For demo, we'll capture every few seconds
    const autoDelay = parseInt(document.getElementById('autoDelay')?.value || 2000);
    
    const autoCaptureInterval = setInterval(() => {
        if (document.getElementById('autoCapture')?.checked) {
            capturePlate();
        } else {
            clearInterval(autoCaptureInterval);
        }
    }, autoDelay);
    
    // Store interval ID for cleanup
    window.autoCaptureInterval = autoCaptureInterval;
}

function stopAutoCapture() {
    if (window.autoCaptureInterval) {
        clearInterval(window.autoCaptureInterval);
        window.autoCaptureInterval = null;
    }
}

function editOCRResult() {
    const ocrTextElement = document.getElementById('ocrText');
    if (!ocrTextElement) return;
    
    const currentText = ocrTextElement.textContent;
    const newText = prompt('Edit plat nomor:', currentText);
    
    if (newText !== null) {
        ocrTextElement.textContent = newText.toUpperCase();
        // Re-check customer with edited text
        checkCustomerExists(newText);
    }
}

function useCustomerData() {
    const plateText = document.getElementById('ocrText')?.textContent;
    const customerName = document.getElementById('matchName')?.textContent;
    
    if (plateText && customerName) {
        showNotification(`Menggunakan data pelanggan: ${customerName}`, 'success');
        
        // In production, redirect to transaction page with customer data
        setTimeout(() => {
            window.location.href = `register-wash.html?plate=${encodeURIComponent(plateText)}`;
        }, 1000);
    }
}

function newCustomerData() {
    const plateText = document.getElementById('ocrText')?.textContent;
    
    if (plateText) {
        showNotification('Membuat pelanggan baru', 'info');
        
        // In production, redirect to transaction page for new customer
        setTimeout(() => {
            window.location.href = `register-wash.html?plate=${encodeURIComponent(plateText)}&new=true`;
        }, 1000);
    }
}

function quickRegister() {
    const plateText = document.getElementById('ocrText')?.textContent;
    
    if (plateText) {
        window.location.href = `register-wash.html?plate=${encodeURIComponent(plateText)}`;
    } else {
        showNotification('Scan plat nomor terlebih dahulu', 'warning');
    }
}

function checkHistory() {
    const plateText = document.getElementById('ocrText')?.textContent;
    
    if (plateText) {
        showNotification(`Membuka riwayat untuk: ${plateText}`, 'info');
        // In production, open history page or modal
    } else {
        showNotification('Scan plat nomor terlebih dahulu', 'warning');
    }
}

async function savePlateImage() {
    try {
        const canvas = document.getElementById('cameraCanvas');
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = `plat-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        link.click();
        
        showNotification('Gambar plat disimpan', 'success');
        
    } catch (error) {
        console.error('Error saving plate image:', error);
        showNotification('Gagal menyimpan gambar', 'error');
    }
}

function confirmManualPlate() {
    const manualPlate = document.getElementById('manualPlate')?.value;
    
    if (!manualPlate) {
        showNotification('Masukkan plat nomor', 'error');
        return;
    }
    
    if (!validateLicensePlate(manualPlate)) {
        showNotification('Format plat nomor tidak valid', 'error');
        return;
    }
    
    // Display in OCR results
    displayOCRResult(manualPlate.toUpperCase(), 100);
    
    // Check customer
    checkCustomerExists(manualPlate);
    
    // Close modal
    closeModal('plateModal');
    
    showNotification(`Plat manual: ${manualPlate}`, 'success');
}

function updateCameraQuality() {
    const quality = document.getElementById('cameraQuality')?.value;
    showNotification(`Kualitas kamera diubah ke: ${quality === '0.5' ? 'Rendah' : quality === '0.8' ? 'Sedang' : 'Tinggi'}`, 'info');
}

function updateAutoDelay() {
    const delay = document.getElementById('autoDelay')?.value;
    showNotification(`Auto-capture delay: ${parseInt(delay) / 1000} detik`, 'info');
    
    // Restart auto-capture if enabled
    if (document.getElementById('autoCapture')?.checked) {
        stopAutoCapture();
        startAutoCapture();
    }
}

function updateCameraStatus(status) {
    const statusElement = document.getElementById('cameraStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

function validateLicensePlate(plate) {
    // Basic Indonesian license plate validation
    const regex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
    return regex.test(plate);
}

function showNotification(message, type = 'info') {
    // Use utility function if available, otherwise use alert
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    // Stop camera stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop auto-capture
    stopAutoCapture();
    
    // Terminate OCR worker
    if (tesseractWorker) {
        tesseractWorker.terminate();
        tesseractWorker = null;
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCamera,
        capturePlate,
        processOCR,
        cleanOCRText,
        validateLicensePlate
    };
}