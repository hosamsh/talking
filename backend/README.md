# Voice Interview Backend

This backend server provides secure API endpoints for Azure OpenAI services, keeping API keys on the server side.

## 🚀 Quick Setup

### 1. Environment Configuration

1. Copy your Azure OpenAI credentials from the frontend `.env` file
2. Create a `.env` file in this backend directory:

```bash
# Azure OpenAI Configuration (remove REACT_APP_ prefixes)
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
AZURE_OPENAI_API_VERSION=2024-04-01-preview
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_LLM_DEPLOYMENT=your_llm_deployment_name
AZURE_OPENAI_TTS_DEPLOYMENT=your_tts_deployment_name
AZURE_OPENAI_STT_DEPLOYMENT=your_stt_deployment_name

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 2. Start the Backend

```bash
# Install dependencies (already done)
npm install

# Start the server
npm start
```

### 3. Update Frontend Environment

Add this to your frontend `.env` file:
```bash
REACT_APP_BACKEND_URL=http://localhost:3001
```

## 📋 API Endpoints

- **Health Check**: `GET /health`
- **LLM Streaming**: `POST /api/llm/stream`
- **Text-to-Speech**: `POST /api/tts`
- **Speech-to-Text**: `POST /api/stt`

## 🔧 Features

- ✅ **Secure**: API keys never exposed to frontend
- ✅ **Streaming**: Real-time LLM responses
- ✅ **CORS Enabled**: Works with React frontend
- ✅ **File Upload**: Handles audio files for STT
- ✅ **Comprehensive Logging**: Full request/response tracking
- ✅ **Error Handling**: Proper HTTP status codes

## 🚀 Production Deployment

For production, deploy to platforms like:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS/Azure/GCP

Make sure to set environment variables in your hosting platform. 