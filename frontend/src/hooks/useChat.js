import { useState, useRef, useCallback } from 'react';
import { getLLMResponseStream } from '../services/llm';
import { createSession, addMessage, endSession, getSessionMessages, getSessionStatus } from '../services/sessions';

// Custom hook for managing chat conversation state and interactions
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [endReason, setEndReason] = useState('');
  const sessionIdRef = useRef(null);
  const llmCancelTokenRef = useRef(null);
  const currentInterviewIdRef = useRef(null);

  // Add a user message to the conversation
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

  // Add an empty interviewer message placeholder
  const addInterviewerMessage = useCallback(() => {
    setMessages(msgs => [...msgs, { role: 'interviewer', text: '' }]);
  }, []);

  // Update the last interviewer message with new text (UI only)
  const updateLastInterviewerMessage = useCallback((text) => {
    setMessages(msgs => {
      const newMsgs = [...msgs];
      const lastIdx = newMsgs.length - 1;
      if (lastIdx >= 0 && newMsgs[lastIdx].role === 'interviewer') {
        newMsgs[lastIdx].text = text;
      }
      return newMsgs;
    });
  }, []);

  // Save the completed interviewer message to backend session
  const saveInterviewerMessage = useCallback(async (text) => {
    if (sessionIdRef.current && text && text.trim()) {
      try {
        await addMessage(sessionIdRef.current, 'interviewer', text);
        
        // Check if interview ended after saving message
        const status = await getSessionStatus(sessionIdRef.current);
        if (status.status === 'ended_by_interviewer') {
          setInterviewEnded(true);
          setEndReason(status.endReason || 'Interview ended by interviewer');
        }
      } catch (error) {
        console.error('Failed to add message to session:', error.message);
      }
    }
  }, []);

  // Generate interviewer response using LLM streaming
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
        const errorMessage = 'Sorry, I encountered an error. Could you please repeat that?';
        updateLastInterviewerMessage(errorMessage);
        await saveInterviewerMessage(errorMessage);
        return errorMessage;
      }
      
      return ''; // Return empty string if cancelled
    } finally {
      console.log('🤖 GENERATE INTERVIEWER RESPONSE: Setting loading to false');
      setLoading(false);
    }
  }, [updateLastInterviewerMessage, saveInterviewerMessage]);

  // Load session messages from backend
  const loadSessionMessages = useCallback(async (sessionId) => {
    try {
      console.log('📥 LOAD SESSION MESSAGES: Loading messages for session', { sessionId });
      const sessionData = await getSessionMessages(sessionId);
      
      if (sessionData.messages && sessionData.messages.length > 0) {
        console.log('📥 LOAD SESSION MESSAGES: Setting messages from session', { 
          messageCount: sessionData.messages.length 
        });
        setMessages(sessionData.messages);
      }
    } catch (error) {
      console.error('📥 LOAD SESSION MESSAGES: Failed to load session messages', error);
      // Don't throw - let initialization continue even if message loading fails
    }
  }, []);

  // Initialize a new conversation with interview configuration
  const initializeConversation = useCallback(async (interviewType) => {
    console.log('🎬 INITIALIZE CONVERSATION: Starting', { interviewType });
    
        try {
      console.log('🎬 INITIALIZE CONVERSATION: Clearing messages and setting interview type');
      setMessages([]);
      setCurrentQuestion(null);
      setInterviewEnded(false);
      setEndReason('');
      
      // Set the current interview type for LLM calls
      currentInterviewIdRef.current = interviewType;
      console.log('🎬 INITIALIZE CONVERSATION: Set currentInterviewIdRef to', interviewType);
      
      // Create new session on backend (backend now handles all initialization)
      console.log('🎬 INITIALIZE CONVERSATION: Creating session on backend');
      const sessionData = await createSession(interviewType);
      sessionIdRef.current = sessionData.sessionId;
      console.log('🎬 INITIALIZE CONVERSATION: Session created', { 
        sessionId: sessionData.sessionId,
        welcomeMessage: sessionData.welcomeMessage 
      });
      
      // Backend now provides the complete welcome message with question
      // Load the initial conversation from the session
      // await loadSessionMessages(sessionData.sessionId);
      
      console.log('🎬 INITIALIZE CONVERSATION: Returning welcome message from backend');
      return sessionData.welcomeMessage;
        
    } catch (error) {
      console.error('🎬 INITIALIZE CONVERSATION: Error occurred', error);
      throw error;
    }
  }, []);

  // Clean up resources and end session
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
    setInterviewEnded(false);
    setEndReason('');
    sessionIdRef.current = null;
    llmCancelTokenRef.current = null;
    currentInterviewIdRef.current = null;
  }, []);

  return {
    messages,
    loading,
    currentQuestion,
    interviewEnded,
    endReason,
    sessionId: sessionIdRef.current,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    saveInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation,
    cleanup
  };
}; 