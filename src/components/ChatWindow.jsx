import React from 'react';
import { Box } from '@mui/material';
import ChatMessage from './ChatMessage';

function ChatWindow({ messages, isSpeaking }) {
  return (
    <Box sx={{
      minHeight: 300,
      mb: 3,
      maxHeight: '50vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} msg={msg} isLast={idx === messages.length - 1} isSpeaking={isSpeaking} />
      ))}
    </Box>
  );
}

export default ChatWindow;
