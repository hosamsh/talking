// src/components/AudioLevelIndicator.jsx
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

// Component for displaying audio level with visual indicator
function AudioLevelIndicator({ audioLevel, isSpeaking }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" gutterBottom>
        Audio Level
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={audioLevel} 
        color={isSpeaking ? "success" : "primary"}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" color={isSpeaking ? "success.main" : "text.secondary"} sx={{ mt: 1, display: 'block' }}>
        {isSpeaking ? 'Voice Detected' : 'Silent'}
      </Typography>
    </Box>
  );
}

export default AudioLevelIndicator;