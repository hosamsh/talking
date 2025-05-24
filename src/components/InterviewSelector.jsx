import React, { useState } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { interviewTypes } from '../config/interviewPrompts';

const InterviewSelector = ({ onStartInterview, onError }) => {
  const [interviewType, setInterviewType] = useState('');

  const handleStartInterview = () => {
    if (!interviewType) {
      onError('Please select an interview type');
      return;
    }
    onStartInterview(interviewType);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Select an interview type to begin. The AI will act as the interviewer and ask you questions. 
        Speak your answers naturally, and the interview will progress based on your responses.
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Interview Type</InputLabel>
        <Select
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value)}
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
          onClick={handleStartInterview}
          size="large"
        >
          Start Interview
        </Button>
      </Box>
    </Box>
  );
};

export default InterviewSelector; 