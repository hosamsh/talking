import React, { useState, useCallback } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Alert, Button, Divider
} from '@mui/material';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';
import MessageList from '../components/MessageList';
import InterviewTypeSelector from '../components/InterviewTypeSelector';
import { useAudioSpeech } from '../hooks/useAudioSpeech';
import { useInterviewConversation } from '../hooks/useInterviewConversation';

function InterviewPage() {
  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);

  const voice = 'nova';
  
  const { 
    isSpeaking, 
    audioRef, 
    playbackCancelToken, 
    stopPlayback, 
    playAudioWithTyping 
  } = useAudioSpeech(voice);

  const {
    messages,
    loading,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation
  } = useInterviewConversation();

  const handleStartInterview = async (selectedInterviewType) => {
    setError('');
    setInterviewType(selectedInterviewType);
    setInterviewStarted(true);
    
    try {
      const initialQuestion = initializeConversation(selectedInterviewType);
      await sendInterviewerMessage(initialQuestion, selectedInterviewType);
    } catch (err) {
      setError(err.message);
    }
  };

  const sendInterviewerMessage = async (text, currentInterviewType = interviewType) => {
    try {
      addInterviewerMessage();
      
      const assistantText = await generateInterviewerResponse(text, currentInterviewType);
      
      playbackCancelToken.current = { cancelled: false };
      
      await playAudioWithTyping(
        assistantText, 
        playbackCancelToken.current, 
        updateLastInterviewerMessage
      );
      
    } catch (err) {
      console.error('Conversation error:', err);
      setError(err.message || 'Error in interview');
    }
  };

  const handleUserResponse = async (userText, isInterruption = false) => {
    if (!userText.trim()) return;
    
    if (isInterruption) {
      stopPlayback();
    }
    
    addUserMessage(userText, isInterruption);
    await sendInterviewerMessage("Continue the interview based on the candidate's response.");
  };

  const handleRecordingStart = useCallback(() => {
    if (isSpeaking) {
      stopPlayback();
    }
  }, [isSpeaking, stopPlayback]);

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          AI Interview Practice
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!interviewStarted ? (
          <InterviewTypeSelector 
            onStartInterview={handleStartInterview}
            onError={setError}
          />
        ) : (
          <>
            <MessageList messages={messages} isSpeaking={isSpeaking} />
            
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
                  onLoadingChange={() => {}} // Loading is handled by the conversation hook
                  onActivityChange={setIsActive}
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