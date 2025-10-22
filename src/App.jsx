import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import axios from 'axios';
import ChatPanel from './components/ChatPanel';
import Toolbox from './components/Toolbox';

const nodeTypes = {
  ecosystem: { background: '#6366f1', color: '#fff' }, // Updated indigo
  utility: { background: '#10b981', color: '#fff' }, // Green
  aiTool: { background: '#f59e0b', color: '#fff' }, // Amber
  temporal: { background: '#ef4444', color: '#fff' }, // Red
};

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [schedule, setSchedule] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type, name) => {
    const newNode = {
      id: `${nodes.length + 1}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: name, type },
      style: nodeTypes[type] || { background: '#6b7280', color: '#fff' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const generatePipeline = async (prompt) => {
    try {
      const response = await axios.post('http://localhost:3333/generate-pipeline', { prompt });
      const { nodes: newNodes, edges: newEdges, schedule: newSchedule } = response.data.pipeline;

      // Clear previous nodes/edges for a fresh pipeline (or comment out to append)
      setNodes([]);
      setEdges([]);

      // Add all new nodes with proper positioning and animation
      const updatedNodes = newNodes.map((node, index) => ({
        id: node.id || `${index + 1}`,
        type: 'default',
        position: { x: 100 + index * 200, y: 100 + (index % 2) * 100 }, // Better positioning
        data: { label: node.name, type: node.type },
        style: nodeTypes[node.type] || { background: '#6b7280', color: '#fff' },
      }));

      // Transform edges to React Flow format
      const updatedEdges = newEdges.map((edge, index) => ({
        id: `e${edge.from}-${edge.to}`, // Unique ID for React Flow
        source: edge.from,
        target: edge.to,
        type: 'smoothstep', // Curved edges for better visuals
        animated: true, // Optional animation for edges
      }));

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setSchedule(newSchedule);

      // Optional: Animate nodes appearing one by one if you want that effect
      updatedNodes.forEach((_, index) => {
        setTimeout(() => {
          // Could add a class or state for animation here if needed
        }, index * 300);
      });
    } catch (error) {
      console.error('Error generating pipeline:', error);
    }
  };

  return (
    <div className="h-screen bg-dark-primary text-dark-text flex">
      {/* Chat Panel */}
      <div className="w-1/4 bg-dark-secondary p-4 border-r border-gray-600 shadow-lg animate-slide-in">
        <h2 className="text-xl font-bold mb-4 text-dark-accent">Chat & Prompts</h2>
        <ChatPanel onSendPrompt={generatePipeline} />
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 relative bg-dark-primary">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          fitView
          className="bg-dark-primary"
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
        {schedule && (
          <div className="absolute top-4 right-4 bg-dark-secondary p-3 rounded-lg shadow-md animate-fade-in">
            <h3 className="font-semibold text-dark-accent">Schedule</h3>
            <p className="text-sm">Interval: {schedule.interval}</p>
            <p className="text-sm">Next Run: {schedule.next_run}</p>
          </div>
        )}
      </div>

      {/* Toolbox */}
      <div className="w-64 bg-dark-secondary p-4 border-l border-gray-600 shadow-lg animate-slide-in">
        <h2 className="text-xl font-bold mb-4 text-dark-accent">Toolbox</h2>
        <Toolbox onAddNode={addNode} />
      </div>
    </div>
  );
}

export default App;
