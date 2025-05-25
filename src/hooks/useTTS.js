import { useState, useRef, useEffect, useCallback } from 'react';
import { textToSpeech } from '../services/tts';

export const useTTS = (voice = 'nova') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const playbackCancelToken = useRef(null);

  const stopPlayback = useCallback(async () => {
    console.log('🔊 STOP PLAYBACK: Called', {
      isSpeaking,
      hasCancelToken: !!playbackCancelToken.current,
      hasAudio: !!audioRef.current,
      timestamp: new Date().toISOString()
    });
    
    if (playbackCancelToken.current) {
      console.log('🔊 STOP PLAYBACK: Setting cancel token to true');
      playbackCancelToken.current.cancelled = true;
    }
    
    if (audioRef.current) {
      console.log('🔊 STOP PLAYBACK: Pausing audio, current time:', audioRef.current.currentTime);
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.src = ''; // Clear the source
      
      // Wait longer for audio resources to fully release
      console.log('🔊 STOP PLAYBACK: Waiting for audio resources to release...');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('🔊 STOP PLAYBACK: Audio resources should be released now');
    }
    
    setIsSpeaking(false);
    console.log('🔊 STOP PLAYBACK: Completed');
  }, [isSpeaking]);

  const playAudioWithTyping = useCallback(async (text, cancelToken, onTextUpdate) => {
    if (!text.trim()) return;
    
    console.log('🔊 PLAY AUDIO: Starting playback', {
      textLength: text.length,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      timestamp: new Date().toISOString()
    });
    
    try {
      setIsSpeaking(true);
      console.log('🔊 PLAY AUDIO: Generating TTS audio');
      const audioData = await textToSpeech(text, voice);
      
      if (cancelToken?.cancelled) {
        console.log('🔊 PLAY AUDIO: Operation cancelled after TTS generation');
        setIsSpeaking(false);
        return;
      }
      
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      audioRef.current.src = url;
      await new Promise(resolve => {
        audioRef.current.onloadedmetadata = resolve;
      });
      
      if (cancelToken?.cancelled) {
        console.log('🔊 PLAY AUDIO: Operation cancelled after audio load');
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        return;
      }
      
      const audioDuration = audioRef.current.duration * 1000 || text.length * 67;
      console.log('🔊 PLAY AUDIO: Audio duration calculated:', audioDuration + 'ms');
      
      audioRef.current.play();
      
      const words = text.split(' ');
      const timePerWord = audioDuration / words.length;
      let currentText = '';
      
      console.log('🔊 PLAY AUDIO: Starting word-by-word typing', {
        wordsCount: words.length,
        timePerWord: timePerWord + 'ms'
      });
      
      for (let i = 0; i < words.length; i++) {
        if (cancelToken?.cancelled) {
          console.log('🔊 PLAY AUDIO: Typing cancelled at word', i);
          break;
        }
        
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
        console.log('🔊 PLAY AUDIO: Waiting for audio to finish');
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
      console.log('🔊 PLAY AUDIO: Playback completed successfully');
      
    } catch (error) {
      console.error('🔊 PLAY AUDIO: Error occurred:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      setIsSpeaking(false);
      throw error;
    }
  }, [voice]);

  const handleRecordingStart = useCallback(async () => {
    console.log('🔊 RECORDING START: Called', {
      isSpeaking,
      timestamp: new Date().toISOString()
    });

    if (isSpeaking) {
      console.log('🔊 RECORDING START: Stopping ongoing playback');
      await stopPlayback(); // Now waits for stopPlayback to complete
      console.log('🔊 RECORDING START: Playback stopped');
    }
  }, [isSpeaking, stopPlayback]);

  const cleanup = useCallback(async () => {
    console.log('🔊 CLEANUP: Starting TTS cleanup', {
      isSpeaking,
      hasCancelToken: !!playbackCancelToken.current,
      hasAudio: !!audioRef.current,
      timestamp: new Date().toISOString()
    });

    // Cancel any ongoing playback
    if (playbackCancelToken.current) {
      console.log('🔊 CLEANUP: Cancelling ongoing playback');
      playbackCancelToken.current.cancelled = true;
    }

    // Stop and clean audio
    if (audioRef.current) {
      console.log('🔊 CLEANUP: Stopping audio playback');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      
      // Wait for audio resources to be released
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Reset state
    setIsSpeaking(false);
    playbackCancelToken.current = null;

    console.log('🔊 CLEANUP: TTS cleanup completed');
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      console.log('🔊 UNMOUNT: Cleaning up TTS hook');
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return {
    isSpeaking,
    audioRef,
    playbackCancelToken,
    stopPlayback,
    playAudioWithTyping,
    handleRecordingStart,
    cleanup
  };
}; 