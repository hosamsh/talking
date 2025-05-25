import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  const componentStartTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());
  
  console.log('📋 InterviewPage COMPONENT RENDER START', {
    renderTime: `${(performance.now() - renderStartTime.current).toFixed(2)}ms`,
    totalComponentTime: `${(performance.now() - componentStartTime.current).toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });

  const renderCountRef = useRef(0);
  const voiceInputRef = useRef(null);
  const lastStateChangeRef = useRef({ timestamp: Date.now(), reason: 'initial' });
  
  // Track every render cycle with performance data
  useEffect(() => {
    renderCountRef.current += 1;
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;
    
    console.log('📋 RENDER CYCLE:', renderCountRef.current, {
      renderDuration: `${renderDuration.toFixed(2)}ms`,
      timeSinceLastStateChange: `${(Date.now() - lastStateChangeRef.current.timestamp)}ms`,
      lastChangeReason: lastStateChangeRef.current.reason,
      timestamp: new Date().toISOString()
    });
    
    if (renderDuration > 16) { // More than one frame at 60fps
      console.warn('📋 SLOW RENDER:', {
        renderCycle: renderCountRef.current,
        renderDuration: `${renderDuration.toFixed(2)}ms`,
        warning: 'Render took longer than 16ms (60fps threshold)'
      });
    }
    
    renderStartTime.current = performance.now();
  });

  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [error, setError] = useState('');

  // Track state changes with reasons
  const trackStateChange = useCallback((reason) => {
    lastStateChangeRef.current = { timestamp: Date.now(), reason };
  }, []);

  // Optimized state setters that track reasons
  const setInterviewTypeTracked = useCallback((value) => {
    setInterviewType(value);
    trackStateChange('interviewType changed');
  }, [trackStateChange]);

  const setInterviewStartedTracked = useCallback((value) => {
    setInterviewStarted(value);
    trackStateChange('interviewStarted changed');
  }, [trackStateChange]);

  const setErrorTracked = useCallback((value) => {
    setError(value);
    trackStateChange('error changed');
  }, [trackStateChange]);

  // Memoize state values to prevent unnecessary re-renders
  const stateSnapshot = useMemo(() => ({
    interviewType,
    interviewStarted,
    hasError: !!error
  }), [interviewType, interviewStarted, error]);

  console.log('📋 InterviewPage STATE VALUES:', stateSnapshot);

  console.log('📋 InterviewPage: Calling useTTS hook');
  const { 
    isSpeaking, 
    audioRef, 
    playbackCancelToken, 
    stopPlayback, 
    playAudioWithTyping,
    cleanup: ttsCleanup 
  } = useTTS('nova');

  console.log('📋 InterviewPage: useTTS hook result:', {
    isSpeaking,
    hasAudioRef: !!audioRef,
    hasPlaybackCancelToken: !!playbackCancelToken,
    hasStopPlayback: !!stopPlayback,
    hasPlayAudioWithTyping: !!playAudioWithTyping,
    hasTtsCleanup: !!ttsCleanup
  });

  console.log('📋 InterviewPage: Calling useChat hook');
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

  console.log('📋 InterviewPage: useChat hook result:', {
    messagesCount: messages.length,
    loading,
    hasAddUserMessage: !!addUserMessage,
    hasAddInterviewerMessage: !!addInterviewerMessage,
    hasUpdateLastInterviewerMessage: !!updateLastInterviewerMessage,
    hasGenerateInterviewerResponse: !!generateInterviewerResponse,
    hasInitializeConversation: !!initializeConversation,
    hasChatCleanup: !!chatCleanup
  });

  const handleEndInterview = useCallback(async () => {
    console.log('📋 END INTERVIEW: Starting comprehensive cleanup', {
      interviewStarted,
      isSpeaking,
      loading,
      messagesCount: messages.length,
      memoryUsage: performance.memory ? {
        used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
      } : 'Not available',
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Stop TTS and audio playback
      console.log('📋 END INTERVIEW: Cleaning up TTS and audio');
      await ttsCleanup();

      // 2. Stop chat/LLM operations
      console.log('📋 END INTERVIEW: Cleaning up chat and LLM');
      await chatCleanup();

      // 3. Stop voice input/recording
      console.log('📋 END INTERVIEW: Cleaning up voice input');
      if (voiceInputRef.current?.cleanup) {
        await voiceInputRef.current.cleanup();
      }

      // 4. Reset page state
      console.log('📋 END INTERVIEW: Resetting page state');
      setInterviewStartedTracked(false);
      setInterviewTypeTracked('');
      setErrorTracked('');

      console.log('📋 END INTERVIEW: Comprehensive cleanup completed successfully', {
        finalMemoryUsage: performance.memory ? {
          used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        } : 'Not available'
      });
    } catch (error) {
      console.error('📋 END INTERVIEW: Error during cleanup:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      // Still set interview as ended even if cleanup fails
      setInterviewStartedTracked(false);
      setErrorTracked('Interview ended, but some cleanup may have failed');
    }
  }, [interviewStarted, isSpeaking, loading, messages.length, ttsCleanup, chatCleanup, setInterviewStartedTracked, setInterviewTypeTracked, setErrorTracked]);

  const handleStartInterview = async (selectedInterviewType) => {
    console.log('📋 HANDLE START INTERVIEW: Called with:', {
      selectedInterviewType,
      memoryUsage: performance.memory ? {
        used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      } : 'Not available',
      timestamp: new Date().toISOString()
    });

    console.log('📋 HANDLE START INTERVIEW: Setting interview type');
    setInterviewTypeTracked(selectedInterviewType);
    
    console.log('📋 HANDLE START INTERVIEW: Setting interview started to true');
    setInterviewStartedTracked(true);
    
    console.log('📋 HANDLE START INTERVIEW: Clearing error');
    setErrorTracked('');
    
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
      setErrorTracked(err.message);
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
      setErrorTracked(err.message || 'Error in interview');
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

  // Cleanup effect for component unmount or when interview ends
  useEffect(() => {
    return () => {
      console.log('📋 COMPONENT CLEANUP: InterviewPage unmounting, performing emergency cleanup');
      // Emergency cleanup - don't await since this is in cleanup
      if (ttsCleanup) {
        ttsCleanup().catch(err => console.error('📋 COMPONENT CLEANUP: TTS cleanup error:', err));
      }
      if (chatCleanup) {
        chatCleanup().catch(err => console.error('📋 COMPONENT CLEANUP: Chat cleanup error:', err));
      }
      if (voiceInputRef.current?.cleanup) {
        voiceInputRef.current.cleanup().catch(err => console.error('📋 COMPONENT CLEANUP: Voice input cleanup error:', err));
      }
    };
  }, []); // Empty dependencies - only run on actual unmount

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
                  ref={voiceInputRef}
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
                    setErrorTracked(error);
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