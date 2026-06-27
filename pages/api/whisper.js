// pages/api/whisper.js — OpenAI Whisper proxy. Supports English (en) and Filipino (fil → tl).
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';

const LANG = { en: 'en', fil: 'tl' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No access token.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.paid) throw new Error('Token not paid');
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;
  if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

  const buffer    = Buffer.from(audioBase64, 'base64');
  const audioFile = new File([buffer], 'recording.webm', { type: mimeType });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.audio.transcriptions.create({
      file: audioFile, model: 'whisper-1',
      language: LANG[language] || 'en',
      response_format: 'json',
    });
    return res.status(200).json({ text: result.text });
  } catch (err) {
    console.error('[api/whisper]', err?.message);
    return res.status(500).json({ error: 'Transcription failed. Check your mic and try again.' });
  }
}
