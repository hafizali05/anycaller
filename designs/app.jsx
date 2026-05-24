// app.jsx — main App shell + moments + canvas composition + tweaks

// ────────────────────────────────────────────────────────────────────
// App shell — sidebar + active route
// ────────────────────────────────────────────────────────────────────
function App({ initialRoute = 'live' }) {
  const [route, setRoute] = React.useState(initialRoute);
  const [openCallId, setOpenCallId] = React.useState(null);

  const goto = (r) => { setRoute(r); setOpenCallId(null); };
  const openCall = (id) => { setOpenCallId(id); setRoute('call'); };

  // Wizard steps share a route prefix so StepRail's gotoStep maps correctly.
  const wizardGoto = (step) => {
    if (step === 'brief')    goto('wizard-brief');
    else if (step === 'contacts') goto('wizard-contacts');
    else if (step === 'launch') goto('launch');
    else goto(step);
  };

  return (
    <div className="ac-root" style={{
      width: '100%', height: '100%', display: 'flex',
      background: 'var(--paper)', color: 'var(--ink)',
      fontSize: 14, overflow: 'hidden',
    }}>
      <Sidebar route={route} onNav={goto} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {route === 'live'      && <ScreenLive openCall={openCall} onRehearsal={() => goto('rehearsal')} />}
        {route === 'campaigns' && <ScreenCampaignsList onOpen={() => goto('live')} onNew={() => goto('wizard-brief')} />}
        {route === 'briefs'    && <ScreenBriefsLibrary onNew={() => goto('wizard-brief')} onOpen={() => goto('wizard-brief')} />}
        {route === 'contacts'  && <ScreenContactsLibrary onNew={() => goto('wizard-contacts')} onOpen={() => goto('wizard-contacts')} />}
        {route === 'wizard-brief'    && <ScreenBrief    gotoStep={wizardGoto} onNext={() => goto('wizard-contacts')} onRehearsal={() => goto('rehearsal')} />}
        {route === 'wizard-contacts' && <ScreenContacts gotoStep={wizardGoto} onBack={() => goto('wizard-brief')} onNext={() => goto('launch')} />}
        {route === 'launch'    && <ScreenLaunch gotoStep={wizardGoto} onBack={() => goto('wizard-contacts')} onNext={() => goto('live')} />}
        {route === 'call'      && <ScreenCallDetail onBack={() => goto('live')} />}
        {route === 'rehearsal' && <ScreenRehearsal onBack={() => goto('wizard-brief')} />}
      </main>
    </div>
  );
}

