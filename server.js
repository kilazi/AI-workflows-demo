import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3333;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/generate-pipeline', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4', // Using GPT-4 as proxy for ChatGPT-5
        messages: [
          {
            role: 'system',
            content: `You are an AI that converts natural language prompts into structured workflow pipelines. Identify intents like data sources (Ecosystem: Gmail, Google Sheets, Slack, Notion, Jira), actions (Utility: Webhook, API Call, Condition, Calculation), AI processing (AI Tool: Brainstorm, Summarize, Select, Evaluate), and schedules (Temporal). Extract entities, schedules, and connections. Return a JSON object with "nodes", "edges", and "schedule". Example: {"nodes": [{"id": "1", "type": "GSheets", "name": "Bot Logs"}], "edges": [{"from": "1", "to": "2"}], "schedule": {"interval": "weekly", "next_run": "2025-10-27T09:00:00"}}`,
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

    const pipeline = response.data.choices[0].message.content;
    res.json({ pipeline: JSON.parse(pipeline) });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to generate pipeline' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
