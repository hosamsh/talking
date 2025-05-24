import { useState, useRef, useEffect, useCallback } from 'react';
import { textToSpeech } from '../services/tts';

export const useTTS = (voice = 'nova') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const playbackCancelToken = useRef(null);

  const stopPlayback = useCallback(async () => {
    console.log('stopPlayback called, isSpeaking:', isSpeaking);
    
    if (playbackCancelToken.current) {
      console.log('Setting cancel token to true');
      playbackCancelToken.current.cancelled = true;
    }
    
    if (audioRef.current) {
      console.log('Pausing audio, current time:', audioRef.current.currentTime);
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.src = ''; // Clear the source
      
      // Wait longer for audio resources to fully release
      console.log('Waiting for audio resources to release...');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Audio resources should be released now');
    }
    
    setIsSpeaking(false);
    console.log('stopPlayback completed');
  }, [isSpeaking]);

  const playAudioWithTyping = useCallback(async (text, cancelToken, onTextUpdate) => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      const audioData = await textToSpeech(text, voice);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      audioRef.current.src = url;
      await new Promise(resolve => {
        audioRef.current.onloadedmetadata = resolve;
      });
      
      const audioDuration = audioRef.current.duration * 1000 || text.length * 67;
      audioRef.current.play();
      
      const words = text.split(' ');
      const timePerWord = audioDuration / words.length;
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        if (cancelToken?.cancelled) break;
        
        currentText += (i > 0 ? ' ' : '') + words[i];
        onTextUpdate?.(currentText);
        
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, timePerWord);
          if (cancelToken) {
            const checkInterval = setInterval(() => {
              if (cancelToken.cancelled) {
                clearTimeout(timer);
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          }
        });
      }
      
      if (!audioRef.current.ended && !cancelToken?.cancelled) {
        await new Promise(resolve => {
          audioRef.current.onended = resolve;
          if (cancelToken) {
            const checkInterval = setInterval(() => {
              if (cancelToken.cancelled) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          }
        });
      }
      
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      throw error;
    }
  }, [voice]);

  const handleRecordingStart = useCallback(async () => {
    if (isSpeaking) await stopPlayback(); // Now waits for stopPlayback to complete
  }, [isSpeaking, stopPlayback]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return {
    isSpeaking,
    audioRef,
    playbackCancelToken,
    stopPlayback,
    playAudioWithTyping,
    handleRecordingStart
  };
}; 