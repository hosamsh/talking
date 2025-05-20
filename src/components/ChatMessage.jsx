import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

function ChatMessage({ msg, isLast, isSpeaking }) {
  return (
    <Box sx={{
      mb: 2,
      display: 'flex',
      justifyContent: msg.role === 'candidate' ? 'flex-end' : 'flex-start'
    }}>
      <Box sx={{
        bgcolor: msg.role === 'candidate' ? 'primary.main' : 'grey.200',
        color: msg.role === 'candidate' ? 'primary.contrastText' : 'text.primary',
        px: 2,
        py: 1,
        borderRadius: 2,
        maxWidth: '70%',
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
        {msg.role === 'interviewer' && isSpeaking && isLast && (
          <>
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
}

export default ChatMessage;
