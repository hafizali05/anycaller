// app-screens-run.jsx — Live feed (dashboard), Call detail, Rehearsal

// ──────────────────────────────────────────────────────────────────────
// 4. Live feed — campaign dashboard with all calls
// ──────────────────────────────────────────────────────────────────────
function ScreenLive({ openCall, onRehearsal }) {
  const [contacts, setContacts] = React.useState(CONTACTS);

  // Tick: every 2.5s, advance one queued → ringing → live → completed
  React.useEffect(() => {
    const id = setInterval(() => {
      setContacts(prev => {
        const next = prev.map(c => ({ ...c }));
        // promote one queued → ringing
        const q = next.find(c => c.status === 'queued');
        const r = next.find(c => c.status === 'ringing');
        // ringing → live (don't replace the demo live one)
        if (r && r.id !== 'c2') r.status = 'live';
        if (q) q.status = 'ringing';
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const live = contacts.filter(c => c.status === 'live').length;
  const ringing = contacts.filter(c => c.status === 'ringing').length;
  const completed = contacts.filter(c => c.status === 'completed').length;
  const queued = contacts.filter(c => c.status === 'queued').length;
  const vm = contacts.filter(c => c.status === 'voicemail').length;
  const failed = contacts.filter(c => c.status === 'failed').length;

  // Outcome counters
  const yes = contacts.filter(c => c.outcome === 'yes').length;
  const maybe = contacts.filter(c => c.outcome === 'maybe').length;
  const no = contacts.filter(c => c.outcome === 'no').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="Q2 SMB outreach · running"
        title="Live feed"
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
            <Icon name="clock" size={11} />
            <span style={{ verticalAlign: 'middle', marginLeft: 6 }}>started 38m ago</span>
          </span>
          <Button variant="ghost" size="sm" icon={<Icon name="pause" size={11} />}>Pause</Button>
        </div>}
      />

      {/* Counters strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 0, borderBottom: '1px solid var(--border)',
        background: 'var(--paper-2)',
      }}>
        <Counter big n={live} label="Live now" live />
        <Counter n={ringing} label="Ringing" tone="amber" />
        <Counter n={queued} label="Queued" />
        <Counter n={completed} label="Completed" tone="sage" />
        <Counter n={vm} label="Voicemail" />
        <Counter n={failed} label="No answer" />
      </div>

      {/* Outcomes ribbon */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 18, fontSize: 12 }}>
        <SectionLabel>Outcomes so far</SectionLabel>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--paper-3)' }}>
          <div style={{ width: `${yes * 8}%`, background: 'var(--sage)', height: '100%' }} />
          <div style={{ width: `${maybe * 8}%`, background: 'var(--amber)', height: '100%' }} />
          <div style={{ width: `${no * 8}%`, background: 'var(--ink-3)', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
          <Legend dot="var(--sage)" label={`${yes} yes`} />
          <Legend dot="var(--amber)" label={`${maybe} maybe`} />
          <Legend dot="var(--ink-3)" label={`${no} no`} />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }} className="ac-scroll">
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.1fr 100px 100px 1fr 24px',
          padding: '10px 28px', position: 'sticky', top: 0, background: 'var(--paper)',
          borderBottom: '1px solid var(--border)', zIndex: 2,
          fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--ink-3)',
        }}>
          <span>Contact</span><span>Company</span><span>Status</span><span>Duration</span><span>Outcome</span><span>Snippet / VU</span><span></span>
        </div>
        {contacts.map((c, i) => (
          <CallRow key={c.id} c={c} onOpen={() => c.status === 'completed' && openCall(c.id)} />
        ))}
      </div>
    </div>
  );
}

function Counter({ n, label, tone, big, live }) {
  const color = tone === 'sage' ? 'var(--sage)' :
                tone === 'amber' ? 'var(--amber)' :
                live ? 'var(--accent)' : 'var(--ink)';
  return (
    <div style={{
      padding: big ? '18px 22px' : '14px 22px',
      borderRight: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ink-3)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {live && <span style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
          animation: 'ac-blink 1.4s ease-in-out infinite',
        }} />}
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontWeight: 500,
        fontSize: big ? 36 : 26, color, letterSpacing: '-0.02em',
        marginTop: 4, lineHeight: 1.05,
      }}>{n}</div>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: dot }} />
      {label}
    </span>
  );
}

