# 🚀 Fcuk API Chrome Extension

> **The only Chrome extension you need for effortless, real-world API testing and load testing—right inside DevTools.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore/detail/your-extension-id)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sundramTech/api_performace_tester_x)

---

## 🌟 What is Fcuk API?

**Fcuk API** is a powerful Chrome extension that transforms how developers and testers work with APIs. It lives inside Chrome DevTools and provides:

- 🔍 **Automatic API Capture** - Captures all XHR/fetch requests as you use your web app
- 📝 **Dynamic Request Editing** - Auto-generates forms for POST/PUT request bodies (supports nested objects & arrays)
- ⚡ **Instant Load Testing** - Run performance tests with one click using k6
- 🎯 **Real-World Testing** - Test exactly what your app sends, not mock data
- 🚀 **Zero Setup** - Works immediately after installation

---

## 🎯 Why Fcuk API?

### For Developers 👩‍💻
- **Instant feedback** on API changes and performance
- **Debug with real data** - see exactly what your frontend sends
- **Catch performance issues** before they hit production
- **No more context switching** between tools

### For Testers 🧑‍🔬
- **Test real APIs** as they happen in the app
- **Edit and replay requests** with custom parameters
- **Run load tests** on staging/production instantly
- **Save hours** of manual testing and scripting

### For Teams 🧑‍💼
- **Faster QA cycles** and fewer bugs in production
- **Empowered teams** - devs and testers use the same tool
- **Better visibility** into API performance and reliability

---

## 🚀 Quick Start

### 1. Install the Extension
1. **From Chrome Web Store** (Recommended)
   - Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/your-extension-id)
   - Click "Add to Chrome"

2. **Manual Installation** (Development)
   ```bash
   git clone https://github.com/sundramTech/api_performace_tester_x.git
   cd api-tester-extension
   ```
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked" and select the extension folder

### 2. Set Up Backend (Optional - for Load Testing)
If you want to use the load testing feature:

1. **Deploy k6-runner to EC2:**
   ```bash
   # On your EC2 instance
   sudo apt update
   sudo apt install nodejs npm
   npm install express cors
   node k6-runner.js
   ```

2. **Update extension settings** to point to your EC2 instance

### 3. Start Testing!
1. Open Chrome DevTools
2. Go to the **"Fcuk API"** panel
3. Use your web app - APIs are automatically captured
4. Select an API and run tests!

---

## 🛠️ Features

### 🔍 **Smart API Capture**
- Automatically captures all XHR/fetch requests
- Filters out noise (images, CSS, etc.)
- Shows method, URL, and request details

### 📝 **Dynamic Request Editing**
- **Auto-generates forms** for POST/PUT request bodies
- **Supports nested objects** and arrays
- **Real-time editing** - no more raw JSON
- **Preserves original data** as defaults

### ⚡ **Instant Load Testing**
- **One-click load testing** with k6
- **Customizable parameters** (VUs, duration)
- **Real-time results** (requests/sec, errors, avg duration)
- **Performance insights** for optimization

### 🎨 **Developer-Friendly UI**
- **Clean, intuitive interface** in DevTools
- **Responsive design** that works on any screen
- **Professional styling** with Tailwind CSS

---

## 📖 Usage Guide

### Basic Workflow
1. **Open DevTools** → Go to "Fcuk API" panel
2. **Browse your app** - APIs are captured automatically
3. **Select an API** from the list
4. **Edit parameters** (for POST/PUT requests)
5. **Configure load test** (VUs, duration)
6. **Run test** and view results

### Advanced Features
- **Multiple API selection** - test multiple endpoints at once
- **Custom request bodies** - edit JSON parameters easily
- **Performance metrics** - detailed k6 results
- **Error handling** - clear feedback on failures

---

## 🏗️ Architecture

```
api-tester-extension/
├── manifest.json         # Extension configuration
├── panel.html            # Main UI
├── panel.js              # Core logic & API handling
├── devtools.js           # DevTools integration
├── devtools.html         # DevTools panel
├── background.js         # Background tasks
├── popup.html            # Extension popup
├── popup.js              # Popup logic
├── icons/                # Extension icons
└── utils/                # Helper utilities
```

### Key Components
- **manifest.json** - Extension configuration and permissions
- **panel.js** - Main logic for API capture, UI, and load testing
- **devtools.js** - Chrome DevTools integration
- **k6-runner.js** - Backend service for load testing (deployed separately)

---

## 🔧 Development

### Prerequisites
- Node.js (for backend)
- Chrome browser
- Basic knowledge of JavaScript/HTML

### Local Development
```bash
# Clone the repository
git clone https://github.com/sundramTech/api_performace_tester_x.git
cd api-tester-extension

# Load as unpacked extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this folder
```

### Backend Development
```bash
# Install dependencies
npm install express cors

# Run the k6-runner
node k6-runner.js
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/api_performace_tester_x.git
cd api-tester-extension
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-feature
   ```

### 3. Make Changes
- Write clear, well-documented code
- Follow existing code style
- Add tests if applicable

### 4. Commit & Push
```bash
   git add .
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### 5. Open Pull Request
- Describe your changes clearly
- Include screenshots if UI changes
- Link any related issues

---

## 📋 Roadmap

- [ ] **Authentication support** - Handle auth tokens automatically
- [ ] **Request history** - Save and replay previous requests
- [ ] **Team collaboration** - Share test results with team
- [ ] **Custom test scenarios** - Create complex test workflows
- [ ] **Integration with CI/CD** - Run tests in pipelines
- [ ] **Advanced metrics** - More detailed performance insights

---

## 🐛 Troubleshooting

### Common Issues

**Extension not capturing APIs?**
- Make sure you're on the "Fcuk API" panel in DevTools
- Check that the website uses XHR or fetch requests
- Verify the extension is enabled

**Load tests not working?**
- Check your backend (k6-runner) is running
- Verify the URL in panel.js points to your backend
- Check browser console for errors

**UI not loading properly?**
- Clear browser cache and reload
- Check for JavaScript errors in DevTools console
- Verify all files are present in the extension folder

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **k6** - For the amazing load testing engine
- **Chrome DevTools API** - For making this integration possible
- **Tailwind CSS** - For the beautiful UI components
- **The open-source community** - For inspiration and support

---

## 📞 Support

- **GitHub Issues** - [Report bugs or request features](https://github.com/sundramTech/api_performace_tester_x/issues)
- **Documentation** - Check this README and inline code comments
- **Community** - Join our discussions on GitHub

---

**Made with ❤️ by [Your Name]**

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/sundramTech/api_performace_tester_x?style=social)](https://github.com/sundramTech/api_performace_tester_x)

</div>