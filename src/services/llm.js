import { AzureOpenAI } from "openai";

// Get values from environment variables
const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
const API_VERSION = process.env.REACT_APP_AZURE_OPENAI_API_VERSION;
const API_KEY = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
const LLM_DEPLOYMENT_NAME = process.env.REACT_APP_AZURE_OPENAI_LLM_DEPLOYMENT;

/**
 * Streams responses from Azure OpenAI LLM
 * 
 * @param {string} userMessage - The user message to send to the LLM
 * @param {array} previousMessages - Optional array of previous messages for context
 * @param {object} options - Optional configuration for the LLM request
 * @yields {string} - Chunks of the response text
 */
export async function* getLLMResponseStream(userMessage, previousMessages = [], options = {}) {
  if (!API_KEY || !AZURE_ENDPOINT || !LLM_DEPLOYMENT_NAME) {
    throw new Error('Azure OpenAI LLM not configured. Please check environment variables.');
  }

  try {
    const client = new AzureOpenAI({
      endpoint: AZURE_ENDPOINT,
      apiKey: API_KEY,
      deployment: LLM_DEPLOYMENT_NAME,
      apiVersion: API_VERSION || "2024-04-01-preview",
      dangerouslyAllowBrowser: true
    });

    // Default system message for voice conversations
    const defaultSystemMessage = "You are a helpful AI assistant having a voice conversation. Keep your responses concise and conversational. Avoid lengthy explanations unless specifically asked.";
    
    // Prepare messages array with system message and previous messages if any
    const messages = [
      { role: "system", content: options.systemMessage || defaultSystemMessage },
      ...previousMessages.map(msg => ({ role: msg.role, content: msg.text })),
      { role: "user", content: userMessage }
    ];

    const response = await client.chat.completions.create({
      messages,
      stream: true,
      max_tokens: options.maxTokens || 300, // Keep responses reasonably short for voice
      temperature: options.temperature || 0.7,
      model: LLM_DEPLOYMENT_NAME
    });

    for await (const part of response) {
      const content = part.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  } catch (error) {
    console.error('Error streaming from LLM:', error);
    throw new Error(error.message || 'Error communicating with Azure OpenAI');
  }
}

/**
 * Check if the Azure OpenAI LLM service is configured correctly
 * 
 * @returns {boolean} - True if the service is configured, false otherwise
 */
export const isLLMServiceConfigured = () => {
  return !!(AZURE_ENDPOINT && API_VERSION && API_KEY && LLM_DEPLOYMENT_NAME);
}; 