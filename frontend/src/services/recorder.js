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
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  try {
    console.log('🎙️ AUDIO RECORDER: Starting creation', {
      requestId,
      userAgent: navigator.userAgent.substring(0, 100),
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      timestamp: new Date().toISOString()
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const audioTracks = stream.getAudioTracks();
    const track = audioTracks[0];
    
    console.log('🎙️ MICROPHONE: Permission granted and stream created', {
      requestId,
      streamActive: stream.active,
      tracksCount: stream.getTracks().length,
      audioTracksCount: audioTracks.length,
      trackLabel: track?.label || 'Unknown',
      trackKind: track?.kind,
      trackSettings: track?.getSettings ? track.getSettings() : 'Not available',
      trackCapabilities: track?.getCapabilities ? track.getCapabilities() : 'Not available',
      timestamp: new Date().toISOString()
    });
    
    const mimeTypeSupported = MediaRecorder.isTypeSupported(AUDIO_CONFIG.mimeType);
    
    console.log('🎙️ AUDIO RECORDER: Checking codec support', {
      requestId,
      requestedMimeType: AUDIO_CONFIG.mimeType,
      isSupported: mimeTypeSupported,
      browserSupport: {
        mediaRecorder: !!window.MediaRecorder,
        webAudio: !!window.AudioContext || !!window.webkitAudioContext
      },
      timestamp: new Date().toISOString()
    });

    let mediaRecorder;
    if (!mimeTypeSupported) {
      console.warn('🎙️ AUDIO RECORDER: MIME type not supported, using default', {
        requestId,
        fallbackMimeType: 'browser default',
        warning: 'Audio quality may be different than expected'
      });
      mediaRecorder = new MediaRecorder(stream);
    } else {
      mediaRecorder = new MediaRecorder(stream, { mimeType: AUDIO_CONFIG.mimeType });
    }

    const endTime = performance.now();
    
    console.log('🎙️ AUDIO RECORDER: Created successfully', {
      requestId,
      setupTime: `${(endTime - startTime).toFixed(2)}ms`,
      actualMimeType: mediaRecorder.mimeType,
      state: mediaRecorder.state,
      stream: {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled }))
      },
      timestamp: new Date().toISOString()
    });
    
    return mediaRecorder;
  } catch (error) {
    const endTime = performance.now();
    
    console.error('🎙️ AUDIO RECORDER: Creation failed', {
      requestId,
      setupTime: `${(endTime - startTime).toFixed(2)}ms`,
      errorType: error.name,
      errorMessage: error.message,
      permissionDenied: error.name === 'NotAllowedError',
      deviceNotFound: error.name === 'NotFoundError',
      deviceBusy: error.name === 'NotReadableError',
      timestamp: new Date().toISOString()
    });
    
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
      console.log('startRecording called, current isRecording:', isRecording);
      if (isRecording) {
        console.log('Already recording, ignoring start request');
        return;
      }
      
      console.log('Creating new audio recorder...');
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
        console.log('isRecording state at stop:', isRecording);
        
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
        isRecording = false; // Reset state here too
        console.log('MediaRecorder cleanup completed, isRecording reset to:', isRecording);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        isRecording = false;
        onError('Error during audio recording: ' + event.error.name + ": " + event.error.message);
      };
      
      // Start recording. The timeslice parameter makes ondataavailable fire periodically.
      // If not specified, it fires only when stop() is called.
      console.log('About to start MediaRecorder...');
      mediaRecorder.start(); // Let's try without a timeslice first to see if onstop behaves better
      isRecording = true;
      console.log('MediaRecorder started. Current state:', mediaRecorder.state, 'isRecording:', isRecording);
    } catch (error) {
      console.error('Error in startRecording:', error);
      isRecording = false;
      onError(error.message);
    }
  };
  
  /**
   * Stop recording audio
   */
  const stopRecording = () => {
    console.log('stopRecording called. isRecording:', isRecording, 'mediaRecorder exists:', !!mediaRecorder);
    if (!mediaRecorder || !isRecording) {
      console.log('StopRecording called but not recording or no mediaRecorder.');
      return;
    }
    
    console.log('Attempting to stop MediaRecorder. Current state:', mediaRecorder.state);
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop(); // This will trigger ondataavailable (if any data) and then onstop
      console.log('MediaRecorder.stop() called');
    } else {
      console.log('MediaRecorder not in recording state:', mediaRecorder.state);
      isRecording = false; // Reset state even if not recording
    }
    // Note: stream tracks are now stopped in onstop event to ensure data is processed.
  };
  
  /**
   * Check if currently recording
   * 
   * @returns {boolean} - True if recording, false otherwise
   */
  const isCurrentlyRecording = () => {
    console.log('isCurrentlyRecording called, returning:', isRecording);
    return isRecording;
  };
  
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