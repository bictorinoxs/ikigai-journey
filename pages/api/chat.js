// pages/api/chat.js
// Streams Anthropic responses via Server-Sent Events.
//
// FREE PREVIEW: unauthenticated requests are allowed, but ONLY while the
// conversation is short enough to cover Q1 + Q2 + a couple follow-ups
// (server-enforced — the frontend cannot bypass this by skipping the
// payment UI, since the limit is checked here regardless of what the
// client claims). Past that message count, a valid paid JWT is required.

import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

export const maxDuration = 60;

// Max messages allowed before a paid token is required.
// Covers: hidden "Begin." + intro + Q1 + up to 2 follow-ups + Q2 + up to 2
// follow-ups, with a little headroom. Tune this if the preview feels short
// or long in practice.
const FREE_PREVIEW_MESSAGE_LIMIT = 14;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system, max_tokens = 1000 } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages array required' });

  const isDev = process.env.NODE_ENV === 'development';
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  let isPaid = false;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      isPaid = !!payload.paid;
    } catch {
      // invalid/expired token — treated as unauthenticated below
    }
  }

  if (!isDev && !isPaid) {
    // Unauthenticated — only allowed within the free preview message budget
    if (messages.length > FREE_PREVIEW_MESSAGE_LIMIT) {
      return res.status(402).json({
        error: 'Free preview limit reached. Please complete payment to continue your journey.',
        code: 'PAYMENT_REQUIRED',
      });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing from .env.local' });
  }

  // ── Streaming response headers ─────────────────────────────────────────────
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