import { executeChat, executeHire, getApiKey } from '../src/server/agentService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  if (url.includes('/hire')) {
    try {
      const result = await executeHire(body.requirementPrompt);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (url.includes('/chat') || req.method === 'POST') {
    try {
      const result = await executeChat(body);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Health check endpoint
  return res.status(200).json({
    status: 'ok',
    app: 'AgentFlow API',
    hasGeminiKey: !!getApiKey(),
  });
}
