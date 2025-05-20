import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, TextField, Box, Paper,
  CircularProgress, Select, MenuItem, FormControl, 
  InputLabel, Button, Slider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import BrowserTextToSpeech from '../components/BrowserTextToSpeech';
import AzureOpenAITTS from '../components/AzureOpenAITTS';

function TextToSpeech() {
  const [text, setText] = useState('');
  const [engine, setEngine] = useState('browser');
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const handleEngineChange = (event) => {
    setEngine(event.target.value);
    setIsActive(false);
  };
  
  const handleLoadingChange = (isLoading) => {
    setLoading(isLoading);
  };
  
  const handleActivityChange = (active) => {
    setIsActive(active);
  };
  
  const renderEngine = () => {
    switch (engine) {
      case 'browser':
        return (
          <BrowserTextToSpeech 
            text={text}
            onLoadingChange={handleLoadingChange}
            onActivityChange={handleActivityChange}
          />
        );
      case 'azure-openai':
        return (
          <AzureOpenAITTS
            text={text}
            onLoadingChange={handleLoadingChange}
            onActivityChange={handleActivityChange}
          />
        );
      default:
        return null;
    }
  };
  
  const getStatusMessage = () => {
    if (!isActive && !text) return 'Enter text and press play';
    if (!isActive && text) return 'Ready to speak';
    if (loading) return 'Preparing speech...';
    if (isActive) return 'Speaking...';
    return 'Ready';
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Text to Speech
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel>Speech Engine</InputLabel>
            <Select
              value={engine}
              onChange={handleEngineChange}
              label="Speech Engine"
            >
              <MenuItem value="browser">Browser Built-in</MenuItem>
              <MenuItem value="azure-openai">Azure OpenAI TTS</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 24 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isActive && <CircularProgress size={20} color="success" sx={{ mr: 1 }} />}
            <Typography variant="body2" color={isActive ? "success.main" : "text.secondary"}>
              {getStatusMessage()}
            </Typography>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to be spoken..."
          variant="outlined"
          sx={{ mb: 3 }}
        />
        
        <Box sx={{ mb: 4 }}>
          {renderEngine()}
        </Box>
      </Paper>
    </Container>
  );
}

export default TextToSpeech;
