import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3333;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔑 OpenAI API Key configured:', !!OPENAI_API_KEY);

// Load tools from vibe.json
const toolsPath = path.join(process.cwd(), 'vibe.json');
console.log('Loading tools from:', toolsPath);
let toolsData;

// Helper function to generate workflow execution summary
function generateWorkflowSummary(pipeline) {
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
    const toolData = toolsData.tools.find(tool =>
      tool.name === node.name || tool.type === node.type
    );
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
}
try {
  const rawData = fs.readFileSync(toolsPath, 'utf8');
  toolsData = JSON.parse(rawData);
  console.log('Loaded', toolsData.tools.length, 'tools successfully');
} catch (error) {
  console.error('Error loading tools data:', error);
  toolsData = { tools: [] };
}

// API endpoint to get all tools
app.get('/tools', (req, res) => {
  console.log('GET /tools called, tools count:', toolsData.tools.length);
  res.json(toolsData.tools);
});

// Pipeline Router System
function determinePipeline(prompt, existingNodes = []) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for workflow editing keywords
  if (lowerPrompt.includes('edit') || lowerPrompt.includes('modify') || lowerPrompt.includes('change') || 
      lowerPrompt.includes('update') || lowerPrompt.includes('add') || lowerPrompt.includes('remove') ||
      (existingNodes.length > 0 && !lowerPrompt.includes('new'))) {
    return 'WORKFLOW_EDIT';
  }
  
  // Check for workflow fixing keywords
  if (lowerPrompt.includes('fix') || lowerPrompt.includes('error') || lowerPrompt.includes('broken') ||
      lowerPrompt.includes('issue') || lowerPrompt.includes('problem') || lowerPrompt.includes('debug')) {
    return 'WORKFLOW_FIX';
  }
  
  // Default to generic for new workflows or general questions
  return 'GENERIC';
}

// Generic Pipeline - explains what chatbot can do
function handleGenericPipeline(prompt) {
  const capabilities = `🚀 **AI Workflow Canvas Assistant** - ¡Hola! Here's what I can help you with:

**🎯 Create New Workflows:**
• "Get data from Google Sheets and send to Slack every Monday"
• "Monitor website uptime and alert via email"
• "Sync customer data between HubSpot and Salesforce"

**🔧 Edit Existing Workflows:**
• "Add a notification step to my workflow"
• "Change the schedule to run daily instead of weekly"
• "Modify the Slack channel destination"

**🛠️ Fix Workflow Issues:**
• "My workflow is failing, help me debug it"
• "Fix the authentication error"
• "Resolve the connection timeout issue"

**📊 Available Tools:**
• **Ecosystem**: Google Sheets, Slack, HubSpot, Salesforce, GitHub
• **AI Tools**: OpenAI, Claude, custom AI integrations
• **Utilities**: HTTP requests, data transformation, file operations
• **Temporal**: Scheduling, delays, time-based triggers

**💡 Pro Tips:**
• Be specific about data sources and destinations
• Mention scheduling preferences (daily, weekly, etc.)
• Include any authentication requirements
• Describe the data format you're working with

¿Qué quieres automatizar hoy? Just describe your automation needs and I'll create a visual workflow for you! 🎨✨`;

  return {
    pipeline: { nodes: [], edges: [], schedule: {} },
    message: capabilities
  };
}

// Workflow Fix Pipeline - placeholder with timeout simulation
function handleWorkflowFixPipeline(prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fixMessages = [
        "🔍 Analyzing your workflow... Found potential issues with Slack authentication. Please provide your Slack bot token to continue.",
        "⚠️ Detected missing API credentials for Google Sheets. Please provide your Google service account key.",
        "🚨 Workflow execution failed due to rate limiting. Please check your API quotas and try again.",
        "🔧 Found configuration errors in your HTTP request node. Please verify the endpoint URL and headers.",
        "📊 Data transformation error detected. Please check your field mappings and data types."
      ];
      
      const randomMessage = fixMessages[Math.floor(Math.random() * fixMessages.length)];
      
      resolve({
        pipeline: { nodes: [], edges: [], schedule: {} },
        message: `Fixing your workflow... ⚡\n\n${randomMessage}`
      });
    }, 2000); // 2 second delay to simulate "fixing"
  });
}

