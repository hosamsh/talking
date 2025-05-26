// Frontend debug utilities
const DEBUG = process.env.REACT_APP_DEBUG === 'true' || process.env.NODE_ENV === 'development';

// Debug logger with categories
export const debugLog = {
  api: (message, data) => {
    if (DEBUG) console.log(`🌐 API: ${message}`, data);
  },
  
  audio: (message, data) => {
    if (DEBUG) console.log(`🔊 AUDIO: ${message}`, data);
  },
  
  state: (message, data) => {
    if (DEBUG) console.log(`📊 STATE: ${message}`, data);
  },
  
  ui: (message, data) => {
    if (DEBUG) console.log(`🎨 UI: ${message}`, data);
  },
  
  error: (message, error) => {
    console.error(`❌ ERROR: ${message}`, error);
  },
  
  performance: (message, startTime) => {
    if (DEBUG) {
      const duration = performance.now() - startTime;
      console.log(`⚡ PERF: ${message} took ${duration.toFixed(2)}ms`);
    }
  }
};

// API call debugger wrapper
export const debugApiCall = async (name, apiCall) => {
  const startTime = performance.now();
  debugLog.api(`Starting ${name}`);
  
  try {
    const result = await apiCall();
    debugLog.performance(`${name} completed`, startTime);
    debugLog.api(`${name} success`, result);
    return result;
  } catch (error) {
    debugLog.error(`${name} failed`, error);
    throw error;
  }
};

// State change debugger for React hooks
export const debugStateChange = (stateName, oldValue, newValue) => {
  if (DEBUG && oldValue !== newValue) {
    debugLog.state(`${stateName} changed`, {
      from: oldValue,
      to: newValue,
      timestamp: new Date().toISOString()
    });
  }
};

// Audio event debugger
export const debugAudioEvent = (event, element, details = {}) => {
  debugLog.audio(`Audio ${event}`, {
    element: element?.tagName || 'unknown',
    currentTime: element?.currentTime,
    duration: element?.duration,
    readyState: element?.readyState,
    ...details
  });
};

// Component lifecycle debugger
export const debugComponent = (componentName) => ({
  mount: () => debugLog.ui(`${componentName} mounted`),
  unmount: () => debugLog.ui(`${componentName} unmounted`),
  render: (props) => debugLog.ui(`${componentName} rendered`, props),
  update: (prevProps, nextProps) => {
    if (DEBUG) {
      const changes = Object.keys(nextProps).filter(
        key => prevProps[key] !== nextProps[key]
      );
      if (changes.length > 0) {
        debugLog.ui(`${componentName} props changed`, { changes });
      }
    }
  }
});

// Network request interceptor for debugging
export const setupNetworkDebugging = () => {
  if (!DEBUG) return;

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = performance.now();
    const [url, options] = args;
    
    debugLog.api('Fetch request', {
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body
    });

    try {
      const response = await originalFetch(...args);
      debugLog.performance(`Fetch ${url}`, startTime);
      debugLog.api('Fetch response', {
        url,
        status: response.status,
        statusText: response.statusText
      });
      return response;
    } catch (error) {
      debugLog.error(`Fetch failed for ${url}`, error);
      throw error;
    }
  };
};

// Session storage debugger
export const debugSession = {
  get: (key) => {
    const value = sessionStorage.getItem(key);
    debugLog.state(`Session get: ${key}`, value);
    return value;
  },
  
  set: (key, value) => {
    debugLog.state(`Session set: ${key}`, value);
    sessionStorage.setItem(key, value);
  },
  
  remove: (key) => {
    debugLog.state(`Session remove: ${key}`);
    sessionStorage.removeItem(key);
  }
};

// Error boundary helper
export const debugErrorBoundary = (error, errorInfo) => {
  debugLog.error('React Error Boundary caught error', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  });
}; 