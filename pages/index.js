// pages/index.js — Ikigai Journey (Production)
//
// ┌─────────────────────────────────────────────────────┐
// │  DEMO_MODE = true   → use at LOCALHOST for testing  │
// │  DEMO_MODE = false  → use on VERCEL (production)    │
// └─────────────────────────────────────────────────────┘
//
// With DEMO_MODE = true:
//   • Calls Anthropic API directly (no /api/chat proxy)
//   • Payment is skipped — goes straight to chat
//   • Whisper shows a "production only" message
//   • No localStorage token needed
//
// With DEMO_MODE = false:
//   • All API calls route through /api/* (keys never in browser)
//   • Payment goes through PayMongo → JWT token unlocks chat
//   • Whisper routes through /api/whisper
//   • Requires all .env.local keys to be set
//
import { useState, useRef, useEffect, useCallback } from "react";

// ── TOGGLE THIS LINE ──────────────────────────────────────────────────────────
const DEMO_MODE = false;  // true = local testing | false = production on Vercel
// ─────────────────────────────────────────────────────────────────────────────

// ── Color tokens — resolved from globals.css CSS variables ───────────────────
// (globals.css is loaded via pages/_app.js → no inline injection needed here)
const G = {
  bg:'var(--bg)',    surf:'var(--surf)',  surf2:'var(--surf2)', brd:'var(--brd)',
  gold:'var(--gold)', goldL:'var(--goldL)', coral:'var(--coral)',
  sage:'var(--sage)', lav:'var(--lav)',   cream:'var(--cream)',
  soft:'var(--soft)', muted:'var(--muted)', red:'var(--red)',
  serif:'var(--serif)', sans:'var(--sans)',
};

const SP = `You are an Ikigai Guide — warm, precise, editorial. Running a 16-question discovery journey for Filipinos seeking their reason for being.

ABSOLUTE RULES:
• Ask ONE question per message. Never two.
• After each answer: mirror in 2-3 sentences using their specific words → ask "Anything to add, or shall we move on?"
• After Q4, Q8, Q12: write a 2-3 paragraph SECTION SUMMARY using their exact language
• Never generalize — use their specific words verbatim where powerful
• Tone: warm, grounded, personal — like a trusted mentor
• 1-word answer → "Tell me more — what does [word] look like specifically?"
• "I don't know" → rephrase smaller

FLOW: Ask their first name. Then warmly introduce the journey — explain there are 4 sections, 16 questions, and they'll receive a 20-section personal report at the end. Let them know that each of your responses may take 30 seconds to 1 minute as you carefully reflect on their answers — this is intentional, not a glitch. Emphasize that the quality of their report depends entirely on the depth of their answers — encourage them to answer from the heart, not what sounds good. Specific, honest answers produce a powerful report. Vague answers produce a generic one. Then begin Q1.

SECTION 1 — WHAT YOU LOVE (Q1–Q4):
Q1: What did you do as a kid for hours without anyone paying you? Be specific.
Q2: What activity makes time completely disappear when you're doing it?
Q3: If money stopped being a concern tomorrow, what would you actually do with your weeks?
Q4: Name 3 topics you could talk about for an hour straight — no prep needed.
[After Q4: SECTION 1 SUMMARY — 2-3 paragraphs pulling their exact phrases]

SECTION 2 — WHAT YOU'RE GOOD AT (Q5–Q8):
Q5: What do people compliment you on — repeatedly, without you asking?
Q6: What do friends, family, or colleagues come to you for help with?
Q7: What's a skill you have that most people find genuinely difficult?
Q8: What's your unfair advantage — natural to you but hard for most?
[After Q8: SECTION 2 SUMMARY]

SECTION 3 — WHAT THE WORLD NEEDS (Q9–Q12):
Q9: What problem do you see — in work, community, or life — that makes you genuinely angry?
Q10: Who do you see struggling with a problem that has no good solution yet?
Q11: What's broken in your world that nobody seems to be fixing?
Q12: Where do you see the biggest opportunity in the Philippines or your world in the next 3 years?
[After Q12: SECTION 3 SUMMARY]

SECTION 4 — WHAT YOU CAN BE PAID FOR (Q13–Q16):
Q13: What are people already paying for in your area of expertise or interest?
Q14: How does money currently come into your life?
Q15: What adjacent skills or knowledge could you package — things you know but haven't offered yet?
Q16: What's a price point you've always thought might be too high — but have never actually tested?
[After Q16: SECTION 4 SUMMARY → say: "The petals are aligned. Generating your Ikigai report now..."]

THEN OUTPUT EXACTLY — no text after IKIGAI_REPORT_END:
IKIGAI_REPORT_START
{
  "ikigai_sentence":"I [verb] [for whom] so they [outcome] in a way that [unique style]",
  "letter_p1":"Paragraph 1 — who they are. USE THEIR SPECIFIC WORDS.",
  "letter_p2":"Paragraph 2 — pattern noticed. Reference their verbatim phrases.",
  "letter_question":"One pointed personal question to sit with.",
  "archetype_name":"The [Specific Memorable Name — not generic]",
  "archetype_tagline":"One sentence capturing the archetype",
  "archetype_examples":["Name 1","Name 2","Name 3"],
  "archetype_superpower":"What this archetype does best",
  "archetype_kryptonite":"Where this archetype self-destructs",
  "love_summary":"3-4 sentences on Section 1 using their language",
  "goodat_summary":"3-4 sentences on Section 2",
  "worldneeds_summary":"3-4 sentences on Section 3",
  "paidfor_summary":"3-4 sentences on Section 4",
  "niche_who":"Specific who they serve",
  "niche_problem":"The exact pain they solve",
  "niche_differentiator":"Why only they can solve it this way",
  "niche_test_phrase":"One dinner-table line that makes someone say 'tell me more'",
  "one_thing":"Single highest-leverage action for the next 90 days",
  "one_thing_why":"Why this move using their specific data",
  "action_today":"Smallest concrete step today",
  "action_week":"Meaningful first move this week",
  "action_month":"Proof-of-concept outcome this month",
  "marketing_shift":"What stops and what starts in how they show up",
  "sales_shift":"Who to pitch and who to refuse",
  "offer_shift":"What to package and price up",
  "say_no_to":["item 1","item 2","item 3","item 4","item 5"],
  "pillar1":{"name":"Pillar Name","posts":["Post title 1","Post title 2","Post title 3"]},
  "pillar2":{"name":"Pillar Name","posts":["Post title 1","Post title 2","Post title 3"]},
  "pillar3":{"name":"Pillar Name","posts":["Post title 1","Post title 2","Post title 3"]},
  "path1":{"name":"Highest Probability","projection":"P XX,XXX/month est.","actions":["a1","a2","a3"]},
  "path2":{"name":"Highest Ceiling","projection":"P XX,XXX/month est.","actions":["a1","a2","a3"]},
  "path3":{"name":"Most Aligned","projection":"P XX,XXX/month est.","actions":["a1","a2","a3"]},

  "orbit_mentor":"2 sentences on who to learn from",
  "orbit_peer":"2 sentences on who walks beside them",
  "orbit_hire":"2 sentences on first hire archetype",
  "orbit_partner":"2 sentences on who complements their gaps",
  "orbit_audience":"2 sentences on who they serve",
  "energy_feeds":["condition 1","condition 2","condition 3"],
  "energy_drains":["pattern 1","pattern 2","pattern 3"],
  "stop_doing":["item 1","item 2","item 3","item 4","item 5"],
  "vision_12mo":"Concrete sensory Monday morning 12 months from now.",
  "vision_5yr":"Where 5 years of this Ikigai leads.",
  "pull_quote1":"Verbatim from their answers",
  "pull_quote2":"Verbatim from their answers",
  "pull_quote3":"Verbatim from their answers",
  "mantra":["Line 1","Line 2","Line 3"],
  "books":[
    {"title":"Book Title","author":"Author Name","why":"Why specific to them"},
    {"title":"Book Title","author":"Author Name","why":"Why specific to them"},
    {"title":"Book Title","author":"Author Name","why":"Why specific to them"}
  ],
  "podcasts":[
    {"name":"Podcast Name","host":"Host Name","why":"Why specific to them"},
    {"name":"Podcast Name","host":"Host Name","why":"Why specific to them"},
    {"name":"Podcast Name","host":"Host Name","why":"Why specific to them"}
  ],
  "next_today":"Concrete action today",
  "next_week":"Action this week",
  "next_month":"Action this month"
}
IKIGAI_REPORT_END`;


