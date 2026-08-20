// pages/privacy.js
import LegalLayout from '../components/LegalLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>**Ikigai Journey** — a product of Purposely Learning Hub</p>
      <p>Last updated: August 20, 2026</p>
      <h2>1. Who We Are</h2>
      <p>Ikigai Journey ("we," "us," "our") is operated by Purposely Learning Hub, based in Calamba, Laguna, Philippines. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use app.purposelylearning.com (the "Service").</p>
      <h2>2. Information We Collect</h2>
      <p><strong>Information you provide directly:</strong></p>
      <ul>
      <li>Your first name</li>
      <li>Your email address</li>
      <li>Your answers to the 16 guided Ikigai questions, including personal, professional, and financial reflections you choose to share</li>
      <li>Payment information is collected and processed entirely by PayMongo, our third-party payment processor — we do not see or store your card, GCash, or bank details</li>
      </ul>
      <p><strong>Information collected automatically:</strong></p>
      <ul>
      <li>Session duration (how long you take to complete the journey)</li>
      <li>Basic technical data (browser type, device type) for troubleshooting</li>
      <li>Discount code used, if any</li>
      </ul>
      <h2>3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
      <li>Generate your personalized Ikigai report</li>
      <li>Email your report to you in HTML format</li>
      <li>Verify your payment and grant access to the full journey</li>
      <li>Improve our Service and troubleshoot issues</li>
      <li>Maintain an internal record of completed sessions for support and quality purposes</li>
      </ul>
      <h2>4. How Your Answers Are Processed</h2>
      <p>Your answers to the guided questions are sent to Anthropic's Claude AI API to generate your personalized report. Anthropic processes this data solely to generate your report and does not use it to train their models when accessed through our API integration. Your answers and generated report are stored in our secure database (Supabase) associated with your session.</p>
      <h2>5. Third-Party Services We Use</h2>
      <table><thead><tr><th>Service</th><th>Purpose</th></tr></thead><tbody>
      <tr><td>PayMongo</td><td>Payment processing</td></tr>
      <tr><td>Anthropic (Claude)</td><td>Generating your personal report</td></tr>
      <tr><td>Resend</td><td>Sending your report via email</td></tr>
      <tr><td>Supabase</td><td>Secure storage of session records</td></tr>
      <tr><td>Vercel</td><td>Application hosting</td></tr>
      </tbody></table>
      <p>Each of these providers has their own privacy practices governing how they handle data on our behalf.</p>
      <h2>6. Data Retention</h2>
      <p>We retain your session data (name, email, report content) indefinitely unless you request deletion, in order to allow you to request a copy of your report or verify a past purchase. You may request deletion of your data at any time (see Section 9).</p>
      <h2>7. Data Sharing</h2>
      <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes. We only share your information with the service providers listed in Section 5, strictly to operate the Service.</p>
      <h2>8. Data Security</h2>
      <p>We take reasonable technical and organizational measures to protect your data, including encrypted connections (HTTPS), access-restricted databases, and secure payment processing through a PCI-compliant provider (PayMongo). No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
      <h2>9. Your Rights</h2>
      <p>Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the right to:</p>
      <ul>
      <li>Be informed of how your data is processed</li>
      <li>Access your personal data</li>
      <li>Correct inaccurate data</li>
      <li>Request deletion of your data</li>
      <li>Object to processing</li>
      <li>Data portability</li>
      </ul>
      <p>To exercise any of these rights, message us on Facebook or Instagram (see Section 12).</p>
      <h2>10. Children's Privacy</h2>
      <p>Our Service is not directed at individuals under 18. We do not knowingly collect data from minors.</p>
      <h2>11. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the "Last updated" date above.</p>
      <h2>12. Contact Us</h2>
      <p>Purposely Learning Hub</p>
      <p>294 Purok 5 Majada Out, Calamba City, Laguna, 4027, Philippines</p>
      <p>For any privacy questions, requests, or concerns, please reach us through:</p>
      <ul>
      <li>Facebook: facebook.com/profile.php?id=61592202830156</li>
      <li>Instagram: @purposely.life</li>
      </ul>
      <hr/>
      <p className="disclaimer"></p>
    </LegalLayout>
  );
}
