import React from 'react';
import {
  Container, Paper, Typography, Box, CircularProgress,
  Alert, FormControl, InputLabel, Select, MenuItem, Button,
  Divider
} from '@mui/material';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';
import ChatWindow from '../components/ChatWindow';
import useInterview from '../hooks/useInterview';
import { interviewTypes } from '../config/interviewPrompts';

function InterviewPage() {
  const {
    interviewType,
    setInterviewType,
    interviewStarted,
    setInterviewStarted,
    messages,
    loading,
    setLoading,
    error,
    setError,
    isSpeaking,
    audioRef,
    startInterview,
    handleUserResponse,
    handleRecordingStart
  } = useInterview();

  // Handle interview type selection
  const handleInterviewTypeChange = (e) => {
    setInterviewType(e.target.value);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          AI Interview Practice
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!interviewStarted ? (
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Select an interview type to begin. The AI will act as the interviewer and ask you questions. 
              Speak your answers naturally, and the interview will progress based on your responses.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Interview Type</InputLabel>
              <Select
                value={interviewType}
                onChange={handleInterviewTypeChange}
                label="Interview Type"
              >
                {interviewTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {interviewType && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">
                  {interviewTypes.find(t => t.id === interviewType)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {interviewTypes.find(t => t.id === interviewType)?.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {interviewTypes.find(t => t.id === interviewType)?.duration}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                disabled={!interviewType}
                onClick={startInterview}
                size="large"
              >
                Start Interview
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <ChatWindow messages={messages} isSpeaking={isSpeaking} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Thinking...
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  </Box>
                ) : isSpeaking ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Speaking... (Click mic to interrupt)
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  </Box>
                ) : (
                  'Your turn to speak. Click the microphone and respond to the interview question.'
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <AzureWhisperStreaming
                  onTextUpdate={(text) => handleUserResponse(text, isSpeaking)}
                  onLoadingChange={setLoading}
                  onError={setError}
                  onRecordingStart={handleRecordingStart}
                  isSpeaking={isSpeaking}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => setInterviewStarted(false)}
              >
                End Interview
              </Button>
            </Box>
          </>
        )}
        
        <audio ref={audioRef} style={{ display: 'none' }} />
        
        {/* Keyframe animations */}
        <style jsx global>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
        `}</style>
      </Paper>
    </Container>
  );
}

export default InterviewPage; 
