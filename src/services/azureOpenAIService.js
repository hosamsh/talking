/**
 * Re-export from modular services
 * This file is kept for backward compatibility
 */

import { textToSpeech, isServiceConfigured, getAvailableVoices } from './azoaiTts';
import { getLLMResponseStream, isLLMServiceConfigured } from './azoaiLlm';

export {
  // TTS exports
  textToSpeech,
  isServiceConfigured,
  getAvailableVoices,
  
  // LLM exports
  getLLMResponseStream,
  isLLMServiceConfigured
}; 