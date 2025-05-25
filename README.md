# Voice Interview App

A voice-enabled interview application with real-time conversation capabilities using Azure OpenAI services.

## 🏗️ Project Structure

```
talking/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
├── backend/           # Node.js backend API
│   ├── server.js
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
# Add your Azure OpenAI credentials to .env file
npm start
```

### Frontend Setup  
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

**Backend (.env):**
- Azure OpenAI credentials (endpoint, API key, deployments)
- Server configuration

**Frontend (.env):**
- `REACT_APP_BACKEND_URL=http://localhost:3001`

## 📋 Features

- 🎤 **Voice Input**: Real-time speech-to-text
- 🗣️ **Voice Output**: Text-to-speech responses  
- 💬 **LLM Chat**: Streaming conversations with Azure OpenAI
- 🔒 **Secure**: API keys protected on backend
- 📊 **Logging**: Comprehensive request/response tracking

## 🛠️ Tech Stack

- **Frontend**: React, Web Audio API
- **Backend**: Node.js, Express, Azure OpenAI SDK
- **Services**: Azure OpenAI (GPT, TTS, Whisper)
