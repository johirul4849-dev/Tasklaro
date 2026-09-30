import { executeHire } from '../../src/server/agentService';

export default async function handler(req: any, res: any) {
  // Production CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const result = await executeHire(body.requirementPrompt);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel serverless /api/agent/hire failed:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to hire AI teammate.',
    });
  }
}
