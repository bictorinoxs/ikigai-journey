// pages/admin.js
// Admin dashboard: funnel drop-off view + completed session log.
// Protected by password. Access at /admin

import { useState } from 'react';

const G = {
  bg: '#0e0c1e', surf: '#15132a', surf2: '#1d1b38', brd: '#2d2952',
  gold: '#f0a732', coral: '#d96b55', sage: '#6aaa92', lav: '#9d91d4',
  cream: '#f2ede2', muted: '#857da0', soft: '#c0b8d4', sans: "'Inter',system-ui,sans-serif",
};

const STEP_LABELS = {
  page_view:            'Page View',
  cta_click:            'CTA Click',
  switch_browser_shown: 'Switch-Browser Prompt',
  preview_complete:     'Preview Complete',
  payment_verified:     'Payment Verified',
  report_generated:     'Report Generated',
};
const STEP_COLORS = {
  page_view:            G.muted,
  cta_click:            G.lav,
  switch_browser_shown: G.coral,
  preview_complete:     G.coral,
  payment_verified:     G.sage,
  report_generated:     G.gold,
};

export default function Admin() {
  const [password,  setPassword]  = useState('');
  const [sessions,  setSessions]  = useState([]);
  const [funnel,    setFunnel]    = useState(null);
  const [tab,       setTab]       = useState('funnel'); // 'funnel' | 'sessions'
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [authed,    setAuthed]    = useState(false);
  const [expandId,  setExpandId]  = useState(null);

  const login = async () => {
    setLoading(true); setError('');
    try {
      const [sRes, fRes] = await Promise.all([
        fetch(`/api/admin-sessions?password=${encodeURIComponent(password)}`),
        fetch(`/api/admin-funnel?password=${encodeURIComponent(password)}`),
      ]);
      const sData = await sRes.json();
      const fData = await fRes.json();
      if (!sRes.ok || !sData.ok) { setError('Wrong password'); setLoading(false); return; }
      setSessions(sData.sessions);
      if (fRes.ok && fData.ok) setFunnel(fData);
      setAuthed(true);
    } catch (err) { setError(err?.message); }
    setLoading(false);
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
  };

  if (!authed) return (
    <div style={{ background: G.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: G.sans }}>
      <div style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 16, padding: 40, width: 360, textAlign: 'center' }}>
        <p style={{ fontSize: 28, marginBottom: 6 }}>🌸</p>
        <h2 style={{ color: G.gold, fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Ikigai Admin</h2>
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 24 }}>Funnel &amp; Session Dashboard</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Enter admin password"
          style={{ width: '100%', background: G.surf2, border: `1px solid ${G.brd}`, borderRadius: 8, padding: '10px 14px', color: G.cream, fontSize: 14, fontFamily: G.sans, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        {error && <p style={{ color: G.coral, fontSize: 12, marginBottom: 10 }}>{error}</p>}
        <button
          onClick={login} disabled={loading}
          style={{ width: '100%', background: G.gold, border: 'none', borderRadius: 8, padding: '11px', color: G.bg, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: G.sans }}
        >
          {loading ? 'Checking...' : 'Enter Dashboard'}
        </button>
      </div>
    </div>
  );

  const total   = sessions.length;
  const avgMins = total > 0 ? (sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / total).toFixed(1) : '—';

  const steps      = funnel?.steps || [];
  const counts     = funnel?.counts || {};
  const ctaSources = funnel?.byCtaSource || {};
  const utmRows    = funnel ? Object.entries(funnel.byUtm || {}) : [];
  const dayRows    = funnel ? Object.entries(funnel.byDay || {}) : []; // already newest-first from the API
  const maxCount   = Math.max(1, ...steps.map(s => counts[s] || 0));

  const pct = (fromStep, toStep) => {
    const from = counts[fromStep] || 0;
    const to   = counts[toStep] || 0;
    if (!from) return '—';
    return ((to / from) * 100).toFixed(1) + '%';
  };

  return (
    <div style={{ background: G.bg, minHeight: '100vh', fontFamily: G.sans, color: G.cream, padding: '24px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>🌸</span>
          <div>
            <h1 style={{ color: G.gold, fontSize: 22, fontWeight: 700, margin: 0 }}>Ikigai Journey — Admin</h1>
            <p style={{ color: G.muted, fontSize: 13, margin: 0 }}>Funnel performance and completed sessions</p>
          </div>
          <button
            onClick={() => setAuthed(false)}
            style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${G.brd}`, borderRadius: 8, padding: '6px 14px', color: G.muted, fontSize: 12, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${G.brd}` }}>
          {[['funnel', 'Funnel'], ['sessions', 'Sessions']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontFamily: G.sans, fontSize: 14, fontWeight: 600,
                color: tab === key ? G.gold : G.muted,
                borderBottom: tab === key ? `2px solid ${G.gold}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ============== FUNNEL TAB ============== */}
        {tab === 'funnel' && (
          !funnel ? (
            <p style={{ color: G.muted, textAlign: 'center', padding: 40 }}>No funnel data yet — tracking starts once this deploys and someone visits the site.</p>
          ) : (
            <>
              {/* Funnel bars — sequential, now that page_view always reflects real reach */}
              <div style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>
                  Conversion Funnel · {funnel.totalEvents} events logged
                </p>
                {steps.map((step, i) => {
                  const val = counts[step] || 0;
                  const widthPct = (val / maxCount) * 100;
                  const dropFromPrev = i > 0 ? pct(steps[i - 1], step) : null;
                  return (
                    <div key={step} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: G.cream, fontWeight: 600 }}>{STEP_LABELS[step] || step}</span>
                        <span style={{ color: STEP_COLORS[step], fontWeight: 700 }}>
                          {val}
                          {dropFromPrev && <span style={{ color: G.muted, fontWeight: 400, marginLeft: 8, fontSize: 12 }}>({dropFromPrev} of prev step)</span>}
                        </span>
                      </div>
                      <div style={{ height: 10, background: G.surf2, borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${widthPct}%`, background: STEP_COLORS[step], borderRadius: 6, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA source breakdown */}
              <div style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Which CTA Button Gets Clicked</p>
                {Object.keys(ctaSources).length === 0 ? (
                  <p style={{ color: G.muted, fontSize: 13 }}>No CTA clicks logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(ctaSources).sort((a, b) => b[1] - a[1]).map(([src, n]) => (
                      <div key={src} style={{ background: G.surf2, border: `1px solid ${G.brd}`, borderRadius: 10, padding: '12px 18px', minWidth: 140 }}>
                        <p style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>{src === 'hero_early' ? 'Early (hero) button' : src === 'footer_bottom' ? 'Bottom button' : src}</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: G.lav, margin: 0 }}>{n}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Per-ad-version breakdown */}
              <div style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 14, padding: '22px 24px' }}>
                <p style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>By Ad Version (UTM Content)</p>
                {utmRows.length === 0 ? (
                  <p style={{ color: G.muted, fontSize: 13 }}>No tagged traffic yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${G.brd}` }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: G.muted, fontSize: 11, textTransform: 'uppercase' }}>Version</th>
                          {steps.map(s => (
                            <th key={s} style={{ textAlign: 'right', padding: '8px 12px', color: G.muted, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{STEP_LABELS[s]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {utmRows.sort((a, b) => (b[1].page_view || 0) - (a[1].page_view || 0)).map(([tag, evs]) => (
                          <tr key={tag} style={{ borderBottom: `1px solid ${G.brd}` }}>
                            <td style={{ padding: '10px 12px', color: G.gold, fontFamily: 'monospace', fontSize: 12 }}>{tag}</td>
                            {steps.map(s => (
                              <td key={s} style={{ padding: '10px 12px', textAlign: 'right', color: G.soft }}>{evs[s] || 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* Daily breakdown */}
              <div style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 14, padding: '22px 24px', marginTop: 20 }}>
                <p style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Daily Breakdown · Last 30 days with activity (PH time)</p>
                {dayRows.length === 0 ? (
                  <p style={{ color: G.muted, fontSize: 13 }}>No daily data yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${G.brd}` }}>
                          <th style={{ textAlign: 'left', padding: '8px 12px', color: G.muted, fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                          {steps.map(s => (
                            <th key={s} style={{ textAlign: 'right', padding: '8px 12px', color: G.muted, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{STEP_LABELS[s]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dayRows.map(([day, evs]) => (
                          <tr key={day} style={{ borderBottom: `1px solid ${G.brd}` }}>
                            <td style={{ padding: '10px 12px', color: G.cream, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {new Date(day + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            {steps.map(s => (
                              <td key={s} style={{ padding: '10px 12px', textAlign: 'right', color: s === 'switch_browser_shown' ? G.coral : G.soft }}>{evs[s] || 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}

        {/* ============== SESSIONS TAB (unchanged from before) ============== */}
        {tab === 'sessions' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                ['Total Sessions', total, G.gold],
                ['Avg. Duration', `${avgMins} min`, G.sage],
                ['Latest', total > 0 ? fmt(sessions[0]?.created_at) : '—', G.lav],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: G.surf, border: `1px solid ${G.brd}`, borderRadius: 12, padding: '16px 20px' }}>
                  <p style={{ fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {total === 0 ? (
              <p style={{ color: G.muted, textAlign: 'center', padding: 40 }}>No sessions logged yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${G.brd}` }}>
                      {['Date & Time (PH)', 'Name', 'Email', 'Duration', 'Promo', 'Archetype', 'Ikigai Sentence'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <>
                        <tr
                          key={s.id}
                          onClick={() => setExpandId(expandId === s.id ? null : s.id)}
                          style={{ borderBottom: `1px solid ${G.brd}`, cursor: 'pointer', background: expandId === s.id ? G.surf2 : 'transparent' }}
                        >
                          <td style={{ padding: '12px 14px', color: G.muted, whiteSpace: 'nowrap' }}>{fmt(s.created_at)}</td>
                          <td style={{ padding: '12px 14px', color: G.cream, fontWeight: 600 }}>{s.user_name || '—'}</td>
                          <td style={{ padding: '12px 14px', color: G.soft }}>{s.email || '—'}</td>
                          <td style={{ padding: '12px 14px', color: G.sage, whiteSpace: 'nowrap' }}>
                            {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', color: G.lav, fontFamily: 'monospace', fontSize: 12 }}>{s.promo_code || '—'}</td>
                          <td style={{ padding: '12px 14px', color: G.gold }}>{s.archetype || '—'}</td>
                          <td style={{ padding: '12px 14px', color: G.soft, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.ikigai_sentence ? `"${s.ikigai_sentence}"` : '—'}
                          </td>
                        </tr>
                        {expandId === s.id && (
                          <tr key={`exp-${s.id}`} style={{ background: G.surf2 }}>
                            <td colSpan={7} style={{ padding: '16px 24px' }}>
                              <p style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Full Ikigai Sentence</p>
                              <p style={{ color: G.gold, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12 }}>"{s.ikigai_sentence}"</p>
                              <p style={{ color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Session ID</p>
                              <p style={{ color: G.muted, fontSize: 12, fontFamily: 'monospace' }}>{s.session_id || s.id}</p>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
