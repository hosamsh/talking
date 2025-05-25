import { useState, useRef, useCallback } from 'react';
import { getLLMResponseStream } from '../services/llm';
import { getInterviewConfiguration } from '../services/interviews';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const conversationRef = useRef([]);
  const llmCancelTokenRef = useRef(null);
  const currentInterviewIdRef = useRef(null);

  const addUserMessage = useCallback((userText, isInterruption = false) => {
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
    
    conversationRef.current.push({
      role: 'user',
      text: userText
    });
  }, []);

  const addInterviewerMessage = useCallback(() => {
    setMessages(msgs => [...msgs, { role: 'interviewer', text: '' }]);
  }, []);

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

  const generateInterviewerResponse = useCallback(async (userMessage) => {
    const cancelToken = { cancelled: false };
    llmCancelTokenRef.current = cancelToken;
    
    // Ensure userMessage is a string
    const messageText = typeof userMessage === 'string' ? userMessage : String(userMessage || '');
    
    console.log('💬 GENERATE RESPONSE: Starting interviewer response generation', {
      userMessage: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
      userMessageType: typeof userMessage,
      conversationLength: conversationRef.current.length,
      currentInterviewId: currentInterviewIdRef.current,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);
      // Don't add interviewer message here - caller should handle it
      // addInterviewerMessage();
      
      let fullResponse = '';
      
      // Use server-side interview prompts by passing interview ID
      const streamGenerator = getLLMResponseStream(
        messageText, 
        conversationRef.current,
        { maxTokens: 300, temperature: 0.7 },
        currentInterviewIdRef.current // Pass interview ID to backend
      );

      for await (const chunk of streamGenerator) {
        if (cancelToken.cancelled) {
          console.log('💬 GENERATE RESPONSE: Generation cancelled by user');
          break;
        }
        
        fullResponse += chunk;
        // Don't update UI during streaming - let playAudioWithTyping handle it
        // updateLastInterviewerMessage(fullResponse);
      }

      if (!cancelToken.cancelled) {
        conversationRef.current.push({
          role: 'assistant',
          text: fullResponse
        });
        
        console.log('💬 GENERATE RESPONSE: Response generation completed', {
          responseLength: fullResponse.length,
          conversationLength: conversationRef.current.length,
          timestamp: new Date().toISOString()
        });
        
        return fullResponse;
      }
      
      return ''; // Return empty string if cancelled
    } catch (error) {
      console.error('💬 GENERATE RESPONSE: Error generating response', {
        error: error.message,
        userMessageType: typeof userMessage,
        timestamp: new Date().toISOString()
      });
      
      if (!cancelToken.cancelled) {
        updateLastInterviewerMessage('Sorry, I encountered an error. Could you please repeat that?');
        return 'Sorry, I encountered an error. Could you please repeat that?';
      }
      
      return ''; // Return empty string if cancelled
    } finally {
      setLoading(false);
    }
  }, [addInterviewerMessage, updateLastInterviewerMessage]);

  const initializeConversation = useCallback(async (interviewType) => {
    console.log('💬 INITIALIZE: Starting new conversation', {
      interviewType,
      timestamp: new Date().toISOString()
    });

    try {
      setMessages([]);
      conversationRef.current = [];
      currentInterviewIdRef.current = interviewType;
      
      // Fetch interview configuration from backend
      console.log('💬 INITIALIZE: Fetching interview configuration from backend');
      const interviewConfig = await getInterviewConfiguration(interviewType);
      
      if (!interviewConfig || !interviewConfig.configuration) {
        throw new Error('Interview configuration not found');
      }

      console.log('💬 INITIALIZE: Interview configuration loaded', {
        interviewType,
        hasSystemPrompt: !!interviewConfig.configuration.systemPrompt,
        hasInitialQuestion: !!interviewConfig.configuration.initialQuestion,
        followupQuestionsCount: interviewConfig.configuration.followupQuestions?.length || 0
      });

      // Note: We don't store the system prompt on frontend anymore
      // The backend will handle it based on the interview ID
      
      return interviewConfig.configuration.initialQuestion;
    } catch (error) {
      console.error('💬 INITIALIZE: Failed to initialize conversation', {
        interviewType,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  const cleanup = useCallback(async () => {
    console.log('💬 CLEANUP: Starting chat cleanup', {
      loading,
      messagesCount: messages.length,
      hasOngoingLLM: !!llmCancelTokenRef.current,
      currentInterviewId: currentInterviewIdRef.current,
      timestamp: new Date().toISOString()
    });

    // Cancel any ongoing LLM generation
    if (llmCancelTokenRef.current) {
      console.log('💬 CLEANUP: Cancelling ongoing LLM generation');
      llmCancelTokenRef.current.cancelled = true;
    }

    // Reset all state
    console.log('💬 CLEANUP: Resetting chat state');
    setMessages([]);
    setLoading(false);
    conversationRef.current = [];
    llmCancelTokenRef.current = null;
    currentInterviewIdRef.current = null;

    console.log('💬 CLEANUP: Chat cleanup completed');
  }, [loading, messages.length]);

  return {
    messages,
    loading,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation,
    cleanup
  };
}; 