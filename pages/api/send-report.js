// pages/api/send-report.js
// Generates a standalone responsive HTML report and sends it to the user's email via Resend.
// The HTML file is also returned in the response so the frontend can offer a download.

import jwt from 'jsonwebtoken';

export const maxDuration = 30;

// ── Responsive HTML report generator ─────────────────────────────────────────
function generateReportHTML(data, email) {
  const sec = (title, accent, content) => `
    <div class="section">
      <div class="section-title" style="border-left:4px solid ${accent}; padding-left:14px; margin-bottom:18px;">
        <span style="font-size:10px; letter-spacing:2.5px; text-transform:uppercase; color:${accent}; font-family:'Inter',sans-serif; font-weight:700;">${title}</span>
      </div>
      ${content}
    </div>`;

  const card = (content, accent = '#2d2952') => `
    <div class="card" style="border:1px solid ${accent};">${content}</div>`;

  const lbl = (text, color = '#857da0') => `
    <span class="label" style="color:${color};">${text}</span>`;

  const safe = (v) => (v || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"/>
<title>Your Ikigai Report — ${safe(data.archetype_name || 'Personal Report')}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0e0c1e;color:#f2ede2;font-family:'Inter',system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;}
  .wrap{max-width:760px;margin:0 auto;padding:40px 24px;}
  .section{margin-bottom:48px;}
  .card{background:#15132a;border-radius:12px;padding:20px 24px;margin-bottom:10px;}
  .label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:700;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
  .pull-quote{padding:18px 22px;border-left:4px solid #f0a732;background:#15132a;border-radius:0 10px 10px 0;margin-bottom:10px;}
  .orbit-row{display:flex;gap:14px;align-items:flex-start;background:#15132a;border:1px solid #2d2952;border-radius:10px;padding:12px 18px;margin-bottom:8px;}
  .orbit-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;min-width:90px;margin-top:1px;flex-shrink:0;}
  /* Header */
  .header{background:#15132a;border-bottom:1px solid #2d2952;padding:14px 28px;display:flex;align-items:center;gap:10px;}
  .header-logo{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f0a732;}
  /* Hero */
  .hero{text-align:center;padding:44px 32px;background:#15132a;border-radius:20px;border:1px solid #2d2952;margin-bottom:52px;}
  .hero-label{font-size:10px;letter-spacing:3px;color:#857da0;text-transform:uppercase;margin-bottom:16px;}
  .hero-quote{font-size:clamp(16px,3vw,22px);font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#f0a732;line-height:1.55;}
  /* Mantra box */
  .mantra-box{background:#15132a;border-radius:14px;padding:30px 32px;text-align:center;border:1px solid #f0a73218;}
  /* Footer */
  .footer{text-align:center;padding:48px 0 28px;border-top:1px solid #2d2952;}
  .footer p{font-size:14px;color:#857da0;font-style:italic;font-family:'Cormorant Garamond',Georgia,serif;}
  .btn{display:inline-block;background:#f0a732;color:#0e0c1e;border-radius:9px;padding:12px 30px;font-size:14px;font-weight:600;text-decoration:none;font-family:'Inter',sans-serif;margin-top:20px;}
  /* Circle cards */
  .circle-card{background:#15132a;border-radius:10px;padding:18px;}
  /* Responsive */
  @media(max-width:700px){
    .grid2,.grid3{grid-template-columns:1fr;}
    .wrap{padding:28px 16px;}
    .hero{padding:30px 20px;}
    .orbit-row{flex-direction:column;gap:6px;}
    .orbit-label{min-width:auto;}
  }
  @media(max-width:480px){
    .header{padding:12px 16px;}
    .hero-quote{font-size:17px;}
  }
  /* Print */
  @media print{
    body{background:#fff;color:#18162e;}
    .header,.hero,.card,.circle-card,.pull-quote,.orbit-row,.mantra-box{background:#f6f5fa!important;border-color:#ccc8e0!important;}
    .footer{border-color:#ccc8e0;}
    .btn{display:none;}
    .section{page-break-inside:avoid;}
  }
</style>
</head>
<body>

<div class="header">
  <svg viewBox="0 0 60 60" width="28" height="28" style="flex-shrink:0;" aria-hidden="true">
    <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
    <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
    <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
    <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
    <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
  </svg>
  <span class="header-logo">Ikigai Journey</span>
  <span style="margin-left:auto;font-size:11px;color:#857da0;font-family:'Inter',sans-serif;">Personal Report</span>
</div>

<div class="wrap">

  <div class="hero">
    <svg viewBox="0 0 60 60" width="52" height="52" style="margin-bottom:16px;" aria-hidden="true">
      <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
      <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
      <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
      <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
      <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
    </svg>
    <p class="hero-label">Your Purpose</p>
    <blockquote class="hero-quote">"${safe(data.ikigai_sentence)}"</blockquote>
  </div>

  ${sec('A Letter to You', '#9d91d4', card(`
    <p style="font-size:15px;line-height:1.88;margin-bottom:14px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p1)}</p>
    <p style="font-size:15px;line-height:1.88;margin-bottom:18px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p2)}</p>
    <p style="font-size:15px;font-style:italic;color:#9d91d4;border-top:1px solid #2d2952;padding-top:16px;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_question)}</p>
  `, '#9d91d4'))}

  ${sec('Your Archetype', '#f0a732', card(`
    <div class="grid2">
      <div>
        <h3 style="color:#f0a732;font-size:22px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;margin-bottom:5px;">${safe(data.archetype_name)}</h3>
        <p style="color:#857da0;font-size:13px;margin-bottom:18px;font-style:italic;">${safe(data.archetype_tagline)}</p>
        ${lbl('Superpower', '#6aaa92')}<p style="font-size:13px;color:#6aaa92;margin-bottom:14px;">${safe(data.archetype_superpower)}</p>
        ${lbl('Kryptonite', '#d96b55')}<p style="font-size:13px;color:#d96b55;">${safe(data.archetype_kryptonite)}</p>
      </div>
      <div>
        ${lbl('Famous Examples')}
        ${(data.archetype_examples || []).map(ex => `<div style="background:#1d1b38;border-radius:8px;padding:8px 12px;margin-bottom:7px;font-size:13px;color:#f2ede2;">✦ ${safe(ex)}</div>`).join('')}
      </div>
    </div>
  `, '#f0a732'))}

  ${sec('The Four Circles', '#857da0', `
    <div class="grid2">
      ${[['#f0a732','What You Love',data.love_summary],['#9d91d4',"What You're Good At",data.goodat_summary],['#d96b55','What the World Needs',data.worldneeds_summary],['#6aaa92','What You Can Be Paid For',data.paidfor_summary]].map(([c,l,t]) => `
      <div class="circle-card" style="border:1px solid ${c}20;border-top:3px solid ${c};">
        ${lbl(l, c)}<p style="font-size:13px;line-height:1.72;color:#c0b8d4;">${safe(t)}</p>
      </div>`).join('')}
    </div>
  `)}

  ${sec('Your Niche', '#6aaa92', card(`
    ${[['WHO you serve',data.niche_who],['PROBLEM you solve',data.niche_problem],['DIFFERENTIATOR',data.niche_differentiator]].map(([l,v],i) => `
    <div style="${i < 2 ? 'border-bottom:1px solid #2d2952;padding-bottom:14px;margin-bottom:14px;' : ''}">
      ${lbl(l)}<p style="font-size:14px;color:#f2ede2;line-height:1.62;">${safe(v)}</p>
    </div>`).join('')}
    <div style="margin-top:18px;background:#1d1b38;border-radius:10px;padding:16px;border:1px solid #6aaa9225;">
      ${lbl('Your dinner-table line', '#6aaa92')}
      <p style="font-size:16px;color:#f2ede2;font-style:italic;font-family:'Cormorant Garamond',Georgia,serif;">"${safe(data.niche_test_phrase)}"</p>
    </div>
  `, '#6aaa92'))}

  ${sec('The ONE Thing', '#f0a732', card(`
    <p style="font-size:17px;font-family:'Cormorant Garamond',Georgia,serif;color:#f0a732;margin-bottom:10px;font-weight:700;">${safe(data.one_thing)}</p>
    <p style="font-size:13px;color:#c0b8d4;line-height:1.72;margin-bottom:18px;">${safe(data.one_thing_why)}</p>
    <div class="grid3">
      ${[['#f0a732','Today',data.action_today],['#9d91d4','This Week',data.action_week],['#6aaa92','This Month',data.action_month]].map(([c,l,v]) => `
      <div style="background:#1d1b38;border-radius:10px;padding:14px;border:1px solid ${c}20;">
        ${lbl(l, c)}<p style="font-size:12px;color:#f2ede2;line-height:1.55;">${safe(v)}</p>
      </div>`).join('')}
    </div>
  `, '#f0a732'))}

  ${sec('How This Changes Your Work', '#9d91d4', `
    <div class="grid2">
      ${[['Marketing Shift',data.marketing_shift,'#9d91d4'],['Sales Shift',data.sales_shift,'#9d91d4'],['Offer & Pricing Shift',data.offer_shift,'#9d91d4']].map(([l,v,c]) => card(`${lbl(l, c)}<p style="font-size:13px;color:#f2ede2;line-height:1.62;">${safe(v)}</p>`, c)).join('')}
      ${card(`${lbl('Say No To', '#d96b55')}${(data.say_no_to || []).map(item => `<p style="font-size:12px;color:#d96b55;margin-bottom:4px;">✕ ${safe(item)}</p>`).join('')}`, '#d96b55')}
    </div>
  `)}

  ${sec('Your 3 Content Pillars', '#d96b55', `
    <div class="grid3">
      ${[data.pillar1,data.pillar2,data.pillar3].filter(Boolean).map(p => card(`
        ${lbl(safe(p.name), '#d96b55')}
        ${(p.posts || []).map(post => `<p style="font-size:12px;color:#c0b8d4;margin-bottom:6px;padding-left:10px;border-left:2px solid #2d2952;">"${safe(post)}"</p>`).join('')}
      `, '#d96b55')).join('')}
    </div>
  `)}

  ${sec('3 Monetization Paths', '#6aaa92', [data.path1,data.path2,data.path3].filter(Boolean).map(p => card(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <p style="color:#6aaa92;font-weight:700;font-size:15px;">${safe(p.name)}</p>
      <span style="background:#1d1b38;border-radius:20px;padding:3px 10px;font-size:12px;color:#6aaa92;border:1px solid #6aaa9230;">${safe(p.projection)}</span>
    </div>
    ${(p.actions || []).map(a => `<p style="font-size:13px;color:#c0b8d4;margin:4px 0;padding-left:14px;position:relative;"><span style="position:absolute;left:0;color:#6aaa92;">→</span>${safe(a)}</p>`).join('')}
  `, '#6aaa92')).join(''))}



  ${sec('Your 5-Person Orbit', '#f0a732', [['The Mentor',data.orbit_mentor,'#f0a732'],['The Peer',data.orbit_peer,'#9d91d4'],['The Hire',data.orbit_hire,'#6aaa92'],['The Partner',data.orbit_partner,'#d96b55'],['The Audience',data.orbit_audience,'#c0b8d4']].map(([l,v,c]) => `
    <div class="orbit-row">
      <span class="orbit-label" style="color:${c};">${l}</span>
      <p style="font-size:13px;color:#c0b8d4;line-height:1.62;">${safe(v)}</p>
    </div>`).join(''))}

  ${sec('Your Energy Map', '#6aaa92', `
    <div class="grid2">
      ${card(`${lbl('What feeds you', '#6aaa92')}${(data.energy_feeds || []).map(f => `<p style="font-size:13px;color:#6aaa92;margin:4px 0;">↑ ${safe(f)}</p>`).join('')}`, '#6aaa92')}
      ${card(`${lbl('What drains you', '#d96b55')}${(data.energy_drains || []).map(d => `<p style="font-size:13px;color:#d96b55;margin:4px 0;">↓ ${safe(d)}</p>`).join('')}`, '#d96b55')}
    </div>
  `)}

  ${sec('What to Stop Doing', '#d96b55', card(`
    ${(data.stop_doing || []).map(item => `<div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;"><span style="color:#d96b55;flex-shrink:0;">✕</span><p style="font-size:14px;color:#f2ede2;line-height:1.55;">${safe(item)}</p></div>`).join('')}
  `, '#d96b55'))}

  ${[data.pull_quote1,data.pull_quote2,data.pull_quote3].filter(Boolean).length > 0 ? sec('Your Words, Highlighted', '#f0a732', [data.pull_quote1,data.pull_quote2,data.pull_quote3].filter(Boolean).map(q => `
    <div class="pull-quote">
      <p style="font-size:16px;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#f0a732;line-height:1.6;">"${safe(q)}"</p>
    </div>`).join('')) : ''}

  ${sec('12 Months From Now', '#9d91d4', card(`
    <p style="font-size:15px;line-height:1.88;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;">${safe(data.vision_12mo)}</p>
  `, '#9d91d4'))}

  ${sec('The 5-Year Vision', '#d96b55', card(`
    <p style="font-size:14px;line-height:1.8;color:#f2ede2;">${safe(data.vision_5yr)}</p>
  `, '#d96b55'))}

  ${sec('Your Daily Mantra', '#f0a732', `
    <div class="mantra-box">
      <svg viewBox="0 0 60 60" width="36" height="36" style="margin-bottom:16px;" aria-hidden="true">
        <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
        <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
        <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
        <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
        <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
      </svg>
      ${(data.mantra || []).map((line, i) => `<p style="font-size:${i===0?20:16}px;color:${i===0?'#f0a732':'#f2ede2'};font-family:'Cormorant Garamond',Georgia,serif;font-weight:${i===0?700:400};line-height:1.5;margin-bottom:8px;">${safe(line)}</p>`).join('')}
    </div>
  `)}

  ${sec('Curated for You', '#857da0', `
    <div class="grid2">
      <div>
        ${lbl('Books')}
        ${(data.books || []).map(b => card(`<p style="font-size:13px;font-weight:600;color:#f2ede2;margin-bottom:2px;">${safe(b.title)}</p><p style="font-size:11px;color:#857da0;margin-bottom:6px;">${safe(b.author)}</p><p style="font-size:12px;color:#c0b8d4;line-height:1.55;">${safe(b.why)}</p>`)).join('')}
      </div>
      <div>
        ${lbl('Podcasts')}
        ${(data.podcasts || []).map(p => card(`<p style="font-size:13px;font-weight:600;color:#f2ede2;margin-bottom:2px;">${safe(p.name)}</p><p style="font-size:11px;color:#857da0;margin-bottom:6px;">${safe(p.host)}</p><p style="font-size:12px;color:#c0b8d4;line-height:1.55;">${safe(p.why)}</p>`)).join('')}
      </div>
    </div>
  `)}

  ${sec('Your Next Steps', '#f0a732', `
    <div class="grid3">
      ${[['#f0a732','Today',data.next_today],['#9d91d4','This Week',data.next_week],['#6aaa92','This Month',data.next_month]].map(([c,l,v]) => `
      <div style="background:#15132a;border:1px solid ${c}22;border-radius:12px;padding:20px;border-top:3px solid ${c};">
        ${lbl(l, c)}<p style="font-size:13px;color:#f2ede2;line-height:1.62;">${safe(v)}</p>
      </div>`).join('')}
    </div>
  `)}

  <div class="footer">
    <svg viewBox="0 0 60 60" width="40" height="40" style="margin-bottom:14px;" aria-hidden="true">
      <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
      <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
      <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
      <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
      <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
    </svg>
    <p>Your purpose is your compass. When in doubt, return to this page.</p>
    ${email ? `<p style="font-size:12px;color:#857da0;margin-top:8px;font-family:'Inter',sans-serif;">Sent to ${email}</p>` : ''}
  </div>

</div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify JWT
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  let email = null;
  if (token) {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        email = payload.email || null;
      }
    } catch {}
  }

  const { reportData, userEmail } = req.body;
  // Use email from JWT first, then fallback to one provided in body
  const recipientEmail = email || userEmail || null;

  if (!reportData) return res.status(400).json({ error: 'reportData required' });

  // Generate the HTML
  const html = generateReportHTML(reportData, recipientEmail);

  // Send email if we have an address and Resend key
  let emailSent = false;
  let emailError = null;

  if (recipientEmail && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Ikigai Journey <reports@ikigaijourney.ph>',
          to: recipientEmail,
          subject: '🌸 Your Personal Purpose Report — Ikigai Journey',
          html,
          // Also attach as file so they can save it easily
          attachments: [{
            filename: 'ikigai-purpose-report.html',
            content: Buffer.from(html).toString('base64'),
            type: 'text/html',
          }],
        }),
      });
      const emailData = await response.json();
      if (response.ok) {
        emailSent = true;
        console.log('[send-report] ✅ Email sent to:', recipientEmail, '| id:', emailData.id);
      } else {
        emailError = emailData.message || 'Resend error';
        console.error('[send-report] Resend error:', emailData);
      }
    } catch (err) {
      emailError = err?.message;
      console.error('[send-report] Email send failed:', err?.message);
    }
  } else {
    if (!recipientEmail) emailError = 'No email address available';
    if (!process.env.RESEND_API_KEY) emailError = 'RESEND_API_KEY not configured';
    console.warn('[send-report] Skipping email:', emailError);
  }

  // Always return the HTML so frontend can offer download even if email fails
  return res.status(200).json({
    ok: true,
    emailSent,
    emailError,
    recipientEmail,
    html, // frontend uses this for download button
  });
}