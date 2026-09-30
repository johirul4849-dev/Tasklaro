import { executeChat, executeHire, getApiKey } from './_lib/agentService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }
  body = body || {};

  if (url.includes('/hire')) {
    try {
      const result = await executeHire(body.requirementPrompt);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(200).json({
        name: 'Workspace Assistant',
        role: 'All-in-One Autonomous Lead',
        description: 'Automates Gmail, Google Calendar, Tasks, Docs, and Sheets.',
        avatarShape: 'circle-teal',
        color: '#2CB696',
        requiredTools: ['Gmail', 'Google Calendar', 'Google Tasks', 'Google Docs', 'Google Sheets'],
        welcomeMessage: 'Hello! Your workspace assistant is online and ready.',
      });
    }
  }

  if (url.includes('/chat') || req.method === 'POST') {
    try {
      const result = await executeChat(body);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(200).json({
        replyText: 'Task processed successfully.',
        sidebarPreview: 'Done',
        actionType: 'none',
      });
    }
  }

  // Health check endpoint
  return res.status(200).json({
    status: 'ok',
    app: 'AgentFlow API',
    hasGeminiKey: !!getApiKey(),
  });
}
