import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { createAudioChunkHandler } from '../services/recorder';
import { transcribeAudio } from '../services/stt';

// Voice input component for recording and transcribing speech
const VoiceInput = forwardRef(({ 
  onTextUpdate, 
  onLoadingChange, 
  onActivityChange, 
  onError,
  onRecordingStart,
  isSpeaking 
}, ref) => {
  console.log('🎤 VoiceInput COMPONENT RENDER', {
    onTextUpdate: !!onTextUpdate,
    onLoadingChange: !!onLoadingChange,
    onActivityChange: !!onActivityChange,
    onError: !!onError,
    onRecordingStart: !!onRecordingStart,
    isSpeaking
  });

  const [isRecording, setIsRecording] = useState(false);
  const [audioHandler, setAudioHandler] = useState(null);
  const recordingStartTimeRef = useRef(null);
  const renderCountRef = useRef(0);
  
  // Track every render cycle
  useEffect(() => {
    renderCountRef.current += 1;
    console.log('🎤 RENDER CYCLE:', renderCountRef.current, 'at', new Date().toISOString());
  });
  
  // Use refs to store stable references to callbacks
  const onTextUpdateRef = useRef(onTextUpdate);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onActivityChangeRef = useRef(onActivityChange);
  const onErrorRef = useRef(onError);
  
  // Log state changes
  useEffect(() => {
    console.log('🎤 STATE CHANGE: isRecording changed to:', isRecording);
  }, [isRecording]);

  useEffect(() => {
    console.log('🎤 STATE CHANGE: audioHandler changed:', !!audioHandler);
  }, [audioHandler]);

  useEffect(() => {
    console.log('🎤 PROP CHANGE: isSpeaking changed to:', isSpeaking);
  }, [isSpeaking]);
  
  // Update refs when callbacks change
  useEffect(() => {
    console.log('🎤 EFFECT: Updating callback refs', {
      onTextUpdateChanged: onTextUpdateRef.current !== onTextUpdate,
      onLoadingChangeChanged: onLoadingChangeRef.current !== onLoadingChange,
      onActivityChangeChanged: onActivityChangeRef.current !== onActivityChange,
      onErrorChanged: onErrorRef.current !== onError
    });
    
    onTextUpdateRef.current = onTextUpdate;
    onLoadingChangeRef.current = onLoadingChange;
    onActivityChangeRef.current = onActivityChange;
    onErrorRef.current = onError;
  });
  
  // Initialize audio handler ONCE
  useEffect(() => {
    console.log('🎤 EFFECT: Initializing audio handler (should only run once)');
    
    const handler = createAudioChunkHandler(
      async (finalAudioBlob) => {
        console.log('🎤 AUDIO HANDLER: Received final audio blob:', {
          size: finalAudioBlob.size,
          type: finalAudioBlob.type,
          timestamp: new Date().toISOString()
        });
        
        if (finalAudioBlob.size === 0) {
          console.warn('🎤 AUDIO HANDLER: Final audio blob is empty, not sending for transcription.');
          onErrorRef.current('No audio data was captured.');
          return;
        }
        
        try {
          console.log('🎤 TRANSCRIPTION: Starting transcription process...');
          onLoadingChangeRef.current(true);
          
          const text = await transcribeAudio(finalAudioBlob, { language: 'en' });
          console.log('🎤 TRANSCRIPTION: Result received:', {
            text,
            length: text?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          if (text) {
            console.log('🎤 CALLBACK: Calling onTextUpdate with transcribed text');
            onTextUpdateRef.current(text);
          } else {
            console.warn('🎤 TRANSCRIPTION: No text returned from transcription');
          }
        } catch (error) {
          console.error('🎤 TRANSCRIPTION ERROR:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
          onErrorRef.current(error.message);
        } finally {
          console.log('🎤 TRANSCRIPTION: Setting loading to false');
          onLoadingChangeRef.current(false);
        }
      },
      (errorMsg) => {
        console.error('🎤 AUDIO HANDLER ERROR:', {
          errorMsg,
          timestamp: new Date().toISOString()
        });
        onErrorRef.current(errorMsg);
        setIsRecording(false);
        onActivityChangeRef.current(false);
      }
    );
    
    console.log('🎤 AUDIO HANDLER: Created successfully, setting state');
    setAudioHandler(handler);
    
    return () => {
      console.log('🎤 CLEANUP: Component unmounting, checking if recording is active');
      if (handler && handler.isRecording()) {
        console.log('🎤 CLEANUP: Stopping active recording due to component unmount');
        handler.stopRecording();
      } else {
        console.log('🎤 CLEANUP: No active recording to stop');
      }
    };
  }, []); // Empty dependencies - only run once
  
  // Handle recording start/stop toggle
  const handleToggleRecording = useCallback(async () => {
    console.log('🎤 TOGGLE RECORDING: Function called', {
      isRecording,
      hasAudioHandler: !!audioHandler,
      isSpeaking,
      timestamp: new Date().toISOString()
    });
    
    if (!audioHandler) {
      console.error('🎤 TOGGLE RECORDING: Audio handler not initialized!');
      onError('Audio system not ready. Please try again.');
      return;
    }
    
    if (isRecording) {
      console.log('🎤 STOP RECORDING: User clicked stop recording...');
      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      console.log('🎤 STOP RECORDING: Recording duration:', recordingDuration + 'ms');
      
      if (recordingDuration < 1000) { 
        console.log(`🎤 STOP RECORDING: Recording too short (${recordingDuration}ms), waiting before actually stopping...`);
        try {
          const waitTime = 1000 - recordingDuration;
          console.log('🎤 STOP RECORDING: Waiting', waitTime + 'ms');
          await new Promise(resolve => setTimeout(resolve, waitTime));
          console.log('🎤 STOP RECORDING: Wait finished, now stopping recording.');
        } catch (e) {
          console.error('🎤 STOP RECORDING: Error during timeout for short recording stop', e);
        }
      }
      
      console.log('🎤 STOP RECORDING: Calling audioHandler.stopRecording()');
      audioHandler.stopRecording();
      
      console.log('🎤 STOP RECORDING: Setting state - isRecording to false');
      setIsRecording(false);
      
      console.log('🎤 STOP RECORDING: Calling onActivityChange(false)');
      onActivityChange(false);
    } else {
      console.log('🎤 START RECORDING: User clicked start recording...');
      
      if (isSpeaking && onRecordingStart) {
        console.log('🎤 START RECORDING: Interrupting ongoing speech...');
        await onRecordingStart();
        console.log('🎤 START RECORDING: Speech interruption completed');
      }
      
      recordingStartTimeRef.current = Date.now();
      console.log('🎤 START RECORDING: Recording start time set:', new Date(recordingStartTimeRef.current).toISOString());
      
      try {
        console.log('🎤 START RECORDING: Calling audioHandler.startRecording()');
        await audioHandler.startRecording();
        
        console.log('🎤 START RECORDING: Setting state - isRecording to true');
        setIsRecording(true);
        
        console.log('🎤 START RECORDING: Calling onActivityChange(true)');
        onActivityChange(true);
        
        console.log('🎤 START RECORDING: Recording started successfully');
      } catch (startError) {
        console.error('🎤 START RECORDING ERROR:', {
          message: startError.message,
          stack: startError.stack,
          timestamp: new Date().toISOString()
        });
        onError(startError.message || 'Failed to start audio recording.');
        
        console.log('🎤 START RECORDING ERROR: Resetting states');
        setIsRecording(false);
        onActivityChange(false);
      }
    }
  }, [audioHandler, isRecording, onActivityChange, onError, isSpeaking, onRecordingStart]);
  
  console.log('🎤 RENDER: About to render component UI', {
    isRecording,
    isSpeaking,
    hasAudioHandler: !!audioHandler
  });
  
  // Expose cleanup function through ref
  useImperativeHandle(ref, () => ({
    cleanup: async () => {
      console.log('🎤 CLEANUP: Starting VoiceInput cleanup', {
        isRecording,
        hasAudioHandler: !!audioHandler,
        timestamp: new Date().toISOString()
      });

      // Stop any ongoing recording
      if (audioHandler && audioHandler.isRecording()) {
        console.log('🎤 CLEANUP: Stopping ongoing recording');
        audioHandler.stopRecording();
      }

      // Reset component state
      console.log('🎤 CLEANUP: Resetting component state');
      setIsRecording(false);
      onActivityChangeRef.current?.(false);
      onLoadingChangeRef.current?.(false);

      console.log('🎤 CLEANUP: VoiceInput cleanup completed');
    }
  }), [isRecording, audioHandler]);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Tooltip title={isRecording ? "Stop Recording" : isSpeaking ? "Interrupt Speaking" : "Start Recording"}>
        <IconButton 
          color={isRecording ? "error" : isSpeaking ? "secondary" : "primary"}
          onClick={handleToggleRecording}
          size="large"
          disabled={!audioHandler}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
});

export default VoiceInput;
