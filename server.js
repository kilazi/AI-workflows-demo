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

app.post('/generate-pipeline', async (req, res) => {
  console.log('🚀 /generate-pipeline called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const { prompt, existingNodes = [], existingEdges = [], context = 'new_workflow' } = req.body;

  if (!prompt) {
    console.log('❌ No prompt provided');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
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

    // Simple system prompt without contextual conversation
    const systemPrompt = `You are an AI that converts natural language prompts into structured workflow pipelines. You have access to the following tools:

${toolsDescription}

Your goal is to understand user intent and create executable workflows. Make reasonable assumptions for missing parameters and create complete workflows.

IMPORTANT: Always create connections between nodes using edges! If you create multiple nodes, you MUST connect them in a logical flow.

WORKFLOW MODIFICATION: If there are existing nodes in the workflow, preserve them and only add new nodes that make sense with the user's request. Connect new nodes to existing ones where appropriate. Reuse existing node IDs when possible.

LAYOUT INSTRUCTIONS: When a node has multiple outputs, arrange them vertically (one under another) rather than horizontally. For example: Source → [Output1 (top)] and [Output2 (bottom)].

Node format: {"id": "unique_id", "type": "tool_type", "name": "tool_name", "parameters": {...}}
Edge format: {"from": "source_id", "to": "target_id"}
Schedule format: {"interval": "daily/weekly/monthly", "next_run": "ISO_date", "timezone": "optional"}

Always return ONLY a complete JSON response with nodes, edges, and schedule. Do NOT include any explanation or markdown formatting. Make up reasonable default values for any missing parameters.

Return ONLY the JSON object, nothing else.

Example response: {"nodes": [{"id": "1", "type": "GSheets", "name": "Google Sheets", "parameters": {"spreadsheet_id": "example_sheet_id"}}, {"id": "2", "type": "Slack", "name": "Slack", "parameters": {"channel": "general"}}], "edges": [{"from": "1", "to": "2"}], "schedule": {"interval": "weekly", "next_run": "2025-10-27T09:00:00"}}

${existingWorkflowContext ? `EXISTING WORKFLOW CONTEXT:
${existingWorkflowContext}

INSTRUCTIONS FOR MODIFICATION:
- Analyze the existing workflow and understand what the user wants to add or change
- Only add new nodes that are relevant to the user's request
- Connect new nodes to appropriate existing nodes
- Maintain the logical flow of the existing workflow
- Use the same node IDs for existing nodes if they appear in the new workflow
- Only create new node IDs for completely new nodes` : ''}`;

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
      // Try to parse as JSON first
      console.log('🔍 Attempting to parse AI response as JSON...');
      const parsedResponse = JSON.parse(aiResponse);

      // Check if this is a complete pipeline
      console.log('📋 Parsed response:', JSON.stringify(parsedResponse, null, 2));

      if (parsedResponse.nodes && parsedResponse.nodes.length > 0) {
        console.log('✅ Pipeline nodes received');

        // Ensure we have edges - create them if missing
        let finalEdges = parsedResponse.edges || [];
        if (parsedResponse.nodes.length > 1 && (!finalEdges || finalEdges.length === 0)) {
          console.log('🔗 Creating default edges between nodes...');
          // Create a linear flow: 1 -> 2 -> 3 -> ...
          finalEdges = parsedResponse.nodes.slice(0, -1).map((node, index) => ({
            from: node.id || `${index + 1}`,
            to: parsedResponse.nodes[index + 1].id || `${index + 2}`
          }));
        }

        const completePipeline = {
          ...parsedResponse,
          edges: finalEdges
        };

        console.log('✅ Complete pipeline with edges:', JSON.stringify(completePipeline, null, 2));

        // Generate a descriptive summary of the workflow execution
        const workflowSummary = generateWorkflowSummary(completePipeline);

        res.json({
          pipeline: completePipeline,
          message: workflowSummary
        });
      } else {
        console.log('❌ Invalid response format - no nodes found');
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      // If parsing fails, try to extract JSON from text response
      console.log('⚠️ JSON parsing failed, trying to extract JSON from text response');
      console.log('Parse error:', parseError.message);
      console.log('AI returned text response:', aiResponse);

      try {
        // Look for JSON code blocks in the response
        const jsonMatch = aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[1];
          const parsedResponse = JSON.parse(extractedJson);
          console.log('✅ Extracted JSON from text response:', JSON.stringify(parsedResponse, null, 2));

          if (parsedResponse.nodes && parsedResponse.nodes.length > 0) {
            let finalEdges = parsedResponse.edges || [];
            if (parsedResponse.nodes.length > 1 && (!finalEdges || finalEdges.length === 0)) {
              console.log('🔗 Creating default edges between extracted nodes...');
              finalEdges = parsedResponse.nodes.slice(0, -1).map((node, index) => ({
                from: node.id || `${index + 1}`,
                to: parsedResponse.nodes[index + 1].id || `${index + 2}`
              }));
            }

            const completePipeline = {
              ...parsedResponse,
              edges: finalEdges
            };

            res.json({
              pipeline: completePipeline,
              message: 'Workflow generated successfully!'
            });
            return;
          }
        }
      } catch (extractError) {
        console.log('❌ Failed to extract JSON from text response:', extractError.message);
      }

      // Final fallback - text response
      res.json({
        pipeline: {
          nodes: [],
          edges: [],
          schedule: {}
        },
        message: aiResponse
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
