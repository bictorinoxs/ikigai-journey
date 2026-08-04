// pages/api/payment/create-checkout.js
// Creates a PayMongo checkout session and returns the redirect URL.
// Payment method: QR Ph (InstaPay-enabled banks: BPI, BDO, UnionBank, etc.)
// Add 'gcash', 'paymaya', 'card' to the array once PayMongo approves them.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BASE = process.env.NEXT_PUBLIC_BASE_URL;
  if (!BASE) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_BASE_URL not set in environment variables' });
  }

  const auth = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + auth,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            // ── Active payment methods ────────────────────────────────────────
            // QR Ph: works with BPI, BDO, UnionBank, and all InstaPay banks
            // Add 'gcash', 'paymaya', 'card' once PayMongo approves them
            payment_method_types: ['qrph'],

            line_items: [
              {
                currency: 'PHP',
                amount: 39900,          // ₱399 in centavos
                name: 'Ikigai Journey — Discover Your Purpose',
                description: 'Your personal 20-section purpose report — deeply specific to your answers.',
                quantity: 1,
              },
            ],

            // success_url uses fixed string — session ID is saved to
            // localStorage before redirect (see index.js handleStart)
            success_url: BASE + '/?paid=true',
            cancel_url:  BASE + '/?cancelled=true',

            send_email_receipt: true,
            show_description:   true,
            show_line_items:    true,
            description: 'Ikigai Journey — Discover Your Purpose',
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[create-checkout] PayMongo error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Could not create checkout session. Try again.' });
    }

    return res.status(200).json({
      checkoutUrl: data.data.attributes.checkout_url,
      sessionId:   data.data.id,
    });

  } catch (err) {
    console.error('[create-checkout] Unexpected error:', err?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}