// pages/api/send-report.js
// Generates Ikigai report in HTML and PDF (via headless Chrome).
// PDF looks identical to the HTML — same dark theme, colors, layout.
// Both formats sent as email attachments via Resend.
// PDF has user email in footer on every page.

import jwt from 'jsonwebtoken';

export const maxDuration = 60; // PDF generation needs up to 60s

// ── Generate PDF via headless Chrome ─────────────────────────────────────────
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar';

const generatePDF = async (html) => {
  console.log('[PDF] Starting chromium import...');
  const chromiumMod  = await import('@sparticuz/chromium-min');
  const puppeteerMod = await import('puppeteer-core');
  const chromium     = chromiumMod.default || chromiumMod;
  const puppeteer    = puppeteerMod.default || puppeteerMod;

  console.log('[PDF] Getting chromium executable path...');
  const executablePath = await chromium.executablePath(CHROMIUM_URL);
  console.log('[PDF] Executable path:', executablePath);

  console.log('[PDF] Launching browser...');
  const browser = await puppeteer.launch({
    args:            chromium.args,
    defaultViewport: { width: 1200, height: 900 },
    executablePath,
    headless:        true,
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await browser.newPage();
    console.log('[PDF] Browser launched, setting content...');

    // Set content — use load instead of networkidle0 to avoid font timeout
    await page.setContent(html, { waitUntil: 'load', timeout: 25000 });
    // Wait a moment for fonts to render
    await new Promise(r => setTimeout(r, 2000));
    console.log('[PDF] Content loaded, generating PDF...');

    // Inject PDF-specific CSS: keep dark background, add footer, page breaks
    await page.addStyleTag({ content: `
      @page {
        size: A4 portrait;
        margin: 18mm 14mm 22mm 14mm;
      }
      @media print {
        /* Override any light-mode print CSS — keep dark theme */
        body { background: #0e0c1e !important; color: #f2ede2 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .header, .hero, .card, .pull, .orbit, .mantra-box, .circle-card { background: #15132a !important; border-color: #2d2952 !important; }
        .footer { border-color: #2d2952 !important; }
        .section { page-break-inside: avoid; }
      }
    `});

    const pdf = await page.pdf({
      format:          'A4',
      printBackground: true,   // critical — renders background colors
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#857da0;font-family:'Inter',sans-serif;
                    padding:0 14mm;display:flex;justify-content:space-between;align-items:center;">
          <span>Ikigai Journey · Purposely Learning</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '15mm', right: '0', bottom: '12mm', left: '0' },
    });

    console.log('[PDF] PDF generated, size:', pdf.length, 'bytes');
    return Buffer.from(pdf);

  } finally {
    await browser.close();
    console.log('[PDF] Browser closed');
  }
};

