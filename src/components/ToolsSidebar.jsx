import React, { useState } from 'react';

function ToolsSidebar({ tools = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Tools', icon: '🔧' },
    { id: 'ecosystem', name: 'Ecosystem', icon: '🌐' },
    { id: 'utility', name: 'Utilities', icon: '⚙️' },
    { id: 'aiTool', name: 'AI Tools', icon: '🤖' },
    { id: 'temporal', name: 'Temporal', icon: '⏰' },
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onDragStart = (event, tool) => {
    event.dataTransfer.setData('application/reactflow/type', tool.type);
    event.dataTransfer.setData('application/reactflow/name', tool.name);
    event.dataTransfer.setData('application/reactflow/toolType', tool.type);
    event.dataTransfer.setData('application/reactflow/icon', tool.icon || '');
    event.dataTransfer.effectAllowed = 'move';
  };

  const getCategoryTools = (categoryType) => {
    return tools.filter(tool => tool.type === categoryType);
  };

  return (
    <div className="w-80 tools-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-n8n-primary">Tools Library</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-n8n-light border border-gray-600 rounded-md text-n8n-primary placeholder-n8n-muted text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-n8n-light text-n8n-secondary hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTools.length === 0 && (
          <div className="text-center text-n8n-muted mt-8">
            <p>No tools found matching your search.</p>
          </div>
        )}

        {categories.slice(1).map(category => {
          const categoryTools = getCategoryTools(category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <h3 className="text-sm font-medium text-n8n-secondary mb-3 flex items-center">
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </h3>

              <div className="space-y-2">
                {categoryTools.map(tool => (
                  <div
                    key={tool.name}
                    className={`tool-item ${tool.color}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, tool)}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{tool.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-xs opacity-80 mt-1 line-clamp-2">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-700 text-xs text-n8n-muted">
        <p>💡 Drag tools onto the canvas to start building your workflow</p>
      </div>
    </div>
  );
}

export default ToolsSidebar;
