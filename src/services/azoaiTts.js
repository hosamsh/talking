import axios from 'axios';

// Get values from environment variables
const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
const API_VERSION = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
const API_KEY = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
const DEPLOYMENT_NAME = process.env.REACT_APP_AZURE_OPENAI_TTS_DEPLOYMENT;

/**
 * Converts text to speech using Azure OpenAI API
 * 
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {Promise<ArrayBuffer>} - ArrayBuffer containing the audio data
 */
export const textToSpeech = async (text, voice) => {
  if (!API_KEY) {
    throw new Error('API key not found in environment variables');
  }

  if (!text.trim()) {
    throw new Error('Text is required');
  }

  try {
    const response = await axios({
      method: 'post',
      url: `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/audio/speech?api-version=${API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: `${DEPLOYMENT_NAME}`,
        input: text,
        voice: voice
      },
      responseType: 'arraybuffer'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling Azure TTS:', error);
    throw new Error(error.message || 'Error calling Azure TTS service');
  }
};

/**
 * Check if the Azure OpenAI TTS service is configured correctly
 * 
 * @returns {boolean} - True if the service is configured, false otherwise
 */
export const isServiceConfigured = () => {
  return !!(AZURE_ENDPOINT && API_VERSION && API_KEY && DEPLOYMENT_NAME);
};

/**
 * Get the list of available voices
 * 
 * @returns {Array} - Array of voice objects with value and label properties
 */
export const getAvailableVoices = () => {
  return [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'echo', label: 'Echo (Male)' },
    { value: 'fable', label: 'Fable (Male)' },
    { value: 'onyx', label: 'Onyx (Male)' },
    { value: 'nova', label: 'Nova (Female)' },
    { value: 'shimmer', label: 'Shimmer (Female)' }
  ];
}; 