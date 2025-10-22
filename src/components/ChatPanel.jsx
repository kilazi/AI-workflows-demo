import React, { useState } from 'react';

const ChatPanel = ({ onSendPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (prompt.trim()) {
      setMessages([...messages, { type: 'user', text: prompt }]);
      onSendPrompt(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 p-3 bg-dark-primary rounded-lg border border-gray-600">
        {messages.length === 0 ? (
          <p className="text-dark-muted">Start chatting to build your workflow...</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`mb-3 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-3 rounded-lg max-w-xs ${msg.type === 'user' ? 'bg-dark-accent text-white' : 'bg-gray-600 text-dark-text'}`}>
                {msg.text}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your workflow..."
          className="flex-1 p-3 bg-dark-primary border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-dark-accent"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-4 py-3 bg-dark-accent hover:bg-blue-700 rounded-r-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
