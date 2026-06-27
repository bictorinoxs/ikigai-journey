// pages/api/chat.js
// Skips JWT in development (NODE_ENV=development) for localhost testing.

import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Skip JWT in development
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    const auth  = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No access token.' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload.paid) throw new Error('Not paid');
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }

  // Check key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY missing from .env.local',
      fix: 'Add ANTHROPIC_API_KEY=sk-ant-... to your .env.local file, then restart npm run dev',
    });
  }

  const { messages, system, max_tokens = 1000 } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages array required' });

  try {
    const client   = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens,
      system,
      messages,
    });
    return res.status(200).json(response);
  } catch (err) {
    // Return the REAL Anthropic error so you can see exactly what's wrong
    console.error('[api/chat] Error:', err?.message, err?.status);
    return res.status(500).json({
      error: err?.message || 'Anthropic API call failed',
      status: err?.status,
      type: err?.error?.type,
    });
  }
}
