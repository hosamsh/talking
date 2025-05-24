import { useState, useRef, useEffect, useCallback } from 'react';
import { textToSpeech } from '../services/azoaiTts';

export const useAudioSpeech = (voice = 'nova') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const playbackCancelToken = useRef(null);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (playbackCancelToken.current) {
      playbackCancelToken.current.cancelled = true;
    }
    
    setIsSpeaking(false);
  }, []);

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
      
      // Type the text gradually while audio plays
      const words = text.split(' ');
      const timePerWord = audioDuration / words.length;
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        if (cancelToken && cancelToken.cancelled) {
          break;
        }
        
        
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        if (onTextUpdate) {
          onTextUpdate(currentText);
        }
        
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
      
      // Wait for audio to finish if it's still playing and not cancelled
      if (!audioRef.current.ended && !(cancelToken && cancelToken.cancelled)) {
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

  // Clean up
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    isSpeaking,
    audioRef,
    playbackCancelToken,
    stopPlayback,
    playAudioWithTyping
  };
}; 