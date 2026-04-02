import { useState, useEffect, useRef, useCallback } from "react";

/* ── FONTS & BASE CSS ─────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080a10;
    --bg2: #0d1018;
    --gold: #c8a96e;
    --gold2: #e2c99a;
    --gold-dim: rgba(200,169,110,0.18);
    --text: #e8e0d4;
    --muted: #6e6e7e;
    --dim: #3a3a4a;
    --rose: #c47a85;
    --ice: #7aafc4;
    --border: rgba(200,169,110,0.14);
    --border2: rgba(200,169,110,0.32);
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); overflow-x: hidden; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); opacity:.4; }

  .display { font-family: 'Cormorant Garamond', serif; }
  .body-text { font-family: 'Crimson Pro', serif; }
  .mono { font-family: 'DM Mono', monospace; }

  /* PROGRESS BAR */
  #progress-bar {
    position: fixed; top: 0; left: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--gold2));
    z-index: 100; transition: width .1s linear;
    box-shadow: 0 0 8px rgba(200,169,110,.5);
  }

  /* CHAPTER NAV */
  #chapter-nav {
    position: fixed; right: 2rem; top: 50%;
    transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 1.2rem;
    z-index: 90;
  }
  .ch-dot {
    width: 6px; height: 6px; border-radius: 50%;
    border: 1px solid var(--gold);
    cursor: pointer; transition: all .3s;
    background: transparent; position: relative;
  }
  .ch-dot.active { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
  .ch-dot:hover { background: var(--gold-dim); }
  .ch-dot-label {
    position: absolute; right: 1.4rem; top: 50%;
    transform: translateY(-50%);
    font-family: 'DM Mono', monospace; font-size: .6rem;
    color: var(--gold); white-space: nowrap; opacity: 0;
    transition: opacity .2s; pointer-events: none;
    letter-spacing: .08em;
  }
  .ch-dot:hover .ch-dot-label { opacity: 1; }

  /* SECTIONS */
  .chapter {
    min-height: 100vh; position: relative;
    display: flex; flex-direction: column; justify-content: center;
    padding: 8rem 6rem 6rem;
  }
  @media (max-width: 800px) { .chapter { padding: 6rem 2rem 4rem; } }

  /* REVEAL ANIMATIONS */
  .reveal {
    opacity: 0; transform: translateY(28px);
    transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-left {
    opacity: 0; transform: translateX(-28px);
    transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1);
  }
  .reveal-left.visible { opacity: 1; transform: translateX(0); }

  /* CHAPTER LABEL */
  .ch-label {
    font-family: 'DM Mono', monospace; font-size: .62rem;
    letter-spacing: .25em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 1.2rem; display: block;
    opacity: .75;
  }

  /* DIVIDER */
  .divider {
    display: flex; align-items: center; gap: 1.5rem;
    margin: 3rem 0; opacity: .3;
  }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider span { font-family: 'DM Mono', monospace; font-size: .6rem; color: var(--gold); letter-spacing: .2em; }

  /* TIMELINE */
  .timeline { position: relative; padding-left: 2.5rem; }
  .timeline::before {
    content: ''; position: absolute; left: 0; top: .6rem; bottom: 0;
    width: 1px; background: linear-gradient(to bottom, var(--gold), transparent);
  }
  .tl-item { position: relative; padding-bottom: 3rem; }
  .tl-item::before {
    content: ''; position: absolute; left: -2.8rem; top: .5rem;
    width: .7rem; height: .7rem; border-radius: 50%;
    background: var(--gold); border: 2px solid var(--bg);
    box-shadow: 0 0 8px rgba(200,169,110,.4);
  }

  /* WRITING ROW */
  .wr-row {
    display: flex; align-items: baseline; gap: 1.5rem;
    padding: 1.3rem 0; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: all .22s;
  }
  .wr-row:hover { padding-left: .8rem; }
  .wr-row:hover .wr-num { color: var(--gold); }

  /* GOAL */
  .goal-item {
    display: flex; align-items: flex-start; gap: 1rem;
    padding: 1rem 1.2rem; border: 1px solid var(--border);
    background: rgba(200,169,110,.03); cursor: pointer;
    transition: all .25s; margin-bottom: .5rem;
  }
  .goal-item:hover { border-color: var(--border2); transform: translateX(4px); }
  .goal-item.done { opacity: .45; }
  .goal-circle {
    width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%;
    border: 1px solid var(--gold); display: flex; align-items: center;
    justify-content: center; font-size: .58rem; color: var(--gold);
    margin-top: 3px; transition: background .2s;
  }
  .goal-item.done .goal-circle { background: rgba(200,169,110,.25); }

  /* TAG */
  .tag {
    display: inline-block; padding: .2rem .7rem;
    border: 1px solid rgba(200,169,110,.25); font-size: .6rem;
    letter-spacing: .12em; text-transform: uppercase; color: var(--gold);
    background: rgba(200,169,110,.04); margin: .2rem .2rem 0 0;
    font-family: 'DM Mono', monospace;
  }

  /* CURSOR GLOW */
  #cursor-glow {
    position: fixed; width: 300px; height: 300px;
    border-radius: 50%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(200,169,110,.05) 0%, transparent 70%);
    transform: translate(-50%, -50%); transition: all .15s ease;
  }

  /* QUOTE */
  .blockquote {
    border-left: 2px solid var(--gold); padding: 1.2rem 2rem;
    background: rgba(200,169,110,.04); margin: 2rem 0;
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 1.1rem; color: #bfb8ac; line-height: 1.9;
  }

  /* CARD */
  .card {
    background: var(--bg2); border: 1px solid var(--border);
    padding: 1.8rem; transition: all .3s; position: relative; overflow: hidden;
  }
  .card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(200,169,110,.04), transparent);
    opacity: 0; transition: opacity .3s;
  }
  .card:hover { border-color: var(--border2); box-shadow: 0 12px 40px rgba(0,0,0,.4); }
  .card:hover::after { opacity: 1; }

  /* BTN */
  .btn {
    display: inline-block; padding: .65rem 1.8rem;
    font-family: 'DM Mono', monospace; font-size: .62rem;
    letter-spacing: .16em; text-transform: uppercase;
    border: 1px solid var(--gold); color: var(--gold);
    background: transparent; cursor: pointer; transition: all .28s;
    text-decoration: none;
  }
  .btn:hover { background: var(--gold); color: var(--bg); }
  .btn.solid { background: var(--gold); color: var(--bg); }
  .btn.solid:hover { background: var(--gold2); }

  /* TYPEWRITER CURSOR */
  .cursor-blink {
    display: inline-block; width: 2px; height: 1em;
    background: var(--gold); animation: blink 1s step-end infinite;
    vertical-align: text-bottom; margin-left: 2px;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* STARS */
  #starfield { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

  /* GRAIN OVERLAY */
  body::after {
    content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none;
    opacity: .025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  /* SECTION TITLE */
  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3rem, 7vw, 6rem);
    font-weight: 300; line-height: 1; color: var(--text);
  }
  .section-title em { font-style: italic; color: var(--gold2); }

  /* COORDINATE */
  .coord {
    font-family: 'DM Mono', monospace; font-size: .58rem;
    color: var(--muted); letter-spacing: .15em; margin-top: .5rem;
  }

  /* SCROLL HINT */
  @keyframes scrollBounce {
    0%,100% { transform: translateY(0); opacity:.6; }
    50% { transform: translateY(6px); opacity:1; }
  }
  .scroll-hint { animation: scrollBounce 2s ease infinite; }
