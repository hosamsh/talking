import React, { useState, useRef, useEffect } from 'react';
import { Container, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import AzureWhisperStreaming from '../components/AzureWhisperStreaming';
import { getLLMResponseStream } from '../services/azoaiLlm';
import { textToSpeech } from '../services/azoaiTts';

function VoiceChatPage() {
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', text: string}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typingText, setTypingText] = useState('');
  const audioRef = useRef(null);
  const voice = 'nova';

  // Typewriter effect that types out text over time
  const typeWriterEffect = (text, durationMs) => {
    return new Promise((resolve) => {
      // Split into words for more natural typing
      const words = text.split(' ');
      let currentIndex = 0;
      setTypingText('');
      
      // Average time per word - adjust this for faster/slower typing
      const timePerWord = durationMs / words.length;
      
      // Handle empty text
      if (words.length === 0) {
        resolve();
        return;
      }
      
      // Type each word with a delay
      const typingInterval = setInterval(() => {
        if (currentIndex < words.length) {
          setTypingText(prev => (prev ? prev + ' ' : '') + words[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          resolve();
        }
      }, timePerWord);
    });
  };

  // Play audio for a given text and type at the same time
  const playAudioWithTyping = async (text) => {
    if (!text.trim()) return;
    
    try {
      // Start audio playback
      setIsSpeaking(true);
      const audioData = await textToSpeech(text, voice);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Load audio but don't play yet to get duration
      audioRef.current.src = url;
      
      // Wait for audio to be loaded
      await new Promise(resolve => {
        audioRef.current.onloadedmetadata = resolve;
      });
      
      // Get audio duration or estimate (15 chars per second is a rough estimate)
      const audioDuration = audioRef.current.duration * 1000 || text.length * 67;
      
      // Start audio and typing effect simultaneously
      audioRef.current.play();
      
      // Type out the text while audio plays
      await typeWriterEffect(text, audioDuration);
      
      // Wait for audio to finish if it's still playing
      if (!audioRef.current.ended) {
        await new Promise(resolve => {
          audioRef.current.onended = resolve;
        });
      }
      
      // Clean up
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      setTypingText('');
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setTypingText('');
    }
  };
  
  // Handle new user transcript
  const handleTextUpdate = async (userText) => {
    if (!userText.trim()) return;
    
    // Add user message
    setMessages(msgs => [...msgs, { role: 'user', text: userText }]);
    
    // Add empty assistant message
    setMessages(msgs => [...msgs, { role: 'assistant', text: '' }]);
    
    setLoading(true);
    setError('');
    
    try {
      // Process LLM response
      let fullText = '';
      let currentSentence = '';
      
      for await (const chunk of getLLMResponseStream(userText, messages)) {
        // Accumulate the chunk into current sentence
        currentSentence += chunk;
        
        // Check if we have a complete sentence
        let match;
        const sentenceRegex = /([^.!?]+[.!?])\s*/g;
        
        while ((match = sentenceRegex.exec(currentSentence)) !== null) {
          const sentence = match[1].trim();
          const matchEndIndex = match.index + match[0].length;
          
          // Play audio and show typing effect
          await playAudioWithTyping(sentence);
          
          // After typing and audio finish, add the sentence to the full text
          fullText += sentence + ' ';
          
          // Update message with completed text
          setMessages(msgs => {
            const newMsgs = [...msgs];
            newMsgs[newMsgs.length - 1] = { 
              role: 'assistant', 
              text: fullText.trim() 
            };
            return newMsgs;
          });
          
          // Remove the processed sentence from current
          currentSentence = currentSentence.substring(matchEndIndex);
        }
      }
      
      // Handle any remaining text that doesn't end with punctuation
      if (currentSentence.trim()) {
        await playAudioWithTyping(currentSentence.trim());
        
        fullText += currentSentence.trim();
        
        // Update message with final text
        setMessages(msgs => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = { 
            role: 'assistant', 
            text: fullText.trim() 
          };
          return newMsgs;
        });
      }
    } catch (err) {
      console.error('Conversation error:', err);
      setError(err.message || 'Error in conversation');
    } finally {
      setLoading(false);
    }
  };

  // Clean up audio when component unmounts
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
          Voice Chat (LLM)
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
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
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <Box sx={{
                bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                px: 2, py: 1, borderRadius: 2, maxWidth: '70%',
                position: 'relative'
              }}>
                {msg.text}
                {msg.role === 'assistant' && isSpeaking && idx === messages.length - 1 && (
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
          
          {/* Typing effect text */}
          {typingText && (
            <Box sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <Box sx={{
                bgcolor: 'grey.200',
                color: 'text.primary',
                px: 2, py: 1, 
                borderRadius: 2, 
                maxWidth: '70%'
              }}>
                {typingText}
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-block',
                    width: '0.5em',
                    height: '1em',
                    ml: 0.5,
                    borderRight: '2px solid',
                    animation: 'blink 1s step-end infinite'
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <AzureWhisperStreaming
            onTextUpdate={handleTextUpdate}
            onLoadingChange={setLoading}
            onActivityChange={setIsActive}
            onError={setError}
          />
        </Box>
        
        {(loading || isSpeaking) && 
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              {loading ? 'Thinking...' : 'Speaking...'}
              <CircularProgress size={16} sx={{ ml: 1 }} />
            </Typography>
          </Box>
        }
        
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

export default VoiceChatPage; 