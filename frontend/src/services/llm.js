// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Get streaming LLM response using backend session history
 * 
 * @param {string} userMessage - The user's message
 * @param {string} sessionId - The session ID for backend history
 * @param {Object} options - LLM options (maxTokens, temperature, etc.)
 * @param {string} interviewId - The interview type ID for context
 * @returns {AsyncGenerator} - Async generator yielding response chunks
 */
export async function* getLLMResponseStream(userMessage, sessionId, options = {}, interviewId = null) {
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  console.log('🤖 LLM API: Starting streaming request', {
    requestId,
    userMessageLength: userMessage?.length || 0,
    userMessagePreview: userMessage?.substring(0, 50) + (userMessage?.length > 50 ? '...' : ''),
    sessionId,
    systemMessageLength: 0, // Backend handles system message
    options,
    interviewId,
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  if (!userMessage || !userMessage.trim()) {
    throw new Error('User message is required');
  }

  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const requestPayload = {
      userMessage: userMessage.trim(),
      sessionId,
      options,
      interviewId
    };

    console.log('🤖 LLM API: Sending request to backend', {
      requestId,
      url: `${BACKEND_URL}/api/llm/stream`,
      sessionId,
      hasInterviewId: !!interviewId,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${BACKEND_URL}/api/llm/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    console.log('🤖 LLM API: Stream started, processing chunks', {
      requestId,
      streamStartTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      sessionId,
      interviewId,
      timestamp: new Date().toISOString()
    });

    let chunkNumber = 0;
    let lastChunkTime = performance.now();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          chunkNumber++;
          const currentTime = performance.now();
          
          console.log('🤖 LLM STREAM: Chunk received', {
            requestId,
            chunkNumber,
            chunkLength: chunk.length,
            chunkPreview: chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''),
            timeSinceLastChunk: `${(currentTime - lastChunkTime).toFixed(2)}ms`,
            totalTime: `${(currentTime - startTime).toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          
          lastChunkTime = currentTime;
          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }

    const endTime = performance.now();
    
    console.log('🤖 LLM API: Stream completed successfully', {
      requestId,
      totalResponseTime: `${(endTime - startTime).toFixed(2)}ms`,
      totalChunks: chunkNumber,
      estimatedTokens: chunkNumber * 4, // Rough estimate
      averageChunkTime: chunkNumber > 0 ? `${((endTime - startTime) / chunkNumber).toFixed(2)}ms` : '0ms',
      sessionId,
      interviewId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const endTime = performance.now();
    
    console.error('🤖 LLM API: Stream failed', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      errorType: error.name,
      errorMessage: error.message,
      sessionId,
      interviewId,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Error calling backend LLM service');
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