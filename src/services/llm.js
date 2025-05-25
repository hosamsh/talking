// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Streams responses from Backend LLM API
 * 
 * @param {string} userMessage - The user message to send to the LLM
 * @param {array} previousMessages - Optional array of previous messages for context
 * @param {object} options - Optional configuration for the LLM request
 * @yields {string} - Chunks of the response text
 */
export async function* getLLMResponseStream(userMessage, previousMessages = [], options = {}) {
  const requestId = Math.random().toString(36).substr(2, 9);
  const startTime = performance.now();
  let chunkCount = 0;
  let totalTokens = 0;
  let lastChunkTime = startTime;
  
  console.log('🤖 LLM API: Starting streaming request', {
    requestId,
    userMessageLength: userMessage.length,
    userMessagePreview: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : ''),
    previousMessagesCount: previousMessages.length,
    systemMessageLength: options.systemMessage?.length || 0,
    maxTokens: options.maxTokens || 300,
    temperature: options.temperature || 0.7,
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  if (!userMessage) {
    console.error('🤖 LLM API: Validation error', {
      requestId,
      error: 'User message is required',
      timestamp: new Date().toISOString()
    });
    throw new Error('User message is required');
  }

  try {
    console.log('🤖 LLM API: Sending request to backend', {
      requestId,
      url: `${BACKEND_URL}/api/llm/stream`,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${BACKEND_URL}/api/llm/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        previousMessages,
        options
      })
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    console.log('🤖 LLM API: Stream started, processing chunks', {
      requestId,
      streamStartTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      if (chunk) {
        chunkCount++;
        totalTokens += chunk.length;
        const currentTime = performance.now();
        
        console.log('🤖 LLM STREAM: Chunk received', {
          requestId,
          chunkNumber: chunkCount,
          chunkLength: chunk.length,
          chunkPreview: chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''),
          timeSinceLastChunk: `${(currentTime - lastChunkTime).toFixed(2)}ms`,
          totalResponseTime: `${(currentTime - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
        
        lastChunkTime = currentTime;
        yield chunk;
      }
    }

    const endTime = performance.now();
    
    console.log('🤖 LLM API: Stream completed successfully', {
      requestId,
      totalResponseTime: `${(endTime - startTime).toFixed(2)}ms`,
      totalChunks: chunkCount,
      estimatedTokens: Math.ceil(totalTokens / 4),
      averageChunkTime: chunkCount > 0 ? `${((endTime - startTime) / chunkCount).toFixed(2)}ms` : '0ms',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const endTime = performance.now();
    
    console.error('🤖 LLM API: Stream failed', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      chunksReceived: chunkCount,
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Error communicating with backend LLM service');
  }
}

/**
 * Check if the backend LLM service is available
 * 
 * @returns {Promise<boolean>} - True if the service is available, false otherwise
 */
export const isLLMServiceConfigured = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return data.services?.llm || false;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}; 