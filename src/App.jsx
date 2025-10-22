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

const initialNodes = [];
const initialEdges = [];

// Custom Node Components
import { Handle, Position } from 'reactflow';

// Helper function to render parameter chips
function ParameterChips({ parameters }) {
  // Debug log to see what parameters we're getting
  console.log('🔍 ParameterChips received parameters:', parameters);
  console.log('🔍 Parameters type:', typeof parameters);
  console.log('🔍 Parameters keys:', parameters ? Object.keys(parameters) : 'NO PARAMETERS');
  
  // ALWAYS render something to test
  console.log('✅ ParameterChips: ALWAYS RENDERING TEST CHIP');
  return (
    <div className="parameter-chip bg-purple-500 text-white text-xs px-2 py-1 rounded-full mt-2">
      PARAMETERCHIPS WORKS: {parameters ? Object.keys(parameters).length : 0} params
    </div>
  );
}

// Cool schedule chip component
function ScheduleChip({ schedule, isFirstNode = false }) {
  if (!schedule || !schedule.interval) return null;

  const getScheduleIcon = (interval) => {
    switch (interval.toLowerCase()) {
      case 'daily': return '🌅';
      case 'weekly': return '📅';
      case 'monthly': return '🗓️';
      case 'hourly': return '⏰';
      default: return '⏱️';
    }
  };

  const getScheduleColor = (interval) => {
    switch (interval.toLowerCase()) {
      case 'daily': return 'bg-orange-500';
      case 'weekly': return 'bg-blue-500';
      case 'monthly': return 'bg-purple-500';
      case 'hourly': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return '';
    const date = new Date(nextRun);
    const now = new Date();
    const diffHours = Math.floor((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`schedule-chip ${getScheduleColor(schedule.interval)} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 mt-2 animate-pulse`}>
      <span>{getScheduleIcon(schedule.interval)}</span>
      <span className="font-medium">{schedule.interval}</span>
      {schedule.next_run && (
        <span className="opacity-80">• {formatNextRun(schedule.next_run)}</span>
      )}
    </div>
  );
}

function EcosystemNode({ data }) {
  const showType = data.type && data.type !== data.label;
  const isExecuting = data.isExecuting;
  const isFirstNode = data.isFirstNode;

  // Debug log to see what data we're getting
  console.log('🔍 EcosystemNode data:', data);
  console.log('🔍 EcosystemNode parameters:', data.parameters);
  console.log('🔍 EcosystemNode isFirstNode:', data.isFirstNode);
  console.log('🔍 EcosystemNode schedule:', data.schedule);
  console.log('🔍 EcosystemNode isExecuting:', isExecuting);

  return (
    <div className={`react-flow__node-ecosystem px-3 py-2 shadow-md rounded-md border-2 min-w-48 max-w-64 transition-all duration-300 ${
      isExecuting
        ? 'border-blue-400 bg-blue-900 shadow-lg shadow-blue-400/50 animate-pulse'
        : 'border-gray-600 bg-gray-800'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-400" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <span className="text-lg mr-2 flex-shrink-0">{data.icon || '🌐'}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isExecuting ? 'text-blue-100' : 'text-white'}`}>
              {data.label}
            </span>
            {showType && (
              <span className={`text-xs font-medium uppercase tracking-wide ${isExecuting ? 'text-blue-200' : 'text-blue-300'}`}>
                {data.type}
              </span>
            )}
          </div>
          {isExecuting && (
            <div className="ml-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
            </div>
          )}
        </div>
        {/* Simple parameter display */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs max-w-full">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="text-gray-400 truncate" title={`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`}>
                {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            ))}
          </div>
        )}
        
        {/* Schedule display */}
        {data.isFirstNode && data.schedule && data.schedule.interval && (
          <div className="mt-2 p-2 bg-blue-800 rounded text-xs">
            <div className="text-blue-200">Schedule: {data.schedule.interval}</div>
            {data.schedule.next_run && (
              <div className="text-blue-300">Next: {new Date(data.schedule.next_run).toLocaleString()}</div>
            )}
          </div>
        )}
        {isFirstNode && <ScheduleChip schedule={data.schedule} isFirstNode={true} />}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400" />
    </div>
  );
}

