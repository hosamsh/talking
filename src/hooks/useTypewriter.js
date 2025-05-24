import { useState, useCallback } from 'react';

export const useTypewriter = () => {
  const [typingText, setTypingText] = useState('');

  const typeWriterEffect = useCallback((text, durationMs, cancelToken) => {
    return new Promise((resolve) => {
      const words = text.split(' ');
      let currentIndex = 0;
      setTypingText('');
      
      const timePerWord = durationMs / words.length;
      
      if (words.length === 0) {
        resolve();
        return;
      }
      
      const typingInterval = setInterval(() => {
        if (cancelToken && cancelToken.cancelled) {
          clearInterval(typingInterval);
          resolve();
          return;
        }
        
        if (currentIndex < words.length) {
          setTypingText(prev => (prev ? prev + ' ' : '') + words[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          resolve();
        }
      }, timePerWord);
    });
  }, []);

  return {
    typingText,
    setTypingText,
    typeWriterEffect
  };
}; 