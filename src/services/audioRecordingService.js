/**
 * Service for handling audio recording and chunking
 */

// Audio recording configuration
const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  mimeType: 'audio/webm;codecs=opus'
};

// Minimum recording duration in milliseconds
const MIN_RECORDING_DURATION = 1000;

/**
 * Creates and initializes an audio recorder
 * 
 * @returns {Promise<MediaRecorder>} - Initialized MediaRecorder instance
 */
export const createAudioRecorder = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!MediaRecorder.isTypeSupported(AUDIO_CONFIG.mimeType)) {
      console.warn(`MIME type ${AUDIO_CONFIG.mimeType} not supported, falling back to default.`);
      // Potentially try a different MIME type or let the browser decide
      const mediaRecorder = new MediaRecorder(stream);
      return mediaRecorder;
    }
    const mediaRecorder = new MediaRecorder(stream, { mimeType: AUDIO_CONFIG.mimeType });
    return mediaRecorder;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Could not access microphone. Please ensure you have granted microphone permissions.');
  }
};

/**
 * Stops the audio recording and releases resources
 * 
 * @param {MediaRecorder} mediaRecorder - The MediaRecorder instance to stop
 */
export const stopAudioRecording = (mediaRecorder) => {
  if (mediaRecorder && mediaRecorder.stream && mediaRecorder.stream.active) {
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  // No need to call mediaRecorder.stop() here as it's handled by the handler's stopRecording
};

/**
 * Creates an audio chunk handler that processes audio data
 * 
 * @param {Function} onFinalChunk - Callback function to handle the final audio blob
 * @param {Function} onError - Callback function to handle errors
 * @returns {Object} - Object with methods to handle audio recording
 */
export const createAudioChunkHandler = (onFinalChunk, onError) => {
  let mediaRecorder = null;
  let isRecording = false;
  let localAudioChunks = [];
  let recordingStartTime = null;
  
  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      if (isRecording) return;
      
      mediaRecorder = await createAudioRecorder();
      localAudioChunks = [];
      recordingStartTime = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('MediaRecorder data available, size:', event.data.size);
        if (event.data.size > 0) {
          localAudioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const recordingDuration = Date.now() - recordingStartTime;
        console.log('MediaRecorder stopped. Duration:', recordingDuration, 'ms. Chunks collected:', localAudioChunks.length);
        
        if (localAudioChunks.length > 0 && recordingDuration >= MIN_RECORDING_DURATION) {
          const finalBlob = new Blob(localAudioChunks, { type: mediaRecorder.mimeType || AUDIO_CONFIG.mimeType });
          console.log('Sending final blob, size:', finalBlob.size, 'type:', finalBlob.type);
          onFinalChunk(finalBlob);
        } else if (recordingDuration < MIN_RECORDING_DURATION) {
          console.warn('Recording too short, no data sent.');
          onError('Recording was too short. Please record for at least 1 second.');
        } else {
          console.warn('No audio data collected.');
          onError('No audio data was collected during recording.');
        }
        // Clean up tracks after stopping and processing
        if (mediaRecorder && mediaRecorder.stream && mediaRecorder.stream.active) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        localAudioChunks = []; // Clear chunks for next recording
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        onError('Error during audio recording: ' + event.error.name + ": " + event.error.message);
      };
      
      // Start recording. The timeslice parameter makes ondataavailable fire periodically.
      // If not specified, it fires only when stop() is called.
      mediaRecorder.start(); // Let's try without a timeslice first to see if onstop behaves better
      isRecording = true;
      console.log('MediaRecorder started. Current state:', mediaRecorder.state);
    } catch (error) {
      console.error('Error in startRecording:', error);
      onError(error.message);
    }
  };
  
  /**
   * Stop recording audio
   */
  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) {
      console.log('StopRecording called but not recording or no mediaRecorder.');
      return;
    }
    
    console.log('Attempting to stop MediaRecorder. Current state:', mediaRecorder.state);
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop(); // This will trigger ondataavailable (if any data) and then onstop
    }
    isRecording = false;
    // Note: stream tracks are now stopped in onstop event to ensure data is processed.
  };
  
  /**
   * Check if currently recording
   * 
   * @returns {boolean} - True if recording, false otherwise
   */
  const isCurrentlyRecording = () => isRecording;
  
  return {
    startRecording,
    stopRecording,
    isRecording: isCurrentlyRecording
  };
};

/**
 * Convert audio blob to base64 string
 * 
 * @param {Blob} audioBlob - The audio blob to convert
 * @returns {Promise<string>} - Base64 encoded audio data
 */
export const audioBlobToBase64 = async (audioBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}; 