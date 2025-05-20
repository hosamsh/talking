import React, { useState, useCallback } from 'react';
import { 
  Container, Typography, TextField, Box, Paper,
  CircularProgress, Button, Alert
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';

function AzureWhisperStreamingPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  
  const handleTextUpdate = useCallback((newText) => {
    setText(prevText => prevText + ' ' + newText);
  }, []);
  
  const handleLoadingChange = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);
  
  const handleActivityChange = useCallback((active) => {
    setIsActive(active);
  }, []);
  
  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);
  
  const handleClearText = () => {
    setText('');
  };
  
  const getStatusMessage = () => {
    if (!isActive) return 'Click the microphone button to start speaking';
    if (loading) return 'Processing...';
    return 'Listening...';
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Azure Whisper Streaming
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Speak naturally and Azure Whisper will convert your speech to text in real-time.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 24 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isActive && <CircularProgress size={20} color="success" sx={{ mr: 1 }} />}
            <Typography variant="body2" color={isActive ? "success.main" : "text.secondary"}>
              {getStatusMessage()}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <AzureWhisperStreaming 
            onTextUpdate={handleTextUpdate}
            onLoadingChange={handleLoadingChange}
            onActivityChange={handleActivityChange}
            onError={handleError}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<DeleteIcon />}
              onClick={handleClearText} 
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your speech will appear here..."
          variant="outlined"
        />
      </Paper>
    </Container>
  );
}

export default AzureWhisperStreamingPage; 