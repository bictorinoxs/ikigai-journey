// pages/api/chat.js
// Server-side Anthropic proxy. API key never reaches the browser.
// maxDuration extends Vercel's function timeout for large report generation.

import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

// Extend Vercel serverless timeout to 60 seconds
// Required for the 20-section Ikigai report generation (can take 20-40s)
export const maxDuration = 60;

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY missing from .env.local',
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
    console.error('[api/chat] Error:', err?.message, err?.status);
    return res.status(500).json({
      error: err?.message || 'Anthropic API call failed',
      status: err?.status,
      type: err?.error?.type,
    });
  }
}