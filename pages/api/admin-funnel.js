// pages/api/admin-funnel.js
// Returns aggregated funnel_events counts for the admin dashboard.
// Protected by ADMIN_PASSWORD env var — same gate as admin-sessions.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.query;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASS || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  try {
    // Pull raw events (capped, most recent first) and aggregate here —
    // avoids needing a Postgres view/RPC just for a simple dashboard count.
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/funnel_events?select=event_type,visitor_id,utm_content,meta,created_at&order=created_at.desc&limit=5000`,
      { headers }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const rows = await response.json();

    // Overall funnel counts, in the expected step order.
    // blocked_inapp_browser is tracked separately from page_view — it tells
    // you how many ad clicks landed on the "switch browsers" screen instead
    // of the real landing page, which page_view alone can't distinguish.
    const STEPS = ['page_view', 'blocked_inapp_browser', 'cta_click', 'preview_complete', 'payment_verified', 'report_generated'];
    const counts = {};
    STEPS.forEach(s => { counts[s] = 0; });
    rows.forEach(r => { if (counts[r.event_type] !== undefined) counts[r.event_type]++; });

    // Which CTA button is winning
    const byCtaSource = {};
    rows.filter(r => r.event_type === 'cta_click').forEach(r => {
      const src = r.meta?.source || 'unknown';
      byCtaSource[src] = (byCtaSource[src] || 0) + 1;
    });

    // Per-ad-version breakdown (utm_content), across the same step order
    const byUtm = {};
    rows.forEach(r => {
      const tag = r.utm_content || '(none)';
      if (!byUtm[tag]) byUtm[tag] = {};
      byUtm[tag][r.event_type] = (byUtm[tag][r.event_type] || 0) + 1;
    });

    return res.status(200).json({
      ok: true,
      steps: STEPS,
      counts,
      byCtaSource,
      byUtm,
      totalEvents: rows.length,
      latestAt: rows[0]?.created_at || null,
    });

  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
}
