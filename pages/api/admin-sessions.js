// pages/api/admin-sessions.js
// Returns all logged sessions for the admin dashboard.
// Protected by ADMIN_PASSWORD env var.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Simple password gate
  const { password } = req.query;
  const ADMIN_PASS   = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASS || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?select=id,created_at,user_name,email,duration_minutes,archetype,ikigai_sentence,session_id&order=created_at.desc&limit=200`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, sessions: data });

  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
}
