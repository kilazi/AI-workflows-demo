# AI Workflow Canvas

Overview
AI Workflow Canvas is a proof-of-concept platform that turns natural-language instructions into live, executable workflows.
Users interact with an always-on assistant powered by ChatGPT-5 that understands intent, selects appropriate tools, builds pipelines, and visualizes them in real time using React Flow.
The goal is to demonstrate how an AI system can reason, plan, and act instead of just responding with text.

Core Concept
Example interaction:
“Get the updates from Google Sheets named Bot Logs every week, summarize them with Gemini, and send to Slack channel #botperformance.”

The AI will:

Parse the intent and detect:

Ecosystem tools: Google Sheets, Slack

AI tool: Summarize (Gemini)

Schedule: weekly

Generate a structured pipeline in JSON:

{
"nodes": [
{ "id": "1", "type": "GSheets", "name": "Bot Logs" },
{ "id": "2", "type": "Summarize", "model": "Gemini" },
{ "id": "3", "type": "Slack", "channel": "#botperformance" }
],
"edges": [
{ "from": "1", "to": "2" },
{ "from": "2", "to": "3" }
],
"schedule": { "interval": "weekly" }
}

Render it on the React Flow canvas with animated connections and a label showing the schedule and next execution.
Users can extend or modify workflows through chat, for example:
“Add an email notification when finished.”
The AI then adds a Gmail node automatically.

Features

Chat-driven workflow generation: user prompts become structured JSON pipelines interpreted by ChatGPT-5

React Flow canvas: visual editor showing node connections and execution flow

Tool library

Ecosystem: Gmail, Google Sheets, Slack, Notion, Jira

Utilities: Webhook, API Call, Condition, Calculation

AI tools: Brainstorm, Summarize, Select, Evaluate

Model selection per node: ChatGPT-5, Gemini, Claude, DeepSeek

Temporal-style execution view: animated playback of workflow execution with progress logs

Demo actions:

Auto-fix broken flows (simulated repair)

Summarize workflow (AI-generated description of what the flow does)

ChatGPT-5 Backend Logic
The backend uses a pipeline-based architecture:

Parse the user prompt and detect intent (data source, AI action, connector, schedule)

Match entities to existing catalog items (ecosystem tools, utilities, AI tools)

Extract timing and parameters

Build a structured JSON pipeline

Return it to the frontend for visualization and execution simulation

Tech Stack
Frontend: React, Next.js, React Flow, TailwindCSS, Framer Motion
Backend: Node.js, Express, ChatGPT-5 API
Optional: Turso or Supabase for persistence