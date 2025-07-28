/**
 * IntelliQR - QR Code Library
 * A vanilla JavaScript library for generating QR codes
 */

class QRCode {
    constructor(options = {}) {
        this.options = {
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: "H", // L, M, Q, H
            margin: 4, // QR code margin
            ...options
        };

        // Preload the library on init for faster generation
        this._libraryLoaded = this._loadQRCodeLibrary().catch(err => {
            console.warn("QR code library preload failed:", err);
        });
    }

    /**
     * Load the QRCode.js library dynamically
     */
    async _loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            // Check if library is already loaded
            if (window.QRCode) {
                resolve(window.QRCode);
                return;
            }

            // Try to load from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
            script.onload = () => resolve(window.QRCode);
            script.onerror = () => {
                // Try alternate CDN if first one fails
                const backupScript = document.createElement('script');
                backupScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
                backupScript.onload = () => resolve(window.QRCode);
                backupScript.onerror = () => reject(new Error("Failed to load QR Code library from multiple sources"));
                document.head.appendChild(backupScript);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Generate a QR code using the library
     */
    async generate(text, elementId) {
        try {
            // Make sure library is loaded
            await this._libraryLoaded;

            if (!window.QRCode) {
                throw new Error("QR code library not available");
            }

            const canvas = document.getElementById(elementId);
            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                throw new Error(`Element with ID "${elementId}" is not a valid canvas element`);
            }

            // Map our correction level to the library's
            const correctLevelMap = {
                "L": window.QRCode.Ecc.L,
                "M": window.QRCode.Ecc.M,
                "Q": window.QRCode.Ecc.Q,
                "H": window.QRCode.Ecc.H
            };

            const correctLevel = correctLevelMap[this.options.correctLevel] || window.QRCode.Ecc.H;

            // Calculate optimal type number based on text length
            // 0 means auto-detect
            const typeNumber = 0;

            // Generate QR code
            const qr = window.QRCode(typeNumber, correctLevel);
            qr.addData(text);
            qr.make();

            // Render to canvas with proper scaling
            const ctx = canvas.getContext('2d');
            const moduleCount = qr.getModuleCount();
            const margin = this.options.margin || 4;

            // Calculate scaling for the modules
            const contentSize = canvas.width - (margin * 2);
            const scale = contentSize / moduleCount;

            // Clear canvas
            ctx.fillStyle = this.options.colorLight;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR code
            ctx.fillStyle = this.options.colorDark;
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(
                            Math.round(col * scale) + margin,
                            Math.round(row * scale) + margin,
                            Math.ceil(scale),
                            Math.ceil(scale)
                        );
                    }
                }
            }

            return qr;
        } catch (error) {
            console.error("Error generating QR code:", error);
            // Try one more time with direct library load
            return this._fallbackDirectLibrary(text, elementId);
        }
    }

    /**
     * Ultimate fallback - try using another QR code library
     */
    async _fallbackDirectLibrary(text, elementId) {
        return new Promise((resolve, reject) => {
            // Try loading QRious as a final fallback
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
            script.onload = () => {
                try {
                    const canvas = document.getElementById(elementId);

                    // Create QR code with QRious
                    const qr = new window.QRious({
                        element: canvas,
                        value: text,
                        size: canvas.width,
                        backgroundAlpha: 1,
                        foreground: this.options.colorDark,
                        background: this.options.colorLight,
                        level: this.options.correctLevel.toLowerCase(),
                        padding: this.options.margin
                    });

                    resolve(qr);
                } catch (err) {
                    reject(new Error("All QR generation methods failed"));
                }
            };
            script.onerror = () => reject(new Error("All QR generation methods failed"));
            document.head.appendChild(script);
        });
    }
}

// Export the QRCode class
window.QRCodeGenerator = {
    create: function(options) {
        return new QRCode(options);
    }
};
