import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { createAudioChunkHandler } from '../services/audioRecordingService';
import { transcribeAudio } from '../services/whisperService';

const AzureWhisperStreaming = ({
  onTextUpdate,
  onLoadingChange,
  onActivityChange = () => {},
  onError,
  onRecordingStart,
  isSpeaking
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioHandler, setAudioHandler] = useState(null);
  const recordingStartTimeRef = useRef(null); // Use ref to avoid re-triggering effect
  
  // Initialize audio handler
  useEffect(() => {
    const handler = createAudioChunkHandler(
      async (finalAudioBlob) => {
        console.log('Received final audio blob:', finalAudioBlob.size, 'type:', finalAudioBlob.type);
        if (finalAudioBlob.size === 0) {
          console.warn('Final audio blob is empty, not sending for transcription.');
          onError('No audio data was captured.'); // Or a more user-friendly message
          return;
        }
        try {
          onLoadingChange(true);
          const text = await transcribeAudio(finalAudioBlob, { language: 'en' });
          console.log('Transcription result:', text);
          if (text) {
            onTextUpdate(text);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          onError(error.message);
        } finally {
          onLoadingChange(false);
        }
      },
      (errorMsg) => {
        console.error('Audio handler error:', errorMsg);
        onError(errorMsg); // Pass error message from service to parent
        setIsRecording(false);
        onActivityChange(false);
      }
    );
    
    setAudioHandler(handler);
    
    return () => {
      if (handler && handler.isRecording()) {
        console.log('Component unmounting, stopping recording if active.');
        handler.stopRecording();
      }
    };
    // Removed onTextUpdate, onLoadingChange from dependencies as they are stable
  }, [onError, onActivityChange]); 
  
  const handleToggleRecording = useCallback(async () => {
    if (!audioHandler) {
      console.error('Audio handler not initialized!');
      onError('Audio system not ready. Please try again.');
      return;
    }
    
    if (isRecording) {
      console.log('User clicked stop recording...');
      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      // MIN_RECORDING_DURATION is 1000ms from audioRecordingService
      if (recordingDuration < 1000) { 
        console.log(`Recording too short (${recordingDuration}ms), waiting before actually stopping...`);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000 - recordingDuration));
          console.log('Wait finished, now stopping recording.');
        } catch (e) {
          console.error('Error during timeout for short recording stop', e);
        }
      }
      audioHandler.stopRecording(); // This will trigger onstop in the service
      setIsRecording(false);
      onActivityChange(false);
    } else {
      console.log('User clicked start recording...');
      // If the interviewer is speaking, notify parent to handle interruption
      if (isSpeaking && onRecordingStart) {
        console.log('Interrupting ongoing speech...');
        onRecordingStart();
      }
      
      recordingStartTimeRef.current = Date.now();
      try {
        await audioHandler.startRecording();
        setIsRecording(true);
        onActivityChange(true);
      } catch (startError) {
        console.error('Failed to start recording:', startError);
        onError(startError.message || 'Failed to start audio recording.');
        setIsRecording(false);
        onActivityChange(false);
      }
    }
  }, [audioHandler, isRecording, onActivityChange, onError, isSpeaking, onRecordingStart]);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Tooltip title={isRecording ? "Stop Recording" : isSpeaking ? "Interrupt Speaking" : "Start Recording"}>
        <IconButton 
          color={isRecording ? "error" : isSpeaking ? "secondary" : "primary"}
          onClick={handleToggleRecording}
          size="large"
          disabled={!audioHandler} // Disable button if handler not ready
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default AzureWhisperStreaming;
