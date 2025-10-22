import React, { useEffect, useState } from 'react';

function ExecutionView({ isVisible, logs = [] }) {
  const [displayedLogs, setDisplayedLogs] = useState([]);

  useEffect(() => {
    if (isVisible && logs.length > 0) {
      // Animate logs appearing one by one
      logs.forEach((log, index) => {
        setTimeout(() => {
          setDisplayedLogs(prev => [...prev, log]);
        }, index * 500);
      });
    } else if (!isVisible) {
      setDisplayedLogs([]);
    }
  }, [isVisible, logs]);

  if (!isVisible) return null;

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'running': return '▶️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'running': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="execution-view w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="bg-n8n-darker p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-lg mr-2">⚡</span>
            <h3 className="text-lg font-semibold">Workflow Execution</h3>
          </div>
          <div className="flex items-center text-green-400">
            <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm">Running</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-n8n-light p-4">
          <div className="flex justify-between text-sm text-n8n-secondary mb-2">
            <span>Progress</span>
            <span>{displayedLogs.length}/{logs.length}</span>
          </div>
          <div className="w-full bg-n8n-darker rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(displayedLogs.length / logs.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-64">
          {displayedLogs.length === 0 && (
            <div className="text-center text-n8n-muted py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p>Initializing workflow execution...</p>
            </div>
          )}

          {displayedLogs.map((log, index) => (
            <div key={index} className={`execution-log ${log.type}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="mr-3 text-sm">{getLogIcon(log.type)}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${getLogColor(log.type)}`}>
                      {log.message}
                    </div>
                    {log.details && (
                      <div className="text-xs text-n8n-muted mt-1">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-n8n-muted">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-n8n-darker p-4 border-t border-gray-700 text-center">
          <p className="text-sm text-n8n-muted">
            Workflow execution in progress... This may take a few moments.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExecutionView;
