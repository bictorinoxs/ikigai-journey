// pages/api/track-event.js
// Lightweight funnel event logger. Fire-and-forget from the frontend —
// never throws to the UI, never blocks the user's flow.
//
// Events logged: page_view, cta_click, preview_complete,
// payment_verified, report_generated.
//
// Table (run once in Supabase SQL editor):
//
//   CREATE TABLE IF NOT EXISTS funnel_events (
//     id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//     created_at  TIMESTAMPTZ DEFAULT NOW(),
//     event_type  TEXT NOT NULL,
//     visitor_id  TEXT,
//     utm_content TEXT,
//     meta        JSONB
//   );
//   ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Service role only" ON funnel_events
//     FOR ALL USING (true) WITH CHECK (true);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventType, visitorId, utmContent, meta } = req.body || {};
  if (!eventType) return res.status(400).json({ error: 'eventType required' });

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Don't fail the request over this — tracking is best-effort.
    console.warn('[track-event] Supabase not configured — skipping');
    return res.status(200).json({ ok: false, reason: 'Supabase not configured' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/funnel_events`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        event_type:  eventType,
        visitor_id:  visitorId || null,
        utm_content: utmContent || null,
        meta:        meta || null,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[track-event] Supabase error:', err);
      return res.status(200).json({ ok: false, error: err });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[track-event] Failed:', err?.message);
    return res.status(200).json({ ok: false, error: err?.message });
  }
}
