// pages/api/payment/verify.js
// Verifies PayMongo session → issues JWT containing sessionId + email.
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  console.log('[verify] sessionId received:', sessionId);

  if (!sessionId) return res.status(400).json({ error: 'No session ID received.' });

  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

  let checkoutData;
  try {
    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${sessionId}`,
      { headers: { Authorization: 'Basic ' + auth } }
    );
    checkoutData = await response.json();
    if (!response.ok) {
      console.error('[verify] PayMongo error:', JSON.stringify(checkoutData));
      return res.status(400).json({ error: 'Could not retrieve checkout session.' });
    }
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach PayMongo.' });
  }

  const attrs         = checkoutData.data?.attributes || {};
  const paidAt        = attrs.paid_at;
  const intentStatus  = attrs.payment_intent?.attributes?.status;
  const paymentsPaid  = (attrs.payments || []).some(p => p.attributes?.status === 'paid');

  // Extract customer email from billing info (populated during checkout)
  const email = attrs.billing?.email || null;
  console.log('[verify] paid_at:', paidAt, '| email:', email);

  const isPaid = Boolean(paidAt) || intentStatus === 'succeeded' || paymentsPaid;
  if (!isPaid) {
    return res.status(402).json({
      error: 'Payment not yet completed.', status: attrs.status,
      message: attrs.status === 'expired'
        ? 'Session expired. Please start a new payment.'
        : 'Payment still processing. Try again in a moment.',
    });
  }

  // Include email in JWT so report API can send without asking again
  const accessToken = jwt.sign(
    { sessionId, paid: true, product: 'ikigai-journey', email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('[verify] ✅ Payment confirmed, token issued');
  return res.status(200).json({ verified: true, token: accessToken, email });
}