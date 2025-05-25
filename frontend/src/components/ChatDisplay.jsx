import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';

const ChatDisplay = ({ messages, isSpeaking }) => {
  console.log('💬 ChatDisplay COMPONENT RENDER', {
    messagesCount: messages?.length || 0,
    isSpeaking,
    timestamp: new Date().toISOString()
  });

  const renderCountRef = useRef(0);
  const prevMessagesRef = useRef([]);
  const prevIsSpeakingRef = useRef(false);
  
  // Track every render cycle
  useEffect(() => {
    renderCountRef.current += 1;
    console.log('💬 RENDER CYCLE:', renderCountRef.current, 'at', new Date().toISOString());
  });

  // Track messages changes
  useEffect(() => {
    const messagesChanged = JSON.stringify(prevMessagesRef.current) !== JSON.stringify(messages);
    console.log('💬 PROP CHANGE: messages changed:', {
      messagesChanged,
      previousCount: prevMessagesRef.current?.length || 0,
      newCount: messages?.length || 0,
      newMessages: messagesChanged ? messages?.slice(prevMessagesRef.current?.length || 0) : [],
      timestamp: new Date().toISOString()
    });
    
    if (messagesChanged) {
      console.log('💬 MESSAGES DETAIL:', messages?.map((msg, idx) => ({
        index: idx,
        role: msg.role,
        textLength: msg.text?.length || 0,
        textPreview: msg.text?.substring(0, 50) + (msg.text?.length > 50 ? '...' : ''),
        isInterruption: msg.isInterruption,
        interrupted: msg.interrupted
      })));
    }
    
    prevMessagesRef.current = messages;
  }, [messages]);

  // Track isSpeaking changes
  useEffect(() => {
    const isSpeakingChanged = prevIsSpeakingRef.current !== isSpeaking;
    console.log('💬 PROP CHANGE: isSpeaking changed:', {
      isSpeakingChanged,
      previous: prevIsSpeakingRef.current,
      new: isSpeaking,
      timestamp: new Date().toISOString()
    });
    prevIsSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  console.log('💬 RENDER: About to render message list UI', {
    messagesCount: messages?.length || 0,
    isSpeaking,
    timestamp: new Date().toISOString()
  });

  return (
    <Box sx={{ 
      minHeight: 300, 
      mb: 3, 
      maxHeight: '50vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {console.log('💬 RENDER: Mapping over messages array', { count: messages?.length || 0 })}
      {messages.map((msg, idx) => {
        const isCandidate = msg.role === 'candidate';
        const isLastInterviewer = msg.role === 'interviewer' && idx === messages.length - 1;
        
        console.log('💬 MESSAGE RENDER:', {
          index: idx,
          role: msg.role,
          isCandidate,
          isLastInterviewer,
          textLength: msg.text?.length || 0,
          textPreview: msg.text?.substring(0, 30) + (msg.text?.length > 30 ? '...' : ''),
          isInterruption: msg.isInterruption,
          interrupted: msg.interrupted,
          showTypingCursor: isLastInterviewer && isSpeaking,
          timestamp: new Date().toISOString()
        });
        
        return (
          <Box key={idx} sx={{
            mb: 2,
            display: 'flex',
            justifyContent: isCandidate ? 'flex-end' : 'flex-start'
          }}>
            <Box sx={{
              bgcolor: isCandidate ? 'primary.main' : 'grey.200',
              color: isCandidate ? 'primary.contrastText' : 'text.primary',
              px: 2, py: 1, borderRadius: 2, maxWidth: '70%',
              position: 'relative'
            }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                {isCandidate ? 'You' : 'Interviewer'}
                {msg.isInterruption && (
                  <>
                    {console.log('💬 RENDER: Showing interruption chip for message', idx)}
                    <Chip 
                      label="Interruption" 
                      size="small" 
                      color="warning" 
                      sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} 
                    />
                  </>
                )}
              </Typography>
              {msg.text}
              {msg.interrupted && (
                <>
                  {console.log('💬 RENDER: Showing interrupted indicator for message', idx)}
                  <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    (interrupted)
                  </Typography>
                </>
              )}
              {isLastInterviewer && isSpeaking && (
                <>
                  {console.log('💬 RENDER: Showing typing cursor and speaking indicator for last interviewer message')}
                  <Box 
                    component="span"
                    sx={{ 
                      position: 'relative',
                      display: 'inline-block',
                      ml: 0.5,
                      width: '0.5em',
                      height: '1em',
                      borderRight: '2px solid',
                      animation: 'blink 1s step-end infinite'
                    }}
                  />
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
                </>
              )}
            </Box>
          </Box>
        );
      })}
      {console.log('💬 RENDER: Finished rendering all messages')}
    </Box>
  );
};

export default ChatDisplay; 