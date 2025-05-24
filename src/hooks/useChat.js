import { useState, useRef, useCallback } from 'react';
import { getLLMResponseStream } from '../services/llm';
import { interviewPrompts } from '../config/interviewPrompts';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const conversationRef = useRef([]);

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
    setLoading(true);
    
    try {
      let assistantText = '';
      const options = {
        systemMessage: interviewPrompts[interviewType].systemPrompt
      };
      
      for await (const chunk of getLLMResponseStream(text, conversationRef.current, options)) {
        assistantText += chunk;
      }
      
      conversationRef.current.push({
        role: 'assistant',
        text: assistantText
      });
      
      return assistantText;
    } catch (err) {
      console.error('Conversation error:', err);
      throw new Error(err.message || 'Error in interview');
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeConversation = useCallback((interviewType) => {
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

  return {
    messages,
    loading,
    addUserMessage,
    addInterviewerMessage,
    updateLastInterviewerMessage,
    generateInterviewerResponse,
    initializeConversation
  };
}; 