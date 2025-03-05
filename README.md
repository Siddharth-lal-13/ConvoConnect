# ConvoConnect - Real-Time Video Streaming & Group Calling Web Application (Demo)

![Python](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-2.3-green) ![WebRTC](https://img.shields.io/badge/WebRTC-RealTime-orange) ![Socket.io](https://img.shields.io/badge/Socket.io-RealTimeChat-red)

## Overview
ConvoConnect is a robust, real-time video streaming and group calling web application capable of hosting over 100 participants simultaneously. This demo repository highlights the architecture and key features of the original project, including a live chat box powered by AI (Google Gemini 1.5 Flash) with emoji support, screen recording, participant list generation, and chat recording. The original application is hosted on Render at [https://convo-connect-iypz.onrender.com/](https://convo-connect-iypz.onrender.com/) (replace with your actual link).

**Note**: This repository is a sanitized demo showcasing design principles and select implementations, not the complete proprietary codebase.

---

## Features
- **Real-Time Video Streaming**: Supports 100+ participants via WebRTC.
- **Live Chat Box**: Powered by Socket.io (via `python-socketio`) for real-time messaging, with:
  - **AI Integration**: Google Gemini 1.5 Flash provides smart replies.
  - **Emoji Support**: Users can send emojis in chat.
  - **File Sharing**: Upload and share files with participants.
- **Screen Recording**: Captures and saves participant screens locally.
- **Participant List Generator**: Dynamically updates active users.
- **Chat Recorder**: Logs chat history with timestamps.
- **Hosted on Render**: Original app deployed at [https://convo-connect-iypz.onrender.com/](https://convo-connect-iypz.onrender.com/).

---

## Tech Stack
| Technology                   | Purpose                                      |
|------------------------------|----------------------------------------------|
| **Python 3.9+**              | Core programming language                   |
| **Flask**                    | Web framework for routing                   |
| **WebRTC**                   | Real-time video and audio streaming         |
| **python-socketio**          | Real-time chat with AI, emojis, and files   |
| **Google Gemini 1.5 Flash**  | AI-powered chat responses                  |
| **PostgreSQL**               | Database for users, sessions, and chat logs |
| **HTML5/CSS/JavaScript**     | Front-end interface                        |
| **NumPy**                    | Data processing for analytics              |
| **os/sys Modules**           | File system operations for recordings      |
| **REST APIs**                | Backend communication                      |

---

## Architecture
ConvoConnect uses a client-server architecture:
1. **Client**: HTML5/JavaScript frontend renders video, chat box (with emoji/file inputs), and participant list, using WebRTC and Socket.io.
2. **Server**: Flask handles routing and session management, with `python-socketio` enabling real-time chat. PostgreSQL stores user data and chat history.
3. **AI Module**: `ai_chat.py` simulates Gemini 1.5 Flash integration for smart chat replies.
4. **Recording**: `recorder.py` uses `os` to save chat logs and shared files to `recordings/`.

---

### Selective Forwarding Unit (SFU) in ConvoConnect
For a group calling application supporting 100+ participants, the Selective Forwarding Unit (SFU) architecture is the optimal choice over alternatives like Mesh or MCU (Multipoint Control Unit). Here’s why SFU shines for ConvoConnect:

- **Scalability**: Unlike Mesh (where each participant sends streams to all others, leading to O(n²) bandwidth usage), SFU centralizes stream management. Each participant sends their video/audio to the SFU server, which selectively forwards streams to others, reducing client-side bandwidth to O(n).
- **Efficiency**: Compared to MCU (which decodes, mixes, and re-encodes streams into a single feed), SFU forwards raw streams without re-encoding, minimizing server CPU load and latency—critical for real-time performance with 100+ users.
- **Flexibility**: SFU allows dynamic stream selection (e.g., prioritizing active speakers), aligning with ConvoConnect’s participant list and screen-sharing features.
- **Implementation**: In the original project, WebRTC integrates with an SFU topology (e.g., via a service like Janus or Mediasoup, though not detailed in this demo), ensuring robust video delivery.

This SFU-driven design makes ConvoConnect ideal for large-scale, interactive video conferencing with minimal resource overhead.

---

## Limitations
- This demo omits proprietary WebRTC/SFU and Gemini API details.
- File sharing and screen recording are simplified to text outputs.
- Full scalability (100+ users) is not testable in this local setup.

---

## Future Enhancements
- Integrate a production SFU server (e.g., Janus) for enhanced video routing.
- Add bandwidth throttling for file sharing.
- Expand AI capabilities with real-time sentiment analysis.

---

## Author
**Developed by Siddharth Lal**  
- Email: [siddharthlal99@gmail.com](mailto:siddharthlal99@gmail.com)

Feel free to connect for collaboration or inquiries!