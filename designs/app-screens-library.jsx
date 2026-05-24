// app-screens-library.jsx — index/library screens for saved briefs,
// contact lists, and campaigns. These are reached from the sidebar (Library
// section), distinct from the wizard steps with similar names.

const SAVED_BRIEFS = [
  { id: 'b1', name: 'SMB accounting outreach',     agent: 'Ava',  persona: 'friendly', excerpt: "I'm selling accounting software to small businesses in the US. Please call the business, confirm you're speaking with someone who handles their books…", campaigns: 3, last: '2h ago', status: 'live' },
  { id: 'b2', name: 'Customer renewal check-in',   agent: 'Riley', persona: 'formal',   excerpt: "Reach out to existing customers about their upcoming renewal. Confirm satisfaction, NPS-style score, and any blockers to renewing…", campaigns: 1, last: '3d ago', status: 'idle' },
  { id: 'b3', name: 'Demo no-show reschedule',     agent: 'Theo', persona: 'concise',  excerpt: "Follow up with people who booked a demo but did not show. Be respectful of their time and offer two specific reschedule slots…", campaigns: 1, last: 'yesterday', status: 'idle' },
  { id: 'b4', name: 'Appointment reminder · dental', agent: 'Theo', persona: 'concise', excerpt: "Remind the patient of their appointment, confirm attendance, or reschedule. Keep it under 90 seconds. Acknowledge if it's a kid's appointment…", campaigns: 4, last: '12m ago', status: 'live' },
  { id: 'b5', name: 'Restaurant reservation survey', agent: 'Ava',  persona: 'friendly', excerpt: "Ask 5 questions about how the restaurant handles online reservations today, what they use, and what's broken…", campaigns: 0, last: '1w ago', status: 'draft' },
  { id: 'b6', name: 'Recruiting · backend SWE',     agent: 'Riley', persona: 'formal',   excerpt: "Pre-screen the candidate against 4 short questions. Confirm work authorization, years of backend experience, current comp band, and timeline…", campaigns: 2, last: '4d ago', status: 'idle' },
  { id: 'b7', name: 'NPS check · enterprise',       agent: 'Riley', persona: 'formal',   excerpt: "Ask the customer to rate their experience 0–10 and probe the reason. Politely end if they decline…", campaigns: 2, last: '1w ago', status: 'idle' },
];

const SAVED_LISTS = [
  { id: 'l1', name: 'Q2 SMB targets',           count: 142, last: '1h ago',  source: 'CSV · smb-q2.csv',      tags: ['accounting', 'us'],         clean: 137 },
  { id: 'l2', name: 'Existing customers · paid', count: 408, last: '2d ago',  source: 'HubSpot · auto-sync',   tags: ['renewals'],                 clean: 401 },
  { id: 'l3', name: 'Demo no-shows · last 30d', count: 12,  last: 'yesterday', source: 'Manual entry',          tags: ['hot'],                      clean: 12 },
  { id: 'l4', name: 'Backend SWE pipeline',     count: 48,  last: '1w ago',  source: 'CSV · greenhouse.csv',  tags: ['recruiting', 'engineering'], clean: 47 },
  { id: 'l5', name: 'Restaurant outreach · SF', count: 96,  last: '2w ago',  source: 'CSV · yelp-export.csv', tags: ['research'],                 clean: 92 },
];

const ALL_CAMPAIGNS = [
  { id: 'k1', name: 'Q2 SMB outreach',          brief: 'SMB accounting outreach', list: 'Q2 SMB targets', status: 'running',   contacts: 142, done: 38, started: '38m ago',   completion: 0.27 },
  { id: 'k2', name: 'Renewal check-ins · May',  brief: 'Customer renewal check-in', list: 'Existing customers · paid', status: 'scheduled', contacts: 64,  done: 0,  started: 'Tue 9:00 AM ET', completion: 0 },
  { id: 'k3', name: 'Demo no-shows · weekly',   brief: 'Demo no-show reschedule', list: 'Demo no-shows · last 30d', status: 'draft',     contacts: 12,  done: 0,  started: '—', completion: 0 },
  { id: 'k4', name: 'Dental reminders · daily', brief: 'Appointment reminder · dental', list: 'Patients · Tue', status: 'running',   contacts: 26,  done: 24, started: '2h ago',     completion: 0.92 },
  { id: 'k5', name: 'Backend SWE screens',      brief: 'Recruiting · backend SWE', list: 'Backend SWE pipeline', status: 'paused',    contacts: 48,  done: 17, started: '1d ago',     completion: 0.35 },
];

