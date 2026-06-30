// pages/api/payment/verify.js
// Verifies a PayMongo checkout session, retrying briefly if status isn't final yet.
import jwt from 'jsonwebtoken';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  console.log('[verify] sessionId received:', sessionId);

  if (!sessionId) {
    return res.status(400).json({ error: 'No session ID received.' });
  }

  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

  // Retry up to 4 times with short delays — PayMongo can take a moment
  // to mark a checkout session as "completed" after the user pays.
  const MAX_ATTEMPTS = 4;
  const DELAY_MS = 1500;

  let checkoutData;
  let status;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(
        `https://api.paymongo.com/v1/checkout_sessions/${sessionId}`,
        { headers: { Authorization: 'Basic ' + auth } }
      );
      checkoutData = await response.json();

      if (!response.ok) {
        console.error('[verify] PayMongo fetch error:', JSON.stringify(checkoutData));
        return res.status(400).json({ error: 'Could not retrieve checkout session.' });
      }

      status = checkoutData.data?.attributes?.status;
      console.log(`[verify] attempt ${attempt} — status:`, status);

      if (status === 'completed') break;       // success — stop retrying
      if (status === 'expired') break;          // permanent failure — stop retrying

      // status is still "active" — payment hasn't fully processed yet, wait and retry
      if (attempt < MAX_ATTEMPTS) await sleep(DELAY_MS);

    } catch (err) {
      console.error('[verify] Network error:', err?.message);
      return res.status(502).json({ error: 'Could not reach PayMongo.' });
    }
  }

  if (status !== 'completed') {
    return res.status(402).json({
      error: 'Payment not yet completed.',
      status,
      message: status === 'expired'
        ? 'Session expired. Please start a new payment.'
        : 'Payment is still processing. Please wait a few seconds and refresh.',
    });
  }

  // Payment confirmed — issue signed JWT
  const accessToken = jwt.sign(
    { sessionId, paid: true, product: 'ikigai-journey' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('[verify] ✅ Payment confirmed, token issued');
  return res.status(200).json({ verified: true, token: accessToken });
}