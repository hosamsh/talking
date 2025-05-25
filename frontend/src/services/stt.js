// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Transcribes audio using Backend STT API
 * 
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @param {Object} options - Optional parameters for transcription
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudio = async (audioBlob, options = {}) => {
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  console.log('🎵 STT API: Starting transcription request', {
    requestId,
    audioSize: `${(audioBlob.size / 1024).toFixed(2)}KB`,
    audioType: audioBlob.type,
    audioDurationEstimate: `~${(audioBlob.size / 16000).toFixed(1)}s`, // Rough estimate
    language: options.language || 'en',
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  if (audioBlob.size === 0) {
    console.error('🎵 STT API: Validation error', {
      requestId,
      error: 'Audio blob is empty',
      timestamp: new Date().toISOString()
    });
    throw new Error('Audio blob is empty');
  }

  if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
    console.warn('🎵 STT API: Large file warning', {
      requestId,
      audioSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)}MB`,
      warning: 'Audio file is quite large, transcription may take longer',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Create form data for the API request
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Force English language unless overridden by options
    const language = options.language || 'en';
    formData.append('language', language);

    console.log('🎵 STT API: Sending HTTP request', {
      requestId,
      url: `${BACKEND_URL}/api/stt`,
      formDataFields: Array.from(formData.keys()),
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${BACKEND_URL}/api/stt`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const transcribedText = result.text || '';
    
    const endTime = performance.now();
    const wordsCount = transcribedText.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log('🎵 STT API: Transcription successful', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      statusCode: response.status,
      transcribedLength: transcribedText.length,
      wordsCount,
      transcribedText: transcribedText.length > 100 ? transcribedText.substring(0, 100) + '...' : transcribedText,
      audioToTextRatio: audioBlob.size > 0 ? (transcribedText.length / audioBlob.size * 1000).toFixed(2) : '0',
      timestamp: new Date().toISOString()
    });
    
    return transcribedText;

  } catch (error) {
    const endTime = performance.now();
    
    console.error('🎵 STT API: Transcription failed', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      errorType: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Failed to transcribe audio');
  }
};