// ──────────────────────────────────────────────────────────────────────
// Briefs library — saved briefs as cards
// ──────────────────────────────────────────────────────────────────────
function ScreenBriefsLibrary({ onNew, onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="Library · briefs"
        title="Your briefs"
        right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchInput placeholder="Search briefs" />
          <Button variant="primary" size="sm" icon={<Icon name="plus" size={12} />} onClick={onNew}>New brief</Button>
        </div>}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 32px' }} className="ac-scroll">
        <FilterBar items={['All', 'Live', 'Idle', 'Drafts', 'Recent']} active="All" />

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14, marginTop: 16,
        }}>
          {SAVED_BRIEFS.map(b => (
            <button key={b.id} onClick={() => onOpen && onOpen(b.id)} style={{
              textAlign: 'left', border: 'none', cursor: 'pointer',
              background: 'var(--paper)', borderRadius: 12,
              padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10,
              boxShadow: 'inset 0 0 0 1px var(--border)',
              fontFamily: 'var(--font-ui)', color: 'var(--ink)',
              transition: 'box-shadow .15s, transform .08s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--border-2), 0 4px 16px rgba(0,0,0,.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--border)'; }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: b.status === 'live' ? 'var(--accent)' : b.status === 'draft' ? 'var(--paper-3)' : 'var(--ink)',
                    color: b.status === 'draft' ? 'var(--ink-2)' : 'var(--paper)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, fontWeight: 500,
                  }}>{b.agent[0]}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}>{b.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                      {b.agent} · {b.persona}
                    </div>
                  </div>
                </div>
                {b.status === 'live' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'ac-blink 1.4s infinite' }} />
                  in use
                </span>}
                {b.status === 'draft' && <Tag tone="outline">draft</Tag>}
              </div>

              <p style={{
                margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>"{b.excerpt}"</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                <span>{b.campaigns} campaign{b.campaigns === 1 ? '' : 's'}</span>
                <span>· {b.last}</span>
              </div>
            </button>
          ))}

          {/* New brief tile */}
          <button onClick={onNew} style={{
            border: '1.5px dashed var(--border-2)', background: 'transparent',
            borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: 'var(--ink-2)', minHeight: 180,
          }}>
            <span style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--paper-2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="plus" size={16} color="var(--ink-2)" /></span>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>New brief</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Describe a conversation in plain English</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Contacts library — saved contact lists
