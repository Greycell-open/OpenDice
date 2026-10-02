import { parseDiceNotation } from "@open-dice/dice-notation";
import { type MotorRoll, type RollResult, rollWithMotor } from "@open-dice/dice-engine";
import { Component, lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import { decodeHistory, encodeHistory, HISTORY_KEY, HISTORY_LIMIT } from './lib/history';
import { hasWebGL, WebGLHelp } from './dice3d/webgl';

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];
const SOURCE_URL = "https://github.com/Greycell-open/OpenDice";
const NAV_PAGES = ["home", "roll", "print", "docs", "about"] as const;
const MotorDiceScene = lazy(() => import('./dice3d/MotorDiceScene').then((module) => ({ default: module.MotorDiceScene })));
const WEBGL = hasWebGL();

type Page = (typeof NAV_PAGES)[number];

function App() {
  const [page, setPage] = useState<Page>("roll");
  const [formula, setFormula] = useState("1d20");
  // The model is on show before the first roll: a d20 at rest on the tray.
  const [motorRoll, setMotorRoll] = useState<MotorRoll>(() => rollWithMotor({ count: 1, sides: 20, formula: "1d20" }, { seed: 'preview' }));
  const [hasRolled, setHasRolled] = useState(false);
  const [result, setResult] = useState<RollResult>(motorRoll.result);
  const [history, setHistory] = useState<RollResult[]>(() => {
    try { return decodeHistory(localStorage.getItem(HISTORY_KEY)); } catch { return []; }
  });
  const [clearedHistory, setClearedHistory] = useState<RollResult[] | null>(null);
  const [storageNotice, setStorageNotice] = useState('');
  const [error, setError] = useState("");
  const [rollKey, setRollKey] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, encodeHistory(history));
      setStorageNotice('');
    } catch {
      setStorageNotice('Browser storage is unavailable. History is kept for this visit only.');
    }
  }, [history]);

  function commitRoll(next: MotorRoll) {
    setHasRolled(true);
    setMotorRoll(next);
    setResult(next.result);
    setHistory((items) => [next.result, ...items].slice(0, HISTORY_LIMIT));
    setClearedHistory(null);
    setRollKey((value) => value + 1);
    setError("");
  }

  function rollFormula(nextFormula = formula) {
    try {
      const next = rollWithMotor(parseDiceNotation(nextFormula));
      setFormula(next.result.formula);
      commitRoll(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not parse that roll.");
    }
  }

  function quickRoll(sides: number) {
    const next = rollWithMotor({ count: 1, sides });
    setFormula(next.result.formula);
    commitRoll(next);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("home")} type="button" aria-label="Open Dice home">
          <img className="brand-mark" src="./icon-192.png" alt="" width={44} height={44} />
          <span>
            <strong>Open Dice</strong>
            <small>Tabletop tools, openly made</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          {NAV_PAGES.map((item) => (
            <button
              aria-current={page === item ? "page" : undefined}
              className={page === item ? "active" : ""}
              key={item}
              onClick={() => setPage(item)}
              type="button"
            >
              {labelForPage(item)}
            </button>
          ))}
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        {page === "home" && <HomePage onStart={() => setPage("roll")} />}
        {page === "roll" && (
          <RollPage
            error={error}
            formula={formula}
            history={history}
            onFormulaChange={(value) => { setFormula(value); setError(''); }}
            onQuickRoll={quickRoll}
            onRoll={rollFormula}
            onPreset={rollFormula}
            onClearHistory={() => { setClearedHistory(history); setHistory([]); }}
            onUndoClear={clearedHistory ? () => { setHistory(clearedHistory); setClearedHistory(null); } : undefined}
            storageNotice={storageNotice}
            hasRolled={hasRolled}
            prefersReducedMotion={prefersReducedMotion}
            motorRoll={motorRoll}
            result={result}
            rollKey={rollKey}
          />
        )}
        {page === "print" && <PrintPage />}
        {page === "docs" && <DocsPage />}
        {page === "about" && <AboutPage />}
      </main>

      <footer className="site-footer">
        <span>Open Dice by Zein Alaouie · Code MIT, dice models CC BY 4.0 · <a href={SOURCE_URL} target="_blank" rel="noreferrer noopener">Source on GitHub ↗</a></span>
        <span>Local rolls · No account · No tracking</span>
      </footer>
    </div>
  );
}

