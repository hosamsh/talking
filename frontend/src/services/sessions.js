// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Create a new interview session
 * 
 * @param {string} interviewType - The type of interview (e.g., 'scrum-master')
 * @returns {Promise<Object>} - Session data with sessionId and initial question
 */
export const createSession = async (interviewType) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interviewType })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
    }
    
    const sessionData = await response.json();
    return sessionData;
  } catch (error) {
    console.error('Failed to create session:', error.message);
    throw new Error(error.message || 'Error creating interview session');
  }
};

/**
 * Add a message to an interview session
 * 
 * @param {string} sessionId - The session ID
 * @param {string} role - The role ('interviewer' or 'candidate')
 * @param {string} text - The message text
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {Promise<Object>} - Response with messageId and messagesCount
 */
export const addMessage = async (sessionId, role, text, metadata = {}) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, text, metadata })
    });

    if (!response.ok) {
      throw new Error(`Failed to add message: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to add message:', error.message);
    throw new Error(error.message || 'Error adding message to session');
  }
};

/**
 * Get messages from an interview session
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} - Session data with messages array
 */
export const getSessionMessages = async (sessionId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}/messages`);

    if (!response.ok) {
      throw new Error(`Failed to get session messages: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to get session messages:', error.message);
    throw new Error(error.message || 'Error getting session messages');
  }
};

/**
 * End an interview session
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} - Session completion data
 */
export const endSession = async (sessionId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to end session: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to end session:', error.message);
    throw new Error(error.message || 'Error ending session');
  }
};

/**
 * Get session status
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} - Session status data
 */
export const getSessionStatus = async (sessionId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to get session status:', error.message);
    throw new Error(error.message || 'Error getting session status');
  }
}; 