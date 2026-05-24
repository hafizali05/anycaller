// app-screens-create.jsx — Brief, Contacts, Launch screens

// ──────────────────────────────────────────────────────────────────────
// Screen scaffolding — every screen header has the title + step indicator
// ──────────────────────────────────────────────────────────────────────
function ScreenHeader({ eyebrow, title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '20px 28px 18px', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        {eyebrow && <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4,
        }}>{eyebrow}</div>}
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em',
        }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function StepRail({ current, onStep }) {
  const steps = [
    { id: 'brief', label: 'Brief' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'launch', label: 'Launch' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {steps.map((s, i) => {
        const active = s.id === current;
        const done = steps.findIndex(x => x.id === current) > i;
        return (
          <React.Fragment key={s.id}>
            <button onClick={() => onStep && onStep(s.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
              color: active ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-3)',
              padding: 0,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--ink)' : done ? 'var(--sage)' : 'transparent',
                boxShadow: active || done ? 'none' : 'inset 0 0 0 1px var(--border-2)',
                color: active || done ? 'var(--paper)' : 'var(--ink-3)',
                fontSize: 10, fontWeight: 600,
              }}>{done ? <Icon name="check" size={11} /> : i + 1}</span>
              <span style={{ textTransform: 'uppercase' }}>{s.label}</span>
            </button>
            {i < steps.length - 1 && <span style={{ width: 16, height: 1, background: 'var(--border-2)' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 1. Brief — the hero screen. Left: the brief itself. Right: streamed agent.
// ──────────────────────────────────────────────────────────────────────
function ScreenBrief({ onNext, onRehearsal, gotoStep, persona = 'friendly', setPersona = () => {}, voice = 'sage', setVoice = () => {} }) {
  const [briefText, setBriefText] = React.useState(SAMPLE_BRIEF);
  const [streamSeed, setStreamSeed] = React.useState(0);
  const regenerate = () => setStreamSeed(s => s + 1);
  const personaObj = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="New campaign · step 1 of 3"
        title="Write your brief. We'll build the agent."
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <StepRail current="brief" onStep={gotoStep} />
        </div>}
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, overflow: 'hidden' }}>
        {/* LEFT — the brief */}
        <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 18, borderRight: '1px solid var(--border)', overflow: 'auto' }} className="ac-scroll">
          <SectionLabel hint={`${briefText.length} chars`}>Plain-language brief</SectionLabel>

          <div style={{ position: 'relative' }}>
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              style={{
                width: '100%', minHeight: 220, resize: 'vertical',
                background: 'transparent', border: 'none', outline: 'none',
                padding: 0,
                fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.55,
                fontStyle: 'italic', color: 'var(--ink)',
                letterSpacing: '-0.005em',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag tone="outline">+ persona</Tag>
            <Tag tone="outline">+ examples</Tag>
            <Tag tone="outline">+ do-not-say</Tag>
            <Tag tone="outline">+ company context</Tag>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-2)', paddingTop: 18, marginTop: 4 }}>
            <SectionLabel>Agent settings</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 12, columnGap: 16, fontSize: 13 }}>
              <span style={{ color: 'var(--ink-3)' }}>Persona</span>
              <Segmented value="friendly" options={['friendly', 'formal', 'concise']} />
              <span style={{ color: 'var(--ink-3)' }}>Voice</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Sage</span>
                <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>ElevenLabs · female · warm</span>
                <button style={miniBtn}><Icon name="play" size={10} /></button>
              </div>
              <span style={{ color: 'var(--ink-3)' }}>Max length</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="range" min={2} max={12} defaultValue={6} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>6 min</span>
              </div>
              <span style={{ color: 'var(--ink-3)' }}>Disclosure</span>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Auto · on the word "AI"</div>
              <span style={{ color: 'var(--ink-3)' }}>Language</span>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>English (US) <span style={{ color: 'var(--ink-4)' }}>· more in v1.1</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT — the generated agent */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--paper-2)', overflow: 'hidden' }}>
          <div style={{
            padding: '20px 28px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
              }}>Generated agent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>Ava</span>
                <Tag tone="sage" mono>friendly</Tag>
                <Tag tone="outline">v3 · 1m ago</Tag>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost" icon={<Icon name="sparkle" size={13} />} onClick={regenerate}>Regenerate</Button>
              <Button size="sm" variant="accent" icon={<Icon name="mic" size={13} />} onClick={onRehearsal}>Talk to Ava</Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 24px' }} className="ac-scroll">
            <AgentCard seed={streamSeed} />
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{
        padding: '14px 28px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--paper)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          <Icon name="check" size={12} color="var(--sage)" />
          <span style={{ verticalAlign: 'middle', marginLeft: 6 }}>Brief saved · auto-saving every change</span>
        </div>
        <Button variant="primary" size="md" icon={<Icon name="arrow" size={13} />} onClick={onNext}>
          Next · choose contacts
        </Button>
      </div>
    </div>
  );
}

const miniBtn = {
  width: 22, height: 22, borderRadius: 5, border: 'none', cursor: 'pointer',
  background: 'var(--paper-3)', color: 'var(--ink)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

function Segmented({ value, options, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 2, borderRadius: 7,
      background: 'var(--paper-2)', boxShadow: 'inset 0 0 0 1px var(--border)',
    }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange && onChange(o)} style={{
          padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
          background: value === o ? 'var(--paper)' : 'transparent',
          boxShadow: value === o ? '0 1px 2px rgba(0,0,0,.06), inset 0 0 0 1px var(--border)' : 'none',
          color: value === o ? 'var(--ink)' : 'var(--ink-2)',
          fontSize: 12, fontFamily: 'var(--font-ui)',
          textTransform: 'capitalize',
        }}>{o}</button>
      ))}
    </div>
  );
}

