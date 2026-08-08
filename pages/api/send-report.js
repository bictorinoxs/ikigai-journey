// pages/api/send-report.js
// Generates the Ikigai report in both HTML and PDF formats
// and sends both as email attachments via Resend.
// PDF includes user email in the footer on every page.

import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

export const maxDuration = 30;

// ── PDF generation ────────────────────────────────────────────────────────────
const generateReportPDF = (data, email) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    margin: 56,
    size: 'A4',
    bufferPages: true, // needed to add footer to all pages after generation
    info: {
      Title:   'Your Personal Ikigai Report',
      Author:  'Ikigai Journey by Purposely Learning',
      Subject: data.ikigai_sentence || 'Personal Purpose Report',
    },
  });

  const chunks = [];
  doc.on('data',  chunk => chunks.push(chunk));
  doc.on('end',   () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  // ── Colours ──────────────────────────────────────────────────────────────────
  const GOLD   = '#c17f24';
  const DARK   = '#18162e';
  const MUTED  = '#6b6488';
  const CORAL  = '#c05540';
  const SAGE   = '#4a8a72';
  const LAV    = '#7d71b4';
  const BLACK  = '#1a1a2e';
  const W      = doc.page.width  - 112;
  const LEFT   = 56;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const heading = (text, color = DARK, size = 13) => {
    doc.moveDown(0.6)
       .fontSize(size)
       .fillColor(color)
       .font('Helvetica-Bold')
       .text(text.toUpperCase(), LEFT, undefined, { width: W, characterSpacing: 0.8 })
       .moveDown(0.3);
  };

  const body = (text, color = BLACK, size = 10.5) => {
    if (!text) return;
    doc.fontSize(size)
       .fillColor(color)
       .font('Helvetica')
       .text(String(text), LEFT, undefined, { width: W, lineGap: 3 })
       .moveDown(0.4);
  };

  const bullet = (items = [], color = BLACK) => {
    (items || []).forEach(item => {
      doc.fontSize(10)
         .fillColor(color)
         .font('Helvetica')
         .text('• ' + String(item), LEFT + 12, undefined, { width: W - 12, lineGap: 2 });
    });
    doc.moveDown(0.4);
  };

  const rule = (color = '#e0ddf0') => {
    doc.moveDown(0.4)
       .moveTo(LEFT, doc.y)
       .lineTo(LEFT + W, doc.y)
       .strokeColor(color)
       .lineWidth(0.5)
       .stroke()
       .moveDown(0.5);
  };

  const safe = v => v ? String(v) : '—';

  // ── COVER PAGE ────────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0e0c1e');

  doc.fillColor(GOLD)
     .fontSize(11)
     .font('Helvetica')
     .text('IKIGAI JOURNEY  ·  PURPOSELY LEARNING', LEFT, 56, { width: W, align: 'center', characterSpacing: 2 });

  doc.fillColor('#f2ede2')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('Your Personal', LEFT, 200, { width: W, align: 'center' });

  doc.fillColor(GOLD)
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('Purpose Report', LEFT, 240, { width: W, align: 'center' });

  const sentence = safe(data.ikigai_sentence);
  doc.fillColor('#c0b8d4')
     .fontSize(11)
     .font('Helvetica-Oblique')
     .text('"' + sentence + '"', LEFT, 310, { width: W, align: 'center', lineGap: 5 });

  if (data.archetype_name) {
    doc.fillColor(LAV)
       .fontSize(13)
       .font('Helvetica-Bold')
       .text(safe(data.archetype_name), LEFT, doc.y + 30, { width: W, align: 'center' });
  }

  if (email) {
    doc.fillColor('#857da0')
       .fontSize(9)
       .font('Helvetica')
       .text(email, LEFT, doc.page.height - 80, { width: W, align: 'center' });
  }

  doc.fillColor('#857da0')
     .fontSize(8)
     .text('Powered by Ikigai Journey · app.purposelylearning.com', LEFT, doc.page.height - 60, { width: W, align: 'center' });

  // ── MAIN CONTENT PAGES ────────────────────────────────────────────────────────
  doc.addPage();

  // A Letter to You
  heading('A Letter to You', GOLD, 14);
  body(safe(data.letter_p1));
  body(safe(data.letter_p2));
  if (data.letter_question) {
    doc.moveDown(0.3)
       .fontSize(11)
       .fillColor(LAV)
       .font('Helvetica-Oblique')
       .text(safe(data.letter_question), LEFT + 10, undefined, { width: W - 10, lineGap: 4 })
       .moveDown(0.5);
  }
  rule();

  // Your Archetype
  heading('Your Archetype', CORAL, 13);
  doc.fontSize(15).fillColor(DARK).font('Helvetica-Bold').text(safe(data.archetype_name), LEFT, undefined, { width: W });
  doc.fontSize(10).fillColor(MUTED).font('Helvetica-Oblique').text(safe(data.archetype_tagline), LEFT, undefined, { width: W }).moveDown(0.4);
  body('Superpower: ' + safe(data.archetype_superpower), SAGE);
  body('Kryptonite: ' + safe(data.archetype_kryptonite), CORAL);
  if (data.archetype_examples?.length) {
    body('Famous examples: ' + data.archetype_examples.join(', '), MUTED);
  }
  rule();

  // The Four Circles
  heading('The Four Circles', LAV, 13);
  [
    ['What You Love', data.love_summary, GOLD],
    ["What You're Good At", data.goodat_summary, LAV],
    ['What the World Needs', data.worldneeds_summary, CORAL],
    ['What You Can Be Paid For', data.paidfor_summary, SAGE],
  ].forEach(([label, text, color]) => {
    doc.fontSize(10).fillColor(color).font('Helvetica-Bold').text(label.toUpperCase(), LEFT, undefined, { width: W, characterSpacing: 0.5 });
    body(safe(text));
  });
  rule();

  // Your Niche
  heading('Your Niche', SAGE, 13);
  [
    ['Who you serve', data.niche_who],
    ['Problem you solve', data.niche_problem],
    ['Your differentiator', data.niche_differentiator],
  ].forEach(([label, val]) => {
    doc.fontSize(10).fillColor(MUTED).font('Helvetica-Bold').text(label.toUpperCase() + ':', LEFT, undefined, { characterSpacing: 0.5 });
    body(safe(val));
  });
  if (data.niche_test_phrase) {
    doc.fontSize(11).fillColor(SAGE).font('Helvetica-Oblique').text('"' + safe(data.niche_test_phrase) + '"', LEFT + 10, undefined, { width: W - 10, lineGap: 4 }).moveDown(0.4);
  }
  rule();

  // The ONE Thing
  heading('The ONE Thing', GOLD, 13);
  doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text(safe(data.one_thing), LEFT, undefined, { width: W }).moveDown(0.3);
  body(safe(data.one_thing_why), MUTED);
  [['Today', data.action_today, GOLD], ['This Week', data.action_week, LAV], ['This Month', data.action_month, SAGE]].forEach(([l,v,c]) => {
    doc.fontSize(9).fillColor(c).font('Helvetica-Bold').text(l.toUpperCase() + ':', LEFT, undefined, { characterSpacing: 0.5 });
    body(safe(v));
  });
  rule();

  // Content Pillars
  heading('Your 3 Content Pillars', CORAL, 13);
  [data.pillar1, data.pillar2, data.pillar3].filter(Boolean).forEach(p => {
    doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(safe(p.name), LEFT, undefined, { width: W });
    bullet(p.posts, MUTED);
  });
  rule();

  // Monetization Paths
  heading('3 Monetization Paths', SAGE, 13);
  [data.path1, data.path2, data.path3].filter(Boolean).forEach(p => {
    doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(safe(p.name) + '  —  ' + safe(p.projection), LEFT, undefined, { width: W });
    bullet(p.actions, MUTED);
    doc.moveDown(0.2);
  });
  rule();

  // Your 5-Person Orbit
  heading('Your 5-Person Orbit', GOLD, 13);
  [['The Mentor', data.orbit_mentor, GOLD], ['The Peer', data.orbit_peer, LAV], ['The Hire', data.orbit_hire, SAGE], ['The Partner', data.orbit_partner, CORAL], ['The Audience', data.orbit_audience, MUTED]].forEach(([l,v,c]) => {
    doc.fontSize(10).fillColor(c).font('Helvetica-Bold').text(l + ':', LEFT, undefined, { characterSpacing: 0.3 });
    body(safe(v));
  });
  rule();

  // Energy Map
  heading('Your Energy Map', SAGE, 13);
  doc.fontSize(10).fillColor(SAGE).font('Helvetica-Bold').text('WHAT FEEDS YOU:', LEFT, undefined, { characterSpacing: 0.5 });
  bullet(data.energy_feeds, SAGE);
  doc.fontSize(10).fillColor(CORAL).font('Helvetica-Bold').text('WHAT DRAINS YOU:', LEFT, undefined, { characterSpacing: 0.5 });
  bullet(data.energy_drains, CORAL);
  rule();

  // Stop Doing
  heading('What to Stop Doing', CORAL, 13);
  bullet(data.stop_doing, CORAL);
  rule();

  // Visions
  heading('12 Months From Now', LAV, 13);
  doc.fontSize(11).fillColor(DARK).font('Helvetica-Oblique').text(safe(data.vision_12mo), LEFT, undefined, { width: W, lineGap: 4 }).moveDown(0.5);

  heading('The 5-Year Vision', LAV, 13);
  body(safe(data.vision_5yr));
  rule();

  // Daily Mantra
  heading('Your Daily Mantra', GOLD, 13);
  (data.mantra || []).forEach((line, i) => {
    doc.fontSize(i === 0 ? 14 : 11)
       .fillColor(i === 0 ? GOLD : DARK)
       .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
       .text(safe(line), LEFT, undefined, { width: W, align: 'center' })
       .moveDown(0.3);
  });
  rule();

  // Books & Podcasts
  heading('Curated For You', MUTED, 13);
  if (data.books?.length) {
    doc.fontSize(10).fillColor(MUTED).font('Helvetica-Bold').text('BOOKS:', LEFT, undefined, { characterSpacing: 0.5 });
    (data.books || []).forEach(b => body(safe(b.title) + ' by ' + safe(b.author) + ' — ' + safe(b.why)));
  }
  if (data.podcasts?.length) {
    doc.fontSize(10).fillColor(MUTED).font('Helvetica-Bold').text('PODCASTS:', LEFT, undefined, { characterSpacing: 0.5 });
    (data.podcasts || []).forEach(p => body(safe(p.name) + ' by ' + safe(p.host) + ' — ' + safe(p.why)));
  }
  rule();

  // Next Steps
  heading('Your Next Steps', GOLD, 13);
  [['Today', data.next_today, GOLD], ['This Week', data.next_week, LAV], ['This Month', data.next_month, SAGE]].forEach(([l,v,c]) => {
    doc.fontSize(10).fillColor(c).font('Helvetica-Bold').text(l.toUpperCase() + ':', LEFT, undefined, { characterSpacing: 0.5 });
    body(safe(v));
  });

  // ── ADD FOOTER WITH EMAIL ON EVERY PAGE (except cover) ────────────────────
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 1; i < totalPages; i++) { // skip page 0 (cover)
    doc.switchToPage(i);
    const footerY = doc.page.height - 36;
    doc.fontSize(7.5)
       .fillColor('#aaa8c0')
       .font('Helvetica')
       .text(
         'Ikigai Journey · Purposely Learning' + (email ? '  ·  ' + email : '') + '  ·  Page ' + (i + 1) + ' of ' + totalPages,
         LEFT, footerY,
         { width: W, align: 'center' }
       );
  }

  doc.end();
});

