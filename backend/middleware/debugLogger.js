// Debug logging middleware for comprehensive request/response tracking
function debugLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Log incoming request
  console.log(`🔵 [${requestId}] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Capture original res.json and res.send
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`🟢 [${requestId}] Response ${res.statusCode} (${duration}ms)`, {
      timestamp: new Date().toISOString(),
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 500) + '...' : data
    });
    return originalJson.call(this, data);
  };

  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`🟢 [${requestId}] Response ${res.statusCode} (${duration}ms)`, {
      timestamp: new Date().toISOString(),
      data: typeof data === 'string' ? data.substring(0, 500) + '...' : data
    });
    return originalSend.call(this, data);
  };

  // Handle errors
  res.on('error', (error) => {
    console.error(`🔴 [${requestId}] Response Error:`, error);
  });

  next();
}

// Session state logger
function logSessionState(sessionId, action, details = {}) {
  const session = require('../server').interviewSessions?.get(sessionId);
  console.log(`📊 SESSION STATE [${sessionId}]`, {
    action,
    timestamp: new Date().toISOString(),
    sessionExists: !!session,
    messageCount: session?.messages?.length || 0,
    status: session?.status,
    interviewType: session?.interviewType,
    currentQuestionId: session?.currentQuestion?.id,
    usedQuestionsCount: session?.usedQuestions?.length || 0,
    ...details
  });
}

module.exports = { debugLogger, logSessionState }; 