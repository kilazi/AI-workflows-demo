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

// Load tools from vibe.json
const toolsPath = path.join(process.cwd(), 'vibe.json');
console.log('Loading tools from:', toolsPath);
let toolsData;
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
  const { prompt, existingNodes = [], existingEdges = [], context = 'new_workflow' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
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

    // Enhanced system prompt for contextual conversation
    const systemPrompt = `You are an AI that converts natural language prompts into structured workflow pipelines. You have access to the following tools:

${toolsDescription}

Your goal is to understand user intent and create executable workflows. When users provide incomplete information, ask clarifying questions rather than making assumptions.

IMPORTANT INSTRUCTIONS:
1. If this is a new workflow (${context === 'new_workflow'}), create a complete pipeline from scratch
2. If modifying existing workflow (${context === 'modify_workflow'}), analyze current nodes and suggest additions/modifications
3. If answering questions (${context === 'answering_question'}), use the provided answers to complete the workflow

When information is missing for tool parameters, return a response with:
- "questions": [array of specific questions to ask the user]
- "message": [explanatory message for the user]
- "pipeline": [partial pipeline if some parts are complete]

Always ask specific questions based on tool requirements, not generic ones.

Node format: {"id": "unique_id", "type": "tool_type", "name": "tool_name", "parameters": {...}}
Edge format: {"from": "source_id", "to": "target_id"}
Schedule format: {"interval": "daily/weekly/monthly", "next_run": "ISO_date", "timezone": "optional"}

Example complete response: {"nodes": [{"id": "1", "type": "GSheets", "name": "Google Sheets", "parameters": {"spreadsheet_id": "xyz"}}], "edges": [{"from": "1", "to": "2"}], "schedule": {"interval": "weekly", "next_run": "2025-10-27T09:00:00"}}

Example with questions: {"questions": ["Which Slack channel do you want to send to?", "What spreadsheet should I read from?"], "message": "I need some additional information to complete your workflow. Please answer these questions:", "pipeline": {"nodes": [], "edges": [], "schedule": {}}}

${existingWorkflowContext ? `EXISTING WORKFLOW CONTEXT:
${existingWorkflowContext}` : ''}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4', // Using GPT-4 as proxy for ChatGPT-5
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

    const aiResponse = response.data.choices[0].message.content;

    try {
      // Try to parse as JSON first
      const parsedResponse = JSON.parse(aiResponse);

      // Check if this is a response with questions or a complete pipeline
      if (parsedResponse.questions && parsedResponse.questions.length > 0) {
        res.json({
          questions: parsedResponse.questions,
          message: parsedResponse.message || 'I need some additional information to complete your workflow.',
          pipeline: parsedResponse.pipeline || { nodes: [], edges: [], schedule: {} }
        });
      } else if (parsedResponse.nodes && parsedResponse.edges) {
        // Complete pipeline
        res.json({
          pipeline: parsedResponse,
          message: 'Workflow generated successfully!'
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      // If parsing fails, it might be a text response (fallback)
      console.log('AI returned text response:', aiResponse);
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
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to generate pipeline' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
