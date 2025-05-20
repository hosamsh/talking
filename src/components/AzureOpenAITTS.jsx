import React, { useState, useRef } from 'react';
import { 
  Box, Button, FormControl, Select, MenuItem, 
  InputLabel, Alert, Slider, Typography 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { textToSpeech, isServiceConfigured, getAvailableVoices } from '../services/azoaiTts';

function AzureOpenAITTS({ text, onLoadingChange, onActivityChange }) {
  const [voice, setVoice] = useState('alloy');
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [speed, setSpeed] = useState(1.0);
  
  const audioRef = useRef(null);
  const voices = getAvailableVoices();
  const serviceConfigured = isServiceConfigured();
  
  const handleVoiceChange = (event) => {
    setVoice(event.target.value);
  };
  
  const handleSpeedChange = (event, newValue) => {
    setSpeed(newValue);
    if (audioRef.current) {
      audioRef.current.playbackRate = newValue;
    }
  };
  
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      onActivityChange(false);
    }
  };
  
  const handlePlay = async () => {
    if (!serviceConfigured) {
      setError('Azure OpenAI TTS service is not properly configured. Check your environment variables.');
      return;
    }
    
    if (!text.trim()) {
      setError('Please enter some text to speak');
      return;
    }
    
    setError('');
    onLoadingChange(true);
    onActivityChange(true);
    
    try {
      // Call the service function
      const audioData = await textToSpeech(text, voice);
      
      // Create blob and URL
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = speed;
        audioRef.current.play();
        
        audioRef.current.onended = () => {
          onActivityChange(false);
        };
      }
      
      onLoadingChange(false);
    } catch (err) {
      console.error('Error with speech synthesis:', err);
      setError('Error generating speech: ' + (err.message || 'Unknown error'));
      onLoadingChange(false);
      onActivityChange(false);
    }
  };
  
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {!serviceConfigured && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Azure OpenAI TTS service is not properly configured. Make sure to set the following environment variables in your .env file:
          <ul>
            <li>REACT_APP_AZURE_OPENAI_ENDPOINT</li>
            <li>REACT_APP_AZURE_OPENAI_API_KEY</li>
            <li>REACT_APP_AZURE_OPENAI_API_VERSION</li>
            <li>REACT_APP_AZURE_OPENAI_TTS_DEPLOYMENT</li>
          </ul>
        </Alert>
      )}
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Voice</InputLabel>
        <Select
          value={voice}
          onChange={handleVoiceChange}
          label="Voice"
        >
          {voices.map(voice => (
            <MenuItem key={voice.value} value={voice.value}>
              {voice.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Speed: {speed.toFixed(1)}x</Typography>
        <Slider
          value={speed}
          min={0.5}
          max={2.0}
          step={0.1}
          onChange={handleSpeedChange}
          valueLabelDisplay="auto"
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handlePlay}
          disabled={!text.trim() || !serviceConfigured}
        >
          Speak
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<StopIcon />}
          onClick={handleStop}
          disabled={!audioUrl}
        >
          Stop
        </Button>
      </Box>
      
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Box>
  );
}

export default AzureOpenAITTS; 