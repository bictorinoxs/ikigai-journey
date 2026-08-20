// components/LegalLayout.js
// Shared layout for /privacy, /terms, /refund-policy.
// Matches the Ikigai Journey dark theme (same CSS vars as the main app).

import Head from 'next/head';
import Link from 'next/link';

const PetalMark = ({ size = 26 }) => (
  <svg viewBox="0 0 60 60" width={size} height={size} style={{ display:'block', flexShrink:0 }}>
    <ellipse cx="30" cy="18" rx="9"  ry="15" fill="var(--gold)"  fillOpacity=".7"/>
    <ellipse cx="42" cy="30" rx="15" ry="9"  fill="var(--coral)" fillOpacity=".7"/>
    <ellipse cx="30" cy="42" rx="9"  ry="15" fill="var(--sage)"  fillOpacity=".7"/>
    <ellipse cx="18" cy="30" rx="15" ry="9"  fill="var(--lav)"   fillOpacity=".7"/>
    <circle  cx="30" cy="30" r="6" fill="var(--gold)"/>
  </svg>
);

export default function LegalLayout({ title, children }) {
  return (
    <>
      <Head>
        <title>{title} — Ikigai Journey</title>
      </Head>

      <div style={{ background:'var(--bg)', minHeight:'100vh', fontFamily:'var(--sans)', color:'var(--cream)' }}>

        {/* Header */}
        <div style={{ background:'var(--surf)', borderBottom:'1px solid var(--brd)', padding:'16px 24px', display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'var(--cream)' }}>
            <PetalMark size={26}/>
            <span style={{ fontFamily:'var(--serif)', fontSize:16, fontWeight:700, color:'var(--gold)' }}>Ikigai Journey</span>
          </Link>
        </div>

        {/* Content */}
        <div style={{ maxWidth:720, margin:'0 auto', padding:'56px 28px 80px' }}>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:34, fontWeight:700, color:'var(--gold)', marginBottom:8 }}>{title}</h1>

          <div className="legal-body">
            {children}
          </div>

          <div style={{ marginTop:56, paddingTop:28, borderTop:'1px solid var(--brd)', textAlign:'center' }}>
            <Link href="/" style={{ color:'var(--gold)', fontSize:14, textDecoration:'none', fontFamily:'var(--sans)' }}>← Back to Ikigai Journey</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .legal-body h2 {
          font-family: var(--serif);
          font-size: 20px;
          font-weight: 700;
          color: var(--cream);
          margin-top: 34px;
          margin-bottom: 12px;
        }
        .legal-body p {
          font-size: 14px;
          line-height: 1.75;
          color: var(--soft);
          margin-bottom: 12px;
        }
        .legal-body p strong {
          color: var(--cream);
        }
        .legal-body ul {
          margin: 0 0 16px 0;
          padding-left: 22px;
        }
        .legal-body li {
          font-size: 14px;
          line-height: 1.75;
          color: var(--soft);
          margin-bottom: 6px;
        }
        .legal-body hr {
          border: none;
          border-top: 1px solid var(--brd);
          margin: 28px 0;
        }
        .legal-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 13px;
        }
        .legal-body th, .legal-body td {
          text-align: left;
          padding: 10px 14px;
          border-bottom: 1px solid var(--brd);
          color: var(--soft);
        }
        .legal-body th {
          color: var(--gold);
          font-family: var(--sans);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .legal-body a {
          color: var(--gold);
        }
        .legal-body .disclaimer {
          font-style: italic;
          font-size: 12px;
          color: var(--muted);
          margin-top: 24px;
        }
      `}</style>
    </>
  );
}
