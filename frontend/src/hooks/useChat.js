import { useState, useRef, useCallback } from 'react';
import { getLLMResponseStream } from '../services/llm';
import { getInterviewConfiguration } from '../services/interviews';
import { createSession, addMessage, endSession } from '../services/sessions';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const sessionIdRef = useRef(null);
  const llmCancelTokenRef = useRef(null);
  const currentInterviewIdRef = useRef(null);

  const addUserMessage = useCallback(async (userText, isInterruption = false) => {
    if (isInterruption) {
      setMessages(msgs => {
        const lastInterviewerIdx = [...msgs].reverse().findIndex(m => m.role === 'interviewer');
        if (lastInterviewerIdx >= 0) {
          const realIdx = msgs.length - 1 - lastInterviewerIdx;
          const updatedMsgs = [...msgs];
          updatedMsgs[realIdx] = {
            ...updatedMsgs[realIdx],
            interrupted: true
          };
          return [...updatedMsgs, { 
            role: 'candidate', 
            text: userText, 
            isInterruption: true 
          }];
        }
        return [...msgs, { 
          role: 'candidate', 
          text: userText, 
          isInterruption: true 
        }];
      });
    } else {
      setMessages(msgs => [...msgs, { role: 'candidate', text: userText }]);
    }
    
    // Add message to backend session
    if (sessionIdRef.current) {
      try {
        await addMessage(sessionIdRef.current, 'candidate', userText, { isInterruption });
      } catch (error) {
        console.error('Failed to add message to session:', error.message);
      }
    }
  }, []);

  const addInterviewerMessage = useCallback(() => {
    setMessages(msgs => [...msgs, { role: 'interviewer', text: '' }]);
  }, []);

  const updateLastInterviewerMessage = useCallback(async (text) => {
    setMessages(msgs => {
      const newMsgs = [...msgs];
      const lastIdx = newMsgs.length - 1;
      if (lastIdx >= 0 && newMsgs[lastIdx].role === 'interviewer') {
        newMsgs[lastIdx].text = text;
      }
      return newMsgs;
    });

    // Add completed interviewer message to backend session
    if (sessionIdRef.current && text && text.trim()) {
      try {
        await addMessage(sessionIdRef.current, 'interviewer', text);
      } catch (error) {
        console.error('Failed to add message to session:', error.message);
      }
    }
  }, []);

  const generateInterviewerResponse = useCallback(async (userMessage) => {
    console.log('🤖 GENERATE INTERVIEWER RESPONSE: Called with', { 
      userMessage, 
      sessionId: sessionIdRef.current, 
      interviewId: currentInterviewIdRef.current 
    });
    
    const cancelToken = { cancelled: false };
    llmCancelTokenRef.current = cancelToken;
    
    // Ensure userMessage is a string
    const messageText = typeof userMessage === 'string' ? userMessage : String(userMessage || '');
    
    if (!sessionIdRef.current) {
      console.error('🤖 GENERATE INTERVIEWER RESPONSE: No active session found');
      throw new Error('No active session found');
    }

    try {
      console.log('🤖 GENERATE INTERVIEWER RESPONSE: Setting loading to true');
      setLoading(true);
      
      let fullResponse = '';
      
      console.log('🤖 GENERATE INTERVIEWER RESPONSE: Starting LLM stream', {
        messageText,
        sessionId: sessionIdRef.current,
        interviewId: currentInterviewIdRef.current
      });
      
      // Use session-based LLM streaming
      const streamGenerator = getLLMResponseStream(
        messageText, 
        sessionIdRef.current, // Pass session ID instead of conversation history
        { maxTokens: 300, temperature: 0.7 },
        currentInterviewIdRef.current // Pass interview ID to backend
      );

      for await (const chunk of streamGenerator) {
        if (cancelToken.cancelled) {
          console.log('🤖 GENERATE INTERVIEWER RESPONSE: Stream cancelled');
          break;
        }
        
        fullResponse += chunk;
        // Don't update UI during streaming - let playAudioWithTyping handle it
      }

      if (!cancelToken.cancelled) {
        console.log('🤖 GENERATE INTERVIEWER RESPONSE: Stream completed successfully', { 
          fullResponse: fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : '')
        });
        return fullResponse;
      }
      
      console.log('🤖 GENERATE INTERVIEWER RESPONSE: Stream was cancelled, returning empty string');
      return ''; // Return empty string if cancelled
    } catch (error) {
      console.error('🤖 GENERATE INTERVIEWER RESPONSE: Error occurred', error);
      
      if (!cancelToken.cancelled) {
        updateLastInterviewerMessage('Sorry, I encountered an error. Could you please repeat that?');
        return 'Sorry, I encountered an error. Could you please repeat that?';
      }
      
      return ''; // Return empty string if cancelled
    } finally {
      console.log('🤖 GENERATE INTERVIEWER RESPONSE: Setting loading to false');
      setLoading(false);
    }
  }, [updateLastInterviewerMessage]);

  const initializeConversation = useCallback(async (interviewType) => {
    console.log('🎬 INITIALIZE CONVERSATION: Starting', { interviewType });
    
    try {
      console.log('🎬 INITIALIZE CONVERSATION: Clearing messages and setting interview type');
      setMessages([]);
      setCurrentQuestion(null);
      
      // Set the current interview type for LLM calls
      currentInterviewIdRef.current = interviewType;
      console.log('🎬 INITIALIZE CONVERSATION: Set currentInterviewIdRef to', interviewType);
      
      // Create new session on backend (now includes initial question)
      console.log('🎬 INITIALIZE CONVERSATION: Creating session on backend');
      const sessionData = await createSession(interviewType);
      sessionIdRef.current = sessionData.sessionId;
      console.log('🎬 INITIALIZE CONVERSATION: Session created', { sessionId: sessionData.sessionId });
      
      // Set the initial question from session creation
      if (sessionData.initialQuestion) {
        console.log('🎬 INITIALIZE CONVERSATION: Setting initial question', sessionData.initialQuestion);
        setCurrentQuestion(sessionData.initialQuestion);
      }
      
      // Fetch interview configuration from backend
      console.log('🎬 INITIALIZE CONVERSATION: Fetching interview configuration');
      const interviewConfig = await getInterviewConfiguration(interviewType);
      
      if (!interviewConfig || !interviewConfig.configuration) {
        console.error('🎬 INITIALIZE CONVERSATION: Interview configuration not found');
        throw new Error('Interview configuration not found');
      }

      console.log('🎬 INITIALIZE CONVERSATION: Interview config fetched', interviewConfig);

      // Return the initial question from the question bank, not the generic one
      const finalQuestion = sessionData.initialQuestion ? 
        `${interviewConfig.configuration.initialQuestion}\n\nHere's your first question: ${sessionData.initialQuestion.question}` :
        interviewConfig.configuration.initialQuestion;
        
      console.log('🎬 INITIALIZE CONVERSATION: Returning final question', { finalQuestion });
      return finalQuestion;
        
    } catch (error) {
      console.error('🎬 INITIALIZE CONVERSATION: Error occurred', error);
      throw error;
    }
  }, []);

  const cleanup = useCallback(async () => {
    // Cancel any ongoing LLM generation
    if (llmCancelTokenRef.current) {
      llmCancelTokenRef.current.cancelled = true;
    }

    // End session on backend
    if (sessionIdRef.current) {
      try {
        await endSession(sessionIdRef.current);
      } catch (error) {
        console.error('Failed to end session:', error.message);
      }
    }

    // Reset all state
    setMessages([]);
    setLoading(false);
    setCurrentQuestion(null);
    sessionIdRef.current = null;
    llmCancelTokenRef.current = null;
    currentInterviewIdRef.current = null;
  }, []);

  return {
    messages,
    loading,
    currentQuestion,
    sessionId: sessionIdRef.current,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation,
    cleanup
  };
}; 