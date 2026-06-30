// pages/api/test-paymongo.js
// Visit /api/test-paymongo to diagnose your PayMongo setup.
// DELETE this file before going fully live.

export default async function handler(req, res) {
  const key = process.env.PAYMONGO_SECRET_KEY;

  if (!key) {
    return res.status(200).json({
      ok: false,
      problem: 'PAYMONGO_SECRET_KEY is not set in Vercel environment variables',
    });
  }

  const keyPrefix = key.slice(0, 12);
  const keyMode   = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';

  // Try to list payment methods — simplest PayMongo API call
  const auth = Buffer.from(key + ':').toString('base64');

  try {
    const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
      headers: { Authorization: 'Basic ' + auth },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        key_prefix: keyPrefix,
        key_mode: keyMode,
        http_status: response.status,
        paymongo_error: data?.errors?.[0]?.detail || JSON.stringify(data),
        fix: response.status === 401
          ? 'Your PAYMONGO_SECRET_KEY is invalid or wrong. Copy it again from app.paymongo.com → Developers → API Keys'
          : 'Unexpected error from PayMongo',
      });
    }

    return res.status(200).json({
      ok: true,
      key_prefix: keyPrefix,
      key_mode: keyMode,
      message: 'PayMongo key is valid and working',
    });

  } catch (err) {
    return res.status(200).json({
      ok: false,
      key_prefix: keyPrefix,
      key_mode: keyMode,
      error: err?.message,
    });
  }
}
