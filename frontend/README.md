# Voice Interview Frontend

React frontend application for the voice interview app.

## 🚀 Setup

```bash
# Install dependencies
npm install

# Set up environment
echo "REACT_APP_BACKEND_URL=http://localhost:3001" > .env

# Start development server
npm start
```

## 📁 Project Structure

```
src/
├── components/         # React components
│   ├── VoiceInput.jsx
│   ├── ChatDisplay.jsx
│   └── InterviewSelector.jsx
├── hooks/             # Custom React hooks  
│   ├── useChat.js
│   └── useTTS.js
├── services/          # API service layer
│   ├── llm.js         # LLM streaming
│   ├── tts.js         # Text-to-speech
│   ├── stt.js         # Speech-to-text
│   └── recorder.js    # Audio recording
└── App.js             # Main application
```

## 🔧 Configuration

**Environment Variables:**
- `REACT_APP_BACKEND_URL`: Backend API URL (default: http://localhost:3001)

## 📋 Available Scripts

- `npm start`: Development server (http://localhost:3000)
- `npm build`: Production build
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## 🎯 Features

- Real-time voice recording and playback
- Streaming LLM responses with typewriter effect
- Voice synthesis with multiple voice options
- Interview conversation management
- Comprehensive logging for debugging 