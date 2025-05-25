import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Alert
} from '@mui/material';
import { getInterviewTypes } from '../services/interviews';

const InterviewSelector = ({ onStartInterview, onError }) => {
  const [interviewType, setInterviewType] = useState('');
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInterviewTypes = async () => {
      try {
        console.log('📋 INTERVIEW SELECTOR: Loading interview types from backend');
        setLoading(true);
        setError('');
        
        const types = await getInterviewTypes();
        setInterviewTypes(types);
        
        console.log('📋 INTERVIEW SELECTOR: Interview types loaded successfully', {
          typesCount: types.length,
          types: types.map(t => ({ id: t.id, name: t.name }))
        });
      } catch (err) {
        console.error('📋 INTERVIEW SELECTOR: Failed to load interview types', {
          error: err.message
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInterviewTypes();
  }, []);

  const handleStartInterview = () => {
    if (!interviewType) {
      onError('Please select an interview type');
      return;
    }
    
    console.log('📋 INTERVIEW SELECTOR: Starting interview', {
      interviewType,
      timestamp: new Date().toISOString()
    });
    
    onStartInterview(interviewType);
  };

  const selectedInterview = interviewTypes.find(t => t.id === interviewType);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading interview types...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load interview types: {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

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
      
      {selectedInterview && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">
            {selectedInterview.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedInterview.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {selectedInterview.duration}
          </Typography>
          {selectedInterview.category && (
            <Typography variant="body2" color="text.secondary">
              Category: {selectedInterview.category}
            </Typography>
          )}
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