function Sidebar({ route, onNav }) {
  return (
    <aside style={{
      width: 220, flex: '0 0 220px', height: '100%',
      borderRight: '1px solid var(--border)',
      background: 'var(--paper-2)',
      display: 'flex', flexDirection: 'column',
      padding: '18px 14px',
    }}>
      <div style={{ padding: '4px 8px 18px' }}>
        <Wordmark size={17} live />
      </div>

      <button onClick={() => onNav('wizard-brief')} style={{
        margin: '4px 4px 14px', padding: '9px 12px',
        background: 'var(--ink)', color: 'var(--paper)',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={13} color="var(--paper)" />
          New call campaign
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--paper-3)', opacity: 0.7 }}>⌘N</span>
      </button>

      <div style={{ marginTop: 8 }}>
        <SidebarLabel>Now</SidebarLabel>
        <NavItem icon="feed" label="Live feed" active={route === 'live' || route === 'call'} count={1} live onClick={() => onNav('live')} />
        <NavItem icon="dial" label="Campaigns" badge="3" active={route === 'campaigns'} onClick={() => onNav('campaigns')} />
      </div>

      <div style={{ marginTop: 14 }}>
        <SidebarLabel>Library</SidebarLabel>
        <NavItem icon="brief" label="Briefs"   badge="7"   active={route === 'briefs'}   onClick={() => onNav('briefs')} />
        <NavItem icon="list"  label="Contacts" badge="412" active={route === 'contacts'} onClick={() => onNav('contacts')} />
        <NavItem icon="gear"  label="Numbers & voices" onClick={() => {}} />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <SidebarLabel>Account</SidebarLabel>
        <div style={{
          padding: '10px 12px', background: 'var(--paper)', borderRadius: 8,
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Credits</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink)' }}>4h 12m</span>
          </div>
          <div style={{ height: 4, background: 'var(--paper-3)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: '46%', height: '100%', background: 'var(--accent)' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--ink-3)' }}>Top up · auto-recharge off</div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLabel({ children }) {
  return (
    <div style={{
      padding: '4px 12px 6px',
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--ink-3)',
    }}>{children}</div>
  );
}

function NavItem({ icon, label, active, badge, count, live, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '7px 12px', margin: '1px 0',
      borderRadius: 7, border: 'none', cursor: 'pointer',
      background: active ? 'var(--paper)' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--ink-2)',
      fontFamily: 'var(--font-ui)', fontSize: 13,
      fontWeight: active ? 500 : 400,
      boxShadow: active ? '0 1px 0 var(--border), inset 0 0 0 1px var(--border)' : 'none',
      textAlign: 'left',
    }}>
      <Icon name={icon} size={14} color={active ? 'var(--ink)' : 'var(--ink-2)'} />
      <span style={{ flex: 1 }}>{label}</span>
      {live && count != null && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'ac-blink 1.4s infinite' }} />
          {count}
        </span>
      )}
      {!live && badge && (
        <span style={{
          padding: '1px 6px', borderRadius: 999,
          background: 'var(--paper-3)', color: 'var(--ink-3)',
          fontFamily: 'var(--font-mono)', fontSize: 10.5,
        }}>{badge}</span>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Primer — brand & system artboard
// ────────────────────────────────────────────────────────────────────
function Primer() {
  return (
    <div className="ac-root" style={{ padding: 36, height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          v0.1 · design system
        </div>
        <h1 style={{ margin: '6px 0 0', fontSize: 64, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <Wordmark size={64} live />
        </h1>
        <p style={{
          margin: '14px 0 0', fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--ink-2)', maxWidth: 720, lineHeight: 1.45,
        }}>
          "Type what you want the agent to do, paste numbers, click call." A voice-forward
          tool for anyone who needs a few hundred conversations completed, well.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, flex: 1 }}>
        {/* Palette */}
        <PrimerCard title="Palette" hint="warm paper · ink · vermillion · sage">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Swatch color="var(--paper)" name="paper" hex="#f4efe4" dark />
            <Swatch color="var(--ink)" name="ink" hex="#1a1714" />
            <Swatch color="var(--accent)" name="accent" hex="#d94a2a" />
            <Swatch color="var(--sage)" name="sage" hex="#5b8a64" />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Vermillion is reserved for <b style={{ color: 'var(--accent)', fontWeight: 500 }}>live / record</b> —
            the dot in the wordmark, the live row in the feed, the "call now" CTA.
          </div>
        </PrimerCard>

        {/* Type */}
        <PrimerCard title="Type" hint="Geist · Geist Mono · Newsreader italic">
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            "Hi, this is Ava."
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--ink)' }}>
            New campaign · 137 contacts
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
            04:18 · 0.96 confidence · 137
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Newsreader italic carries the agent voice — its lines and the user's brief. Geist Mono
            grounds every number, status, and code field. Geist runs the UI.
          </div>
        </PrimerCard>

        {/* Waveform / motion */}
        <PrimerCard title="Motion" hint="waveforms · pulse rings · streams">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>SPEAKING</div>
              <Waveform bars={28} height={28} state="speaking" gap={2} barWidth={2.5} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>LISTENING</div>
              <Waveform bars={28} height={28} state="listening" gap={2} barWidth={2.5} color="var(--ink)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>RECORDED</div>
              <StaticWaveform width={180} height={28} bars={50} color="var(--ink-2)" />
            </div>
          </div>
        </PrimerCard>

        {/* Components */}
        <PrimerCard title="States" hint="every call has six">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <StatusPill status="queued" />
            <StatusPill status="ringing" />
            <StatusPill status="live" />
            <StatusPill status="completed" />
            <StatusPill status="voicemail" />
            <StatusPill status="failed" />
          </div>
        </PrimerCard>
      </div>
    </div>
  );
}

function PrimerCard({ title, hint, children }) {
  return (
    <div style={{
      background: 'var(--paper-2)', borderRadius: 14,
      padding: '18px 18px', display: 'flex', flexDirection: 'column',
      boxShadow: 'inset 0 0 0 1px var(--border)',
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          {title}
        </div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Swatch({ color, name, hex, dark }) {
  return (
    <div style={{
      height: 56, borderRadius: 8, background: color,
      padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: dark ? 'inset 0 0 0 1px var(--border)' : 'none',
      color: dark ? 'var(--ink-2)' : 'var(--paper)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>{hex}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Moments — single-purpose artboards for hero visual moments
// ────────────────────────────────────────────────────────────────────

// LiveCallMoment — full-bleed live call hero with big waveform + transcript
function LiveCallMoment() {
  const [elapsed, setElapsed] = React.useState(47);
  React.useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="ac-root" style={{
      height: '100%', background: 'var(--paper)', padding: 36,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'ac-blink 1.4s infinite' }} />
            Live · in progress
          </div>
          <h2 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Jin Park <span style={{ color: 'var(--ink-3)' }}>· Park Family Dental</span>
          </h2>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-3)' }}>
            +1 (917) 555-0119 · ET · attempt 1 of 3
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(elapsed)}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>elapsed</div>
        </div>
      </div>

      {/* Big waveform */}
      <div style={{
        background: 'var(--paper-2)', borderRadius: 14, padding: '28px 28px',
        position: 'relative', minHeight: 140,
      }}>
        <div style={{ position: 'absolute', top: 14, left: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>● Ava speaking</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>turn 7</span>
        </div>
        <div style={{ paddingTop: 18 }}>
          <Waveform bars={64} height={80} state="speaking" gap={3} barWidth={3.5} fill color="var(--accent)" />
        </div>
      </div>

      {/* Live transcript */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div style={{ overflow: 'auto' }} className="ac-scroll">
          <SectionLabel hint="streaming">Live transcript</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LIVE_CALL.turns.slice(-5).map((line, i) => (
              <TranscriptLine key={i} line={line} />
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: 12, opacity: 0.7 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>00:47</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Jin</div>
                <div style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {LIVE_CALL.liveText}<span style={{
                    display: 'inline-block', width: 6, height: 14, background: 'var(--ink-4)',
                    verticalAlign: '-2px', marginLeft: 2, animation: 'ac-caret 0.9s steps(1) infinite',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail: live extraction so far */}
        <div style={{ overflow: 'auto', background: 'var(--paper-2)', borderRadius: 12, padding: '16px 18px' }} className="ac-scroll">
          <SectionLabel hint="filling in">Extracting so far</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LiveField k="contact_role" v="day-to-day bookkeeper" pct={88} />
            <LiveField k="current_software" v="QuickBooks Online" pct={97} />
            <LiveField k="years_using" v="6" pct={94} />
            <LiveField k="likes" v={<em style={{ color: 'var(--ink-3)' }}>listening…</em>} pct={null} pulsing />
            <LiveField k="dislikes" v={<em style={{ color: 'var(--ink-3)' }}>—</em>} pct={null} dim />
            <LiveField k="demo_interest" v={<em style={{ color: 'var(--ink-3)' }}>—</em>} pct={null} dim />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveField({ k, v, pct, pulsing, dim }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 8,
      padding: '8px 10px', background: 'var(--paper)', borderRadius: 7,
      opacity: dim ? 0.6 : 1,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{k}</div>
        <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 2 }}>{v}</div>
      </div>
      {pct != null && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--sage)' }}>{pct}%</div>
      )}
      {pulsing && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'ac-blink 1.4s infinite' }} />
      )}
    </div>
  );
}

// ResultMoment — extracted-data hero, big and confident
function ResultMoment() {
  return (
    <div className="ac-root" style={{
      height: '100%', background: 'var(--paper)', padding: 36,
      display: 'flex', flexDirection: 'column', gap: 22,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sage)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={11} color="var(--sage)" /> Completed · demo booked
        </div>
        <h2 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' }}>
          Mara Ortega <span style={{ color: 'var(--ink-3)' }}>· Ortega Roofing</span>
        </h2>
      </div>

      <p style={{
        margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 20, color: 'var(--ink)', maxWidth: 720, lineHeight: 1.45,
      }}>"{COMPLETED_CALL.summary}"</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {Object.entries(COMPLETED_CALL.extraction).map(([k, v]) => (
          <ExtractionRow key={k} k={k} v={v} last />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StaticWaveform width={500} height={28} bars={140} progress={1} seed={51} color="var(--ink-2)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>{COMPLETED_CALL.duration}</span>
      </div>
    </div>
  );
}

// EmptyMoment — first-run
function EmptyMoment() {
  return (
    <div className="ac-root" style={{
      height: '100%', background: 'var(--paper)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 36,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <Wordmark size={40} live />
        <h2 style={{
          margin: '24px 0 6px', fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 36, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.15,
        }}>What should we call about?</h2>
        <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          Describe the conversation in plain language. We'll build the agent, dial the
          numbers you upload, and hand you back transcripts, recordings, and the data
          you asked for — structured.
        </p>
        <div style={{
          marginTop: 24, padding: '14px 18px', background: 'var(--paper-2)',
          borderRadius: 12, textAlign: 'left',
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 15.5, color: 'var(--ink-3)', lineHeight: 1.55,
        }}>
          "I'm selling accounting software to small businesses…"<br />
          "Follow up on ticket #1234 and confirm it's resolved…"<br />
          "Ask 5 questions about how restaurants handle reservations…"
        </div>
        <button style={{
          marginTop: 22, height: 44, padding: '0 22px', borderRadius: 999,
          background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="phone" size={14} color="#fff" /> Write your first brief
        </button>
        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-3)' }}>
          Free tier · 10 minutes on the house
        </div>
      </div>
    </div>
  );
}

// BriefMoment — the streaming agent generation, mid-flight
function BriefMoment() {
  return (
    <div className="ac-root" style={{
      height: '100%', background: 'var(--paper)', padding: 36,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Brief → agent
        </div>
        <h2 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' }}>
          You write the brief. We draft the agent.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, overflow: 'hidden' }}>
        <div>
          <SectionLabel>Your brief</SectionLabel>
          <p style={{
            margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 17, lineHeight: 1.55, color: 'var(--ink)',
          }}>"{SAMPLE_BRIEF}"</p>
        </div>
        <div style={{ overflow: 'auto', paddingRight: 4 }} className="ac-scroll">
          <SectionLabel hint="generating · v3">Ava · friendly</SectionLabel>
          <AgentCard frozen seed={0} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  App, Sidebar, NavItem, SidebarLabel,
  Primer, LiveCallMoment, ResultMoment, EmptyMoment, BriefMoment,
});