// ── HTML report generator ────────────────────────────────────────────────────
function generateReportHTML(data, email) {
  const sec  = (title, accent, content) => `
    <div class="section">
      <div style="border-left:4px solid ${accent};padding-left:14px;margin-bottom:18px;">
        <span style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${accent};font-family:'Inter',sans-serif;font-weight:700;">${title}</span>
      </div>
      ${content}
    </div>`;

  const card = (content, accent='#2d2952') =>
    `<div class="card" style="border:1px solid ${accent};">${content}</div>`;

  const lbl  = (text, color='#857da0') =>
    `<span class="label" style="color:${color};">${text}</span>`;

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
  body{background:#0e0c1e;color:#f2ede2;font-family:'Inter',system-ui,sans-serif;line-height:1.65;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .wrap{max-width:760px;margin:0 auto;padding:40px 24px;}
  .section{margin-bottom:48px;page-break-inside:avoid;}
  .card{background:#15132a;border-radius:12px;padding:20px 24px;margin-bottom:10px;}
  .label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:700;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
  .pull-quote{padding:18px 22px;border-left:4px solid #f0a732;background:#15132a;border-radius:0 10px 10px 0;margin-bottom:10px;}
  .orbit-row{display:flex;gap:14px;align-items:flex-start;background:#15132a;border:1px solid #2d2952;border-radius:10px;padding:12px 18px;margin-bottom:8px;}
  .header{background:#15132a;border-bottom:1px solid #2d2952;padding:14px 28px;display:flex;align-items:center;gap:10px;}
  .header-logo{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;color:#f0a732;}
  .hero{text-align:center;padding:44px 32px;background:#15132a;border-radius:20px;border:1px solid #2d2952;margin-bottom:52px;}
  .hero-q{font-size:clamp(16px,3vw,22px);font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:#f0a732;line-height:1.55;}
  .mantra-box{background:#15132a;border-radius:14px;padding:30px 32px;text-align:center;border:1px solid #f0a73218;}
  .circle-card{background:#15132a;border-radius:10px;padding:18px;}
  .footer{text-align:center;padding:48px 0 28px;border-top:1px solid #2d2952;}
  .footer p{font-size:14px;color:#857da0;font-style:italic;font-family:'Cormorant Garamond',Georgia,serif;}
  @media(max-width:700px){.grid2,.grid3{grid-template-columns:1fr!important;}.wrap{padding:28px 16px;}.hero{padding:30px 20px;}}
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
  <span style="margin-left:auto;font-size:11px;color:#857da0;">Personal Report${email ? ' · ' + safe(email) : ''}</span>
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
    <p style="font-size:10px;letter-spacing:3px;color:#857da0;text-transform:uppercase;margin-bottom:16px;">Your Purpose</p>
    <blockquote class="hero-q">"${safe(data.ikigai_sentence)}"</blockquote>
  </div>

  ${sec('A Letter to You','#9d91d4',card(`
    <p style="font-size:15px;line-height:1.88;margin-bottom:14px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p1)}</p>
    <p style="font-size:15px;line-height:1.88;margin-bottom:18px;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_p2)}</p>
    <p style="font-size:15px;font-style:italic;color:#9d91d4;border-top:1px solid #2d2952;padding-top:16px;font-family:'Cormorant Garamond',Georgia,serif;">${safe(data.letter_question)}</p>
  `,'#9d91d4'))}

  ${sec('Your Archetype','#f0a732',card(`
    <div class="grid2">
      <div>
        <h3 style="color:#f0a732;font-size:22px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;margin-bottom:5px;">${safe(data.archetype_name)}</h3>
        <p style="color:#857da0;font-size:13px;margin-bottom:18px;font-style:italic;">${safe(data.archetype_tagline)}</p>
        ${lbl('Superpower','#6aaa92')}<p style="font-size:13px;color:#6aaa92;margin-bottom:14px;">${safe(data.archetype_superpower)}</p>
        ${lbl('Kryptonite','#d96b55')}<p style="font-size:13px;color:#d96b55;">${safe(data.archetype_kryptonite)}</p>
      </div>
      <div>
        ${lbl('Famous Examples')}
        ${(data.archetype_examples||[]).map(ex=>`<div style="background:#1d1b38;border-radius:8px;padding:8px 12px;margin-bottom:7px;font-size:13px;color:#f2ede2;">✦ ${safe(ex)}</div>`).join('')}
      </div>
    </div>
  `,'#f0a732'))}

  ${sec('The Four Circles','#857da0',`
    <div class="grid2">
      ${[['#f0a732','What You Love',data.love_summary],['#9d91d4',"What You're Good At",data.goodat_summary],['#d96b55','What the World Needs',data.worldneeds_summary],['#6aaa92','What You Can Be Paid For',data.paidfor_summary]].map(([c,l,t])=>`
      <div class="circle-card" style="border:1px solid ${c}20;border-top:3px solid ${c};">
        ${lbl(l,c)}<p style="font-size:13px;line-height:1.72;color:#c0b8d4;">${safe(t)}</p>
      </div>`).join('')}
    </div>
  `)}

  ${sec('Your Niche','#6aaa92',card(`
    ${[['WHO you serve',data.niche_who],['PROBLEM you solve',data.niche_problem],['DIFFERENTIATOR',data.niche_differentiator]].map(([l,v],i)=>`
    <div style="${i<2?'border-bottom:1px solid #2d2952;padding-bottom:14px;margin-bottom:14px;':''}">
      ${lbl(l)}<p style="font-size:14px;color:#f2ede2;line-height:1.62;">${safe(v)}</p>
    </div>`).join('')}
    <div style="margin-top:18px;background:#1d1b38;border-radius:10px;padding:16px;border:1px solid #6aaa9225;">
      ${lbl('Your dinner-table line','#6aaa92')}
      <p style="font-size:16px;color:#f2ede2;font-style:italic;font-family:'Cormorant Garamond',Georgia,serif;">"${safe(data.niche_test_phrase)}"</p>
    </div>
  `,'#6aaa92'))}

  ${sec('The ONE Thing','#f0a732',card(`
    <p style="font-size:17px;font-family:'Cormorant Garamond',Georgia,serif;color:#f0a732;margin-bottom:10px;font-weight:700;">${safe(data.one_thing)}</p>
    <p style="font-size:13px;color:#c0b8d4;line-height:1.72;margin-bottom:18px;">${safe(data.one_thing_why)}</p>
    <div class="grid3">
      ${[['#f0a732','Today',data.action_today],['#9d91d4','This Week',data.action_week],['#6aaa92','This Month',data.action_month]].map(([c,l,v])=>`
      <div style="background:#1d1b38;border-radius:10px;padding:14px;border:1px solid ${c}20;">
        ${lbl(l,c)}<p style="font-size:12px;color:#f2ede2;line-height:1.55;">${safe(v)}</p>
      </div>`).join('')}
    </div>
  `,'#f0a732'))}

  ${sec('3 Monetization Paths','#6aaa92',[data.path1,data.path2,data.path3].filter(Boolean).map(p=>card(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
      <p style="color:#6aaa92;font-weight:700;font-size:15px;">${safe(p.name)}</p>
      <span style="background:#1d1b38;border-radius:20px;padding:3px 10px;font-size:12px;color:#6aaa92;border:1px solid #6aaa9230;">${safe(p.projection)}</span>
    </div>
    ${(p.actions||[]).map(a=>`<p style="font-size:13px;color:#c0b8d4;margin:4px 0;padding-left:14px;position:relative;"><span style="position:absolute;left:0;color:#6aaa92;">→</span>${safe(a)}</p>`).join('')}
  `,'#6aaa92')).join(''))}

  ${sec('Your Daily Mantra','#f0a732',`
    <div class="mantra-box">
      <svg viewBox="0 0 60 60" width="36" height="36" style="margin-bottom:16px;" aria-hidden="true">
        <ellipse cx="30" cy="18" rx="9" ry="15" fill="#f0a732" fill-opacity=".62"/>
        <ellipse cx="42" cy="30" rx="15" ry="9" fill="#d96b55" fill-opacity=".62"/>
        <ellipse cx="30" cy="42" rx="9" ry="15" fill="#6aaa92" fill-opacity=".62"/>
        <ellipse cx="18" cy="30" rx="15" ry="9" fill="#9d91d4" fill-opacity=".62"/>
        <circle cx="30" cy="30" r="5.5" fill="#f0a732"/>
      </svg>
      ${(data.mantra||[]).map((line,i)=>`<p style="font-size:${i===0?20:16}px;color:${i===0?'#f0a732':'#f2ede2'};font-family:'Cormorant Garamond',Georgia,serif;font-weight:${i===0?700:400};line-height:1.5;margin-bottom:8px;">${safe(line)}</p>`).join('')}
    </div>
  `)}

  ${sec('12 Months From Now','#9d91d4',card(`
    <p style="font-size:15px;line-height:1.88;color:#f2ede2;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;">${safe(data.vision_12mo)}</p>
  `,'#9d91d4'))}

  ${sec('The 5-Year Vision','#d96b55',card(`
    <p style="font-size:14px;line-height:1.8;color:#f2ede2;">${safe(data.vision_5yr)}</p>
  `,'#d96b55'))}

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
      <p style="font-size:13px;color:#c0b8d4;line-height:1.7;margin-bottom:18px;">Send us a message — your story might inspire others to discover their purpose too.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="https://www.facebook.com/profile.php?id=61592202830156" style="display:inline-flex;align-items:center;gap:8px;background:#1877f2;color:#fff;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;">📘 Message on Facebook</a>
        <a href="https://www.instagram.com/purposely.life/" style="display:inline-flex;align-items:center;gap:8px;background:#e1306c;color:#fff;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;">📷 Message on Instagram</a>
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
      if (!isDev) { const p = jwt.verify(token, process.env.JWT_SECRET); email = p.email || null; }
    } catch {}
  }

  const { reportData, userEmail } = req.body;
  const recipientEmail = email || userEmail || null;

  console.log('[send-report] recipient:', recipientEmail, '| RESEND set:', !!process.env.RESEND_API_KEY);
  if (!reportData) return res.status(400).json({ error: 'reportData required' });

  // Generate HTML
  const html = generateReportHTML(reportData, recipientEmail);

  // Generate PDF via headless Chrome
  let pdfBuffer = null;
  let pdfError  = null;
  try {
    console.log('[send-report] Generating PDF via puppeteer...');
    pdfBuffer = await generatePDF(html);
    console.log('[send-report] PDF generated:', pdfBuffer.length, 'bytes');
  } catch (err) {
    pdfError = err?.message;
    console.error('[send-report] PDF error:', err?.message);
  }

  let emailSent  = false;
  let emailError = null;

  if (recipientEmail && process.env.RESEND_API_KEY) {
    try {
      const attachments = [
        { filename: 'ikigai-purpose-report.html', content: Buffer.from(html).toString('base64'), type: 'text/html' },
        ...(pdfBuffer ? [{ filename: 'ikigai-purpose-report.pdf', content: pdfBuffer.toString('base64'), type: 'application/pdf' }] : []),
      ];

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from:        process.env.EMAIL_FROM || 'Ikigai Journey <reports@purposelylearning.com>',
          to:          recipientEmail,
          subject:     '🌸 Your Personal Purpose Report — Ikigai Journey',
          html:        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#c17f24;">🌸 Your Ikigai Report is Ready</h2>
            <p style="color:#444;line-height:1.6;">Your personal purpose report is attached in two formats:</p>
            <ul style="color:#444;line-height:2;">
              <li><strong>PDF</strong> — identical to your online report. Print, save, or share.</li>
              <li><strong>HTML</strong> — open in any browser for the full experience.</li>
            </ul>
            <p style="color:#666;font-style:italic;">"${(reportData.ikigai_sentence||'').slice(0,120)}..."</p>
          </div>`,
          attachments,
        }),
      });

      const emailData = await response.json();
      if (response.ok) {
        emailSent = true;
        console.log('[send-report] ✅ Email sent | id:', emailData.id, '| attachments:', attachments.length, '| pdf:', !!pdfBuffer);
      } else {
        emailError = emailData.message || 'Resend error';
        console.error('[send-report] Resend error:', emailData);
      }
    } catch (err) {
      emailError = err?.message;
      console.error('[send-report] Email failed:', err?.message);
    }
  } else {
    emailError = !recipientEmail ? 'No email address' : 'RESEND_API_KEY not set';
  }

  return res.status(200).json({ ok: true, emailSent, emailError, recipientEmail, html, hasPdf: !!pdfBuffer, pdfError });
}