// The big agent card — streamed in stages
function AgentCard({ seed = 0, frozen = false }) {
  const a = GENERATED_AGENT;
  const [stage, setStage] = React.useState(frozen ? 99 : 0);
  React.useEffect(() => {
    if (frozen) { setStage(99); return; }
    setStage(0);
    const ids = [];
    ids.push(setTimeout(() => setStage(1), 400));
    ids.push(setTimeout(() => setStage(2), 1700));
    ids.push(setTimeout(() => setStage(3), 3400));
    ids.push(setTimeout(() => setStage(4), 5000));
    ids.push(setTimeout(() => setStage(5), 6400));
    return () => ids.forEach(clearTimeout);
  }, [seed, frozen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Block label="Opening" show={stage >= 1}>
        <p style={{
          margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 18, lineHeight: 1.5, color: 'var(--ink)',
        }}>
          {stage >= 1 ? (
            stage === 1
              ? <StreamText text={a.opening} speed={12} trigger={seed} />
              : <>&ldquo;{a.opening}&rdquo;</>
          ) : null}
        </p>
      </Block>

      <Block label="Objectives" show={stage >= 2}>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {a.objectives.map((o, i) => (
            <li key={o.id} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr auto', alignItems: 'baseline', gap: 10,
              animation: stage >= 2 ? `ac-stream .35s ease-out ${i * 0.08}s both` : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>0{i + 1}</span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{o.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{o.detail}</span>
            </li>
          ))}
        </ol>
      </Block>

      <Block label="Fallbacks" show={stage >= 3}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {a.fallbacks.map((f, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12,
              padding: '7px 10px', background: 'var(--paper)', borderRadius: 6,
              fontSize: 12.5, color: 'var(--ink-2)',
              animation: stage >= 3 ? `ac-stream .3s ease-out ${i * 0.06}s both` : 'none',
            }}>
              <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{f.trigger}</span>
              <span>{f.response}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block label="Extraction schema" show={stage >= 4}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
          background: 'var(--paper)', padding: '12px 14px', borderRadius: 8,
          color: 'var(--ink-2)',
        }}>
          <div style={{ color: 'var(--ink-3)' }}>{'{'}</div>
          {a.extraction.map((e, i) => (
            <div key={e.key} style={{
              paddingLeft: 16, display: 'flex', alignItems: 'baseline', gap: 8,
              animation: stage >= 4 ? `ac-stream .25s ease-out ${i * 0.06}s both` : 'none',
            }}>
              <span style={{ color: 'var(--ink)' }}>{e.key}</span>
              <span style={{ color: 'var(--ink-3)' }}>:</span>
              <span style={{ color: 'var(--accent-2)' }}>{e.type}</span>
              <span style={{ color: 'var(--ink-4)' }}>// {e.hint}</span>
            </div>
          ))}
          <div style={{ color: 'var(--ink-3)' }}>{'}'}</div>
        </div>
      </Block>

      <Block label="Closing" show={stage >= 5}>
        <p style={{
          margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 16, lineHeight: 1.5, color: 'var(--ink-2)',
        }}>&ldquo;{a.closing}&rdquo;</p>
      </Block>

      {stage < 5 && !frozen && <GenIndicator stage={stage} />}
    </div>
  );
}

function Block({ label, show, children }) {
  return (
    <section style={{ opacity: show ? 1 : 0.25 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{label}</span>
        {show && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sage)' }} />}
      </div>
      {children}
    </section>
  );
}

function GenIndicator({ stage }) {
  const labels = ['Reading the brief', 'Drafting the opening', 'Distilling objectives', 'Anticipating fallbacks', 'Inferring extraction schema'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: 'var(--paper)', borderRadius: 8,
      fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-2)',
      position: 'sticky', bottom: 0,
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: '50%',
        border: '2px solid var(--ink-4)', borderTopColor: 'var(--accent)',
        animation: 'ac-spin 0.9s linear infinite',
      }} />
      {labels[Math.min(stage, labels.length - 1)]}<span style={{ animation: 'ac-blink 1s infinite' }}>…</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 2. Contacts — CSV upload + table
// ──────────────────────────────────────────────────────────────────────
function ScreenContacts({ onNext, onBack, gotoStep }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="New campaign · step 2 of 3"
        title="Who should Ava call?"
        right={<StepRail current="contacts" onStep={gotoStep} />}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }} className="ac-scroll">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* CSV uploader */}
          <div style={{
            border: '1.5px dashed var(--border-2)', borderRadius: 12,
            padding: '22px 22px', display: 'flex', alignItems: 'center', gap: 18,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: 'var(--paper-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="upload" size={20} color="var(--ink-2)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Drop a CSV, or paste numbers</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                Phone column is required · other columns become template variables.
              </div>
            </div>
            <Button variant="ghost" size="sm">Choose file</Button>
          </div>

          {/* Quick stats */}
          <div style={{
            background: 'var(--paper-2)', borderRadius: 12, padding: '14px 18px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 12,
          }}>
            <Stat n="142" label="contacts" />
            <Stat n="3" label="duplicates removed" />
            <Stat n="2" label="on DNC · skipped" />
            <Stat n="137" label="will be called" tone="accent" />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--paper)', borderRadius: 12,
          boxShadow: 'inset 0 0 0 1px var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '24px 1.4fr 1.6fr 1.2fr 80px 110px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-3)',
          }}>
            <span></span>
            <span>Name</span>
            <span>Company</span>
            <span>Phone · E.164</span>
            <span>TZ</span>
            <span style={{ justifySelf: 'end' }}>Pre-flight</span>
          </div>
          {CONTACTS.slice(0, 9).map((c, i) => (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '24px 1.4fr 1.6fr 1.2fr 80px 110px',
              padding: '12px 16px', alignItems: 'center',
              borderBottom: i === 8 ? 'none' : '1px solid var(--border)',
              fontSize: 13,
            }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
              <span style={{ color: 'var(--ink)' }}>{c.name}</span>
              <span style={{ color: 'var(--ink-2)' }}>{c.company}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{c.phone}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{c.tz}</span>
              <span style={{ justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--sage)', fontFamily: 'var(--font-mono)' }}>
                <Icon name="check" size={11} /> valid
              </span>
            </div>
          ))}
          <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', background: 'var(--paper-2)' }}>
            …128 more contacts
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 28px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--paper)',
      }}>
        <Button variant="quiet" size="md" onClick={onBack}>← Back to brief</Button>
        <Button variant="primary" size="md" icon={<Icon name="arrow" size={13} />} onClick={onNext}>
          Next · launch settings
        </Button>
      </div>
    </div>
  );
}

