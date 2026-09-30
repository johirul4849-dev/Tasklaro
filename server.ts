import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { executeChat, executeHire, getApiKey } from './src/server/agentService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS & Preflight Middleware for production / Vercel compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    app: 'AgentFlow',
    hasGeminiKey: !!getApiKey(),
    timestamp: new Date().toISOString(),
  });
});

// Bot Hiring Endpoint
app.post(['/api/agent/hire', '/agent/hire'], async (req, res) => {
  try {
    const { requirementPrompt } = req.body || {};
    const result = await executeHire(requirementPrompt);
    res.json(result);
  } catch (error: any) {
    console.error('Hiring error:', error);
    res.status(500).json({ error: error?.message || 'Failed to configure AI teammate' });
  }
});

// Dynamic Task Execution Endpoint with Workspace Intent Detection
app.post(['/api/agent/chat', '/agent/chat'], async (req, res) => {
  try {
    const result = await executeChat(req.body || {});
    res.json(result);
  } catch (error: any) {
    console.error('Chat execution error:', error);
    res.status(500).json({
      error: error?.message || 'Could not complete task with AI agent.',
    });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentFlow server running on http://localhost:${PORT}`);
  });
}

// Start standalone HTTP listener only when not running inside a serverless platform like Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
