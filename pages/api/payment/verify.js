import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;

  console.log('[verify] sessionId received:', sessionId);

  if (!sessionId || sessionId.length < 5)
    return res.status(400).json({ error: 'No session ID received from PayMongo.' });

  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

  let checkoutData;
  try {
    const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    checkoutData = await response.json();
    if (!response.ok) return res.status(400).json({ error: 'Could not retrieve checkout session.' });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach payment provider.' });
  }

  const status = checkoutData.data?.attributes?.status;
  
  console.log('[verify] PayMongo status:', status);

  if (status !== 'completed') {
    return res.status(402).json({
      error: 'Payment not yet completed.', status,
      message: status === 'expired'
        ? 'Session expired. Please start a new payment.'
        : 'Payment is still processing. Wait a moment and try again.',
    });
  }

  const accessToken = jwt.sign(
    { sessionId, paid: true, product: 'ikigai-journey' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(200).json({ verified: true, token: accessToken });
}