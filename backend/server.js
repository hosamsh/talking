const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { AzureOpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (STT)
const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Azure OpenAI Configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
const API_KEY = process.env.AZURE_OPENAI_API_KEY;
const LLM_DEPLOYMENT = process.env.AZURE_OPENAI_LLM_DEPLOYMENT;
const TTS_DEPLOYMENT = process.env.AZURE_OPENAI_TTS_DEPLOYMENT;
const STT_DEPLOYMENT = process.env.AZURE_OPENAI_STT_DEPLOYMENT;

// Initialize Azure OpenAI client
const azureClient = new AzureOpenAI({
  endpoint: AZURE_ENDPOINT,
  apiKey: API_KEY,
  deployment: LLM_DEPLOYMENT,
  apiVersion: API_VERSION || "2024-04-01-preview"
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      llm: !!LLM_DEPLOYMENT,
      tts: !!TTS_DEPLOYMENT,
      stt: !!STT_DEPLOYMENT
    }
  });
});

// LLM Streaming Endpoint
app.post('/api/llm/stream', async (req, res) => {
  const { userMessage, previousMessages = [], options = {} } = req.body;
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();

  console.log('🤖 BACKEND LLM: Starting streaming request', {
    requestId,
    userMessageLength: userMessage?.length || 0,
    previousMessagesCount: previousMessages.length,
    timestamp: new Date().toISOString()
  });

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const defaultSystemMessage = "You are a helpful AI assistant having a voice conversation. Keep your responses concise and conversational.";
    
    const messages = [
      { role: "system", content: options.systemMessage || defaultSystemMessage },
      ...previousMessages.map(msg => ({ role: msg.role, content: msg.text })),
      { role: "user", content: userMessage }
    ];

    const response = await azureClient.chat.completions.create({
      messages,
      stream: true,
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7,
      model: LLM_DEPLOYMENT
    });

    let chunkCount = 0;
    for await (const part of response) {
      const content = part.choices[0]?.delta?.content || '';
      if (content) {
        chunkCount++;
        res.write(content);
      }
    }

    res.end();

    console.log('🤖 BACKEND LLM: Stream completed', {
      requestId,
      responseTime: `${Date.now() - startTime}ms`,
      chunksCount: chunkCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🤖 BACKEND LLM: Stream failed', {
      requestId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'nova' } = req.body;
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();

  console.log('🌐 BACKEND TTS: Starting request', {
    requestId,
    textLength: text?.length || 0,
    voice,
    timestamp: new Date().toISOString()
  });

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const response = await axios({
      method: 'post',
      url: `${AZURE_ENDPOINT}/openai/deployments/${TTS_DEPLOYMENT}/audio/speech?api-version=${API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: TTS_DEPLOYMENT,
        input: text,
        voice: voice
      },
      responseType: 'arraybuffer'
    });

    console.log('🌐 BACKEND TTS: Request successful', {
      requestId,
      responseTime: `${Date.now() - startTime}ms`,
      responseSize: `${(response.data.byteLength / 1024).toFixed(2)}KB`,
      timestamp: new Date().toISOString()
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.byteLength
    });
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('🌐 BACKEND TTS: Request failed', {
      requestId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ error: error.message });
  }
});

// STT Endpoint
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = Date.now();
  const audioFile = req.file;
  const { language = 'en' } = req.body;

  console.log('🎵 BACKEND STT: Starting transcription', {
    requestId,
    audioSize: audioFile ? `${(audioFile.size / 1024).toFixed(2)}KB` : 'No file',
    language,
    timestamp: new Date().toISOString()
  });

  if (!audioFile) {
    return res.status(400).json({ error: 'audio file is required' });
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioFile.buffer], { type: audioFile.mimetype }), audioFile.originalname);
    formData.append('language', language);

    const response = await axios.post(
      `${AZURE_ENDPOINT}/openai/deployments/${STT_DEPLOYMENT}/audio/transcriptions?api-version=2024-02-01`,
      formData,
      {
        headers: {
          'api-key': API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const transcribedText = response.data.text || '';

    console.log('🎵 BACKEND STT: Transcription successful', {
      requestId,
      responseTime: `${Date.now() - startTime}ms`,
      transcribedLength: transcribedText.length,
      timestamp: new Date().toISOString()
    });

    res.json({ text: transcribedText });

  } catch (error) {
    console.error('🎵 BACKEND STT: Transcription failed', {
      requestId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 