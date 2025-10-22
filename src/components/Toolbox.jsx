import React from 'react';

const Toolbox = ({ onAddNode }) => {
  const tools = [
    { type: 'ecosystem', name: 'Google Sheets', icon: '📊', color: 'bg-dark-node-ecosystem' },
    { type: 'ecosystem', name: 'Slack', icon: '💬', color: 'bg-dark-node-ecosystem' },
    { type: 'ecosystem', name: 'Gmail', icon: '✉️', color: 'bg-dark-node-ecosystem' },
    { type: 'utility', name: 'Webhook', icon: '🔗', color: 'bg-dark-node-utility' },
    { type: 'utility', name: 'API Call', icon: '🌐', color: 'bg-dark-node-utility' },
    { type: 'aiTool', name: 'Summarize', icon: '📝', color: 'bg-dark-node-aiTool' },
    { type: 'aiTool', name: 'Brainstorm', icon: '💡', color: 'bg-dark-node-aiTool' },
    { type: 'temporal', name: 'Schedule', icon: '⏰', color: 'bg-dark-node-temporal' },
  ];

  return (
    <div className="h-full">
      <div className="space-y-3">
        {tools.map((tool, index) => (
          <div
            key={index}
            className={`p-3 ${tool.color} text-white rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex items-center`}
            onClick={() => onAddNode(tool.type, tool.name)}
          >
            <span className="mr-2">{tool.icon}</span>
            <span className="text-sm font-medium">{tool.name}</span>
          </div>
        ))}
      </div>
      <button className="mt-6 w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
        Export Workflow
      </button>
    </div>
  );
};

export default Toolbox;
