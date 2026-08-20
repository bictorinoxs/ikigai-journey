// pages/refund-policy.js
import LegalLayout from '../components/LegalLayout';

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy">
      <p>**Ikigai Journey** — a product of Purposely Learning Hub</p>
      <p>Last updated: August 20, 2026</p>
      <h2>No Refunds</h2>
      <p>Ikigai Journey is a **digital product delivered instantly** upon payment. Because payment unlocks immediate access to the full 16-question journey and generates a personalized Report specific to you, **all payments are final and non-refundable.**</p>
      <p>This applies regardless of whether you:</p>
      <ul>
      <li>Complete the full journey</li>
      <li>Are satisfied with your generated Report</li>
      <li>Change your mind after payment</li>
      <li>Experience technical issues that we were unable to resolve after being notified</li>
      </ul>
      <h2>Why We Don't Offer Refunds</h2>
      <p>We provide a **free preview** (Section 1, Questions 1–4) specifically so you can experience the depth, tone, and quality of the journey before deciding to pay. We encourage you to complete the free preview thoughtfully before purchasing.</p>
      <h2>Billing Errors</h2>
      <p>If you believe you were charged incorrectly — for example, a duplicate transaction or an unauthorized charge on your account — message us on **Facebook** or **Instagram** within **7 days** of the transaction. We will investigate in good faith and correct any genuine billing error.</p>
      <h2>Technical Issues</h2>
      <p>If a technical error prevents you from completing your journey or receiving your Report after payment (e.g., the report fails to generate and cannot be recovered even after retrying), message us on Facebook or Instagram with your payment confirmation, and we will make reasonable efforts to resolve the issue, which may include regenerating your Report or granting you continued access — at our discretion.</p>
      <h2>Contact Us</h2>
      <p>Purposely Learning Hub</p>
      <ul>
      <li>Facebook: facebook.com/profile.php?id=61592202830156</li>
      <li>Instagram: @purposely.life</li>
      </ul>
      <hr/>
      <p className="disclaimer"></p>
    </LegalLayout>
  );
}
