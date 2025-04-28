# ConvoConnect - Real-Time Video Streaming & Collaboration Platform

![Python](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-2.3-green) ![WebRTC](https://img.shields.io/badge/WebRTC-RealTime-orange) ![Socket.io](https://img.shields.io/badge/Socket.io-RealTimeChat-red)

## Overview
ConvoConnect is a sophisticated real-time video streaming and group calling web application capable of hosting over 100 participants simultaneously. The platform features an AI-powered live chat system (using Google Gemini 1.5 Flash), file sharing capabilities, screen recording functionality, dynamic participant list generation, and comprehensive session recording.

**Live Demo**: [https://convo-connect-iypz.onrender.com](https://convo-connect-iypz.onrender.com)

---

## ✨ Features

- **High-Capacity Video Conferencing**: Support for 100+ participants via WebRTC technology
- **Intelligent Chat System**:
  - Real-time messaging powered by Socket.io
  - AI assistance through Google Gemini 1.5 Flash integration
  - Rich emoji support for expressive communication
  - Secure file sharing capabilities
- **Comprehensive Recording**:
  - Screen capture and local saving
  - Complete chat history with timestamps
  - Google Drive integration for cloud storage
- **Dynamic User Management**:
  - Real-time participant list updates
  - User authentication and session tracking
- **Modern User Interface**:
  - Clean, responsive design
  - Intuitive controls and layouts

- NOTE: To use the AI in chat, call it as: jarvis!(your prompt). And currently, due to a new feature implementation, session recordings has been glitched.
---

## 🛠️ Technology Stack

| Component                   | Technology                                   |
|-----------------------------|--------------------------------------------|
| **Core Language**           | Python 3.9+                                |
| **Web Framework**           | Flask                                      |
| **Real-time Communication** | WebRTC, python-socketio                    |
| **AI Integration**          | Google Gemini 1.5 Flash                    |
| **Database**                | PostgreSQL / SQLite                        |
| **Frontend**                | HTML5, CSS, JavaScript                     |
| **File System Operations**  | os/sys Modules                             |
| **API Architecture**        | REST                                       |
| **Cloud Storage**           | Google Drive API                           |

---

## 🏗️ Architecture

ConvoConnect implements a sophisticated client-server architecture optimized for real-time communication:

### Selective Forwarding Unit (SFU) Architecture
For supporting 100+ participants efficiently, ConvoConnect uses the SFU approach:

- **Scalable Design**: Unlike mesh networking (which requires O(n²) connections), SFU centralizes stream management where each participant sends one stream to the server, which then selectively forwards appropriate streams to recipients.
- **Performance Optimization**: SFU forwards raw streams without re-encoding (unlike MCU architecture), significantly reducing server CPU load and latency—critical for large-scale real-time applications.
- **Adaptive Streaming**: Dynamically prioritizes active speakers and adjusts quality based on bandwidth availability.

### Implementation Note
The current implementation uses Agora's WebRTC API for video routing rather than a self-hosted SFU solution. This decision was made to ensure reliability without the infrastructure costs of deploying dedicated SFU servers. With sufficient server resources, the application can be migrated to a fully self-hosted SFU implementation like Janus or Mediasoup.

---

## 🚀 Installation Guide

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- Git
- SSL certificates for local HTTPS (for WebRTC functionality)

### API Keys Required
Before installation, you'll need to obtain:
1. **Agora API Key**: For WebRTC functionality ([Get Free Agora API Key](https://sso2.agora.io/en/v6/signup?sso_source_url=https%3A%2F%2Fwww.agora.io%2Fen%2Fpricing%2F))
2. **Google Gemini API Key**: For AI chat integration ([Get Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key))
3. **Google Cloud API**: For Drive integration ([Google Cloud Console](https://console.cloud.google.com/apis/))

### Windows Installation

```bash
# Clone the repository
git clone https://github.com/Siddharth-lal-13/ConvoConnect.git
cd ConvoConnect

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (PowerShell)
$env:FLASK_KEY="your-secret-key"
$env:AGORA_API="your-agora-api-key"
$env:GEMINI_API_KEY="your-gemini-api-key"
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Generate SSL certificates for local HTTPS
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Run the application
python main.py
```

### macOS/Linux Installation

```bash
# Clone the repository
git clone https://github.com/Siddharth-lal-13/ConvoConnect.git
cd ConvoConnect

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_KEY="your-secret-key"
export AGORA_API="your-agora-api-key"
export GEMINI_API_KEY="your-gemini-api-key"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Generate SSL certificates for local HTTPS
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Run the application
python main.py
```

### Docker Installation (Alternative)

```bash
# Clone the repository
git clone https://github.com/Siddharth-lal-13/ConvoConnect.git
cd ConvoConnect

# Build Docker image
docker build -t convoconnect .

# Run Docker container with environment variables
docker run -p 5000:5000 \
  -e FLASK_KEY="your-secret-key" \
  -e AGORA_API="your-agora-api-key" \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  -e GOOGLE_CLIENT_ID="your-google-client-id" \
  -e GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  convoconnect
```

---

## 📝 API Configuration Guide

### Agora WebRTC API
1. Create an account at [Agora.io](https://sso2.agora.io/en/v6/signup?sso_source_url=https%3A%2F%2Fwww.agora.io%2Fen%2Fpricing%2F)
2. Create a new project in the Agora Console
3. Copy your App ID to use as the `AGORA_API` environment variable

### Google Gemini API
1. Visit [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. Create or sign in to your Google account
3. Generate an API key
4. Use this key as the `GEMINI_API_KEY` environment variable

### Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/)
2. Create a new project
3. Enable the Google Drive API
4. Create OAuth 2.0 Client ID credentials
5. Set authorized redirect URIs to include your application's callback URL
6. Use the client ID and secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

---

## 🔜 Future Enhancements

- **Self-hosted SFU Implementation**: Replace third-party WebRTC services with dedicated SFU servers for enhanced control and cost optimization.
- **Advanced Bandwidth Management**: Implement adaptive quality and dynamic throttling for file sharing in low-bandwidth environments.
- **Enhanced AI Capabilities**: Expand Gemini integration with real-time sentiment analysis and automatic meeting summarization.
- **End-to-End Encryption**: Implement additional security layers for sensitive communications.
- **Custom Virtual Backgrounds**: Add support for AI-powered background replacement without greenscreens.

---

## 📄 License

Copyright (c) 2024 Siddharth-lal-13

This project is made available for **educational and non-commercial use only**.

You may:
- View and study this code
- Fork it for personal or academic learning
- Reference it with attribution

You may not:
- Use this project or any portion for commercial purposes
- Modify and redistribute it
- Deploy it publicly without explicit written permission from the author

For commercial licensing or collaboration inquiries, please contact: siddharthlal99@gmail.com

This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License.
See https://creativecommons.org/licenses/by-nc-nd/4.0/

---

## 👤 Author

**Developed by Siddharth Lal**  
- Email: [siddharthlal99@gmail.com](mailto:siddharthlal99@gmail.com)
- GitHub: [Siddharth-lal-13](https://github.com/Siddharth-lal-13)

Feel free to connect for collaboration or inquiries!
