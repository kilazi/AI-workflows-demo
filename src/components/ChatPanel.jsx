import React, { useState, useRef, useEffect } from 'react';

function ChatPanel({ chatHistory, onChatSubmit, isLoading }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onChatSubmit(message.trim());
      setMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full bg-n8n-dark">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-n8n-primary">AI Assistant</h2>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center text-n8n-secondary mt-8">
            <div className="mb-4">
              <span className="text-4xl">🚀</span>
            </div>
            <p className="mb-2">Welcome to AI Workflow Canvas!</p>
            <p className="text-sm">Describe what you want to automate and I'll create a visual workflow for you.</p>
            <p className="text-sm mt-2">Try: "Get updates from Google Sheets every week and send to Slack"</p>
          </div>
        )}

        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs opacity-70">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs opacity-50">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
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
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you want to automate..."
              className="flex-1 chat-input resize-none"
              rows={3}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md text-sm font-medium self-end"
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