`;

/* ── DATA ─────────────────────────────────────────────── */
const GOALS = [
  "Advance research in dynamical systems applied to neuroscience",
  "Publish consistently on Substack — Ink and All Things",
  "Make meaningful progress on Manuscript I (finish editing)",
  "Develop Manuscript II with intention",
  "Continue volunteering at Canil e Gatil de Monsanto",
  "Read more books than last year",
  "Travel somewhere completely new",
  "Finish or significantly progress the Book of Poems",
  "Submit at least one academic paper or report",
  "Deepen knowledge in computational neuroscience",
];

const CHAPTERS = [
  { id: "prologue", label: "Prologue" },
  { id: "ch1", label: "I · The Scientist" },
  { id: "ch2", label: "II · The Laboratory" },
  { id: "ch3", label: "III · The Field" },
  { id: "ch4", label: "IV · The Page" },
  { id: "ch5", label: "V · The Horizon" },
  { id: "epilogue", label: "Epilogue" },
];

/* ── TYPEWRITER ───────────────────────────────────────── */
function Typewriter({ text, delay = 0, speed = 28 }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) { setDone(true); return; }
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="cursor-blink" />}
    </span>
  );
}

/* ── REVEAL WRAPPER ───────────────────────────────────── */
function Reveal({ children, delay = 0, direction = "up", style = {} }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    const cls = direction === "left" ? "reveal-left" : "reveal";
    el.classList.add(cls);
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [direction]);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</div>;
}

/* ── STARFIELD ────────────────────────────────────────── */
function Starfield() {
  const canvasRef = useRef();
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let W, H, stars = [], raf;
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    const init = () => {
      stars = Array.from({ length: Math.floor(W * H / 4500) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2, a: Math.random(),
        t: Math.random() * Math.PI * 2, ts: Math.random() * 0.012 + 0.003,
        depth: Math.random() * 0.8 + 0.2,
      }));
    };
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.t += s.ts;
        const alpha = (Math.sin(s.t) * 0.3 + 0.7) * s.a;
        const yy = ((s.y - scrollY * s.depth * 0.06) % H + H) % H;
        ctx.beginPath(); ctx.arc(s.x, yy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,220,${alpha})`; ctx.fill();
        if (s.r > 1) {
          ctx.beginPath(); ctx.arc(s.x, yy, s.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,169,110,${alpha * 0.06})`; ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    window.addEventListener("resize", () => { resize(); init(); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, []);
  return <canvas id="starfield" ref={canvasRef} />;
}

/* ── MAIN APP ─────────────────────────────────────────── */
export default function App() {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [goals, setGoals] = useState({});
  const [cursorPos, setCursorPos] = useState({ x: -300, y: -300 });
  const sectionRefs = useRef({});
  const containerRef = useRef();

  /* scroll tracking */
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (window.scrollY / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(Math.min(100, pct));
      // which chapter is active
      let active = 0;
      CHAPTERS.forEach((ch, i) => {
        const el = document.getElementById(ch.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5) active = i;
        }
      });
      setActiveChapter(active);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* cursor glow */
  useEffect(() => {
    const onMove = e => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleGoal = i => setGoals(g => ({ ...g, [i]: !g[i] }));
  const goalCount = Object.values(goals).filter(Boolean).length;

  return (
    <div ref={containerRef} style={{ position: "relative", zIndex: 2 }}>
      <style>{css}</style>
      <Starfield />
      <div id="cursor-glow" style={{ left: cursorPos.x, top: cursorPos.y }} />
      <div id="progress-bar" style={{ width: `${scrollPct}%` }} />

      {/* CHAPTER NAV */}
      <div id="chapter-nav">
        {CHAPTERS.map((ch, i) => (
          <div key={ch.id} className={`ch-dot ${i === activeChapter ? "active" : ""}`} onClick={() => scrollTo(ch.id)}>
            <span className="ch-dot-label">{ch.label}</span>
          </div>
        ))}
      </div>

      {/* ── PROLOGUE ──────────────────────────────────── */}
      <section id="prologue" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 8rem", position: "relative", background: "radial-gradient(ellipse at 20% 60%, rgba(200,169,110,.05) 0, transparent 55%)" }}>
        <Reveal delay={200}>
          <span className="mono" style={{ fontSize: ".6rem", letterSpacing: ".3em", color: "var(--gold)", opacity: .6, display: "block", marginBottom: "2rem" }}>
            SHIP'S LOG · 38°42'N 9°8'W
          </span>
        </Reveal>

        <Reveal delay={500}>
          <div style={{ maxWidth: 680, marginBottom: "3rem" }}>
            <p className="body-text" style={{ fontSize: "1.3rem", fontStyle: "italic", color: "#c0b8ac", lineHeight: 2.1 }}>
              <Typewriter
                text="Every time you look down at your wrist and stare into those blueish veins that have always fascinated you, I hope you think of the blood that runs inside. The same blood that contains hemoglobin — an iron-rich protein. And remember that iron has only one place where it can be naturally produced: the core of dying stars."
                delay={800}
                speed={22}
              />
            </p>
          </div>
        </Reveal>

        <Reveal delay={2800}>
          <div style={{ marginBottom: "1rem" }}>
            <h1 className="display" style={{ fontSize: "clamp(4rem, 10vw, 9rem)", fontWeight: 300, lineHeight: .88, color: "var(--text)" }}>
              Mariana<br />
              <em style={{ fontStyle: "italic", color: "var(--gold2)" }}>Brites</em><br />
              Lameiro
            </h1>
          </div>
        </Reveal>

        <Reveal delay={3200}>
          <p className="body-text" style={{ fontSize: "1.05rem", fontStyle: "italic", color: "var(--muted)", marginBottom: "2.5rem" }}>
            Mathematics · Physics · Engineering · Writing · The universe in between
          </p>
        </Reveal>

        <Reveal delay={3500}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button className="btn solid" onClick={() => scrollTo("ch1")}>Begin the voyage ↓</button>
            <a href="https://inkandallthings.substack.com" target="_blank" rel="noreferrer" className="btn">Ink and All Things ↗</a>
          </div>
        </Reveal>

        <div className="scroll-hint" style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div className="mono" style={{ fontSize: ".55rem", letterSpacing: ".2em", color: "var(--muted)", marginBottom: ".5rem" }}>SCROLL</div>
          <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, var(--gold), transparent)", margin: "0 auto" }} />
        </div>
      </section>

      {/* ── CHAPTER I: THE SCIENTIST ─────────────────── */}
      <section id="ch1" className="chapter" style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(200,169,110,.04) 0, transparent 60%)" }}>
        <Reveal>
          <span className="ch-label">Chapter I</span>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>
            The <em>Scientist</em>
          </h2>
          <p className="coord">38°42'N 9°8'W · Lisboa, Portugal</p>
        </Reveal>

        <Reveal delay={150} style={{ marginTop: "2.5rem", maxWidth: 720 }}>
          <p className="body-text" style={{ fontSize: "1.15rem", color: "#c0b8ac", lineHeight: 1.95 }}>
            Undergraduate student in General Studies with a focus on Mathematics, Physics and Engineering — disciplines that, at their frontier, speak the same language. She is drawn to the places where equations describe life, where dynamical systems capture the erratic beauty of biological phenomena.
          </p>
        </Reveal>

        <Reveal delay={250} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          <div className="blockquote">
            "I've always been fascinated by the places where different disciplines collide and create something entirely new — a conversation between rigour and poetry."
          </div>
        </Reveal>

        <Reveal delay={350} style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "start" }}>
            {[
              ["🎓", "Degree", "General Studies — Maths, Physics, Engineering"],
              ["🔬", "Interest", "Mathematical biology · Dynamical systems · Neuroscience"],
              ["🏛️", "Institution", "University of Lisbon"],
              ["🐾", "Volunteering", "Canil e Gatil de Monsanto · since 2025"],
            ].map(([icon, label, val]) => (
              <div key={label} className="card" style={{ padding: "1.3rem 1.6rem", minWidth: 220 }}>
                <div style={{ fontSize: "1.2rem", marginBottom: ".5rem" }}>{icon}</div>
                <div className="mono" style={{ fontSize: ".55rem", letterSpacing: ".15em", color: "var(--gold)", marginBottom: ".3rem" }}>{label}</div>
                <div className="body-text" style={{ fontSize: ".95rem", color: "var(--text)" }}>{val}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={450} style={{ marginTop: "2rem" }}>
          {["Mathematical Biology", "Dynamical Systems", "Neuroscience", "Quantitative Modelling", "Physics", "Writing", "Travel Photography"].map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </Reveal>
      </section>

      {/* ── CHAPTER II: THE LABORATORY ───────────────── */}
      <section id="ch2" className="chapter" style={{ background: "radial-gradient(ellipse at 10% 70%, rgba(122,175,196,.04) 0, transparent 55%)" }}>
        <Reveal>
          <span className="ch-label">Chapter II</span>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>
            The <em>Laboratory</em>
          </h2>
          <p className="coord">Research internships · 2025–present</p>
        </Reveal>

        <Reveal delay={150} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          <p className="body-text" style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.9, fontStyle: "italic" }}>
            Two laboratories, two coordinates on the map of research. One at the intersection of physics and biology. The other at the frontier of language models and neurodegenerative disease.
          </p>
        </Reveal>

        <div style={{ marginTop: "3rem" }} className="timeline">
          <Reveal delay={200}>
            <div className="tl-item">
              <div className="mono" style={{ fontSize: ".6rem", letterSpacing: ".16em", color: "var(--gold)", marginBottom: ".5rem" }}>
                NOVEMBER 2025 — PRESENT
              </div>
              <h3 className="display" style={{ fontSize: "1.7rem", fontWeight: 400, marginBottom: ".3rem" }}>IBEB — Research Intern</h3>
              <p className="mono" style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: "1rem" }}>
                Institute of Biophysics and Biomedical Engineering · University of Lisbon
              </p>
              <p className="body-text" style={{ fontSize: "1rem", color: "#a0988c", lineHeight: 1.85 }}>
                Research internship at the crossroads of biophysics and biomedical engineering, University of Lisbon.
              </p>
              <div style={{ marginTop: ".8rem" }}>
                <span className="tag">Biomedical Engineering</span>
                <span className="tag">Research</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="tl-item">
              <div className="mono" style={{ fontSize: ".6rem", letterSpacing: ".16em", color: "var(--ice)", marginBottom: ".5rem" }}>
                SEPTEMBER 2025 — PRESENT
              </div>
              <h3 className="display" style={{ fontSize: "1.7rem", fontWeight: 400, marginBottom: ".3rem" }}>LASIGE — Research Intern</h3>
              <p className="mono" style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: "1rem" }}>
                Large-Scale Informatics Systems Laboratory · University of Lisbon
              </p>
              <p className="body-text" style={{ fontSize: "1rem", color: "#a0988c", lineHeight: 1.85 }}>
                Applied advanced computational methodologies, specifically leveraging Large Language Models (LLMs) and accelerometry data analysis from patients to derive predictive insights into Parkinson's disease progression.
              </p>
              <p className="body-text" style={{ fontSize: "1rem", color: "#a0988c", lineHeight: 1.85, marginTop: ".8rem" }}>
                Spearheaded the data analysis phase, synthesizing complex LLM outputs to formulate robust scientific conclusions supporting the interdisciplinary understanding — Neuroscience, Cognitive Science, Computer Science — of the pathology.
              </p>
              <div style={{ marginTop: ".8rem" }}>
                {["LLMs", "Parkinson's Disease", "Accelerometry", "Data Analysis", "Neuroscience"].map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CHAPTER III: THE FIELD ───────────────────── */}
      <section id="ch3" className="chapter">
        <Reveal>
          <span className="ch-label">Chapter III</span>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>
            The <em>Field</em>
          </h2>
          <p className="coord">Projects · 2024–2025</p>
        </Reveal>

        <Reveal delay={150} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          <p className="body-text" style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.9, fontStyle: "italic" }}>
            From ocean plastic to European policy, from corporate negotiation to student journalism — work that refused to stay inside a single discipline.
          </p>
        </Reveal>

        <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.2rem" }}>
          {[
            {
              date: "Jan 2024 — Jul 2024",
              title: "Ulisses Project",
              org: "University of Lisbon",
              text: "Developed and proposed a collaborative, interdisciplinary solution — Science, Technology, Humanities — to a complex hypothetical catastrophe: ocean plastic spillage. Integrated critical thinking and research skills with cross-disciplinary collaboration.",
              tags: ["Interdisciplinary", "Environmental Science", "Research"],
              color: "var(--gold)",
            },
            {
              date: "Sep 2024 — Feb 2025",
              title: "SET Organiser",
              org: "Business & Technology Week · External Relations",
              text: "Secured and managed corporate participation by pitching, negotiating pricing, and managing all communications with external companies for a university-wide event connecting students with innovation and industry leaders.",
              tags: ["B2B Negotiation", "Event Management", "External Relations"],
              color: "var(--ice)",
            },
            {
              date: "Sep 2024 — Sep 2025",
              title: "NESTEU — Member",
              org: "European Studies Student Nucleus",
              text: "Contributed to projects promoting European affairs, cultural dialogue, and international collaboration within the university community.",
              tags: ["European Affairs", "Cultural Dialogue"],
              color: "var(--rose)",
            },
            {
              date: "Ongoing",
              title: "Student Journalist",
              org: "Diferencial & O Cola",
              text: "Contributed to the student journalistic output of two nuclei by writing several articles and managing the editorial quality of published texts.",
              tags: ["Journalism", "Editorial", "Writing"],
              color: "#7aaa8c",
            },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="card" style={{ height: "100%" }}>
                <div className="mono" style={{ fontSize: ".58rem", letterSpacing: ".14em", color: p.color, marginBottom: ".6rem" }}>{p.date}</div>
                <h3 className="display" style={{ fontSize: "1.4rem", marginBottom: ".2rem" }}>{p.title}</h3>
                <p className="mono" style={{ fontSize: ".6rem", color: "var(--muted)", marginBottom: ".9rem" }}>{p.org}</p>
                <p className="body-text" style={{ fontSize: ".95rem", color: "#9a9288", lineHeight: 1.8 }}>{p.text}</p>
                <div style={{ marginTop: ".8rem" }}>{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CHAPTER IV: THE PAGE ─────────────────────── */}
      <section id="ch4" className="chapter" style={{ background: "radial-gradient(ellipse at 90% 50%, rgba(196,122,133,.04) 0, transparent 60%)" }}>
        <Reveal>
          <span className="ch-label">Chapter IV</span>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>
            The <em>Page</em>
          </h2>
          <p className="coord">Writing · 2024–present</p>
        </Reveal>

        <Reveal delay={150} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          <p className="body-text" style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.9, fontStyle: "italic" }}>
            Science is not the only language she speaks. There are two manuscripts taking shape in the dark, a book of poems still gathering itself, and a Substack where ink meets all things.
          </p>
        </Reveal>

        {/* SUBSTACK */}
        <Reveal delay={200} style={{ marginTop: "2.5rem", maxWidth: 680 }}>
          <div style={{ border: "1px solid var(--border)", borderLeft: "3px solid var(--gold)", padding: "1.5rem 2rem", background: "rgba(200,169,110,.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 className="display" style={{ fontSize: "1.4rem", marginBottom: ".2rem" }}>Ink and All Things</h3>
              <p className="mono" style={{ fontSize: ".62rem", color: "var(--muted)" }}>Substack · October 2024 — Present</p>
            </div>
            <a href="https://inkandallthings.substack.com" target="_blank" rel="noreferrer" className="btn">Read ↗</a>
          </div>
        </Reveal>

        {/* WRITING ROWS */}
        <Reveal delay={300} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          {[
            ["01", "Manuscript I", "Long-form prose · Editing phase", "In progress"],
            ["02", "Manuscript II", "Long-form prose · In development", "In progress"],
            ["03", "Book of Poems", "Poetry collection · Taking shape", "In progress"],
            ["04", "Estado com Arte", "Magazine · Published contributions", "Published"],
          ].map(([n, title, sub, badge]) => (
            <div key={n} className="wr-row">
              <span className="display" style={{ fontSize: ".9rem", color: "var(--muted)", minWidth: "2rem" }}>{n}</span>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: "1.3rem" }}>{title}</div>
                <div className="mono" style={{ fontSize: ".6rem", color: "var(--muted)" }}>{sub}</div>
              </div>
              <span style={{ padding: ".18rem .65rem", border: "1px solid var(--border)", fontFamily: "'DM Mono',monospace", fontSize: ".55rem", letterSpacing: ".1em", color: "var(--muted)", textTransform: "uppercase" }}>{badge}</span>
            </div>
          ))}
        </Reveal>

        {/* EDITING DIARY EXCERPT */}
        <Reveal delay={400} style={{ marginTop: "2.5rem", maxWidth: 620 }}>
          <span className="mono" style={{ fontSize: ".58rem", letterSpacing: ".2em", color: "var(--gold)", opacity: .7, display: "block", marginBottom: "1rem" }}>FROM THE EDITING DIARY — MANUSCRIPT I</span>
          <div className="blockquote">
            "You have to go through the cringy non-sense you just wrote, and thought was the best thing in the world, only to find out that the few things out of this world in there are the grammatical mistakes you made during your 3 am session."
          </div>
          <p className="body-text" style={{ fontSize: "1rem", color: "#9a9288", lineHeight: 1.85 }}>
            Once you complete your first draft the next obvious step is to edit it. Seems straightforward, right? But it isn't so easy. So yeah, it's pretty rough — reason why this space exists. For the foreseeable future the plan is: write a brief paragraph, after editing each chapter, about how it went.
          </p>
        </Reveal>
      </section>

      {/* ── CHAPTER V: THE HORIZON ───────────────────── */}
      <section id="ch5" className="chapter">
        <Reveal>
          <span className="ch-label">Chapter V</span>
          <h2 className="section-title" style={{ marginBottom: "1rem" }}>
            The <em>Horizon</em>
          </h2>
          <p className="coord">2026 · Goals & intentions</p>
        </Reveal>

        <Reveal delay={150} style={{ marginTop: "1.5rem", maxWidth: 680 }}>
          <p className="body-text" style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.9, fontStyle: "italic" }}>
            A horizon is not a destination — it's a direction. These are this year's coordinates.
          </p>
        </Reveal>

        {/* PROGRESS */}
        <Reveal delay={200} style={{ marginTop: "2rem", maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.8rem" }}>
            <span className="mono" style={{ fontSize: ".6rem", letterSpacing: ".15em", color: "var(--gold)", whiteSpace: "nowrap" }}>
              {goalCount}/{GOALS.length}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)", borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${(goalCount / GOALS.length) * 100}%`, background: "linear-gradient(90deg, var(--gold), var(--gold2))", transition: "width .5s cubic-bezier(.16,1,.3,1)", borderRadius: 1, boxShadow: "0 0 6px rgba(200,169,110,.4)" }} />
            </div>
          </div>

          <div style={{ maxWidth: 580 }}>
            {GOALS.map((g, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className={`goal-item ${goals[i] ? "done" : ""}`} onClick={() => toggleGoal(i)}>
                  <div className="goal-circle" style={{ background: goals[i] ? "rgba(200,169,110,.25)" : "transparent" }}>
                    {goals[i] && "✓"}
                  </div>
                  <p className="body-text" style={{ fontSize: "1.02rem", lineHeight: 1.5 }}>{g}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── EPILOGUE ──────────────────────────────────── */}
      <section id="epilogue" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "6rem 8rem", background: "radial-gradient(ellipse at 50% 50%, rgba(200,169,110,.06) 0, transparent 65%)", textAlign: "center", alignItems: "center" }}>
        <Reveal>
          <span className="ch-label" style={{ display: "block", textAlign: "center" }}>Epilogue</span>
          <h2 className="display" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 300, marginBottom: "1rem" }}>
            End of <em style={{ fontStyle: "italic", color: "var(--gold2)" }}>log</em>
          </h2>
        </Reveal>

        <Reveal delay={200} style={{ maxWidth: 520, margin: "0 auto" }}>
          <p className="body-text" style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--muted)", lineHeight: 1.9, marginBottom: "2.5rem" }}>
            Made of iron forged in dying stars — carried across the universe, arriving here. The voyage continues.
          </p>
        </Reveal>

        <Reveal delay={350} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="https://linkedin.com/in/mariana-lameiro-7046a9274/" target="_blank" rel="noreferrer" className="btn">LinkedIn ↗</a>
          <a href="https://inkandallthings.substack.com" target="_blank" rel="noreferrer" className="btn solid">Ink and All Things ↗</a>
        </Reveal>

        <Reveal delay={500} style={{ marginTop: "5rem" }}>
          <div className="mono" style={{ fontSize: ".55rem", letterSpacing: ".25em", color: "var(--dim)", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            ↑ RETURN TO THE BEGINNING
          </div>
        </Reveal>
      </section>
    </div>
  );
}