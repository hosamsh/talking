import React, { useState } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { interviewTypes } from '../config/interviewPrompts';

const InterviewTypeSelector = ({ onStartInterview, onError }) => {
  const [interviewType, setInterviewType] = useState('');

  const handleInterviewTypeChange = (e) => {
    setInterviewType(e.target.value);
  };

  const handleStartInterview = () => {
    if (!interviewType) {
      onError('Please select an interview type');
      return;
    }
    
    onStartInterview(interviewType);
  };

  const selectedType = interviewTypes.find(t => t.id === interviewType);

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
      
      {selectedType && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">
            {selectedType.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedType.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {selectedType.duration}
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

export default InterviewTypeSelector; 