import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, FormControl, InputLabel, Select, 
  MenuItem, Slider, Typography, Grid 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import SpeedIcon from '@mui/icons-material/Speed';

function BrowserTextToSpeech({ text, onLoadingChange, onActivityChange }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const synth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  
  // Load available voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.current.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };
    
    // Chrome loads voices asynchronously
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
    
    return () => {
      if (synth.current.speaking) {
        synth.current.cancel();
      }
    };
  }, []);
  
  // Update activity state when speaking changes
  useEffect(() => {
    if (onActivityChange) {
      onActivityChange(isSpeaking);
    }
  }, [isSpeaking, onActivityChange]);
  
  const handleSpeak = () => {
    if (!text) return;
    
    if (synth.current.speaking) {
      synth.current.cancel();
    }
    
    // Create a new SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Set speaking properties
    utterance.voice = voices.find(voice => voice.name === selectedVoice);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Set up event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    // Start speaking
    synth.current.speak(utterance);
  };
  
  const handleStop = () => {
    if (synth.current.speaking) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Voice</InputLabel>
            <Select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              label="Voice"
              disabled={isSpeaking}
            >
              {voices.map((voice) => (
                <MenuItem key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeedIcon sx={{ mr: 2 }} />
            <Typography id="rate-slider" gutterBottom sx={{ minWidth: 80 }}>
              Rate: {rate}x
            </Typography>
            <Slider 
              value={rate}
              onChange={(e, newValue) => setRate(newValue)}
              min={0.5}
              max={2}
              step={0.1}
              aria-labelledby="rate-slider"
              disabled={isSpeaking}
              sx={{ ml: 2 }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography id="pitch-slider" gutterBottom sx={{ minWidth: 80 }}>
              Pitch: {pitch}
            </Typography>
            <Slider 
              value={pitch}
              onChange={(e, newValue) => setPitch(newValue)}
              min={0.5}
              max={2}
              step={0.1}
              aria-labelledby="pitch-slider"
              disabled={isSpeaking}
              sx={{ ml: 2 }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VolumeDown />
            <Slider 
              value={volume}
              onChange={(e, newValue) => setVolume(newValue)}
              min={0}
              max={1}
              step={0.1}
              aria-labelledby="volume-slider"
              disabled={isSpeaking}
              sx={{ mx: 2 }}
            />
            <VolumeUp />
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color={isSpeaking ? "error" : "primary"}
          startIcon={isSpeaking ? <StopIcon /> : <PlayArrowIcon />}
          onClick={isSpeaking ? handleStop : handleSpeak}
          disabled={!text}
        >
          {isSpeaking ? 'Stop' : 'Speak'}
        </Button>
      </Box>
    </Box>
  );
}

export default BrowserTextToSpeech;
