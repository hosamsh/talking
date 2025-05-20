import axios from 'axios';

/**
 * Transcribes audio using Azure OpenAI Whisper
 * 
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @param {Object} options - Optional parameters for transcription
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudio = async (audioBlob, options = {}) => {
  // Create form data for the API request
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  
  // Force English language unless overridden by options
  if (!options.language) {
    formData.append('language', 'en');
  } else {
    formData.append('language', options.language);
  }
  
  const response = await axios.post(
    `${process.env.REACT_APP_AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.REACT_APP_AZURE_OPENAI_STT_DEPLOYMENT}/audio/transcriptions?api-version=2024-02-01`,
    formData,
    {
      headers: {
        'api-key': process.env.REACT_APP_AZURE_OPENAI_API_KEY,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data.text || '';
};