// ──────────────────────────────────────────────────────────────────────
function ScreenContactsLibrary({ onNew, onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="Library · contact lists"
        title="Your contact lists"
        right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchInput placeholder="Search lists" />
          <Button variant="primary" size="sm" icon={<Icon name="upload" size={12} />} onClick={onNew}>Upload CSV</Button>
        </div>}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 32px' }} className="ac-scroll">
        <FilterBar items={['All', 'CSV uploads', 'CRM-synced', 'Manual']} active="All" />

        <div style={{
          background: 'var(--paper)', borderRadius: 12, marginTop: 16,
          boxShadow: 'inset 0 0 0 1px var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 100px 1.4fr 1.4fr 90px 24px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-3)',
          }}>
            <span>List</span><span>Contacts</span><span>Source</span><span>Tags</span><span>Updated</span><span></span>
          </div>
          {SAVED_LISTS.map((l, i) => (
            <button key={l.id} onClick={() => onOpen && onOpen(l.id)} style={{
              display: 'grid', gridTemplateColumns: '2fr 100px 1.4fr 1.4fr 90px 24px',
              width: '100%', padding: '14px 16px', alignItems: 'center', border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              borderBottom: i === SAVED_LISTS.length - 1 ? 'none' : '1px solid var(--border)',
              fontSize: 13.5, color: 'var(--ink)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--paper-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="list" size={14} color="var(--ink-3)" />
                <span style={{ fontWeight: 500 }}>{l.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                {l.count.toLocaleString()}
                {l.clean !== l.count && <span style={{ color: 'var(--ink-3)' }}> · {l.clean} clean</span>}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-2)' }}>{l.source}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {l.tags.map(t => <Tag key={t} tone="outline">{t}</Tag>)}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{l.last}</span>
              <Icon name="chev" size={14} color="var(--ink-4)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Campaigns list — all campaigns
// ──────────────────────────────────────────────────────────────────────
function ScreenCampaignsList({ onOpen, onNew }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScreenHeader
        eyebrow="Now · campaigns"
        title="Campaigns"
        right={<Button variant="primary" size="sm" icon={<Icon name="plus" size={12} />} onClick={onNew}>New campaign</Button>}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 32px' }} className="ac-scroll">
        <FilterBar items={['All', 'Running', 'Scheduled', 'Paused', 'Draft', 'Complete']} active="All" />

        <div style={{
          background: 'var(--paper)', borderRadius: 12, marginTop: 16,
          boxShadow: 'inset 0 0 0 1px var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1.4fr 110px 1.4fr 120px 24px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-3)',
          }}>
            <span>Campaign</span><span>Brief</span><span>List</span><span>Status</span><span>Progress</span><span>Started</span><span></span>
          </div>
          {ALL_CAMPAIGNS.map((c, i) => (
            <button key={c.id} onClick={() => onOpen && onOpen(c.id)} style={{
              display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1.4fr 110px 1.4fr 120px 24px',
              width: '100%', padding: '14px 16px', alignItems: 'center', border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              borderBottom: i === ALL_CAMPAIGNS.length - 1 ? 'none' : '1px solid var(--border)',
              fontSize: 13.5, color: 'var(--ink)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--paper-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.brief}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.list}</span>
              <CampaignStatus s={c.status} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(c.done / c.contacts) * 100}%`, height: '100%',
                      background: c.status === 'running' ? 'var(--accent)' : 'var(--ink-2)',
                    }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', minWidth: 58, textAlign: 'right' }}>
                    {c.done}/{c.contacts}
                  </span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{c.started}</span>
              <Icon name="chev" size={14} color="var(--ink-4)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignStatus({ s }) {
  const map = {
    running:   { dot: 'var(--accent)', label: 'Running',   blink: true,  bg: 'var(--accent-soft)' },
    scheduled: { dot: 'var(--slate)',  label: 'Scheduled', bg: 'var(--slate-soft)' },
    paused:    { dot: 'var(--amber)',  label: 'Paused',    bg: 'var(--amber-soft)' },
    draft:     { dot: 'var(--ink-3)',  label: 'Draft',     bg: 'transparent' },
    complete:  { dot: 'var(--sage)',   label: 'Complete',  bg: 'var(--sage-soft)' },
  };
  const x = map[s] || map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px 3px 6px', borderRadius: 999, background: x.bg,
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.dot, animation: x.blink ? 'ac-blink 1.4s infinite' : 'none' }} />
      {x.label}
    </span>
  );
}

// Shared bits ──────────────────────────────────────────────────────
function SearchInput({ placeholder }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 7,
      background: 'var(--paper-2)', boxShadow: 'inset 0 0 0 1px var(--border)',
      fontSize: 12.5, color: 'var(--ink-3)',
    }}>
      <Icon name="eye" size={12} color="var(--ink-3)" />
      <input placeholder={placeholder} style={{
        background: 'transparent', border: 'none', outline: 'none',
        fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink)', width: 140,
      }} />
    </div>
  );
}

function FilterBar({ items, active }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map(it => (
        <button key={it} style={{
          padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: it === active ? 'var(--ink)' : 'transparent',
          color: it === active ? 'var(--paper)' : 'var(--ink-2)',
          boxShadow: it === active ? 'none' : 'inset 0 0 0 1px var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
        }}>{it}</button>
      ))}
    </div>
  );
}

Object.assign(window, {
  ScreenBriefsLibrary, ScreenContactsLibrary, ScreenCampaignsList,
  SAVED_BRIEFS, SAVED_LISTS, ALL_CAMPAIGNS,
  SearchInput, FilterBar, CampaignStatus,
});