function labelForPage(page: Page) {
  return page.charAt(0).toUpperCase() + page.slice(1);
}

function HomePage({ onStart }: { onStart: () => void }) {
  return (
    <section className="hero-panel page-surface">
      <div className="hero-copy">
        <p className="eyebrow">Open-source tabletop tools</p>
        <h1>Every throw, clearly yours.</h1>
        <p className="hero-lede">
          A precise dice roller with transparent results, tactile 3D presentation, private local history,
          and maker-friendly model sources.
        </p>
        <div className="hero-actions">
          <button className="primary-action" onClick={onStart} type="button">Open the roller</button>
          <a className="source-link" href={SOURCE_URL} target="_blank" rel="noreferrer noopener">Source on GitHub ↗</a>
          <span>No sign-in. Nothing uploaded.</span>
        </div>
      </div>
      <div className="hero-card" aria-label="Open Dice capabilities">
        <div className="hero-die" aria-hidden="true">20</div>
        <div>
          <p className="eyebrow">Result first</p>
          <strong>2d20kh1 + 5</strong>
          <span>Readable notation. Auditable rolls. Matching 3D faces.</span>
        </div>
      </div>
      <div className="feature-grid hero-features">
        <FeatureCard index="01" title="Roll with confidence">The text result is always authoritative, even when 3D is unavailable.</FeatureCard>
        <FeatureCard index="02" title="Keep it private">Your latest 50 rolls stay in this browser and are never uploaded.</FeatureCard>
        <FeatureCard index="03" title="Make your own">Parametric OpenSCAD sources and honest printing notes are included.</FeatureCard>
      </div>
    </section>
  );
}

