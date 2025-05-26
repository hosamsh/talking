// Set up audio analyser for real-time audio level monitoring
export const setupAudioAnalyser = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  return { stream, audioContext, analyser };
};

// Analyze audio level and detect speech activity
export const analyzeAudioLevel = (analyser) => {
  if (!analyser) return { level: 0, isSpeaking: false };
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average volume level (0-255)
  const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
  
  // Normalize to 0-100 for display
  const normalizedLevel = Math.min(100, Math.max(0, average / 2.55));
  
  // Determine if speaking (adjust threshold as needed)
  const speakingThreshold = 15;
  const isSpeaking = average > speakingThreshold;
  
  return { level: normalizedLevel, isSpeaking };
};

// Clean up audio resources and stop recording
export const cleanupAudio = (mediaRecorder, audioContext, animationFrame) => {
  if (mediaRecorder) {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (mediaRecorder.silenceTimerId) {
      clearInterval(mediaRecorder.silenceTimerId);
    }
    if (mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
};
