// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Fetches all available interview types from the backend
 * 
 * @returns {Promise<Array>} - Array of interview type objects
 */
export const getInterviewTypes = async () => {
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  console.log('📋 INTERVIEW API: Fetching interview types', {
    requestId,
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch interview types: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = performance.now();
    
    console.log('📋 INTERVIEW API: Interview types fetched successfully', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      interviewCount: result.data?.length || 0,
      interviews: result.data?.map(i => ({ id: i.id, name: i.name })) || [],
      timestamp: new Date().toISOString()
    });
    
    return result.data || [];
  } catch (error) {
    const endTime = performance.now();
    
    console.error('📋 INTERVIEW API: Failed to fetch interview types', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      errorType: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Failed to load interview types');
  }
};

/**
 * Fetches specific interview configuration from the backend
 * 
 * @param {string} interviewId - The ID of the interview type
 * @returns {Promise<Object>} - Interview configuration object
 */
export const getInterviewConfiguration = async (interviewId) => {
  const requestId = Math.random().toString(36).slice(2, 11);
  const startTime = performance.now();
  
  console.log('📋 INTERVIEW API: Fetching interview configuration', {
    requestId,
    interviewId,
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });

  if (!interviewId) {
    throw new Error('Interview ID is required');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Interview type '${interviewId}' not found`);
      }
      throw new Error(`Failed to fetch interview configuration: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = performance.now();
    
    console.log('📋 INTERVIEW API: Interview configuration fetched successfully', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      interviewId,
      hasConfiguration: !!result.data?.configuration,
      hasSystemPrompt: !!result.data?.configuration?.systemPrompt,
      hasInitialQuestion: !!result.data?.configuration?.initialQuestion,
      followupQuestionsCount: result.data?.configuration?.followupQuestions?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return result.data;
  } catch (error) {
    const endTime = performance.now();
    
    console.error('📋 INTERVIEW API: Failed to fetch interview configuration', {
      requestId,
      responseTime: `${(endTime - startTime).toFixed(2)}ms`,
      interviewId,
      errorType: error.name,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(error.message || 'Failed to load interview configuration');
  }
};

/**
 * Check if the backend interview service is available
 * 
 * @returns {Promise<boolean>} - True if the service is available, false otherwise
 */
export const isInterviewServiceConfigured = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return data.services?.interviews || false;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}; 