// ── CSS Injection ─────────────────────────────────────────────────────────────
// Injects CSS variables and animation classes into the document.
// globals.css (loaded via _app.js) also defines these — this is a safety net.
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');

:root {
  --bg:#0e0c1e; --surf:#15132a; --surf2:#1d1b38; --brd:#2d2952;
  --gold:#f0a732; --goldL:#f5c468; --coral:#d96b55;
  --sage:#6aaa92; --lav:#9d91d4; --cream:#f2ede2;
  --soft:#c0b8d4; --muted:#857da0; --red:#e05050;
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Inter',system-ui,sans-serif;
}
@keyframes petalBreathe{0%,100%{transform:scale(1);opacity:.88}50%{transform:scale(1.05);opacity:1}}
@keyframes petalSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes recordPulse{0%,100%{box-shadow:0 0 0 0 rgba(224,80,80,.5)}50%{box-shadow:0 0 0 8px rgba(224,80,80,0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.petal-breathe{animation:petalBreathe 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.petal-spin-slow{animation:petalSpin 40s linear infinite;transform-box:fill-box;transform-origin:center}
.recording-pulse{animation:recordPulse 1.2s ease-in-out infinite}
.fade-up{animation:fadeUp .35s ease-out forwards}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--surf)}
::-webkit-scrollbar-thumb{background:var(--brd);border-radius:2px}
::selection{background:var(--gold);color:var(--bg)}
textarea:focus{border-color:var(--gold)!important;outline:none;box-shadow:0 0 0 2px rgba(240,167,50,.15)!important}
.print-only{display:none}
.print-watermark{display:none}
@media print{
  :root{--bg:#fff;--surf:#f6f5fa;--surf2:#edeaf5;--brd:#ccc8e0;--gold:#8a5c08;--goldL:#a87010;--coral:#a83520;--sage:#27705a;--lav:#4030a0;--cream:#18162e;--soft:#38344e;--muted:#5e587a}
  @page{size:A4 portrait;margin:20mm 18mm}
  *,*::before,*::after{animation:none!important;transition:none!important;box-shadow:none!important;position:static!important}
  body{background:#fff!important;font-size:10.5pt;line-height:1.65}
  [data-no-print="true"]{display:none!important}
  .print-only{display:block!important}
  .print-watermark{display:block!important;text-align:center;margin-top:2rem;padding-top:1rem;border-top:.5px solid var(--brd);font-size:8pt;color:var(--muted);font-style:italic}
  .report-section{page-break-inside:avoid;break-inside:avoid;margin-bottom:1.4rem}
  .report-section--page-break{page-break-before:always;break-before:always;padding-top:1rem}
  h1,h2,h3,h4{page-break-after:avoid;break-after:avoid}
  .print-stack{display:block!important}
  .print-stack>*{display:block!important;width:100%!important;margin-bottom:.75rem!important}
}
`;

// ── Token helpers (localStorage) ───────────────────────────────────────────
// getToken / saveToken / clearToken only matter when DEMO_MODE = false.
const TOKEN_KEY  = 'ikigai_access_token';
const getToken   = () => { try { return localStorage.getItem(TOKEN_KEY); }  catch { return null; } };
const saveToken  = (t) => { try { localStorage.setItem(TOKEN_KEY, t); }     catch { } };
const clearToken = ()  => { try { localStorage.removeItem(TOKEN_KEY); }     catch { } };

// ── Conversation persistence (localStorage survives tab close) ────────────────
const CHAT_KEY  = 'ikigai_chat_messages';
const COUNT_KEY = 'ikigai_chat_count';

const saveChat = (msgs, count) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CHAT_KEY,  JSON.stringify(msgs));
    localStorage.setItem(COUNT_KEY, String(count));
  } catch {}
};

const loadChat = () => {
  try {
    if (typeof window === 'undefined') return null;
    const msgs  = localStorage.getItem(CHAT_KEY);
    const count = localStorage.getItem(COUNT_KEY);
    return msgs ? { messages: JSON.parse(msgs), answerCount: parseInt(count || '0') } : null;
  } catch { return null; }
};

const clearChat = () => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CHAT_KEY);
    localStorage.removeItem(COUNT_KEY);
  } catch {}
};

// ── API helpers ───────────────────────────────────────────────────────────────

// Chat: streams from /api/chat via Server-Sent Events.
// Streaming keeps the connection alive — no Vercel 60s timeout.
// onChunk(partialText) is called as each piece arrives for real-time display.
const apiChat = async (messages, token, max_tokens = 1000, system, onChunk) => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, system, max_tokens }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'API call failed. Check your .env.local keys.');
  }

  // Read the SSE stream
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';
  let fullText  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) throw new Error(data.error);
        if (data.chunk) {
          fullText += data.chunk;
          if (onChunk) onChunk(fullText);
        }
        if (data.done) return data.text || fullText;
      } catch (e) {
        if (e.message && !e.message.includes('JSON')) throw e;
      }
    }
  }

  return fullText;
};

// Whisper: only available in production
const apiWhisper = async (blob, language, token) => {
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const res = await fetch('/api/whisper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || 'audio/webm', language }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Transcription failed');
  return d.text || '';
};

// Payment: create PayMongo checkout session
const apiCreateCheckout = async () => {
  const res = await fetch('/api/payment/create-checkout', { method: 'POST' });
  const d   = await res.json();
  if (!res.ok) throw new Error(d.error || 'Could not create checkout');
  return d; // { checkoutUrl, sessionId }
};

// Payment: verify session → receive JWT
const apiVerifyPayment = async (sessionId) => {
  const res = await fetch('/api/payment/verify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ sessionId }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || d.error || 'Payment not confirmed');
  return d; // { token, verified }
};

// Send report via email + return HTML for download
const apiSendReport = async (reportData, token, emailOverride) => {
  try {
    const res = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ reportData, userEmail: emailOverride }),
    });
    return await res.json();
  } catch (err) { return { ok: false, emailError: err?.message }; }
};

const PetalMark = ({ size = 36, animated = false }) => (
  <svg viewBox="0 0 60 60" width={size} height={size}
    className={animated ? 'petal-breathe' : ''} aria-hidden="true"
    style={{ display:'block', flexShrink:0 }}>
    <ellipse cx="30" cy="18" rx="9"  ry="15" fill="var(--gold)"  fillOpacity=".62" />
    <ellipse cx="42" cy="30" rx="15" ry="9"  fill="var(--coral)" fillOpacity=".62" />
    <ellipse cx="30" cy="42" rx="9"  ry="15" fill="var(--sage)"  fillOpacity=".62" />
    <ellipse cx="18" cy="30" rx="15" ry="9"  fill="var(--lav)"   fillOpacity=".62" />
    <circle  cx="30" cy="30" r="5.5" fill="var(--gold)" />
    <circle  cx="30" cy="30" r="2"   fill="var(--bg)" fillOpacity=".45" />
  </svg>
);

// Large landing diagram with animated Petal Mark at center + rotating ring
const IkigaiDiagram = () => (
  <svg viewBox="-40 -10 480 390" width="100%" style={{ maxWidth:480, display:'block', margin:'0 auto' }}>
    <g className="petal-spin-slow" style={{ transformOrigin:'180px 170px' }}>
      <circle cx="180" cy="170" r="168" fill="none" stroke="var(--gold)" strokeWidth=".6" strokeOpacity=".18" strokeDasharray="4 9"/>
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const r=deg*Math.PI/180, x=180+158*Math.sin(r), y=170-158*Math.cos(r);
        return <circle key={i} cx={x} cy={y} r="2" fill="var(--gold)" fillOpacity=".28"/>;
      })}
    </g>
    <circle cx="180" cy="118" r="105" fill="var(--gold)"  fillOpacity=".08" stroke="var(--gold)"  strokeWidth="1.5" strokeOpacity=".35"/>
    <circle cx="118" cy="214" r="105" fill="var(--lav)"   fillOpacity=".08" stroke="var(--lav)"   strokeWidth="1.5" strokeOpacity=".35"/>
    <circle cx="242" cy="214" r="105" fill="var(--coral)" fillOpacity=".08" stroke="var(--coral)" strokeWidth="1.5" strokeOpacity=".35"/>
    <circle cx="180" cy="258" r="78" fill="var(--sage)"  fillOpacity=".06" stroke="var(--sage)"  strokeWidth="1.2" strokeOpacity=".28"/>
    <g className="petal-breathe" style={{ transformOrigin:'180px 182px' }}>
      <ellipse cx="180" cy="164" rx="14" ry="22" fill="var(--gold)"  fillOpacity=".7"/>
      <ellipse cx="198" cy="182" rx="22" ry="14" fill="var(--coral)" fillOpacity=".7"/>
      <ellipse cx="180" cy="200" rx="14" ry="22" fill="var(--sage)"  fillOpacity=".7"/>
      <ellipse cx="162" cy="182" rx="22" ry="14" fill="var(--lav)"   fillOpacity=".7"/>
      <circle  cx="180" cy="182" r="9"   fill="var(--gold)"/>
      <circle  cx="180" cy="182" r="3.5" fill="var(--bg)" fillOpacity=".45"/>
    </g>
    <text x="180" y="20"  textAnchor="middle" fill="var(--gold)"  fontSize="19" fontFamily="var(--serif)" fontWeight="700">What You Love</text>
    <text x="50"  y="228" textAnchor="middle" fill="var(--lav)"   fontSize="16" fontFamily="var(--serif)" fontWeight="700">What You're</text>
    <text x="50"  y="248" textAnchor="middle" fill="var(--lav)"   fontSize="16" fontFamily="var(--serif)" fontWeight="700">Good At</text>
    <text x="310" y="228" textAnchor="middle" fill="var(--coral)" fontSize="16" fontFamily="var(--serif)" fontWeight="700">What the</text>
    <text x="310" y="248" textAnchor="middle" fill="var(--coral)" fontSize="16" fontFamily="var(--serif)" fontWeight="700">World Needs</text>
    <text x="180" y="334" textAnchor="middle" fill="var(--sage)"  fontSize="17" fontFamily="var(--serif)" fontWeight="700">What You Can Be Paid For</text>
  </svg>
);

// ── Message renderer ──────────────────────────────────────────────────────────
const Msg = ({ text, isUser }) => {
  if (isUser) return <p style={{ margin:0, fontSize:14, lineHeight:1.65, color:G.bg, fontFamily:G.sans }}>{text}</p>;
  return (
    <div style={{ fontSize:14, lineHeight:1.75, color:G.cream, fontFamily:G.sans }}>
      {text.split('\n').map((line,i) => {
        if (!line.trim()) return <div key={i} style={{ height:5 }}/>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rich  = parts.map((p,j) =>
          p.startsWith('**')&&p.endsWith('**')
            ? <strong key={j} style={{ color:G.gold, fontWeight:600 }}>{p.slice(2,-2)}</strong> : p);
        const isBullet = /^[•\-\*] /.test(line);
        return <p key={i} style={{ margin:'3px 0', paddingLeft:isBullet?10:0, color:isBullet?G.soft:G.cream }}>{rich}</p>;
      })}
    </div>
  );
};

const Dots = () => (
  <svg viewBox="0 0 60 60" width="32" height="32" className="petal-spin-slow" aria-label="Thinking..." style={{ display:'block' }}>
    <ellipse cx="30" cy="18" rx="9"  ry="15" fill="var(--gold)"  fillOpacity=".65"/>
    <ellipse cx="42" cy="30" rx="15" ry="9"  fill="var(--coral)" fillOpacity=".65"/>
    <ellipse cx="30" cy="42" rx="9"  ry="15" fill="var(--sage)"  fillOpacity=".65"/>
    <ellipse cx="18" cy="30" rx="15" ry="9"  fill="var(--lav)"   fillOpacity=".65"/>
    <circle  cx="30" cy="30" r="5.5" fill="var(--gold)"/>
    <circle  cx="30" cy="30" r="2"   fill="var(--bg)" fillOpacity=".45"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
//  LANDING VIEW
// ─────────────────────────────────────────────────────────────────────────────
const ResumeModal = ({ answerCount, onResume, onRestart }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(14,12,30,0.85)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}>
    <div style={{ background:G.surf, border:`2px solid ${G.gold}`, borderRadius:20, padding:'36px 32px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}><PetalMark size={52} animated/></div>
      <h3 style={{ color:G.gold, fontSize:20, fontFamily:G.serif, fontWeight:700, marginBottom:10 }}>You have an unfinished session</h3>
      <p style={{ color:G.soft, fontSize:14, fontFamily:G.sans, lineHeight:1.7, marginBottom:6 }}>
        You answered <strong style={{color:G.cream}}>{answerCount} of 16 questions</strong>.
      </p>
      <p style={{ color:G.muted, fontSize:13, fontFamily:G.sans, lineHeight:1.6, marginBottom:28 }}>
        Pick up right where you left off — your answers are all saved.
      </p>
      <button onClick={onResume} style={{ width:'100%', background:G.gold, border:'none', borderRadius:10, padding:'14px 24px', color:G.bg, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:G.sans, marginBottom:10 }}>
        Resume My Journey →
      </button>
      <button onClick={onRestart} style={{ width:'100%', background:'transparent', border:`1px solid ${G.brd}`, borderRadius:10, padding:'11px 24px', color:G.muted, fontSize:13, cursor:'pointer', fontFamily:G.sans }}>
        Start Fresh Instead
      </button>
    </div>
  </div>
);

const Landing = ({ onStart, isVerifying = false }) => (
  <div style={{ background:G.bg, minHeight:'100vh', fontFamily:G.serif, color:G.cream, overflowX:'hidden' }}>
    {/* Header */}
    <div style={{ borderBottom:`1px solid ${G.brd}`, padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <PetalMark size={28}/>
        <span style={{ color:G.gold, fontSize:16, fontWeight:700, letterSpacing:'.3px' }}>Ikigai Journey</span>
      </div>
      <span style={{ fontSize:11, color:G.muted, fontFamily:G.sans, letterSpacing:'1px', textTransform:'uppercase' }}>Filipino Edition</span>
    </div>

    {isVerifying && (
      <div style={{ background:G.surf, borderBottom:`1px solid ${G.brd}`, padding:'10px 28px', textAlign:'center' }}>
        <span style={{ fontSize:13, color:G.gold, fontFamily:G.sans }}>⌛ Verifying your payment...</span>
      </div>
    )}

    {/* Hero */}
    <div className="ikigai-hero-grid" style={{ maxWidth:920, margin:'0 auto', padding:'56px 28px 32px', display:'grid', gridTemplateColumns:'1fr auto', gap:56, alignItems:'center' }}>
      <div className="ikigai-hero-text">
        <p style={{ fontSize:10, letterSpacing:'3.5px', color:G.gold, textTransform:'uppercase', marginBottom:14, fontFamily:G.sans }}>Your Reason for Being</p>
        <h1 style={{ fontSize:'clamp(32px,5vw,50px)', lineHeight:1.12, marginBottom:20, fontWeight:700 }}>
          Discover Your<br/><em style={{ color:G.gold }}>Purpose</em>
        </h1>
        <p style={{ fontSize:16, lineHeight:1.85, color:G.soft, marginBottom:32, fontFamily:G.sans, fontWeight:300, maxWidth:420 }}>
          A guided 16-question journey uncovering what you love, what you're good at, what the world needs, and what you can be paid for — completed in just 15 to 20 minutes.
        </p>
      </div>
      <div className="ikigai-hero-diagram" style={{ flexShrink:0, width:420 }}><IkigaiDiagram/></div>
    </div>

    {/* Features */}
    <div style={{ maxWidth:920, margin:'0 auto', padding:'8px 28px 44px' }}>
      <p style={{ fontSize:10, letterSpacing:'3px', color:G.muted, textTransform:'uppercase', marginBottom:22, fontFamily:G.sans, textAlign:'center' }}>What's in your 20-section report</p>
      <div className="ikigai-feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:10 }}>
        {[
          ['Your Ikigai Sentence','Your purpose distilled to one definitive line'],
          ['Your Archetype','The specific identity type you embody'],
          ['Your Niche','Who you serve and how to say it at a dinner'],
          ['The ONE Thing','Your highest-leverage 90-day focus'],
          ['3 Content Pillars','What to own and post publicly'],
          ['3 Monetization Paths','With ₱ projections for the Philippines'],
          ['12-Month Vision','A concrete sensory picture of your future'],
          ['A Personal Letter','Written directly to you by your guide'],
        ].map(([t,d],i)=>(
          <div key={i} style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:10, padding:'18px 20px' }}>
            <div style={{ marginBottom:10 }}><PetalMark size={18}/></div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:5, fontFamily:G.sans, color:G.cream }}>{t}</div>
            <div style={{ fontSize:11, color:G.muted, fontFamily:G.sans, lineHeight:1.55 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom CTA */}
    <div style={{ textAlign:'center', padding:'48px 28px', borderTop:`1px solid ${G.brd}` }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><PetalMark size={48} animated/></div>
      <div style={{ marginBottom:8 }}>
        <span style={{ fontSize:18, color:G.muted, fontFamily:G.serif, textDecoration:'line-through', marginRight:10 }}>₱600</span>
        <span style={{ fontSize:34, fontWeight:700, color:G.gold }}>₱399</span>
      </div>
      <div style={{ display:'inline-block', background:'#2a1a08', border:`1px solid ${G.gold}50`, borderRadius:20, padding:'4px 14px', marginBottom:12 }}>
        <span style={{ fontSize:12, color:G.gold, fontFamily:G.sans, fontWeight:600, letterSpacing:'0.5px' }}>🔥 Limited Time Offer</span>
      </div>
      <p style={{ fontSize:13, color:G.muted, marginBottom:26, fontFamily:G.sans }}>One-time · Instant access · Full 20-section personal report</p>
      <button onClick={onStart} disabled={isVerifying} style={{ background:isVerifying?G.brd:G.gold, color:isVerifying?G.muted:G.bg, border:'none', borderRadius:9, padding:'16px 48px', fontSize:17, fontWeight:700, cursor:isVerifying?'not-allowed':'pointer', fontFamily:G.sans, letterSpacing:'0.2px' }}>
        {isVerifying ? 'Verifying...' : 'Begin Your Journey — ₱399'}
      </button>
      <p style={{ fontSize:11, color:G.muted, marginTop:14, fontFamily:G.sans }}>Secured by PayMongo · GCash · Maya · Credit/Debit Card</p>
      <p style={{ fontSize:11, color:G.muted, marginTop:6, fontFamily:G.sans }}>⏱ Takes 15–20 minutes · Answer 16 guided questions · Receive your 20-section report</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENT VIEW (simulated)
// ─────────────────────────────────────────────────────────────────────────────
const Payment = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail]     = useState('');
  const [emailErr, setEmailErr] = useState('');

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const pay = () => {
    if (!validateEmail(email)) {
      setEmailErr('Please enter a valid email address so we can send your report.');
      return;
    }
    setEmailErr('');
    // Save email to localStorage before redirecting
    localStorage.setItem('ikigai_user_email', email);
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(email); }, 1800);
  };
  return (
    <div style={{ background:G.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:G.sans }}>
      <div style={{ maxWidth:420, width:'100%' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:G.muted, cursor:'pointer', marginBottom:20, fontSize:13 }}>← Back</button>
        <div className="ikigai-payment-card" style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:16, padding:32 }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><PetalMark size={44} animated/></div>
            <h2 style={{ color:G.cream, fontSize:20, fontWeight:700, marginBottom:4, fontFamily:G.serif }}>Ikigai Journey</h2>
            <p style={{ color:G.muted, fontSize:12 }}>Discover Your Purpose — 20-Section Personal Report</p>
          </div>

          {/* Price */}
          <div style={{ background:G.surf2, borderRadius:10, padding:'14px 20px', textAlign:'center', marginBottom:20, border:`1px solid ${G.brd}` }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, justifyContent:'center' }}>
              <span style={{ fontSize:16, color:G.muted, fontFamily:G.serif, textDecoration:'line-through' }}>₱600</span>
              <span style={{ fontSize:32, fontWeight:700, color:G.gold, fontFamily:G.serif }}>₱399</span>
            </div>
            <div style={{ fontSize:11, color:G.muted, marginTop:4 }}>One-time · Instant access · No subscription</div>
          </div>

          {/* QR instruction */}
          <div style={{ background:G.surf2, border:`1px solid ${G.gold}25`, borderRadius:12, padding:'16px 18px', marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:600, color:G.cream, marginBottom:8, fontFamily:G.sans }}>📱 How to pay:</p>
            <ol style={{ paddingLeft:18, margin:0 }}>
              {[
                'Click the button below',
                'A QR code will appear on the next page',
                'Open GCash, Maya, BPI, BDO, or any banking app',
                'Tap Scan QR or Pay QR and scan the code',
                'Your journey unlocks automatically after payment',
              ].map((step, i) => (
                <li key={i} style={{ fontSize:12, color:G.soft, lineHeight:1.75, fontFamily:G.sans }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Supported apps */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20, justifyContent:'center' }}>
            {[
              { label:'GCash', color:'#0070f3' },
              { label:'Maya', color:'#00b4a0' },
              { label:'BPI', color:'#c0392b' },
              { label:'BDO', color:'#1a5276' },
              { label:'UnionBank', color:'#f39c12' },
              { label:'+ All InstaPay Banks', color:G.muted },
            ].map((app, i) => (
              <span key={i} style={{ fontSize:11, fontFamily:G.sans, color:G.cream, background:G.surf, border:`1px solid ${G.brd}`, borderRadius:20, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:app.color, display:'inline-block', flexShrink:0 }}/>
                {app.label}
              </span>
            ))}
          </div>

          {/* Email input */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, color:G.muted, fontFamily:G.sans, marginBottom:6, textTransform:'uppercase', letterSpacing:'1px' }}>
              Your Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
              placeholder="you@email.com"
              style={{ width:'100%', background:G.surf2, border:`1px solid ${emailErr ? G.coral : G.brd}`, borderRadius:10, padding:'12px 14px', color:G.cream, fontSize:14, fontFamily:G.sans, outline:'none', boxSizing:'border-box' }}
            />
            {emailErr && <p style={{ fontSize:11, color:G.coral, marginTop:5, fontFamily:G.sans }}>{emailErr}</p>}
            <p style={{ fontSize:11, color:G.muted, marginTop:5, fontFamily:G.sans }}>Your 20-section report will be sent here after the session.</p>
          </div>

          {/* CTA */}
          <button
            onClick={pay}
            disabled={loading}
            style={{ width:'100%', background:loading?G.brd:G.gold, color:loading?G.muted:G.bg, border:'none', borderRadius:10, padding:'15px', fontSize:16, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:G.sans, transition:'all .2s' }}
          >
            {loading ? '⌛ Preparing your QR code...' : 'Continue to Payment — ₱399'}
          </button>

          <p style={{ textAlign:'center', fontSize:11, color:G.muted, marginTop:10, lineHeight:1.6, fontFamily:G.sans }}>
            🔒 Secured by PayMongo · QR Ph / InstaPay<br/>
            Keep this page open — it redirects automatically after payment.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  CHAT VIEW
// ─────────────────────────────────────────────────────────────────────────────
// Animated progress bar for report generation overlay
const GenProgressBar = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(p => p < 88 ? +(p + 0.6).toFixed(1) : p), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:11, color:G.muted, fontFamily:G.sans }}>Generating your report...</span>
        <span style={{ fontSize:11, color:G.gold, fontFamily:G.sans }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height:4, background:G.surf2, borderRadius:2 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:G.gold, borderRadius:2, transition:'width .4s ease' }}/>
      </div>
    </div>
  );
};

const ChatView = ({ messages, input, setInput, onSend, isLoading, answerCount, endRef, isGenerating=false, generationMsg='', reportError=null, sectionsDone=0 }) => {
  const handleKey = e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); onSend(); } };

  // Progress: sectionsDone (detected from AI responses) is most accurate
  // Falls back to message count estimate if section markers not yet detected
  const progress = sectionsDone > 0
    ? Math.min(sectionsDone * 25, 95)
    : Math.min((Math.max(0, answerCount - 1) / 16) * 100, 95);

  // qNum for dot coloring — sectionsDone * 4 = questions confirmed complete
  const qNum = sectionsDone > 0
    ? sectionsDone * 4
    : Math.max(0, answerCount - 1);
  const sections = [
    { label:'What You Love',            range:[1,4],  color:G.gold  },
    { label:"What You're Good At",      range:[5,8],  color:G.lav   },
    { label:'What the World Needs',     range:[9,12], color:G.coral },
    { label:'What You Can Be Paid For', range:[13,16],color:G.sage  },
  ];

  return (
    <div className="ikigai-chat-shell" style={{ background:G.bg, height:'100vh', display:'flex', overflow:'hidden', fontFamily:G.sans }}>
      {/* Sidebar */}
      <div className="ikigai-chat-sidebar" style={{ width:214, borderRight:`1px solid ${G.brd}`, padding:'18px 16px', display:'flex', flexDirection:'column', flexShrink:0, background:G.surf }}>
        <div className="ikigai-chat-sidebar-brand" style={{ display:'flex', alignItems:'center', gap:9, marginBottom:26 }}>
          <PetalMark size={26}/>
          <span style={{ fontSize:13, fontWeight:700, color:G.gold, fontFamily:G.serif }}>Ikigai Journey</span>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:10, color:G.muted, textTransform:'uppercase', letterSpacing:'1px' }}>Progress</span>
            <span style={{ fontSize:10, color:G.gold }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height:3, background:G.surf2, borderRadius:2 }}>
            <div style={{ height:'100%', width:`${progress}%`, background:G.gold, borderRadius:2, transition:'width .5s ease' }}/>
          </div>
        </div>
        {sections.map((s,si)=>{
          const [start,end]=s.range;
          const isDone=qNum>=end, isActive=qNum>=start&&qNum<=end;
          return (
            <div key={si} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:isDone||isActive?s.color:G.brd, flexShrink:0 }}/>
                <div style={{ fontSize:11, color:isDone?s.color:isActive?G.cream:G.muted, fontWeight:isDone||isActive?600:400 }}>
                  {isDone?'✓ ':''}{s.label}
                </div>
              </div>
              <div style={{ display:'flex', gap:3, paddingLeft:12 }}>
                {[0,1,2,3].map(off=>(
                  <div key={off} style={{ flex:1, height:3, borderRadius:2, background:qNum>=start+off?s.color:G.surf2, transition:'background .3s' }}/>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop:'auto', fontSize:10, color:G.muted, lineHeight:1.65 }}>
          Answer from the heart — not what sounds good. The more specific and honest you are, the more powerful your report.
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', padding:'24px 26px', display:'flex', flexDirection:'column', gap:14 }}>
          {messages.filter(m=>!m.hidden).map((m,i)=>(
            <div key={i} className="fade-up" style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              {m.role==='assistant' && <div style={{ marginRight:10, marginTop:2, flexShrink:0 }}><PetalMark size={20}/></div>}
              <div className="ikigai-chat-bubble" style={{ maxWidth:'72%', background:m.role==='user'?G.gold:G.surf, borderRadius:m.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px', padding:'12px 16px', border:m.role==='assistant'?`1px solid ${G.brd}`:'none' }}>
                <Msg text={m.content} isUser={m.role==='user'}/>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display:'flex', justifyContent:'flex-start', alignItems:'center', gap:14 }}>
              <Dots/>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {isGenerating && (
          <div style={{ background:'#1a1000', borderTop:`2px solid ${G.gold}`, padding:'16px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <Dots/>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:G.gold, fontFamily:G.sans, margin:0 }}>🌸 Crafting your personal purpose report...</p>
                <p style={{ fontSize:11, color:G.muted, fontFamily:G.sans, marginTop:2 }}>{generationMsg || 'Takes 30–60 seconds. Do not close this tab — your results will also be sent to your email.'}</p>
              </div>
            </div>
            <GenProgressBar/>
          </div>
        )}
        {reportError && !isGenerating && (
          <div style={{ background:'#2a0a0a', borderTop:`2px solid ${G.coral}`, padding:'10px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <p style={{ fontSize:12, color:G.coral, fontFamily:G.sans, margin:0 }}>{reportError}</p>
            <button onClick={onSend} style={{ background:G.gold, color:G.bg, border:'none', borderRadius:8, padding:'6px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:G.sans, flexShrink:0 }}>Retry →</button>
          </div>
        )}
        {/* Input */}
        <div style={{ borderTop:`1px solid ${G.brd}`, padding:'14px 24px', background:G.surf }}>
          <div className="ikigai-chat-input-row" style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type your answer here..."
              rows={2}
              style={{ flex:1, background:G.surf2, border:`1px solid ${G.brd}`, borderRadius:10, padding:'10px 14px', color:G.cream, fontSize:14, resize:'none', fontFamily:G.sans, outline:'none', lineHeight:1.5 }}
            />
            <button onClick={onSend} disabled={isLoading||!input.trim()}
              style={{ background:isLoading||!input.trim()?G.brd:G.gold, color:isLoading||!input.trim()?G.muted:G.bg, border:'none', borderRadius:10, width:42, height:42, cursor:isLoading||!input.trim()?'not-allowed':'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:700 }}>↑</button>
          </div>
          <p style={{ fontSize:11, color:G.muted, marginTop:7 }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  REPORT VIEW
// ─────────────────────────────────────────────────────────────────────────────
const Report = ({ data, onRestart, emailSent = false, token = null }) => {
  if (!data) return (
    <div style={{ background:G.bg, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:G.cream, fontFamily:G.serif }}>
      <div style={{ textAlign:'center' }}>
        <PetalMark size={56} animated/>
        <p style={{ color:G.gold, fontSize:18, marginTop:20 }}>Generating your report...</p>
      </div>
    </div>
  );

  const Sec = ({ title, accent=G.gold, children, pageBreak=false }) => (
    <div className={`report-section${pageBreak?' report-section--page-break':''}`} style={{ marginBottom:44 }}>
      <div style={{ borderLeft:`3px solid ${accent}`, paddingLeft:16, marginBottom:18 }}>
        <h2 style={{ color:accent, fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase', fontFamily:G.sans, fontWeight:700, margin:0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );

  const Card = ({ children, accent=G.brd }) => (
    <div style={{ background:G.surf, border:`1px solid ${accent}`, borderRadius:12, padding:'18px 22px', marginBottom:10 }}>{children}</div>
  );

  const Lbl = ({ text, c=G.muted }) => (
    <span style={{ display:'block', fontSize:10, color:c, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:6, fontFamily:G.sans, fontWeight:700 }}>{text}</span>
  );

  return (
    <div style={{ background:G.bg, minHeight:'100vh', fontFamily:G.sans, color:G.cream }}>
      {/* Sticky header */}
      <div data-no-print="true" style={{ background:G.surf, borderBottom:`1px solid ${G.brd}`, padding:'13px 26px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <PetalMark size={24}/>
          <span style={{ color:G.gold, fontFamily:G.serif, fontSize:15, fontWeight:700 }}>Your Ikigai Report</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>window.print()} style={{ background:'transparent', border:`1px solid ${G.brd}`, borderRadius:8, padding:'6px 14px', color:G.muted, fontSize:12, cursor:'pointer', fontFamily:G.sans }}>Save as PDF</button>
          <button onClick={onRestart} style={{ background:'transparent', border:`1px solid ${G.brd}`, borderRadius:8, padding:'6px 14px', color:G.muted, fontSize:12, cursor:'pointer', fontFamily:G.sans }}>← New Journey</button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="print-only" style={{ textAlign:'center', marginBottom:'2rem', paddingBottom:'1rem', borderBottom:`1px solid ${G.brd}`, display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
        <PetalMark size={30}/>
        <div>
          <p style={{ fontFamily:G.serif, fontSize:'15pt', fontWeight:700, color:G.gold, margin:0 }}>Ikigai Journey</p>
          <p style={{ fontFamily:G.sans, fontSize:'9pt', color:G.muted, margin:0 }}>Personal Ikigai Report — Confidential</p>
        </div>
      </div>

      <div className="ikigai-report-wrap" style={{ maxWidth:760, margin:'0 auto', padding:'44px 26px' }}>

        {/* Hero */}
        <div className="report-section ikigai-report-hero" style={{ textAlign:'center', marginBottom:52, padding:'44px 32px', background:G.surf, borderRadius:20, border:`1px solid ${G.brd}` }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><PetalMark size={52} animated/></div>
          <p style={{ fontSize:10, letterSpacing:'3px', color:G.muted, textTransform:'uppercase', marginBottom:16 }}>Your Ikigai</p>
          <blockquote style={{ fontSize:'clamp(16px,3vw,22px)', fontFamily:G.serif, fontStyle:'italic', color:G.gold, lineHeight:1.55, margin:'0 auto', maxWidth:540 }}>
            "{data.ikigai_sentence}"
          </blockquote>
        </div>

        <Sec title="A Letter to You" accent={G.lav}>
          <Card accent={G.lav}>
            <p style={{ fontSize:15, lineHeight:1.88, marginBottom:14, color:G.cream, fontFamily:G.serif }}>{data.letter_p1}</p>
            <p style={{ fontSize:15, lineHeight:1.88, marginBottom:18, color:G.cream, fontFamily:G.serif }}>{data.letter_p2}</p>
            <p style={{ fontSize:15, fontStyle:'italic', color:G.lav, borderTop:`1px solid ${G.brd}`, paddingTop:16, fontFamily:G.serif, margin:0 }}>{data.letter_question}</p>
          </Card>
        </Sec>

        <Sec title="Your Archetype" pageBreak>
          <Card accent={G.gold}>
            <div className="print-stack ikigai-report-archetype-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <h3 style={{ color:G.gold, fontSize:22, fontFamily:G.serif, fontWeight:700, marginBottom:5 }}>{data.archetype_name}</h3>
                <p style={{ color:G.muted, fontSize:13, marginBottom:18, fontStyle:'italic' }}>{data.archetype_tagline}</p>
                <Lbl text="Superpower" c={G.sage}/><p style={{ fontSize:13, color:G.sage, marginBottom:14 }}>{data.archetype_superpower}</p>
                <Lbl text="Kryptonite" c={G.coral}/><p style={{ fontSize:13, color:G.coral, margin:0 }}>{data.archetype_kryptonite}</p>
              </div>
              <div>
                <Lbl text="Famous Examples"/>
                {(data.archetype_examples||[]).map((ex,i)=>(
                  <div key={i} style={{ background:G.surf2, borderRadius:8, padding:'8px 12px', marginBottom:7, fontSize:13, color:G.cream }}>✦ {ex}</div>
                ))}
              </div>
            </div>
          </Card>
        </Sec>

        <Sec title="The Four Circles" accent={G.muted}>
          <div className="print-stack ikigai-report-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[[G.gold,'What You Love',data.love_summary],[G.lav,"What You're Good At",data.goodat_summary],[G.coral,'What the World Needs',data.worldneeds_summary],[G.sage,'What You Can Be Paid For',data.paidfor_summary]].map(([c,l,t],i)=>(
              <div key={i} style={{ background:G.surf, border:`1px solid ${c}20`, borderRadius:10, padding:18, borderTop:`3px solid ${c}` }}>
                <Lbl text={l} c={c}/><p style={{ fontSize:13, lineHeight:1.72, color:G.soft, margin:0 }}>{t}</p>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="Your Niche" accent={G.sage}>
          <Card accent={G.sage}>
            {[['WHO you serve',data.niche_who],['PROBLEM you solve',data.niche_problem],['DIFFERENTIATOR',data.niche_differentiator]].map(([l,v],i)=>(
              <div key={i} style={{ borderBottom:i<2?`1px solid ${G.brd}`:'none', paddingBottom:i<2?14:0, marginBottom:i<2?14:0 }}>
                <Lbl text={l}/><p style={{ fontSize:14, color:G.cream, lineHeight:1.62, margin:0 }}>{v}</p>
              </div>
            ))}
            <div style={{ marginTop:18, background:G.surf2, borderRadius:10, padding:16, border:`1px solid ${G.sage}25` }}>
              <Lbl text="Your dinner-table line" c={G.sage}/>
              <p style={{ fontSize:16, color:G.cream, fontStyle:'italic', fontFamily:G.serif, margin:0 }}>"{data.niche_test_phrase}"</p>
            </div>
          </Card>
        </Sec>

        <Sec title="The ONE Thing" pageBreak>
          <Card accent={G.gold}>
            <p style={{ fontSize:17, fontFamily:G.serif, color:G.gold, marginBottom:10, fontWeight:700 }}>{data.one_thing}</p>
            <p style={{ fontSize:13, color:G.soft, lineHeight:1.72, marginBottom:18 }}>{data.one_thing_why}</p>
            <div className="print-stack ikigai-report-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[[G.gold,'Today',data.action_today],[G.lav,'This Week',data.action_week],[G.sage,'This Month',data.action_month]].map(([c,l,v],i)=>(
                <div key={i} style={{ background:G.surf2, borderRadius:10, padding:14, border:`1px solid ${c}20` }}>
                  <Lbl text={l} c={c}/><p style={{ fontSize:12, color:G.cream, lineHeight:1.55, margin:0 }}>{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </Sec>

        <Sec title="How This Changes Your Work" accent={G.lav}>
          <div className="print-stack ikigai-report-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Marketing Shift',data.marketing_shift,G.lav],['Sales Shift',data.sales_shift,G.lav],['Offer & Pricing Shift',data.offer_shift,G.lav]].map(([l,v,c],i)=>(
              <Card key={i} accent={c}><Lbl text={l} c={c}/><p style={{ fontSize:13, color:G.cream, lineHeight:1.62, margin:0 }}>{v}</p></Card>
            ))}
            <Card accent={G.coral}>
              <Lbl text="Say No To" c={G.coral}/>
              {(data.say_no_to||[]).map((item,i)=><p key={i} style={{ fontSize:12, color:G.coral, margin:'0 0 4px' }}>✕ {item}</p>)}
            </Card>
          </div>
        </Sec>

        <Sec title="Your 3 Content Pillars" accent={G.coral} pageBreak>
          <div className="print-stack ikigai-report-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[data.pillar1,data.pillar2,data.pillar3].filter(Boolean).map((p,i)=>(
              <Card key={i} accent={G.coral}>
                <Lbl text={p.name} c={G.coral}/>
                {(p.posts||[]).map((post,j)=><p key={j} style={{ fontSize:12, color:G.soft, margin:'0 0 6px', paddingLeft:10, borderLeft:`2px solid ${G.brd}` }}>"{post}"</p>)}
              </Card>
            ))}
          </div>
        </Sec>

        <Sec title="3 Monetization Paths" accent={G.sage}>
          {[data.path1,data.path2,data.path3].filter(Boolean).map((p,i)=>(
            <Card key={i} accent={G.sage}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <p style={{ color:G.sage, fontWeight:700, fontSize:15, margin:0 }}>{p.name}</p>
                <span style={{ background:G.surf2, borderRadius:20, padding:'3px 10px', fontSize:12, color:G.sage, border:`1px solid ${G.sage}30` }}>{p.projection}</span>
              </div>
              {(p.actions||[]).map((a,j)=><p key={j} style={{ fontSize:13, color:G.soft, margin:'4px 0', paddingLeft:14, position:'relative' }}><span style={{ position:'absolute', left:0, color:G.sage }}>→</span>{a}</p>)}
            </Card>
          ))}
        </Sec>


        <Sec title="Your 5-Person Orbit" accent={G.gold}>
          {[['The Mentor',data.orbit_mentor,G.gold],['The Peer',data.orbit_peer,G.lav],['The Hire',data.orbit_hire,G.sage],['The Partner',data.orbit_partner,G.coral],['The Audience',data.orbit_audience,G.soft]].map(([l,v,c],i)=>(
            <div key={i} style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:10, padding:'12px 18px', marginBottom:8, display:'flex', gap:14, alignItems:'flex-start' }}>
              <span style={{ fontSize:11, color:c, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', minWidth:90, marginTop:1 }}>{l}</span>
              <p style={{ fontSize:13, color:G.soft, lineHeight:1.62, margin:0 }}>{v}</p>
            </div>
          ))}
        </Sec>

        <Sec title="Your Energy Map" accent={G.sage}>
          <div className="print-stack ikigai-report-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Card accent={G.sage}><Lbl text="What feeds you" c={G.sage}/>{(data.energy_feeds||[]).map((f,i)=><p key={i} style={{ fontSize:13, color:G.sage, margin:'4px 0' }}>↑ {f}</p>)}</Card>
            <Card accent={G.coral}><Lbl text="What drains you" c={G.coral}/>{(data.energy_drains||[]).map((d,i)=><p key={i} style={{ fontSize:13, color:G.coral, margin:'4px 0' }}>↓ {d}</p>)}</Card>
          </div>
        </Sec>

        <Sec title="What to Stop Doing" accent={G.coral}>
          <Card accent={G.coral}>
            {(data.stop_doing||[]).map((item,i)=>(
              <div key={i} style={{ display:'flex', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                <span style={{ color:G.coral, flexShrink:0 }}>✕</span>
                <p style={{ fontSize:14, color:G.cream, margin:0, lineHeight:1.55 }}>{item}</p>
              </div>
            ))}
          </Card>
        </Sec>

        {[data.pull_quote1,data.pull_quote2,data.pull_quote3].filter(Boolean).length>0 && (
          <Sec title="Your Words, Highlighted" pageBreak>
            {[data.pull_quote1,data.pull_quote2,data.pull_quote3].filter(Boolean).map((q,i)=>(
              <div key={i} style={{ padding:'18px 22px', borderLeft:`4px solid ${G.gold}`, background:G.surf, borderRadius:'0 10px 10px 0', marginBottom:10 }}>
                <p style={{ fontSize:16, fontFamily:G.serif, fontStyle:'italic', color:G.gold, lineHeight:1.6, margin:0 }}>"{q}"</p>
              </div>
            ))}
          </Sec>
        )}

        <Sec title="12 Months From Now" accent={G.lav}>
          <Card accent={G.lav}><p style={{ fontSize:15, lineHeight:1.88, color:G.cream, fontFamily:G.serif, fontStyle:'italic', margin:0 }}>{data.vision_12mo}</p></Card>
        </Sec>

        <Sec title="The 5-Year Vision" accent={G.coral}>
          <Card accent={G.coral}><p style={{ fontSize:14, lineHeight:1.8, color:G.cream, margin:0 }}>{data.vision_5yr}</p></Card>
        </Sec>

        <Sec title="Your Daily Mantra" pageBreak>
          <div style={{ background:G.surf, borderRadius:14, padding:'32px', textAlign:'center', border:`1px solid ${G.gold}18` }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}><PetalMark size={36}/></div>
            {(data.mantra||[]).map((line,i)=>(
              <p key={i} style={{ fontSize:i===0?20:16, color:i===0?G.gold:G.cream, fontFamily:G.serif, fontWeight:i===0?700:400, lineHeight:1.5, margin:'0 0 8px' }}>{line}</p>
            ))}
          </div>
        </Sec>

        <Sec title="Curated for You" accent={G.muted}>
          <div className="print-stack ikigai-report-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Lbl text="Books"/>
              {(data.books||[]).map((b,i)=><Card key={i}><p style={{ fontSize:13, fontWeight:600, color:G.cream, marginBottom:2 }}>{b.title}</p><p style={{ fontSize:11, color:G.muted, marginBottom:6 }}>{b.author}</p><p style={{ fontSize:12, color:G.soft, lineHeight:1.55, margin:0 }}>{b.why}</p></Card>)}
            </div>
            <div>
              <Lbl text="Podcasts"/>
              {(data.podcasts||[]).map((p,i)=><Card key={i}><p style={{ fontSize:13, fontWeight:600, color:G.cream, marginBottom:2 }}>{p.name}</p><p style={{ fontSize:11, color:G.muted, marginBottom:6 }}>{p.host}</p><p style={{ fontSize:12, color:G.soft, lineHeight:1.55, margin:0 }}>{p.why}</p></Card>)}
            </div>
          </div>
        </Sec>

        <Sec title="Your Next Steps">
          <div className="print-stack ikigai-report-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[[G.gold,'Today',data.next_today],[G.lav,'This Week',data.next_week],[G.sage,'This Month',data.next_month]].map(([c,l,v],i)=>(
              <div key={i} style={{ background:G.surf, border:`1px solid ${c}22`, borderRadius:12, padding:20, borderTop:`3px solid ${c}` }}>
                <Lbl text={l} c={c}/><p style={{ fontSize:13, color:G.cream, lineHeight:1.62, margin:0 }}>{v}</p>
              </div>
            ))}
          </div>
        </Sec>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'52px 0 28px', borderTop:`1px solid ${G.brd}` }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><PetalMark size={40} animated/></div>
          <p style={{ fontSize:14, color:G.muted, fontStyle:'italic', fontFamily:G.serif, marginBottom:20 }}>Your purpose is your compass. When in doubt, return to this page.</p>

          {/* Social review request */}
          <div style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:14, padding:'24px 28px', marginBottom:24, textAlign:'center' }}>
            <p style={{ fontSize:15, fontWeight:600, color:G.cream, fontFamily:G.serif, marginBottom:8 }}>Enjoyed your journey? 🌸</p>
            <p style={{ fontSize:13, color:G.soft, fontFamily:G.sans, lineHeight:1.7, marginBottom:18 }}>
              We'd love to hear how this report impacted you. Send us a message or leave a review through our social media pages — your story might inspire others to discover their purpose too.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <a
                href="https://www.facebook.com/profile.php?id=61592202830156"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, background:'#1877f2', color:'#fff', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:600, textDecoration:'none', fontFamily:G.sans }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Message on Facebook
              </a>
              <a
                href="https://www.instagram.com/purposely.life/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color:'#fff', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:600, textDecoration:'none', fontFamily:G.sans }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Message on Instagram
              </a>
            </div>
          </div>
          {emailSent && (
            <div style={{ background:G.surf, border:`1px solid ${G.sage}`, borderRadius:10, padding:'10px 18px', marginBottom:16, fontSize:13, color:G.sage, fontFamily:G.sans }}>
              ✅ Your report was sent to your email — check your inbox
            </div>
          )}
          <div data-no-print="true" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>window.print()} style={{ background:G.gold, color:G.bg, border:'none', borderRadius:9, padding:'12px 30px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:G.sans }}>Save as PDF</button>
            <button onClick={()=>{
              if (!token) return;
              fetch('/api/send-report',{ method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({reportData:data}) })
                .then(r=>r.json()).then(d=>{ if(d.html){ const b=new Blob([d.html],{type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='ikigai-purpose-report.html'; a.click(); }});
            }} style={{ background:G.surf, color:G.cream, border:`1px solid ${G.brd}`, borderRadius:9, padding:'12px 22px', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:G.sans }}>
              ⬇ Download HTML
            </button>
          </div>
        </div>
        <div className="print-watermark">Ikigai Journey · Filipino Edition · Generated for personal use only</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

// ── Main App ─────────────────────────────────────────────────────────────────
// ── In-App Browser Detector + Block Screen ───────────────────────────────────
// Detects Facebook, Instagram, Messenger in-app browsers.
// Shows a full-screen prompt to open in the device's default browser instead.

const detectInAppBrowser = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|MessengerBrowser|Instagram|MESSENGER/i.test(ua);
};

const isAndroid = () => typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
const isIOS     = () => typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

const InAppBrowserBlock = () => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const openInChrome = () => {
    // Android intent to open in Chrome
    const intentUrl = 'intent://' + currentUrl.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
    window.location.href = intentUrl;
    // Fallback after 1s if intent fails
    setTimeout(() => {
      window.location.href = currentUrl;
    }, 1000);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:G.bg, zIndex:99999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, fontFamily:G.sans, textAlign:'center' }}>
      <PetalMark size={56} animated/>

      <h2 style={{ color:G.gold, fontSize:22, fontFamily:G.serif, fontWeight:700, marginTop:20, marginBottom:10 }}>
        Open in Your Browser
      </h2>
      <p style={{ color:G.soft, fontSize:14, lineHeight:1.75, marginBottom:28, maxWidth:320 }}>
        For the best experience and secure payment processing, please open this page in your default browser — not inside Facebook or Instagram.
      </p>

      {/* Android instructions */}
      {isAndroid() && (
        <div style={{ width:'100%', maxWidth:340 }}>
          <button
            onClick={openInChrome}
            style={{ width:'100%', background:G.gold, color:G.bg, border:'none', borderRadius:10, padding:'14px 24px', fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:16 }}
          >
            Open in Chrome
          </button>
          <div style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:12, padding:'16px 18px' }}>
            <p style={{ color:G.muted, fontSize:12, lineHeight:1.7, marginBottom:8 }}>Or open manually:</p>
            <p style={{ color:G.cream, fontSize:13, lineHeight:1.8 }}>
              1. Tap the <strong style={{color:G.gold}}>⋮ three dots</strong> at the top right<br/>
              2. Select <strong style={{color:G.gold}}>"Open in Chrome"</strong> or <strong style={{color:G.gold}}>"Open in browser"</strong>
            </p>
          </div>
        </div>
      )}

      {/* iOS instructions */}
      {isIOS() && (
        <div style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:12, padding:'16px 18px', maxWidth:340, width:'100%' }}>
          <p style={{ color:G.cream, fontSize:13, lineHeight:1.9 }}>
            1. Tap the <strong style={{color:G.gold}}>⋯ three dots</strong> at the top right<br/>
            2. Select <strong style={{color:G.gold}}>"Open in Safari"</strong> or <strong style={{color:G.gold}}>"Open in Browser"</strong>
          </p>
        </div>
      )}

      {/* Generic fallback */}
      {!isAndroid() && !isIOS() && (
        <div style={{ background:G.surf, border:`1px solid ${G.brd}`, borderRadius:12, padding:'16px 18px', maxWidth:340, width:'100%' }}>
          <p style={{ color:G.cream, fontSize:13, lineHeight:1.9 }}>
            Tap the <strong style={{color:G.gold}}>menu (⋮ or ⋯)</strong> in your browser<br/>
            then select <strong style={{color:G.gold}}>"Open in browser"</strong>
          </p>
        </div>
      )}

      <p style={{ color:G.muted, fontSize:11, marginTop:20, lineHeight:1.6 }}>
        Or copy this link and paste it in Chrome or Safari:<br/>
        <span style={{ color:G.gold, wordBreak:'break-all', fontSize:11 }}>{currentUrl}</span>
      </p>
    </div>
  );
};

export default function App() {
  // Inject CSS variables and animation classes on mount
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'ikigai-styles';
    if (!document.getElementById('ikigai-styles')) {
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);

  const [view,         setView]         = useState('landing');
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [reportData,   setReportData]   = useState(null);
  const [answerCount,  setAnswerCount]  = useState(0);
  const [accessToken,  setAccessToken]  = useState(null);
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [sectionsDone,   setSectionsDone]   = useState(0);
  const [streamingContent, setStreamingContent] = useState('');
  const [reportError,  setReportError]  = useState(null);
  const [generationMsg,setGenerationMsg]= useState('');
  const [isInApp,      setIsInApp]      = useState(false);
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [resumeData,   setResumeData]   = useState(null);
  const [emailSent,    setEmailSent]    = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Detect in-app browser (Facebook, Instagram, Messenger) on mount
  useEffect(() => {
    if (detectInAppBrowser()) setIsInApp(true);
  }, []);

  // On mount: handle PayMongo redirect (?paid=true) or restore existing token.
  // IMPORTANT: PayMongo's success_url placeholder substitution is unreliable,
  // so we DON'T rely on it injecting the real session ID into the URL.
  // Instead, the sessionId is saved to localStorage right before redirecting
  // to checkout (see handleStart below), and read back here on return.
  useEffect(() => {
    if (DEMO_MODE) return; // Skip token logic entirely in demo mode
    const params   = new URLSearchParams(window.location.search);
    const paid     = params.get('paid'); // just "true", not a session ID
    const existing = getToken();

    if (paid === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      const pendingSession = localStorage.getItem('ikigai_pending_session');
      if (pendingSession) {
        localStorage.removeItem('ikigai_pending_session');
        verifyAndUnlock(pendingSession);
      } else {
        alert('Could not find your payment session. Contact support if you were charged.');
      }
    } else if (existing) {
      setAccessToken(existing);
      const saved = loadChat();
      if (saved && saved.messages && saved.messages.length > 1) setResumeData(saved);
    }
  }, []);

  const persistToken = (t) => {
    setAccessToken(t);
    saveToken(t);
  };

  const verifyAndUnlock = async (sessionId) => {
    setIsVerifying(true);
    try {
      const result = await apiVerifyPayment(sessionId);
      if (result.verified && result.token) {
        persistToken(result.token);
        await startChat(result.token);
      }
    } catch (err) {
      alert('Payment verification failed: ' + err.message + '\n\nContact support if you were charged.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Called when user clicks "Begin Your Journey"
  const handleStart = async () => {
    if (DEMO_MODE) {
      await startChat(null);
      return;
    }

    // Already paid — go straight to chat
    const existing = accessToken || getToken();
    if (existing) {
      await startChat(existing);
      return;
    }

    // Show payment page to collect email BEFORE redirecting to PayMongo
    setView('payment');
  };

  // Called when user submits email on payment page and clicks Continue
  const handlePaymentContinue = async (email) => {
    if (email) localStorage.setItem('ikigai_user_email', email);
    try {
      const { checkoutUrl, sessionId } = await apiCreateCheckout();
      localStorage.setItem('ikigai_pending_session', sessionId);
      window.location.href = checkoutUrl;
    } catch (err) {
      alert('Could not start payment: ' + err.message);
    }
  };

  const startChat = async (token) => {
    setView('chat');
    setMessages([]);
    setAnswerCount(0);
    setSectionsDone(0);
    setStreamingContent('');
    setIsLoading(true);
    try {
      const text = await apiChat(
        [{ role: 'user', content: 'Begin.' }],
        token,
        1000,
        SP
      );
      setMessages([
        { role: 'user', content: 'Begin.', hidden: true },
        { role: 'assistant', content: text },
      ]);
    } catch (err) {
      console.error('startChat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg  = { role: 'user', content: input.trim() };
    const updated  = [...messages, userMsg];
    setInput('');
    setMessages(updated);

    const newCount = answerCount + 1;
    setAnswerCount(newCount);
    setIsLoading(true);
    // Reset errors for new message
    setReportError(null);

    try {
      const token    = accessToken || getToken();
      const apiMsgs  = updated.map(({ role, content }) => ({ role, content }));
      const maxTok   = newCount >= 14 ? 4000 : 1000;

      // Add live streaming placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
      setStreamingContent('');

      const text = await apiChat(apiMsgs, token, maxTok, SP, (partial) => {
        // Update the streaming placeholder in real time
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 && m.streaming
            ? { ...m, content: partial }
            : m
        ));
        setStreamingContent(partial);

        // Show generation overlay when Claude signals it
        const lower = partial.toLowerCase();
        const isGenKeyword = ['generating', 'crafting your', 'synthesizing', 'all 16 answers', 'petals are aligned', 'ikigai_report_start'].some(k => lower.includes(k));
        if (isGenKeyword && !partial.includes('IKIGAI_REPORT_END')) {
          setIsGenerating(true);
          setGenerationMsg('Your report is being crafted — this takes 30–60 seconds. Do not close this tab. Results will be emailed to you.');
        }
      });

      // Remove streaming flag from the final message
      setMessages(prev => prev.map(m => m.streaming ? { ...m, content: text, streaming: false } : m));
      setStreamingContent('');

      if (text.includes('IKIGAI_REPORT_START')) {
        const match = text.match(/IKIGAI_REPORT_START\s*([\s\S]*?)IKIGAI_REPORT_END/);
        if (match) {
          try {
            const json = JSON.parse(match[1].trim());
            setReportData(json);
            setIsGenerating(false); setReportError(null);
            const pre = text.split('IKIGAI_REPORT_START')[0].trim();
            if (pre) setMessages(prev => [...prev, { role: 'assistant', content: pre }]);
            clearChat();
            const tok = accessToken || getToken();
            apiSendReport(json, tok).then(r => { if (r.emailSent) setEmailSent(true); console.log('[report email]', r.emailSent ? '✅ ' + r.recipientEmail : '❌ ' + r.emailError); });
            setTimeout(() => setView('report'), 1500);
          } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
          }
        }
      } else {
        // Detect if Claude is about to generate the report
        const generatingKeywords = ['generating your', 'crafting your', 'synthesizing your', 'all 16 answers', 'petals are aligned', 'personal report now'];
        if (generatingKeywords.some(k => text.toLowerCase().includes(k))) {
          setIsGenerating(true);
          setGenerationMsg('Your report is being crafted — this takes 30–60 seconds. Do not close this tab. Your results will also be sent to your email.');
        }
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      }
    } catch (err) {
      setIsGenerating(false);
      setReportError('Something went wrong. Your answers are saved — please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Your answers are saved — please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (messages.length > 1) saveChat(messages, answerCount); }, [messages, answerCount]);

  const reset = () => {
    if (!DEMO_MODE) clearToken();
    clearChat(); setResumeData(null); setEmailSent(false); setStreamingContent(''); setIsGenerating(false);
    setAccessToken(null);
    setView('landing');
    setMessages([]);
    setAnswerCount(0);
    setReportData(null);
  };

  // Production Whisper function — only passed to ChatView when not in demo mode
  const handleResume = () => { if (!resumeData) return; setMessages(resumeData.messages); setAnswerCount(resumeData.answerCount); setResumeData(null); setView('chat'); };
  const handleDismissResume = () => { clearChat(); setResumeData(null); };


  // Block in-app browsers and ask user to open in default browser
  if (isInApp) return <InAppBrowserBlock/>;

  if (view === 'report') {
    return <Report data={reportData} onRestart={reset} emailSent={emailSent} token={accessToken || getToken()} />;
  }

  if (view === 'chat') {
    return (
      <ChatView
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        answerCount={answerCount}
        endRef={endRef}
        token={accessToken || getToken()}
        isGenerating={isGenerating}
        generationMsg={generationMsg}
        reportError={reportError}
        sectionsDone={sectionsDone}
      />
    );
  }

  return (
    <>
      {view === 'payment'
        ? <Payment onSuccess={handlePaymentContinue} onBack={() => setView('landing')}/>
        : <>
            {resumeData && <ResumeModal answerCount={resumeData.answerCount} onResume={handleResume} onRestart={handleDismissResume}/>}
            <Landing onStart={handleStart} isVerifying={isVerifying}/>
          </>
      }
    </>
  );
}