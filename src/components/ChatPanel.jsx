import React, { useState, useRef, useEffect } from 'react';

function ChatPanel({ chatHistory, onChatSubmit, isLoading }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    // Immediate scroll for better UX
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });

      // Fallback with a slight delay if the first one doesn't work
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 150);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    // Also scroll when loading state changes (when new response arrives)
    scrollToBottom();
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onChatSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (exampleText) => {
    setMessage(exampleText);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full bg-n8n-dark min-h-0 max-h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-n8n-primary">AI Employee Pro Max 9000</h2>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages-container flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-full">
        {chatHistory.length === 0 && (
          <div className="text-center text-n8n-secondary mt-8">
            <div className="mb-4">
              <span className="text-4xl">🚀</span>
            </div>
            <p className="mb-2">Welcome to AI Workflow Canvas!</p>
            <p className="text-sm mb-4">Describe what you want to automate and I'll create a visual workflow for you.</p>
            
            <div className="space-y-2">
              <p className="text-xs text-n8n-muted">Try these examples:</p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  onClick={() => handleExampleClick("Get updates from Google Sheets every week and send to Slack")}
                  className="example-prompt-button text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs transition-all duration-200 hover:border-blue-400 hover:text-blue-300"
                >
                  📊 Get updates from Google Sheets every week and send to Slack
                </button>
                <button
                  onClick={() => handleExampleClick("Monitor website uptime and send email alerts when down")}
                  className="example-prompt-button text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs transition-all duration-200 hover:border-green-400 hover:text-green-300"
                >
                  🌐 Monitor website uptime and send email alerts when down
                </button>
                <button
                  onClick={() => handleExampleClick("Sync customer data between HubSpot and Salesforce daily")}
                  className="example-prompt-button text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs transition-all duration-200 hover:border-purple-400 hover:text-purple-300"
                >
                  🔄 Sync customer data between HubSpot and Salesforce daily
                </button>
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role} ${msg.isExecution ? 'execution-message' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs opacity-70">
                {msg.role === 'user' ? 'You' : msg.isExecution ? '🚀 Execution' : 'Assistant'}
              </span>
              <span className="text-xs opacity-50">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
            <div className={`whitespace-pre-wrap break-words overflow-wrap-anywhere ${msg.isExecution ? 'font-mono text-sm' : ''}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to automate..."
              className="flex-1 chat-input resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md text-sm font-medium h-full"
              style={{ height: 'calc(2.5rem + 2px)' }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
