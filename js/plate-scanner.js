/**
 * License Plate Scanner Module
 * Motor Bersih POS - Integrated OCR with Tesseract.js
 */

class PlateScanner {
    constructor() {
        this.stream = null;
        this.currentCamera = 'environment'; // 'user' or 'environment'
        this.worker = null;
        this.isProcessing = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing Plate Scanner...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize Tesseract worker
        await this.initOCR();
        
        console.log('✓ Plate Scanner initialized');
    }

    setupEventListeners() {
        // Start camera button
        document.getElementById('startCameraBtn')?.addEventListener('click', () => this.startCamera());
        
        // Switch camera button
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        
        // Capture button
        document.getElementById('captureBtn')?.addEventListener('click', () => this.captureImage());
        
        // Upload button
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Scan again button
        document.getElementById('scanAgainBtn')?.addEventListener('click', () => this.resetScanner());
        
        // Manual input button
        document.getElementById('manualInputBtn')?.addEventListener('click', () => this.showManualInput());
        
        // Use plate button
        document.getElementById('usePlateBtn')?.addEventListener('click', () => this.usePlate());
        
        // Use manual plate button
        document.getElementById('useManualPlateBtn')?.addEventListener('click', () => this.useManualPlate());
        
        // Edit plate input - real-time validation
        const editInput = document.getElementById('editPlateInput');
        if (editInput) {
            editInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
                this.validatePlateFormat(e.target.value);
            });
        }
        
        // Manual plate input - real-time validation
        const manualInput = document.getElementById('manualPlateInput');
        if (manualInput) {
            manualInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    }

    async initOCR() {
        try {
            console.log('Loading Tesseract OCR...');
            
            if (!window.Tesseract) {
                throw new Error('Tesseract.js not loaded');
            }
            
            this.worker = await Tesseract.createWorker({
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        this.updateProgress(Math.round(m.progress * 100));
                    }
                }
            });
            
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
            await this.worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
            });
            
            console.log('✓ OCR ready');
        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            this.showNotification('OCR engine gagal dimuat. Gunakan input manual.', 'error');
        }
    }

    async startCamera() {
        try {
            this.showLoading('Mengaktifkan kamera...');
            
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.hideLoading();
                this.showNotification('Browser tidak mendukung kamera. Gunakan tombol Upload sebagai alternatif.', 'warning');
                // Show upload button prominently
                const uploadBtn = document.getElementById('uploadBtn');
                if (uploadBtn) {
                    uploadBtn.classList.remove('hidden');
                    uploadBtn.classList.add('bg-blue-600', 'text-white', 'animate-pulse');
                }
                return;
            }
            
            // Stop existing stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Request camera access with fallback options
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            try {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                // Fallback to any available camera
                console.warn('Back camera not available, trying any camera:', err);
                this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Display stream
            const video = document.getElementById('cameraFeed');
            video.srcObject = this.stream;
            video.classList.remove('hidden');
            
            // Hide placeholder
            document.getElementById('cameraPlaceholder').classList.add('hidden');
            document.getElementById('cameraOverlay').classList.remove('hidden');
            
            // Enable capture button
            document.getElementById('captureBtn').disabled = false;
            
            // Update button
            document.getElementById('startCameraBtn').innerHTML = '<i class="fas fa-stop mr-1"></i>Stop Kamera';
            document.getElementById('startCameraBtn').onclick = () => this.stopCamera();
            
            this.hideLoading();
            this.showNotification('Kamera aktif. Arahkan ke plat nomor.', 'success');
            
        } catch (error) {
            console.error('Camera error:', error);
            this.hideLoading();
            this.showNotification('Gagal mengakses kamera. Gunakan upload gambar.', 'error');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const video = document.getElementById('cameraFeed');
        video.srcObject = null;
        video.classList.add('hidden');
        
        document.getElementById('cameraPlaceholder').classList.remove('hidden');
        document.getElementById('cameraOverlay').classList.add('hidden');
        document.getElementById('captureBtn').disabled = true;
        
        // Reset button
        document.getElementById('startCameraBtn').innerHTML = '<i class="fas fa-play mr-1"></i>Mulai Kamera';
        document.getElementById('startCameraBtn').onclick = () => this.startCamera();
    }

    async switchCamera() {
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        if (this.stream) {
            await this.startCamera();
        }
    }

    captureImage() {
        const video = document.getElementById('cameraFeed');
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Display captured image
        document.getElementById('capturedImage').src = imageData;
        document.getElementById('capturedSection').classList.remove('hidden');
        
        // Stop camera
        this.stopCamera();
        
        // Process OCR
        this.processImage(canvas);
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.match('image.*')) {
            this.showNotification('File harus berupa gambar', 'error');
            return;
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Display image
                document.getElementById('capturedImage').src = e.target.result;
                document.getElementById('capturedSection').classList.remove('hidden');
                
                // Draw to canvas
                const canvas = document.getElementById('imageCanvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Process OCR
                this.processImage(canvas);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // Reset file input
        event.target.value = '';
    }

    async processImage(canvas) {
        if (this.isProcessing) return;
        if (!this.worker) {
            this.showError('OCR engine tidak tersedia. Gunakan input manual.');
            return;
        }
        
        this.isProcessing = true;
        this.showLoading('Membaca plat nomor...');
        
        try {
            // Perform OCR
            const { data } = await this.worker.recognize(canvas);
            
            console.log('OCR Raw Text:', data.text);
            console.log('OCR Confidence:', data.confidence);
            
            // Clean and extract plate number
            const plateNumber = this.extractPlateNumber(data.text);
            const confidence = Math.round(data.confidence);
            
            if (plateNumber) {
                this.showSuccess(plateNumber, confidence);
            } else {
                this.showError('Plat nomor tidak terdeteksi. Coba lagi atau input manual.');
            }
            
        } catch (error) {
            console.error('OCR Error:', error);
            this.showError('Gagal memproses gambar. Silakan coba lagi.');
        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    }

    extractPlateNumber(text) {
        // Remove all whitespace and special characters
        let cleaned = text.replace(/[^A-Z0-9]/gi, '');
        cleaned = cleaned.toUpperCase();
        
        console.log('Cleaned text:', cleaned);
        
        // Indonesian plate pattern: 1-2 letters + 1-4 digits + 1-3 letters
        // Examples: B1234ABC, DK5678XY, AB123C
        const patterns = [
            /([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})/,  // Standard pattern
            /([A-Z])(\d{3,4})([A-Z]{2,3})/,        // B 1234 AB
            /([A-Z]{2})(\d{1,4})([A-Z]{1,2})/      // AB 123 C
        ];
        
        for (const pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match) {
                // Format: XX XXXX XXX
                const formatted = `${match[1]} ${match[2]} ${match[3]}`;
                console.log('Matched pattern:', formatted);
                
                // Validate
                if (this.validatePlateNumber(formatted)) {
                    return formatted;
                }
            }
        }
        
        // If no pattern matched, try to extract any alphanumeric sequence
        if (cleaned.length >= 5 && cleaned.length <= 12) {
            // Try to format it anyway
            const letters1 = cleaned.match(/^[A-Z]{1,2}/);
            if (letters1) {
                const remaining = cleaned.substring(letters1[0].length);
                const digits = remaining.match(/^\d{1,4}/);
                if (digits) {
                    const letters2 = remaining.substring(digits[0].length).match(/^[A-Z]{1,3}/);
                    if (letters2) {
                        const formatted = `${letters1[0]} ${digits[0]} ${letters2[0]}`;
                        if (this.validatePlateNumber(formatted)) {
                            return formatted;
                        }
                    }
                }
            }
        }
        
        return null;
    }

    validatePlateNumber(plate) {
        // Basic Indonesian license plate validation
        // Format: X(X) XXXX X(XX)
        const regex = /^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$/;
        return regex.test(plate);
    }

    validatePlateFormat(plate) {
        const valid = this.validatePlateNumber(plate);
        const statusEl = document.getElementById('validationStatus');
        
        if (valid) {
            statusEl.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Valid</span>';
        } else {
            statusEl.innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Format salah</span>';
        }
        
        return valid;
    }

    showSuccess(plateNumber, confidence) {
        // Hide no results
        document.getElementById('noResults').classList.add('hidden');
        document.getElementById('errorResult').classList.add('hidden');
        
        // Show success result
        const successDiv = document.getElementById('successResult');
        successDiv.classList.remove('hidden');
        
        // Update values
        document.getElementById('detectedPlate').textContent = plateNumber;
        document.getElementById('confidence').textContent = `${confidence}%`;
        document.getElementById('editPlateInput').value = plateNumber;
        
        // Validate and show status
        this.validatePlateFormat(plateNumber);
        
        this.showNotification('Plat nomor berhasil terdeteksi!', 'success');
    }

    showError(message) {
        // Hide no results and success
        document.getElementById('noResults').classList.add('hidden');
        document.getElementById('successResult').classList.add('hidden');
        
        // Show error result
        const errorDiv = document.getElementById('errorResult');
        errorDiv.classList.remove('hidden');
        
        document.getElementById('errorMessage').textContent = message;
        
        this.showNotification(message, 'error');
    }

    showManualInput() {
        this.showError('Silakan input plat nomor secara manual');
        document.getElementById('manualPlateInput').focus();
    }

    resetScanner() {
        // Hide captured section
        document.getElementById('capturedSection').classList.add('hidden');
        
        // Hide results
        document.getElementById('successResult').classList.add('hidden');
        document.getElementById('errorResult').classList.add('hidden');
        document.getElementById('noResults').classList.remove('hidden');
        
        // Clear inputs
        document.getElementById('editPlateInput').value = '';
        document.getElementById('manualPlateInput').value = '';
        
        // Restart camera
        this.startCamera();
    }

    usePlate() {
        const plateInput = document.getElementById('editPlateInput');
        const plate = plateInput.value.trim().toUpperCase();
        
        if (!plate) {
            this.showNotification('Plat nomor tidak boleh kosong', 'error');
            return;
        }
        
        if (!this.validatePlateNumber(plate)) {
            this.showNotification('Format plat nomor tidak valid', 'error');
            plateInput.focus();
            return;
        }
        
        this.applyPlateNumber(plate);
    }

    useManualPlate() {
        const plateInput = document.getElementById('manualPlateInput');
        const plate = plateInput.value.trim().toUpperCase();
        
        if (!plate) {
            this.showNotification('Plat nomor tidak boleh kosong', 'error');
            return;
        }
        
        if (!this.validatePlateNumber(plate)) {
            this.showNotification('Format plat nomor tidak valid (Contoh: B 1234 ABC)', 'error');
            plateInput.focus();
            return;
        }
        
        this.applyPlateNumber(plate);
    }

    applyPlateNumber(plate) {
        // Store in sessionStorage for use in register-wash page
        sessionStorage.setItem('scannedPlate', plate);
        sessionStorage.setItem('scannedPlateTime', new Date().toISOString());
        
        // Redirect back to register-wash
        this.showNotification('Plat nomor tersimpan!', 'success');
        
        setTimeout(() => {
            window.location.href = 'register-wash.html';
        }, 800);
    }

    showLoading(text = 'Memproses...') {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        const progressEl = document.getElementById('loadingProgress');
        
        textEl.textContent = text;
        progressEl.textContent = '0%';
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    updateProgress(percent) {
        document.getElementById('loadingProgress').textContent = `${percent}%`;
    }

    showNotification(message, type = 'info') {
        // Simple notification using Tailwind toast-like
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} text-xl"></i>
            <span class="font-semibold">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    cleanup() {
        // Stop camera
        this.stopCamera();
        
        // Terminate OCR worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const auth = window.authManager || window.AuthManager?.getInstance?.();
    if (auth && !auth.checkAuth()) {
        return;
    }
    
    // Initialize scanner
    window.plateScanner = new PlateScanner();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.plateScanner) {
        window.plateScanner.cleanup();
    }
});

// Add animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);
