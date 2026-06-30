// pages/api/test-paymongo.js
// Visit /api/test-paymongo?session=cs_xxxxx to check a specific checkout session
// Visit /api/test-paymongo to just test the key works

export default async function handler(req, res) {
  const key = process.env.PAYMONGO_SECRET_KEY;

  if (!key) {
    return res.status(200).json({ ok: false, problem: 'PAYMONGO_SECRET_KEY not set' });
  }

  const keyPrefix = key.slice(0, 12);
  const keyMode   = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  const auth      = Buffer.from(key + ':').toString('base64');

  const { session } = req.query;

  // If a session ID is provided, look it up directly
  if (session) {
    try {
      const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${session}`, {
        headers: { Authorization: 'Basic ' + auth },
      });
      const data = await response.json();

      return res.status(200).json({
        ok: response.ok,
        key_prefix: keyPrefix,
        key_mode: keyMode,
        session_id_checked: session,
        http_status: response.status,
        full_response: data,
      });
    } catch (err) {
      return res.status(200).json({ ok: false, error: err?.message });
    }
  }

  // No session provided — just create a test checkout session to confirm the key can CREATE sessions
  try {
    const createRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + auth },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method_types: ['gcash'],
            line_items: [{ currency: 'PHP', amount: 10000, name: 'Test', quantity: 1 }],
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
          },
        },
      }),
    });
    const createData = await createRes.json();

    return res.status(200).json({
      ok: createRes.ok,
      key_prefix: keyPrefix,
      key_mode: keyMode,
      message: createRes.ok
        ? 'Key can successfully CREATE checkout sessions. Created session ID: ' + createData.data?.id
        : 'Key FAILED to create a checkout session',
      created_session_id: createData.data?.id || null,
      full_response: createData,
    });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message });
  }
}
