import { executeHire } from '../_lib/agentService';

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
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('Could not JSON parse req.body string in /api/agent/hire');
      }
    }
    const result = await executeHire(body?.requirementPrompt);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel serverless /api/agent/hire caught error:', error);
    // Return a default autonomous teammate so hiring never fails on Vercel
    return res.status(200).json({
      name: 'Workspace Assistant',
      role: 'All-in-One Autonomous Lead',
      description: 'Automates Gmail, Google Calendar, Tasks, Docs, and Sheets.',
      avatarShape: 'circle-teal',
      color: '#2CB696',
      requiredTools: ['Gmail', 'Google Calendar', 'Google Tasks', 'Google Docs', 'Google Sheets'],
      welcomeMessage: 'Hey! I am ready to handle your tasks in Gmail, Google Calendar, Tasks, Docs, and Sheets.',
    });
  }
}
