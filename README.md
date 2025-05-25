# Voice Interview Application

A comprehensive voice-based interview practice application with AI-powered conversations, featuring secure backend session management and real-time audio processing.

## 🏗️ Architecture

```
talking/
├── frontend/          # React application (session-aware, no sensitive data)
│   ├── src/
│   │   ├── services/  # API clients (sessions, interviews, llm, tts, stt)
│   │   ├── hooks/     # React hooks (useChat with session management, useTTS)
│   │   ├── components/# UI components (InterviewSelector, VoiceInput, ChatDisplay)
│   │   └── pages/     # Main pages (InterviewPage)
│   └── package.json
├── backend/           # Node.js API server (session storage, Azure keys, interview prompts)
│   ├── config/        # Interview configurations and prompts
│   ├── server.js      # Express server with session management
│   └── package.json
└── README.md
```

## 🚀 Features

### Session Management
- **Backend Session Storage**: All conversation history stored server-side
- **Session Lifecycle**: Create → Add Messages → Retrieve → End
- **Data Persistence**: Sessions survive page refreshes and network interruptions
- **Security**: Interview prompts and conversation history never exposed to frontend
- **Scalability**: Ready for database integration and analytics

### Interview System
- **Multiple Interview Types**: Product Sense, Scrum Master, Behavioral, Technical PM
- **Dynamic Configuration**: Interview types and prompts loaded from backend
- **Server-side Prompts**: System prompts secured on backend, not exposed to client
- **Contextual Responses**: LLM uses full session history for coherent conversations

### Voice Processing
- **Real-time STT**: Azure Whisper for speech-to-text conversion
- **Natural TTS**: Azure OpenAI TTS with typing effect synchronization
- **Interruption Handling**: Seamless interruption and continuation of conversations
- **Audio Management**: Comprehensive cleanup and resource management

### Security & Performance
- **API Key Protection**: All Azure credentials secured on backend
- **Reduced Payload**: Only UI-relevant data sent to frontend
- **Comprehensive Logging**: Detailed performance and error tracking
- **Error Resilience**: Graceful handling of network and service failures

## 🛠️ Setup

### Prerequisites
- Node.js 18+ and npm
- Azure OpenAI account with deployments for:
  - LLM (e.g., gpt-4)
  - TTS (e.g., tts-1)
  - STT (e.g., whisper-1)

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-04-01-preview
AZURE_OPENAI_LLM_DEPLOYMENT=your-llm-deployment
AZURE_OPENAI_TTS_DEPLOYMENT=your-tts-deployment
AZURE_OPENAI_STT_DEPLOYMENT=your-stt-deployment

# Server Configuration
PORT=3001
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
# Backend API Configuration
REACT_APP_BACKEND_URL=http://localhost:3001
```

Start frontend:
```bash
npm start
```

## 📡 API Endpoints

### Session Management
- `POST /api/interviews/sessions` - Create new interview session
- `POST /api/interviews/sessions/:id/messages` - Add message to session
- `GET /api/interviews/sessions/:id` - Get session data
- `GET /api/interviews/sessions/:id/messages` - Get session messages
- `DELETE /api/interviews/sessions/:id` - End session

### Interview Configuration
- `GET /api/interviews` - List available interview types
- `GET /api/interviews/:id` - Get interview configuration

### AI Services
- `POST /api/llm/stream` - Stream LLM responses (uses session history)
- `POST /api/tts` - Text-to-speech conversion
- `POST /api/stt` - Speech-to-text transcription

### Health Check
- `GET /health` - Service health and configuration status

## 🔄 Session Flow

1. **Session Creation**: Frontend creates session on backend with interview type
2. **Message Storage**: All user and interviewer messages stored in backend session
3. **LLM Context**: Backend uses full session history for LLM requests
4. **UI Updates**: Frontend receives only response streams, session handles persistence
5. **Session End**: Cleanup and session completion tracking

## 🎯 Usage

1. **Start Application**: Both backend (port 3001) and frontend (port 3000)
2. **Select Interview**: Choose from available interview types
3. **Voice Interaction**: Click microphone to speak, AI responds with voice
4. **Session Persistence**: Conversation history maintained throughout session
5. **End Interview**: Clean session termination with analytics data

## 🔧 Development

### Session Management Integration
The application uses a comprehensive session management system:

```javascript
// Frontend: Create session and manage conversation
const { sessionId, addUserMessage, generateInterviewerResponse } = useChat();

// Backend: Session storage and LLM integration
const session = interviewSessions.get(sessionId);
const messages = session.messages.map(msg => ({ role: msg.role, content: msg.text }));
```

### Error Handling
- **Network Resilience**: Retry logic and graceful degradation
- **Session Recovery**: Automatic session restoration on reconnection
- **User Feedback**: Clear error messages and recovery suggestions

### Performance Monitoring
- **Render Tracking**: Frontend render performance monitoring
- **API Metrics**: Response times and payload sizes
- **Memory Management**: Comprehensive cleanup and resource management

## 🚀 Deployment

### Backend Deployment
- Configure environment variables for production Azure resources
- Set up database for session persistence (currently in-memory)
- Configure CORS for production frontend domain
- Set up monitoring and logging infrastructure

### Frontend Deployment
- Build production bundle: `npm run build`
- Configure `REACT_APP_BACKEND_URL` for production backend
- Deploy to static hosting (Netlify, Vercel, etc.)

## 📊 Monitoring

The application includes comprehensive logging:
- **Session Lifecycle**: Creation, message addition, completion
- **Performance Metrics**: Response times, payload sizes, render performance
- **Error Tracking**: Detailed error context and recovery paths
- **User Analytics**: Interview completion rates and interaction patterns

## 🔐 Security

- **API Key Protection**: All sensitive credentials on backend only
- **Session Isolation**: Each session isolated with unique identifiers
- **Input Validation**: Comprehensive validation of all user inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
