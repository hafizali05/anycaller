// app-canvas.jsx — top-level canvas composition + tweaks + mount

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "sepia",
  "accent": "#d94a2a",
  "density": "regular",
  "showLive": true
}/*EDITMODE-END*/;

function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + accent on the document root so the cascade hits everything,
  // including artboards rendered into separate React roots.
  React.useEffect(() => {
    const r = document.documentElement;
    if (t.theme === 'dark')      r.setAttribute('data-theme', 'dark');
    else if (t.theme === 'cream') r.setAttribute('data-theme', 'cream');
    else r.removeAttribute('data-theme');
    r.setAttribute('data-density', t.density);
    r.style.setProperty('--accent', t.accent);
    // accent-2 ≈ 15% darker. Quick approximation: keep accent-soft alpha-based on accent.
    r.style.setProperty('--accent-soft', t.accent + '1f');
  }, [t.theme, t.accent, t.density]);

  return (
    <React.Fragment>
      <DesignCanvas>

        <DCSection id="brand" title="any/call" subtitle="Voice-forward AI dialer for non-developers — design system & primer">
          <DCArtboard id="primer" label="Primer · system at a glance" width={1280} height={620}>
            <Primer />
          </DCArtboard>
        </DCSection>

        <DCSection id="proto" title="Prototype" subtitle="The full app — click around. Sidebar + 6 routes wired together.">
          <DCArtboard id="app-live" label="any/call · interactive" width={1320} height={840}>
            <App initialRoute="live" />
          </DCArtboard>
        </DCSection>

        <DCSection id="moments" title="Hero moments" subtitle="The defining frames — pulled out so they can be sweated on their own.">
          <DCArtboard id="brief" label="A · Brief → agent (the magic moment)" width={1100} height={680}>
            <BriefMoment />
          </DCArtboard>
          <DCArtboard id="live" label="B · Live call (waveform hero)" width={1100} height={680}>
            <LiveCallMoment />
          </DCArtboard>
          <DCArtboard id="result" label="C · Result · extracted data" width={900} height={680}>
            <ResultMoment />
          </DCArtboard>
          <DCArtboard id="rehearsal" label="D · Rehearsal · talk to your agent" width={760} height={680}>
            <ScreenRehearsalWrapped />
          </DCArtboard>
          <DCArtboard id="empty" label="E · First-run · empty state" width={760} height={680}>
            <EmptyMoment />
          </DCArtboard>
        </DCSection>

      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme}
          options={['sepia', 'cream', 'dark']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#d94a2a', '#2a6fdb', '#1f8a5b', '#7a5ae0', '#1a1714']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Density" />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

// Rehearsal needs a back-button; in the moment it's standalone, so wrap with a no-op back.
function ScreenRehearsalWrapped() {
  return <ScreenRehearsal onBack={() => {}} />;
}

// Mount
const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(<Root />);
