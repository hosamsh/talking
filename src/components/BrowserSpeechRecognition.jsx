import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function BrowserSpeechRecognition({ onTextUpdate, onActivityChange }) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  
  // Update activity state when listening changes
  useEffect(() => {
    if (onActivityChange) {
      onActivityChange(listening);
    }
  }, [listening, onActivityChange]);
  
  const handleStart = () => {
    SpeechRecognition.startListening({ continuous: true });
  };
  
  const handleStop = () => {
    SpeechRecognition.stopListening();
    onTextUpdate(transcript);
    resetTranscript();
  };
  
  const handleClear = () => {
    resetTranscript();
  };
  
  // When component unmounts, stop listening
  useEffect(() => {
    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [listening]);
  
  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser doesn't support speech recognition.</div>;
  }
  
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      <Button 
        variant="contained" 
        color={listening ? "error" : "primary"}
        startIcon={listening ? <StopIcon /> : <MicIcon />}
        onClick={listening ? handleStop : handleStart}
      >
        {listening ? 'Stop' : 'Start Speaking'}
      </Button>
      
      <Button 
        variant="outlined" 
        startIcon={<DeleteIcon />}
        onClick={handleClear} 
        disabled={!transcript}
      >
        Clear Current
      </Button>
    </Box>
  );
}

export default BrowserSpeechRecognition;
