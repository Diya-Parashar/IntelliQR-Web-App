# IntelliQR

![IntelliQR Logo](https://img.shields.io/badge/IntelliQR-QR%20Code%20Tool-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

IntelliQR is a lightweight, responsive web application for generating and scanning QR codes directly in your browser. Built with vanilla JavaScript, HTML5, and CSS3, it offers a clean, intuitive interface with both light and dark modes.

## ✨ Features

### QR Code Generator
- Generate QR codes from any text or URL input
- Download generated QR codes as PNG images
- Real-time generation with instant preview

### QR Code Scanner
- **Camera Scanning**: Scan QR codes using your device's camera in real-time
- **File/Paste Options**: 
  - Drag and drop image files containing QR codes
  - Upload QR code images from your device
  - Paste QR code images directly from clipboard (Ctrl+V)
- Instant decoding and result display

### User Interface
- Clean, modern design with professional styling
- Responsive layout that works on desktop and mobile devices
- Tab-based interface for easy switching between generator and scanner
- Dark mode toggle for comfortable use in any lighting condition

## 💻 Installation

No installation required! IntelliQR runs entirely in your browser.

### Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/intelliqr.git
   ```

2. Open `index.html` in your web browser.

That's it! No dependencies to install or servers to configure.

## 🔧 Usage

### Generating QR Codes
1. Select the "QR Generator" tab
2. Enter text or a URL in the input field
3. Click "Generate QR Code"
4. Click "Download QR Code" to save the image

### Scanning QR Codes
1. Select the "QR Scanner" tab
2. Choose your scanning method:
   - **Camera**: Allow camera access and point at a QR code
   - **File/Paste**: Either drag and drop an image, click to select a file, or paste an image from your clipboard (Ctrl+V)
3. View the decoded result below the scanner

## 🔍 How It Works

IntelliQR implements QR code technology with:

- **Generation**: Uses a JavaScript QR code library to handle data encoding, error correction (Reed-Solomon), versioning, module placement, masking, and format information
- **Canvas Rendering**: Displays QR codes using HTML5 Canvas
- **Scanning**: Processes video frames or images to detect, align, and decode QR codes
- **User Interface**: Built with vanilla JavaScript, HTML5, and CSS3 for maximum compatibility

## 🌙 Themes

Toggle between light and dark modes using the theme switch in the header. Your preference will be saved for your next visit.

## 📱 Compatibility

IntelliQR works on:
- 💻 Desktop: Chrome, Firefox, Safari, Edge
- 📱 Mobile: iOS and Android browsers with camera support
- 🔒 Requires HTTPS for camera access on most browsers

## 🛠️ Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Web APIs:
  - Canvas API
  - MediaDevices API (getUserMedia)
  - File API
  - Clipboard API

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ by [Diya Parashar](https://github.com/Diya-Parashar)
