// pages/api/payment/webhook.js — Receives PayMongo events, verified with HMAC-SHA256.
// Register URL in PayMongo Dashboard → Developers → Webhooks.
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sigHeader = req.headers['paymongo-signature'];
  if (!sigHeader) return res.status(401).json({ error: 'Missing signature' });

  const parts    = Object.fromEntries(sigHeader.split(',').map(p => { const [k,...v]=p.split('='); return [k,v.join('=')]; }));
  const expected = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET)
    .update(`${parts.t}.${rawBody.toString('utf8')}`).digest('hex');

  if (parts.li !== expected && parts.te !== expected)
    return res.status(401).json({ error: 'Invalid signature' });

  const event     = JSON.parse(rawBody.toString('utf8'));
  const eventType = event.data?.attributes?.type;

  if (eventType === 'checkout_session.payment.paid') {
    const sessionId = event.data?.attributes?.data?.id;
    const amount    = event.data?.attributes?.data?.attributes?.line_items?.[0]?.amount;
    console.log(`[webhook] ✅ Payment confirmed — session: ${sessionId}, amount: ₱${amount/100}`);
    // Optional: await supabase.from('payments').insert({ session_id: sessionId, ... });
  }

  return res.status(200).json({ received: true });
}
