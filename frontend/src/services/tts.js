// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Converts text to speech using Backend TTS API
 * 
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {Promise<ArrayBuffer>} - ArrayBuffer containing the audio data
 */
export const textToSpeech = async (text, voice) => {
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  console.log('🌐 TTS API: Starting request', {
    requestId,
    textLength: text.length,
    textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    voice,
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  if (!text || !text.trim()) {
    console.error('🌐 TTS API: Validation error', {
      requestId,
      error: 'Text is required',
      timestamp: new Date().toISOString()
    });
    throw new Error('Text is required');
  }

  try {
    const requestPayload = {
      text: text,
      voice: voice
    };

    console.log('🌐 TTS API: Sending HTTP request', {
      requestId,
      url: `${BACKEND_URL}/api/tts`,
      payloadSize: JSON.stringify(requestPayload).length,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${BACKEND_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }
    
    const audioData = await response.arrayBuffer();
    const endTime = performance.now();
    const responseSize = audioData.byteLength;
    
    console.log('🌐 TTS API: Request successful', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      responseSize: `${(responseSize / 1024).toFixed(2)}KB`,
      statusCode: response.status,
      contentType: response.headers.get('content-type'),
      timestamp: new Date().toISOString()
    });
    
    return audioData;
  } catch (error) {
    const endTime = performance.now();
    
    console.error('🌐 TTS API: Request failed', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      errorType: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Error calling backend TTS service');
  }
};

/**
 * Check if the backend TTS service is available
 * 
 * @returns {Promise<boolean>} - True if the service is available, false otherwise
 */
export const isServiceConfigured = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return data.services?.tts || false;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

/**
 * Get the list of available voices
 * 
 * @returns {Array} - Array of voice objects with value and label properties
 */
export const getAvailableVoices = () => {
  return [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'echo', label: 'Echo (Male)' },
    { value: 'fable', label: 'Fable (Male)' },
    { value: 'onyx', label: 'Onyx (Male)' },
    { value: 'nova', label: 'Nova (Female)' },
    { value: 'shimmer', label: 'Shimmer (Female)' }
  ];
}; 