// ── HTML generation ───────────────────────────────────────────────────────────
function generateReportHTML(data, email) {
  const sec = (title, accent, content) => `
    <div class="section">
      <div style="border-left:4px solid ${accent};padding-left:14px;margin-bottom:18px;">
        <span style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:'Inter',sans-serif;font-weight:700;">${title}</span>
      </div>
      ${content}
    </div>`;

  const card = (content, accent='#2d2952') => `<div class="card" style="border:1px solid ${accent};">${content}</div>`;
  const lbl  = (text, color='#857da0') => `<span class="label" style="color:${color};">${text}</span>`;
  const safe = v => (v||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"/>
<title>Your Ikigai Report — ${safe(data.archetype_name||'Personal Report')}</title>
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
  .pull{padding:18px 22px;border-left:4px solid #f0a732;background:#15132a;border-radius:0 10px 10px 0;margin-bottom:10px;}
  .orbit{display:flex;gap:14px;background:#15132a;border:1px solid #2d2952;border-radius:10px;padding:12px 18px;margin-bottom:8px;}
  .header{background:#15132a;border-bottom:1px solid #2d2952;padding:14px 28px;display:flex;align-items:center;gap:10px;}
  .header-logo{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f0a732;}
  .hero{text-align:center;padding:44px 32px;background:#15132a;border-radius:20px;border:1px solid #2d2952;margin-bottom:52px;}
  .hero-q{font-size:clamp(16px,3vw,22px);font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#f0a732;line-height:1.55;}
  .footer{text-align:center;padding:48px 0 28px;border-top:1px solid #2d2952;}
  .footer p{font-size:14px;color:#857da0;font-style:italic;font-family:'Cormorant Garamond',Georgia,serif;}
  @media(max-width:700px){.grid2,.grid3{grid-template-columns:1fr!important;}.wrap{padding:28px 16px;}.hero{padding:30px 20px;}}
  @media print{body{background:#fff;color:#18162e;}.header,.hero,.card,.pull,.orbit{background:#f6f5fa!important;border-color:#ccc8e0!important;}.footer{border-color:#ccc8e0;}}
</style>
</head>
<body>
<div class="header">
  <svg viewBox="0 0 60 60" width="28" height="28" aria-hidden="true">
    <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
    <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
    <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
    <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
    <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
  </svg>
  <span class="header-logo">Ikigai Journey</span>
  <span style="margin-left:auto;font-size:11px;color:#857da0;">Personal Report</span>
</div>
<div class="wrap">
  <div class="hero">
    <p style="font-size:10px;letter-spacing:3px;color:#857da0;text-transform:uppercase;margin-bottom:16px;">Your Purpose</p>
    <blockquote class="hero-q">"${safe(data.ikigai_sentence)}"</blockquote>
  </div>
  ${sec('A Letter to You','#9d91d4',card(`
    <p style="font-size:15px;line-height:1.88;margin-bottom:14px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p1)}</p>
    <p style="font-size:15px;line-height:1.88;margin-bottom:18px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p2)}</p>
    <p style="font-size:15px;font-style:italic;color:#9d91d4;border-top:1px solid #2d2952;padding-top:16px;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_question)}</p>
  `,'#9d91d4'))}
  ${sec('Your Archetype','#f0a732',card(`
    <h3 style="color:#f0a732;font-size:22px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;margin-bottom:5px;">${safe(data.archetype_name)}</h3>
    <p style="color:#857da0;font-size:13px;margin-bottom:18px;font-style:italic;">${safe(data.archetype_tagline)}</p>
    ${lbl('Superpower','#6aaa92')}<p style="font-size:13px;color:#6aaa92;margin-bottom:14px;">${safe(data.archetype_superpower)}</p>
    ${lbl('Kryptonite','#d96b55')}<p style="font-size:13px;color:#d96b55;">${safe(data.archetype_kryptonite)}</p>
  `,'#f0a732'))}
  ${sec('The ONE Thing','#f0a732',card(`
    <p style="font-size:17px;font-family:'Cormorant Garamond',Georgia,serif;color:#f0a732;margin-bottom:10px;font-weight:700;">${safe(data.one_thing)}</p>
    <p style="font-size:13px;color:#c0b8d4;line-height:1.72;margin-bottom:18px;">${safe(data.one_thing_why)}</p>
    <div class="grid3">${[['#f0a732','Today',data.action_today],['#9d91d4','This Week',data.action_week],['#6aaa92','This Month',data.action_month]].map(([c,l,v])=>`<div style="background:#1d1b38;border-radius:10px;padding:14px;border:1px solid ${c}20;">${lbl(l,c)}<p style="font-size:12px;color:#f2ede2;line-height:1.55;">${safe(v)}</p></div>`).join('')}</div>
  `,'#f0a732'))}
  ${sec('3 Monetization Paths','#6aaa92',[data.path1,data.path2,data.path3].filter(Boolean).map(p=>card(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <p style="color:#6aaa92;font-weight:700;font-size:15px;">${safe(p.name)}</p>
      <span style="background:#1d1b38;border-radius:20px;padding:3px 10px;font-size:12px;color:#6aaa92;border:1px solid #6aaa9230;">${safe(p.projection)}</span>
    </div>
    ${(p.actions||[]).map(a=>`<p style="font-size:13px;color:#c0b8d4;margin:4px 0;padding-left:14px;position:relative;"><span style="position:absolute;left:0;color:#6aaa92;">→</span>${safe(a)}</p>`).join('')}
  `,'#6aaa92')).join(''))}
  ${sec('Your Daily Mantra','#f0a732',`<div style="background:#15132a;border-radius:14px;padding:30px 32px;text-align:center;border:1px solid #f0a73218;">${(data.mantra||[]).map((line,i)=>`<p style="font-size:${i===0?20:16}px;color:${i===0?'#f0a732':'#f2ede2'};font-family:'Cormorant Garamond',Georgia,serif;font-weight:${i===0?700:400};line-height:1.5;margin-bottom:8px;">${safe(line)}</p>`).join('')}</div>`)}
  <div class="footer">
    <svg viewBox="0 0 60 60" width="40" height="40" style="margin-bottom:14px;" aria-hidden="true">
      <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
      <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
      <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
      <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
      <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
    </svg>
    <p>Your purpose is your compass. When in doubt, return to this page.</p>
    ${email?`<p style="font-size:12px;color:#857da0;margin-top:8px;font-family:'Inter',sans-serif;">${safe(email)}</p>`:''}
    <div style="margin-top:28px;padding:24px;background:#15132a;border-radius:14px;border:1px solid #2d2952;">
      <p style="font-size:15px;font-weight:600;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;margin-bottom:8px;">Enjoyed your journey? 🌸</p>
      <p style="font-size:13px;color:#c0b8d4;font-family:'Inter',sans-serif;line-height:1.7;margin-bottom:18px;">Send us a message — your story might inspire others.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="https://www.facebook.com/profile.php?id=61592202830156" style="display:inline-flex;align-items:center;gap:8px;background:#1877f2;color:#fff;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;font-family:'Inter',sans-serif;">📘 Message on Facebook</a>
        <a href="https://www.instagram.com/purposely.life/" style="display:inline-flex;align-items:center;gap:8px;background:#e1306c;color:#fff;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;font-family:'Inter',sans-serif;">📷 Message on Instagram</a>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
  const recipientEmail = email || userEmail || null;

  console.log('[send-report] JWT email:', email);
  console.log('[send-report] Body userEmail:', userEmail);
  console.log('[send-report] Using recipientEmail:', recipientEmail);
  console.log('[send-report] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);

  if (!reportData) return res.status(400).json({ error: 'reportData required' });

  // Generate both formats
  const html = generateReportHTML(reportData, recipientEmail);
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateReportPDF(reportData, recipientEmail);
  } catch (err) {
    console.error('[send-report] PDF generation error:', err?.message);
  }

  let emailSent  = false;
  let emailError = null;

  if (recipientEmail && process.env.RESEND_API_KEY) {
    try {
      const attachments = [
        {
          filename: 'ikigai-purpose-report.html',
          content:  Buffer.from(html).toString('base64'),
          type:     'text/html',
        },
      ];

      if (pdfBuffer) {
        attachments.push({
          filename: 'ikigai-purpose-report.pdf',
          content:  pdfBuffer.toString('base64'),
          type:     'application/pdf',
        });
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from:        process.env.EMAIL_FROM || 'Ikigai Journey <reports@purposelylearning.com>',
          to:          recipientEmail,
          subject:     '🌸 Your Personal Purpose Report — Ikigai Journey',
          html:        `<p>Your personal Ikigai report is attached in two formats:</p>
                        <ul><li><strong>PDF</strong> — ready to save and print</li>
                        <li><strong>HTML</strong> — open in any browser for the full experience</li></ul>
                        <p>Your purpose: <em>${reportData.ikigai_sentence || ''}</em></p>`,
          attachments,
        }),
      });

      const emailData = await response.json();
      if (response.ok) {
        emailSent = true;
        console.log('[send-report] ✅ Email sent to:', recipientEmail, '| id:', emailData.id, '| attachments:', attachments.length);
      } else {
        emailError = emailData.message || 'Resend error';
        console.error('[send-report] Resend error:', emailData);
      }
    } catch (err) {
      emailError = err?.message;
      console.error('[send-report] Email send failed:', err?.message);
    }
  } else {
    emailError = !recipientEmail ? 'No email address' : 'RESEND_API_KEY not set';
    console.warn('[send-report] Skipping email:', emailError);
  }

  return res.status(200).json({
    ok: true,
    emailSent,
    emailError,
    recipientEmail,
    html,
    hasPdf: !!pdfBuffer,
  });
}