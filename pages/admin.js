// pages/admin.js
// Simple admin dashboard showing all completed Ikigai sessions.
// Protected by password. Access at /admin

import { useState, useEffect } from 'react';

const G = {
  bg: '#0e0c1e', surf: '#15132a', surf2: '#1d1b38', brd: '#2d2952',
  gold: '#f0a732', coral: '#d96b55', sage: '#6aaa92', lav: '#9d91d4',
  cream: '#f2ede2', muted: '#857da0', soft: '#c0b8d4', sans: "'Inter',system-ui,sans-serif",
};

export default function Admin() {
  const [password,  setPassword]  = useState('');
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [authed,    setAuthed]    = useState(false);
  const [expandId,  setExpandId]  = useState(null);

  const login = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/admin-sessions?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) { setError('Wrong password'); setLoading(false); return; }
      setSessions(data.sessions);
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
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 24 }}>Session Dashboard</p>
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

  const total    = sessions.length;
  const avgMins  = total > 0 ? (sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / total).toFixed(1) : '—';

  return (
    <div style={{ background: G.bg, minHeight: '100vh', fontFamily: G.sans, color: G.cream, padding: '24px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <span style={{ fontSize: 28 }}>🌸</span>
          <div>
            <h1 style={{ color: G.gold, fontSize: 22, fontWeight: 700, margin: 0 }}>Ikigai Journey — Session Log</h1>
            <p style={{ color: G.muted, fontSize: 13, margin: 0 }}>All completed discovery sessions</p>
          </div>
          <button
            onClick={() => setAuthed(false)}
            style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${G.brd}`, borderRadius: 8, padding: '6px 14px', color: G.muted, fontSize: 12, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
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

        {/* Table */}
        {total === 0 ? (
          <p style={{ color: G.muted, textAlign: 'center', padding: 40 }}>No sessions logged yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${G.brd}` }}>
                  {['Date & Time (PH)', 'Name', 'Email', 'Duration', 'Archetype', 'Ikigai Sentence'].map(h => (
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
                      style={{ borderBottom: `1px solid ${G.brd}`, cursor: 'pointer', background: expandId === s.id ? G.surf2 : i % 2 === 0 ? 'transparent' : '#13112600' }}
                    >
                      <td style={{ padding: '12px 14px', color: G.muted, whiteSpace: 'nowrap' }}>{fmt(s.created_at)}</td>
                      <td style={{ padding: '12px 14px', color: G.cream, fontWeight: 600 }}>{s.user_name || '—'}</td>
                      <td style={{ padding: '12px 14px', color: G.soft }}>{s.email || '—'}</td>
                      <td style={{ padding: '12px 14px', color: G.sage, whiteSpace: 'nowrap' }}>
                        {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: G.gold }}>{s.archetype || '—'}</td>
                      <td style={{ padding: '12px 14px', color: G.soft, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.ikigai_sentence ? `"${s.ikigai_sentence}"` : '—'}
                      </td>
                    </tr>
                    {expandId === s.id && (
                      <tr key={`exp-${s.id}`} style={{ background: G.surf2 }}>
                        <td colSpan={6} style={{ padding: '16px 24px' }}>
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
      </div>
    </div>
  );
}