function Stat({ n, label, tone }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500,
        color: tone === 'accent' ? 'var(--accent)' : 'var(--ink)',
        letterSpacing: '-0.01em', lineHeight: 1.05,
      }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 3. Launch — settings + estimated cost
// ──────────────────────────────────────────────────────────────────────
function ScreenLaunch({ onNext, onBack, gotoStep }) {
  const [mode, setMode] = React.useState('immediate');
  const [concurrency, setConcurrency] = React.useState(5);
  const [vmDrop, setVmDrop] = React.useState(true);
  const [attest, setAttest] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="New campaign · step 3 of 3"
        title="Launch settings"
        right={<StepRail current="launch" onStep={gotoStep} />}
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0, overflow: 'hidden' }}>
        {/* settings */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'auto', borderRight: '1px solid var(--border)' }} className="ac-scroll">
          <Field label="When" hint="Time-of-day rules apply per callee's local zone.">
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'immediate', label: 'Now', sub: 'within 60s' },
                { id: 'scheduled', label: 'Scheduled', sub: 'Tue · 9 AM local' },
                { id: 'drip',      label: 'Drip',      sub: 'spread over 48h' },
              ].map(o => (
                <button key={o.id} onClick={() => setMode(o.id)} style={{
                  flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  background: mode === o.id ? 'var(--ink)' : 'var(--paper-2)',
                  color: mode === o.id ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--font-ui)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</div>
                  <div style={{ fontSize: 11.5, color: mode === o.id ? 'var(--paper-3)' : 'var(--ink-3)', marginTop: 2 }}>{o.sub}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Calling window" hint="Honors local time at each contact's number.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <Pill>9:00 AM</Pill><span style={{ color: 'var(--ink-3)' }}>→</span><Pill>6:00 PM</Pill>
              <span style={{ color: 'var(--ink-3)' }}>·</span>
              <span style={{ color: 'var(--ink-2)' }}>Mon – Fri only</span>
            </div>
          </Field>

          <Field label="Concurrency" hint={`Up to ${concurrency} simultaneous calls. Higher = faster, more cost ramp.`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <input type="range" min={1} max={20} value={concurrency}
                onChange={(e) => setConcurrency(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--ink)', minWidth: 36, textAlign: 'right' }}>{concurrency}</span>
            </div>
          </Field>

          <Field label="Retries" hint="Re-attempts on no-answer.">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--ink-2)' }}>
              <Pill>Up to 3 attempts</Pill><Pill>4 hours apart</Pill>
            </div>
          </Field>

          <Field label="On voicemail">
            <Toggle on={vmDrop} onChange={setVmDrop}
              label="Leave a 18-second message" sub="Skipped on numbers flagged as personal mobile." />
          </Field>
        </div>

        {/* preflight & estimate */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--paper-2)', overflow: 'auto' }} className="ac-scroll">
          <SectionLabel>Pre-flight</SectionLabel>
          <Preflight items={[
            { ok: true, label: 'Brief approved · agent v3' },
            { ok: true, label: '137 contacts validated' },
            { ok: true, label: '2 DNC-listed numbers excluded' },
            { ok: true, label: 'Mandatory AI disclosure on' },
            { ok: !!attest, label: 'You attest you have consent to call these numbers', warn: !attest },
          ]} />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--paper)', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: 'var(--ink-2)' }}>
            <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} style={{ accentColor: 'var(--accent)', marginTop: 2 }} />
            <span>I attest these numbers have prior consent to be contacted, or fall under an exempt category. I've read the <u>acceptable use policy</u>.</span>
          </label>

          <div style={{ borderTop: '1px dashed var(--border-2)', paddingTop: 16 }}>
            <SectionLabel>Estimated cost</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--ink-2)' }}>137 calls × avg 3.2 min</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>438 min</span>
              <span style={{ color: 'var(--ink-2)' }}>Voice (Sage · ElevenLabs)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>$0.18/min</span>
              <span style={{ color: 'var(--ink-2)' }}>Platform fee</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>$0.04/min</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>Est. total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--ink)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>$96.36</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 10 }}>
              Charged per real minute, capped at the brief's max-length × contacts.
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 28px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--paper)',
      }}>
        <Button variant="quiet" size="md" onClick={onBack}>← Back to contacts</Button>
        <Button variant="accent" size="md" disabled={!attest}
          icon={<Icon name="phone" size={14} />} onClick={onNext}>
          Launch campaign · 137 calls
        </Button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8,
      }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '5px 10px', borderRadius: 6,
      background: 'var(--paper-2)', boxShadow: 'inset 0 0 0 1px var(--border)',
      fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)',
    }}>{children}</span>
  );
}

function Toggle({ on, onChange, label, sub }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <span style={{
        width: 36, height: 20, borderRadius: 999,
        background: on ? 'var(--accent)' : 'var(--paper-3)',
        position: 'relative', transition: 'background .15s',
        flex: '0 0 auto',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.15)',
        }} />
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span>
        <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>{sub}</span>}
      </span>
    </label>
  );
}

function Preflight({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          background: 'var(--paper)', borderRadius: 7,
          fontSize: 12.5, color: it.warn ? 'var(--amber)' : 'var(--ink-2)',
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%',
            background: it.ok ? 'var(--sage)' : it.warn ? 'var(--amber-soft)' : 'var(--paper-2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: it.ok ? 'var(--paper)' : 'var(--amber)',
            flex: '0 0 auto',
          }}>
            {it.ok ? <Icon name="check" size={11} /> : '!'}
          </span>
          {it.label}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  ScreenBrief, ScreenContacts, ScreenLaunch,
  AgentCard, Segmented, Pill, Toggle, ScreenHeader, StepRail,
});
