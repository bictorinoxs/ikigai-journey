// pages/api/payment/verify.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;

  console.log('[verify] sessionId received:', sessionId);
  console.log('[verify] key prefix:', process.env.PAYMONGO_SECRET_KEY?.slice(0, 12));

  if (!sessionId) {
    return res.status(400).json({ error: 'No session ID received.' });
  }

  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

  let checkoutData;
  try {
    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${sessionId}`,
      { headers: { Authorization: 'Basic ' + auth } }
    );

    checkoutData = await response.json();

    console.log('[verify] PayMongo response status:', response.status);
    console.log('[verify] PayMongo response:', JSON.stringify(checkoutData).slice(0, 300));

    if (!response.ok) {
      return res.status(400).json({
        error: 'Could not retrieve checkout session.',
        paymongo_error: checkoutData?.errors?.[0]?.detail || 'Unknown PayMongo error',
        hint: 'Make sure PAYMONGO_SECRET_KEY in Vercel matches the key used to create the checkout.',
      });
    }
  } catch (err) {
    console.error('[verify] Network error:', err?.message);
    return res.status(502).json({ error: 'Could not reach PayMongo.' });
  }

  const status = checkoutData.data?.attributes?.status;
  console.log('[verify] PayMongo status:', status);

  if (status !== 'completed') {
    return res.status(402).json({
      error: 'Payment not yet completed.',
      status,
      message: status === 'expired'
        ? 'Session expired. Please start a new payment.'
        : 'Payment still processing. Try again in a moment.',
    });
  }

  const accessToken = jwt.sign(
    { sessionId, paid: true, product: 'ikigai-journey' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('[verify] Payment confirmed, token issued');
  return res.status(200).json({ verified: true, token: accessToken });
}