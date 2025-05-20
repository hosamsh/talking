import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Alert, FormControl, InputLabel, Select, MenuItem, Button,
  List, ListItem, ListItemText, Divider, Chip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';
import { getLLMResponseStream } from '../services/azoaiLlm';
import { textToSpeech } from '../services/azoaiTts';
import { interviewTypes, interviewPrompts } from '../config/interviewPrompts';

function InterviewPage() {
  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typingText, setTypingText] = useState('');
  const audioRef = useRef(null);
  const voice = 'nova'; // Could be configurable
  const conversationRef = useRef([]);
  const playbackCancelToken = useRef(null);

  // Handle interview type selection
  const handleInterviewTypeChange = (e) => {
    setInterviewType(e.target.value);
  };

  // Start the interview
  const startInterview = async () => {
    if (!interviewType) {
      setError('Please select an interview type');
      return;
    }

    setError('');
    setMessages([]);
    conversationRef.current = [];
    setInterviewStarted(true);
    
    // Send initial message as a system prompt to the LLM
    const prompt = interviewPrompts[interviewType];
    if (!prompt) {
      setError('Interview configuration not found');
      return;
    }

    // Add system message to conversation (not shown to user)
    conversationRef.current.push({
      role: 'system',
      text: prompt.systemPrompt
    });

    // Send initial question
    await sendInterviewerMessage(prompt.initialQuestion);
  };

  // Stop the current playback
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (playbackCancelToken.current) {
      playbackCancelToken.current.cancelled = true;
    }
    
    setIsSpeaking(false);
    setTypingText('');
  };

  // Send a message from the interviewer (LLM)
  const sendInterviewerMessage = async (text) => {
    setLoading(true);
    setError('');

    try {
      // Add interviewer message placeholder but with empty text
      setMessages(msgs => [...msgs, { role: 'interviewer', text: '' }]);
      
      // Get LLM response with custom system prompt
      let assistantText = '';
      const options = {
        systemMessage: interviewPrompts[interviewType].systemPrompt
      };
      
      // Collect the full response first without updating UI
      for await (const chunk of getLLMResponseStream(text, conversationRef.current, options)) {
        assistantText += chunk;
      }
      
      // Add to conversation history
      conversationRef.current.push({
        role: 'assistant',
        text: assistantText
      });

      // Create a new cancel token for this playback session
      playbackCancelToken.current = { cancelled: false };
      
      // Play the interviewer's response and handle typewriter effect
      // This will update the text as it "speaks"
      await playAudioWithTyping(assistantText, playbackCancelToken.current);
      
    } catch (err) {
      console.error('Conversation error:', err);
      setError(err.message || 'Error in interview');
    } finally {
      setLoading(false);
    }
  };

  // Handle candidate (user) response
  const handleUserResponse = async (userText, isInterruption = false) => {
    if (!userText.trim()) return;
    
    // If interrupting, stop current playback
    if (isInterruption) {
      // Add user message with interruption flag
      setMessages(msgs => {
        // Find the last interviewer message
        const lastInterviewerIdx = [...msgs].reverse().findIndex(m => m.role === 'interviewer');
        if (lastInterviewerIdx >= 0) {
          const realIdx = msgs.length - 1 - lastInterviewerIdx;
          // Mark the message as interrupted
          const updatedMsgs = [...msgs];
          updatedMsgs[realIdx] = {
            ...updatedMsgs[realIdx],
            interrupted: true
          };
          // Add the interruption message
          return [...updatedMsgs, { 
            role: 'candidate', 
            text: userText, 
            isInterruption: true 
          }];
        }
        // If no interviewer message found, just add the user message
        return [...msgs, { 
          role: 'candidate', 
          text: userText, 
          isInterruption: true 
        }];
      });
    } else {
      // Regular response (not interruption)
      setMessages(msgs => [...msgs, { role: 'candidate', text: userText }]);
    }
    
    // Add to conversation history
    conversationRef.current.push({
      role: 'user',
      text: userText
    });

    // Generate the next interviewer question based on the response
    await sendInterviewerMessage("Continue the interview based on the candidate's response.");
  };

  // Called when microphone recording starts
  const handleRecordingStart = () => {
    // If interviewer is speaking, stop the speech to handle interruption
    if (isSpeaking) {
      stopPlayback();
    }
  };

  // Typewriter effect
  const typeWriterEffect = (text, durationMs, cancelToken) => {
    return new Promise((resolve) => {
      const words = text.split(' ');
      let currentIndex = 0;
      setTypingText('');
      
      const timePerWord = durationMs / words.length;
      
      if (words.length === 0) {
        resolve();
        return;
      }
      
      const typingInterval = setInterval(() => {
        // Check if cancelled
        if (cancelToken && cancelToken.cancelled) {
          clearInterval(typingInterval);
          resolve();
          return;
        }
        
        if (currentIndex < words.length) {
          setTypingText(prev => (prev ? prev + ' ' : '') + words[currentIndex]);
          currentIndex++;
          
          // Update the last message with current typing progress
          setMessages(msgs => {
            const newMsgs = [...msgs];
            const lastIdx = newMsgs.length - 1;
            if (lastIdx >= 0 && newMsgs[lastIdx].role === 'interviewer') {
              newMsgs[lastIdx].text = typingText + ' ' + words[currentIndex - 1];
            }
            return newMsgs;
          });
        } else {
          clearInterval(typingInterval);
          resolve();
        }
      }, timePerWord);
    });
  };

  // Play audio with typing effect
  const playAudioWithTyping = async (text, cancelToken) => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      const audioData = await textToSpeech(text, voice);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      audioRef.current.src = url;
      
      await new Promise(resolve => {
        audioRef.current.onloadedmetadata = resolve;
      });
      
      const audioDuration = audioRef.current.duration * 1000 || text.length * 67;
      
      audioRef.current.play();
      
      // Type the text gradually while audio plays
      const words = text.split(' ');
      const timePerWord = audioDuration / words.length;
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        // Check if cancelled
        if (cancelToken && cancelToken.cancelled) {
          break;
        }
        
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        // Update the message directly
        setMessages(msgs => {
          const newMsgs = [...msgs];
          const lastIdx = newMsgs.length - 1;
          if (lastIdx >= 0 && newMsgs[lastIdx].role === 'interviewer') {
            newMsgs[lastIdx].text = currentText;
          }
          return newMsgs;
        });
        
        // Wait before adding the next word
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, timePerWord);
          // Handle cancellation during the timeout
          if (cancelToken) {
            const checkInterval = setInterval(() => {
              if (cancelToken.cancelled) {
                clearTimeout(timer);
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          }
        });
      }
      
      // Wait for audio to finish if it's still playing and not cancelled
      if (!audioRef.current.ended && !(cancelToken && cancelToken.cancelled)) {
        await new Promise(resolve => {
          audioRef.current.onended = resolve;
          
          // Add a cancel listener
          if (cancelToken) {
            const checkInterval = setInterval(() => {
              if (cancelToken.cancelled) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          }
        });
      }
      
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
            <Box sx={{ 
              minHeight: 300, 
              mb: 3, 
              maxHeight: '50vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: msg.role === 'candidate' ? 'flex-end' : 'flex-start'
                }}>
                  <Box sx={{
                    bgcolor: msg.role === 'candidate' ? 'primary.main' : 'grey.200',
                    color: msg.role === 'candidate' ? 'primary.contrastText' : 'text.primary',
                    px: 2, py: 1, borderRadius: 2, maxWidth: '70%',
                    position: 'relative'
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {msg.role === 'candidate' ? 'You' : 'Interviewer'}
                      {msg.isInterruption && (
                        <Chip 
                          label="Interruption" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} 
                        />
                      )}
                    </Typography>
                    {msg.text}
                    {msg.interrupted && (
                      <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        (interrupted)
                      </Typography>
                    )}
                    {msg.role === 'interviewer' && isSpeaking && idx === messages.length - 1 && (
                      <Box 
                        component="span"
                        sx={{ 
                          position: 'relative',
                          display: 'inline-block',
                          ml: 0.5,
                          width: '0.5em',
                          height: '1em',
                          borderRight: '2px solid',
                          animation: 'blink 1s step-end infinite',
                          visibility: isSpeaking ? 'visible' : 'hidden'
                        }}
                      />
                    )}
                    {msg.role === 'interviewer' && isSpeaking && idx === messages.length - 1 && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: -8, 
                          right: -8,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                          animation: 'pulse 1.5s infinite'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            
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