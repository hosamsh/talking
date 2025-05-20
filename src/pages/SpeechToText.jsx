import React, { useState } from 'react';
import { 
  Container, Typography, TextField, Box, Paper,
  CircularProgress, Select, MenuItem, FormControl, 
  InputLabel, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BrowserSpeechRecognition from '../components/BrowserSpeechRecognition';
import AzureWhisperUpload from '../components/AzureWhisperUpload';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';

function SpeechToText() {
  const [text, setText] = useState('');
  const [engine, setEngine] = useState('browser');
  const [loading, setLoading] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  const handleEngineChange = (event) => {
    setEngine(event.target.value);
    setCurrentTranscript('');
    setIsActive(false);
  };
  
  const handleTextUpdate = (newText) => {
    if (engine === 'browser') {
      setCurrentTranscript(newText);
    } else {
      setText(prevText => prevText + ' ' + newText);
    }
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
          <BrowserSpeechRecognition 
            onTextUpdate={handleTextUpdate}
            onActivityChange={handleActivityChange}
          />
        );
      case 'azure':
        return (
          <AzureWhisperUpload 
            onTextUpdate={handleTextUpdate}
            onLoadingChange={handleLoadingChange}
            onActivityChange={handleActivityChange}
          />
        );
      case 'azure-stream':
        return (
          <AzureWhisperStreaming 
            onTextUpdate={handleTextUpdate}
            onLoadingChange={handleLoadingChange}
            onActivityChange={handleActivityChange}
          />
        );
      default:
        return null;
    }
  };
  
  const getStatusMessage = () => {
    if (!isActive) return 'Waiting for you to start';
    if (loading) return 'Processing...';
    if (engine === 'browser') return 'Listening...';
    if (engine === 'azure-stream') return 'Streaming...';
    return 'Ready';
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Speech to Text
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel>Speech Recognition Engine</InputLabel>
            <Select
              value={engine}
              onChange={handleEngineChange}
              label="Speech Recognition Engine"
            >
              <MenuItem value="browser">Browser Built-in</MenuItem>
              <MenuItem value="azure">Azure Whisper (File Upload)</MenuItem>
              <MenuItem value="azure-stream">Azure Whisper (Streaming)</MenuItem>
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
        
        <Box sx={{ mb: 4 }}>
          {renderEngine()}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<DeleteIcon />}
              onClick={() => setText('')} 
              disabled={!text || loading}
            >
              Clear All Text
            </Button>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={8}
          value={engine === 'browser' && isActive ? currentTranscript : text}
          onChange={(e) => engine === 'browser' ? setCurrentTranscript(e.target.value) : setText(e.target.value)}
          placeholder="Your speech will appear here..."
          variant="outlined"
        />
      </Paper>
    </Container>
  );
}

export default SpeechToText; 