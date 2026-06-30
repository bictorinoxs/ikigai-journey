// pages/api/payment/create-checkout.js
// Creates a PayMongo checkout session and returns the redirect URL + session ID.
// success_url does NOT rely on PayMongo's placeholder substitution (unreliable).
// Instead, the frontend stores sessionId locally before redirecting.

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
            payment_method_types: ['gcash', 'paymaya', 'card', 'dob'],
            line_items: [
              {
                currency: 'PHP',
                amount: 50000,
                name: 'Ikigai Journey',
                description: 'Your personal 20-section Ikigai report.',
                quantity: 1,
              },
            ],
            // Fixed URL — no placeholder. We already have sessionId in the response below.
            success_url: BASE + '/?paid=true',
            cancel_url:  BASE + '/?cancelled=true',
            send_email_receipt: true,
            show_description:   true,
            show_line_items:    true,
            description: 'Ikigai Journey — Self-Discovery Report',
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[create-checkout] PayMongo error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Could not create checkout session. Try again.' });
    }

    // Return BOTH the checkout URL and the session ID.
    // Frontend will save sessionId to sessionStorage BEFORE redirecting.
    return res.status(200).json({
      checkoutUrl: data.data.attributes.checkout_url,
      sessionId:   data.data.id,
    });

  } catch (err) {
    console.error('[create-checkout] Unexpected error:', err?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}