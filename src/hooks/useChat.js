import { useState, useRef, useCallback } from 'react';
import { getLLMResponseStream } from '../services/llm';
import { interviewPrompts } from '../config/interviewPrompts';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const conversationRef = useRef([]);
  const llmCancelTokenRef = useRef(null);

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

  const generateInterviewerResponse = useCallback(async (text, interviewType) => {
    console.log('💬 GENERATE RESPONSE: Starting LLM generation', {
      text,
      interviewType,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    
    // Create a new cancel token for this LLM request
    llmCancelTokenRef.current = { cancelled: false };
    const cancelToken = llmCancelTokenRef.current;
    
    try {
      let assistantText = '';
      const options = {
        systemMessage: interviewPrompts[interviewType].systemPrompt
      };
      
      console.log('💬 GENERATE RESPONSE: Starting LLM stream');
      for await (const chunk of getLLMResponseStream(text, conversationRef.current, options)) {
        // Check if operation was cancelled
        if (cancelToken.cancelled) {
          console.log('💬 GENERATE RESPONSE: Operation cancelled, breaking stream');
          throw new Error('Operation cancelled');
        }
        assistantText += chunk;
      }
      
      if (!cancelToken.cancelled) {
        conversationRef.current.push({
          role: 'assistant',
          text: assistantText
        });
        console.log('💬 GENERATE RESPONSE: LLM generation completed successfully');
        return assistantText;
      } else {
        console.log('💬 GENERATE RESPONSE: Operation was cancelled after stream completion');
        throw new Error('Operation cancelled');
      }
    } catch (err) {
      if (cancelToken.cancelled) {
        console.log('💬 GENERATE RESPONSE: Operation cancelled during generation');
        throw new Error('Operation cancelled');
      }
      console.error('💬 GENERATE RESPONSE: Error occurred:', err);
      throw new Error(err.message || 'Error in interview');
    } finally {
      setLoading(false);
      // Clear the cancel token
      llmCancelTokenRef.current = null;
    }
  }, []);

  const initializeConversation = useCallback((interviewType) => {
    console.log('💬 INITIALIZE: Starting new conversation', {
      interviewType,
      timestamp: new Date().toISOString()
    });

    setMessages([]);
    conversationRef.current = [];
    
    const prompt = interviewPrompts[interviewType];
    if (!prompt) {
      throw new Error('Interview configuration not found');
    }

    conversationRef.current.push({
      role: 'system',
      text: prompt.systemPrompt
    });

    return prompt.initialQuestion;
  }, []);

  const cleanup = useCallback(async () => {
    console.log('💬 CLEANUP: Starting chat cleanup', {
      loading,
      messagesCount: messages.length,
      hasOngoingLLM: !!llmCancelTokenRef.current,
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