function RollPage(props: {
  error: string;
  formula: string;
  history: RollResult[];
  onFormulaChange: (value: string) => void;
  onQuickRoll: (sides: number) => void;
  onRoll: () => void;
  onPreset: (formula: string) => void;
  onClearHistory: () => void;
  onUndoClear?: () => void;
  storageNotice: string;
  hasRolled: boolean;
  prefersReducedMotion: boolean;
  motorRoll: MotorRoll;
  result: RollResult;
  rollKey: number;
}) {
  return (
    <section className="roller-layout page-surface" aria-labelledby="roller-title">
      <div className={`roll-stage${props.hasRolled ? ' has-result' : ''}`}>
        <div className="stage-heading">
          <div className="result-summary">
            <p className="eyebrow" id="roller-title">Your roll</p>
            {props.hasRolled
              ? <h1>{props.result.total}</h1>
              : <h1 className="result-waiting">Ready</h1>}
            <div className="result-meta">
              <span className="formula-chip">{props.hasRolled ? props.result.formula : 'Ready to roll'}</span>
              <span className="local-chip">Local session</span>
            </div>
          </div>
          <button className="stage-roll-button" onClick={() => props.onRoll()} type="button">
            {props.hasRolled ? 'Roll again' : 'Roll now'}
          </button>
        </div>

        {WEBGL ? (
          <PreviewBoundary>
            <Suspense fallback={<div className="empty-roll">Loading the 3D dice…{props.hasRolled ? ' Your result is ready.' : ''}</div>}>
              <MotorDiceScene
                idle={!props.hasRolled}
                motorRoll={props.motorRoll}
                reducedMotion={props.prefersReducedMotion}
                result={props.result}
                rollKey={props.rollKey}
              />
            </Suspense>
          </PreviewBoundary>
        ) : <WebGLHelp />}

        {props.hasRolled && (
          <div className="dice-results" aria-label="Individual dice">
            {props.result.dice[0].rolls.map((value, index) => {
              const kept = props.result.dice[0].keptIndices.includes(index);
              return (
                <span
                  key={index}
                  className={`result-die${kept ? '' : ' dropped'}`}
                  aria-label={`Die ${index + 1}: ${value}, ${kept ? 'kept' : 'dropped'}`}
                >
                  <small>d{props.result.dice[0].sides}</small>
                  <strong>{value}</strong>
                  <small>{kept ? 'Kept' : 'Dropped'}</small>
                </span>
              );
            })}
          </div>
        )}
        <p aria-live="polite" aria-atomic="true" className="breakdown">
          {props.hasRolled ? props.result.breakdown : 'Your rolls stay on this device.'}
        </p>
      </div>

      <aside className="roll-controls" aria-label="Roll controls">
        <section className="panel formula-panel">
          <div className="panel-label"><span>01</span><h2>Roll formula</h2></div>
          <div className="formula-row">
            <input
              aria-label="Dice formula"
              aria-describedby={props.error ? 'formula-help formula-error' : 'formula-help'}
              aria-invalid={Boolean(props.error)}
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="text"
              onChange={(event) => props.onFormulaChange(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") props.onRoll(); }}
              spellCheck={false}
              value={props.formula}
            />
            <button onClick={() => props.onRoll()} type="button">Roll</button>
          </div>
          <p className="help-text" id="formula-help">Try 2d6+3, 2d20kh1, or 4d6dl1. Use kh/kl to keep and dh/dl to drop.</p>
          {props.error && <p className="error-text" id="formula-error" role="alert">{props.error}</p>}
        </section>

        <section className="panel quick-panel">
          <div className="panel-label"><span>02</span><h2>Quick dice</h2></div>
          <div className="quick-grid">
            {QUICK_DICE.map((sides) => (
              <button key={sides} onClick={() => props.onQuickRoll(sides)} type="button" aria-label={`Roll a d${sides}`}>
                <small>Roll</small><strong>d{sides}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="panel preset-panel">
          <div className="panel-label"><span>03</span><h2>Tabletop shortcuts</h2></div>
          <div className="preset-grid">
            <button type="button" onClick={() => props.onPreset('2d20kh1')}><span>Advantage</span><small>2d20kh1</small></button>
            <button type="button" onClick={() => props.onPreset('2d20kl1')}><span>Disadvantage</span><small>2d20kl1</small></button>
            <button type="button" onClick={() => props.onPreset('4d6dl1')}><span>Ability score</span><small>4d6dl1</small></button>
          </div>
          <p className="help-text">Shortcuts roll immediately. Edit the formula first when you need a modifier.</p>
        </section>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div className="panel-label"><span>04</span><h2>History <small>({props.history.length})</small></h2></div>
            {props.history.length > 0 && <button className="text-action" type="button" onClick={props.onClearHistory}>Clear</button>}
          </div>
          <p className="help-text">Your last 50 rolls in this browser. Reroll creates a new throw.</p>
          {props.storageNotice && <p role="status" className="notice-text">{props.storageNotice}</p>}
          {props.onUndoClear && <button className="undo-action" type="button" onClick={props.onUndoClear}>Undo clear</button>}
          {!props.history.length && <div className="empty-history">No rolls yet. Your next result will appear here.</div>}
          <ol>
            {props.history.map((item, index) => (
              <li key={`${item.formula}-${index}`}>
                <div className="history-copy">
                  <span>{item.formula}</span>
                  <small className="history-breakdown">{item.breakdown}</small>
                </div>
                <strong className="history-total">{item.total}</strong>
                <button className="text-action" type="button" aria-label={`Reroll ${item.formula}`} onClick={() => props.onPreset(item.formula)}>Reroll</button>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </section>
  );
}

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <WebGLHelp /> : this.props.children;
  }
}

function PrintPage() {
  return (
    <ContentPage eyebrow="Maker library" title="Printable dice, built in the open"
      intro="Versioned OpenSCAD sources give makers a transparent starting point. The library is honest about what is ready to inspect and what still needs physical validation.">
      <div className="feature-grid">
        <FeatureCard index="01" title="Calibration d6">Tune scale, dimensions, and engraving before committing to a full set.</FeatureCard>
        <FeatureCard index="02" title="Basic d6">A parametric numbered cube source for adapting size and engraving depth.</FeatureCard>
        <FeatureCard index="03" title="Basic d20">An editable icosahedral source with number engraving still awaiting face validation.</FeatureCard>
      </div>
      <div className="truth-note"><strong>Editable sources</strong><span>All six dice (d4 to d20) are on GitHub, made from the roller's own geometry: OpenSCAD files with engraved numbers you can resize and restyle, OBJ for Blender, STL and a face map. See <a href={SOURCE_URL + "/tree/main/packages/dice-models"} target="_blank" rel="noreferrer noopener">packages/dice-models</a>. They are by Zein Alaouie under CC BY 4.0: remix them and sell prints, with credit. They have not been test-printed yet, so print a small one first.</span></div>
    </ContentPage>
  );
}

function DocsPage() {
  return (
    <ContentPage eyebrow="Documentation" title="Powerful notation, readable results"
      intro="Open Dice keeps notation, roll logic, presentation, and saved history separate so every layer can be tested and understood.">
      <div className="docs-grid">
        <section className="docs-card"><p className="eyebrow">Core rolls</p><h2>d20 · 2d6+3 · d%</h2><p>Roll up to 100 dice with 2 to 1,000 sides, plus a positive or negative modifier.</p></section>
        <section className="docs-card"><p className="eyebrow">Keep and drop</p><h2>kh · kl · dh · dl</h2><p>Use 2d20kh1 for advantage, 2d20kl1 for disadvantage, or 4d6dl1 for ability scores.</p></section>
        <section className="docs-card"><p className="eyebrow">Result-first 3D</p><h2>One truth, two views</h2><p>The official text result drives the matching die face. Unsupported shapes fall back to text instead of faking geometry.</p></section>
        <section className="docs-card"><p className="eyebrow">Local history</p><h2>50 recent rolls</h2><p>Results stay in this browser. Clear can be undone until your next roll or page reload.</p></section>
      </div>
      <div className="truth-note"><strong>3D scope</strong><span>The scene previews the first die. Percentile uses tens and ones. Full multi-die choreography and collision physics remain future work.</span></div>
    </ContentPage>
  );
}

function AboutPage() {
  return (
    <ContentPage eyebrow="Open source" title="Dice tools without the casino"
      intro="Open Dice is made for tabletop games, education, probability experiments, collectors, makers, and developers.">
      <div className="feature-grid">
        <FeatureCard index="01" title="Transparent by design">The engine, parser, motor, interface, and model sources are separated and testable.</FeatureCard>
        <FeatureCard index="02" title="Private by default">There are no accounts, uploads, ads, payments, or tracking services.</FeatureCard>
        <FeatureCard index="03" title="Made to extend">MIT-licensed code and CC BY 4.0 dice models: build on them, remix them, sell prints, and credit the author.</FeatureCard>
      </div>
      <div className="principles-row"><span>Tabletop first</span><span>Accessible results</span><span>Maker friendly</span><span>Open source</span></div>
      <div className="truth-note"><strong>Read the code</strong><span>Open Dice is by Zein Alaouie. The code is MIT and the dice models are CC BY 4.0, so anyone sharing a model, a remix or prints credits "Dice model by Zein Alaouie (Open Dice)". Everything is on <a href={SOURCE_URL} target="_blank" rel="noreferrer noopener">github.com/Greycell-open/OpenDice</a>; issues and pull requests are welcome.</span></div>
    </ContentPage>
  );
}

function ContentPage({ eyebrow, title, intro, children }: {
  eyebrow: string; title: string; intro: string; children: ReactNode;
}) {
  return (
    <section className="content-page page-surface">
      <div className="content-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
    </section>
  );
}

function FeatureCard({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <article className="feature-card">
      <span>{index}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </article>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const onChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

export default App;
