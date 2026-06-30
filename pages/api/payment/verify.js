// pages/api/payment/verify.js
// Verifies a PayMongo checkout session.
//
// IMPORTANT: PayMongo's checkout_session.status can remain "active" even
// after a successful payment. The reliable signal is the `paid_at` timestamp
// or payment_intent.status === "succeeded" — NOT status === "completed".

import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  console.log('[verify] sessionId received:', sessionId);

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

    if (!response.ok) {
      console.error('[verify] PayMongo fetch error:', JSON.stringify(checkoutData));
      return res.status(400).json({ error: 'Could not retrieve checkout session.' });
    }
  } catch (err) {
    console.error('[verify] Network error:', err?.message);
    return res.status(502).json({ error: 'Could not reach PayMongo.' });
  }

  const attrs        = checkoutData.data?.attributes || {};
  const status        = attrs.status;
  const paidAt         = attrs.paid_at;
  const intentStatus   = attrs.payment_intent?.attributes?.status;
  const paymentsPaid    = (attrs.payments || []).some(p => p.attributes?.status === 'paid');

  console.log('[verify] checkout status:', status);
  console.log('[verify] paid_at:', paidAt);
  console.log('[verify] payment_intent status:', intentStatus);
  console.log('[verify] any payment marked paid:', paymentsPaid);

  // A session is genuinely paid if ANY of these are true —
  // checkout_session.status alone is NOT reliable.
  const isPaid = Boolean(paidAt) || intentStatus === 'succeeded' || paymentsPaid;

  if (!isPaid) {
    return res.status(402).json({
      error: 'Payment not yet completed.',
      status,
      message: status === 'expired'
        ? 'Session expired. Please start a new payment.'
        : 'Payment is still processing. Please wait a moment and try again.',
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