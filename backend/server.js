const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { AzureOpenAI } = require('openai');
const { interviewTypes, questionBanks, interviewPrompts } = require('./config/interviews');
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

// In-memory storage for interview sessions (in production, use a database)
const interviewSessions = new Map();

// Generate unique session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get random question from question bank
function getRandomQuestion(interviewType, excludeQuestionIds = []) {
  const questionBank = questionBanks[interviewType];
  if (!questionBank) {
    throw new Error(`No question bank found for interview type: ${interviewType}`);
  }

  // Flatten all questions from all categories
  const allQuestions = [];
  Object.values(questionBank.categories).forEach(categoryQuestions => {
    allQuestions.push(...categoryQuestions);
  });

  // Filter out excluded questions
  const availableQuestions = allQuestions.filter(q => !excludeQuestionIds.includes(q.id));
  
  if (availableQuestions.length === 0) {
    throw new Error('No more questions available in the question bank');
  }

  // Return random question
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

// Parse LLM commands from response
function parseLLMCommands(text) {
  const commands = [];
  
  // Check for SWITCH_QUESTION command
  const switchMatch = text.match(/\[SWITCH_QUESTION:\s*([^\]]+)\]/i);
  if (switchMatch) {
    commands.push({
      type: 'SWITCH_QUESTION',
      reason: switchMatch[1].trim()
    });
  }

  return commands;
}

// Clean response text by removing command syntax
function cleanResponseText(text) {
  return text
    .replace(/\[SWITCH_QUESTION:\s*[^\]]+\]/gi, '')
    .trim();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      llm: !!LLM_DEPLOYMENT,
      tts: !!TTS_DEPLOYMENT,
      stt: !!STT_DEPLOYMENT,
      interviews: true,
      questionBanks: Object.keys(questionBanks).length
    }
  });
});

// Interview API Endpoints

// Get all available interview types
app.get('/api/interviews', (req, res) => {
  res.json({
    success: true,
    data: interviewTypes,
    count: interviewTypes.length
  });
});

// Get specific interview configuration
app.get('/api/interviews/:interviewId', (req, res) => {
  const { interviewId } = req.params;
  
  const interviewType = interviewTypes.find(type => type.id === interviewId);
  const interviewPrompt = interviewPrompts[interviewId];

  if (!interviewType || !interviewPrompt) {
    console.error('Interview type not found:', interviewId);
    return res.status(404).json({
      success: false,
      error: 'Interview type not found',
      availableTypes: interviewTypes.map(t => t.id)
    });
  }

  res.json({
    success: true,
    data: {
      ...interviewType,
      configuration: {
        systemPrompt: interviewPrompt.systemPrompt,
        initialQuestion: interviewPrompt.initialQuestion
      }
    }
  });
});

// LLM Streaming Endpoint with command processing
app.post('/api/llm/stream', async (req, res) => {
  const { userMessage, sessionId, options = {}, interviewId } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Get session history
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    let systemMessage = options.systemMessage;
    
    // If interview ID is provided and no custom system message, use interview prompt
    if (interviewId && !systemMessage) {
      const interviewPrompt = interviewPrompts[interviewId];
      if (interviewPrompt) {
        systemMessage = interviewPrompt.systemPrompt;
      }
    }
    
    const defaultSystemMessage = "You are a helpful AI assistant having a voice conversation. Keep your responses concise and conversational.";
    
    // Build messages from session history
    const messages = [
      { role: "system", content: systemMessage || defaultSystemMessage },
      ...session.messages.map(msg => ({ 
        role: msg.role === 'candidate' ? 'user' : 'assistant', 
        content: msg.text 
      })),
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
    let fullResponse = '';
    for await (const part of response) {
      const content = part.choices[0]?.delta?.content || '';
      if (content) {
        chunkCount++;
        fullResponse += content;
        res.write(content);
      }
    }

    res.end();

    // Parse commands from LLM response
    const commands = parseLLMCommands(fullResponse);
    const cleanedResponse = cleanResponseText(fullResponse);

    // Add the user message to session history
    session.messages.push({
      id: Math.random().toString(36).slice(2, 11),
      role: 'candidate',
      text: userMessage,
      timestamp: new Date().toISOString(),
      metadata: {}
    });

    // Add the assistant response to session history (cleaned version)
    session.messages.push({
      id: Math.random().toString(36).slice(2, 11),
      role: 'interviewer',
      text: cleanedResponse,
      timestamp: new Date().toISOString(),
      metadata: { 
        chunkCount,
        commands: commands,
        originalResponse: fullResponse
      }
    });

    // Process commands
    for (const command of commands) {
      if (command.type === 'SWITCH_QUESTION') {
        try {
          // Get list of used question IDs
          const usedQuestionIds = session.usedQuestions || [];
          
          // Get new random question
          const newQuestion = getRandomQuestion(session.interviewType, usedQuestionIds);
          
          // Update session with new question
          session.currentQuestion = newQuestion;
          session.usedQuestions = [...usedQuestionIds, newQuestion.id];
          
          // Add system message about new question
          session.messages.push({
            id: Math.random().toString(36).slice(2, 11),
            role: 'system',
            text: `Question switched: ${newQuestion.question}`,
            timestamp: new Date().toISOString(),
            metadata: { 
              command: 'SWITCH_QUESTION',
              questionId: newQuestion.id,
              reason: command.reason
            }
          });

        } catch (error) {
          console.error('Error switching question:', error.message);
        }
      }
    }

    session.updatedAt = new Date().toISOString();

  } catch (error) {
    console.error('LLM stream error:', error.message);

    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'nova' } = req.body;

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

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.byteLength
    });
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('TTS error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// STT Endpoint
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  const { language = 'en' } = req.body;

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
    res.json({ text: transcribedText });

  } catch (error) {
    console.error('STT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Interview session endpoints
app.post('/api/interviews/sessions', (req, res) => {
  const { interviewType } = req.body;
  
  try {
    const sessionId = generateSessionId();
    
    // Get initial random question
    const initialQuestion = getRandomQuestion(interviewType, []);
    
    const session = {
      id: sessionId,
      interviewType,
      messages: [],
      currentQuestion: initialQuestion,
      usedQuestions: [initialQuestion.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    interviewSessions.set(sessionId, session);

    res.json({
      sessionId,
      interviewType,
      createdAt: session.createdAt,
      initialQuestion: initialQuestion
    });
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ error: 'Failed to create interview session' });
  }
});

app.post('/api/interviews/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const { role, text, metadata = {} } = req.body;
  
  try {
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const message = {
      id: Math.random().toString(36).slice(2, 11),
      role, // 'interviewer' or 'candidate'
      text,
      timestamp: new Date().toISOString(),
      metadata // For storing additional info like audio duration, interruptions, etc.
    };

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    res.json({
      messageId: message.id,
      messagesCount: session.messages.length
    });
  } catch (error) {
    console.error('Error adding message:', error.message);
    res.status(500).json({ error: 'Failed to add message to session' });
  }
});

app.delete('/api/interviews/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    res.json({
      sessionId,
      status: 'completed',
      messagesCount: session.messages.length,
      duration: new Date(session.endedAt) - new Date(session.createdAt)
    });
  } catch (error) {
    console.error('Error ending session:', error.message);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 