function CallRow({ c, onOpen }) {
  const isLive = c.status === 'live';
  const isDone = c.status === 'completed';
  const isRinging = c.status === 'ringing';

  // duration: live row pulses upward
  const [dur, setDur] = React.useState(isLive ? 47 : 0);
  React.useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setDur(d => d + 1), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const formatDur = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const completedDur = { c1: '04:18', c5: '03:42', c9: '01:09', c11: '05:02' }[c.id];

  const snippet = isLive ? "Six years on QuickBooks — payroll add-on got expensive…" :
                  isDone && c.outcome === 'yes' ? "Demo booked · Tuesday 2 PM PT" :
                  isDone && c.outcome === 'maybe' ? "Wants to think · callback in 1 week" :
                  isDone && c.outcome === 'no' ? "Not interested · polite end" :
                  c.status === 'voicemail' ? "Left 18s message" :
                  c.status === 'failed' ? "3 attempts · no pickup" :
                  isRinging ? "Dialing…" : "—";

  return (
    <div onClick={onOpen} style={{
      display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.1fr 100px 100px 1fr 24px',
      padding: '14px 28px', alignItems: 'center', borderBottom: '1px solid var(--border)',
      cursor: isDone ? 'pointer' : 'default',
      background: isLive ? 'var(--accent-soft)' : 'transparent',
      transition: 'background .15s',
      fontSize: 13,
    }}
    onMouseEnter={(e) => { if (isDone) e.currentTarget.style.background = 'var(--paper-2)'; }}
    onMouseLeave={(e) => { if (isDone) e.currentTarget.style.background = 'transparent'; }}>
      <div>
        <div style={{ color: 'var(--ink)' }}>{c.name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{c.phone}</div>
      </div>
      <div style={{ color: 'var(--ink-2)' }}>{c.company}</div>
      <div><StatusPill status={c.status} /></div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: isLive ? 'var(--accent)' : 'var(--ink-2)' }}>
        {isLive ? formatDur(dur) : completedDur || '—'}
      </div>
      <div>
        {c.outcome === 'yes'   && <Tag tone="sage">✓ yes</Tag>}
        {c.outcome === 'maybe' && <Tag tone="amber">~ maybe</Tag>}
        {c.outcome === 'no'    && <Tag tone="outline">— no</Tag>}
        {!c.outcome && <span style={{ color: 'var(--ink-4)' }}>—</span>}
      </div>
      <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10 }}>
        {isLive && <div style={{ flex: '0 0 60px' }}><Waveform bars={14} height={20} state="speaking" gap={2} barWidth={2} /></div>}
        {isDone && <div style={{ flex: '0 0 60px' }}><StaticWaveform width={60} height={20} bars={20} seed={c.id.charCodeAt(1) + 3} color="var(--ink-3)" /></div>}
        <span style={{
          fontSize: 12, color: isLive ? 'var(--ink)' : 'var(--ink-3)',
          fontStyle: isLive ? 'italic' : 'normal', fontFamily: isLive ? 'var(--font-display)' : 'var(--font-ui)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{snippet}</span>
      </div>
      <div style={{ color: 'var(--ink-4)' }}>
        {isDone && <Icon name="chev" size={14} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 5. Call detail — transcript + extraction + recording
// ──────────────────────────────────────────────────────────────────────
function ScreenCallDetail({ onBack }) {
  const call = COMPLETED_CALL;
  const [progress, setProgress] = React.useState(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12.5, fontFamily: 'var(--font-ui)',
        }}>
          <Icon name="chev" size={12} color="currentColor" /><span style={{ transform: 'scaleX(-1)' }}>›</span>
          <span style={{ marginLeft: -4 }}>Live feed</span>
        </button>
        <span style={{ color: 'var(--ink-4)' }}>/</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{call.contact.name} <span style={{ color: 'var(--ink-3)' }}>· {call.contact.company}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
            {call.contact.phone} · {call.startedAt} · {call.duration}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Tag tone="sage">demo booked · yes</Tag>
          <Tag tone="outline">sentiment · positive</Tag>
        </div>
      </div>

      {/* Recording bar */}
      <div style={{
        padding: '14px 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16, background: 'var(--paper-2)',
      }}>
        <button style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="play" size={12} color="var(--paper)" />
        </button>
        <div style={{ flex: 1 }}>
          <input type="range" min={0} max={100} value={progress * 100}
            onChange={(e) => setProgress(+e.target.value / 100)}
            style={{ display: 'none' }} />
          <StaticWaveform width={800} height={36} bars={120} progress={progress} seed={51} color="var(--ink-2)" />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
          {call.duration}
        </div>
        <Button size="sm" variant="ghost">Download</Button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', overflow: 'hidden' }}>
        {/* Transcript */}
        <div style={{ borderRight: '1px solid var(--border)', overflow: 'auto', padding: '20px 28px 32px' }} className="ac-scroll">
          <SectionLabel hint="auto-diarized">Transcript</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {call.transcript.map((line, i) => (
              <TranscriptLine key={i} line={line} />
            ))}
          </div>
        </div>

        {/* Right: summary + extraction */}
        <div style={{ overflow: 'auto', padding: '20px 28px 32px', background: 'var(--paper-2)' }} className="ac-scroll">
          <SectionLabel>Summary</SectionLabel>
          <p style={{
            margin: '0 0 22px', fontFamily: 'var(--font-display)', fontSize: 15.5,
            lineHeight: 1.55, color: 'var(--ink)', fontStyle: 'italic',
          }}>{call.summary}</p>

          <SectionLabel hint="confidence per field">Extracted data</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--paper)', borderRadius: 10, overflow: 'hidden' }}>
            {Object.entries(call.extraction).map(([k, v], i, arr) => (
              <ExtractionRow key={k} k={k} v={v} last={i === arr.length - 1} />
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <Button size="sm" variant="soft" icon={<Icon name="upload" size={12} />}>Push to HubSpot</Button>
            <Button size="sm" variant="ghost">Export JSON</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({ line }) {
  const isAva = line.who === 'ava';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 12 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)',
        paddingTop: 4, letterSpacing: '0.05em',
      }}>{line.t}</div>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: isAva ? 'var(--accent)' : 'var(--ink-3)',
          marginBottom: 3,
        }}>{isAva ? 'Ava' : 'Mara'}</div>
        <div style={{
          fontSize: 14.5, lineHeight: 1.5,
          color: isAva ? 'var(--ink)' : 'var(--ink-2)',
          fontFamily: isAva ? 'var(--font-display)' : 'var(--font-ui)',
          fontStyle: isAva ? 'italic' : 'normal',
        }}>{line.text}</div>
      </div>
    </div>
  );
}

