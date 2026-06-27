// pages/api/test-key.js
// Visit http://localhost:3000/api/test-key to diagnose your setup.
// DELETE this file before deploying to production.
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return res.status(200).json({
      ok: false,
      problem: 'ANTHROPIC_API_KEY is not set',
      fix: 'Add ANTHROPIC_API_KEY=sk-ant-... to .env.local and restart npm run dev',
    });
  }

  // Show masked key so you can confirm which key is loaded
  const masked = key.slice(0, 14) + '...' + key.slice(-4);

  try {
    const client = new Anthropic({ apiKey: key });
    const test   = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 10,
      messages:   [{ role: 'user', content: 'Say "ok"' }],
    });

    return res.status(200).json({
      ok:       true,
      key_used: masked,
      model:    'claude-sonnet-4-6',
      response: test.content?.[0]?.text,
    });
  } catch (err) {
    return res.status(200).json({
      ok:        false,
      key_used:  masked,
      error:     err?.message,
      status:    err?.status,
      type:      err?.error?.type,
    });
  }
}
