/**
 * IntelliQR App
 * Main application script for QR code generation and scanning
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new IntelliQRApp();
    app.init();
});

class IntelliQRApp {
    constructor() {
        // DOM elements
        this.tabs = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-pane');

        // Generator elements
        this.qrText = document.getElementById('qr-text');
        this.generateBtn = document.getElementById('generate-btn');
        this.qrCanvas = document.getElementById('qr-canvas');
        this.downloadBtn = document.getElementById('download-btn');

        // Scanner elements
        this.scannerVideo = document.getElementById('scanner-video');
        this.scanResult = document.getElementById('scan-result');

        // History elements
        this.scanHistoryList = document.getElementById('scan-history-list');
        this.clearHistoryBtn = document.getElementById('clear-history-btn');

        // Scanner option buttons
        this.scannerOptionBtns = document.querySelectorAll('.scanner-option-btn');
        this.cameraBtn = document.getElementById('camera-btn');
        this.fileBtn = document.getElementById('file-btn');

        // Scanner method containers
        this.scannerMethods = document.querySelectorAll('.scanner-method');
        this.cameraScanner = document.getElementById('camera-scanner');
        this.fileScanner = document.getElementById('file-scanner');

        // File upload & paste elements
        this.dropArea = document.getElementById('drop-area');
        this.fileInput = document.getElementById('file-input');
        this.selectFileBtn = document.getElementById('select-file-btn');
        this.fileCanvas = document.getElementById('file-canvas');

        // Theme toggle
        this.themeToggle = document.getElementById('theme-toggle');

        // Set canvas dimensions
        this.qrCanvas.width = 256;
        this.qrCanvas.height = 256;
        this.fileCanvas.width = 500;
        this.fileCanvas.height = 500;

        // Create QR generator instance
        this.qrGenerator = window.QRCodeGenerator.create({
            correctLevel: "H", // Highest error correction for better scanning
        });

        // Scanner state
        this.scanner = {
            active: false,
            stream: null,
            canvasElement: document.createElement('canvas'),
            canvasContext: null,
            requestId: null
        };

        this.scanner.canvasContext = this.scanner.canvasElement.getContext('2d', { willReadFrequently: true });

        // Initialize theme based on user preference
        this.initTheme();

        // Initialize scan history
        this.scanHistory = [];
    }

    /**
     * Initialize the application
     */
    init() {
        // Set up event listeners
        this.setupEventListeners();

        // Apply animations to elements
        this.applyAnimations();
    }

    /**
     * Initialize theme based on user preferences
     */
    initTheme() {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            document.documentElement.dataset.theme = savedTheme;
        } else {
            // Check if user prefers dark mode
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.dataset.theme = 'dark';
            }
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // Apply animation for smooth transition
        document.documentElement.classList.add('theme-transition');

        // Set new theme
        document.documentElement.dataset.theme = newTheme;

        // Store theme preference
        localStorage.setItem('theme', newTheme);

        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    }

    /**
     * Apply animations to key elements for better UX
     */
    applyAnimations() {
        // Animate title on load
        const title = document.querySelector('h1');
        title.style.opacity = '0';
        title.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            title.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 100);

        // Stagger tab button animations
        this.tabs.forEach((tab, index) => {
            tab.style.opacity = '0';
            tab.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                tab.style.transition = 'opacity 0.3s ease, transform 0.3s ease, background 0.2s ease, color 0.2s ease';
                tab.style.opacity = '1';
                tab.style.transform = 'translateY(0)';
            }, 200 + index * 100);
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // QR code generation
        this.generateBtn.addEventListener('click', () => this.generateQRCode());
        this.qrText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateQRCode();
            }
        });

        // Download QR code
        this.downloadBtn.addEventListener('click', () => this.downloadQRCode());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Scanner method switching
        this.scannerOptionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const methodId = btn.id.split('-')[0]; // Extract 'camera' or 'file' from button id
                this.switchScannerMethod(methodId);
            });
        });

        // File upload handlers
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files.length > 0) {
                this.handleFileSelect(this.fileInput.files[0]);
            }
        });

        // Drag and drop handlers
        this.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Paste handler - make the entire drop area focusable
        this.dropArea.addEventListener('click', () => this.dropArea.focus());
        this.dropArea.addEventListener('paste', (e) => this.handlePaste(e));

        // Global paste event listener
        document.addEventListener('paste', (e) => {
            // Only process paste if we're on the file scanner method
            if (this.fileScanner.classList.contains('active')) {
                this.handlePaste(e);
            }
        });

        // Clear history button
        this.clearHistoryBtn.addEventListener('click', () => this.clearScanHistory());
    }

    /**
     * Switch between tabs
     */
    switchTab(tabId) {
        // Update active tab button
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Get the old and new tab content elements
        const oldTabContent = document.querySelector('.tab-pane.active');
        const newTabContent = document.getElementById(tabId);

        // Apply exit animation to old tab
        if (oldTabContent) {
            oldTabContent.classList.add('tab-exit');
            setTimeout(() => {
                oldTabContent.classList.remove('active');
                oldTabContent.classList.remove('tab-exit');

                // Apply entrance animation to new tab
                newTabContent.classList.add('active');

                // Start scanner if switching to scanner tab and camera method is active
                if (tabId === 'scanner' && this.cameraScanner.classList.contains('active') && !this.scanner.active) {
                    this.startScanner();
                }
            }, 300);
        }

        // Stop scanner if switching away from scanner tab
        if (oldTabContent && oldTabContent.id === 'scanner' && this.scanner.active) {
            this.stopScanner();
        }
    }

    /**
     * Switch between scanner methods (camera or file)
     */
    switchScannerMethod(methodId) {
        // Update active button with animation
        this.scannerOptionBtns.forEach(btn => {
            const isActive = btn.id === `${methodId}-btn`;
            if (isActive && !btn.classList.contains('active')) {
                btn.classList.add('pulse-animation');
                setTimeout(() => {
                    btn.classList.remove('pulse-animation');
                }, 500);
            }
            btn.classList.toggle('active', isActive);
        });

        // Get current active method and new method
        const currentMethod = document.querySelector('.scanner-method.active');
        const newMethod = document.getElementById(`${methodId}-scanner`);

        // Don't proceed if the same method is already active
        if (currentMethod === newMethod) return;

        // Apply transition
        if (currentMethod) {
            currentMethod.classList.add('fade-out');

            setTimeout(() => {
                currentMethod.classList.remove('active');
                currentMethod.classList.remove('fade-out');

                newMethod.classList.add('active');
                newMethod.classList.add('fade-in');

                setTimeout(() => {
                    newMethod.classList.remove('fade-in');
                }, 300);

                // Start or stop camera as needed
                if (methodId === 'camera' && !this.scanner.active) {
                    this.startScanner();
                } else if (methodId !== 'camera' && this.scanner.active) {
                    this.stopScanner();
                }
            }, 300);
        }

        // Reset result
        this.scanResult.textContent = 'No QR code detected';
    }

    /**
     * Generate QR code from input text
     */
    generateQRCode() {
        const text = this.qrText.value.trim();

        if (!text) {
            this.showToast('Please enter text or URL to generate QR code', 'error');
            this.qrText.focus();
            return;
        }

        try {
            // Show loading animation
            this.qrCanvas.classList.add('loading-animation');

            // Generate QR code and render to canvas after a slight delay to show loading
            setTimeout(() => {
                this.qrGenerator.generate(text, 'qr-canvas');
                this.qrCanvas.classList.remove('loading-animation');

                // Show download button with animation
                this.downloadBtn.style.display = 'block';
                this.downloadBtn.classList.add('pop-animation');

                setTimeout(() => {
                    this.downloadBtn.classList.remove('pop-animation');
                }, 500);

                this.showToast('QR Code generated successfully', 'success');
            }, 600);
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.showToast('Failed to generate QR code. Please try again.', 'error');
            this.qrCanvas.classList.remove('loading-animation');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to body
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Hide toast after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Download the generated QR code as PNG
     */
    downloadQRCode() {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = this.qrCanvas.toDataURL('image/png');

        // Add download animation
        this.downloadBtn.classList.add('download-animation');
        setTimeout(() => {
            link.click();
            setTimeout(() => {
                this.downloadBtn.classList.remove('download-animation');
            }, 500);
        }, 300);
    }

    /**
     * Handle drag over event for file drop area
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.add('drag-over');
    }

    /**
     * Handle drag leave event for file drop area
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.remove('drag-over');
    }

    /**
     * Handle file drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.remove('drag-over');

        // Get the dropped file
        const file = e.dataTransfer.files[0];
        if (file) {
            this.handleFileSelect(file);
        }
    }

    /**
     * Handle file selection from input or drop
     */
    handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        // Show loading state
        this.showToast('Processing image...', 'info');

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => this.processImageForQR(img, this.fileCanvas);
            img.onerror = () => this.showToast('Error loading image', 'error');
            img.src = e.target.result;
        };
        reader.onerror = () => this.showToast('Error reading file', 'error');
        reader.readAsDataURL(file);
    }

    /**
     * Handle paste event for clipboard images
     */
    handlePaste(e) {
        const items = (e.clipboardData || window.clipboardData).items;

        let imageItem = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                imageItem = items[i];
                break;
            }
        }

        if (imageItem) {
            // Show loading animation
            this.showToast('Processing pasted image...', 'info');

            const blob = imageItem.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => this.processImageForQR(img, this.fileCanvas);
                img.src = e.target.result;
            };
            reader.readAsDataURL(blob);
        } else {
            this.showToast('No image found in clipboard', 'error');
        }
    }

    /**
     * Process an image to detect QR codes
     */
    processImageForQR(img, canvas) {
        const ctx = canvas.getContext('2d');

        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = Math.max(canvas.width, canvas.height);

        if (width > height && width > maxDimension) {
            height = height * (maxDimension / width);
            width = maxDimension;
        } else if (height > maxDimension) {
            width = width * (maxDimension / height);
            height = maxDimension;
        }

        // Clear canvas and draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        canvas.hidden = false;

        // Add scan line animation
        this.addScanLineAnimation(canvas, img);

        // Get image data for QR detection
        const imageData = ctx.getImageData(0, 0, width, height);

        // Try to detect QR code
        this.detectQRCodeInImage(imageData);
    }

    /**
     * Add scan line animation to canvas
     */
    addScanLineAnimation(canvas, img) {
        const ctx = canvas.getContext('2d');
        const height = canvas.height;
        const width = canvas.width;

        // Store image reference for redrawing later
        this._currentImage = img;

        let y = 0;
        let direction = 1;

        // Clear any existing animation
        if (this._scanLineInterval) {
            clearInterval(this._scanLineInterval);
        }

        this._scanLineInterval = setInterval(() => {
            // Clear previous scan line by redrawing that part of the image
            ctx.clearRect(0, y - 2, width, 4);

            // Draw new scan line
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = 'rgba(58, 109, 240, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Move scan line
            y += direction * 4;

            // Reverse direction at edges
            if (y >= height - 2 || y <= 2) {
                direction *= -1;
            }
        }, 30);

        // Stop animation after 3 seconds
        setTimeout(() => {
            if (this._scanLineInterval) {
                clearInterval(this._scanLineInterval);
                this._scanLineInterval = null;

                // Redraw the image to remove scan line
                ctx.clearRect(0, 0, width, height);
                if (this._currentImage) {
                    ctx.drawImage(this._currentImage, 0, 0, width, height);
                }
            }
        }, 3000);
    }

    /**
     * Detect QR code in an image
     */
    detectQRCodeInImage(imageData) {
        // First try with BarcodeDetector API if available
        if (window.BarcodeDetector) {
            this.detectQRWithBarcodeDetector(imageData)
                .then(result => {
                    if (result) {
                        this.scanResult.textContent = result;
                        this.showToast('QR Code detected!', 'success');
                    } else {
                        // Fallback to jsQR
                        this.detectQRWithJSQR(imageData);
                    }
                })
                .catch(error => {
                    console.error('BarcodeDetector error:', error);
                    this.detectQRWithJSQR(imageData);
                });
        } else {
            // Use jsQR if BarcodeDetector is not available
            this.detectQRWithJSQR(imageData);
        }
    }

    /**
     * Detect QR with jsQR library
     */
    detectQRWithJSQR(imageData) {
        // Load jsQR if not already loaded
        if (!window.jsQR) {
            this.showToast('Loading QR scanner library...', 'info');
            this.loadJSQR(() => this.detectQRWithJSQR(imageData));
            return;
        }

        try {
            const code = window.jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                { inversionAttempts: 'dontInvert' }
            );

            if (code && code.data) {
                this.scanResult.textContent = code.data;

                // Add to scan history
                this.addToScanHistory(code.data);

                this.showToast('QR Code detected!', 'success');
            } else {
                this.scanResult.textContent = 'No QR code found in image';
                this.showToast('No QR code found', 'error');
            }
        } catch (error) {
            console.error('jsQR detection error:', error);
            this.scanResult.textContent = 'Error processing image';
            this.showToast('Error processing image', 'error');
        }
    }

    /**
     * Add a QR code scan result to history
     */
    addToScanHistory(qrData) {
        // Don't add duplicates of the most recent scan
        if (this.scanHistory.length > 0 && this.scanHistory[0].data === qrData) {
            return;
        }

        // Create history item
        const historyItem = {
            id: Date.now(),
            data: qrData,
            timestamp: new Date(),
            isLink: this.isValidUrl(qrData)
        };

        // Add to history array
        this.scanHistory.unshift(historyItem);

        // Update history UI
        this.renderScanHistory();
    }

    /**
     * Clear scan history
     */
    clearScanHistory() {
        this.scanHistory = [];
        this.renderScanHistory();
        this.showToast('Scan history cleared', 'info');
    }

    /**
     * Render the scan history list
     */
    renderScanHistory() {
        // Clear current content
        this.scanHistoryList.innerHTML = '';

        // Show empty message if no history
        if (this.scanHistory.length === 0) {
            this.scanHistoryList.innerHTML = '<div class="empty-history">No scans yet</div>';
            return;
        }

        // Add history items
        this.scanHistory.forEach(item => {
            const historyItemEl = document.createElement('div');
            historyItemEl.className = 'history-item';
            historyItemEl.dataset.id = item.id;

            // Format time string
            const timeString = this.formatTime(item.timestamp);

            // Create history item content
            historyItemEl.innerHTML = `
                <div class="history-item-content">
                    <p class="history-item-text">${this.escapeHtml(item.data)}</p>
                    <p class="history-item-time">${timeString}</p>
                </div>
                <div class="history-item-actions">
                    <button class="history-btn copy-btn" aria-label="Copy">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                        </svg>
                    </button>
                    ${item.isLink ? `
                    <button class="history-btn open-btn" aria-label="Open Link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `;

            // Add copy button handler
            const copyBtn = historyItemEl.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => this.copyToClipboard(item.data, copyBtn));

            // Add open link button handler
            if (item.isLink) {
                const openBtn = historyItemEl.querySelector('.open-btn');
                openBtn.addEventListener('click', () => this.openLink(item.data));
            }

            // Add to the list
            this.scanHistoryList.appendChild(historyItemEl);
        });
    }

    /**
     * Format timestamp for display
     */
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text, buttonEl) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success animation
            buttonEl.classList.add('copied');

            // Show toast notification
            this.showToast('Copied to clipboard!', 'success');

            // Remove animation class after delay
            setTimeout(() => {
                buttonEl.classList.remove('copied');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }

    /**
     * Open a URL in a new tab
     */
    openLink(url) {
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        window.open(url, '_blank');
    }

    /**
     * Check if string is a valid URL
     */
    isValidUrl(string) {
        try {
            // Test if it's a URL with or without protocol
            return /^(https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,}(\/\S*)?$/i.test(string);
        } catch (e) {
            return false;
        }
    }

    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Start the QR code scanner
     */
    async startScanner() {
        try {
            // Show loading state
            this.showToast('Accessing camera...', 'info');

            // Request camera access
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.scanner.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.scannerVideo.srcObject = this.scanner.stream;

            // Wait for video to load
            await new Promise(resolve => {
                this.scannerVideo.onloadedmetadata = () => {
                    this.scannerVideo.play();
                    resolve();
                };
            });

            // Fix for mirrored camera on Android devices
            // Check if device is likely Android
            const isAndroid = /Android/i.test(navigator.userAgent);
            if (isAndroid) {
                // Apply CSS transform to fix mirroring
                this.scannerVideo.style.transform = 'scaleX(1)';
            }

            // Set canvas size to match video
            this.scanner.canvasElement.width = this.scannerVideo.videoWidth;
            this.scanner.canvasElement.height = this.scannerVideo.videoHeight;

            // Start scanning
            this.scanner.active = true;
            this.scanFrames();

            // Update UI
            this.scanResult.textContent = 'Scanning...';
            this.showToast('Camera ready! Scanning for QR codes...', 'success');
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.scanResult.textContent = 'Error accessing camera. Please check permissions.';
            this.showToast('Camera access denied', 'error');
        }
    }

    /**
     * Stop the QR code scanner
     */
    stopScanner() {
        if (this.scanner.stream) {
            // Stop all video tracks
            this.scanner.stream.getTracks().forEach(track => track.stop());
            this.scanner.stream = null;
        }

        // Cancel the animation frame
        if (this.scanner.requestId) {
            cancelAnimationFrame(this.scanner.requestId);
            this.scanner.requestId = null;
        }

        this.scanner.active = false;
    }

    /**
     * Continuously scan video frames for QR codes
     */
    scanFrames() {
        if (!this.scanner.active) return;

        // Process the current video frame
        this.processVideoFrame();

        // Schedule the next frame
        this.scanner.requestId = requestAnimationFrame(() => this.scanFrames());
    }

    /**
     * Process a video frame to detect QR codes
     */
    processVideoFrame() {
        try {
            if (this.scannerVideo.readyState === this.scannerVideo.HAVE_ENOUGH_DATA) {
                // Draw video frame to canvas
                const ctx = this.scanner.canvasContext;
                const canvas = this.scanner.canvasElement;
                ctx.drawImage(this.scannerVideo, 0, 0, canvas.width, canvas.height);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Try to detect QR code in the frame
                this.detectQRCode(imageData).then(qrCode => {
                    if (qrCode) {
                        // QR code detected, display result
                        this.scanResult.textContent = qrCode;

                        // Add to scan history
                        this.addToScanHistory(qrCode);

                        this.showToast('QR Code detected!', 'success');

                        // Pause scanning briefly after successful detection
                        this.scanner.active = false;
                        setTimeout(() => {
                            if (this.cameraScanner.classList.contains('active')) {
                                this.scanner.active = true;
                                this.scanResult.textContent = 'Scanning...';
                                this.scanFrames();
                            }
                        }, 1500);
                    }
                }).catch(err => {
                    console.error('QR detection error:', err);
                });
            }
        } catch (error) {
            console.error('Error processing video frame:', error);
        }
    }

    /**
     * Detect a QR code in the image data (for video frames)
     */
    detectQRCode(imageData) {
        // Try with BarcodeDetector API if available
        if (window.BarcodeDetector) {
            return this.detectQRWithBarcodeDetector(imageData);
        }

        // Otherwise use jsQR
        return this.detectQRManually(imageData);
    }

    /**
     * Detect QR codes using the BarcodeDetector API (if available)
     */
    async detectQRWithBarcodeDetector(imageData) {
        try {
            // Create detector
            const barcodeDetector = new BarcodeDetector({
                formats: ['qr_code']
            });

            // Detect codes
            const barcodes = await barcodeDetector.detect(imageData);

            if (barcodes.length > 0) {
                return barcodes[0].rawValue;
            }
        } catch (error) {
            console.error('BarcodeDetector error:', error);
        }

        return null;
    }

    /**
     * Manual QR code detection using jsQR library
     */
    detectQRManually(imageData) {
        return new Promise((resolve, reject) => {
            if (!this._qrScanner) {
                // Lazily load jsQR library if it's available
                if (window.jsQR) {
                    this._qrScanner = window.jsQR;
                } else {
                    // Load jsQR if not already loaded
                    this.loadJSQR();
                    resolve(null); // Skip this frame while loading
                    return;
                }
            }

            if (this._qrScanner) {
                try {
                    const code = this._qrScanner(
                        imageData.data,
                        imageData.width,
                        imageData.height,
                        { inversionAttempts: 'dontInvert' }
                    );

                    // Only return result if we have a valid QR code with data
                    // This prevents false positives
                    if (code && code.data && code.location &&
                        code.location.topLeftCorner &&
                        code.location.topRightCorner &&
                        code.location.bottomLeftCorner &&
                        code.location.bottomRightCorner) {
                        resolve(code.data);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('jsQR detection error:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Dynamically load the jsQR library
     */
    loadJSQR(callback) {
        if (this._loadingJSQR) return;
        this._loadingJSQR = true;

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.onload = () => {
            this._qrScanner = window.jsQR;
            this._loadingJSQR = false;
            if (callback && typeof callback === 'function') {
                callback();
            }
        };
        script.onerror = () => {
            console.error('Failed to load jsQR library');
            this._loadingJSQR = false;

            // Show error message
            this.scanResult.textContent = 'QR scanner libraries could not be loaded.';
            this.showToast('Error loading scanner libraries', 'error');
        };

        document.head.appendChild(script);
    }
}
