// pages/api/log-session.js
// Logs a completed Ikigai session to Supabase.
// Called automatically when a report is successfully generated.

export const maxDuration = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    sessionId,
    userName,
    email,
    durationMinutes,
    reportJson,
  } = req.body;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[log-session] Supabase not configured — skipping log');
    return res.status(200).json({ ok: false, reason: 'Supabase not configured' });
  }

  if (!reportJson) {
    return res.status(400).json({ error: 'reportJson required' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        session_id:       sessionId || null,
        user_name:        userName  || reportJson.user_name || null,
        email:            email     || reportJson.user_email || null,
        duration_minutes: durationMinutes || null,
        archetype:        reportJson.archetype_name || null,
        ikigai_sentence:  reportJson.ikigai_sentence || null,
        report_json:      reportJson,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[log-session] Supabase error:', err);
      return res.status(200).json({ ok: false, error: err });
    }

    console.log('[log-session] ✅ Session logged for:', email || userName);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[log-session] Failed:', err?.message);
    return res.status(200).json({ ok: false, error: err?.message });
  }
}