app.post('/generate-pipeline', async (req, res) => {
  console.log('🚀 /generate-pipeline called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const { prompt, existingNodes = [], existingEdges = [], context = 'new_workflow' } = req.body;

  if (!prompt) {
    console.log('❌ No prompt provided');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Route to appropriate pipeline
  const pipelineType = determinePipeline(prompt, existingNodes);
  console.log(`🎯 Routing to pipeline: ${pipelineType}`);

  try {
    // Handle different pipeline types
    if (pipelineType === 'GENERIC') {
      const result = handleGenericPipeline(prompt);
      return res.json(result);
    }
    
    if (pipelineType === 'WORKFLOW_FIX') {
      const result = await handleWorkflowFixPipeline(prompt);
      return res.json(result);
    }
    
    // Continue with existing WORKFLOW_EDIT logic below
    console.log('📝 Processing prompt:', prompt);
    console.log('🔍 Context:', context);
    console.log('📊 Existing nodes:', existingNodes.length);
    console.log('🔗 Existing edges:', existingEdges.length);
    // Create a comprehensive tools description for the AI
    const toolsDescription = toolsData.tools.map(tool =>
      `${tool.name} (${tool.type}): ${tool.description}. Tags: ${tool.tags.join(', ')}`
    ).join('\n');

    // Create context about existing workflow if modifying
    let existingWorkflowContext = '';
    if (existingNodes.length > 0) {
      existingWorkflowContext = `
Current workflow has ${existingNodes.length} nodes:
${existingNodes.map(node => `- ${node.data.label} (${node.type})`).join('\n')}

${existingEdges.length > 0 ? `Connections: ${existingEdges.map(edge => `${edge.source} -> ${edge.target}`).join(', ')}` : 'No connections yet.'}
`;
    }

    // Strict JSON validation function
    function validatePipelineJSON(json) {
      if (!json || typeof json !== 'object') {
        throw new Error('Response must be a JSON object');
      }

      // Validate required fields
      if (!json.nodes || !Array.isArray(json.nodes)) {
        throw new Error('Response must contain a "nodes" array');
      }

      if (!json.edges || !Array.isArray(json.edges)) {
        throw new Error('Response must contain an "edges" array');
      }

      if (!json.schedule || typeof json.schedule !== 'object') {
        throw new Error('Response must contain a "schedule" object');
      }

      // Validate nodes structure
      json.nodes.forEach((node, index) => {
        if (!node.id || typeof node.id !== 'string') {
          throw new Error(`Node ${index} must have a string "id" field`);
        }
        if (!node.type || typeof node.type !== 'string') {
          throw new Error(`Node ${index} must have a string "type" field`);
        }
        if (!node.name || typeof node.name !== 'string') {
          throw new Error(`Node ${index} must have a string "name" field`);
        }
        if (!node.parameters || typeof node.parameters !== 'object') {
          throw new Error(`Node ${index} must have an "parameters" object`);
        }
      });

      // Validate edges structure
      json.edges.forEach((edge, index) => {
        if (!edge.from || typeof edge.from !== 'string') {
          throw new Error(`Edge ${index} must have a string "from" field`);
        }
        if (!edge.to || typeof edge.to !== 'string') {
          throw new Error(`Edge ${index} must have a string "to" field`);
        }
      });

      // Validate schedule structure
      if (json.schedule.interval && typeof json.schedule.interval !== 'string') {
        throw new Error('Schedule interval must be a string');
      }

      return true;
    }

    // Strict system prompt with JSON schema enforcement
    const systemPrompt = `You are an AI that converts natural language prompts into structured workflow pipelines. You have access to the following tools:

${toolsDescription}

Your goal is to understand user intent and create executable workflows. Make reasonable assumptions for missing parameters and create complete workflows.

CRITICAL: You MUST respond with ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "string",
      "type": "string", 
      "name": "string",
      "parameters": {}
    }
  ],
  "edges": [
    {
      "from": "string",
      "to": "string"
    }
  ],
  "schedule": {
    "interval": "daily|weekly|monthly|hourly",
    "next_run": "ISO_date_string",
    "timezone": "optional_string"
  }
}

STRICT REQUIREMENTS:
- NO markdown formatting, NO code blocks, NO explanations
- ONLY the JSON object as shown above
- Every node MUST have: id, type, name, parameters
- Every edge MUST have: from, to
- Schedule MUST have: interval (even if empty string)
- All field values MUST be strings or objects (no null/undefined)
- Node IDs MUST be unique strings
- Edge references MUST match existing node IDs

WORKFLOW MODIFICATION: If there are existing nodes in the workflow, preserve them and only add new nodes that make sense with the user's request. Connect new nodes to existing ones where appropriate. Reuse existing node IDs when possible.

LAYOUT INSTRUCTIONS: When a node has multiple outputs, arrange them vertically (one under another) rather than horizontally.

${existingWorkflowContext ? `EXISTING WORKFLOW CONTEXT:
${existingWorkflowContext}

INSTRUCTIONS FOR MODIFICATION:
- Analyze the existing workflow and understand what the user wants to add or change
- Only add new nodes that are relevant to the user's request
- Connect new nodes to appropriate existing nodes
- Maintain the logical flow of the existing workflow
- Use the same node IDs for existing nodes if they appear in the new workflow
- Only create new node IDs for completely new nodes` : ''}

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT.`;

    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not configured');
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.'
      });
    }

    console.log('🤖 Calling OpenAI API...');
    console.log('🔧 System prompt length:', systemPrompt.length);
    console.log('💬 User prompt:', prompt);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ OpenAI API call successful');
    console.log('📄 Response status:', response.status);

    const aiResponse = response.data.choices[0].message.content;
    console.log('🤖 AI Response:', aiResponse);

    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find the first { and last } to extract pure JSON
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      }

      console.log('🔍 Attempting to parse cleaned AI response as JSON...');
      console.log('📝 Cleaned response:', cleanResponse);

      const parsedResponse = JSON.parse(cleanResponse);
      
      // Validate the JSON structure strictly
      console.log('🔍 Validating JSON structure...');
      validatePipelineJSON(parsedResponse);
      
      console.log('✅ JSON validation passed');
      console.log('📋 Parsed response:', JSON.stringify(parsedResponse, null, 2));

      // Ensure we have edges - create them if missing
      let finalEdges = parsedResponse.edges || [];
      if (parsedResponse.nodes.length > 1 && finalEdges.length === 0) {
        console.log('🔗 Creating default edges between nodes...');
        // Create a linear flow: 1 -> 2 -> 3 -> ...
        finalEdges = parsedResponse.nodes.slice(0, -1).map((node, index) => ({
          from: node.id,
          to: parsedResponse.nodes[index + 1].id
        }));
      }

      const completePipeline = {
        nodes: parsedResponse.nodes,
        edges: finalEdges,
        schedule: parsedResponse.schedule || { interval: '', next_run: '', timezone: '' }
      };

      console.log('✅ Complete pipeline with edges:', JSON.stringify(completePipeline, null, 2));

      // Generate a descriptive summary of the workflow execution
      const workflowSummary = generateWorkflowSummary(completePipeline);

      res.json({
        pipeline: completePipeline,
        message: workflowSummary
      });

    } catch (parseError) {
      console.log('❌ Strict JSON parsing failed');
      console.log('Parse error:', parseError.message);
      console.log('AI returned response:', aiResponse);

      // Return error response instead of fallback
      res.status(400).json({
        error: 'Invalid JSON response from AI',
        details: parseError.message,
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error('❌ Error in /generate-pipeline:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ error: 'Failed to generate pipeline' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
