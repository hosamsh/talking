import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import TextToSpeech from './pages/TextToSpeech';
import SpeechToText from './pages/SpeechToText';
import AzureWhisperStreamingPage from './pages/AzureWhisperStreamingPage';
import VoiceChatPage from './pages/VoiceChatPage';
import InterviewPage from './pages/InterviewPage';

function App() {
  return (
    <Router>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Voice Interaction Demo
          </Typography>
          <Button 
            color="inherit" 
            component={Link} 
            to="/speech-to-text"
            startIcon={<MicIcon />}
          >
            Speech to Text
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/text-to-speech"
            startIcon={<RecordVoiceOverIcon />}
          >
            Text to Speech
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/azure-whisper-streaming"
            startIcon={<RadioButtonCheckedIcon />}
          >
            Azure Whisper
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/voice-chat"
            startIcon={<RadioButtonCheckedIcon />}
          >
            Voice Chat
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/interview"
            startIcon={<MicIcon />}
          >
            Interview Practice
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container>
        <Routes>
          <Route path="/speech-to-text" element={<SpeechToText />} />
          <Route path="/text-to-speech" element={<TextToSpeech />} />
          <Route path="/azure-whisper-streaming" element={<AzureWhisperStreamingPage />} />
          <Route path="/voice-chat" element={<VoiceChatPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Container>
    </Router>
  );
}

function Home() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center'
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Voice Interaction Demo
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
        Select an option from the menu above to get started
      </Typography>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<MicIcon />}
          component={Link}
          to="/speech-to-text"
        >
          Speech to Text
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<RecordVoiceOverIcon />}
          component={Link}
          to="/text-to-speech"
        >
          Text to Speech
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<RadioButtonCheckedIcon />}
          component={Link}
          to="/azure-whisper-streaming"
        >
          Azure Whisper
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<MicIcon />}
          component={Link}
          to="/interview"
        >
          Interview Practice
        </Button>
      </Box>
    </Box>
  );
}

export default App;