function UtilityNode({ data }) {
  const showType = data.type && data.type !== data.label;
  const isExecuting = data.isExecuting;
  const isFirstNode = data.isFirstNode;
  
  console.log('🔍 UtilityNode isExecuting:', isExecuting);

  return (
    <div className={`react-flow__node-utility px-3 py-2 shadow-md rounded-md border-2 min-w-48 max-w-64 transition-all duration-300 ${
      isExecuting
        ? 'border-green-400 bg-green-900 shadow-lg shadow-green-400/50 animate-pulse'
        : 'border-gray-600 bg-gray-800'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-green-400" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <span className="text-lg mr-2 flex-shrink-0">{data.icon || '⚙️'}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isExecuting ? 'text-green-100' : 'text-white'}`}>
              {data.label}
            </span>
            {showType && (
              <span className={`text-xs font-medium uppercase tracking-wide ${isExecuting ? 'text-green-200' : 'text-green-300'}`}>
                {data.type}
              </span>
            )}
          </div>
          {isExecuting && (
            <div className="ml-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
            </div>
          )}
        </div>
        {/* Simple parameter display */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs max-w-full">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="text-gray-400 truncate" title={`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`}>
                {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            ))}
          </div>
        )}
        
        {/* Schedule display */}
        {data.isFirstNode && data.schedule && data.schedule.interval && (
          <div className="mt-2 p-2 bg-blue-800 rounded text-xs">
            <div className="text-blue-200">Schedule: {data.schedule.interval}</div>
            {data.schedule.next_run && (
              <div className="text-blue-300">Next: {new Date(data.schedule.next_run).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-green-400" />
    </div>
  );
}

function AiToolNode({ data }) {
  const showType = data.type && data.type !== data.label;
  const isExecuting = data.isExecuting;
  const isFirstNode = data.isFirstNode;

  return (
    <div className={`react-flow__node-aiTool px-3 py-2 shadow-md rounded-md border-2 min-w-48 max-w-64 transition-all duration-300 ${
      isExecuting
        ? 'border-purple-400 bg-purple-900 shadow-lg shadow-purple-400/50 animate-pulse'
        : 'border-gray-600 bg-gray-800'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-purple-400" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <span className="text-lg mr-2 flex-shrink-0">{data.icon || '🤖'}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isExecuting ? 'text-purple-100' : 'text-white'}`}>
              {data.label}
            </span>
            {showType && (
              <span className={`text-xs font-medium uppercase tracking-wide ${isExecuting ? 'text-purple-200' : 'text-purple-300'}`}>
                {data.type}
              </span>
            )}
          </div>
          {isExecuting && (
            <div className="ml-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
            </div>
          )}
        </div>
        {/* Simple parameter display */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs max-w-full">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="text-gray-400 truncate" title={`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`}>
                {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            ))}
          </div>
        )}
        
        {/* Schedule display */}
        {data.isFirstNode && data.schedule && data.schedule.interval && (
          <div className="mt-2 p-2 bg-blue-800 rounded text-xs">
            <div className="text-blue-200">Schedule: {data.schedule.interval}</div>
            {data.schedule.next_run && (
              <div className="text-blue-300">Next: {new Date(data.schedule.next_run).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-purple-400" />
    </div>
  );
}

function TemporalNode({ data }) {
  const showType = data.type && data.type !== data.label;
  const isExecuting = data.isExecuting;
  const isFirstNode = data.isFirstNode;

  return (
    <div className={`react-flow__node-temporal px-3 py-2 shadow-md rounded-md border-2 min-w-48 max-w-64 transition-all duration-300 ${
      isExecuting
        ? 'border-yellow-400 bg-yellow-900 shadow-lg shadow-yellow-400/50 animate-pulse'
        : 'border-gray-600 bg-gray-800'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-yellow-400" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <span className="text-lg mr-2 flex-shrink-0">{data.icon || '⏰'}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isExecuting ? 'text-yellow-100' : 'text-white'}`}>
              {data.label}
            </span>
            {showType && (
              <span className={`text-xs font-medium uppercase tracking-wide ${isExecuting ? 'text-yellow-200' : 'text-yellow-300'}`}>
                {data.type}
              </span>
            )}
          </div>
          {isExecuting && (
            <div className="ml-2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
            </div>
          )}
        </div>
        {/* Simple parameter display */}
        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs max-w-full">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="text-gray-400 truncate" title={`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`}>
                {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
              </div>
            ))}
          </div>
        )}
        
        {/* Schedule display */}
        {data.isFirstNode && data.schedule && data.schedule.interval && (
          <div className="mt-2 p-2 bg-blue-800 rounded text-xs">
            <div className="text-blue-200">Schedule: {data.schedule.interval}</div>
            {data.schedule.next_run && (
              <div className="text-blue-300">Next: {new Date(data.schedule.next_run).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-yellow-400" />
    </div>
  );
}

// Function to map server node types to our custom node types
function mapNodeType(serverType) {
  // Map server types to our custom node types
  const typeMapping = {
    'Webhook': 'utility',
    'API Call': 'utility', 
    'Condition': 'utility',
    'Calculation': 'utility',
    'Google Sheets': 'ecosystem',
    'Slack': 'ecosystem',
    'Gmail': 'ecosystem',
    'HubSpot': 'ecosystem',
    'Salesforce': 'ecosystem',
    'GitHub': 'ecosystem',
    'Notion': 'ecosystem',
    'Jira': 'ecosystem',
    'OpenAI': 'aiTool',
    'Claude': 'aiTool',
    'Summarize': 'aiTool',
    'Schedule': 'temporal',
    'Delay': 'temporal',
    'Timer': 'temporal'
  };
  
  return typeMapping[serverType] || 'utility'; // Default to utility if not found
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
  const [executingNodeId, setExecutingNodeId] = useState(null);
  const [executionStep, setExecutionStep] = useState(0);
  const [tools, setTools] = useState([]);
  const [workflowSchedule, setWorkflowSchedule] = useState(null);
  const [parameterCollection, setParameterCollection] = useState({
    isActive: false,
    currentNodeIndex: 0,
    currentNodeType: null,
    collectedParameters: {},
    pendingPipeline: null
  });
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

  // Check if parameters are missing and start collection flow
  const checkAndCollectParameters = (pipeline) => {
    const missingParams = [];
    
    pipeline.nodes.forEach((node, index) => {
      const toolData = tools.find(tool => tool.name === node.name || tool.type === node.type);
      if (toolData && toolData.requiredParameters) {
        const requiredParams = Object.keys(toolData.requiredParameters);
        const providedParams = Object.keys(node.parameters || {});
        const missing = requiredParams.filter(param => !providedParams.includes(param));
        
        if (missing.length > 0) {
          missingParams.push({
            nodeIndex: index,
            nodeType: node.type,
            nodeName: node.name,
            missingParameters: missing,
            toolData: toolData
          });
        }
      }
    });

    if (missingParams.length > 0) {
      // Start parameter collection flow
      setParameterCollection({
        isActive: true,
        currentNodeIndex: 0,
        currentNodeType: missingParams[0].nodeType,
        collectedParameters: {},
        pendingPipeline: pipeline,
        missingParams: missingParams
      });
      
      // Ask for first parameter
      askForParameter(missingParams[0]);
      return true; // Indicates we're collecting parameters
    }
    
    return false; // No missing parameters
  };

  // Ask for a specific parameter
  const askForParameter = (missingParam) => {
    const toolData = missingParam.toolData;
    const firstMissingParam = missingParam.missingParameters[0];
    const paramDescription = toolData.requiredParameters[firstMissingParam];
    
    const question = `I need some information to complete your workflow. For the **${missingParam.nodeName}** node, please provide the **${firstMissingParam}**: ${paramDescription}`;
    
    const assistantMessage = {
      role: 'assistant',
      content: question,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, assistantMessage]);
  };

  // Handle parameter response during collection flow
  const handleParameterResponse = async (userResponse) => {
    const { missingParams, currentNodeIndex, collectedParameters } = parameterCollection;
    const currentMissingParam = missingParams[currentNodeIndex];
    
    if (!currentMissingParam) {
      // No more parameters to collect, create the workflow
      await createWorkflowWithCollectedParameters();
      return;
    }

    const firstMissingParam = currentMissingParam.missingParameters[0];
    const updatedCollectedParameters = {
      ...collectedParameters,
      [currentMissingParam.nodeIndex]: {
        ...collectedParameters[currentMissingParam.nodeIndex],
        [firstMissingParam]: userResponse
      }
    };

    // Check if we need more parameters for this node
    const remainingParams = currentMissingParam.missingParameters.slice(1);
    
    if (remainingParams.length > 0) {
      // Ask for next parameter of current node
      const nextParam = remainingParams[0];
      const paramDescription = currentMissingParam.toolData.requiredParameters[nextParam];
      
      const question = `Great! Now I need the **${nextParam}** for the **${currentMissingParam.nodeName}** node: ${paramDescription}`;
      
      const assistantMessage = {
        role: 'assistant',
        content: question,
        timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      
      // Update parameter collection state
      setParameterCollection(prev => ({
        ...prev,
        collectedParameters: updatedCollectedParameters,
        missingParams: prev.missingParams.map((param, index) => 
          index === currentNodeIndex 
            ? { ...param, missingParameters: remainingParams }
            : param
        )
      }));
    } else {
      // Move to next node
      const nextNodeIndex = currentNodeIndex + 1;
      
      if (nextNodeIndex < missingParams.length) {
        // Ask for first parameter of next node
        const nextMissingParam = missingParams[nextNodeIndex];
        askForParameter(nextMissingParam);
        
        setParameterCollection(prev => ({
          ...prev,
          currentNodeIndex: nextNodeIndex,
          currentNodeType: nextMissingParam.nodeType,
          collectedParameters: updatedCollectedParameters
        }));
      } else {
        // All parameters collected, create workflow
        setParameterCollection(prev => ({
          ...prev,
          collectedParameters: updatedCollectedParameters
        }));
        
        await createWorkflowWithCollectedParameters();
      }
    }
  };

  // Generate workflow summary (client-side version)
  const generateWorkflowSummary = (pipeline) => {
    if (!pipeline.nodes || pipeline.nodes.length === 0) {
      return 'Workflow generated successfully!';
    }

    const { nodes, edges } = pipeline;
    let summary = '🚀 Workflow will execute as follows:\n\n';

    // Find the starting node (node with no incoming edges)
    const nodesWithIncoming = new Set(edges.map(edge => edge.to));
    const startNodes = nodes.filter(node => !nodesWithIncoming.has(node.id));

    if (startNodes.length === 0 && nodes.length > 0) {
      // If no clear start, use the first node
      startNodes.push(nodes[0]);
    }

    // Build execution flow
    const processedNodes = new Set();
    const executionOrder = [];

    function buildFlow(nodeId) {
      if (processedNodes.has(nodeId)) return;
      processedNodes.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        executionOrder.push(node);

        // Find outgoing edges
        const outgoingEdges = edges.filter(edge => edge.from === nodeId);
        outgoingEdges.forEach(edge => {
          buildFlow(edge.to);
        });
      }
    }

    startNodes.forEach(startNode => buildFlow(startNode.id));

    // Generate the summary
    executionOrder.forEach((node, index) => {
      const toolData = tools.find(tool => tool.name === node.name || tool.type === node.type);
      const nodeName = node.name || node.type;
      const icon = toolData?.icon || '⚙️';

      if (index === 0) {
        summary += `📍 Start: ${icon} ${nodeName}`;
      } else {
        summary += ` ⬇️ ${icon} ${nodeName}`;
      }

      // Add parameter info if available
      if (node.parameters && Object.keys(node.parameters).length > 0) {
        const params = Object.entries(node.parameters)
          .slice(0, 2) // Show only first 2 parameters
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`)
          .join(', ');
        summary += ` (${params})`;
      }

      summary += '\n';
    });

    // Add schedule info if available
    if (pipeline.schedule && pipeline.schedule.interval) {
      summary += `\n⏰ Schedule: Runs ${pipeline.schedule.interval}`;
      if (pipeline.schedule.next_run) {
        summary += `, next at ${new Date(pipeline.schedule.next_run).toLocaleString()}`;
      }
    }

    summary += '\n\n✨ Click "Run Workflow" to execute this automation!';

    return summary;
  };

  // Create workflow with collected parameters
  const createWorkflowWithCollectedParameters = async () => {
    const { pendingPipeline, collectedParameters } = parameterCollection;
    
    // Merge collected parameters into the pipeline
    const updatedPipeline = {
      ...pendingPipeline,
      nodes: pendingPipeline.nodes.map((node, index) => ({
        ...node,
        parameters: {
          ...node.parameters,
          ...collectedParameters[index]
        }
      }))
    };

    // Generate the visual workflow
    if (nodes.length > 0) {
      updateCanvasFromPipeline(updatedPipeline);
    } else {
      generateCanvasFromPipeline(updatedPipeline);
    }

    // Generate workflow summary
    const workflowSummary = generateWorkflowSummary(updatedPipeline);
    const assistantMessage = {
      role: 'assistant',
      content: workflowSummary,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, assistantMessage]);

    // Reset parameter collection
    setParameterCollection({
      isActive: false,
      currentNodeIndex: 0,
      currentNodeType: null,
      collectedParameters: {},
      pendingPipeline: null
    });
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
      const icon = event.dataTransfer.getData('application/reactflow/icon');

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
        data: {
          label: name,
          type: toolType,
          icon: icon || undefined,
          parameters: {}
        },
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

    // Check if we're in parameter collection mode
    if (parameterCollection.isActive) {
      await handleParameterResponse(message);
      setIsLoading(false);
      return;
    }

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

      console.log('🔄 Sending request with context:', {
        hasExistingNodes: nodes.length > 0,
        existingNodesCount: nodes.length,
        existingEdgesCount: edges.length,
        prompt: message
      });

      const data = await response.json();

      if (data.pipeline) {
        // Got a complete pipeline
        console.log('🔍 Received pipeline from server:', data.pipeline);
        console.log('🔍 Pipeline nodes:', data.pipeline.nodes);
        console.log('🔍 Pipeline schedule:', data.pipeline.schedule);
        
        if (data.pipeline.nodes && data.pipeline.nodes.length > 0) {
          // Store schedule data
          if (data.pipeline.schedule) {
            console.log('🔍 Setting workflow schedule:', data.pipeline.schedule);
            setWorkflowSchedule(data.pipeline.schedule);
          }
          
          // Check if parameters are missing and start collection flow
          const needsParameterCollection = checkAndCollectParameters(data.pipeline);
          
          if (!needsParameterCollection) {
            // All parameters provided, create workflow immediately
            if (nodes.length > 0) {
              updateCanvasFromPipeline(data.pipeline);
            } else {
              generateCanvasFromPipeline(data.pipeline);
            }
            
            // Send success message
            const assistantMessage = {
              role: 'assistant',
              content: data.message || 'Workflow generated successfully!',
              timestamp: Date.now()
            };
            setChatHistory(prev => [...prev, assistantMessage]);
          }
          // If needsParameterCollection is true, the flow will continue in parameter collection mode
        }
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
    // Find starting nodes (nodes with no incoming edges)
    const nodesWithIncoming = new Set(pipeline.edges.map(edge => edge.to));
    const startNodes = pipeline.nodes.filter(node => !nodesWithIncoming.has(node.id));
    
    // Find the tool data for each node to get icons
    const newNodes = pipeline.nodes.map((node, index) => {
      const toolData = tools.find(tool => tool.name === node.name || tool.type === node.type);
      const isFirstNode = startNodes.length > 0 ? startNodes[0].id === node.id : index === 0;
      
      const nodeData = {
        label: node.name || node.type,
        type: node.type,
        icon: toolData?.icon,
        parameters: node.parameters,
        isFirstNode: isFirstNode,
        schedule: isFirstNode ? workflowSchedule : null
      };

      console.log('🔍 Creating node with data:', nodeData);
      console.log('🔍 Node parameters:', node.parameters);
      console.log('🔍 Workflow schedule:', workflowSchedule);

      return {
        id: node.id || `${Date.now()}-${index}`,
        type: mapNodeType(node.type), // Use mapped type
        position: { x: 100 + index * 350, y: 100 },
        data: nodeData,
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

  const updateCanvasFromPipeline = (pipeline) => {
    // Check if we have existing nodes to preserve
    const hasExistingNodes = nodes.length > 0;

    if (!hasExistingNodes) {
      // No existing nodes, use the original function
      generateCanvasFromPipeline(pipeline);
      return;
    }

    // We have existing nodes, so we need to merge intelligently
    console.log('🔄 Updating existing workflow with new pipeline');
    console.log('📊 Current nodes:', nodes.length);
    console.log('📈 New pipeline nodes:', pipeline.nodes.length);

    // Create a map of existing nodes by ID for quick lookup
    const existingNodesMap = new Map();
    nodes.forEach(node => {
      existingNodesMap.set(node.id, node);
    });

    // Find new nodes (nodes that don't exist in current workflow)
    const newNodes = pipeline.nodes.filter(node =>
      !existingNodesMap.has(node.id)
    );

    console.log('🆕 New nodes to add:', newNodes.length);

    // Position new nodes intelligently near their connection points
    const nodesToAdd = newNodes.map((node, index) => {
      const toolData = tools.find(tool => tool.name === node.name || tool.type === node.type);

      // Find where this node should connect to
      const incomingEdges = pipeline.edges.filter(edge => edge.to === node.id);
      let position = { x: 100 + (nodes.length + index) * 200, y: 100 }; // Default position

      if (incomingEdges.length > 0) {
        // Position near the source node
        const sourceNodeId = incomingEdges[0].from;
        const sourceNode = existingNodesMap.get(sourceNodeId) || nodes.find(n => n.id === sourceNodeId);

        if (sourceNode) {
          // Find if this node has outgoing edges to determine layout direction
          const outgoingEdges = pipeline.edges.filter(edge => edge.from === node.id);

          if (outgoingEdges.length > 0) {
            // This node has outputs, position it in the middle of the flow
            // Check how many total outputs this source node has (including existing nodes)
            const allOutgoingFromSource = pipeline.edges.filter(edge => edge.from === sourceNodeId);
            const totalOutputs = allOutgoingFromSource.length;

            // Find all target nodes for this source (both new and existing)
            const allTargetNodes = allOutgoingFromSource.map(edge => {
              const targetNode = pipeline.nodes.find(n => n.id === edge.to);
              if (targetNode) return targetNode;

              // If not in pipeline.nodes, check existing nodes
              return nodes.find(n => n.id === edge.to);
            }).filter(Boolean);

            // Find the index of this node in the complete target list
            const currentTargetIndex = allTargetNodes.findIndex(target =>
              target.id === node.id
            );

            // For multiple outputs from same source, stack vertically
            if (totalOutputs > 1) {
              // Position multiple outputs vertically under each other
              const baseX = sourceNode.position.x + 400;
              const verticalSpacing = 200;
              const centerY = sourceNode.position.y;

              position = {
                x: baseX,
                y: centerY - ((totalOutputs - 1) * verticalSpacing) / 2 + (currentTargetIndex * verticalSpacing)
              };
            } else {
              // Single output, position directly to the right
              position = {
                x: sourceNode.position.x + 400,
                y: sourceNode.position.y
              };
            }
          } else {
            // This is an endpoint node, position it further right
            // Check if there are other endpoints from the same source for vertical stacking
            const allOutgoingFromSource = pipeline.edges.filter(edge => edge.from === sourceNodeId);
            const totalEndpoints = allOutgoingFromSource.length;

            if (totalEndpoints > 1) {
              // Multiple endpoints, stack them vertically
              // Find the index of this node among all targets
              const currentEndpointIndex = allTargetNodes.findIndex(target =>
                target.id === node.id
              );

              const baseX = Math.max(...nodes.map(n => n.position.x), sourceNode.position.x) + 400;
              const verticalSpacing = 200;
              const centerY = sourceNode.position.y;

              position = {
                x: baseX,
                y: centerY - ((totalEndpoints - 1) * verticalSpacing) / 2 + (currentEndpointIndex * verticalSpacing)
              };
            } else {
              // Single endpoint, position directly to the right
              const rightmostX = Math.max(...nodes.map(n => n.position.x), sourceNode.position.x) + 400;
              position = {
                x: rightmostX,
                y: sourceNode.position.y
              };
            }
          }
        }
      } else {
        // No incoming edges, this might be a starting node or standalone node
        // Position it in a reasonable location on the canvas
        const existingPositions = nodes.map(n => n.position);
        const minY = Math.min(...existingPositions.map(p => p.y));
        const maxY = Math.max(...existingPositions.map(p => p.y));
        const centerY = (minY + maxY) / 2;

        position = {
          x: Math.max(...existingPositions.map(p => p.x), 100) + 450,
          y: centerY - 50 + (index * 150) // Spread vertically if multiple
        };
      }

      // Ensure position is within reasonable bounds
      position.x = Math.max(50, Math.min(position.x, 2000));
      position.y = Math.max(50, Math.min(position.y, 1000));

      // Check if this is a starting node (no incoming edges)
      const isFirstNode = !pipeline.edges.some(edge => edge.to === node.id);
      
      return {
        id: node.id || `${Date.now()}-${index}`,
        type: mapNodeType(node.type), // Use mapped type
        position,
        data: {
          label: node.name || node.type,
          type: node.type,
          icon: toolData?.icon,
          parameters: node.parameters,
          isFirstNode: isFirstNode,
          schedule: isFirstNode ? workflowSchedule : null
        },
      };
    });

    // Merge existing nodes with new nodes
    const allNodes = [...nodes, ...nodesToAdd];

    // Update edges - merge existing edges with new ones
    const existingEdgesMap = new Map();
    edges.forEach(edge => {
      existingEdgesMap.set(edge.id, edge);
    });

    const newEdges = pipeline.edges.map(edge => ({
      id: `edge-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
    }));

    // Merge edges (new edges take precedence, but avoid duplicates)
    const allEdges = [...edges];
    newEdges.forEach(newEdge => {
      if (!existingEdgesMap.has(newEdge.id)) {
        allEdges.push(newEdge);
      }
    });

    console.log('📊 Final nodes:', allNodes.length);
    console.log('🔗 Final edges:', allEdges.length);

    setNodes(allNodes);
    setEdges(allEdges);
  };

  const runWorkflow = () => {
    if (nodes.length === 0) return;

    setIsExecutionRunning(true);
    setExecutingNodeId(null);
    setExecutionStep(0);

    // Find the starting nodes (nodes with no incoming edges)
    const nodesWithIncoming = new Set(edges.map(edge => edge.target));
    const startNodes = nodes.filter(node => !nodesWithIncoming.has(node.id));

    // If no clear start nodes, use the first node
    const executionOrder = startNodes.length > 0 ? startNodes : [nodes[0]];

    // Build the complete execution order by traversing the graph
    const processedNodes = new Set();
    const fullExecutionOrder = [];

    function buildExecutionFlow(nodeId) {
      if (processedNodes.has(nodeId)) return;
      processedNodes.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        fullExecutionOrder.push(node);

        // Find and process outgoing edges
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        outgoingEdges.forEach(edge => {
          buildExecutionFlow(edge.target);
        });
      }
    }

    executionOrder.forEach(startNode => buildExecutionFlow(startNode.id));

    // Animate through each node
    let currentStep = 0;
    const totalSteps = fullExecutionOrder.length;

    const executeStep = () => {
      if (currentStep < totalSteps) {
        const currentNode = fullExecutionOrder[currentStep];

        // Update nodes to highlight the current executing node
        console.log('🎯 Highlighting node:', currentNode.id, 'at step:', currentStep);
        setNodes(currentNodes =>
          currentNodes.map(node => {
            const isExecuting = node.id === currentNode.id;
            console.log(`Node ${node.id}: isExecuting = ${isExecuting}`);
            return {
              ...node,
              key: `${node.id}-${isExecuting ? 'executing' : 'idle'}-${currentStep}`, // Force re-render
              data: {
                ...node.data,
                isExecuting: isExecuting,
                executionStep: currentStep
              }
            };
          })
        );

        setExecutingNodeId(currentNode.id);
        setExecutionStep(currentStep + 1);

        // Add a chat message about the current step
        const toolData = tools.find(tool => tool.name === currentNode.data.label || tool.type === currentNode.data.type);
        const nodeName = currentNode.data.label || currentNode.data.type;
        const icon = toolData?.icon || '⚙️';

        const executionMessage = {
          role: 'assistant',
          content: `🔄 **Step ${currentStep + 1}/${totalSteps}**: ${icon} Processing ${nodeName}...`,
          timestamp: Date.now(),
          isExecution: true
        };

        setChatHistory(prev => [...prev, executionMessage]);

        currentStep++;
        setTimeout(executeStep, 1500); // 1.5 seconds per step
      } else {
        // Workflow complete
        setIsExecutionRunning(false);
        setExecutingNodeId(null);

        // Clear execution highlights
        setNodes(currentNodes =>
          currentNodes.map(node => ({
            ...node,
            key: `${node.id}-idle-complete`, // Force re-render
            data: {
              ...node.data,
              isExecuting: false,
              executionStep: undefined
            }
          }))
        );

        // Add completion message
        const completionMessage = {
          role: 'assistant',
          content: `✅ **Workflow Complete!** All ${totalSteps} steps executed successfully.`,
          timestamp: Date.now(),
          isExecution: true
        };

        setChatHistory(prev => [...prev, completionMessage]);
      }
    };

    executeStep();
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
            <div className="flex items-center gap-4">
              {/* Scheduler Display */}
              {workflowSchedule && workflowSchedule.interval && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-800 rounded-lg text-sm">
                  <span className="text-blue-200">⏰</span>
                  <span className="text-blue-100">
                    {workflowSchedule.interval}
                    {workflowSchedule.next_run && (
                      <span className="text-blue-300">
                        , next: {new Date(workflowSchedule.next_run).toLocaleDateString()} {new Date(workflowSchedule.next_run).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </span>
                </div>
              )}
              <button
                onClick={runWorkflow}
                disabled={isExecutionRunning || nodes.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-md text-sm font-medium"
              >
                {isExecutionRunning ? 'Running...' : 'Run Workflow'}
              </button>
            </div>
          </div>
        </header>

        {/* Canvas and Chat Container */}
        <div className="flex-1 flex">
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

          {/* Chat Panel */}
          <div className="w-80 border-l border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
            <ChatPanel
              chatHistory={chatHistory}
              onChatSubmit={handleChatSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


export default App;
