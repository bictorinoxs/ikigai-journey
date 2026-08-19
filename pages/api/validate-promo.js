// pages/api/validate-promo.js
// Validates a promo code and returns the discounted amount.
// Codes are defined directly below — edit this list to add/remove codes.

const FULL_PRICE = 49900; // ₱499 in centavos — keep in sync with create-checkout.js

const PROMO_CODES = {
  'FRIENDSIKIGAI': { discount: 200, type: 'fixed',   label: '₱200 off' },   // ₱499 → ₱299
  'MYIKIGAI2026':  { discount: 200, type: 'fixed',   label: '₱200 off' },   // ₱499 → ₱299
  'MYPURPOSE2026': { discount: 100, type: 'fixed',   label: '₱100 off' },   // ₱499 → ₱399
  'ADMINIKIGAI':   { discount: 490, type: 'fixed',   label: '₱490 off' },   // ₱499 → ₱9 (internal testing)
};

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(200).json({ valid: false, error: 'No code entered' });
  }

  const upperCode = code.trim().toUpperCase();
  const promo     = PROMO_CODES[upperCode];

  if (!promo) {
    return res.status(200).json({ valid: false, error: 'Invalid discount code' });
  }

  let discountedAmount = FULL_PRICE;
  if (promo.type === 'percent') {
    discountedAmount = Math.round(FULL_PRICE * (1 - promo.discount / 100));
  } else if (promo.type === 'fixed') {
    discountedAmount = Math.max(0, FULL_PRICE - (promo.discount * 100)); // pesos → centavos
  } else if (promo.type === 'free') {
    discountedAmount = 0;
  }

  // PayMongo minimum charge is ₱1 (100 centavos)
  if (discountedAmount > 0 && discountedAmount < 100) discountedAmount = 100;

  const saving = FULL_PRICE - discountedAmount;

  return res.status(200).json({
    valid:            true,
    code:             upperCode,
    label:            promo.label,
    originalAmount:   FULL_PRICE,
    discountedAmount,
    saving,
    savingPesos:      Math.round(saving / 100),
    finalPesos:       Math.round(discountedAmount / 100),
    isFree:           discountedAmount === 0,
  });
}