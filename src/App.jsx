import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ChatPanel from './components/ChatPanel';
import ToolsSidebar from './components/ToolsSidebar';
import ExecutionView from './components/ExecutionView';

const initialNodes = [];
const initialEdges = [];

// Custom Node Components
import { Handle, Position } from 'reactflow';

function EcosystemNode({ data }) {
  return (
    <div className="react-flow__node-ecosystem px-3 py-2 shadow-md rounded-md border-2 border-gray-600 bg-gray-800">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-400" />
      <div className="flex items-center">
        <span className="text-lg mr-2">{data.icon || '🌐'}</span>
        <span className="text-white text-sm font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400" />
    </div>
  );
}

function UtilityNode({ data }) {
  return (
    <div className="react-flow__node-utility px-3 py-2 shadow-md rounded-md border-2 border-gray-600 bg-gray-800">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-green-400" />
      <div className="flex items-center">
        <span className="text-lg mr-2">{data.icon || '⚙️'}</span>
        <span className="text-white text-sm font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-green-400" />
    </div>
  );
}

function AiToolNode({ data }) {
  return (
    <div className="react-flow__node-aiTool px-3 py-2 shadow-md rounded-md border-2 border-gray-600 bg-gray-800">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-purple-400" />
      <div className="flex items-center">
        <span className="text-lg mr-2">{data.icon || '🤖'}</span>
        <span className="text-white text-sm font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-purple-400" />
    </div>
  );
}

function TemporalNode({ data }) {
  return (
    <div className="react-flow__node-temporal px-3 py-2 shadow-md rounded-md border-2 border-gray-600 bg-gray-800">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-yellow-400" />
      <div className="flex items-center">
        <span className="text-lg mr-2">{data.icon || '⏰'}</span>
        <span className="text-white text-sm font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-yellow-400" />
    </div>
  );
}

const nodeTypes = {
  ecosystem: EcosystemNode,
  utility: UtilityNode,
  aiTool: AiToolNode,
  temporal: TemporalNode,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isExecutionRunning, setIsExecutionRunning] = useState(false);
  const [tools, setTools] = useState([]);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Load tools from API on mount
  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await fetch('http://localhost:3333/tools');
      const tools = await response.json();
      setTools(tools);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const name = event.dataTransfer.getData('application/reactflow/name');
      const toolType = event.dataTransfer.getData('application/reactflow/toolType');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${nodes.length + 1}`,
        type: toolType,
        position,
        data: { label: name },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes.length, setNodes]
  );

  const handleChatSubmit = async (message) => {
    setIsLoading(true);

    // Add user message to chat
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:3333/generate-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          existingNodes: nodes,
          existingEdges: edges,
        }),
      });

      const data = await response.json();

      if (data.pipeline) {
        // Got a complete pipeline
        if (data.pipeline.nodes && data.pipeline.nodes.length > 0) {
          generateCanvasFromPipeline(data.pipeline);
        }
        const assistantMessage = {
          role: 'assistant',
          content: data.message || 'Workflow generated successfully!',
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        // Fallback for text responses
        const assistantMessage = {
          role: 'assistant',
          content: data.message || 'I understood your request but need more information to create a complete workflow.',
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCanvasFromPipeline = (pipeline) => {
    // Find the tool data for each node to get icons
    const newNodes = pipeline.nodes.map((node, index) => {
      const toolData = tools.find(tool => tool.name === node.name || tool.type === node.type);
      return {
        id: node.id || `${Date.now()}-${index}`,
        type: node.type,
        position: { x: 100 + index * 200, y: 100 },
        data: {
          label: node.name || node.type,
          icon: toolData?.icon,
          parameters: node.parameters
        },
      };
    });

    const newEdges = pipeline.edges.map(edge => ({
      id: `edge-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const runWorkflow = () => {
    setIsExecutionRunning(true);
    // Simulate workflow execution
    setTimeout(() => {
      setIsExecutionRunning(false);
    }, 5000);
  };

  return (
    <div className="flex h-screen bg-n8n-dark text-n8n-primary">
      {/* Tools Sidebar */}
      <ToolsSidebar tools={tools} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-n8n-darker border-b border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">AI Workflow Canvas</h1>
            <button
              onClick={runWorkflow}
              disabled={isExecutionRunning || nodes.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-md text-sm font-medium"
            >
              {isExecutionRunning ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </header>

        {/* Chat and Canvas Container */}
        <div className="flex-1 flex">
          {/* Chat Panel */}
          <div className="w-80 border-r border-gray-700 flex flex-col">
            <ChatPanel
              chatHistory={chatHistory}
              onChatSubmit={handleChatSubmit}
              isLoading={isLoading}
            />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="top-right"
              connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
              connectionLineType="smoothstep"
              snapToGrid={true}
              snapGrid={[15, 15]}
            >
              <Controls />
              <Background />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Execution View */}
      <ExecutionView
        isVisible={isExecutionRunning}
        logs={[
          { type: 'info', message: 'Starting workflow execution...', timestamp: Date.now() },
          ...(isExecutionRunning ? [
            { type: 'running', message: 'Processing nodes...', timestamp: Date.now() + 1000 },
          ] : [])
        ]}
      />
    </div>
  );
}


export default App;
