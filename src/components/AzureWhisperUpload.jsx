import React, { useRef, useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { transcribeAudio } from '../services/whisperService';

function AzureWhisperUpload({ onTextUpdate, onLoadingChange, onActivityChange }) {
  const [audioFile, setAudioFile] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (onActivityChange) {
      onActivityChange(isActive);
    }
  }, [isActive, onActivityChange]);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAudioFile(file);
    setIsActive(true);
    onLoadingChange(true);
    
    try {
      const text = await transcribeAudio(file);
      onTextUpdate(text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Check console for details.');
    } finally {
      onLoadingChange(false);
      setIsActive(false);
    }
  };
  
  const handleClear = () => {
    setAudioFile(null);
  };
  
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={() => fileInputRef.current.click()}
        disabled={isActive}
      >
        Upload Audio File
      </Button>
      
      <Button 
        variant="outlined" 
        startIcon={<DeleteIcon />}
        onClick={handleClear} 
        disabled={!audioFile || isActive}
      >
        Clear File
      </Button>
      
      <input
        type="file"
        accept="audio/*"
        hidden
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
    </Box>
  );
}

export default AzureWhisperUpload;
