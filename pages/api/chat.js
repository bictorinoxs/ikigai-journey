// pages/api/chat.js
// Streams Anthropic responses via Server-Sent Events.
// max_tokens: 8192 allows full 30-field report JSON without truncation.

import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' });

  const { messages, system, max_tokens = 1000 } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages array required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: Math.min(max_tokens, 8192),
      system,
      messages,
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const chunk = event.delta.text;
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, text: fullText })}\n\n`);
    res.end();

  } catch (err) {
    console.error('[api/chat] Stream error:', err?.message);
    try {
      res.write(`data: ${JSON.stringify({ error: err?.message || 'Stream failed' })}\n\n`);
      res.end();
    } catch {}
  }
}