function ExtractionRow({ k, v, last }) {
  const pct = Math.round(v.confidence * 100);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto',
      padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      alignItems: 'baseline', gap: 10,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{k}</div>
        <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>{v.value}</div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: pct >= 90 ? 'var(--sage)' : 'var(--amber)' }}>{pct}%</div>
        <div style={{ width: 44, height: 3, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? 'var(--sage)' : 'var(--amber)' }} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 6. Rehearsal — talk to your agent
// ──────────────────────────────────────────────────────────────────────
function ScreenRehearsal({ onBack }) {
  const [state, setState] = React.useState('ready'); // ready | listening | speaking
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (state === 'ready') return;
    const id = setInterval(() => setT(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  // Cycle listening ↔ speaking
  React.useEffect(() => {
    if (state === 'ready') return;
    const id = setInterval(() => {
      setState(s => s === 'listening' ? 'speaking' : s === 'speaking' ? 'listening' : s);
    }, 4500);
    return () => clearInterval(id);
  }, [state]);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: 'var(--paper)' }}>
      <div style={{
        position: 'absolute', top: 16, left: 28, right: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 2,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--ink-2)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>← Back to brief</button>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Rehearsal · not a real call</div>
      </div>

      <RehearsalStage state={state} t={t} setState={setState} />
    </div>
  );
}

function RehearsalStage({ state, t, setState }) {
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 40, padding: 40,
    }}>
      {/* Agent orb */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        {/* Outer pulse rings */}
        {state !== 'ready' && [0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid var(--accent)',
            animation: `ac-pulse-ring 2.4s ease-out ${i * 0.8}s infinite`,
          }} />
        ))}
        {/* Orb */}
        <div style={{
          position: 'absolute', inset: 20, borderRadius: '50%',
          background: state === 'speaking'
            ? 'radial-gradient(circle at 30% 30%, var(--accent), var(--accent-2))'
            : 'radial-gradient(circle at 30% 30%, var(--ink-2), var(--ink))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--paper)', fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 32, letterSpacing: '-0.01em',
          transition: 'background .3s',
          boxShadow: '0 24px 60px -12px rgba(0,0,0,.25)',
        }}>Ava</div>
      </div>

      {/* Inline waveform/state label */}
      <div style={{
        display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 14, minHeight: 80,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: state === 'speaking' ? 'var(--accent)' :
                 state === 'listening' ? 'var(--ink)' : 'var(--ink-3)',
        }}>
          {state === 'ready' && 'Tap to begin'}
          {state === 'listening' && '◉ listening'}
          {state === 'speaking' && '◉ Ava is speaking'}
        </div>

        {state !== 'ready' && (
          <div style={{ width: 280 }}>
            <Waveform bars={36} height={28} fill barWidth={2} gap={2}
              state={state === 'speaking' ? 'speaking' : 'listening'}
              color={state === 'speaking' ? 'var(--accent)' : 'var(--ink)'} />
          </div>
        )}

        {state === 'speaking' && (
          <p style={{
            margin: 0, maxWidth: 460, textAlign: 'center',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--ink)', lineHeight: 1.45,
          }}>
            <StreamText speed={28}
              text="Quick one — are you the person who handles the books at your business?" />
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {state === 'ready' ? (
          <button onClick={() => setState('listening')} style={{
            height: 56, padding: '0 28px', borderRadius: 999,
            border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
          }}>
            <Icon name="mic" size={18} />
            Start rehearsal
          </button>
        ) : (
          <>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-2)' }}>
              {fmt(t)}
            </span>
            <button onClick={() => { setState('ready'); }} style={{
              width: 56, height: 56, borderRadius: '50%',
              border: 'none', cursor: 'pointer',
              background: 'var(--ink)', color: 'var(--paper)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="square" size={18} color="var(--paper)" />
            </button>
            <button onClick={() => setState(state === 'listening' ? 'speaking' : 'listening')} style={{
              height: 40, padding: '0 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              background: 'var(--paper-2)', color: 'var(--ink)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Toggle turn</button>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenLive, ScreenCallDetail, ScreenRehearsal,
  Counter, CallRow, TranscriptLine, ExtractionRow, RehearsalStage,
});
