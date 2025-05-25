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
  const voiceInputRef = useRef(null);
  
  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [error, setError] = useState('');

  const { 
    isSpeaking, 
    audioRef, 
    playbackCancelToken, 
    stopPlayback, 
    playAudioWithTyping,
    cleanup: ttsCleanup 
  } = useTTS('nova');

  const {
    messages,
    loading,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation,
    cleanup: chatCleanup
  } = useChat();

  const handleEndInterview = useCallback(async () => {
    try {
      // 1. Stop TTS and audio playback
      await ttsCleanup();

      // 2. Stop chat/LLM operations
      await chatCleanup();

      // 3. Stop voice input/recording
      if (voiceInputRef.current?.cleanup) {
        await voiceInputRef.current.cleanup();
      }

      // 4. Reset page state
      setInterviewStarted(false);
      setInterviewType('');
      setError('');
    } catch (error) {
      setInterviewStarted(false);
      setError('Interview ended, but some cleanup may have failed');
    }
  }, [ttsCleanup, chatCleanup, setInterviewStarted, setInterviewType, setError]);

  const handleStartInterview = async (selectedInterviewType) => {
    console.log('🚀 HANDLE START INTERVIEW: Function called', { selectedInterviewType });
    
    setInterviewType(selectedInterviewType);
    
    setInterviewStarted(true);
    
    setError('');
    
    try {
      console.log('🚀 HANDLE START INTERVIEW: Calling initializeConversation');
      const initialQuestion = await initializeConversation(selectedInterviewType);
      
      console.log('🚀 HANDLE START INTERVIEW: Got initial question, calling sendInterviewerMessage');
      await sendInterviewerMessage(initialQuestion, selectedInterviewType);
      
      console.log('🚀 HANDLE START INTERVIEW: Successfully completed');
    } catch (err) {
      console.error('🚀 HANDLE START INTERVIEW: Error occurred', err);
      setError(err.message);
    }
  };

  const sendInterviewerMessage = async (text, currentInterviewType = interviewType) => {
    console.log('📤 SEND INTERVIEWER MESSAGE: Called with', { text, currentInterviewType });
    
    try {
      console.log('📤 SEND INTERVIEWER MESSAGE: Adding interviewer message placeholder');
      addInterviewerMessage();
      
      let assistantText;
      
      // Check if this is a direct message (like initial question) or needs LLM generation
      if (text && !text.includes("Continue the interview") && !text.includes("based on the candidate's response")) {
        console.log('📤 SEND INTERVIEWER MESSAGE: Using direct message (no LLM needed)');
        // This is a direct message (like initial question)
        assistantText = text;
      } else {
        console.log('📤 SEND INTERVIEWER MESSAGE: Generating LLM response');
        // This needs LLM generation
        assistantText = await generateInterviewerResponse(text);
        console.log('📤 SEND INTERVIEWER MESSAGE: LLM response received', { assistantText });
      }
      
      playbackCancelToken.current = { cancelled: false };
      
      // Create async wrapper for updateLastInterviewerMessage
      const asyncUpdateMessage = async (text) => {
        try {
          await updateLastInterviewerMessage(text);
        } catch (error) {
          // Don't throw - let the UI update continue even if session update fails
        }
      };
      
      console.log('📤 SEND INTERVIEWER MESSAGE: Starting audio playback');
      await playAudioWithTyping(assistantText, playbackCancelToken.current, asyncUpdateMessage);
      console.log('📤 SEND INTERVIEWER MESSAGE: Audio playback completed');
    } catch (err) {
      console.error('📤 SEND INTERVIEWER MESSAGE: Error occurred', err);
      setError(err.message || 'Error in interview');
    }
  };

  const handleUserResponse = async (userText, isInterruption = false) => {
    console.log('🎯 HANDLE USER RESPONSE: Called with', { userText, isInterruption });
    
    if (!userText || !userText.trim()) {
      console.log('🎯 HANDLE USER RESPONSE: Empty text, returning early');
      return;
    }
    
    if (isInterruption) {
      console.log('🎯 HANDLE USER RESPONSE: Stopping playback due to interruption');
      stopPlayback();
    }
    
    try {
      console.log('🎯 HANDLE USER RESPONSE: Adding user message to chat');
      await addUserMessage(userText, isInterruption);
      
      console.log('🎯 HANDLE USER RESPONSE: Calling sendInterviewerMessage');
      await sendInterviewerMessage("Continue the interview based on the candidate's response.");
      
      console.log('🎯 HANDLE USER RESPONSE: Successfully completed');
    } catch (error) {
      console.error('🎯 HANDLE USER RESPONSE: Error occurred', error);
      setError(`Error processing your response: ${error.message}`);
    }
  };

  const handleRecordingStart = useCallback(async () => {
    if (isSpeaking) {
      await stopPlayback();
    }
  }, [isSpeaking, stopPlayback]);

  // Cleanup effect for component unmount only
  useEffect(() => {
    return () => {
      if (ttsCleanup) {
        ttsCleanup().catch(err => console.error('TTS cleanup error:', err));
      }
      if (chatCleanup) {
        chatCleanup().catch(err => console.error('Chat cleanup error:', err));
      }
      if (voiceInputRef.current?.cleanup) {
        voiceInputRef.current.cleanup().catch(err => console.error('Voice input cleanup error:', err));
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          AI Interview Practice
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!interviewStarted ? (
          <InterviewSelector 
            onStartInterview={handleStartInterview}
            onError={setError}
          />
        ) : (
          <>
            <ChatDisplay messages={messages} isSpeaking={isSpeaking} />
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ mb: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
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
                  <>
                    Your turn to speak. Click the microphone and respond to the interview question.
                  </>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <VoiceInput
                  ref={voiceInputRef}
                  onTextUpdate={(text) => {
                    handleUserResponse(text, isSpeaking);
                  }}
                  onLoadingChange={(loading) => {
                  }}
                  onActivityChange={(active) => {
                  }}
                  onError={(error) => {
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
                onClick={handleEndInterview}
              >
                End Interview
              </Button>
            </Box>
          </>
        )}
        
        <audio ref={audioRef} style={{ display: 'none' }} />
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            
            @keyframes pulse {
              0% { opacity: 0.5; }
              50% { opacity: 1; }
              100% { opacity: 0.5; }
            }
          `
        }} />
      </Paper>
    </Container>
  );
}

export default InterviewPage; 