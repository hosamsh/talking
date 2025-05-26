const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { AzureOpenAI } = require('openai');
const { interviewTypes, questionBanks, interviewPrompts } = require('./config/interviews');
const { debugLogger } = require('./middleware/debugLogger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(debugLogger);

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

// Note: Command parsing is now handled via function calls instead of text parsing

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
        welcomeMessage: interviewPrompt.welcomeMessage
      }
    }
  });
});

// LLM Streaming Endpoint with command processing
app.post('/api/llm/stream', async (req, res) => {
  const { userMessage, sessionId, options = {}, interviewId } = req.body;

  console.log('🤖 LLM STREAM ENDPOINT: Called with', {
    userMessage: userMessage?.substring(0, 100) + '...',
    sessionId,
    interviewId,
    options,
    timestamp: new Date().toISOString()
  });

  if (!userMessage) {
    console.error('🤖 LLM STREAM ENDPOINT: Missing userMessage');
    return res.status(400).json({ error: 'userMessage is required' });
  }

  if (!sessionId) {
    console.error('🤖 LLM STREAM ENDPOINT: Missing sessionId');
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Get session history
    const session = interviewSessions.get(sessionId);
    if (!session) {
      console.error('🤖 LLM STREAM ENDPOINT: Session not found', { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('🤖 LLM STREAM ENDPOINT: Session found', {
      sessionId,
      messageCount: session.messages.length,
      interviewType: session.interviewType,
      status: session.status
    });

    // Check if interview has already ended
    if (session.status === 'ended_by_interviewer' || session.status === 'completed') {
      console.log('🛑 LLM STREAM ENDPOINT: Interview already ended, sending end message', {
        sessionId,
        status: session.status,
        endReason: session.endReason,
        timestamp: new Date().toISOString()
      });

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const endMessage = "This interview has already concluded. Thank you for your time.";
      res.write(endMessage);
      res.end();

      // Add the user message to session history
      session.messages.push({
        id: Math.random().toString(36).slice(2, 11),
        role: 'candidate',
        text: userMessage,
        timestamp: new Date().toISOString(),
        metadata: { afterInterviewEnd: true }
      });

      // Add the end response to session history
      session.messages.push({
        id: Math.random().toString(36).slice(2, 11),
        role: 'interviewer',
        text: endMessage,
        timestamp: new Date().toISOString(),
        metadata: { 
          isEndMessage: true,
          originalEndReason: session.endReason
        }
      });

      session.updatedAt = new Date().toISOString();
      return;
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
        console.log('🤖 LLM STREAM ENDPOINT: Using interview system prompt', {
          interviewId,
          systemPromptLength: systemMessage.length
        });
      } else {
        console.warn('🤖 LLM STREAM ENDPOINT: Interview prompt not found', { interviewId });
      }
    } else if (!interviewId) {
      console.warn('🤖 LLM STREAM ENDPOINT: No interview ID provided');
    }
    
    const defaultSystemMessage = "You are a helpful AI assistant having a voice conversation. Keep your responses concise and conversational.";
    const finalSystemMessage = systemMessage || defaultSystemMessage;
    
    console.log('🤖 LLM STREAM ENDPOINT: Final system message', {
      isInterviewPrompt: !!systemMessage,
      isDefault: !systemMessage,
      messageLength: finalSystemMessage.length,
      preview: finalSystemMessage.substring(0, 100) + '...'
    });
    
    // Build messages from session history
    const messages = [
      { role: "system", content: finalSystemMessage },
      ...session.messages.map(msg => ({ 
        role: msg.role === 'candidate' ? 'user' : 'assistant', 
        content: msg.text 
      })),
      { role: "user", content: userMessage }
    ];

    console.log('🤖 LLM STREAM ENDPOINT: Built message array', {
      totalMessages: messages.length,
      systemMessage: messages[0].content.substring(0, 100) + '...',
      historyMessages: messages.length - 2,
      userMessage: userMessage.substring(0, 100) + '...'
    });

    // Define function tools for interview control
    const tools = [
      {
        type: "function",
        function: {
          name: "switch_question",
          description: "Switch to a different question when the current one is not working well",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "The reason for switching questions"
              }
            },
            required: ["reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "end_interview",
          description: "End the interview when the candidate is not suitable or other ending conditions are met",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "The reason for ending the interview"
              }
            },
            required: ["reason"]
          }
        }
      }
    ];

    console.log('🤖 LLM STREAM ENDPOINT: Calling Azure OpenAI with function tools', {
      sessionId: sessionId.substring(0, 8) + '...',
      messageCount: messages.length,
      model: LLM_DEPLOYMENT,
      maxTokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7,
      toolsCount: tools.length
    });

    const response = await azureClient.chat.completions.create({
      messages,
      tools,
      tool_choice: "auto",
      stream: true,
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7,
      model: LLM_DEPLOYMENT
    });

    console.log('🤖 LLM STREAM ENDPOINT: Azure OpenAI response received, starting stream');

        let chunkCount = 0;
    let fullResponse = '';
    let toolCalls = [];
    
    for await (const part of response) {
      const choice = part.choices[0];
      const content = choice?.delta?.content || '';
      const toolCallDeltas = choice?.delta?.tool_calls || [];
      
      // Handle regular content
      if (content) {
        chunkCount++;
        fullResponse += content;
        res.write(content);
      }
      
      // Handle tool calls
      if (toolCallDeltas.length > 0) {
        for (const toolCallDelta of toolCallDeltas) {
          const index = toolCallDelta.index;
          
          // Initialize tool call if it doesn't exist
          if (!toolCalls[index]) {
            toolCalls[index] = {
              id: toolCallDelta.id || '',
              type: toolCallDelta.type || 'function',
              function: {
                name: '',
                arguments: ''
              }
            };
          }
          
          // Update tool call with delta
          if (toolCallDelta.id) {
            toolCalls[index].id = toolCallDelta.id;
          }
          if (toolCallDelta.function?.name) {
            toolCalls[index].function.name += toolCallDelta.function.name;
          }
          if (toolCallDelta.function?.arguments) {
            toolCalls[index].function.arguments += toolCallDelta.function.arguments;
          }
        }
      }
    }

    console.log('🤖 LLM STREAM ENDPOINT: Stream completed', {
      sessionId: sessionId.substring(0, 8) + '...',
      chunkCount,
      responseLength: fullResponse.length,
      responsePreview: fullResponse.substring(0, 100) + '...',
      toolCallsCount: toolCalls.length,
      toolCallsDetails: toolCalls.map(tc => ({ name: tc.function?.name, args: tc.function?.arguments }))
    });

    // Process function calls to determine if we need to send default response text
    const commands = [];
    for (const toolCall of toolCalls) {
      if (toolCall.function?.name && toolCall.function?.arguments) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'switch_question') {
            commands.push({
              type: 'SWITCH_QUESTION',
              reason: args.reason || 'No reason provided'
            });
          } else if (toolCall.function.name === 'end_interview') {
            commands.push({
              type: 'END_INTERVIEW',
              reason: args.reason || 'No reason provided'
            });
          }
        } catch (error) {
          console.error('❌ ERROR PARSING FUNCTION CALL ARGUMENTS', {
            sessionId,
            functionName: toolCall.function.name,
            arguments: toolCall.function.arguments,
            error: error.message
          });
        }
      }
    }

    // If there's no text content but there are function calls, send default response through stream
    if (!fullResponse.trim() && commands.length > 0) {
      let defaultResponse = '';
      if (commands.some(cmd => cmd.type === 'END_INTERVIEW')) {
        defaultResponse = "Thank you for your time. This concludes our interview.";
      } else if (commands.some(cmd => cmd.type === 'SWITCH_QUESTION')) {
        defaultResponse = "Let me ask you a different question.";
      }
      
      if (defaultResponse) {
        console.log('🤖 LLM STREAM ENDPOINT: Sending default response for function call', {
          sessionId: sessionId.substring(0, 8) + '...',
          defaultResponse,
          commandTypes: commands.map(c => c.type)
        });
        res.write(defaultResponse);
        fullResponse = defaultResponse;
        chunkCount = 1;
      }
    }

    res.end();

    // Log function calls for session updates
    for (const command of commands) {
      if (command.type === 'SWITCH_QUESTION') {
        console.log('🔄 LLM FUNCTION CALL: switch_question', {
          sessionId,
          reason: command.reason,
          timestamp: new Date().toISOString()
        });
      } else if (command.type === 'END_INTERVIEW') {
        console.log('🛑 LLM FUNCTION CALL: end_interview', {
          sessionId,
          reason: command.reason,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const cleanedResponse = fullResponse; // No need to clean text anymore
    
    // Log command processing summary
    if (commands.length > 0) {
      console.log('📋 LLM COMMAND PROCESSING SUMMARY', {
        sessionId,
        commandCount: commands.length,
        commandTypes: commands.map(c => c.type),
        interviewType: session.interviewType,
        messageCount: session.messages.length,
        timestamp: new Date().toISOString()
      });
    }

    // Add the user message to session history
    session.messages.push({
      id: Math.random().toString(36).slice(2, 11),
      role: 'candidate',
      text: userMessage,
      timestamp: new Date().toISOString(),
      metadata: {}
    });

    // Add the assistant response to session history (cleaned version)
    // If there's no text content but there are function calls, provide a default response
    let responseText = cleanedResponse;
    if (!responseText.trim() && commands.length > 0) {
      if (commands.some(cmd => cmd.type === 'END_INTERVIEW')) {
        responseText = "Thank you for your time. This concludes our interview.";
      } else if (commands.some(cmd => cmd.type === 'SWITCH_QUESTION')) {
        responseText = "Let me ask you a different question.";
      }
    }
    
    session.messages.push({
      id: Math.random().toString(36).slice(2, 11),
      role: 'interviewer',
      text: responseText,
      timestamp: new Date().toISOString(),
      metadata: { 
        chunkCount,
        commands: commands,
        originalResponse: fullResponse,
        hadFunctionCallsOnly: !cleanedResponse.trim() && commands.length > 0
      }
    });

    // Process commands
    for (const command of commands) {

      // Interviewer LLM wants another question
      if (command.type === 'SWITCH_QUESTION') {
        try {
          console.log('🔄 PROCESSING SWITCH_QUESTION COMMAND', {
            sessionId,
            reason: command.reason,
            currentQuestionId: session.currentQuestion?.id,
            usedQuestionsCount: session.usedQuestions?.length || 0,
            timestamp: new Date().toISOString()
          });

          // Get list of used question IDs
          const usedQuestionIds = session.usedQuestions || [];
          
          // Get new random question
          const newQuestion = getRandomQuestion(session.interviewType, usedQuestionIds);
          
          // Update session with new question
          session.currentQuestion = newQuestion;
          session.usedQuestions = [...usedQuestionIds, newQuestion.id];
          
          console.log('✅ QUESTION SWITCHED SUCCESSFULLY', {
            sessionId,
            newQuestionId: newQuestion.id,
            newQuestionPreview: newQuestion.question.substring(0, 100) + '...',
            totalUsedQuestions: session.usedQuestions.length,
            timestamp: new Date().toISOString()
          });
          
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
          console.error('❌ ERROR SWITCHING QUESTION', {
            sessionId,
            error: error.message,
            reason: command.reason,
            timestamp: new Date().toISOString()
          });
        }
      } 
      // Interviewer LLM wants to end the interview
      else if (command.type === 'END_INTERVIEW') {
        try {
          console.log('🛑 PROCESSING END_INTERVIEW COMMAND', {
            sessionId,
            reason: command.reason,
            interviewType: session.interviewType,
            messageCount: session.messages.length,
            duration: new Date() - new Date(session.createdAt),
            timestamp: new Date().toISOString()
          });

          // Update session status
          session.status = 'ended_by_interviewer';
          session.endedAt = new Date().toISOString();
          session.endReason = command.reason;
          
          // Add system message about interview end
          session.messages.push({
            id: Math.random().toString(36).slice(2, 11),
            role: 'system',
            text: `Interview ended by interviewer: ${command.reason}`,
            timestamp: new Date().toISOString(),
            metadata: { 
              command: 'END_INTERVIEW',
              reason: command.reason,
              finalMessageCount: session.messages.length
            }
          });

          console.log('✅ INTERVIEW ENDED SUCCESSFULLY', {
            sessionId,
            endReason: command.reason,
            finalStatus: session.status,
            totalMessages: session.messages.length,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('❌ ERROR ENDING INTERVIEW', {
            sessionId,
            error: error.message,
            reason: command.reason,
            timestamp: new Date().toISOString()
          });
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
app.post('/api/interviews/sessions', async (req, res) => {
  const { interviewType } = req.body;
  
  console.log('📝 SESSION CREATION: Starting', {
    interviewType,
    timestamp: new Date().toISOString()
  });
  
  try {
    const sessionId = generateSessionId();
    const createdAt = new Date().toISOString();
    
    console.log('📝 SESSION CREATION: Generated session ID', { sessionId });
    
    // Get initial random question
    const initialQuestion = getRandomQuestion(interviewType, []);
    
    // Create session
    const session = {
      id: sessionId,
      interviewType,
      messages: [],
      currentQuestion: initialQuestion,
      usedQuestions: [initialQuestion.id],
      createdAt,
      updatedAt: createdAt,
      status: 'active'
    };

    interviewSessions.set(sessionId, session);

    // Get interview configuration and system prompt
    const interviewPrompt = interviewPrompts[interviewType];
    if (!interviewPrompt) {
      throw new Error(`Interview prompt not found for type: ${interviewType}`);
    }

    // Create initialization message for LLM with timestamp and question
    const initializationPrompt = `Interview started at ${createdAt}. 

Please begin the interview with a warm welcome and then ask this question: "${initialQuestion.question}"

Remember to be conversational and encouraging while maintaining professionalism.`;

    // Initialize conversation with LLM to get welcome message
    const response = await azureClient.chat.completions.create({
      messages: [
        { role: "system", content: interviewPrompt.systemPrompt },
        { role: "user", content: initializationPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
      model: LLM_DEPLOYMENT
    });

    const welcomeMessage = response.choices[0]?.message?.content || 'Welcome to your interview! Let\'s begin.';
    
    // No need to clean welcome message since we're using function calls now
    const cleanWelcomeMessage = welcomeMessage;

    // Add the welcome message to session history
    session.messages.push({
      id: Math.random().toString(36).slice(2, 11),
      role: 'interviewer',
      text: cleanWelcomeMessage,
      timestamp: createdAt,
      metadata: { 
        type: 'welcome',
        questionId: initialQuestion.id,
        isInitialization: true
      }
    });

    session.updatedAt = new Date().toISOString();

    res.json({
      sessionId,
      interviewType,
      createdAt: session.createdAt,
      welcomeMessage: cleanWelcomeMessage
    });

  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ error: 'Failed to create interview session' });
  }
});

// Get session messages
app.get('/api/interviews/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId,
      messages: session.messages,
      messagesCount: session.messages.length,
      status: session.status
    });
  } catch (error) {
    console.error('Error getting messages:', error.message);
    res.status(500).json({ error: 'Failed to get session messages' });
  }
});

// Get session status
app.get('/api/interviews/sessions/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId,
      status: session.status,
      endedAt: session.endedAt,
      endReason: session.endReason,
      interviewType: session.interviewType,
      messageCount: session.messages.length
    });
  } catch (error) {
    console.error('Error getting session status:', error.message);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

app.post('/api/interviews/sessions/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const { role, text, metadata = {} } = req.body;
  
  console.log('💬 ADD MESSAGE ENDPOINT: Called', {
    sessionId: sessionId.substring(0, 8) + '...',
    role,
    textLength: text?.length || 0,
    textPreview: text?.substring(0, 50) + (text?.length > 50 ? '...' : ''),
    metadata,
    timestamp: new Date().toISOString(),
    callStack: new Error().stack.split('\n')[1]?.trim() // Show where this was called from
  });
  
  try {
    const session = interviewSessions.get(sessionId);
    if (!session) {
      console.error('💬 ADD MESSAGE ENDPOINT: Session not found', { sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('💬 ADD MESSAGE ENDPOINT: Current session state', {
      sessionId: sessionId.substring(0, 8) + '...',
      currentMessageCount: session.messages.length,
      lastMessageRole: session.messages[session.messages.length - 1]?.role,
      lastMessageText: session.messages[session.messages.length - 1]?.text?.substring(0, 30) + '...'
    });

    const message = {
      id: Math.random().toString(36).slice(2, 11),
      role, // 'interviewer' or 'candidate'
      text,
      timestamp: new Date().toISOString(),
      metadata // For storing additional info like audio duration, interruptions, etc.
    };

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    console.log('💬 ADD MESSAGE ENDPOINT: Message added successfully', {
      sessionId: sessionId.substring(0, 8) + '...',
      messageId: message.id,
      newMessageCount: session.messages.length,
      role,
      isDuplicate: session.messages.filter(m => m.text === text && m.role === role).length > 1
    });

    res.json({
      messageId: message.id,
      messagesCount: session.messages.length
    });
  } catch (error) {
    console.error('💬 ADD MESSAGE ENDPOINT: Error occurred', {
      sessionId,
      error: error.message,
      stack: error.stack
    });
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