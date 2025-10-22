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
      


      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-semibold mb-4 text-n8n-primary">Tools Library</h2>
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
