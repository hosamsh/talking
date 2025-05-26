import React, { useState, useEffect } from 'react';
import { debugLog } from '../utils/debug';

// Debug panel for runtime debugging
const DebugPanel = ({ sessionId, messages, isRecording, isPlaying }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      setLogs(prev => [...prev.slice(-49), {
        type: 'log',
        timestamp: new Date().toISOString(),
        message: args.join(' ')
      }]);
      originalLog(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-49), {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: args.join(' ')
      }]);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
        debugLog.ui('Debug panel toggled', { visible: !isVisible });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.message.includes(filter.toUpperCase());
  });

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        Press Ctrl+Shift+D to open debug panel
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      height: '500px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'red', border: 'none', color: 'white', borderRadius: '4px' }}
        >
          ×
        </button>
      </div>

      {/* Current State */}
      <div style={{ marginBottom: '10px', padding: '5px', background: 'rgba(255,255,255,0.1)' }}>
        <strong>Current State:</strong>
        <div>Session ID: {sessionId || 'None'}</div>
        <div>Messages: {messages?.length || 0}</div>
        <div>Recording: {isRecording ? '🔴' : '⚫'}</div>
        <div>Playing: {isPlaying ? '🔊' : '🔇'}</div>
      </div>

      {/* Log Filter */}
      <div style={{ marginBottom: '10px' }}>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ background: 'black', color: 'white', border: '1px solid #333' }}
        >
          <option value="all">All Logs</option>
          <option value="API">API Calls</option>
          <option value="AUDIO">Audio Events</option>
          <option value="STATE">State Changes</option>
          <option value="UI">UI Events</option>
          <option value="ERROR">Errors</option>
        </select>
        <button 
          onClick={() => setLogs([])}
          style={{ marginLeft: '10px', background: '#333', border: 'none', color: 'white', padding: '2px 8px' }}
        >
          Clear
        </button>
      </div>

      {/* Logs */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        background: 'rgba(255,255,255,0.05)',
        padding: '5px'
      }}>
        {filteredLogs.map((log, index) => (
          <div 
            key={index}
            style={{ 
              marginBottom: '2px',
              color: log.type === 'error' ? '#ff6b6b' : '#fff',
              fontSize: '11px'
            }}
          >
            <span style={{ color: '#888' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            {log.message}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => debugLog.api('Manual test', { timestamp: Date.now() })}
          style={{ background: '#007acc', border: 'none', color: 'white', padding: '5px', fontSize: '10px' }}
        >
          Test Log
        </button>
        <button 
          onClick={() => console.log('Session State:', { sessionId, messages, isRecording, isPlaying })}
          style={{ background: '#28a745', border: 'none', color: 'white', padding: '5px', fontSize: '10px' }}
        >
          Log State
        </button>
      </div>
    </div>
  );
};

export default DebugPanel; 