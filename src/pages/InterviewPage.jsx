import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Alert, Button, Divider
} from '@mui/material';
import VoiceInput from '../components/VoiceInput';
import ChatDisplay from '../components/ChatDisplay';
import InterviewSelector from '../components/InterviewSelector';
import { useTTS } from '../hooks/useTTS';
import { useChat } from '../hooks/useChat';

function InterviewPage() {
  console.log('📋 InterviewPage COMPONENT RENDER START', {
    timestamp: new Date().toISOString()
  });

  const renderCountRef = useRef(0);
  
  // Track every render cycle
  useEffect(() => {
    renderCountRef.current += 1;
    console.log('📋 RENDER CYCLE:', renderCountRef.current, 'at', new Date().toISOString());
  });

  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [error, setError] = useState('');

  console.log('📋 InterviewPage STATE VALUES:', {
    interviewType,
    interviewStarted,
    error: !!error
  });

  console.log('📋 InterviewPage: Calling useTTS hook');
  const { 
    isSpeaking, 
    audioRef, 
    playbackCancelToken, 
    stopPlayback, 
    playAudioWithTyping 
  } = useTTS('nova');

  console.log('📋 InterviewPage: useTTS hook result:', {
    isSpeaking,
    hasAudioRef: !!audioRef,
    hasPlaybackCancelToken: !!playbackCancelToken,
    hasStopPlayback: !!stopPlayback,
    hasPlayAudioWithTyping: !!playAudioWithTyping
  });

  console.log('📋 InterviewPage: Calling useChat hook');
  const {
    messages,
    loading,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation
  } = useChat();

  console.log('📋 InterviewPage: useChat hook result:', {
    messagesCount: messages.length,
    loading,
    hasAddUserMessage: !!addUserMessage,
    hasAddInterviewerMessage: !!addInterviewerMessage,
    hasUpdateLastInterviewerMessage: !!updateLastInterviewerMessage,
    hasGenerateInterviewerResponse: !!generateInterviewerResponse,
    hasInitializeConversation: !!initializeConversation
  });

  const handleStartInterview = async (selectedInterviewType) => {
    console.log('📋 HANDLE START INTERVIEW: Called with:', {
      selectedInterviewType,
      timestamp: new Date().toISOString()
    });

    console.log('📋 HANDLE START INTERVIEW: Setting interview type');
    setInterviewType(selectedInterviewType);
    
    console.log('📋 HANDLE START INTERVIEW: Setting interview started to true');
    setInterviewStarted(true);
    
    console.log('📋 HANDLE START INTERVIEW: Clearing error');
    setError('');
    
    try {
      console.log('📋 HANDLE START INTERVIEW: Initializing conversation');
      const initialQuestion = initializeConversation(selectedInterviewType);
      console.log('📋 HANDLE START INTERVIEW: Initial question received:', {
        initialQuestion,
        length: initialQuestion?.length || 0
      });
      
      console.log('📋 HANDLE START INTERVIEW: Sending initial interviewer message');
      await sendInterviewerMessage(initialQuestion, selectedInterviewType);
      console.log('📋 HANDLE START INTERVIEW: Initial message sent successfully');
    } catch (err) {
      console.error('📋 HANDLE START INTERVIEW: Error occurred:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message);
    }
  };

  const sendInterviewerMessage = async (text, currentInterviewType = interviewType) => {
    console.log('📋 SEND INTERVIEWER MESSAGE: Called with:', {
      text,
      textLength: text?.length || 0,
      currentInterviewType,
      timestamp: new Date().toISOString()
    });

    try {
      console.log('📋 SEND INTERVIEWER MESSAGE: Adding interviewer message placeholder');
      addInterviewerMessage();
      
      console.log('📋 SEND INTERVIEWER MESSAGE: Generating interviewer response');
      const assistantText = await generateInterviewerResponse(text, currentInterviewType);
      console.log('📋 SEND INTERVIEWER MESSAGE: Response generated:', {
        assistantText,
        length: assistantText?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      console.log('📋 SEND INTERVIEWER MESSAGE: Setting up playback cancel token');
      playbackCancelToken.current = { cancelled: false };
      
      console.log('📋 SEND INTERVIEWER MESSAGE: Starting audio playback with typing effect');
      await playAudioWithTyping(assistantText, playbackCancelToken.current, updateLastInterviewerMessage);
      console.log('📋 SEND INTERVIEWER MESSAGE: Audio playback completed');
    } catch (err) {
      console.error('📋 SEND INTERVIEWER MESSAGE: Error occurred:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || 'Error in interview');
    }
  };

  const handleUserResponse = async (userText, isInterruption = false) => {
    console.log('📋 HANDLE USER RESPONSE: Called with:', {
      userText,
      userTextLength: userText?.length || 0,
      isInterruption,
      trimmedText: userText?.trim(),
      timestamp: new Date().toISOString()
    });

    if (!userText.trim()) {
      console.log('📋 HANDLE USER RESPONSE: Empty text, returning early');
      return;
    }
    
    if (isInterruption) {
      console.log('📋 HANDLE USER RESPONSE: This is an interruption, stopping playback');
      stopPlayback();
    }
    
    console.log('📋 HANDLE USER RESPONSE: Adding user message to conversation');
    addUserMessage(userText, isInterruption);
    
    console.log('📋 HANDLE USER RESPONSE: Sending follow-up interviewer message');
    await sendInterviewerMessage("Continue the interview based on the candidate's response.");
    console.log('📋 HANDLE USER RESPONSE: Follow-up message sent');
  };

  const handleRecordingStart = useCallback(async () => {
    console.log('📋 HANDLE RECORDING START: Called', {
      isSpeaking,
      timestamp: new Date().toISOString()
    });

    if (isSpeaking) {
      console.log('📋 HANDLE RECORDING START: Currently speaking, stopping playback');
      await stopPlayback();
      console.log('📋 HANDLE RECORDING START: Playback stopped');
    } else {
      console.log('📋 HANDLE RECORDING START: Not currently speaking, no action needed');
    }
  }, [isSpeaking, stopPlayback]);

  console.log('📋 InterviewPage RENDER: About to render UI', {
    interviewStarted,
    interviewType,
    hasError: !!error,
    messagesCount: messages.length,
    loading,
    isSpeaking,
    timestamp: new Date().toISOString()
  });

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          AI Interview Practice
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!interviewStarted ? (
          <>
            {console.log('📋 InterviewPage RENDER: Rendering InterviewSelector')}
            <InterviewSelector 
              onStartInterview={handleStartInterview}
              onError={setError}
            />
          </>
        ) : (
          <>
            {console.log('📋 InterviewPage RENDER: Rendering interview interface')}
            <ChatDisplay messages={messages} isSpeaking={isSpeaking} />
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ mb: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {console.log('📋 InterviewPage RENDER: Showing loading state')}
                    Thinking...
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  </Box>
                ) : isSpeaking ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {console.log('📋 InterviewPage RENDER: Showing speaking state')}
                    Speaking... (Click mic to interrupt)
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  </Box>
                ) : (
                  <>
                    {console.log('📋 InterviewPage RENDER: Showing ready state')}
                    Your turn to speak. Click the microphone and respond to the interview question.
                  </>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {console.log('📋 InterviewPage RENDER: Rendering VoiceInput component')}
                <VoiceInput
                  onTextUpdate={(text) => {
                    console.log('📋 VOICE INPUT CALLBACK: onTextUpdate called with:', {
                      text,
                      textLength: text?.length || 0,
                      isSpeaking,
                      timestamp: new Date().toISOString()
                    });
                    handleUserResponse(text, isSpeaking);
                  }}
                  onLoadingChange={(loading) => {
                    console.log('📋 VOICE INPUT CALLBACK: onLoadingChange called with:', loading);
                  }}
                  onActivityChange={(active) => {
                    console.log('📋 VOICE INPUT CALLBACK: onActivityChange called with:', active);
                  }}
                  onError={(error) => {
                    console.log('📋 VOICE INPUT CALLBACK: onError called with:', error);
                    setError(error);
                  }}
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
                onClick={() => {
                  console.log('📋 END INTERVIEW: Button clicked');
                  setInterviewStarted(false);
                }}
              >
                End Interview
              </Button>
            </Box>
          </>
        )}
        
        <audio ref={audioRef} style={{ display: 'none' }} />
        
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