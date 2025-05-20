import { useState, useRef, useEffect } from 'react';
import { interviewPrompts } from '../config/interviewPrompts';
import { getLLMResponseStream } from '../services/azoaiLlm';
import { textToSpeech } from '../services/azoaiTts';

function useInterview() {
  const [interviewType, setInterviewType] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voice = 'nova';

  const audioRef = useRef(null);
  const conversationRef = useRef([]);
  const playbackCancelToken = useRef(null);

  const startInterview = async () => {
    if (!interviewType) {
      setError('Please select an interview type');
      return;
    }

    setError('');
    setMessages([]);
    conversationRef.current = [];
    setInterviewStarted(true);

    const prompt = interviewPrompts[interviewType];
    if (!prompt) {
      setError('Interview configuration not found');
      return;
    }

    conversationRef.current.push({
      role: 'system',
      text: prompt.systemPrompt
    });

    await sendInterviewerMessage(prompt.initialQuestion);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playbackCancelToken.current) {
      playbackCancelToken.current.cancelled = true;
    }
    setIsSpeaking(false);
  };

  const playAudioWithTyping = async (text, cancelToken) => {
    if (!text.trim()) return;
    try {
      setIsSpeaking(true);
      const audioData = await textToSpeech(text, voice);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      audioRef.current.src = url;
      await new Promise(resolve => {
        audioRef.current.onloadedmetadata = resolve;
      });

      const audioDuration = audioRef.current.duration * 1000 || text.length * 67;
      audioRef.current.play();

      const words = text.split(' ');
      const timePerWord = audioDuration / words.length;
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        if (cancelToken && cancelToken.cancelled) break;

        currentText += (i > 0 ? ' ' : '') + words[i];
        setMessages(msgs => {
          const newMsgs = [...msgs];
          const lastIdx = newMsgs.length - 1;
          if (lastIdx >= 0 && newMsgs[lastIdx].role === 'interviewer') {
            newMsgs[lastIdx].text = currentText;
          }
          return newMsgs;
        });
        await new Promise(resolve => {
          const timer = setTimeout(resolve, timePerWord);
          if (cancelToken) {
            const check = setInterval(() => {
              if (cancelToken.cancelled) {
                clearTimeout(timer);
                clearInterval(check);
                resolve();
              }
            }, 50);
          }
        });
      }

      if (!audioRef.current.ended && !(cancelToken && cancelToken.cancelled)) {
        await new Promise(resolve => {
          audioRef.current.onended = resolve;
          if (cancelToken) {
            const checkInterval = setInterval(() => {
              if (cancelToken.cancelled) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
          }
        });
      }

      setIsSpeaking(false);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  const sendInterviewerMessage = async (text) => {
    setLoading(true);
    setError('');
    try {
      setMessages(msgs => [...msgs, { role: 'interviewer', text: '' }]);
      let assistantText = '';
      const options = { systemMessage: interviewPrompts[interviewType].systemPrompt };
      for await (const chunk of getLLMResponseStream(text, conversationRef.current, options)) {
        assistantText += chunk;
      }
      conversationRef.current.push({ role: 'assistant', text: assistantText });
      playbackCancelToken.current = { cancelled: false };
      await playAudioWithTyping(assistantText, playbackCancelToken.current);
    } catch (err) {
      console.error('Conversation error:', err);
      setError(err.message || 'Error in interview');
    } finally {
      setLoading(false);
    }
  };

  const handleUserResponse = async (userText, isInterruption = false) => {
    if (!userText.trim()) return;
    if (isInterruption) {
      setMessages(msgs => {
        const lastInterviewerIdx = [...msgs].reverse().findIndex(m => m.role === 'interviewer');
        if (lastInterviewerIdx >= 0) {
          const realIdx = msgs.length - 1 - lastInterviewerIdx;
          const updated = [...msgs];
          updated[realIdx] = { ...updated[realIdx], interrupted: true };
          return [...updated, { role: 'candidate', text: userText, isInterruption: true }];
        }
        return [...msgs, { role: 'candidate', text: userText, isInterruption: true }];
      });
    } else {
      setMessages(msgs => [...msgs, { role: 'candidate', text: userText }]);
    }
    conversationRef.current.push({ role: 'user', text: userText });
    await sendInterviewerMessage("Continue the interview based on the candidate's response.");
  };

  const handleRecordingStart = () => {
    if (isSpeaking) {
      stopPlayback();
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    interviewType,
    setInterviewType,
    interviewStarted,
    setInterviewStarted,
    messages,
    loading,
    setLoading,
    error,
    setError,
    isSpeaking,
    audioRef,
    startInterview,
    handleUserResponse,
    handleRecordingStart
  };
}

export default useInterview;
