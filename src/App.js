import { useState, useEffect, useRef, useCallback } from "react";
import LiteratureGapFinder from "./LiteratureGapFinder";

const SCENE_W = 3600;

/* ── CSS ──────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Mono:wght@300;400&family=Dancing+Script:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body { overflow: hidden; height: 100%; width: 100%; }
  @media (pointer: fine) { .city-wrap *, .city-wrap { cursor: none !important; } }
  .pc-wrap *, .ri-wrap *, .caderno-wrap *, .linha-wrap * { cursor: auto !important; }
  .pc-wrap button, .ri-wrap button, .caderno-wrap button, .linha-wrap button,
  .pc-wrap a, .ri-wrap a, .caderno-wrap a, .linha-wrap a,
  .world-nav-btn { cursor: pointer !important; }

  .city-wrap {
    position: fixed; inset: 0;
    background: linear-gradient(to bottom, #4a9fd4 0%, #7abde0 20%, #b0d8f0 55%, #ddf4ff 100%);
    overflow: hidden; user-select: none;
  }

  /* ── Clouds ── */
  .clouds-layer {
    position: absolute; top: 0; left: 0;
    width: ${SCENE_W}px; height: 280px;
    pointer-events: none; will-change: transform;
  }
  /* ── Scene ── */
  .city-scene {
    position: absolute; bottom: 0; left: 0;
    width: ${SCENE_W}px; height: 620px;
    will-change: transform;
  }

  /* ── Ground ── */
  .ground {
    position: absolute; bottom: 0; left: 0;
    width: 100%; height: 140px;
    background: #c4b4a0;
    background-image: repeating-linear-gradient(
      90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px,
      transparent 1px, transparent 40px
    ), repeating-linear-gradient(
      0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px,
      transparent 1px, transparent 20px
    );
  }
  .sidewalk {
    position: absolute; top: 0; left: 0; right: 0;
    height: 18px;
    background: #b8a890;
    border-top: 2px solid #a09078;
  }

  /* ── SVG building door hover ── */
  .door-g { cursor: pointer; }
  .door-g:hover .door-body { filter: brightness(1.22); }
  .door-g:hover .door-surround { filter: brightness(1.08) drop-shadow(0 0 8px rgba(200,169,110,0.45)); }
  @keyframes door-cue {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.80; filter: brightness(1.20) drop-shadow(0 0 8px rgba(200,155,50,0.50)); }
  }
  .door-cue { animation: door-cue 2.8s ease-in-out infinite; }

  /* ── Entry sign ── */
  .entry-sign {
    position: absolute; bottom: 140px;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center; padding: 24px 18px;
    background: #8a7040;
    gap: 8px;
  }
  .sign-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.55rem; font-weight: 300;
    color: #fdf4e0; letter-spacing: 0.02em;
    line-height: 1.2;
  }
  .sign-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; color: #e8d8a0;
    letter-spacing: 0.08em; line-height: 1.6;
    opacity: 0.9;
  }
  .sign-coords {
    font-family: 'DM Mono', monospace;
    font-size: 0.5rem; color: #c8b870;
    letter-spacing: 0.1em; margin-top: 4px;
    opacity: 0.75;
  }
  .sign-roof {
    position: absolute; top: -12px; left: 0; right: 0; height: 12px;
    background: #6a5030; border-radius: 2px 2px 0 0;
  }

  /* Style B — Azulejo */
  .entry-sign.style-b {
    background: #1a3a6e;
    border: 2px solid #2a5aae;
    box-shadow: inset 0 0 0 6px #1a3a6e, inset 0 0 0 8px rgba(100,160,230,0.28);
  }
  .entry-sign.style-b::before {
    content: ''; position: absolute; inset: 10px;
    border: 1px solid rgba(120,170,240,0.22); pointer-events: none; z-index: 0;
  }
  .entry-sign.style-b .sign-roof { background: #0e2550; }
  .entry-sign.style-b .sign-name {
    color: #eef4ff; font-style: italic; position: relative; z-index: 1;
    text-shadow: 0 0 24px rgba(120,170,255,0.28);
  }
  .entry-sign.style-b .sign-sub  { color: rgba(180,210,255,0.72); position: relative; z-index: 1; }
  .entry-sign.style-b .sign-coords { color: rgba(140,180,240,0.50); position: relative; z-index: 1; }

  /* Style C — Stone/granite */
  .entry-sign.style-c {
    background: linear-gradient(160deg, #2e3235 0%, #252829 100%);
    border: 1px solid rgba(180,170,150,0.16);
  }
  .entry-sign.style-c .sign-roof { background: #1e2124; border-radius: 2px 2px 0 0; }
  .entry-sign.style-c .sign-name {
    color: #e4d8c4; font-style: normal; font-weight: 400; letter-spacing: 0.04em;
    text-shadow: 0 1px 3px rgba(0,0,0,0.7), 0 0 28px rgba(200,175,120,0.12);
  }
  .entry-sign.style-c .sign-sub  { color: rgba(200,188,162,0.62); }
  .entry-sign.style-c .sign-coords { color: rgba(168,155,126,0.42); }

  /* Style D — Backlit neon box */
  .entry-sign.style-d {
    background: #06090d;
    border: 1px solid rgba(200,169,110,0.35);
    box-shadow: 0 0 50px rgba(200,169,110,0.10), inset 0 0 70px rgba(200,169,110,0.04);
  }
  .entry-sign.style-d .sign-roof {
    background: #06090d;
    border: 1px solid rgba(200,169,110,0.28); border-bottom: none;
  }
  .entry-sign.style-d .sign-name {
    color: #fdf4e0; font-style: italic;
    text-shadow: 0 0 40px rgba(200,169,110,0.55), 0 0 80px rgba(200,169,110,0.22);
  }
  .entry-sign.style-d .sign-sub  { color: rgba(205,185,135,0.58); }
  .entry-sign.style-d .sign-coords { color: rgba(180,155,100,0.36); }

  /* ── Lamppost ── */
  .lamppost {
    position: absolute; bottom: 140px;
    cursor: pointer; overflow: visible;
  }

  /* ── Custom cursor ── */
  #cur-dot {
    position: fixed; width: 7px; height: 7px;
    background: #1a4878; border-radius: 50%;
    pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%);
    transition: transform 0.08s, width 0.15s, height 0.15s, background 0.4s, box-shadow 0.4s;
  }
  #cur-ring {
    position: fixed; width: 34px; height: 34px;
    border: 1.5px solid rgba(26,72,120,0.55);
    border-radius: 50%; pointer-events: none; z-index: 9998;
    transform: translate(-50%, -50%);
    transition: width 0.18s, height 0.18s, border-color 0.18s;
  }
  #cur-ring.hover {
    width: 54px; height: 54px;
    border-color: rgba(26,72,120,0.75);
  }
  #cur-dot.night {
    background: #fff8d0;
    box-shadow: 0 0 8px 3px rgba(255,240,180,0.9), 0 0 20px 8px rgba(255,200,80,0.4);
  }
  #cur-ring.night {
    border-color: rgba(255,230,140,0.5);
  }

  /* ── Night overlay ── */
  .night-overlay {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 900;
    opacity: 0;
    background: rgba(8, 4, 22, 0.97);
    transition: opacity 2s ease;
  }
  .night-overlay.on { opacity: 1; }

  /* ── Drag hint ── */
  .drag-hint {
    position: fixed; bottom: 60px; left: 50%;
    transform: translateX(-50%);
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem; color: #1a4878;
    opacity: 0;
    animation: hint-fade 4.5s ease forwards;
    pointer-events: none; z-index: 200;
    letter-spacing: 0.08em;
    background: rgba(255,255,255,0.55);
    padding: 6px 14px; border-radius: 20px;
  }
  @keyframes hint-fade {
    0%   { opacity: 0; }
    15%  { opacity: 1; }
    70%  { opacity: 1; }
    100% { opacity: 0; }
  }

  /* ── Progress bar ── */
  .progress-track {
    position: fixed; bottom: 22px; left: 50%;
    transform: translateX(-50%);
    width: 140px; height: 3px;
    background: rgba(26,72,120,0.18);
    border-radius: 3px; z-index: 200;
  }
  .progress-dot {
    position: absolute; top: -4px;
    width: 11px; height: 11px;
    background: #1a4878; border-radius: 50%;
    margin-left: -5.5px;
    box-shadow: 0 0 0 3px rgba(26,72,120,0.18);
    transition: left 0.05s linear;
  }

  /* ── Panel overlay ── */
  .panel-overlay {
    position: fixed; inset: 0;
    background: rgba(8,12,28,0.72);
    backdrop-filter: blur(4px);
    z-index: 400;
    animation: overlay-in 0.55s ease forwards;
  }
  .panel-overlay.closing { animation: overlay-out 0.42s ease forwards; }
  @keyframes overlay-in  { from { opacity:0; } to { opacity:1; } }
  @keyframes overlay-out { from { opacity:1; } to { opacity:0; } }

  /* ── Panel ── */
  .panel {
    position: fixed; right: 0; top: 0; bottom: 0;
    width: 480px; max-width: 100vw;
    background: #faf6f0;
    z-index: 401;
    overflow-y: auto;
    animation: panel-world-open 0.72s cubic-bezier(0.16,1,0.3,1) forwards;
    box-shadow: -8px 0 60px rgba(0,0,0,0.32);
  }
  .panel.closing { animation: panel-world-close 0.44s cubic-bezier(0.7,0,0.84,0) forwards; }
  @media (max-width: 540px) { .panel { width: 100vw; } }
  @keyframes panel-world-open {
    0%   { clip-path: circle(0px at 50% 85%); filter: blur(18px) brightness(0.15); opacity:0; }
    25%  { opacity:1; }
    100% { clip-path: circle(180% at 50% 85%); filter: blur(0px) brightness(1); opacity:1; }
  }
  @keyframes panel-world-close {
    0%   { clip-path: circle(180% at 50% 85%); filter: blur(0px) brightness(1); opacity:1; }
    100% { clip-path: circle(0px at 50% 85%); filter: blur(18px) brightness(0.15); opacity:0; }
  }
  .panel-inner {
    padding: 4rem 2.5rem 3rem;
    min-height: 100%;
  }
  .panel-close {
    position: absolute; top: 1.2rem; right: 1.4rem;
    background: none; border: none;
    font-size: 1.4rem; color: #6a6a7e;
    cursor: pointer; padding: 6px 10px;
    border-radius: 50%;
    transition: background 0.15s, color 0.15s;
    line-height: 1;
  }
  .panel-close:hover { background: #f0e8dc; color: #1a1a2e; }

  /* ── Panel epigraph quote ── */
  .panel-epigraph {
    margin: 0 0 2.2rem 0;
    padding: 1.4rem 1.6rem 1.2rem;
    border-left: 2px solid #c8a96e;
    background: linear-gradient(to right, rgba(200,169,110,0.07), transparent);
  }
  .panel-epigraph-text {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 1.08rem;
    line-height: 1.7;
    color: #4a3a28;
    margin: 0 0 0.6rem;
  }
  .panel-epigraph-attr {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    color: #c8a96e;
    text-transform: uppercase;
  }

  .panel-coords {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: #6a6a7e;
    letter-spacing: 0.1em; margin-bottom: 0.9rem;
  }
  .panel-chapter {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem; color: #c8a96e;
    letter-spacing: 0.14em; text-transform: uppercase;
    margin-bottom: 0.5rem;
  }
  .panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.1rem; font-weight: 400;
    color: #1a1a2e; margin-bottom: 1.2rem;
    line-height: 1.15;
  }
  .panel-body {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem; color: #3a3a50;
    line-height: 1.7; margin-bottom: 1.6rem;
  }
  .panel-divider {
    border: none; border-top: 1px solid #e0d4c4;
    margin: 1.4rem 0;
  }

  /* Info cards */
  .info-cards {
    display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 1.4rem;
  }
  .info-card {
    background: #f2ece2;
    border-radius: 8px; padding: 12px 16px;
    border-left: 3px solid #c8a96e;
  }
  .info-card-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; color: #c8a96e;
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 3px;
  }
  .info-card-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: #1a1a2e; font-weight: 400;
  }

  /* Tags */
  .tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 1rem; }
  .tag {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; color: #1a4878;
    background: #e4f0fa; border-radius: 20px;
    padding: 4px 10px; letter-spacing: 0.06em;
  }

  /* Timeline */
  .timeline { display: flex; flex-direction: column; gap: 1.2rem; margin-bottom: 1.4rem; }
  .tl-item { position: relative; padding-left: 20px; }
  .tl-item::before {
    content: ''; position: absolute; left: 0; top: 7px;
    width: 8px; height: 8px; border-radius: 50%;
    background: #c8a96e;
  }
  .tl-item::after {
    content: ''; position: absolute; left: 3.5px; top: 18px;
    width: 1px; bottom: -14px;
    background: #e0d4c4;
  }
  .tl-item:last-child::after { display: none; }
  .tl-date {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; color: #c8a96e; letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  .tl-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: #1a1a2e;
    margin-bottom: 3px;
  }
  .tl-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; color: #3a3a50; line-height: 1.55;
  }

  /* Project cards */
  .proj-cards { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.4rem; }
  .proj-card {
    background: #f2ece2; border-radius: 10px;
    padding: 14px 16px; border-top: 3px solid #c8a96e;
  }
  .proj-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: #1a1a2e;
    margin-bottom: 4px;
  }
  .proj-card-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; color: #3a3a50; line-height: 1.5;
  }

  /* Connect links */
  .connect-list { display: flex; flex-direction: column; gap: 14px; margin-top: 1rem; }
  .connect-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; background: #f2ece2;
    border-radius: 10px; text-decoration: none;
    transition: background 0.18s, transform 0.15s;
    color: inherit;
  }
  .connect-item:hover { background: #e8dfd2; transform: translateX(3px); }
  .connect-icon {
    width: 38px; height: 38px; border-radius: 50%;
    background: #e4f0fa; display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; flex-shrink: 0;
    border: 1px solid #c4daf0;
  }
  .connect-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: #1a1a2e; font-weight: 600;
  }
  .connect-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; color: #6a6a7e; letter-spacing: 0.04em;
  }

  /* Writing list */
  .writing-list { display: flex; flex-direction: column; gap: 8px; margin-top: 0.8rem; }
  .writing-item {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: #3a3a50;
    padding: 8px 0;
    border-bottom: 1px solid #e8e0d4;
    display: flex; align-items: center; gap: 8px;
  }
  .writing-item::before { content: '—'; color: #c8a96e; flex-shrink: 0; }

  /* Substack card */
  .substack-card {
    background: linear-gradient(135deg, #f5f0e4 0%, #eee4d4 100%);
    border-radius: 12px; padding: 18px 20px;
    border: 1px solid #d8ccc0; margin-bottom: 1.4rem;
  }
  .substack-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; font-weight: 600; color: #1a1a2e;
    margin-bottom: 4px;
  }
  .substack-link {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: #1a4878;
    text-decoration: underline; letter-spacing: 0.04em;
  }

  /* ── Jazz button ── */
  .jazz-btn {
    position: fixed; bottom: 24px; right: 24px;
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(26,72,120,0.85);
    border: 1.5px solid rgba(255,255,255,0.25);
    color: #fff; font-size: 1.1rem; line-height: 1; padding: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 500;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    transition: background 0.2s, transform 0.15s;
  }
  .jazz-btn:hover { background: rgba(26,72,120,1); transform: scale(1.08); }
  .jazz-pause { display: flex; gap: 3px; align-items: center; }
  .jazz-pause span { display: block; width: 3px; height: 13px; background: white; border-radius: 1px; }

  /* ── Back button ── */
  .back-btn {
    position: fixed; top: 20px; left: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem; letter-spacing: 0.1em;
    color: #1a4878; background: rgba(255,255,255,0.75);
    border: 1px solid rgba(26,72,120,0.25);
    border-radius: 20px; padding: 8px 16px;
    cursor: pointer; z-index: 500;
    backdrop-filter: blur(6px);
    transition: background 0.2s, transform 0.15s;
  }
  .back-btn:hover { background: rgba(255,255,255,0.95); transform: translateX(-2px); }

  /* ── Portfolio ── */
  .portfolio-wrap {
    position: fixed; inset: 0;
    background: linear-gradient(to bottom, #060c18 0%, #0b1525 35%, #101e30 70%, #0a1220 100%);
    overflow-y: auto;
    font-family: 'Cormorant Garamond', serif;
  }
  .portfolio-spotlight {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 9800;
  }
  .portfolio-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 120px 40px 100px;
    position: relative;
  }

  /* ── Scattered hidden quotes ── */
  .ghost-quote {
    position: absolute;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    pointer-events: auto; user-select: none;
    line-height: 1.7;
    z-index: 1;
    cursor: pointer;
    transition: opacity 0.2s, filter 0.2s;
  }
  .ghost-quote:hover {
    opacity: 1 !important;
    filter: brightness(1.6);
  }
  .ghost-quote::before {
    content: '✦';
    position: absolute; top: -0.9em; left: -0.6em;
    font-size: 0.55em; font-style: normal;
    color: rgba(255,210,90,0.28);
    animation: sparkle-hint 3.5s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes sparkle-hint {
    0%, 100% { opacity: 0.18; transform: scale(0.9); }
    50%       { opacity: 0.52; transform: scale(1.15); }
  }
  .ghost-quote-attr {
    font-family: 'DM Mono', monospace;
    font-style: normal; font-size: 0.48em;
    letter-spacing: 0.14em; text-transform: uppercase;
    display: block; margin-top: 0.5em;
    opacity: 0.6;
  }

  /* ── Quote modal ── */
  .quote-modal-overlay {
    position: fixed; inset: 0; z-index: 9900;
    background: rgba(4,8,18,0.88);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 32px;
    animation: qoverlay-in 0.3s ease forwards;
  }
  .quote-modal-overlay.closing {
    animation: qoverlay-out 0.28s ease forwards;
  }
  @keyframes qoverlay-in  { from { opacity:0; } to { opacity:1; } }
  @keyframes qoverlay-out { from { opacity:1; } to { opacity:0; } }
  .quote-modal {
    max-width: 600px; width: 100%;
    text-align: center;
    animation: qmodal-in 0.38s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .quote-modal-overlay.closing .quote-modal {
    animation: qmodal-out 0.25s ease forwards;
  }
  @keyframes qmodal-in  { from { opacity:0; transform: scale(0.94) translateY(12px); } to { opacity:1; transform: scale(1) translateY(0); } }
  @keyframes qmodal-out { from { opacity:1; transform: scale(1); } to { opacity:0; transform: scale(0.96); } }
  .quote-modal-text {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: clamp(1.6rem, 4vw, 2.6rem);
    color: rgba(240,228,200,0.95);
    line-height: 1.65;
    white-space: pre-line;
    margin: 0 0 28px;
    text-shadow: 0 0 40px rgba(200,160,80,0.22);
  }
  .quote-modal-divider {
    width: 40px; height: 1px;
    background: rgba(200,169,110,0.5);
    margin: 0 auto 20px;
  }
  .quote-modal-attr {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(200,169,110,0.7);
  }
  .quote-modal-close {
    position: absolute; top: 24px; right: 28px;
    background: none; border: none;
    color: rgba(255,255,255,0.3); font-size: 1.1rem;
    cursor: pointer; line-height: 1;
    transition: color 0.15s;
  }
  .quote-modal-close:hover { color: rgba(255,255,255,0.8); }

  /* ── Iron/veins featured quote ── */
  .iron-quote {
    margin: 64px 0 72px;
    padding: 36px 40px;
    border-top: 1px solid rgba(200,169,110,0.20);
    border-bottom: 1px solid rgba(200,169,110,0.20);
    text-align: center; position: relative;
  }
  .iron-quote::before {
    content: '✦';
    position: absolute; top: -0.6em; left: 50%;
    transform: translateX(-50%);
    color: rgba(200,169,110,0.45);
    font-size: 0.8rem; background: #0b1525; padding: 0 10px;
  }
  .iron-quote-text {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: clamp(1.0rem, 1.9vw, 1.28rem);
    color: rgba(232,218,184,0.82);
    line-height: 1.85; margin: 0;
  }
  .iron-quote-attr {
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(200,169,110,0.55);
    margin-top: 18px; display: block;
  }

  /* ── Hero / featured quote ── */
  .hero-quote {
    margin: 40px 0 56px;
    padding: 0 0 0 22px;
    border-left: 2px solid rgba(200,169,110,0.35);
  }
  .hero-quote-text {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: clamp(1.15rem, 2.2vw, 1.45rem);
    color: rgba(232,218,184,0.78);
    line-height: 1.75;
    margin: 0;
    white-space: pre-line;
  }
  .hero-quote-attr {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem; letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(200,169,110,0.6);
    margin-top: 12px; display: block;
  }
  .portfolio-hero {
    margin-bottom: 64px;
    border-bottom: 1px solid rgba(200,169,110,0.18);
    padding-bottom: 48px;
  }
  .portfolio-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; color: rgba(200,169,110,0.75);
    letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 28px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .portfolio-time {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; color: rgba(200,169,110,0.45);
    letter-spacing: 0.12em;
  }
  .portfolio-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.6rem, 9vw, 7.2rem);
    font-weight: 300; color: #f0e8d8;
    letter-spacing: -0.025em; line-height: 0.98;
    margin-bottom: 32px;
    text-shadow: 0 0 120px rgba(200,169,110,0.18);
  }
  .portfolio-coords {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: rgba(200,169,110,0.55);
    letter-spacing: 0.14em; margin-bottom: 20px;
  }
  .portfolio-disciplines {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-style: italic;
    color: rgba(220,210,240,0.55); letter-spacing: 0.06em;
  }
  .portfolio-lead {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.22rem; color: rgba(220,210,240,0.62);
    line-height: 1.75; margin-top: 36px;
    max-width: 580px;
    padding-left: 22px;
    border-left: 2px solid rgba(200,169,110,0.28);
  }
  .chapter-section {
    margin-bottom: 72px;
  }
  .chapter-section-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem; color: rgba(200,169,110,0.50);
    letter-spacing: 0.24em; text-transform: uppercase;
    margin-bottom: 36px;
    display: flex; align-items: center; gap: 20px;
  }
  .chapter-section-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(to right, rgba(200,169,110,0.22), transparent);
  }

  /* ── Editorial chapter cards (nikolaradeski-inspired) ── */
  .chapter-grid {
    display: flex; flex-direction: column; gap: 0;
  }
  .chapter-card {
    display: flex; align-items: flex-start; gap: 40px;
    padding: 30px 0;
    cursor: pointer;
    border-top: 1px solid rgba(200,169,110,0.14);
    position: relative; overflow: hidden; background: transparent;
    transition: padding-left 0.38s cubic-bezier(0.16,1,0.3,1),
                background 0.38s;
  }
  .chapter-card:last-child { border-bottom: 1px solid rgba(200,169,110,0.14); }
  .chapter-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(to bottom, #c8a96e 60%, rgba(200,169,110,0));
    transform: scaleY(0); transform-origin: top;
    transition: transform 0.38s cubic-bezier(0.16,1,0.3,1);
  }
  .chapter-card:hover { padding-left: 22px; background: rgba(200,169,110,0.03); }
  .chapter-card:hover::before { transform: scaleY(1); }
  .chapter-card-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; color: rgba(200,169,110,0.40);
    letter-spacing: 0.18em; text-transform: uppercase;
    padding-top: 7px; min-width: 48px; flex-shrink: 0;
  }
  .chapter-card-content { flex: 1; }
  .chapter-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.6rem, 3vw, 2.1rem); font-weight: 400; color: #f0e8d8;
    margin-bottom: 9px; line-height: 1.1;
    transition: letter-spacing 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .chapter-card:hover .chapter-card-title { letter-spacing: 0.012em; }
  .chapter-card-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.94rem; color: rgba(220,210,240,0.42);
    line-height: 1.58; max-width: 540px;
  }
  .chapter-card-arrow {
    font-size: 1rem; color: rgba(200,169,110,0.35);
    opacity: 0; padding-top: 8px; flex-shrink: 0;
    transition: opacity 0.25s, color 0.25s, transform 0.35s cubic-bezier(0.16,1,0.3,1);
    transform: translateX(-10px);
  }
  .chapter-card:hover .chapter-card-arrow {
    opacity: 1; color: #c8a96e; transform: translateX(0);
  }

  /* ── Stars ── */
  @keyframes twinkle-a {
    0%, 100% { opacity: 0.20; } 50% { opacity: 0.65; }
  }
  @keyframes twinkle-b {
    0%, 100% { opacity: 0.30; } 50% { opacity: 0.80; }
  }
  @keyframes twinkle-c {
    0%, 100% { opacity: 0.12; } 50% { opacity: 0.40; }
  }
  .star-a { animation: twinkle-a 3.2s ease-in-out infinite; }
  .star-b { animation: twinkle-b 4.6s ease-in-out infinite; }
  .star-c { animation: twinkle-c 2.6s ease-in-out infinite; }

  /* ── Card variant switcher ── */
  .card-switcher {
    display: flex; gap: 8px; align-items: center;
    margin-bottom: 32px; position: relative; z-index: 10;
  }
  .card-sw-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(200,169,110,0.35); margin-right: 4px;
  }

  /* ── Card Variant A — Folder Tab ── */
  .chapter-grid-a {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 28px 20px;
  }
  .card-folder { position: relative; cursor: pointer; }
  .cf-tab {
    display: inline-flex; align-items: center;
    padding: 5px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,169,110,0.20); border-bottom: none;
    border-radius: 5px 5px 0 0;
    font-family: 'DM Mono', monospace; font-size: 0.50rem;
    color: rgba(200,169,110,0.48); letter-spacing: 0.16em; text-transform: uppercase;
    transition: background 0.28s, color 0.28s, border-color 0.28s;
  }
  .cf-body {
    padding: 22px 20px 24px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,169,110,0.20); position: relative;
    transition: transform 0.32s cubic-bezier(0.16,1,0.3,1),
                box-shadow 0.32s, background 0.28s, border-color 0.28s;
  }
  .card-folder:hover .cf-tab {
    background: rgba(200,169,110,0.18); border-color: rgba(200,169,110,0.55); color: #c8a96e;
  }
  .card-folder:hover .cf-body {
    transform: translateY(-7px);
    box-shadow: 0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,169,110,0.32);
    background: rgba(200,169,110,0.06); border-color: rgba(200,169,110,0.48);
  }
  .cf-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 400; color: #f0e8d8;
    margin-bottom: 10px; line-height: 1.15;
  }
  .cf-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.90rem; color: rgba(220,210,240,0.42); line-height: 1.55;
  }
  .cf-arrow {
    position: absolute; bottom: 16px; right: 18px;
    font-size: 0.9rem; color: rgba(200,169,110,0.30);
    opacity: 0; transition: opacity 0.2s, transform 0.28s, color 0.2s;
    transform: translateX(-6px);
  }
  .card-folder:hover .cf-arrow { opacity: 1; color: #c8a96e; transform: translateX(0); }

  /* ── Card Variant B — Manila Folder with Fanning Sheets ── */
  .chapter-grid-b {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 44px 28px;
  }
  .card-manila { position: relative; cursor: pointer; }
  /* Sheet 1 — behind, fans right on hover */
  .card-manila::before {
    content: ''; position: absolute;
    left: 10px; right: -10px; top: 28px; bottom: -6px;
    background: rgba(22,38,65,0.97);
    border: 1px solid rgba(200,169,110,0.22);
    border-radius: 2px;
    transform: rotate(2.5deg); transform-origin: bottom center;
    transition: transform 0.44s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  /* Sheet 2 — further behind, fans more */
  .card-manila::after {
    content: ''; position: absolute;
    left: 18px; right: -18px; top: 30px; bottom: -10px;
    background: rgba(18,32,58,0.92);
    border: 1px solid rgba(200,169,110,0.15);
    border-radius: 2px;
    transform: rotate(5deg); transform-origin: bottom center;
    transition: transform 0.44s cubic-bezier(0.16,1,0.3,1);
    z-index: -1;
  }
  .card-manila:hover::before { transform: rotate(7deg) translateX(6px); }
  .card-manila:hover::after  { transform: rotate(13deg) translateX(12px); }
  /* Folder tab */
  .cm-tab {
    display: inline-flex; align-items: center;
    padding: 6px 22px;
    background: rgba(200,169,110,0.10);
    border: 1px solid rgba(200,169,110,0.28); border-bottom: none;
    border-radius: 6px 6px 0 0;
    font-family: 'DM Mono', monospace; font-size: 0.50rem;
    color: rgba(200,169,110,0.55); letter-spacing: 0.16em; text-transform: uppercase;
    position: relative; z-index: 2;
    transition: background 0.28s, color 0.28s, border-color 0.28s;
  }
  /* Folder body */
  .cm-body {
    position: relative; z-index: 1;
    padding: 22px 20px 26px;
    background: rgba(16,28,50,1);
    border: 1px solid rgba(200,169,110,0.30);
    border-radius: 0 5px 5px 5px;
    transition: transform 0.34s cubic-bezier(0.16,1,0.3,1),
                box-shadow 0.34s, background 0.28s, border-color 0.28s;
  }
  .card-manila:hover .cm-tab {
    background: rgba(200,169,110,0.20); border-color: rgba(200,169,110,0.55); color: #c8a96e;
  }
  .card-manila:hover .cm-body {
    transform: translateY(-8px);
    box-shadow: 0 24px 64px rgba(0,0,0,0.62), 0 0 0 1px rgba(200,169,110,0.36);
    background: rgba(200,169,110,0.065); border-color: rgba(200,169,110,0.50);
  }
  .cm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 400; color: #f0e8d8;
    margin-bottom: 10px; line-height: 1.15;
  }
  .cm-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.90rem; color: rgba(220,210,240,0.42); line-height: 1.55;
  }
  .cm-arrow {
    position: absolute; bottom: 16px; right: 18px;
    font-size: 0.9rem; color: rgba(200,169,110,0.30);
    opacity: 0; transition: opacity 0.2s, transform 0.28s, color 0.2s;
    transform: translateX(-6px);
  }
  .card-manila:hover .cm-arrow { opacity: 1; color: #c8a96e; transform: translateX(0); }

  /* ── Card Variant C — Staggered File Tabs (hanging folders) ── */
  .chapter-grid-c {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 28px 20px;
  }
  .card-divider { position: relative; cursor: pointer; padding-top: 32px; }
  /* Stagger tab position per card so they look like real hanging file tabs */
  .card-divider:nth-child(1) .cd-tab { left: 0; }
  .card-divider:nth-child(2) .cd-tab { left: 22%; }
  .card-divider:nth-child(3) .cd-tab { left: 44%; }
  .card-divider:nth-child(4) .cd-tab { left: 0; }
  .card-divider:nth-child(5) .cd-tab { left: 22%; }
  .cd-tab {
    position: absolute; top: 0;
    display: inline-flex; align-items: center;
    padding: 5px 18px;
    background: rgba(255,255,255,0.045);
    border: 1px solid rgba(200,169,110,0.22); border-bottom: none;
    border-radius: 4px 4px 0 0;
    font-family: 'DM Mono', monospace; font-size: 0.50rem;
    color: rgba(200,169,110,0.50); letter-spacing: 0.16em; text-transform: uppercase;
    white-space: nowrap;
    transition: background 0.28s, color 0.28s, border-color 0.28s;
  }
  .cd-body {
    padding: 22px 20px 26px;
    background: rgba(255,255,255,0.038);
    border: 1px solid rgba(200,169,110,0.20);
    border-radius: 0 5px 5px 5px;
    position: relative;
    transition: transform 0.34s cubic-bezier(0.16,1,0.3,1),
                box-shadow 0.34s, background 0.28s, border-color 0.28s;
  }
  /* Ruled lines inside — subtle texture suggesting paper */
  .cd-body::before {
    content: ''; position: absolute;
    left: 20px; right: 20px; top: 44px;
    height: 1px; background: rgba(200,169,110,0.06);
    box-shadow:
      0 14px 0 rgba(200,169,110,0.04),
      0 28px 0 rgba(200,169,110,0.04),
      0 42px 0 rgba(200,169,110,0.03);
    pointer-events: none;
  }
  .card-divider:hover .cd-tab {
    background: rgba(200,169,110,0.18); border-color: rgba(200,169,110,0.50); color: #c8a96e;
  }
  .card-divider:hover .cd-body {
    transform: translateY(-7px);
    box-shadow: 0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,169,110,0.30);
    background: rgba(200,169,110,0.055); border-color: rgba(200,169,110,0.44);
  }
  .cd-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 400; color: #f0e8d8;
    margin-bottom: 10px; line-height: 1.15;
    position: relative; z-index: 1;
  }
  .cd-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.90rem; color: rgba(220,210,240,0.42); line-height: 1.55;
    position: relative; z-index: 1;
  }
  .cd-arrow {
    position: absolute; bottom: 16px; right: 18px;
    font-size: 0.9rem; color: rgba(200,169,110,0.30);
    opacity: 0; transition: opacity 0.2s, transform 0.28s, color 0.2s;
    transform: translateX(-6px);
  }
  .card-divider:hover .cd-arrow { opacity: 1; color: #c8a96e; transform: translateX(0); }

  /* ── Hero variant switcher ── */
  .hero-switcher {
    display: flex; gap: 8px; justify-content: flex-end;
    margin-bottom: 48px; position: relative; z-index: 10;
  }
  .hero-sw-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid rgba(200,169,110,0.28);
    background: transparent; color: rgba(200,169,110,0.45);
    font-family: 'DM Mono', monospace; font-size: 0.6rem;
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-sw-btn.active, .hero-sw-btn:hover {
    background: rgba(200,169,110,0.15); border-color: #c8a96e; color: #c8a96e;
  }

  /* ── V2: Centrado Cinematográfico ── */
  .hero-v2 { text-align: center; padding-bottom: 56px; border-bottom: 1px solid rgba(200,169,110,0.18); }
  .hero-v2 .portfolio-eyebrow { justify-content: center; }
  .hero-v2-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(4.4rem, 10vw, 8.8rem);
    font-weight: 300; font-style: italic; color: #f0e8d8;
    letter-spacing: -0.03em; line-height: 0.97;
    text-shadow: 0 0 120px rgba(200,169,110,0.20);
    margin-bottom: 36px;
    animation: hero-fade-up 1.1s cubic-bezier(0.16,1,0.3,1) 0.25s both;
    transition: text-shadow 0.7s ease, letter-spacing 0.7s ease;
    cursor: default;
  }
  .hero-v2-name:hover {
    color: #f8e4a0;
    text-shadow:
      0 0 24px rgba(255,210,80,0.80),
      0 0 70px rgba(230,175,50,0.50),
      0 0 140px rgba(200,140,30,0.25);
    letter-spacing: -0.024em;
  }
  .hero-v2-ornament {
    display: flex; align-items: center; gap: 20px;
    max-width: 260px; margin: 0 auto 36px;
  }
  .hero-v2-ornament::before, .hero-v2-ornament::after {
    content: ''; flex: 1; height: 1px; background: rgba(200,169,110,0.30);
  }
  .hero-v2-ornament span { color: rgba(200,169,110,0.55); font-size: 0.65rem; }
  .hero-v2-disciplines {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.30em; text-transform: uppercase;
    color: rgba(200,169,110,0.50); margin-bottom: 16px;
  }
  .hero-v2-coords {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.14em;
    color: rgba(200,169,110,0.35);
  }

  /* ── V3: Duas Colunas Editorial ── */
  .hero-v3 {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 0 72px; align-items: start;
    padding-bottom: 64px; border-bottom: 1px solid rgba(200,169,110,0.18);
  }
  .hero-v3-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.8rem, 7vw, 6.4rem);
    font-weight: 300; color: #f0e8d8;
    line-height: 0.96; letter-spacing: -0.025em;
    text-shadow: 0 0 120px rgba(200,169,110,0.18);
  }
  .hero-v3-right { padding-top: 4px; }
  .hero-v3-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; color: rgba(200,169,110,0.55);
    letter-spacing: 0.22em; text-transform: uppercase;
    margin-bottom: 28px;
  }
  .hero-v3-disc-list { margin-bottom: 32px; }
  .hero-v3-disc-item {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; color: rgba(200,169,110,0.55);
    letter-spacing: 0.16em; text-transform: uppercase;
    padding: 11px 0; border-bottom: 1px solid rgba(200,169,110,0.12);
  }
  .hero-v3-disc-item:first-child { border-top: 1px solid rgba(200,169,110,0.12); }
  .hero-v3 .portfolio-lead { border-left: none; padding-left: 0; margin-top: 0; font-size: 1.05rem; }
  @media (max-width: 680px) { .hero-v3 { grid-template-columns: 1fr; gap: 40px 0; } }

  /* ── V4: Frase em Primeiro ── */
  .hero-v4 { padding-bottom: 64px; border-bottom: 1px solid rgba(200,169,110,0.18); }
  .hero-v4-intro {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: clamp(2.0rem, 4vw, 3.1rem); color: rgba(240,232,216,0.90);
    line-height: 1.45; margin-bottom: 72px; max-width: 740px;
  }
  .hero-v4-byline {
    display: flex; align-items: baseline; gap: 36px; flex-wrap: wrap;
    padding-top: 28px; border-top: 1px solid rgba(200,169,110,0.15);
  }
  .hero-v4-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.4rem, 2.2vw, 1.75rem); font-weight: 300;
    color: #f0e8d8; letter-spacing: 0.07em; text-transform: uppercase;
  }
  .hero-v4-meta {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem; color: rgba(200,169,110,0.45);
    letter-spacing: 0.14em; text-transform: uppercase;
    display: flex; gap: 24px; flex-wrap: wrap;
  }

  .portfolio-footer {
    text-align: center;
    padding-top: 16px;
  }
  .explore-btn {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem; letter-spacing: 0.14em;
    color: #c8a96e;
    background: transparent;
    border: 1px solid rgba(200,169,110,0.4);
    border-radius: 24px; padding: 12px 32px;
    cursor: pointer;
    transition: background 0.38s, color 0.3s, border-color 0.38s,
                box-shadow 0.38s, transform 0.38s;
  }
  .explore-btn:hover {
    background: rgba(200,169,110,0.10);
    border-color: rgba(200,169,110,0.80);
    color: #e0c880;
    box-shadow: 0 0 32px rgba(200,169,110,0.22), 0 0 64px rgba(200,169,110,0.09);
    transform: translateY(-3px);
  }

  /* ── Ambient atmospheric drift (inspired by ofskinandsouls) ── */
  .ambient-glow-a, .ambient-glow-b {
    position: fixed; border-radius: 50%;
    pointer-events: none; z-index: 2;
    will-change: transform;
  }
  .ambient-glow-a {
    width: 110vw; height: 110vw;
    top: -20%; left: -15%;
    background: radial-gradient(circle at center,
      rgba(200,169,110,0.16) 0%,
      rgba(200,169,110,0.07) 35%,
      transparent 62%);
    animation: glow-drift-a 34s ease-in-out infinite;
  }
  .ambient-glow-b {
    width: 85vw; height: 85vw;
    top: 40%; right: -20%;
    background: radial-gradient(circle at center,
      rgba(80,100,200,0.10) 0%,
      transparent 55%);
    animation: glow-drift-b 48s ease-in-out infinite;
  }
  /* ── Film grain (ofskinandsouls texture) ── */
  .portfolio-grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 5;
    opacity: 0.032;
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
  }
  @keyframes glow-drift-a {
    0%, 100% { transform: translate(0, 0); }
    28%       { transform: translate(14%, -18%); }
    58%       { transform: translate(22%, 12%); }
    80%       { transform: translate(-6%, 20%); }
  }
  @keyframes glow-drift-b {
    0%, 100% { transform: translate(0, 0); }
    22%       { transform: translate(-20%, 10%); }
    52%       { transform: translate(8%, -18%); }
    78%       { transform: translate(-10%, -8%); }
  }

  /* ── Marquee ── */
  .marquee-wrap {
    overflow: hidden;
    margin: 52px 0;
    padding: 15px 0;
    border-top: 1px solid rgba(200,169,110,0.13);
    border-bottom: 1px solid rgba(200,169,110,0.13);
    position: relative; z-index: 10;
  }
  .marquee-track {
    display: inline-flex;
    white-space: nowrap;
    animation: marquee-scroll 62s linear infinite;
  }
  .marquee-item {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.30em;
    color: rgba(200,169,110,0.38);
    padding: 0 42px;
    text-transform: uppercase;
  }
  .marquee-sep { color: rgba(200,169,110,0.22); }
  @keyframes marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── Scroll reveal ── */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 1s cubic-bezier(0.16,1,0.3,1),
                transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.in-view { opacity: 1; transform: translateY(0); }
  .reveal-d1 { transition-delay: 0.08s; }
  .reveal-d2 { transition-delay: 0.18s; }
  .reveal-d3 { transition-delay: 0.28s; }
  .reveal-d4 { transition-delay: 0.38s; }

  /* ── App card ── */
  .app-card {
    display: flex; align-items: center; gap: 20px;
    margin: 0 0 48px;
    padding: 20px 24px;
    border: 1px solid rgba(200,169,110,0.25);
    border-radius: 4px;
    background: linear-gradient(135deg, rgba(200,169,110,0.07) 0%, rgba(255,255,255,0.03) 100%);
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .app-card:hover {
    border-color: rgba(200,169,110,0.55);
    background: linear-gradient(135deg, rgba(200,169,110,0.13) 0%, rgba(255,255,255,0.05) 100%);
    transform: translateY(-2px);
  }
  .app-card-icon {
    font-size: 1.8rem; flex-shrink: 0;
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(200,169,110,0.12); border-radius: 12px;
  }
  .app-card-body { flex: 1; }
  .app-card-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; letter-spacing: 0.14em;
    color: #c8a96e; text-transform: uppercase; margin-bottom: 4px;
    display: flex; align-items: center; gap: 8px;
  }
  .app-card-new {
    font-family: 'DM Mono', monospace;
    font-size: 0.5rem; letter-spacing: 0.12em;
    color: #060c18; background: #c8a96e;
    padding: 2px 6px; border-radius: 2px;
    animation: new-pulse 2.4s ease-in-out infinite;
  }
  @keyframes new-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.55; }
  }
  .app-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem; color: #e8d8b8; font-weight: 400;
    margin: 0 0 4px;
  }
  .app-card-desc {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: rgba(232,216,184,0.55); line-height: 1.5;
  }
  .app-card-arrow {
    font-size: 1rem; color: rgba(200,169,110,0.5);
    transition: transform 0.2s, color 0.2s;
  }
  .app-card:hover .app-card-arrow { transform: translateX(4px); color: #c8a96e; }

  /* Button reset for app-card */
  button.app-card {
    font-family: inherit;
    font-size: inherit;
    padding: 20px 24px;
    margin: 0 0 48px;
    border: 1px solid rgba(200,169,110,0.25);
    text-align: left;
    width: 100%;
  }

  /* ── Top banner ── */
  .top-banner {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9850;
    display: flex; align-items: center; justify-content: center;
    padding: 0 20px;
    height: 40px;
    background: rgba(6,12,24,0.82);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(200,169,110,0.18);
  }
  .top-banner-link {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
    color: #e8d8b8;
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.1em;
    transition: color 0.2s;
  }
  .top-banner-link:hover { color: #c8a96e; }
  .top-banner-new {
    font-family: 'DM Mono', monospace;
    font-size: 0.48rem; letter-spacing: 0.12em;
    color: #060c18; background: #c8a96e;
    padding: 2px 6px; border-radius: 3px;
    text-transform: uppercase;
    animation: pulse-new 2.2s ease-in-out infinite;
  }
  .top-banner-arrow {
    color: rgba(200,169,110,0.6);
    transition: transform 0.2s;
  }
  .top-banner-link:hover .top-banner-arrow { transform: translateX(3px); color: #c8a96e; }

  /* ── Entrance animation ── */
  @keyframes letter-in {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .name-letter {
    display: inline-block;
    animation: letter-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
    font-feature-settings: "liga" 0, "clig" 0, "dlig" 0;
  }

  /* ── Page load + window flicker keyframes ── */
  @keyframes hero-fade-up {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hero-v2 .portfolio-eyebrow {
    animation: hero-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both;
  }
  .hero-v2-ornament {
    animation: hero-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both;
  }
  .hero-v2-disciplines {
    animation: hero-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.72s both;
  }
  .hero-v2-coords {
    animation: hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.90s both;
  }
  @keyframes win-flicker-a {
    0%,100%{opacity:0.20} 28%{opacity:0.13} 55%{opacity:0.22} 80%{opacity:0.17}
  }
  @keyframes win-flicker-b {
    0%,100%{opacity:0.18} 40%{opacity:0.24} 65%{opacity:0.11} 85%{opacity:0.20}
  }
  @keyframes win-flicker-c {
    0%,100%{opacity:0.21} 18%{opacity:0.15} 50%{opacity:0.23} 78%{opacity:0.16}
  }
  .win-flicker-a { animation: win-flicker-a 5.3s ease-in-out infinite; }
  .win-flicker-b { animation: win-flicker-b 7.9s ease-in-out infinite; }
  .win-flicker-c { animation: win-flicker-c 6.6s ease-in-out infinite; }

  /* ── Rain ── */
  .rain-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 10; overflow: hidden;
  }
  .raindrop {
    position: absolute; width: 2px;
    background: linear-gradient(to bottom, rgba(200,225,255,0.15), rgba(200,225,255,0.85));
    border-radius: 2px;
    animation: rain-fall linear infinite;
  }
  @keyframes rain-fall {
    0%   { transform: translateY(-120px) rotate(-8deg); opacity:0; }
    6%   { opacity:1; }
    88%  { opacity:0.9; }
    100% { transform: translateY(110vh) rotate(-8deg); opacity:0; }
  }
  .tram-stop { cursor: pointer; transition: filter 0.18s; }
  .tram-stop:hover { filter: brightness(1.18) drop-shadow(0 0 7px rgba(240,192,24,0.55)); }

  .rain-btn {
    position: fixed; bottom: 76px; right: 24px;
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(26,72,120,0.85);
    border: 1.5px solid rgba(255,255,255,0.25);
    color: #fff; font-size: 1.15rem; line-height:1;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 500;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    transition: background 0.2s, transform 0.15s;
  }
  .rain-btn:hover  { background: rgba(26,72,120,1); transform: scale(1.08); }
  .rain-btn.active { background: rgba(50,110,200,0.95); }

  /* ── Tram ── */
  .tram-wrap {
    position: absolute; bottom: 142px; left: 0;
    cursor: pointer; z-index: 5;
    animation: tram-ride 42s linear forwards;
  }
  .tram-wire {
    position: absolute; left: 0; bottom: 236px;
    width: ${SCENE_W}px; height: 2px;
    background: #686868;
    box-shadow: 0 1px 4px rgba(0,0,0,0.30);
    pointer-events: none; z-index: 4;
  }
  @keyframes tram-ride {
    from { transform: translateX(-380px); }
    to   { transform: translateX(${SCENE_W + 380}px); }
  }
  @keyframes cloud-drift {
    from { transform: translateX(0px);   }
    to   { transform: translateX(22px);  }
  }
  .fact-bubble {
    position: absolute; bottom: calc(100% + 10px); left: 50%;
    transform: translateX(-50%);
    background: rgba(8,16,36,0.94);
    border: 1px solid rgba(200,169,110,0.45);
    border-radius: 10px; padding: 10px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem; color: #e8d8b8; line-height: 1.55;
    max-width: 210px; white-space: normal;
    pointer-events: none;
    animation: fact-pop 0.22s ease;
    z-index: 50;
  }
  .fact-bubble::after {
    content: ''; position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(200,169,110,0.45);
  }
  @keyframes fact-pop {
    from { opacity:0; transform: translateX(-50%) translateY(6px); }
    to   { opacity:1; transform: translateX(-50%) translateY(0); }
  }

  /* ── View transition cover ── */
  .street-cover {
    position: fixed; inset: 0; z-index: 9999;
    background: #060c18;
    pointer-events: none;
    opacity: 0;
  }
  .street-cover.expand {
    animation: cover-expand 0.72s ease forwards;
  }
  .street-cover.retract {
    animation: cover-retract 1.1s ease forwards;
  }
  @keyframes cover-expand {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes cover-retract {
    0%   { opacity: 1; }
    25%  { opacity: 1; }
    100% { opacity: 0; }
  }

  /* ── Language toggle ── */
  .lang-btn {
    position: fixed; top: 14px; right: 20px; z-index: 9860;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.85);
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.14em;
    padding: 5px 11px; cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border-radius: 2px;
  }
  .lang-btn:hover { background: rgba(255,255,255,0.22); color: white; }
  .lang-btn.portfolio { border-color: rgba(200,169,110,0.4); color: rgba(200,169,110,0.85); }
  .lang-btn.portfolio:hover { background: rgba(200,169,110,0.12); color: #c8a96e; }
  .top-banner .lang-btn { position: absolute; top: 50%; right: 20px; transform: translateY(-50%); }


  @keyframes lamp-flicker {
    0%, 100% { opacity: 0.85; }
    12%       { opacity: 0.70; }
    14%       { opacity: 0.90; }
    60%       { opacity: 0.82; }
    80%       { opacity: 0.88; }
  }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .sign-name    { font-size: 1.1rem; }
    .sign-sub     { font-size: 0.48rem; }
    .panel        { width: 100vw; padding: 28px 20px 80px; }
    .portfolio-name { font-size: clamp(2.2rem, 10vw, 3.6rem); }
    .portfolio-tagline { font-size: clamp(0.82rem, 2.8vw, 1rem); }
    .chapter-card { padding: 20px 16px; }
    .connect-grid { grid-template-columns: 1fr; }
    .top-banner   { font-size: 0.55rem; padding: 6px 12px; }
    .rain-btn     { bottom: 20px; right: 16px; width: 38px; height: 38px; }
  }

  /* ── Easter egg: Fireflies ── */
  .fireflies-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 9990;
  }
  .firefly {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: radial-gradient(circle, #e8ff80 0%, #80ff40 55%, rgba(80,255,0,0) 100%);
    box-shadow: 0 0 6px 2px rgba(160,255,60,0.8), 0 0 12px 4px rgba(120,255,0,0.4);
    animation: firefly-drift linear forwards;
  }
  @keyframes firefly-drift {
    0%   { transform: translate(0, 0) scale(1); opacity: 0; }
    8%   { opacity: 1; }
    70%  { opacity: 0.85; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
  }

  /* ── Easter egg: Time freeze ── */
  .time-freeze-overlay {
    position: fixed; inset: 0; z-index: 9992;
    display: flex; align-items: center; justify-content: center;
    background: rgba(4, 8, 22, 0.78);
    backdrop-filter: blur(8px);
    pointer-events: none;
    animation: tf-appear 0.4s ease forwards;
  }
  .time-freeze-overlay.leaving {
    animation: tf-appear 0.35s ease reverse forwards;
  }
  .time-freeze-msg {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: clamp(1.6rem, 4vw, 2.8rem);
    color: rgba(240, 228, 200, 0.95);
    text-align: center;
    max-width: 600px;
    padding: 0 32px;
    line-height: 1.5;
    text-shadow: 0 0 40px rgba(200, 160, 80, 0.3);
  }
  @keyframes tf-appear {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Easter egg: Fog layer ── */
  .fog-layer {
    position: fixed; inset: 0; z-index: 20;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(180, 200, 220, 0) 0%,
      rgba(180, 200, 220, 0.18) 30%,
      rgba(210, 225, 240, 0.55) 65%,
      rgba(230, 240, 248, 0.72) 100%
    );
    animation: fog-in 3.5s ease forwards;
  }
  @keyframes fog-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }

  /* ── Worlds grid (in PortfolioView) ── */
  .worlds-section {
    margin-bottom: 72px;
  }
  .worlds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
  .world-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(200, 169, 110, 0.22);
    border-radius: 4px;
    padding: 24px 20px 20px;
    cursor: pointer;
    text-align: left;
    transition: background 0.28s, border-color 0.28s, transform 0.28s;
    position: relative;
    overflow: hidden;
  }
  .world-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(to bottom, #c8a96e 60%, rgba(200,169,110,0));
    transform: scaleY(0); transform-origin: top;
    transition: transform 0.32s cubic-bezier(0.16,1,0.3,1);
  }
  .world-card:hover {
    background: rgba(200, 169, 110, 0.06);
    border-color: rgba(200, 169, 110, 0.48);
    transform: translateY(-4px);
  }
  .world-card:hover::before { transform: scaleY(1); }
  .world-card-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.50rem; color: rgba(200, 169, 110, 0.40);
    letter-spacing: 0.18em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .world-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.45rem; font-weight: 400; color: #f0e8d8;
    margin-bottom: 8px; line-height: 1.15;
  }
  .world-card-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.88rem; color: rgba(220, 210, 240, 0.42); line-height: 1.5;
  }

  /* ── CadernoView ── */
  .caderno-wrap {
    position: fixed; inset: 0;
    background: #f5f0e4;
    overflow: hidden;
    display: flex; flex-direction: column;
    cursor: default;
  }
  .caderno-wrap * { cursor: inherit; }
  .caderno-wrap button, .caderno-wrap [role="button"] { cursor: pointer; }
  .caderno-header {
    display: flex; align-items: center; justify-content: center;
    padding: 0 24px;
    height: 52px;
    background: #ede8da;
    border-bottom: 1px solid #c8b89a;
    flex-shrink: 0;
    position: relative;
  }
  .caderno-back {
    position: absolute; left: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 0.70rem; letter-spacing: 0.1em;
    color: #5a4830; background: none; border: none;
    cursor: pointer; padding: 4px 0;
    transition: color 0.18s;
  }
  .caderno-back:hover { color: #2a1810; }
  .caderno-header-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: #8a7a60;
  }
  .caderno-page {
    --caderno-rule-gap: 38px;
    flex: 1;
    position: relative;
    background: #f5f0e4;
    background-image:
      repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent calc(var(--caderno-rule-gap) - 1px),
        #b8c8d8 calc(var(--caderno-rule-gap) - 1px),
        #b8c8d8 var(--caderno-rule-gap)
      );
    overflow: hidden;
  }
  .caderno-margin-line {
    position: absolute; top: 0; bottom: 0; left: 88px;
    width: 1px; background: rgba(200, 60, 60, 0.35);
    pointer-events: none;
  }
  .caderno-holes {
    position: absolute; top: 0; bottom: 0; left: 0;
    width: 52px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-evenly;
    pointer-events: none;
    padding: 40px 0;
  }
  .caderno-hole {
    width: 14px; height: 14px; border-radius: 50%;
    background: #ddd5c0;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.22), 0 0 0 2px #c8b89a;
  }
  .caderno-text-area {
    position: absolute;
    top: 0; left: 100px; right: 48px; bottom: 0;
    padding-top: 10px;
    overflow: hidden;
  }
  .caderno-text {
    font-family: 'Dancing Script', cursive;
    font-weight: 600;
    font-size: 1.55rem;
    color: #1a140a;
    line-height: var(--caderno-rule-gap);
    max-width: 660px;
    white-space: normal;
    transition: opacity 0.55s ease;
  }
  .caderno-text.fade-out { opacity: 0; }
  .caderno-char {
    display: inline-block;
    clip-path: inset(0 105% 0 0);
    animation: hand-stroke 0.088s ease-out forwards;
  }
  @keyframes hand-stroke {
    to { clip-path: inset(0 -5% 0 0); }
  }

  /* ── Caderno opening screen ── */
  .caderno-opening {
    position: fixed; inset: 0; z-index: 9999;
    background: #080a0f;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    transition: opacity 0.9s ease;
    cursor: pointer;
  }
  .caderno-opening.exit { opacity: 0; pointer-events: none; }
  .caderno-opening-text {
    font-family: 'Dancing Script', cursive;
    font-weight: 600;
    font-size: clamp(1.6rem, 3.8vw, 2.6rem);
    color: #c8a96e;
    line-height: 1.7;
    text-align: center;
    max-width: 680px;
    padding: 0 32px;
  }
  .caderno-opening-text .caderno-char { color: #c8a96e; }
  .caderno-enter-btn {
    margin-top: 52px;
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(200,169,110,0);
    background: none; border: none; cursor: pointer;
    padding: 10px 18px;
    transition: color 1.4s ease, letter-spacing 0.3s ease;
  }
  .caderno-enter-btn.visible { color: rgba(200,169,110,0.55); }
  .caderno-enter-btn:hover   { color: rgba(200,169,110,0.90); letter-spacing: 0.32em; }
  @keyframes caderno-opening-attr-in { from { opacity: 0; } to { opacity: 1; } }

  /* ── PortfolioCientificoView ── */
  .pc-wrap {
    position: fixed; inset: 0;
    background: var(--pc-bg, linear-gradient(to bottom, #080d18 0%, #0a1220 100%));
    border-top: 4px solid var(--pc-accent, #1a3a6e);
    overflow-y: auto; overflow-x: hidden;
    cursor: default;
  }
  .pc-wrap * { cursor: inherit; }
  .pc-wrap button, .pc-wrap [role="button"] { cursor: pointer; }
  .pc-back {
    position: fixed; top: 24px; left: 24px; z-index: 100;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--pc-back-color, rgba(200, 185, 150, 0.75));
    background: var(--pc-back-bg, rgba(255,255,255,0.04));
    border: 1px solid var(--pc-back-border, rgba(200,169,110,0.20));
    border-radius: 20px; padding: 7px 16px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    backdrop-filter: blur(6px);
  }
  .pc-back:hover {
    background: var(--pc-back-hover-bg, rgba(200,169,110,0.12));
    color: var(--pc-back-hover-color, rgba(200,185,150,1));
    border-color: var(--pc-back-hover-border, rgba(200,169,110,0.45));
  }
  .pc-inner {
    max-width: 760px; margin: 0 auto;
    padding: 80px 40px 80px;
    border-left: 1px solid var(--pc-inner-border, rgba(200,169,110,0.08));
    padding-left: 32px;
  }
  .pc-header {
    margin-bottom: 56px;
  }
  .pc-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--pc-eyebrow, rgba(200, 169, 110, 0.55)); margin-bottom: 14px;
  }
  .pc-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 300; font-style: italic;
    color: var(--pc-title, #f0e8d8); line-height: 1.1;
  }
  .pc-project {
    border-top: 1px solid var(--pc-project-border, rgba(200, 169, 110, 0.15));
    padding: 36px 0;
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 0 32px;
    transition: border-color 0.2s;
  }
  .pc-project:last-child { border-bottom: 1px solid var(--pc-project-border, rgba(200, 169, 110, 0.15)); }
  .pc-project:hover { border-top-color: var(--pc-project-hover, rgba(200, 169, 110, 0.38)); }
  .pc-project-meta {
    padding-top: 4px;
  }
  .pc-project-year {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--pc-project-year, rgba(200, 169, 110, 0.50)); margin-bottom: 6px;
  }
  .pc-project-tag {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; letter-spacing: 0.10em; text-transform: uppercase;
    color: var(--pc-tag-color, rgba(180, 210, 255, 0.50));
    border: 1px solid var(--pc-tag-border, rgba(180, 210, 255, 0.18));
    border-radius: 2px; padding: 2px 6px;
  }
  .pc-project-body {}
  .pc-project-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.45rem; font-weight: 500; color: var(--pc-project-title, #e8dfc8);
    margin-bottom: 6px; line-height: 1.2;
  }
  .pc-project-role {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.10em;
    color: var(--pc-project-role, rgba(200, 169, 110, 0.55)); margin-bottom: 14px;
  }
  .pc-project-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; color: var(--pc-project-desc, rgba(220, 210, 190, 0.75));
    line-height: 1.65; margin-bottom: 12px;
  }
  .pc-project-learned {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; color: var(--pc-project-learned, rgba(160, 185, 220, 0.50));
    line-height: 1.7; letter-spacing: 0.03em;
  }

  /* ── ResearchInterestsView ── */
  .ri-wrap {
    position: fixed; inset: 0;
    background: var(--ri-bg, linear-gradient(to bottom, #060c16 0%, #09111f 100%));
    border-top: 4px solid var(--ri-accent, #1a3a6e);
    overflow-y: auto; overflow-x: hidden;
    cursor: default;
  }
  .ri-wrap * { cursor: inherit; }
  .ri-wrap button, .ri-wrap [role="button"] { cursor: pointer; }
  .ri-back {
    position: fixed; top: 24px; left: 24px; z-index: 100;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--ri-back-color, rgba(200, 185, 150, 0.75));
    background: var(--ri-back-bg, rgba(255,255,255,0.04));
    border: 1px solid var(--ri-back-border, rgba(200,169,110,0.20));
    border-radius: 20px; padding: 7px 16px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    backdrop-filter: blur(6px);
  }
  .ri-back:hover {
    background: var(--ri-back-hover-bg, rgba(200,169,110,0.12));
    color: var(--ri-back-hover-color, rgba(200,185,150,1));
    border-color: var(--ri-back-hover-border, rgba(200,169,110,0.45));
  }
  .ri-inner {
    max-width: 760px; margin: 0 auto;
    padding: 80px 40px 80px;
    border-left: 1px solid var(--ri-inner-border, rgba(200,169,110,0.08));
    padding-left: 32px;
  }
  .ri-header { margin-bottom: 56px; }
  .ri-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.60rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ri-eyebrow, rgba(200, 169, 110, 0.55)); margin-bottom: 14px;
  }
  .ri-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 300; font-style: italic;
    color: var(--ri-title, #f0e8d8); line-height: 1.1;
  }
  .ri-subtitle {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; color: var(--ri-subtitle, rgba(220, 210, 190, 0.50));
    margin-top: 16px; line-height: 1.6; max-width: 520px;
  }
  .ri-area {
    border-top: 1px solid var(--ri-area-border, rgba(200, 169, 110, 0.15));
    padding: 40px 0;
  }
  .ri-area:last-child { border-bottom: 1px solid var(--ri-area-border, rgba(200, 169, 110, 0.15)); }
  .ri-area-header {
    display: flex; align-items: baseline; gap: 16px;
    margin-bottom: 16px;
  }
  .ri-area-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; letter-spacing: 0.18em;
    color: var(--ri-area-num, rgba(200, 169, 110, 0.35));
  }
  .ri-area-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.55rem; font-weight: 400; color: var(--ri-area-title, #e8dfc8);
  }
  .ri-area-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; color: var(--ri-area-desc, rgba(220, 210, 190, 0.70));
    line-height: 1.70; margin-bottom: 18px;
  }
  .ri-concepts {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .ri-concept {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.10em; text-transform: uppercase;
    color: var(--ri-concept-color, rgba(180, 210, 255, 0.55));
    border: 1px solid var(--ri-concept-border, rgba(180, 210, 255, 0.18));
    border-radius: 2px; padding: 3px 8px;
  }
  .ri-question {
    margin-top: 22px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.10rem; font-style: italic;
    color: var(--ri-question, rgba(200, 169, 110, 0.65));
    line-height: 1.6;
    border-left: 2px solid var(--ri-question-border, rgba(200,169,110,0.30));
    padding-left: 16px;
  }

  /* ── LinhaTempoView ── */
  /* Default to Gallery */
  .linha-wrap {
    position: fixed; inset: 0;
    background: linear-gradient(to bottom, #f5f3f0 0%, #ede9e4 50%, #e8e3dc 100%);
    overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    cursor: default;
  }
  /* THEME 1: Train Station (Warm vintage) */
  .linha-wrap.theme-train {
    background: linear-gradient(135deg, #2a2416 0%, #3d3220 25%, #4a3a2a 50%, #3a2f22 75%, #2a2416 100%) !important;
    background-attachment: fixed;
  }
  /* THEME 2: Gallery/Museum (Minimalist light) */
  .linha-wrap.theme-gallery {
    background: linear-gradient(to bottom, #f5f3f0 0%, #ede9e4 50%, #e8e3dc 100%) !important;
  }
  /* THEME 3: Museum (Classic warm neutrals) */
  .linha-wrap.theme-museum {
    background: var(--linha-bg, linear-gradient(135deg, #f8f6f2 0%, #f0ede8 25%, #e8e3dc 50%, #e0ddd8 75%, #d8d5d0 100%)) !important;
    background-attachment: fixed;
  }
  .linha-wrap * { cursor: inherit; }
  .linha-wrap button, .linha-wrap [role="button"] { cursor: pointer; }
  
  .linha-back {
    position: fixed; top: 24px; left: 24px; z-index: 100;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
    background: rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 20px; padding: 7px 16px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    backdrop-filter: blur(6px);
    color: #5a5a5a;
  }
  .linha-back:hover {
    background: rgba(0,0,0,0.12);
    color: #3a3a3a;
    border-color: rgba(0,0,0,0.25);
  }
  
  /* Train theme adjustments */
  .linha-wrap.theme-train .linha-back {
    background: rgba(255,255,255,0.06);
    border-color: rgba(200,169,110,0.25);
    color: rgba(200,185,150,0.8);
  }
  .linha-wrap.theme-train .linha-back:hover {
    background: rgba(200,169,110,0.12);
    color: rgba(200,185,150,1);
    border-color: rgba(200,169,110,0.45);
  }
  
  .linha-film {
    position: relative;
    width: 100%;
    user-select: none;
  }
  .linha-sprockets {
    display: flex; gap: 0;
    padding: 8px 0;
    overflow: hidden;
    pointer-events: none;
  }
  .linha-sprocket {
    width: 28px; height: 20px; flex-shrink: 0;
    margin: 0 12px;
    background: rgba(0,0,0,0.08);
    border-radius: 4px;
  }
  .linha-wrap.theme-train .linha-sprocket {
    background: rgba(255,255,255,0.08);
  }
  
  .linha-frames-track {
    display: flex;
    cursor: grab;
    overflow: hidden;
    position: relative;
  }
  .linha-frames-track:active { cursor: grabbing; }
  .linha-frame {
    width: 220px; flex-shrink: 0;
    background: rgba(0,0,0,0.03);
    border-right: 1px solid rgba(0,0,0,0.06);
    padding: 18px 16px 16px;
    display: flex; flex-direction: column;
    position: relative;
  }
  .linha-wrap.theme-train .linha-frame {
    background: rgba(255,255,255,0.04);
    border-right-color: rgba(255,255,255,0.06);
  }
  
  .linha-frame-date {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem; color: #8a7a6a;
    letter-spacing: 0.16em; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .linha-wrap.theme-train .linha-frame-date {
    color: rgba(200,169,110,0.65);
  }
  
  .linha-frame-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.25rem; font-weight: 400; color: #2a2a2e;
    margin-bottom: 8px; line-height: 1.2;
  }
  .linha-wrap.theme-train .linha-frame-title {
    color: #f0e8d8;
  }
  
  .linha-frame-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.88rem; color: #5a5a6a;
    line-height: 1.5; flex: 1;
  }
  .linha-wrap.theme-train .linha-frame-desc {
    color: rgba(220,210,240,0.45);
  }
  
  /* Museum theme adjustments */
  .linha-wrap.theme-museum .linha-back {
    background: var(--linha-back-bg, rgba(0,0,0,0.04));
    border-color: var(--linha-back-border, rgba(139,115,85,0.25));
    color: var(--linha-back-color, rgba(139,115,85,0.8));
  }
  .linha-wrap.theme-museum .linha-back:hover {
    background: var(--linha-back-hover-bg, rgba(139,115,85,0.08));
    color: var(--linha-back-hover-color, rgba(139,115,85,1));
    border-color: var(--linha-back-hover-border, rgba(139,115,85,0.4));
  }
  
  .linha-wrap.theme-museum .linha-sprocket {
    background: rgba(139,115,85,0.08);
  }
  
  .linha-wrap.theme-museum .linha-frame {
    background: rgba(0,0,0,0.02);
    border-right-color: rgba(139,115,85,0.1);
  }
  
  .linha-wrap.theme-museum .linha-frame-date {
    color: rgba(139,115,85,0.6);
  }
  
  .linha-wrap.theme-museum .linha-frame-title {
    color: #2a2a2e;
  }
  
  .linha-wrap.theme-museum .linha-frame-desc {
    color: rgba(42,42,46,0.6);
  }
  
  .linha-frame-dot {
    width: 8px; height: 8px; border-radius: 50%;
    margin-top: 14px;
    background: #c8a96e;
  }
  .linha-hint {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.14em;
    color: rgba(200,169,110,0.5);
    margin-top: 14px;
    animation: linha-hint-fade 3s ease forwards;
  }
  @keyframes linha-hint-fade {
    0%   { opacity: 1; }
    70%  { opacity: 1; }
    100% { opacity: 0; }
  }

  .lt-museum-shell {
    min-height: 100vh;
    padding: 96px 40px 120px;
    position: relative;
    overflow-y: auto;
  }
  .lt-museum-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      var(--linha-wall-glow, radial-gradient(circle at top, rgba(255,248,235,0.95) 0%, rgba(255,248,235,0) 42%)),
      var(--linha-wall-shade, linear-gradient(to bottom, rgba(120,90,60,0.08), transparent 18%, transparent 82%, rgba(120,90,60,0.12)));
  }
  .lt-museum-shell::after {
    content: '';
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 22vh;
    pointer-events: none;
    background:
      var(--linha-floor-glow, linear-gradient(to bottom, rgba(114,86,58,0) 0%, rgba(114,86,58,0.08) 35%, rgba(114,86,58,0.24) 100%)),
      repeating-linear-gradient(
        90deg,
        var(--linha-floor-line, rgba(120,88,58,0.18)) 0px,
        var(--linha-floor-line, rgba(120,88,58,0.18)) 1px,
        var(--linha-floor-gap, rgba(230,220,210,0.08)) 1px,
        var(--linha-floor-gap, rgba(230,220,210,0.08)) 110px
      );
  }
  .lt-museum-inner {
    max-width: 1280px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .lt-museum-topline {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 22px;
  }
  .lt-museum-kicker {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--linha-kicker, rgba(110, 84, 58, 0.62));
    margin-bottom: 14px;
  }
  .lt-museum-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.2rem, 8vw, 6.8rem);
    line-height: 0.92;
    font-weight: 300;
    color: var(--linha-title, #2f2720);
    max-width: 700px;
  }
  .lt-museum-title em {
    font-style: italic;
    color: var(--linha-title-em, #8b6d45);
  }
  .lt-museum-intro {
    max-width: 520px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.18rem;
    line-height: 1.65;
    color: rgba(47, 39, 32, 0.78);
    padding-top: 18px;
  }
  .lt-museum-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.85fr);
    gap: 34px;
    align-items: start;
  }
  .lt-museum-gallery {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }
  .lt-museum-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 240px;
    padding: 18px;
    border: 1px solid rgba(112, 87, 63, 0.16);
    background: var(--linha-card-bg, linear-gradient(145deg, rgba(255,255,255,0.72), rgba(244,237,230,0.94)));
    box-shadow:
      0 28px 60px var(--linha-card-shadow, rgba(77, 55, 35, 0.09)),
      inset 0 0 0 1px var(--linha-card-inset, rgba(255,255,255,0.55));
    cursor: pointer;
    transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
  }
  .lt-museum-card:hover {
    transform: translateY(-6px);
    box-shadow:
      0 38px 72px var(--linha-card-hover-shadow, rgba(77, 55, 35, 0.14)),
      inset 0 0 0 1px var(--linha-card-hover-inset, rgba(255,255,255,0.7));
    border-color: var(--linha-card-hover-border, rgba(112, 87, 63, 0.28));
  }
  .lt-museum-card.active {
    transform: translateY(-10px);
    border-color: var(--linha-card-active-border, rgba(112, 87, 63, 0.36));
    box-shadow:
      0 40px 84px var(--linha-card-active-shadow, rgba(77, 55, 35, 0.16)),
      0 0 0 1px var(--linha-card-active-ring, rgba(173, 136, 94, 0.12)),
      inset 0 0 0 1px var(--linha-card-active-inset, rgba(255,255,255,0.82));
  }
  .lt-museum-card::before {
    content: '';
    position: absolute;
    inset: 10px;
    border: 1px solid var(--linha-card-inner-border, rgba(117, 91, 64, 0.14));
    pointer-events: none;
  }
  .lt-museum-card::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -18px;
    width: 1px;
    height: 18px;
    background: linear-gradient(to bottom, var(--linha-card-thread, rgba(144,111,78,0.65)), rgba(144,111,78,0));
    pointer-events: none;
  }
  .lt-museum-card.span-4 { grid-column: span 4; }
  .lt-museum-card.span-5 { grid-column: span 5; }
  .lt-museum-card.span-6 { grid-column: span 6; }
  .lt-museum-card.span-7 { grid-column: span 7; }
  .lt-museum-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 22px;
  }
  .lt-museum-card-date {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--linha-date, rgba(112, 87, 63, 0.68));
    margin-bottom: 12px;
  }
  .lt-museum-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 2.2vw, 2rem);
    line-height: 1.02;
    color: var(--linha-card-title, #2c241e);
  }
  .lt-museum-card-index {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    color: var(--linha-index, rgba(112, 87, 63, 0.42));
    padding-top: 3px;
  }
  .lt-museum-card-plaque {
    padding: 18px 16px 14px;
    background: var(--linha-plaque-bg, rgba(115, 88, 60, 0.06));
    border: 1px solid var(--linha-plaque-border, rgba(115, 88, 60, 0.1));
    backdrop-filter: blur(5px);
  }
  .lt-museum-card-type {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .lt-museum-card-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--linha-card-text, rgba(47, 39, 32, 0.75));
  }
  .lt-museum-side {
    position: sticky;
    top: 88px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .lt-museum-panel,
  .lt-museum-stats,
  .lt-museum-list {
    background: var(--linha-panel-bg, rgba(249, 245, 239, 0.78));
    border: 1px solid var(--linha-panel-border, rgba(117, 91, 64, 0.14));
    box-shadow: 0 20px 50px var(--linha-panel-shadow, rgba(77, 55, 35, 0.08));
    backdrop-filter: blur(10px);
  }
  .lt-museum-panel { padding: 26px 24px; }
  .lt-museum-panel-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--linha-panel-label, rgba(112, 87, 63, 0.62));
    margin-bottom: 12px;
  }
  .lt-museum-panel-date {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--linha-panel-date, rgba(112, 87, 63, 0.58));
    margin-bottom: 10px;
  }
  .lt-museum-panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.25rem;
    line-height: 1.02;
    color: var(--linha-panel-title, #2c241e);
    margin-bottom: 12px;
  }
  .lt-museum-panel-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem;
    line-height: 1.7;
    color: var(--linha-panel-text, rgba(47, 39, 32, 0.8));
  }
  .lt-museum-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }
  .lt-museum-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 999px;
    background: var(--linha-chip-bg, rgba(112, 87, 63, 0.07));
    color: var(--linha-chip-color, rgba(47, 39, 32, 0.75));
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .lt-museum-chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lt-museum-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .lt-museum-stat {
    padding: 18px 16px;
    border-right: 1px solid var(--linha-stat-border, rgba(117, 91, 64, 0.12));
  }
  .lt-museum-stat:last-child { border-right: none; }
  .lt-museum-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    line-height: 1;
    color: var(--linha-stat-value, #2c241e);
    margin-bottom: 6px;
  }
  .lt-museum-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.56rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--linha-stat-label, rgba(112, 87, 63, 0.56));
  }
  .lt-museum-list { padding: 18px 0; }
  .lt-museum-list-row {
    width: 100%;
    display: grid;
    grid-template-columns: 72px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 24px;
    background: transparent;
    border: none;
    border-top: 1px solid var(--linha-list-border, rgba(117, 91, 64, 0.08));
    text-align: left;
    transition: background 0.18s ease;
  }
  .lt-museum-list-row:first-child { border-top: none; }
  .lt-museum-list-row:hover,
  .lt-museum-list-row.active { background: var(--linha-list-hover, rgba(117, 91, 64, 0.06)); }
  .lt-museum-list-date {
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--linha-list-date, rgba(112, 87, 63, 0.52));
  }
  .lt-museum-list-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem;
    color: var(--linha-list-title, #2c241e);
  }

  .lt-museum-list-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  @media (max-width: 1080px) {
    .lt-museum-grid {
      grid-template-columns: 1fr;
    }
    .lt-museum-side {
      position: static;
    }
  }
  @media (max-width: 760px) {
    .lt-museum-shell {
      padding: 92px 18px 120px;
    }
    .lt-museum-topline {
      flex-direction: column;
    }
    .lt-museum-gallery {
      grid-template-columns: 1fr;
    }
    .lt-museum-card.span-4,
    .lt-museum-card.span-5,
    .lt-museum-card.span-6,
    .lt-museum-card.span-7 {
      grid-column: span 1;
    }
    .lt-museum-stats {
      grid-template-columns: 1fr;
    }
    .lt-museum-stat {
      border-right: none;
      border-top: 1px solid rgba(117, 91, 64, 0.12);
    }
    .lt-museum-stat:first-child {
      border-top: none;
    }
    .lt-museum-list-row {
      grid-template-columns: 1fr auto;
    }
    .lt-museum-list-date {
      grid-column: 1 / -1;
    }
  }

  /* ── Design switcher ── */
  /* ── Design: Acordeão ── */
  .lt-acord-scroll {
    position: fixed; inset: 0; overflow-y: auto;
    padding: 90px 0 120px;
    display: flex; flex-direction: column; align-items: center;
  }
  .lt-acord-inner { width: 100%; max-width: 600px; padding: 0 32px; }
  .lt-acord-row {
    border-bottom: 1px solid rgba(200,169,110,0.08);
    cursor: pointer;
  }
  .lt-acord-row:first-child { border-top: 1px solid rgba(200,169,110,0.08); }
  .lt-acord-head { display: flex; align-items: center; gap: 16px; padding: 18px 0; }
  .lt-acord-date {
    font-family: 'DM Mono', monospace; font-size: 0.56rem;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(200,169,110,0.55); width: 68px; flex-shrink: 0;
  }
  .lt-acord-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.35rem;
    font-weight: 400; color: rgba(240,232,216,0.8); flex: 1; transition: color 0.18s;
  }
  .lt-acord-row:hover .lt-acord-title,
  .lt-acord-row.open .lt-acord-title { color: #f0e8d8; }
  .lt-acord-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .lt-acord-chevron {
    font-family: 'DM Mono', monospace; font-size: 0.7rem;
    color: rgba(200,169,110,0.35); transition: transform 0.22s; flex-shrink: 0;
  }
  .lt-acord-row.open .lt-acord-chevron { transform: rotate(90deg); }
  .lt-acord-body {
    padding: 0 0 22px 84px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.98rem; color: rgba(220,210,190,0.5); line-height: 1.7;
    animation: acord-reveal 0.22s ease;
  }
  @keyframes acord-reveal {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Design: Editorial ── */
  .lt-edit-scroll {
    position: fixed; inset: 0; overflow-y: auto;
    padding: 80px 0 120px;
  }
  .lt-edit-inner { width: 100%; max-width: 720px; margin: 0 auto; padding: 0 48px; }
  .lt-edit-entry {
    display: grid; grid-template-columns: 100px 1fr;
    gap: 0 36px; padding: 56px 0;
    border-bottom: 1px solid rgba(200,169,110,0.07);
    align-items: start;
  }
  .lt-edit-entry:first-child { padding-top: 0; }
  .lt-edit-num {
    font-family: 'DM Mono', monospace; font-size: 0.5rem;
    color: rgba(200,169,110,0.25); letter-spacing: 0.1em; margin-bottom: 12px;
  }
  .lt-edit-date {
    font-family: 'DM Mono', monospace; font-size: 0.57rem;
    color: rgba(200,169,110,0.6); letter-spacing: 0.14em;
    text-transform: uppercase; line-height: 1.5;
  }
  .lt-edit-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 14px; }
  .lt-edit-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem; font-weight: 300; color: #f0e8d8;
    line-height: 1.1; margin-bottom: 14px;
  }
  .lt-edit-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem; color: rgba(220,210,190,0.45); line-height: 1.7;
  }

  /* ── Design: Rota ── */
  .lt-rota-wrap {
    position: fixed; inset: 0; overflow: hidden;
    display: flex; align-items: center; cursor: grab;
  }
  .lt-rota-wrap:active { cursor: grabbing; }
  .lt-rota-scene {
    position: relative; height: 100%;
    will-change: transform; user-select: none;
  }
  .lt-rota-rail {
    position: absolute; left: 0; right: 0; top: 50%; height: 1px;
    background: linear-gradient(to right, transparent, rgba(200,169,110,0.25) 6%, rgba(200,169,110,0.25) 94%, transparent);
    transform: translateY(-50%);
  }
  .lt-rota-dot {
    position: absolute; width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid; transform: translate(-50%, -50%);
    transition: transform 0.18s, background 0.18s; cursor: pointer;
  }
  .lt-rota-dot:hover { transform: translate(-50%, -50%) scale(1.5); }
  .lt-rota-dot.active { transform: translate(-50%, -50%) scale(1.5); }
  .lt-rota-ldate {
    font-family: 'DM Mono', monospace; font-size: 0.5rem;
    color: rgba(200,169,110,0.45); letter-spacing: 0.1em;
    text-transform: uppercase; white-space: nowrap; text-align: center;
  }
  .lt-rota-ltitle {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.88rem; color: rgba(240,232,216,0.6);
    white-space: nowrap; text-align: center; line-height: 1.2; margin-top: 3px;
  }
  .lt-rota-card {
    position: absolute; width: 190px; left: 0;
    transform: translateX(-50%);
    background: rgba(8,12,24,0.96);
    border: 1px solid rgba(200,169,110,0.25);
    border-radius: 4px; padding: 14px 16px;
    pointer-events: none; z-index: 10;
  }
  .lt-rota-card-date {
    font-family: 'DM Mono', monospace; font-size: 0.54rem;
    color: rgba(200,169,110,0.6); letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .lt-rota-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-weight: 400; color: #f0e8d8;
    margin-bottom: 7px; line-height: 1.2;
  }
  .lt-rota-card-desc {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.82rem; color: rgba(220,210,190,0.5); line-height: 1.5;
  }

  /* ── World card glyph ── */
  .world-card-glyph {
    font-size: 1.1rem;
    color: rgba(200, 169, 110, 0.35);
    margin-bottom: 8px;
    line-height: 1;
  }

  /* ── View fade-in animation ── */
  @keyframes view-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pc-wrap, .ri-wrap, .linha-wrap, .caderno-wrap {
    animation: view-fade-in 0.45s cubic-bezier(0.16,1,0.3,1) both;
  }

  /* ── Scroll hint ── */
  .scroll-hint {
    position: fixed; bottom: 32px; left: 50%;
    transform: translateX(-50%);
    font-family: 'DM Mono', monospace;
    font-size: 0.70rem; color: rgba(200,169,110,0.40);
    letter-spacing: 0.2em;
    pointer-events: none;
    animation: scroll-hint-bounce 2s ease-in-out infinite;
  }
  @keyframes scroll-hint-bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50%       { transform: translateX(-50%) translateY(5px); }
  }

  /* ── Contact section ── */
  .contact-section {
    margin-bottom: 72px;
  }
  .contact-body {
    display: flex; flex-direction: column; gap: 16px;
  }
  .contact-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.10rem; color: rgba(220,210,190,0.60);
    line-height: 1.65; max-width: 480px;
  }
  .contact-links {
    display: flex; flex-wrap: wrap; gap: 20px; align-items: center;
  }
  .contact-link {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem; letter-spacing: 0.08em;
    color: rgba(200,169,110,0.80);
    text-decoration: none;
    border-bottom: 1px solid rgba(200,169,110,0.30);
    padding-bottom: 2px;
    transition: color 0.18s, border-color 0.18s;
  }
  .contact-link:hover {
    color: rgba(200,169,110,1);
    border-color: rgba(200,169,110,0.70);
  }
  /* Active project badge */
  .pc-project-active {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(100,220,140,0.80);
    border: 1px solid rgba(100,220,140,0.28);
    border-radius: 2px; padding: 2px 7px;
    margin-left: 8px; vertical-align: middle;
  }
  /* World bottom nav */
  .world-bottom-nav {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid rgba(200,169,110,0.12);
    padding: 32px 0 0; margin-top: 48px;
  }
  .world-nav-btn {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(200,169,110,0.50);
    background: none; border: none; cursor: pointer;
    transition: color 0.18s;
    padding: 0;
  }
  .world-nav-btn:hover { color: rgba(200,169,110,0.95); }
  .world-nav-btn.next { text-align: right; }

  /* ── Easter egg counter ── */
  .egg-counter {
    position: fixed; bottom: 22px; left: 24px; z-index: 9000;
    display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
    pointer-events: auto;
  }
  .egg-bar {
    display: flex; align-items: center; gap: 8px;
  }
  .egg-score {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.10em;
    color: rgba(200,169,110,0.55);
  }
  .egg-score .egg-n { color: rgba(200,169,110,0.90); }
  .egg-dots {
    display: flex; gap: 7px; align-items: center;
  }
  .egg-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(200,169,110,0.12);
    border: 1px solid rgba(200,169,110,0.18);
    transition: background 0.5s, box-shadow 0.5s;
  }
  .egg-dot.found {
    background: rgba(200,169,110,0.75);
    box-shadow: 0 0 7px rgba(200,169,110,0.50);
    border-color: rgba(200,169,110,0.60);
  }
  .egg-hint-btn {
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(200,169,110,0.08);
    border: 1px solid rgba(200,169,110,0.22);
    color: rgba(200,169,110,0.55);
    font-family: 'DM Mono', monospace;
    font-size: 0.55rem; line-height: 1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .egg-hint-btn:hover, .egg-hint-btn.open {
    background: rgba(200,169,110,0.18);
    border-color: rgba(200,169,110,0.55);
    color: rgba(200,169,110,0.90);
  }
  .egg-hints-panel {
    display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
    background: rgba(10,16,30,0.88);
    border: 1px solid rgba(200,169,110,0.18);
    border-radius: 4px; padding: 10px 14px;
    animation: egg-toast-in 0.22s ease both;
  }
  .egg-hint-row {
    display: flex; align-items: center; gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 0.52rem; letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .egg-hint-dot {
    width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
    background: rgba(200,169,110,0.18);
    border: 1px solid rgba(200,169,110,0.25);
  }
  .egg-hint-dot.found { background: rgba(200,169,110,0.75); border-color: rgba(200,169,110,0.60); }
  .egg-hint-name { color: rgba(200,169,110,0.85); }
  .egg-hint-clue { color: rgba(200,169,110,0.38); font-style: italic; }
  .egg-toast {
    position: fixed; bottom: 52px; left: 24px; z-index: 9001;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(200,169,110,0.90);
    background: rgba(10,16,30,0.82);
    border: 1px solid rgba(200,169,110,0.22);
    border-radius: 3px; padding: 5px 12px;
    animation: egg-toast-in 0.35s ease both, egg-toast-out 0.4s ease 1.8s both;
    pointer-events: none;
  }
  @keyframes egg-toast-in  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  @keyframes egg-toast-out { from { opacity:1; } to { opacity:0; } }
`;



/* ── useJazz hook ───────────────────────────────────────── */
function useJazz() {
  const [playing, setPlaying] = useState(false);
  const ctxRef      = useRef(null);
  const reverbRef   = useRef(null);
  const intervalRef = useRef(null);
  const beatRef     = useRef(0);
  const nextBeatRef = useRef(0);

  // Ambient: 58 BPM — slow, dreamy Lisboa night
  const BPM      = 58;
  const BEAT     = 60 / BPM; // ~1.034 s per beat
  const LOOKAHEAD = 0.5;

  // Gentle major-seventh progression: Fmaj7 → Am7 → Cmaj7 → Em7
  const CHORDS = [
    [174.61, 220.00, 261.63, 329.63], // Fmaj7  F3 A3 C4 E4
    [220.00, 261.63, 329.63, 392.00], // Am7    A3 C4 E4 G4
    [261.63, 329.63, 392.00, 493.88], // Cmaj7  C4 E4 G4 B4
    [164.81, 207.65, 246.94, 311.13], // Em7    E3 G3 B3 D4
  ];

  // Sparse high melody — C pentatonic (C5 D5 E5 G5 A5)
  const MELODY = [523.25, 587.33, 659.25, 783.99, 880.00];

  const scheduleNotes = useCallback(() => {
    const ctx    = ctxRef.current;
    const reverb = reverbRef.current;
    if (!ctx || !reverb) return;

    // Proper lookahead scheduler: fire all beats due within the window
    while (nextBeatRef.current < ctx.currentTime + LOOKAHEAD) {
      const noteTime    = nextBeatRef.current;
      const beat        = beatRef.current;
      const chordIdx    = Math.floor(beat / 8) % CHORDS.length;
      const beatInChord = beat % 8;

      // Slow sine pad — on beat 0 of each 8-beat phrase
      if (beatInChord === 0) {
        CHORDS[chordIdx].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g   = ctx.createGain();
          osc.type  = "sine";
          osc.frequency.setValueAtTime(freq, noteTime);
          const vol = 0.050 - i * 0.007; // root loudest, upper voices softer
          g.gain.setValueAtTime(0.0001, noteTime);
          g.gain.linearRampToValueAtTime(vol, noteTime + 1.4);            // slow attack
          g.gain.setValueAtTime(vol * 0.85, noteTime + BEAT * 6.0);      // sustain
          g.gain.linearRampToValueAtTime(0.0001, noteTime + BEAT * 9.0); // slow release
          osc.connect(g);
          g.connect(ctx.destination);
          g.connect(reverb);
          osc.start(noteTime);
          osc.stop(noteTime + BEAT * 9.5);
        });
      }

      // Sparse high melody — beats 3 and 5, ~38% chance each
      if ((beatInChord === 3 || beatInChord === 5) && Math.random() < 0.38) {
        const freq = MELODY[Math.floor(Math.random() * MELODY.length)];
        const osc  = ctx.createOscillator();
        const g    = ctx.createGain();
        osc.type   = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);
        g.gain.setValueAtTime(0.0001, noteTime);
        g.gain.linearRampToValueAtTime(0.026, noteTime + 0.07);
        g.gain.exponentialRampToValueAtTime(0.0001, noteTime + BEAT * 1.8);
        osc.connect(g);
        g.connect(ctx.destination);
        g.connect(reverb);
        osc.start(noteTime);
        osc.stop(noteTime + BEAT * 2.0);
      }

      beatRef.current    += 1;
      nextBeatRef.current += BEAT;
    }
  }, []);

  const toggle = useCallback(() => {
    if (!playing) {
      const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      beatRef.current    = 0;
      nextBeatRef.current = ctx.currentTime + 0.1;

      // Delay-based reverb: tap → feedback loop → wet gain → output
      const delay    = ctx.createDelay(2.0);
      const feedback = ctx.createGain();
      const wet      = ctx.createGain();
      delay.delayTime.value = 0.38;
      feedback.gain.value   = 0.40;
      wet.gain.value        = 0.50;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);
      reverbRef.current = delay;

      scheduleNotes();
      intervalRef.current = setInterval(scheduleNotes, 100);
      setPlaying(true);
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      ctxRef.current.close();
      ctxRef.current = null;
      reverbRef.current = null;
      setPlaying(false);
    }
  }, [playing, scheduleNotes]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return { playing, toggle };
}


/* ── Custom Cursor ──────────────────────────────────────── */
function CustomCursor({ isNight, nightRef }) {
  const dotRef = useRef();
  const ringRef = useRef();

  useEffect(() => {
    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = x + "px";
        dotRef.current.style.top = y + "px";
      }
      if (ringRef.current) {
        ringRef.current.style.left = x + "px";
        ringRef.current.style.top = y + "px";
      }
      // Update night overlay spotlight via ref (no React state)
      if (nightRef && nightRef.current) {
        const cls = nightRef.current.className;
        if (cls === 'portfolio-spotlight') {
          // warm glow only — no darkness
          nightRef.current.style.background =
            `radial-gradient(circle 260px at ${x}px ${y}px, rgba(255,215,110,0.18) 0%, rgba(210,170,90,0.08) 55%, transparent 100%)`;
        } else {
          // street night — dark with spotlight hole
          nightRef.current.style.background =
            `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255,210,90,0.06) 0%, transparent 38%, rgba(8,4,22,0.97) 72%)`;
        }
      }
    };
    const onOver = (e) => {
      const el = e.target;
      const interactive = el.closest("button, a, .door-g, .connect-item, .lamppost, .chapter-card, .explore-btn");
      if (ringRef.current) {
        ringRef.current.classList.toggle("hover", !!interactive);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [nightRef]);

  useEffect(() => {
    if (dotRef.current) dotRef.current.classList.toggle("night", !!isNight);
    if (ringRef.current) ringRef.current.classList.toggle("night", !!isNight);
  }, [isNight]);

  return (
    <>
      <div id="cur-dot" ref={dotRef} />
      <div id="cur-ring" ref={ringRef} />
    </>
  );
}


/* ── Color helper ───────────────────────────────────────── */
const tint = (hex, f) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
};


/* ── Thematic Building Helper ── shared door SVG ── */
function BldgDoor({ DX, DW, DH, H, wall }) {
  const AR = DW / 2, ACY = H - DH;
  return (
    <g className="door-g door-cue">
      <rect className="door-surround" x={DX-13} y={ACY-10} width={DW+26} height={H-ACY+10} fill={tint(wall,0.68)}/>
      <path className="door-surround" d={`M${DX-13},${ACY} a${AR+13},${AR+13} 0 0,1 ${DW+26},0 Z`} fill={tint(wall,0.68)}/>
      <rect x={DX-2} y={ACY} width={DW+4} height={H-ACY} fill="rgba(0,0,0,0.20)"/>
      <rect className="door-body" x={DX} y={ACY} width={DW} height={H-ACY} fill="#1c1006"/>
      <path className="door-body" d={`M${DX},${ACY} a${AR},${AR} 0 0,1 ${DW},0 Z`} fill="#1c1006"/>
      <rect x={DX} y={ACY} width={4} height={H-ACY} fill="rgba(255,255,255,0.07)"/>
      <path d={`M${DX+3},${ACY} a${AR-3},${AR-3} 0 0,1 ${DW-6},0 Z`} fill="#98bccc" opacity="0.72"/>
      <path d={`M${DX+5},${ACY} a${AR-7},${AR-7} 0 0,1 ${DW*0.42},0`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      {[-0.28,0,0.28].map((a,i)=>{
        const ex=DX+DW/2+Math.sin(a)*(AR-4), ey=ACY-Math.cos(a)*(AR-4);
        return <line key={i} x1={DX+DW/2} y1={ACY} x2={ex} y2={ey} stroke="#5a3810" strokeWidth="1.2"/>;
      })}
      {(()=>{ const rH=H-ACY,ph=rH*0.30,ph2=rH*0.38,hw=DW/2-9; return <>
        <rect x={DX+6}      y={ACY+8}      width={hw} height={ph}  rx="2" fill="none" stroke="#32200a" strokeWidth="1.4"/>
        <rect x={DX+DW/2+3} y={ACY+8}      width={hw} height={ph}  rx="2" fill="none" stroke="#32200a" strokeWidth="1.4"/>
        <rect x={DX+6}      y={ACY+8+ph+6} width={hw} height={ph2} rx="2" fill="none" stroke="#32200a" strokeWidth="1.4"/>
        <rect x={DX+DW/2+3} y={ACY+8+ph+6} width={hw} height={ph2} rx="2" fill="none" stroke="#32200a" strokeWidth="1.4"/>
      </>; })()}
      <line x1={DX+DW/2} y1={ACY} x2={DX+DW/2} y2={H} stroke="#140c04" strokeWidth="1.5"/>
      <circle cx={DX+DW*0.73} cy={ACY+(H-ACY)*0.46} r="4.5" fill="#c8a96e" stroke="#906030" strokeWidth="1"/>
      <circle cx={DX+DW*0.27} cy={ACY+(H-ACY)*0.46} r="4.5" fill="#c8a96e" stroke="#906030" strokeWidth="1"/>
    </g>
  );
}

/* ── MuseumBldg ── neoclassical, columns, pediment ── */
function MuseumBldg({ x, onOpen, isNight }) {
  const W=520, H=460, WALL="#ece8d6";
  const DW=78, DH=118, DX=(W-DW)/2;
  const cols = Array.from({length:6},(_,i)=>Math.round((i+1)*W/7-10));
  return (
    <svg style={{position:'absolute',left:x,bottom:140,overflow:'visible'}} width={W} height={H}>
      <defs>
        <filter id={`ms_${x}`} x="-8%" y="0%" width="120%" height="100%">
          <feDropShadow dx="7" dy="0" stdDeviation="6" floodOpacity="0.18"/>
        </filter>
        <linearGradient id={`mwl_${x}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)"/>
          <stop offset="55%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.10)"/>
        </linearGradient>
      </defs>

      {/* Main wall */}
      <rect x={0} y={58} width={W} height={H-58} fill={WALL} filter={`url(#ms_${x})`}/>
      <rect x={0} y={58} width={W} height={H-58} fill={`url(#mwl_${x})`}/>

      {/* Pediment */}
      <polygon points={`${W*0.13},58 ${W*0.87},58 ${W*0.5},10`} fill={tint(WALL,0.94)}/>
      <polygon points={`${W*0.13},58 ${W*0.87},58 ${W*0.5},10`} fill="none" stroke={tint(WALL,0.72)} strokeWidth="2.5"/>
      <ellipse cx={W*0.5} cy={36} rx={26} ry={17} fill={tint(WALL,0.87)}/>
      <ellipse cx={W*0.5} cy={36} rx={26} ry={17} fill="none" stroke={tint(WALL,0.68)} strokeWidth="1.2"/>

      {/* Entablature */}
      <rect x={-14} y={54} width={W+28} height={28} fill={tint(WALL,0.85)}/>
      <rect x={-14} y={54} width={W+28} height={3}  fill="rgba(255,255,255,0.22)"/>
      <rect x={-14} y={80} width={W+28} height={2}  fill="rgba(0,0,0,0.15)"/>
      <text x={W/2} y={72} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="8.5" letterSpacing="4" fill={tint(WALL,0.44)}>MUSEU DO TEMPO</text>

      {/* Columns */}
      {cols.map(cx=>(
        <g key={cx}>
          <rect x={cx}   y={82}  width={20} height={300} fill={tint(WALL,0.97)}/>
          <rect x={cx}   y={82}  width={3}  height={300} fill="rgba(255,255,255,0.12)"/>
          <rect x={cx-5} y={68}  width={30} height={16}  fill={tint(WALL,0.80)} rx="1"/>
          <rect x={cx-5} y={68}  width={30} height={3}   fill="rgba(255,255,255,0.18)" rx="1"/>
          <rect x={cx-5} y={380} width={30} height={12}  fill={tint(WALL,0.80)} rx="1"/>
        </g>
      ))}

      {/* Inter-column windows */}
      {[1,2,3,4].map(i=>{
        const wx=Math.round((i+0.5)*W/7+10)-20;
        const ww=Math.max(20,W/7-22);
        return (
          <g key={i}>
            <rect x={wx} y={96} width={ww} height={90} fill={tint(WALL,0.65)} rx="1"/>
            <path d={`M${wx},${144} a${ww/2},${ww*0.45} 0 0,1 ${ww},0`} fill={tint(WALL,0.52)}/>
            {isNight && <rect x={wx} y={96} width={ww} height={90} fill="rgba(255,200,100,0.28)" rx="1"/>}
          </g>
        );
      })}

      {/* Steps */}
      {[0,1,2].map(s=>(
        <rect key={s} x={-s*20} y={H-14-s*13} width={W+s*40} height={15} fill={tint(WALL,0.79-s*0.04)}/>
      ))}

      {/* Night overlay */}
      {isNight && <rect x={0} y={58} width={W} height={H-58} fill="rgba(10,6,40,0.32)"/>}

      {onOpen && <g onClick={onOpen}><BldgDoor DX={DX} DW={DW} DH={DH} H={H} wall={WALL}/></g>}
    </svg>
  );
}

/* ── UniversityBldg ── tower, clock, arched windows ── */
function UniversityBldg({ x, onOpen, isNight, glowing }) {
  const W=430, H=490, WALL="#ede9d5";
  const TW=84, TX=(W-84)/2;
  const DW=70, DH=112, DX=(W-DW)/2;
  return (
    <svg style={{position:'absolute',left:x,bottom:140,overflow:'visible'}} width={W} height={H}>
      <defs>
        <filter id={`us_${x}`} x="-8%" y="-25%" width="120%" height="130%">
          <feDropShadow dx="6" dy="0" stdDeviation="5" floodOpacity="0.20"/>
        </filter>
        <linearGradient id={`uwl_${x}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.13)"/>
          <stop offset="60%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.09)"/>
        </linearGradient>
      </defs>

      {/* Tower body (extends above SVG top) */}
      <rect x={TX} y={-95} width={TW} height={130} fill={tint(WALL,0.88)} filter={`url(#us_${x})`}/>
      {/* Tower cornice */}
      <rect x={TX-9} y={-95} width={TW+18} height={10} fill={tint(WALL,0.75)}/>
      <rect x={TX-9} y={-95} width={TW+18} height={2}  fill="rgba(255,255,255,0.20)"/>
      {/* Tower spire */}
      <polygon points={`${TX-12},${-95} ${TX+TW+12},${-95} ${W/2},${-140}`} fill="#cc3e26"/>
      <line x1={W/2} y1={-140} x2={W/2} y2={-95} stroke="#9e2618" strokeWidth="2"/>
      {/* Clock face */}
      <circle cx={W/2} cy={-55} r={24} fill={tint(WALL,0.95)} stroke={tint(WALL,0.68)} strokeWidth="2"/>
      <circle cx={W/2} cy={-55} r={20} fill="none" stroke={tint(WALL,0.60)} strokeWidth="0.8"/>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(h=>{
        const a=(h/12)*Math.PI*2-Math.PI/2;
        return <line key={h} x1={W/2+Math.cos(a)*16} y1={-55+Math.sin(a)*16}
                            x2={W/2+Math.cos(a)*19} y2={-55+Math.sin(a)*19}
                     stroke={tint(WALL,0.45)} strokeWidth="1.2"/>;
      })}
      <line x1={W/2} y1={-55} x2={W/2} y2={-70} stroke={tint(WALL,0.30)} strokeWidth="2" strokeLinecap="round"/>
      <line x1={W/2} y1={-55} x2={W/2+11} y2={-55} stroke={tint(WALL,0.35)} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Roof (2 halves around tower) */}
      <polygon points={`-22,28 ${TX-2},28 ${TX-2},${-12} ${W*0.14},28`} fill="none"/>
      <polygon points={`-22,28 ${TX},28 ${W*0.5},${-8}`} fill="#d44a28"/>
      <polygon points={`${TX+TW},28 ${W+22},28 ${W*0.5},${-8}`} fill="#a83018"/>

      {/* Main wall */}
      <rect x={0} y={28} width={W} height={H-28} fill={WALL} filter={`url(#us_${x})`}/>
      {/* Cover center of roof with tower continuation */}
      <rect x={TX} y={-10} width={TW} height={40} fill={tint(WALL,0.88)}/>
      <rect x={0} y={28} width={W} height={H-28} fill={`url(#uwl_${x})`}/>

      {/* Cornice */}
      <rect x={-12} y={26} width={W+24} height={24} fill={tint(WALL,0.80)}/>
      <rect x={-12} y={26} width={W+24} height={3}  fill="rgba(255,255,255,0.22)"/>
      <rect x={-12} y={48} width={W+24} height={2}  fill="rgba(0,0,0,0.12)"/>
      <text x={W/2} y={43} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="8" letterSpacing="3.5" fill={tint(WALL,0.42)}>UNIVERSIDADE</text>

      {/* Arched windows — 3 per floor × 2 floors */}
      {[0,1].map(fl=>[0,1,2].map(col=>{
        const wy=58+fl*155, wx=(col+1)*W/4-26, ww=W/4-18, wh=95;
        const filled = isNight && glowing;
        return (
          <g key={`${fl}-${col}`}>
            <rect x={wx} y={wy} width={ww} height={wh} fill={filled?"rgba(255,200,100,0.32)":tint(WALL,0.62)} rx="1"/>
            <path d={`M${wx},${wy+wh*0.48} a${ww/2},${ww*0.52} 0 0,1 ${ww},0`} fill={filled?"rgba(255,210,120,0.45)":tint(WALL,0.48)}/>
          </g>
        );
      }))}

      {isNight && <rect x={0} y={28} width={W} height={H-28} fill="rgba(10,6,40,0.30)"/>}
      {onOpen && <g onClick={onOpen}><BldgDoor DX={DX} DW={DW} DH={DH} H={H} wall={WALL}/></g>}
    </svg>
  );
}

/* ── LabBldg ── research institute, grid windows ── */
function LabBldg({ x, onOpen, isNight, glowing }) {
  const W=390, H=430, WALL="#d8e4e0";
  const DW=66, DH=106, DX=(W-DW)/2;
  const WIN_COLS=4, WIN_ROWS=3, WW=42, WH=50;
  return (
    <svg style={{position:'absolute',left:x,bottom:140,overflow:'visible'}} width={W} height={H}>
      <defs>
        <filter id={`ls_${x}`} x="-8%" y="0%" width="120%" height="100%">
          <feDropShadow dx="6" dy="0" stdDeviation="5" floodOpacity="0.18"/>
        </filter>
        <linearGradient id={`lwl_${x}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)"/>
          <stop offset="60%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)"/>
        </linearGradient>
        {/* Roof gradient */}
        <linearGradient id={`lrfL_${x}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e05030"/>
          <stop offset="100%" stopColor="#9e2618"/>
        </linearGradient>
        <linearGradient id={`lrfR_${x}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a1e12"/>
          <stop offset="100%" stopColor="#4e0c06"/>
        </linearGradient>
      </defs>

      {/* Roof */}
      <polygon points={`-20,22 ${W/2},${-Math.round(W*0.17)} ${W/2},22`} fill={`url(#lrfL_${x})`}/>
      <polygon points={`${W/2},22 ${W/2},${-Math.round(W*0.17)} ${W+20},22`} fill={`url(#lrfR_${x})`}/>

      {/* Main wall */}
      <rect x={0} y={22} width={W} height={H-22} fill={WALL} filter={`url(#ls_${x})`}/>
      <rect x={0} y={22} width={W} height={H-22} fill={`url(#lwl_${x})`}/>

      {/* Header band */}
      <rect x={0}   y={22} width={W} height={36} fill={tint(WALL,0.82)}/>
      <rect x={0}   y={22} width={W} height={3}  fill="rgba(255,255,255,0.22)"/>
      <rect x={0}   y={56} width={W} height={2}  fill="rgba(0,0,0,0.12)"/>
      <text x={W/2} y={44} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="8" letterSpacing="3" fill={tint(WALL,0.40)}>LABORATÓRIO</text>

      {/* Grid windows */}
      {Array.from({length:WIN_ROWS},(_,row)=>
        Array.from({length:WIN_COLS},(_,col)=>{
          const gapX=(W-WIN_COLS*WW)/(WIN_COLS+1);
          const gapY=52;
          const wx=gapX+(col*(WW+gapX));
          const wy=64+(row*(WH+gapY));
          const lit = isNight && glowing;
          return (
            <g key={`${row}-${col}`}>
              <rect x={wx-2} y={wy-2} width={WW+4} height={WH+4} fill={tint(WALL,0.70)} rx="1"/>
              <rect x={wx}   y={wy}   width={WW}   height={WH}   fill={lit?"rgba(255,210,120,0.55)":"rgba(160,200,220,0.35)"} rx="1"/>
              {/* Frame cross */}
              <line x1={wx+WW/2} y1={wy} x2={wx+WW/2} y2={wy+WH} stroke={tint(WALL,0.55)} strokeWidth="1"/>
              <line x1={wx} y1={wy+WH/2} x2={wx+WW} y2={wy+WH/2} stroke={tint(WALL,0.55)} strokeWidth="1"/>
            </g>
          );
        })
      )}

      {/* Corner quoins (minimal) */}
      {[-3,W-12].map(qx=>(
        <rect key={qx} x={qx} y={22} width={15} height={H-22} fill={tint(WALL,0.88)} rx="0.5"/>
      ))}

      {isNight && <rect x={0} y={22} width={W} height={H-22} fill="rgba(10,6,40,0.28)"/>}
      {onOpen && <g onClick={onOpen}><BldgDoor DX={DX} DW={DW} DH={DH} H={H} wall={WALL}/></g>}
    </svg>
  );
}

/* ── Building Component (SVG) ───────────────────────────── */
function Bldg({ x, w, h, wall, az = 1, winCols = 2, doorW: dW = 66, doorH: dH = 100, onOpen, isNight = false, glowing = false }) {
  const ROOF_H  = 20;
  const PEAK_H  = Math.round(w * 0.17);
  const CORN_H  = 26;
  const FLOORS  = 3;
  const STR_H   = 8;
  const AZ_H    = Math.round(h * 0.30);
  const plasterH = h - ROOF_H - CORN_H - AZ_H;
  const floorH   = (plasterH - STR_H * (FLOORS - 1)) / FLOORS;

  const WIN_W  = 30;
  const WIN_R  = WIN_W / 2;
  const WIN_H  = Math.round(floorH * 0.86);
  const TILE   = 28;

  const patId  = `azp_${x}`;
  const wallTop = ROOF_H + CORN_H;

  const winGlow    = glowing && !isNight;

  const winXs = (n) => {
    const gap = (w - n * WIN_W) / (n + 1);
    return Array.from({ length: n }, (_, i) => gap + i * (WIN_W + gap));
  };

  const dX    = (w - dW) / 2;
  const archR = dW / 2;
  const archCY = h - dH;

  const quoinRows = [];
  let qy = wallTop, alt = 0;
  while (qy < h - AZ_H - 4) {
    quoinRows.push({ y: qy, tall: alt % 2 === 0 });
    qy += alt % 2 === 0 ? 24 : 16;
    alt++;
  }

  return (
    <svg style={{ position:'absolute', left:x, bottom:140, overflow:'visible' }}
         width={w} height={h}>
      <defs>
        {/* ── Azulejo patterns (20px tile) ── */}
        <pattern id={patId} x="0" y="0" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          {/* Tile base — warm ivory */}
          <rect width={TILE} height={TILE} fill="#e8e0cc" />
          {/* Grout lines */}
          <line x1="0" y1="0" x2={TILE} y2="0" stroke="#b8ae9c" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2={TILE} stroke="#b8ae9c" strokeWidth="1" />

          {az === 1 && <>
            {/* ── Diamante bisel: 3 nested diamonds for depth ── */}
            <path d={`M${TILE/2},1.5 L${TILE-1.5},${TILE/2} L${TILE/2},${TILE-1.5} L1.5,${TILE/2} Z`} fill="#0c3a8a" />
            <path d={`M${TILE/2},4.5 L${TILE-4.5},${TILE/2} L${TILE/2},${TILE-4.5} L4.5,${TILE/2} Z`} fill="#1450a8" />
            <path d={`M${TILE/2},7 L${TILE-7},${TILE/2} L${TILE/2},${TILE-7} L7,${TILE/2} Z`} fill="#1a64c4" />
            {/* Center hole */}
            <circle cx={TILE/2} cy={TILE/2} r="2.5" fill="#e8e0cc" />
            {/* Corner quarter-discs */}
            <circle cx="0"    cy="0"    r="3.5" fill="#0c3a8a" />
            <circle cx={TILE} cy="0"    r="3.5" fill="#0c3a8a" />
            <circle cx="0"    cy={TILE} r="3.5" fill="#0c3a8a" />
            <circle cx={TILE} cy={TILE} r="3.5" fill="#0c3a8a" />
            {/* Glaze shimmer — top-left quadrant of diamond */}
            <path d={`M${TILE/2},2 L${TILE/2},${TILE/2} L2,${TILE/2} Z`} fill="rgba(255,255,255,0.13)" />
          </>}

          {az === 2 && <>
            {/* ── Cruz pombalina: cross + corner squares with inner accent ── */}
            <rect x={TILE/2-2.5} y="2"          width="5"       height={TILE-4} fill="#0c3a8a" />
            <rect x="2"          y={TILE/2-2.5} width={TILE-4}  height="5"      fill="#0c3a8a" />
            {/* Clear center junction */}
            <rect x={TILE/2-2.5} y={TILE/2-2.5} width="5" height="5" fill="#e8e0cc" />
            {/* Corner filled squares */}
            <rect x="2"        y="2"        width="5.5" height="5.5" fill="#0c3a8a" />
            <rect x={TILE-7.5} y="2"        width="5.5" height="5.5" fill="#0c3a8a" />
            <rect x="2"        y={TILE-7.5} width="5.5" height="5.5" fill="#0c3a8a" />
            <rect x={TILE-7.5} y={TILE-7.5} width="5.5" height="5.5" fill="#0c3a8a" />
            {/* Inner lighter accent on each corner square */}
            <rect x="3.2"       y="3.2"       width="3" height="3" fill="#1c68cc" />
            <rect x={TILE-6.2}  y="3.2"       width="3" height="3" fill="#1c68cc" />
            <rect x="3.2"       y={TILE-6.2}  width="3" height="3" fill="#1c68cc" />
            <rect x={TILE-6.2}  y={TILE-6.2}  width="3" height="3" fill="#1c68cc" />
            {/* Glaze shimmer on cross arms */}
            <rect x="2"          y={TILE/2-2.5} width={TILE-4} height="2" fill="rgba(255,255,255,0.12)" />
            <rect x={TILE/2-2.5} y="2"          width="5"      height="2" fill="rgba(255,255,255,0.12)" />
          </>}

          {az === 3 && <>
            {/* ── Escamas: true overlapping semicircular arc tiles ── */}
            {/* Upper row — two half-scales peeking from above (offset +T/2) */}
            <path d={`M${-TILE/2},${TILE/2} A${TILE/2},${TILE/2},0,0,1,${TILE/2},${TILE/2} Z`}  fill="#1450a8" />
            <path d={`M${TILE/2},${TILE/2} A${TILE/2},${TILE/2},0,0,1,${TILE*1.5},${TILE/2} Z`} fill="#1450a8" />
            {/* Main row scale */}
            <path d={`M0,${TILE} A${TILE/2},${TILE/2},0,0,1,${TILE},${TILE} Z`} fill="#0c3a8a" />
            {/* Definition outlines */}
            <path d={`M0,${TILE} A${TILE/2},${TILE/2},0,0,1,${TILE},${TILE}`}                     fill="none" stroke="#082d6a" strokeWidth="0.9" />
            <path d={`M${-TILE/2},${TILE/2} A${TILE/2},${TILE/2},0,0,1,${TILE/2},${TILE/2}`}      fill="none" stroke="#082d6a" strokeWidth="0.9" />
            <path d={`M${TILE/2},${TILE/2} A${TILE/2},${TILE/2},0,0,1,${TILE*1.5},${TILE/2}`}     fill="none" stroke="#082d6a" strokeWidth="0.9" />
            {/* Glaze shimmer on main scale */}
            <path d={`M${TILE*0.22},${TILE} A${TILE*0.28},${TILE*0.28},0,0,1,${TILE*0.78},${TILE}`} fill="rgba(255,255,255,0.16)" />
          </>}
        </pattern>

        {/* Wall side-lighting: left bright, right darker */}
        <linearGradient id={`wlit_${x}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.14)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
        </linearGradient>

        {/* Bottom wall shadow */}
        <linearGradient id={`wshadB_${x}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>

        {/* Building drop-shadow */}
        <filter id={`shd_${x}`} x="-8%" y="0%" width="120%" height="100%">
          <feDropShadow dx="7" dy="0" stdDeviation="6" floodOpacity="0.20" />
        </filter>

        {isNight && (
          <filter id={`wg_${x}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        )}

        {/* Subtle plaster texture */}
        <filter id={`tex_${x}`} x="0%" y="0%" width="100%" height="100%"
                colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4"
                        stitchTiles="stitch" result="n" />
          <feColorMatrix type="saturate" values="0" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="textured" />
          <feComposite in="textured" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* ── Main wall ── */}
      <rect x={0} y={wallTop} width={w} height={h - wallTop}
            fill={wall} filter={`url(#shd_${x})`} />
      {/* Plaster texture */}
      <rect x={0} y={wallTop} width={w} height={h - AZ_H - wallTop}
            fill={wall} filter={`url(#tex_${x})`} opacity="0.35" />
      {/* Side lighting */}
      <rect x={0} y={wallTop} width={w} height={h - AZ_H - wallTop}
            fill={`url(#wlit_${x})`} />
      {/* Bottom wall darkening */}
      <rect x={0} y={wallTop} width={w} height={h - AZ_H - wallTop}
            fill={`url(#wshadB_${x})`} />

      {/* ── Azulejo ground band ── */}
      <rect x={0} y={h - AZ_H} width={w} height={AZ_H} fill={`url(#${patId})`} />
      <rect x={0} y={h - AZ_H} width={w} height={3} fill={tint(wall, 0.62)} />
      {/* Azulejo side-light overlay */}
      <rect x={0} y={h - AZ_H} width={w} height={AZ_H}
            fill={`url(#wlit_${x})`} opacity="0.6" />

      {/* ── Corner quoins ── */}
      {quoinRows.map(({ y: qy, tall }, i) => {
        const qh = tall ? 20 : 14;
        return (
          <g key={i}>
            <rect x={-3} y={qy} width={15} height={qh}
                  fill={tint(wall, 0.79)} rx="0.5"
                  stroke={tint(wall, 0.65)} strokeWidth="0.5" />
            <rect x={-3} y={qy} width={15} height={2}
                  fill="rgba(255,255,255,0.22)" />
            <rect x={w-12} y={qy} width={15} height={qh}
                  fill={tint(wall, 0.79)} rx="0.5"
                  stroke={tint(wall, 0.65)} strokeWidth="0.5" />
            <rect x={w-12} y={qy} width={15} height={2}
                  fill="rgba(255,255,255,0.22)" />
          </g>
        );
      })}

      {/* ── String courses ── */}
      {Array.from({ length: FLOORS - 1 }, (_, fi) => {
        const sy = wallTop + (fi + 1) * floorH + fi * STR_H;
        return (
          <g key={fi}>
            <rect x={0}  y={sy}       width={w} height={STR_H} fill={tint(wall, 0.78)} />
            <rect x={0}  y={sy}       width={w} height={2}     fill="rgba(255,255,255,0.25)" />
            <rect x={0}  y={sy+STR_H} width={w} height={2}     fill="rgba(0,0,0,0.12)" />
          </g>
        );
      })}

      {/* ── Cornice with dentils ── */}
      <rect x={-15} y={ROOF_H}             width={w+30} height={CORN_H}   fill={tint(wall, 0.76)} />
      <rect x={-15} y={ROOF_H}             width={w+30} height={2}        fill="rgba(255,255,255,0.30)" />
      <rect x={-15} y={ROOF_H}             width={w+30} height={6}        fill={tint(wall, 0.60)} />
      <rect x={-11} y={ROOF_H+6}           width={w+22} height={5}        fill={tint(wall, 0.68)} />
      <rect x={-7}  y={ROOF_H+CORN_H-4}    width={w+14} height={5}        fill={tint(wall, 0.66)} />
      <rect x={-6}  y={ROOF_H+CORN_H+1}    width={w+12} height={3}        fill="rgba(0,0,0,0.16)" />
      {Array.from({ length: Math.floor((w + 30) / 11) }, (_, i) => (
        <rect key={i} x={-15 + i*11} y={ROOF_H+11} width={7} height={8}
              fill={tint(wall, 0.68)} />
      ))}

      {/* ── Pitched terracotta roof ── */}
      <defs>
        {/* Left slope — vertical gradient ridge→eave, sun side */}
        <linearGradient id={`rfL_${x}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e85c3a" />
          <stop offset="45%"  stopColor="#cc3e26" />
          <stop offset="100%" stopColor="#9e2618" />
        </linearGradient>
        {/* Right slope — shadow side */}
        <linearGradient id={`rfR_${x}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7a1e12" />
          <stop offset="100%" stopColor="#4e0c06" />
        </linearGradient>
        <clipPath id={`rfcL_${x}`}>
          <polygon points={`-26,${ROOF_H} ${w/2},${-PEAK_H} ${w/2},${ROOF_H}`} />
        </clipPath>
        <clipPath id={`rfcR_${x}`}>
          <polygon points={`${w/2},${ROOF_H} ${w/2},${-PEAK_H} ${w+26},${ROOF_H}`} />
        </clipPath>
      </defs>

      {/* Left slope */}
      <polygon points={`-26,${ROOF_H} ${w/2},${-PEAK_H} ${w/2},${ROOF_H}`}
               fill={`url(#rfL_${x})`} />
      {/* Right slope */}
      <polygon points={`${w/2},${ROOF_H} ${w/2},${-PEAK_H} ${w+26},${ROOF_H}`}
               fill={`url(#rfR_${x})`} />
      {/* Left slope upper edge highlight */}
      <line x1={-26} y1={ROOF_H} x2={w/2} y2={-PEAK_H}
            stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />

      {/* Tile courses */}
      {Array.from({ length: Math.ceil((ROOF_H + PEAK_H) / 7) }, (_, i) => {
        const ty = -PEAK_H + (i + 1) * 7;
        return (
          <g key={i}>
            <line x1={-28} y1={ty} x2={w/2+2} y2={ty}
                  stroke="rgba(35,5,0,0.40)" strokeWidth="1.5"
                  clipPath={`url(#rfcL_${x})`} />
            <line x1={-28} y1={ty-1.5} x2={w/2+2} y2={ty-1.5}
                  stroke="rgba(255,255,255,0.24)" strokeWidth="0.9"
                  clipPath={`url(#rfcL_${x})`} />
            <line x1={w/2-2} y1={ty} x2={w+28} y2={ty}
                  stroke="rgba(20,3,0,0.55)" strokeWidth="1.5"
                  clipPath={`url(#rfcR_${x})`} />
            <line x1={w/2-2} y1={ty-1.5} x2={w+28} y2={ty-1.5}
                  stroke="rgba(255,255,255,0.07)" strokeWidth="0.9"
                  clipPath={`url(#rfcR_${x})`} />
          </g>
        );
      })}

      {/* Ridge cap */}
      <rect x={w/2-14} y={-PEAK_H-6} width={28} height={11} fill="#36080200" rx="3" />
      <rect x={w/2-14} y={-PEAK_H-6} width={28} height={11} fill="#360802"   rx="3" />
      <rect x={w/2-12} y={-PEAK_H-6} width={24} height={3}  fill="rgba(255,255,255,0.24)" rx="1.5" />
      <rect x={w/2-14} y={-PEAK_H+3} width={28} height={2}  fill="rgba(0,0,0,0.30)" />

      {/* Eave fascia */}
      <rect x={-28} y={ROOF_H-2} width={w+56} height={6}   fill="#461004" rx="0.5" />
      <rect x={-28} y={ROOF_H-2} width={w+56} height={1.5} fill="rgba(255,255,255,0.16)" />
      {/* Gutter */}
      <rect x={-28} y={ROOF_H+3} width={w+56} height={4}   fill="#240604" rx="1" />

      {/* ── Chimneys ── */}
      {[Math.round(w*0.24), Math.round(w*0.68)].map((chX, i) => {
        const CW = 22;
        const CH = 38;
        const onLeft = chX + CW / 2 < w / 2;
        const slopeAtX = (px) => onLeft
          ? ROOF_H - (ROOF_H + PEAK_H) * (px + 26) / (w / 2 + 26)
          : -PEAK_H + (ROOF_H + PEAK_H) * (px - w / 2) / (w / 2 + 26);
        const yL   = slopeAtX(chX);
        const yR   = slopeAtX(chX + CW);
        const yTop = Math.min(yL, yR) - CH;
        const baseY = (ox) => yL + (yR - yL) * ox / CW;
        return (
          <g key={i}>
            {/* Body */}
            <polygon
              points={`${chX},${yL} ${chX+CW},${yR} ${chX+CW},${yTop} ${chX},${yTop}`}
              fill={tint(wall, 0.58)}
            />
            {/* Mortar lines — horizontal texture */}
            {[0.28, 0.52, 0.74].map((t, li) => (
              <line key={li}
                x1={chX+1} y1={yTop + (yL - yTop) * t}
                x2={chX+CW-1} y2={yTop + (yR - yTop) * t}
                stroke="rgba(0,0,0,0.09)" strokeWidth="0.8"
              />
            ))}
            {/* Sunlit face */}
            <polygon
              points={`${chX},${yL} ${chX+4},${baseY(4)} ${chX+4},${yTop} ${chX},${yTop}`}
              fill="rgba(255,255,255,0.15)"
            />
            {/* Shadow right */}
            <polygon
              points={`${chX+CW-4},${baseY(CW-4)} ${chX+CW},${yR} ${chX+CW},${yTop} ${chX+CW-4},${yTop}`}
              fill="rgba(0,0,0,0.28)"
            />
            {/* Cap — wide projecting cornice */}
            <rect x={chX-5}   y={yTop-11} width={CW+10} height={11}  fill={tint(wall, 0.46)} rx="1" />
            <rect x={chX-5}   y={yTop-11} width={CW+10} height={2.5} fill="rgba(255,255,255,0.22)" rx="0.5" />
            <rect x={chX-3}   y={yTop-5}  width={CW+6}  height={1.5} fill="rgba(0,0,0,0.16)" />
            <rect x={chX-5}   y={yTop}    width={CW+10} height={2}   fill="rgba(0,0,0,0.28)" />
            {/* Two terracotta pots */}
            {[chX+2, chX+CW-11].map((px, pi) => (
              <g key={pi}>
                {/* Pot body */}
                <rect x={px} y={yTop-22} width={9} height={12} fill="#6e2c14" rx="1.5" />
                {/* Mid band */}
                <rect x={px} y={yTop-15} width={9} height={2.5} fill="#4e1808" />
                {/* Overhanging rim — wider than body */}
                <ellipse cx={px+4.5} cy={yTop-22} rx={7}   ry={2.5} fill="#3a0c04" />
                <ellipse cx={px+4.5} cy={yTop-22} rx={5.5} ry={1.8} fill="#5a1a0a" />
                {/* Inner opening */}
                <ellipse cx={px+4.5} cy={yTop-22} rx={3.2} ry={1.1} fill="#160402" />
                {/* Base flare */}
                <ellipse cx={px+4.5} cy={yTop-10} rx={5}   ry={1.8} fill="#4e1808" />
              </g>
            ))}
          </g>
        );
      })}

      {/* ── Windows ── */}
      {Array.from({ length: FLOORS }, (_, fi) => {
        const fy   = wallTop + fi * (floorH + STR_H);
        const vpad = Math.round((floorH - WIN_H) / 2);
        const hasBalcony = fi === 1;

        return winXs(winCols).map(wx => {
          const wy    = fy + vpad;
          const shutW = Math.round(WIN_W * 0.52);
          const winSeed = fi * 7 + Math.round(wx);
          const winLit  = isNight && (winSeed % 5 !== 0);
          const winFlicker = winLit ? ['','win-flicker-a','win-flicker-b','win-flicker-c'][winSeed % 4] : '';

          return (
            <g key={`${fi}-${wx}`}>
              {/* Night glow */}
              {winLit && (
                <rect className={winFlicker}
                      x={wx-8} y={wy+WIN_R-6} width={WIN_W+16} height={WIN_H-WIN_R+10}
                      fill="#ffc840" opacity="0.20" filter={`url(#wg_${x})`} />
              )}

              {/* Deep window recession shadow */}
              <rect x={wx-8} y={wy-8} width={WIN_W+16} height={WIN_H+16}
                    fill="rgba(0,0,0,0.22)" rx="0.5" />

              {/* Outer architrave */}
              <rect x={wx-6} y={wy-6} width={WIN_W+12} height={WIN_H+12}
                    fill={tint(wall, 0.76)} rx="0.5" />
              {/* Inner moulding highlight */}
              <rect x={wx-6} y={wy-6} width={WIN_W+12} height={2.5}
                    fill="rgba(255,255,255,0.28)" />
              {/* Inner reveal */}
              <rect x={wx-4} y={wy-4} width={WIN_W+8} height={WIN_H+8}
                    fill={tint(wall, 0.86)} rx="0.5" />

              {/* Keystone */}
              <path d={`M${wx+WIN_W/2-5} ${wy-16}
                        L${wx+WIN_W/2+5} ${wy-16}
                        L${wx+WIN_W/2+3} ${wy-6}
                        L${wx+WIN_W/2-3} ${wy-6} Z`}
                    fill={tint(wall, 0.64)} />
              <rect x={wx+WIN_W/2-5} y={wy-16} width={10} height={1.5}
                    fill="rgba(255,255,255,0.25)" />

              {/* Window glow halo when visited */}
              {winGlow && (
                <ellipse cx={wx+WIN_W/2} cy={wy+WIN_H/2}
                  rx={WIN_W*1.1} ry={WIN_H*0.8}
                  fill="rgba(255,210,80,0.13)" />
              )}
              {/* ── Window interior ── */}
              {(() => {
                const rs    = (x * 7 + Math.round(wx) * 3 + fi * 113) % 4;
                const wallC = isNight
                  ? ['#12100a','#0d1209','#09100e','#0e0e15'][rs]
                  : ['#e8dcc8','#dde4d6','#e4dcd2','#d8dde8'][rs];
                const recH  = WIN_H - WIN_R;
                const nc    = isNight;
                const cx    = Math.round(wx + WIN_W / 2);
                const iTop  = wy + WIN_R + 4;
                const iBot  = wy + WIN_H - 6;
                const iL    = wx + 3;
                const iR    = wx + WIN_W - 3;
                const iH    = iBot - iTop;
                const iW    = iR - iL;
                /* lamp geometry */
                const ly    = iTop + Math.round(iH * 0.3);
                /* frame geometry */
                const fy    = iTop + Math.round(iH * 0.08);
                /* shelf geometry */
                const sh1   = iTop + Math.round(iH * 0.38);
                const sh2   = iBot - 1;
                return (
                  <>
                    {/* Arch ceiling */}
                    <path d={`M${wx},${wy+WIN_R} a${WIN_R},${WIN_R} 0 0,1 ${WIN_W},0 Z`}
                          fill={nc ? '#0a0806' : '#f0e8d6'} />
                    {/* Back wall */}
                    <rect x={wx} y={wy+WIN_R} width={WIN_W} height={recH} fill={wallC} />
                    {/* Ceiling strip */}
                    <rect x={wx} y={wy+WIN_R} width={WIN_W} height={4}
                          fill={nc ? '#0a0806' : '#f0e8d6'} />
                    {/* Floor strip */}
                    <rect x={wx} y={iBot} width={WIN_W} height={6}
                          fill={nc ? '#080504' : '#6a4e28'} />
                    {/* Side depth shadows */}
                    <rect x={wx}         y={wy+WIN_R} width={2} height={recH} fill="rgba(0,0,0,0.28)" />
                    <rect x={wx+WIN_W-2} y={wy+WIN_R} width={2} height={recH} fill="rgba(0,0,0,0.18)" />

                    {/* ── rs=0: Potted plant ── */}
                    {rs === 0 && <>
                      {/* Terracotta pot */}
                      <path d={`M${cx-6},${iBot-1} L${cx-4.5},${iBot-6} L${cx+4.5},${iBot-6} L${cx+6},${iBot-1} Z`}
                            fill={nc?'#2a1208':'#b05030'} />
                      {/* Pot rim */}
                      <rect x={cx-6} y={iBot-8} width={12} height={2.5}
                            fill={nc?'#1e0e06':'#8a3820'} rx="0.5" />
                      {/* Soil */}
                      <rect x={cx-4} y={iBot-8} width={8} height={2}
                            fill={nc?'#100a04':'#3a2210'} />
                      {/* Stem */}
                      <line x1={cx} y1={iBot-7} x2={cx} y2={iBot-22}
                            stroke={nc?'#0e2006':'#346014'} strokeWidth="1.5" />
                      {/* Left leaf */}
                      <ellipse cx={cx-5} cy={iBot-20} rx={5} ry={2.5}
                               fill={nc?'#0a1c06':'#286018'}
                               transform={`rotate(-38,${cx-5},${iBot-20})`} />
                      {/* Right leaf */}
                      <ellipse cx={cx+5} cy={iBot-23} rx={5} ry={2.5}
                               fill={nc?'#0c2007':'#307018'}
                               transform={`rotate(32,${cx+5},${iBot-23})`} />
                      {/* Top leaf */}
                      <ellipse cx={cx} cy={iBot-28} rx={3.5} ry={5}
                               fill={nc?'#0e2208':'#388020'} />
                    </>}

                    {/* ── rs=1: Framed artwork ── */}
                    {rs === 1 && <>
                      {/* Frame drop shadow */}
                      <rect x={cx-8} y={fy+3} width={16} height={12}
                            fill="rgba(0,0,0,0.22)" rx="1" />
                      {/* Outer frame */}
                      <rect x={cx-8} y={fy} width={16} height={12}
                            fill={nc?'#2c1c0a':'#7a5830'} rx="1" />
                      {/* Mat */}
                      <rect x={cx-6} y={fy+2} width={12} height={8}
                            fill={nc?'#1a1008':'#c8b488'} />
                      {/* Painting — sky + landscape */}
                      {!nc && <>
                        <rect x={cx-6} y={fy+2} width={12} height={5} fill="#8cb8cc" />
                        <path d={`M${cx-6},${fy+7} Q${cx-1},${fy+5} ${cx+4},${fy+7} L${cx+6},${fy+10} L${cx-6},${fy+10} Z`}
                              fill="#4a7830" />
                        <circle cx={cx+3} cy={fy+4} r="1.8" fill="rgba(255,240,180,0.7)" />
                      </>}
                      {nc && <>
                        {/* Night: dark painting with subtle glow */}
                        <rect x={cx-6} y={fy+2} width={12} height={8} fill="rgba(140,90,30,0.18)" />
                        <ellipse cx={cx} cy={fy+6} rx={3} ry={2} fill="rgba(200,150,50,0.12)" />
                      </>}
                    </>}

                    {/* ── rs=2: Pendant lamp ── */}
                    {rs === 2 && <>
                      {/* Night: warm pool on ceiling and floor */}
                      {nc && <>
                        <ellipse cx={cx} cy={iTop+1} rx={10} ry={3} fill="rgba(255,200,60,0.10)" />
                        <ellipse cx={cx} cy={iBot-1} rx={9}  ry={2} fill="rgba(255,195,50,0.12)" />
                      </>}
                      {/* Cord */}
                      <line x1={cx} y1={iTop} x2={cx} y2={ly}
                            stroke={nc?'#705028':'#4a3010'} strokeWidth="0.9" />
                      {/* Lampshade — inverted trapezoid */}
                      <path d={`M${cx-7},${ly+9} L${cx-3},${ly} L${cx+3},${ly} L${cx+7},${ly+9} Z`}
                            fill={nc?'rgba(200,120,25,0.94)':'rgba(165,118,55,0.82)'} />
                      {/* Shade bottom rim */}
                      <rect x={cx-7} y={ly+9} width={14} height={1.5}
                            fill={nc?'#7a4010':'#5a3010'} rx="0.3" />
                      {/* Bulb */}
                      <circle cx={cx} cy={ly+2.5} r={2.5}
                              fill={nc?'rgba(255,238,120,0.96)':'rgba(240,215,80,0.55)'} />
                      {/* Glow ellipse at night */}
                      {nc && <ellipse cx={cx} cy={ly+6} rx={13} ry={9}
                                      fill="rgba(255,200,60,0.09)" />}
                    </>}

                    {/* ── rs=3: Two-row bookshelf ── */}
                    {rs === 3 && <>
                      {/* Upper shelf board */}
                      <rect x={iL} y={sh1} width={iW} height={2}
                            fill={nc?'#1e1006':'rgba(115,80,40,0.82)'} rx="0.3" />
                      {/* Upper shelf books (3) */}
                      {[0,1,2].map(bi => {
                        const bw  = Math.round((iW - 3) / 3) - 1;
                        const bh  = [Math.round(iH*0.28), Math.round(iH*0.34), Math.round(iH*0.24)][bi];
                        const bx  = iL + 1 + bi * (bw + 1);
                        const col = nc
                          ? ['rgba(65,22,18,0.9)','rgba(18,30,65,0.9)','rgba(18,48,18,0.9)'][bi]
                          : ['#c03428','#2458b8','#288040'][bi];
                        return <rect key={`u${bi}`} x={bx} y={sh1-bh} width={bw} height={bh}
                                     fill={col} rx="0.3" />;
                      })}
                      {/* Small decorative vase end of upper shelf */}
                      <rect x={iR-4} y={sh1-Math.round(iH*0.20)} width={3} height={Math.round(iH*0.20)}
                            fill={nc?'rgba(60,40,15,0.7)':'rgba(180,130,60,0.7)'} rx="1" />

                      {/* Lower shelf board */}
                      <rect x={iL} y={sh2} width={iW} height={2}
                            fill={nc?'#1e1006':'rgba(115,80,40,0.82)'} rx="0.3" />
                      {/* Lower shelf books (4) */}
                      {[0,1,2,3].map(bi => {
                        const bw  = Math.round((iW - 4) / 4) - 1;
                        const bh  = [Math.round(iH*0.26), Math.round(iH*0.32), Math.round(iH*0.22), Math.round(iH*0.29)][bi];
                        const bx  = iL + 1 + bi * (bw + 1);
                        const col = nc
                          ? ['rgba(52,15,52,0.9)','rgba(18,45,18,0.9)','rgba(65,40,10,0.9)','rgba(14,18,55,0.9)'][bi]
                          : ['#904898','#309048','#c87828','#2848b8'][bi];
                        return <rect key={`l${bi}`} x={bx} y={sh2-bh} width={bw} height={bh}
                                     fill={col} rx="0.3" />;
                      })}
                    </>}

                    {/* Glass tint */}
                    <rect x={wx} y={wy+WIN_R} width={WIN_W} height={recH}
                          fill={nc ? 'rgba(255,190,70,0.07)' : 'rgba(175,215,235,0.08)'} />
                    <path d={`M${wx},${wy+WIN_R} a${WIN_R},${WIN_R} 0 0,1 ${WIN_W},0 Z`}
                          fill={nc ? 'rgba(255,190,70,0.05)' : 'rgba(175,215,235,0.10)'} />
                    {!nc && (
                      <path d={`M${wx+2},${wy+WIN_R} a${WIN_R-2},${WIN_R-2} 0 0,1 ${WIN_W*0.4},0`}
                            fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                    )}
                  </>
                );
              })()}

              {/* Green frame */}
              <path d={`M${wx},${wy+WIN_R} a${WIN_R},${WIN_R} 0 0,1 ${WIN_W},0
                        L${wx+WIN_W},${wy+WIN_H} L${wx},${wy+WIN_H} Z`}
                    fill="none" stroke="#1e4818" strokeWidth="3" />
              <line x1={wx+WIN_W/2} y1={wy} x2={wx+WIN_W/2} y2={wy+WIN_H}
                    stroke="#1e4818" strokeWidth="2.2" />
              <line x1={wx} y1={wy+WIN_R+(WIN_H-WIN_R)*0.52}
                    x2={wx+WIN_W} y2={wy+WIN_R+(WIN_H-WIN_R)*0.52}
                    stroke="#1e4818" strokeWidth="2.2" />

              {/* Sill */}
              <rect x={wx-13} y={wy+WIN_H+3} width={WIN_W+26} height={7}
                    fill={tint(wall, 0.65)} rx="1.5" />
              <rect x={wx-13} y={wy+WIN_H+3} width={WIN_W+26} height={2}
                    fill="rgba(255,255,255,0.20)" rx="1.5" />
              <rect x={wx-11} y={wy+WIN_H+9} width={WIN_W+22} height={2.5}
                    fill="rgba(0,0,0,0.14)" />

              {/* Left shutter */}
              <rect x={wx-shutW-5} y={wy} width={shutW} height={WIN_H}
                    fill="#1c3e14" rx="1" />
              <rect x={wx-shutW-5} y={wy} width={3} height={WIN_H}
                    fill="rgba(255,255,255,0.10)" rx="1" />
              {[0.16,0.30,0.44,0.58,0.72,0.86].map(p => (
                <line key={p}
                      x1={wx-shutW-4} y1={wy+WIN_H*p} x2={wx-5} y2={wy+WIN_H*p}
                      stroke="#102808" strokeWidth="0.9" />
              ))}
              {/* Right shutter */}
              <rect x={wx+WIN_W+5} y={wy} width={shutW} height={WIN_H}
                    fill="#1c3e14" rx="1" />
              {[0.16,0.30,0.44,0.58,0.72,0.86].map(p => (
                <line key={p}
                      x1={wx+WIN_W+6} y1={wy+WIN_H*p} x2={wx+WIN_W+5+shutW} y2={wy+WIN_H*p}
                      stroke="#102808" strokeWidth="0.9" />
              ))}
              <rect x={wx+WIN_W+5+shutW-3} y={wy} width={3} height={WIN_H}
                    fill="rgba(0,0,0,0.12)" rx="1" />

              {/* Balcony (2nd floor) */}
              {hasBalcony && (() => {
                const bY  = wy + WIN_H + 10;
                const bX1 = wx - 17;
                const bW  = WIN_W + 34;
                const pH  = 18;
                const nP  = 8;
                return (
                  <g>
                    {/* Slab */}
                    <rect x={bX1-2} y={bY} width={bW+4} height={7}
                          fill={tint(wall, 0.62)} rx="1" />
                    <rect x={bX1-2} y={bY} width={bW+4} height={2}
                          fill="rgba(255,255,255,0.18)" rx="1" />
                    <rect x={bX1-2} y={bY+6} width={bW+4} height={2}
                          fill="rgba(0,0,0,0.15)" />
                    {/* Posts */}
                    {Array.from({ length: nP }, (_, pi) => {
                      const px = bX1 + (pi/(nP-1))*(bW-1);
                      return <line key={pi} x1={px} y1={bY} x2={px} y2={bY-pH}
                                   stroke="#1a1010" strokeWidth="2" />;
                    })}
                    {/* Scrollwork */}
                    {Array.from({ length: nP-1 }, (_, pi) => {
                      const px  = bX1 + (pi/(nP-1))*(bW-1);
                      const nx  = bX1 + ((pi+1)/(nP-1))*(bW-1);
                      const mid = (px+nx)/2;
                      return (
                        <g key={pi}>
                          <path d={`M${px} ${bY-pH*0.28} C${mid} ${bY-pH*0.92} ${mid} ${bY-pH*0.92} ${nx} ${bY-pH*0.28}`}
                                fill="none" stroke="#1a1010" strokeWidth="1.2" />
                          <circle cx={mid} cy={bY-pH*0.66} r="1.6" fill="#1a1010" />
                        </g>
                      );
                    })}
                    {/* Top rail */}
                    <line x1={bX1} y1={bY-pH} x2={bX1+bW} y2={bY-pH}
                          stroke="#1a1010" strokeWidth="2.8" />
                  </g>
                );
              })()}
            </g>
          );
        });
      })}

      {/* ── Door ── */}
      {onOpen && (
        <g className="door-g" onClick={onOpen}>
          <rect className="door-surround"
                x={dX-13} y={archCY-10} width={dW+26} height={h-archCY+10}
                fill={tint(wall, 0.68)} />
          <path className="door-surround"
                d={`M${dX-13},${archCY} a${archR+13},${archR+13} 0 0,1 ${dW+26},0 Z`}
                fill={tint(wall, 0.68)} />
          {/* Surround highlight */}
          <rect x={dX-13} y={archCY-2} width={dW+26} height={2}
                fill="rgba(255,255,255,0.18)" />

          {/* Keystone */}
          <path d={`M${dX+dW/2-7} ${archCY-archR-17}
                    L${dX+dW/2+7} ${archCY-archR-17}
                    L${dX+dW/2+4} ${archCY-archR-4}
                    L${dX+dW/2-4} ${archCY-archR-4} Z`}
                fill={tint(wall, 0.58)} />

          {/* Door recession */}
          <rect x={dX-2} y={archCY} width={dW+4} height={h-archCY}
                fill="rgba(0,0,0,0.20)" />

          {/* Door body */}
          <rect className="door-body" x={dX} y={archCY} width={dW} height={h-archCY}
                fill="#201408" />
          <path className="door-body"
                d={`M${dX},${archCY} a${archR},${archR} 0 0,1 ${dW},0 Z`}
                fill="#201408" />
          {/* Door lit edge */}
          <rect x={dX} y={archCY} width={4} height={h-archCY}
                fill="rgba(255,255,255,0.07)" />

          {/* Fanlight */}
          <path d={`M${dX+3},${archCY} a${archR-3},${archR-3} 0 0,1 ${dW-6},0 Z`}
                fill="#98bccc" opacity="0.72" />
          {/* Fanlight glare */}
          <path d={`M${dX+5},${archCY} a${archR-7},${archR-7} 0 0,1 ${dW*0.42},0`}
                fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          {/* Spokes */}
          {[-0.28, 0, 0.28].map((angle, i) => {
            const ex = dX + dW/2 + Math.sin(angle) * (archR - 4);
            const ey = archCY - Math.cos(angle) * (archR - 4);
            return <line key={i} x1={dX+dW/2} y1={archCY}
                         x2={ex} y2={ey}
                         stroke="#5a3810" strokeWidth="1.2" />;
          })}

          {/* 4-panel door */}
          {(() => {
            const rH = h - archCY;
            const ph = rH * 0.30, ph2 = rH * 0.38;
            const hw = dW/2 - 9;
            return <>
              <rect x={dX+6}      y={archCY+8}      width={hw} height={ph}  rx="2"
                    fill="none" stroke="#32200a" strokeWidth="1.4" />
              <rect x={dX+dW/2+3} y={archCY+8}      width={hw} height={ph}  rx="2"
                    fill="none" stroke="#32200a" strokeWidth="1.4" />
              <rect x={dX+6}      y={archCY+8+ph+6}  width={hw} height={ph2} rx="2"
                    fill="none" stroke="#32200a" strokeWidth="1.4" />
              <rect x={dX+dW/2+3} y={archCY+8+ph+6}  width={hw} height={ph2} rx="2"
                    fill="none" stroke="#32200a" strokeWidth="1.4" />
            </>;
          })()}
          <line x1={dX+dW/2} y1={archCY} x2={dX+dW/2} y2={h}
                stroke="#140c04" strokeWidth="1.5" />
          <rect x={dX-9} y={h-7} width={dW+18} height={7}
                fill={tint(wall, 0.58)} rx="0.5" />
          <rect x={dX-9} y={h-7} width={dW+18} height={2}
                fill="rgba(255,255,255,0.15)" rx="0.5" />

          {/* Knobs */}
          <circle cx={dX+dW*0.73} cy={archCY+(h-archCY)*0.46}
                  r="4.5" fill="#c8a96e" stroke="#906030" strokeWidth="1" />
          <circle cx={dX+dW*0.27} cy={archCY+(h-archCY)*0.46}
                  r="4.5" fill="#c8a96e" stroke="#906030" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}


/* ── Cloud (SVG, realistic cumulus) ────────────────────── */
function CloudSvg({ x, y, w, h, seed = 0, animDur = 70 }) {
  const id = `cld_${x}_${seed}`;
  return (
    <svg
      style={{ position:'absolute', left:x, top:y, overflow:'visible', pointerEvents:'none',
               animation:`cloud-drift ${animDur}s ease-in-out infinite alternate` }}
      width={w} height={h}
    >
      <defs>
        <radialGradient id={`${id}_lit`} cx="36%" cy="18%" r="68%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="52%"  stopColor="#f0f7ff" />
          <stop offset="100%" stopColor="#d6e8f8" />
        </radialGradient>
        <filter id={`${id}_f`} x="-24%" y="-44%" width="148%" height="188%">
          <feGaussianBlur stdDeviation={h * 0.09} />
        </filter>
      </defs>

      {/* Single blurred group: dark belly first, bright puffs on top */}
      <g filter={`url(#${id}_f)`}>
        {/* Shadow underside — drawn first so puffs paint over */}
        <ellipse cx={w*0.50} cy={h*0.86} rx={w*0.48} ry={h*0.24} fill="#9ab8cc" />
        <ellipse cx={w*0.50} cy={h*0.76} rx={w*0.42} ry={h*0.22} fill="#b8d0e4" />

        {/* Bright cumulus puffs */}
        <circle cx={w*0.10} cy={h*0.64} r={h*0.26} fill="#ddeef8" />
        <circle cx={w*0.28} cy={h*0.47} r={h*0.37} fill={`url(#${id}_lit)`} />
        <circle cx={w*0.50} cy={h*0.34} r={h*0.45} fill={`url(#${id}_lit)`} />
        <circle cx={w*0.72} cy={h*0.48} r={h*0.35} fill={`url(#${id}_lit)`} />
        <circle cx={w*0.90} cy={h*0.63} r={h*0.25} fill="#e4f0fa" />
        {/* White fill bridging the base of the puffs */}
        <ellipse cx={w*0.50} cy={h*0.62} rx={w*0.40} ry={h*0.22} fill="white" />
      </g>
    </svg>
  );
}


/* ── Content Panel ──────────────────────────────────────── */
function ContentPanel({ id, onClose, lang = "en" }) {
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 430);
  };
  const p = T[lang].panels;
  const content = {
    ch1: (
      <>
        <div className="panel-chapter">{p.ch1.chapter}</div>
        <h2 className="panel-title">{p.ch1.title}</h2>
        <div className="panel-coords">{p.ch1.coords}</div>
        <blockquote className="panel-epigraph">
          <p className="panel-epigraph-text">
            {p.ch1.quote.split("\n").map((line, i) => (
              <span key={i}>{line}{i < 2 && <br />}</span>
            ))}
          </p>
          <div className="panel-epigraph-attr">{p.ch1.quoteAttr}</div>
        </blockquote>
        <p className="panel-body">{p.ch1.body}</p>
        <hr className="panel-divider" />
        <div className="info-cards">
          <div className="info-card">
            <div className="info-card-label">{p.ch1.labels.degree}</div>
            <div className="info-card-value">{p.ch1.values.degree}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">{p.ch1.labels.interest}</div>
            <div className="info-card-value">{p.ch1.values.interest}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">{p.ch1.labels.institution}</div>
            <div className="info-card-value">{p.ch1.values.institution}</div>
          </div>
        </div>
        <div className="tags">
          {p.ch1.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </>
    ),
    ch2: (
      <>
        <div className="panel-chapter">{p.ch2.chapter}</div>
        <h2 className="panel-title">{p.ch2.title}</h2>
        <p className="panel-body">{p.ch2.body}</p>
        <hr className="panel-divider" />
        <div className="timeline">
          {p.ch2.labs.map(lab => (
            <div key={lab.name} className="tl-item">
              <div className="tl-date">{lab.date}</div>
              <div className="tl-title">{lab.name}</div>
              <div className="tl-desc">{lab.desc}</div>
              <div className="tags" style={{ marginTop: "8px" }}>
                {lab.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    ch3: (
      <>
        <div className="panel-chapter">{p.ch3.chapter}</div>
        <h2 className="panel-title">{p.ch3.title}</h2>
        <p className="panel-body">{p.ch3.body}</p>
        <hr className="panel-divider" />
        <div className="proj-cards">
          {p.ch3.projects.map(proj => (
            <div key={proj.title} className="proj-card">
              <div className="proj-card-title">{proj.title}</div>
              <div className="proj-card-desc">{proj.desc}</div>
            </div>
          ))}
        </div>
      </>
    ),
    ch4: (
      <>
        <div className="panel-chapter">{p.ch4.chapter}</div>
        <h2 className="panel-title">{p.ch4.title}</h2>
        <p className="panel-body">{p.ch4.body}</p>
        <hr className="panel-divider" />
        <div className="substack-card">
          <div className="substack-title">Ink and All Things</div>
          <a className="substack-link" href="https://inkandallthings.substack.com" target="_blank" rel="noopener noreferrer">
            inkandallthings.substack.com
          </a>
        </div>
        <div className="info-card-label" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "#c8a96e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>{p.ch4.worksLabel}</div>
        <div className="writing-list">
          {p.ch4.works.map(w => <div key={w} className="writing-item">{w}</div>)}
        </div>
      </>
    ),
    connect: (
      <>
        <div className="panel-chapter">{p.connect.chapter}</div>
        <h2 className="panel-title">{p.connect.title}</h2>
        <p className="panel-body">{p.connect.body}</p>
        <hr className="panel-divider" />
        <div className="connect-list">
          <a className="connect-item" href="https://inkandallthings.substack.com" target="_blank" rel="noopener noreferrer">
            <div className="connect-icon">✍</div>
            <div>
              <div className="connect-label">Substack</div>
              <div className="connect-sub">inkandallthings.substack.com</div>
            </div>
          </a>
          <a className="connect-item" href="https://www.linkedin.com/in/mariana-lameiro-7046a9274/" target="_blank" rel="noopener noreferrer">
            <div className="connect-icon">in</div>
            <div>
              <div className="connect-label">LinkedIn</div>
              <div className="connect-sub">mariana-lameiro</div>
            </div>
          </a>
          <a className="connect-item" href="mailto:marianalameiro.03@gmail.com">
            <div className="connect-icon">@</div>
            <div>
              <div className="connect-label">Email</div>
              <div className="connect-sub">marianalameiro.03@gmail.com</div>
            </div>
          </a>
        </div>
      </>
    ),
    epilogue: (
      <>
        <div className="panel-chapter">{p.epilogue.chapter}</div>
        <h2 className="panel-title">{p.epilogue.title}</h2>
        <div className="panel-coords">{p.epilogue.coords}</div>
        <p className="panel-body">{p.epilogue.body1}</p>
        <p className="panel-body">{p.epilogue.body2}</p>
        <hr className="panel-divider" />
        <div className="panel-body" style={{ fontStyle: "italic", color: "#8a7a60", fontSize: "0.95rem" }}>
          {p.epilogue.closing}
        </div>
      </>
    ),
  };

  return (
    <>
      <div className={`panel-overlay${closing ? " closing" : ""}`} onClick={handleClose} />
      <div className={`panel${closing ? " closing" : ""}`}>
        <button className="panel-close" onClick={handleClose} aria-label="Close">✕</button>
        <div className="panel-inner">
          {content[id] || null}
        </div>
      </div>
    </>
  );
}


/* ── Lamppost ───────────────────────────────────────────── */
function Lamppost({ x, h = 180, isNight = false, delay = 0, onClick }) {
  const W  = 14;
  const PX = 7;   // pole centre x in SVG
  const PT = Math.round(h * 0.28); // pole-top y (from SVG top)
  const LX = PX - 22; // lantern centre x (arm extends left)
  const LY = Math.round(h * 0.06); // lantern top y

  return (
    <svg
      className="lamppost"
      style={{ left: x - PX, width: W, height: h, overflow: 'visible' }}
      viewBox={`0 0 ${W} ${h}`}
      onClick={onClick}
    >
      <defs>
        <linearGradient id={`lp_${x}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#241808" />
          <stop offset="35%"  stopColor="#5a4030" />
          <stop offset="65%"  stopColor="#543c2c" />
          <stop offset="100%" stopColor="#1e1408" />
        </linearGradient>
        {isNight && (
          <radialGradient id={`lg_${x}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,220,70,0.92)" />
            <stop offset="40%"  stopColor="rgba(255,200,40,0.45)" />
            <stop offset="100%" stopColor="rgba(255,180,0,0)" />
          </radialGradient>
        )}
      </defs>

      {/* Night glow halo — staggered flicker */}
      {isNight && (
        <ellipse cx={LX} cy={LY+14} rx={56} ry={50}
                 fill={`url(#lg_${x})`}
                 style={{ animation: `lamp-flicker 4.2s ease-in-out ${delay}s infinite` }} />
      )}

      {/* Curved arm from pole top to lantern */}
      <path d={`M ${PX},${PT+6} C ${PX},${PT-8} ${LX+14},${LY+6} ${LX+2},${LY+14}`}
            fill="none" stroke={`url(#lp_${x})`} strokeWidth="3.5" strokeLinecap="round" />

      {/* Decorative collar at arm junction */}
      <rect x={PX-6} y={PT} width={12} height={9} fill="#2c1e0c" rx="2" />

      {/* Lantern — Lisboa box-style */}
      {/* Pyramid cap */}
      <path d={`M ${LX-12},${LY+4} L ${LX},${LY} L ${LX+12},${LY+4}`}
            fill="#221408" />
      {/* Finial */}
      <line x1={LX} y1={LY} x2={LX} y2={LY-5} stroke="#221408" strokeWidth="2" />
      <circle cx={LX} cy={LY-6} r="2.2" fill="#221408" />
      {/* Glass body */}
      <rect x={LX-11} y={LY+4} width={22} height={22}
            fill={isNight ? "#fffaaa" : "#f4eccC"} stroke="#221408" strokeWidth="1.4" rx="1" />
      {/* Glazing bars */}
      <line x1={LX}    y1={LY+4}  x2={LX}    y2={LY+26} stroke="#221408" strokeWidth="0.9" />
      <line x1={LX-11} y1={LY+14} x2={LX+11} y2={LY+14} stroke="#221408" strokeWidth="0.9" />
      {/* Inner warm glow when night */}
      {isNight && (
        <rect x={LX-10} y={LY+5} width={20} height={20}
              fill="rgba(255,235,60,0.48)" rx="1" />
      )}
      {/* Base plate */}
      <rect x={LX-13} y={LY+26} width={26} height={4} fill="#221408" rx="1" />

      {/* Pole — tapered */}
      <polygon
        points={`${PX-5},${h-3} ${PX+5},${h-3} ${PX+3},${PT+9} ${PX-3},${PT+9}`}
        fill={`url(#lp_${x})`}
      />

      {/* Decorative base (wider foot) */}
      <path d={`M ${PX-13},${h-3} Q ${PX-8},${h-20} ${PX-4},${h-24}
                L ${PX+4},${h-24} Q ${PX+8},${h-20} ${PX+13},${h-3} Z`}
            fill={`url(#lp_${x})`} />
      {/* Base plate */}
      <rect x={PX-15} y={h-4} width={30} height={4} fill="#1a1006" rx="1.5" />
    </svg>
  );
}


/* ── Portfolio View ─────────────────────────────────────── */
/* ── Translations ───────────────────────────────────────── */
const T = {
  en: {
    eyebrow: "Lisboa · Portfolio",
    disciplines: "Mathematics · Biology · Psychology · Writing",
    lead: "Undergraduate at the University of Lisbon, studying Mathematics, Biology and Psychology. Interested in where these fields overlap.",
    chaptersLabel: "Chapters",
    exploreBtn: "→ explore Lisboa",
    dragHint: "← drag to explore →",
    backBtn: "← back",
    chapters: [
      { num: "Chapter I",   title: "The Student",    desc: "Mathematics, Biology and Psychology at the University of Lisbon." },
      { num: "Chapter II",  title: "The Laboratory", desc: "Research at IBEB and LASIGE. Biophysics and computational medicine." },
      { num: "Chapter III", title: "The Field",      desc: "Marine science, outreach, journalism, and voluntary work." },
      { num: "Chapter IV",  title: "The Page",       desc: "Essays, manuscripts, poems. Ink and All Things on Substack." },
      { num: "Find me",     title: "Connect",        desc: "Always glad to hear from people working on interesting things." },
    ],
    panels: {
      ch1: {
        chapter: "Chapter I", title: "The Student",
        coords: "38°45'N 9°9'W · Universidade de Lisboa",
        quote: "Two roads diverged in a wood, and I —\nI took the one less traveled by,\nAnd that has made all the difference.",
        quoteAttr: "Robert Frost · The Road Not Taken",
        body: "Undergraduate in General Studies at the University of Lisbon, studying Mathematics, Biology and Psychology. Most interested in the places where these fields cross.",
        labels: { degree: "Degree", interest: "Interest", institution: "Institution" },
        values: { degree: "Mathematics · Biology · Psychology", interest: "Dynamical systems · Neuroscience", institution: "University of Lisbon" },
        tags: ["Mathematical Biology", "Dynamical Systems", "Neuroscience", "Psychology", "Biology"],
      },
      ch2: {
        chapter: "Chapter II", title: "The Laboratory",
        body: "Two labs, two research directions. Biophysics at IBEB and computational approaches to Parkinson's disease at LASIGE.",
        labs: [
          { date: "Nov 2025", name: "IBEB, Institute of Biophysics and Biomedical Engineering", desc: "Biophysics research. Modelling biological systems at the intersection of physics and living matter.", tags: ["Biophysics", "Biomedical Engineering", "Modelling"] },
          { date: "Sep 2025", name: "LASIGE, Large-Scale Informatics Systems Laboratory",       desc: "Using NLP to detect early markers of Parkinson's disease in speech and text.", tags: ["LLMs", "NLP", "Parkinson's", "Computational Medicine"] },
        ],
      },
      ch3: {
        chapter: "Chapter III", title: "The Field",
        body: "Science outside the lab. Projects in marine pollution, student outreach, European science networks and science journalism.",
        projects: [
          { title: "Ulisses Project",    desc: "Interdisciplinary academic project proposing a solution to a hypothetical ocean plastic spillage scenario." },
          { title: "SET Organiser",      desc: "External relations organiser for SET, connecting students with industry through B2B negotiations and corporate partnerships." },
          { title: "Student Journalist", desc: "Science and culture writing for Diferencial and O Cola, student publications at the University of Lisbon." },
          { title: "SENCY Project",      desc: "Competitive research scholarship at IST/ULisboa on sustainable energy transitions in industrial kitchens." },
        ],
      },
      ch4: {
        chapter: "Chapter IV", title: "The Page",
        body: "Not everything fits into a paper. Essays, manuscripts and poems live here.",
        worksLabel: "Works in progress",
        works: ["Manuscript I", "Manuscript II", "Book of Poems", "Estado com Arte"],
      },
      connect: {
        chapter: "Find me", title: "Connect",
        body: "Happy to hear from people working on interesting things.",
      },
      epilogue: {
        chapter: "Epilogue", title: "The City",
        coords: "38°43'N 9°8'W · Lisboa",
        body1: "Lisboa is not a place you arrive at. It is a place you stay without quite knowing when you stayed. There is something in the pavements, in the afternoon light, in the way the Tejo appears at every unexpected corner.",
        body2: "This site is a way of putting into words what I am: the student, the researcher, the writer, the person who walks the city.",
        closing: "Thank you for making it this far.",
      },
    },
  },
  pt: {
    eyebrow: "Lisboa · Portfólio",
    disciplines: "Matemática · Biologia · Psicologia · Escrita",
    lead: "Licencianda em Estudos Gerais na Universidade de Lisboa, a estudar Matemática, Biologia e Psicologia. Interessada nos lugares onde estas áreas se cruzam.",
    chaptersLabel: "Capítulos",
    exploreBtn: "→ explorar lisboa",
    dragHint: "← arrasta para explorar →",
    backBtn: "← voltar",
    chapters: [
      { num: "Capítulo I",   title: "A Estudante",   desc: "Matemática, Biologia e Psicologia na Universidade de Lisboa." },
      { num: "Capítulo II",  title: "O Laboratório", desc: "Investigação no IBEB e LASIGE. Biofísica e medicina computacional." },
      { num: "Capítulo III", title: "O Campo",       desc: "Ciência marinha, divulgação, jornalismo e voluntariado." },
      { num: "Capítulo IV",  title: "A Página",      desc: "Ensaios, manuscritos, poemas. Ink and All Things no Substack." },
      { num: "Encontra-me",  title: "Contacto",      desc: "Disponível para conversar com pessoas que trabalham em coisas interessantes." },
    ],
    panels: {
      ch1: {
        chapter: "Capítulo I", title: "A Estudante",
        coords: "38°45'N 9°9'W · Universidade de Lisboa",
        quote: "Dois caminhos divergiram numa floresta, e eu —\nEscolhi o menos percorrido,\nE isso fez toda a diferença.",
        quoteAttr: "Robert Frost · O Caminho Não Seguido",
        body: "Licencianda em Estudos Gerais na Universidade de Lisboa, a estudar Matemática, Biologia e Psicologia. Mais interessada nos lugares onde estas áreas se cruzam.",
        labels: { degree: "Licenciatura", interest: "Interesse", institution: "Instituição" },
        values: { degree: "Matemática · Biologia · Psicologia", interest: "Sistemas dinâmicos · Neurociência", institution: "Universidade de Lisboa" },
        tags: ["Biologia Matemática", "Sistemas Dinâmicos", "Neurociência", "Psicologia", "Biologia"],
      },
      ch2: {
        chapter: "Capítulo II", title: "O Laboratório",
        body: "Dois laboratórios, duas direções de investigação. Biofísica no IBEB e abordagens computacionais à doença de Parkinson no LASIGE.",
        labs: [
          { date: "Nov 2025", name: "IBEB, Instituto de Biofísica e Engenharia Biomédica", desc: "Investigação em biofísica. Modelação de sistemas biológicos na interseção entre física e matéria viva.", tags: ["Biofísica", "Engenharia Biomédica", "Modelação"] },
          { date: "Set 2025", name: "LASIGE, Laboratório de Sistemas Informáticos de Grande Escala", desc: "Uso de PLN para detetar marcadores precoces da doença de Parkinson em fala e texto.", tags: ["LLMs", "PLN", "Parkinson", "Medicina Computacional"] },
        ],
      },
      ch3: {
        chapter: "Capítulo III", title: "O Campo",
        body: "Ciência fora do laboratório. Projetos em poluição marinha, divulgação, redes europeias de estudantes e jornalismo de ciência.",
        projects: [
          { title: "Projeto Ulisses",    desc: "Projeto académico interdisciplinar com proposta de solução para um cenário hipotético de derrame de plástico oceânico." },
          { title: "Organizadora SET",   desc: "Relações externas na SET, ligando estudantes a empresas através de negociações B2B e parcerias corporativas." },
          { title: "Jornalista Estudantil", desc: "Escrita de ciência e cultura para o Diferencial e O Cola, publicações estudantis da Universidade de Lisboa." },
          { title: "Projeto SENCY",      desc: "Bolsa competitiva de investigação no IST/ULisboa sobre transições energéticas sustentáveis em cozinhas industriais." },
        ],
      },
      ch4: {
        chapter: "Capítulo IV", title: "A Página",
        body: "Nem tudo cabe num artigo científico. Ensaios, manuscritos e poemas vivem aqui.",
        worksLabel: "Trabalhos em curso",
        works: ["Manuscrito I", "Manuscrito II", "Livro de Poemas", "Estado com Arte"],
      },
      connect: {
        chapter: "Encontra-me", title: "Contacto",
        body: "Disponível para conversar com pessoas que trabalham em coisas interessantes.",
      },
      epilogue: {
        chapter: "Epílogo", title: "A Cidade",
        coords: "38°43'N 9°8'W · Lisboa",
        body1: "Lisboa não é um sítio onde se chega. É um sítio onde se fica sem perceber bem quando foi que se ficou. Há qualquer coisa nas calçadas, na luz de tarde, no facto de o Tejo aparecer sempre ao virar de uma esquina que não esperavas.",
        body2: "Este site é uma tentativa de pôr em palavras o que sou: a estudante, a investigadora, quem escreve, quem anda pela cidade.",
        closing: "Obrigada por teres chegado até aqui.",
      },
    },
  },
};

const CHAPTER_IDS = ["ch1", "ch2", "ch3", "ch4", "connect"];

/* Quotes scattered in the dark — revealed by cursor light */
const GHOST_QUOTES = [
  /* ── LEFT MARGIN ── */
  {
    text: "Fiz de mim o que não soube,\ne o que podia fazer de mim\nnão o fiz.",
    attr: "Pessoa · Tabacaria",
    top: "28%", left: "-2%", fontSize: "1.05rem", rotate: "1.4deg",
    color: "rgba(225,195,130,0.32)", shadow: "0 0 18px rgba(210,170,100,0.14)", maxWidth: 300,
  },
  {
    text: "The cosmos is within us.\nWe are made of star-stuff.",
    attr: "Carl Sagan",
    top: "51%", left: "-1%", fontSize: "1.7rem", rotate: "1.2deg",
    color: "rgba(200,175,130,0.30)", shadow: "0 0 24px rgba(180,150,90,0.14)", maxWidth: 420,
  },
  {
    text: "Para ser grande, sê inteiro:\nnada teu exagera ou exclui.",
    attr: "Fernando Pessoa",
    top: "74%", left: "0%", fontSize: "1rem", rotate: "0.5deg",
    color: "rgba(220,190,120,0.30)", shadow: "0 0 16px rgba(200,160,90,0.12)", maxWidth: 290,
  },
  {
    text: "Not all those who wander\nare lost.",
    attr: "Tolkien",
    top: "86%", left: "-2%", fontSize: "0.88rem", rotate: "0.8deg",
    color: "rgba(205,180,130,0.24)", shadow: "0 0 12px rgba(190,155,90,0.10)", maxWidth: 220,
  },
  /* ── RIGHT MARGIN ── */
  {
    text: "Valho o que fiz,\nnão o que pude fazer.",
    attr: "Fernando Pessoa",
    top: "7%", left: "72%", fontSize: "0.85rem", rotate: "-1deg",
    color: "rgba(210,180,110,0.26)", shadow: "0 0 12px rgba(195,155,85,0.10)", maxWidth: 220,
  },
  {
    text: "Não sou nada.\nNunca serei nada.\nÀ parte isso, tenho em mim\ntodos os sonhos do mundo.",
    attr: "Pessoa · Tabacaria",
    top: "5%", left: "-1%", fontSize: "1.55rem", rotate: "1.8deg",
    color: "rgba(220,185,110,0.38)", shadow: "0 0 28px rgba(200,155,80,0.18)", maxWidth: 370,
  },
  {
    text: "Porque eu sou do tamanho\ndo que vejo\ne não do tamanho\nda minha altura.",
    attr: "Pessoa · Alberto Caeiro",
    top: "44%", left: "71%", fontSize: "1.0rem", rotate: "-0.6deg",
    color: "rgba(225,195,125,0.32)", shadow: "0 0 20px rgba(210,170,95,0.14)", maxWidth: 270,
  },
  {
    text: "Perdi os dias\nque podia ter sido.",
    attr: "Pessoa · Tabacaria",
    top: "61%", left: "74%", fontSize: "0.82rem", rotate: "-2.2deg",
    color: "rgba(215,185,115,0.26)", shadow: "0 0 12px rgba(200,160,90,0.10)", maxWidth: 200,
  },
  {
    text: "Where the telescope ends,\nthe microscope begins.\nWhich has the grander view?",
    attr: "Victor Hugo",
    top: "82%", left: "63%", fontSize: "0.96rem", rotate: "-1.2deg",
    color: "rgba(210,185,140,0.28)", shadow: "0 0 16px rgba(190,155,90,0.12)", maxWidth: 310,
  },
  {
    text: "Põe quanto és\nno mínimo que fazes.",
    attr: "Pessoa · Ricardo Reis",
    top: "38%", left: "77%", fontSize: "0.90rem", rotate: "-0.9deg",
    color: "rgba(215,185,120,0.28)", shadow: "0 0 14px rgba(200,160,90,0.11)", maxWidth: 240,
  },
  {
    text: "Escrever é esquecer.",
    attr: "Pessoa · Bernardo Soares",
    top: "69%", left: "73%", fontSize: "0.88rem", rotate: "-1.5deg",
    color: "rgba(210,180,115,0.26)", shadow: "0 0 12px rgba(195,155,85,0.10)", maxWidth: 220,
  },
];

/* ── Stars ──────────────────────────────────────────────── */
function Stars() {
  // Sine-based hash: chaotic, non-periodic, looks truly random
  const h = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const stars = Array.from({ length: 160 }, (_, i) => ({
    left:    (h(i)        * 100).toFixed(2) + '%',
    top:     (h(i + 1000) * 100).toFixed(2) + '%',
    size:    0.7 + h(i + 2000) * 1.8,
    cls:     ['star-a','star-b','star-c','star-b','star-a'][Math.floor(h(i + 3000) * 5)],
    delay:   (h(i + 4000) * 7).toFixed(2) + 's',
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      {stars.map((s, i) => (
        <div key={i} className={s.cls} style={{
          position: 'absolute', left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: '50%',
          background: 'white', animationDelay: s.delay,
        }} />
      ))}
    </div>
  );
}


/* ── Scroll reveal hook ─────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Marquee strip ──────────────────────────────────────── */
const MARQUEE_WORDS = [
  "Matemática","Biologia","Psicologia","Escrita",
  "Lisboa","Ciência","Filosofia","Arte",
  "Mathematics","Biology","Psychology","Writing",
];
function Marquee() {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {items.map((word, i) => (
          <span key={i} className="marquee-item">
            {word}{i < items.length - 1 && <span className="marquee-sep"> ✦ </span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function PortfolioView({ onExplore, onOpenPanel, onGoWorld, lang, onToggleLang }) {
  const spotRef = useRef(null);
  const [activeQuote, setActiveQuote] = useState(null);
  const [closingQuote, setClosingQuote] = useState(false);

  useScrollReveal();

  const openQuote  = (q) => { setClosingQuote(false); setActiveQuote(q); };
  const closeQuote = () => {
    setClosingQuote(true);
    setTimeout(() => { setActiveQuote(null); setClosingQuote(false); }, 280);
  };

  return (
    <div className="portfolio-wrap">
      <style>{css}</style>
      <CustomCursor isNight={true} nightRef={spotRef} />
      <div ref={spotRef} className="portfolio-spotlight" />
      <Stars />
      <div className="ambient-glow-a" />
      <div className="ambient-glow-b" />
      <div className="portfolio-grain" />

      {/* Top banner */}
      <div className="top-banner">
        <a className="top-banner-link" href="https://whatshouldidonext.surge.sh" target="_blank" rel="noopener noreferrer">
          <span className="top-banner-new">NEW</span>
          <span>{lang === "pt" ? "Explora a minha app" : "Check out my app"} — What Should I Do Next?</span>
          <span className="top-banner-arrow">→</span>
        </a>
        <button className="lang-btn portfolio" onClick={onToggleLang}>
          {lang === "pt" ? "EN" : "PT"}
        </button>
      </div>

      <div className="portfolio-inner">
        {/* Hidden quotes — revealed by cursor light */}
        {GHOST_QUOTES.map((q, i) => (
          <div key={i} className="ghost-quote" onClick={() => openQuote(q)} style={{
            top: q.top, left: q.left,
            fontSize: q.fontSize,
            color: q.color,
            maxWidth: q.maxWidth,
            transform: `rotate(${q.rotate})`,
            textShadow: q.shadow,
          }}>
            {q.text.split("\n").map((line, li, arr) => (
              <span key={li}>{line}{li < arr.length - 1 && <br />}</span>
            ))}
            <span className="ghost-quote-attr">— {q.attr}</span>
          </div>
        ))}

        <div className="portfolio-hero hero-v2">
          <div className="portfolio-eyebrow">
            <span>{T[lang].eyebrow}</span>
          </div>
          <h1 className="hero-v2-name">Mariana<br/>Brites Lameiro</h1>
          <div className="hero-v2-ornament"><span>✦</span></div>
          <div className="hero-v2-disciplines">{T[lang].disciplines}</div>
          <div className="hero-v2-coords">38°43'N · 9°8'W · Lisboa</div>
        </div>

        <Marquee />

        <div className="chapter-section reveal">
          <div className="chapter-section-label">{T[lang].chaptersLabel}</div>

          <div className="chapter-grid-b">
            {CHAPTER_IDS.map((id, i) => {
              const ch = T[lang].chapters[i];
              return (
                <div key={id} className="card-manila" onClick={() => onOpenPanel(id)}>
                  <div className="cm-tab">{ch.num}</div>
                  <div className="cm-body">
                    <div className="cm-title">{ch.title}</div>
                    <div className="cm-desc">{ch.desc}</div>
                    <span className="cm-arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chapter-section reveal reveal-d1">
          <div className="chapter-section-label">{lang === "pt" ? "Aplicações" : "Apps"}</div>
          <a className="app-card" href="https://whatshouldidonext.surge.sh" target="_blank" rel="noopener noreferrer">
            <div className="app-card-icon">🗂</div>
            <div className="app-card-body">
              <div className="app-card-label">
                {lang === "pt" ? "Ferramenta de estudo" : "Study tool"}
                <span className="app-card-new">NEW</span>
              </div>
              <div className="app-card-title">What Should I Do Next?</div>
              <div className="app-card-desc">
                {lang === "pt"
                  ? "Planeador de estudos com diário, projetos, exames, horas e estatísticas."
                  : "Study planner with daily view, projects, exams, hours tracking and stats."}
              </div>
            </div>
            <div className="app-card-arrow">→</div>
          </a>
          <button
            className="app-card"
            onClick={() => onGoWorld("lgf")}
          >
            <div className="app-card-icon">📚</div>
            <div className="app-card-body">
              <div className="app-card-label">
                {lang === "pt" ? "Research" : "Research"}
                <span className="app-card-new">NEW</span>
              </div>
              <div className="app-card-title">Research Frontier Finder</div>
              <div className="app-card-desc">
                {lang === "pt"
                  ? "Descobre lacunas na literatura científica. Insere um tópico e obtém análise automática com Groq + PubMed + OpenAlex."
                  : "Discover gaps in scientific literature. Enter a topic and get automated analysis with Groq + PubMed + OpenAlex."}
              </div>
            </div>
            <div className="app-card-arrow">→</div>
          </button>
        </div>

        <blockquote className="iron-quote reveal">
          <p className="iron-quote-text">
            Every time you look down at your wrist and stare into those blueish veins that have always fascinated you, I hope you think of the blood that runs inside. The same blood that contains hemoglobin — an iron-rich protein. And remember that iron has only one place where it can be naturally produced: the core of dying stars.
          </p>
          <span className="iron-quote-attr">— M.B.L.</span>
        </blockquote>

        <div className="worlds-section reveal reveal-d2">
          <div className="chapter-section-label">
            {lang === "pt" ? "Mundos" : "Worlds"}
          </div>
          <div className="worlds-grid">
            {[
              { id: "caderno",    num: "I",   glyph: "✦", title: lang === "pt" ? "O Caderno"              : "The Notebook",          desc: lang === "pt" ? "Pensamentos em tinta."                      : "Thoughts in ink." },
              { id: "timeline",   num: "II",  glyph: "◈", title: lang === "pt" ? "Museu do Tempo"         : "Museum of Time",        desc: lang === "pt" ? "Arquivo biográfico em exposição."          : "A biographical archive on display." },
              { id: "portfolio-c",num: "III", glyph: "◉", title: lang === "pt" ? "Portfólio Científico"   : "Scientific Portfolio",  desc: lang === "pt" ? "Projetos, investigação, trabalho de campo." : "Projects, research, fieldwork." },
              { id: "research",   num: "IV",  glyph: "⬡", title: lang === "pt" ? "Interesses de Investigação" : "Research Interests", desc: lang === "pt" ? "Perguntas que ainda não sei responder."    : "Questions I can't yet answer." },
            ].map(w => (
              <button key={w.id} className="world-card" onClick={() => onGoWorld(w.id)}>
                <div className="world-card-glyph">{w.glyph}</div>
                <div className="world-card-num">{w.num}</div>
                <div className="world-card-title">{w.title}</div>
                <div className="world-card-desc">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="contact-section reveal reveal-d3">
          <div className="chapter-section-label">
            {lang === "pt" ? "Contacto" : "Contact"}
          </div>
          <div className="contact-body">
            <p className="contact-text">
              {lang === "pt"
                ? "Para colaborações em investigação, escrita científica ou outros projetos."
                : "For research collaborations, science writing, or other projects."}
            </p>
            <div className="contact-links">
              <a className="contact-link" href="mailto:marianalameiro.03@gmail.com">
                marianalameiro.03@gmail.com
              </a>
              <a className="contact-link" href="https://www.linkedin.com/in/mariana-lameiro-7046a9274/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a className="contact-link" href="https://inkandallthings.substack.com" target="_blank" rel="noopener noreferrer">
                Substack
              </a>
            </div>
          </div>
        </div>

        <div className="portfolio-footer">
          <button className="explore-btn" onClick={onExplore}>
            {T[lang].exploreBtn}
          </button>
        </div>
      </div>
      {/* Quote modal */}
      {activeQuote && (
        <div className={`quote-modal-overlay${closingQuote ? " closing" : ""}`} onClick={closeQuote}>
          <div className="quote-modal" onClick={e => e.stopPropagation()}>
            <p className="quote-modal-text">{activeQuote.text}</p>
            <div className="quote-modal-divider" />
            <span className="quote-modal-attr">— {activeQuote.attr}</span>
          </div>
          <button className="quote-modal-close" onClick={closeQuote}>✕</button>
        </div>
      )}
    </div>
  );
}


/* ── App constants ──────────────────────────────────────── */
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.508 + 23) % 100,
  y: (i * 91.234 + 7) % 42,
  r: 0.7 + (i % 5) * 0.3,
  o: 0.35 + (i % 7) * 0.09,
}));

const CLOUDS = [
  { x: 80,   y: 18,  w: 200, h: 55,  seed: 1 },
  { x: 430,  y: 8,   w: 280, h: 72,  seed: 2 },
  { x: 820,  y: 28,  w: 170, h: 46,  seed: 3 },
  { x: 1250, y: 12,  w: 240, h: 64,  seed: 4 },
  { x: 1700, y: 22,  w: 190, h: 52,  seed: 5 },
  { x: 2100, y: 6,   w: 260, h: 68,  seed: 6 },
  { x: 2500, y: 30,  w: 150, h: 44,  seed: 7 },
  { x: 2850, y: 14,  w: 220, h: 58,  seed: 8 },
];


const BRAIN_FACTS = [
  "O cérebro usa 20% da energia do corpo — mesmo pesando só 2% do peso total.",
  "Tens cerca de 86 mil milhões de neurónios, cada um ligado a até 10 000 outros.",
  "O cérebro gera ~23 watts — suficiente para acender uma lâmpada de sala.",
  "As memórias não são armazenadas num sítio: são reconstruídas em rede cada vez que as recordas.",
  "O cérebro não sente dor. Não tem nociceptores — por isso se fazem cirurgias com o paciente acordado.",
  "Durante o sono, o sistema glinfático lava o cérebro de proteínas tóxicas ligadas ao Alzheimer.",
  "Neuroplasticidade: o cérebro reconfigura-se fisicamente sempre que aprendes algo novo.",
  "O cerebelo pesa 10% do cérebro mas contém mais de metade de todos os seus neurónios.",
  "O córtex pré-frontal — sede do raciocínio e do controlo de impulsos — só termina de amadurecer aos 25 anos.",
  "O cérebro é 73% água — 2% de desidratação já prejudica atenção, memória e humor.",
  "Metade do córtex cerebral está dedicada a processar informação visual.",
  "Os sinais nervosos viajam a até 120 m/s — mais rápido do que um carro de Fórmula 1.",
  "A amígdala processa o medo em milissegundos — antes de teres consciência do perigo.",
  "O intestino tem ~500 milhões de neurónios e comunica com o cérebro directamente pelo nervo vago.",
  "Os neurónios-espelho disparam tanto quando fazes uma acção como quando a observas noutrem.",
  "O cérebro em repouso consome quase tanta energia como em plena actividade — a rede por defeito nunca para.",
  "O sono REM activa o cérebro quase tanto como estar acordado, mas paralisa os músculos do corpo.",
  "A mielinização — revestimento isolante dos axónios — acelera 100× a velocidade dos sinais.",
  "O hipocampo encolhe com stress crónico. O exercício aeróbico regular faz-o crescer de volta.",
  "Perder uma noite de sono prejudica a cognição tanto como ter 0,10% de álcool no sangue.",
  "O cérebro reconhece um rosto em 170 milissegundos — mais depressa do que qualquer outra categoria visual.",
  "Meditar regularmente aumenta a espessura do córtex pré-frontal e reduz o volume da amígdala.",
  "A sinestesia — ver cores ao ouvir sons — ocorre em ~4% da população e é hereditária.",
  "O cérebro de um recém-nascido cresce até 80% do tamanho adulto nos primeiros três anos de vida.",
];

const RAIN_DROPS = Array.from({ length: 90 }, (_, i) => ({
  left:  `${(i * 137.5) % 100}%`,
  delay: `${(i * 0.13) % 2.5}s`,
  dur:   `${0.55 + (i % 7) * 0.07}s`,
  h:     12 + (i % 9) * 2.2,
  op:    0.55 + (i % 5) * 0.09,
}));

/* ── Tram component (Lisboa eléctrico 28) ── */
function Tram({ fact, onClick }) {
  const W = 220, H = 96;
  const RY  = 10;   // roof top y
  const BY  = 18;   // body top y
  const GY  = 62;   // green band top y
  const BOY = 76;   // bogie frame top y
  const WCY = 88;   // wheel centre y
  const WR  = 9;    // wheel radius

  return (
    <div style={{ position:'relative', width:W, height:H }} onClick={onClick}>
      {fact && <div className="fact-bubble">{fact}</div>}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id="tg_cream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fdfbe8" />
            <stop offset="100%" stopColor="#f4e460" />
          </linearGradient>
          <linearGradient id="tg_grn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2e5824" />
            <stop offset="100%" stopColor="#1a3814" />
          </linearGradient>
          <linearGradient id="tg_roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6a6a6a" />
            <stop offset="100%" stopColor="#3a3a3a" />
          </linearGradient>
          <linearGradient id="tg_body_shd" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
            <stop offset="12%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="88%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.14)" />
          </linearGradient>
          <radialGradient id="tg_glass" cx="28%" cy="22%" r="72%">
            <stop offset="0%"   stopColor="#d8f0ff" />
            <stop offset="100%" stopColor="#78b0d0" />
          </radialGradient>
        </defs>

        {/* ── Trolley pole (angled arm) ── */}
        <line x1={W*0.52} y1={RY} x2={W*0.60} y2={-6}
              stroke="#606060" strokeWidth="2.5" strokeLinecap="round" />
        {/* Contact shoe */}
        <rect x={W*0.60-4} y={-8} width={10} height={3} fill="#888" rx="1" />

        {/* ── Roof ── */}
        <path d={`M 10,${RY} Q ${W/2},${RY-8} ${W-10},${RY} L ${W-8},${BY} L 8,${BY} Z`}
              fill="url(#tg_roof)" />
        {/* Roof ventilation strip */}
        <rect x={22} y={RY+2} width={W-44} height={3} fill="rgba(255,255,255,0.10)" rx="1" />
        {/* Roof highlight */}
        <path d={`M 10,${RY} Q ${W/2},${RY-8} ${W-10},${RY}`}
              fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" />

        {/* ── Cream body ── */}
        <path d={`M 8,${BY} L ${W-8},${BY} L ${W-6},${GY} L 6,${GY} Z`}
              fill="url(#tg_cream)" />
        {/* Body side shading */}
        <path d={`M 8,${BY} L ${W-8},${BY} L ${W-6},${GY} L 6,${GY} Z`}
              fill="url(#tg_body_shd)" />
        {/* Mid-body panel seam */}
        <line x1={8} y1={BY+22} x2={W-8} y2={BY+22}
              stroke="rgba(0,0,0,0.10)" strokeWidth="1" />

        {/* ── Green lower band ── */}
        <path d={`M 6,${GY} L ${W-6},${GY} L ${W-8},${BOY} L 8,${BOY} Z`}
              fill="url(#tg_grn)" />
        {/* Green top highlight */}
        <line x1={6} y1={GY+1} x2={W-6} y2={GY+1}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* ── Brass trim lines ── */}
        <line x1={6}   y1={GY}    x2={W-6}   y2={GY}    stroke="#c8a820" strokeWidth="2.5" />
        <line x1={8}   y1={BY}    x2={W-8}   y2={BY}    stroke="#c0a018" strokeWidth="1.2" />
        <line x1={6}   y1={BOY-1} x2={W-6}   y2={BOY-1} stroke="#806010" strokeWidth="0.8" />

        {/* ── Headlights ── */}
        <circle cx={10}   cy={BY+8} r={4} fill="#d0c060" stroke="#a09020" strokeWidth="1" />
        <circle cx={10}   cy={BY+8} r={2.5} fill="#fffde0" />
        <circle cx={W-10} cy={BY+8} r={4} fill="#d0c060" stroke="#a09020" strokeWidth="1" />
        <circle cx={W-10} cy={BY+8} r={2.5} fill="#fffde0" />

        {/* ── Destination board (rear) ── */}
        <rect x={14} y={BY+5} width={50} height={13} fill="#08101e" rx="2" />
        <text x={39} y={BY+14} textAnchor="middle" fill="#f0e040"
              fontSize="6.5" fontFamily="monospace" letterSpacing="0.5" fontWeight="bold">{"28 ESTRELA"}</text>

        {/* ── Door ── */}
        <rect x={72} y={BY+4} width={30} height={GY-BY-4} fill="#ccb828" rx="1" />
        <line x1={87} y1={BY+4} x2={87} y2={GY} stroke="#9a8010" strokeWidth="1.2" />
        <rect x={74} y={BY+6} width={11} height={16} fill="url(#tg_glass)" rx="1" />
        <rect x={89} y={BY+6} width={11} height={16} fill="url(#tg_glass)" rx="1" />
        <circle cx={86} cy={BY+32} r={2.5} fill="#c8a020" />

        {/* ── Three main windows ── */}
        {[112, 148, 184].map((wx, i) => (
          <g key={i}>
            {/* Window surround */}
            <rect x={wx-2} y={BY+3} width={30} height={36} fill="#183414" rx="2" />
            {/* Glass */}
            <rect x={wx}   y={BY+5} width={26} height={32} fill="url(#tg_glass)" rx="1" />
            {/* Frame dividers */}
            <line x1={wx+13} y1={BY+5}  x2={wx+13} y2={BY+37} stroke="#183414" strokeWidth="1.8" />
            <line x1={wx}    y1={BY+18} x2={wx+26} y2={BY+18} stroke="#183414" strokeWidth="1.8" />
            {/* Glass glare */}
            <rect x={wx+2} y={BY+6} width={8} height={4} fill="rgba(255,255,255,0.42)" rx="1" />
          </g>
        ))}

        {/* ── Bogies ── */}
        {[14, 148].map((bx, i) => (
          <g key={i}>
            {/* Bogie frame */}
            <rect x={bx} y={BOY} width={44} height={11} fill="#252525" rx="2" />
            {/* Suspension springs suggestion */}
            <rect x={bx+8}  y={BOY-3} width={4} height={5} fill="#333" />
            <rect x={bx+32} y={BOY-3} width={4} height={5} fill="#333" />
            {/* Wheels */}
            {[bx+10, bx+34].map((wx2, wi) => (
              <g key={wi}>
                <circle cx={wx2} cy={WCY} r={WR}       fill="#1c1c1c" stroke="#505050" strokeWidth="1.8" />
                <circle cx={wx2} cy={WCY} r={WR*0.52}  fill="#2c2c2c" />
                <circle cx={wx2} cy={WCY} r={WR*0.22}  fill="#3c3c3c" />
                {/* Wheel flange */}
                <circle cx={wx2} cy={WCY} r={WR+1.5}   fill="none" stroke="#404040" strokeWidth="1" />
              </g>
            ))}
          </g>
        ))}

        {/* ── Body top shine ── */}
        <path d={`M 8,${BY} L ${W-8},${BY} L ${W-9},${BY+9} L 9,${BY+9} Z`}
              fill="rgba(255,255,255,0.11)" />
      </svg>
    </div>
  );
}

/* ── Tram Stop ──────────────────────────────────────────── */
function TramStop({ x, isNight = false, onClick }) {
  const PX = 10;
  return (
    <svg className="tram-stop"
         style={{ position: 'absolute', left: x - PX, bottom: 140, overflow: 'visible' }}
         width={60} height={112} viewBox="0 0 60 112"
         onClick={onClick}>
      <defs>
        <linearGradient id="signGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd020"/>
          <stop offset="100%" stopColor="#e8b400"/>
        </linearGradient>
      </defs>

      {/* Pole */}
      <rect x={PX-1.5} y={36} width={3} height={76} fill="#2c2416" rx="0.8"/>
      {/* Pole cap */}
      <ellipse cx={PX} cy={36} rx={3.5} ry={2.5} fill="#3c3220"/>
      {/* Base */}
      <rect x={PX-8} y={107} width={16} height={5} fill="#1c1208" rx="2"/>
      <rect x={PX-5} y={104} width={10} height={5} fill="#28200e" rx="1.5"/>

      {/* Arm — elegant curve */}
      <path d={`M ${PX},39 C ${PX},30 34,22 34,14`}
            fill="none" stroke="#2c2416" strokeWidth="2" strokeLinecap="round"/>
      {/* Arm joint at sign */}
      <circle cx={34} cy={14} r={2.8} fill="#3c3220"/>

      {/* Sign outer glow (night ambience) */}
      <rect x={16} y={-2} width={38} height={36} rx="4"
            fill="rgba(255,200,0,0.14)"/>
      {/* Sign shadow */}
      <rect x={18} y={1} width={38} height={36} rx="4" fill="rgba(0,0,0,0.28)"/>

      {/* Sign body */}
      <rect x={16} y={-1} width={38} height={34} rx="4" fill="url(#signGrad)"/>

      {/* Top stripe — darker header band */}
      <rect x={16} y={-1} width={38} height={10} rx="4" fill="#c89800"/>
      <rect x={16} y={5} width={38} height={4} fill="#c89800"/>

      {/* Sign inner border */}
      <rect x={18} y={1} width={34} height={30} fill="none"
            stroke="rgba(0,0,0,0.16)" strokeWidth="0.7" rx="3"/>

      {/* PARAGEM — in header */}
      <text x={35} y={8.5} textAnchor="middle"
            fontFamily="'DM Mono', monospace" fontSize="4.8" letterSpacing="0.9"
            fill="rgba(255,244,190,0.90)">PARAGEM</text>

      {/* Route number 28 */}
      <text x={35} y={25} textAnchor="middle"
            fontFamily="'DM Mono', monospace" fontSize="16" fontWeight="bold"
            fill="#180c00" letterSpacing="-0.5">28</text>

      {/* ELÉCTRICO — footer */}
      <text x={35} y={30} textAnchor="middle"
            fontFamily="'DM Mono', monospace" fontSize="4.2" letterSpacing="0.7"
            fill="rgba(30,16,0,0.55)">ELÉCTRICO</text>

      {/* Night glow — sign backlit ambience */}
      {isNight && (
        <rect x={8} y={-8} width={50} height={46} rx="5"
              fill="rgba(255,200,30,0.18)"
              style={{ filter: 'blur(7px)', pointerEvents: 'none' }} />
      )}
    </svg>
  );
}


/* ── CadernoOpening ─────────────────────────────────────── */
const OPENING_PHRASE = "Paths are made by walking";
const OPENING_ATTR   = "― Franz Kafka";

function CadernoOpening({ onEnter }) {
  const [phase, setPhase] = useState("writing");
  const totalMs = OPENING_PHRASE.length * CHAR_STAGGER + CHAR_DRAW;

  useEffect(() => {
    if (phase !== "writing") return;
    const t = setTimeout(() => setPhase("ready"), totalMs + 1400);
    return () => clearTimeout(t);
  }, [phase, totalMs]);

  const handleEnter = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("exit");
    setTimeout(onEnter, 900);
  }, [phase, onEnter]);

  useEffect(() => {
    const onKey = () => handleEnter();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleEnter]);

  const attrDelay = totalMs + 400;

  return (
    <div className={`caderno-opening${phase === "exit" ? " exit" : ""}`} onClick={handleEnter}>
      <div className="caderno-opening-text">
        {Array.from(OPENING_PHRASE).map((char, i) =>
          char === " "
            ? <span key={i}> </span>
            : <span key={i} className="caderno-char"
                    style={{ animationDelay: `${i * CHAR_STAGGER}ms` }}>{char}</span>
        )}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.68rem",
        letterSpacing: "0.12em",
        color: "rgba(200,169,110,0.45)",
        marginTop: "18px",
        opacity: 0,
        animation: `caderno-opening-attr-in 0.9s ease ${attrDelay}ms forwards`,
      }}>
        {OPENING_ATTR}
      </div>
      <button className={`caderno-enter-btn${phase === "ready" ? " visible" : ""}`}>
        → entrar
      </button>
    </div>
  );
}

/* ── CadernoView ────────────────────────────────────────── */
const CADERNO_FRAGMENTS = [
  "Como é que se explica que a melancolia é mais confortável do que qualquer segundo de felicidade pura (seja lá o que isso for)?",
  "Espero que nunca deixes de reconhecer a felicidade no meio de toda a confusão. Que a encontres sempre, e que acima de tudo sejas também capaz de a criar. A arte da criação é tão importante quanto a do reconhecimento.",
  "Porque é que temos que tornar cada contestação num movimento de revolução na reivindicação das medidas mais simples e básicas que existem?",
  "Admitting that there might be a future where I don’t want that person anymore deepens the fear of losing them",
  "o ponto da viagem que lhe indica que faltam aproximadamente duas horas para chegar a casa. Mas o pensamento de que está cada vez mais longe, de que vai cada vez menos vezes a casa, assalta-a sem aviso.",
  "Porque, segundo ela, só as perguntas metafísicas têm direito a ser abstratas. E uma boa resposta deve sempre ser concreta.",
  "E amanhã, quando acordar recordará a si própria o quanto a ajuda escrever em nome desta pessoa que não existe, desta pessoa que é ela. Esta ficção cujas entrelinhas ninguém virá para ordenar.",
  "Estou aqui sentada ao computador, anos depois, vários anos depois, ainda com a mesma pergunta: como é que isto tudo foi possível? Nunca me ocorreu que viesse a contar a nossa história, mas soube-o no minuto em que acabou.",
  "culpamos as nossas versões do passado como se isso pudesse roubar alguma dor à do presente. Mas não, não pode. Só a reforça ainda mais.",
  "Quanto é que somos capazes de suportar até a ponte desabar connosco para o outro lado?",
  "Quer digam que foi como forma de negação, eternização, ou de honrar uma vida que um dia também foi minha. Eu sei que direi que foi um crime, e que escrevo isto como tentativa de reconstituição. Na esperança de que as palavras me devolvam a certeza de que nada mais havia a fazer. De que enquanto segurávamos a mão um do outro já ambos tínhamos morrido.",
];

const CHAR_STAGGER = 42;  // ms between each char starting to draw
const CHAR_DRAW   = 88;   // ms each char takes to fully appear

function CadernoView({ onBack, onGoWorld }) {
  const [fragIdx, setFragIdx] = useState(0);
  const [phase, setPhase]     = useState("writing"); // writing | fading

  const frag = CADERNO_FRAGMENTS[fragIdx];
  const totalDrawMs = frag.length * CHAR_STAGGER + CHAR_DRAW;

  useEffect(() => {
    if (phase === "writing") {
      const t = setTimeout(() => setPhase("fading"), totalDrawMs + 3800);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setFragIdx(i => (i + 1) % CADERNO_FRAGMENTS.length);
        setPhase("writing");
      }, 620);
      return () => clearTimeout(t);
    }
  }, [phase, fragIdx, totalDrawMs]);

  return (
    <div className="caderno-wrap">
      <div className="caderno-header">
        <button className="caderno-back" onClick={onBack}>← voltar</button>
        <span className="caderno-header-title">O Caderno</span>
      </div>
      <div className="caderno-page">
        <div className="caderno-holes">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="caderno-hole" />
          ))}
        </div>
        <div className="caderno-margin-line" />
        <div className="caderno-text-area">
          <p key={fragIdx} className={`caderno-text${phase === "fading" ? " fade-out" : ""}`}>
            {Array.from(frag).map((char, i) =>
              char === " "
                ? <span key={i}> </span>
                : <span
                    key={i}
                    className="caderno-char"
                    style={{ animationDelay: `${i * CHAR_STAGGER}ms` }}
                  >{char}</span>
            )}
          </p>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 40px', pointerEvents: 'none' }}>
        <button className="world-nav-btn" style={{ pointerEvents: 'all', color: 'rgba(80,60,30,0.45)' }} onClick={() => onGoWorld("research")}>← Research Interests</button>
        <button className="world-nav-btn next" style={{ pointerEvents: 'all', color: 'rgba(80,60,30,0.45)' }} onClick={() => onGoWorld("portfolio-c")}>Portfólio Científico →</button>
      </div>
    </div>
  );
}


/* ── PortfolioCientificoView ─────────────────────────────── */
const PC_PROJECTS = [
  {
    year: "Set 2025 – presente",
    tag: "Investigação",
    active: true,
    title: "LASIGE — Doença de Parkinson",
    role: "Research Intern · Universidade de Lisboa",
    desc: "Aplicação de Large Language Models (LLMs) e dados de acelerometria de pacientes para modelar a progressão da doença de Parkinson. Pré-processamento de dados e análise matemática de sinais de acelerometria.",
    learned: "LLMs · Python (pandas, NumPy) · Análise de sinais · Escrita científica",
  },
  {
    year: "Nov 2025 – presente",
    tag: "Investigação",
    active: true,
    title: "IBEB — Potenciais Evocados",
    role: "Research Trainee · Instituto de Biofísica e Engenharia Biomédica",
    desc: "Revisão bibliográfica aprofundada sobre potenciais evocados (EP) para suporte a investigação clínica e design experimental de mestrado. Processamento de dados EEG e análise de sinais bioelétricos.",
    learned: "EEG · Software neurofisiológico · Análise de sinais neurais · Revisão de literatura",
  },
  {
    year: "Fev – Jul 2026",
    tag: "Bolsa de investigação",
    active: true,
    title: "Projeto SENCY",
    role: "Research Scholar · Instituto Superior Técnico / ULisboa",
    desc: "Bolsa competitiva de investigação no projeto SENCY (Sustainable ENergy transitions in the Catering industrY). Investigação orientada a dados sobre consumo de energia e água em cozinhas industriais, modelos de previsão e integração de energias renováveis.",
    learned: "Análise de dados energéticos · Modelos de previsão · Python · Equipas interdisciplinares",
  },
];

function PortfolioCientificoView({ onBack, onGoWorld }) {
  const [scrolled, setScrolled] = useState(false);
  const palette = {
    "--pc-bg": "linear-gradient(to bottom, #0b2025 0%, #12313a 100%)",
    "--pc-accent": "#4f8b91",
    "--pc-back-color": "rgba(220,239,236,0.82)",
    "--pc-back-bg": "rgba(255,255,255,0.05)",
    "--pc-back-border": "rgba(79,139,145,0.28)",
    "--pc-back-hover-bg": "rgba(79,139,145,0.14)",
    "--pc-back-hover-color": "#e6f5f2",
    "--pc-back-hover-border": "rgba(79,139,145,0.48)",
    "--pc-inner-border": "rgba(79,139,145,0.12)",
    "--pc-eyebrow": "rgba(129,197,202,0.72)",
    "--pc-title": "#eff9f8",
    "--pc-project-border": "rgba(129,197,202,0.16)",
    "--pc-project-hover": "rgba(129,197,202,0.34)",
    "--pc-project-year": "rgba(129,197,202,0.72)",
    "--pc-tag-color": "rgba(214,196,144,0.8)",
    "--pc-tag-border": "rgba(214,196,144,0.22)",
    "--pc-project-title": "#eff9f8",
    "--pc-project-role": "rgba(129,197,202,0.74)",
    "--pc-project-desc": "rgba(226,240,237,0.8)",
    "--pc-project-learned": "rgba(214,196,144,0.74)",
  };
  return (
    <div className="pc-wrap" style={palette} onScroll={(e) => { if (e.target.scrollTop > 40) setScrolled(true); }}>
      <button className="pc-back" onClick={onBack}>← voltar</button>
      <div className="pc-inner">
        <div className="pc-header">
          <div className="pc-eyebrow">Mariana Lameiro · Universidade de Lisboa</div>
          <h1 className="pc-title">Portfólio Científico</h1>
        </div>
        {PC_PROJECTS.map((p, i) => (
          <div className="pc-project" key={i}>
            <div className="pc-project-meta">
              <div className="pc-project-year">{p.year}</div>
              <span className="pc-project-tag">{p.tag}</span>
            </div>
            <div className="pc-project-body">
              <div className="pc-project-title">
                {p.title}
                {p.active && <span className="pc-project-active">em curso</span>}
              </div>
              <div className="pc-project-role">{p.role}</div>
              <div className="pc-project-desc">{p.desc}</div>
              <div className="pc-project-learned">{p.learned}</div>
            </div>
          </div>
        ))}
        <div className="world-bottom-nav">
          <button className="world-nav-btn" onClick={() => onGoWorld("caderno")}>← O Caderno</button>
          <button className="world-nav-btn next" onClick={() => onGoWorld("research")}>Research Interests →</button>
        </div>
      </div>
      {!scrolled && <div className="scroll-hint">↓</div>}
    </div>
  );
}


/* ── ResearchInterestsView ───────────────────────────────── */
const RI_AREAS = [
  {
    num: "01",
    title: "Neurociência Computacional",
    desc: "Como é que o cérebro computa? Redes neuronais biológicas modeladas com equações diferenciais, dinâmicas de populações de neurónios, e o que os modelos matemáticos revelam sobre percepção, memória e doença.",
    concepts: ["Modelos de Hodgkin-Huxley", "Redes de mean-field", "Oscilações neuronais", "Codificação esparsas", "Inferência Bayesiana"],
    question: "O que distingue um sistema que processa informação de um que a compreende?",
  },
  {
    num: "03",
    title: "PLN e Marcadores Linguísticos de Doença",
    desc: "Linguagem como janela para o cérebro. Análise computacional de padrões linguísticos em dados clínicos, com foco atual em Parkinson. Como a forma como falamos codifica o estado neurológico.",
    concepts: ["Modelos de linguagem", "Feature extraction", "Dados longitudinais", "Análise de discurso", "Biomarcadores digitais"],
    question: "O que muda primeiro na linguagem quando o cérebro muda?",
  },
];

function ResearchInterestsView({ onBack, onGoWorld }) {
  const [scrolled, setScrolled] = useState(false);
  const palette = {
    "--ri-bg": "linear-gradient(to bottom, #1a1116 0%, #27161d 100%)",
    "--ri-accent": "#92586d",
    "--ri-back-color": "rgba(245,229,233,0.82)",
    "--ri-back-bg": "rgba(255,255,255,0.05)",
    "--ri-back-border": "rgba(146,88,109,0.24)",
    "--ri-back-hover-bg": "rgba(146,88,109,0.14)",
    "--ri-back-hover-color": "#f6e8eb",
    "--ri-back-hover-border": "rgba(146,88,109,0.46)",
    "--ri-inner-border": "rgba(146,88,109,0.12)",
    "--ri-eyebrow": "rgba(212,164,178,0.72)",
    "--ri-title": "#f7e9ec",
    "--ri-subtitle": "rgba(240,217,223,0.66)",
    "--ri-area-border": "rgba(212,164,178,0.16)",
    "--ri-area-num": "rgba(212,164,178,0.44)",
    "--ri-area-title": "#f7e9ec",
    "--ri-area-desc": "rgba(240,217,223,0.78)",
    "--ri-concept-color": "rgba(224,192,138,0.8)",
    "--ri-concept-border": "rgba(224,192,138,0.22)",
    "--ri-question": "rgba(224,192,138,0.8)",
    "--ri-question-border": "rgba(224,192,138,0.24)",
  };
  return (
    <div className="ri-wrap" style={palette} onScroll={(e) => { if (e.target.scrollTop > 40) setScrolled(true); }}>
      <button className="ri-back" onClick={onBack}>← voltar</button>
      <div className="ri-inner">
        <div className="ri-header">
          <div className="ri-eyebrow">Interesses de Investigação</div>
          <h1 className="ri-title">Research Interests</h1>
          <p className="ri-subtitle">
            Áreas em que trabalho, leio, ou tenho perguntas que ainda não sei responder.
          </p>
        </div>
        {RI_AREAS.map((a) => (
          <div className="ri-area" key={a.num}>
            <div className="ri-area-header">
              <span className="ri-area-num">{a.num}</span>
              <h2 className="ri-area-title">{a.title}</h2>
            </div>
            <p className="ri-area-desc">{a.desc}</p>
            <div className="ri-concepts">
              {a.concepts.map(c => <span className="ri-concept" key={c}>{c}</span>)}
            </div>
            <p className="ri-question">{a.question}</p>
          </div>
        ))}
        <div className="world-bottom-nav">
          <button className="world-nav-btn" onClick={() => onGoWorld("portfolio-c")}>← Portfólio Científico</button>
          <button className="world-nav-btn next" onClick={() => onGoWorld("caderno")}>O Caderno →</button>
        </div>
      </div>
      {!scrolled && <div className="scroll-hint">↓</div>}
    </div>
  );
}


/* ── LinhaTempoView ─────────────────────────────────────── */
const LINHA_EVENTS = [
  { date: "Jan 2024", title: "Projeto Ulisses",    desc: "Solução interdisciplinar para cenário de derrame de plástico oceânico.", type: "personal" },
  { date: "Set 2024", title: "Licenciatura",       desc: "Estudos Gerais. Matemática, Física e Engenharia.",                      type: "academic" },
  { date: "Set 2024", title: "SET",                desc: "Relações externas. Negociações B2B com empresas.",                      type: "academic" },
  { date: "Out 2024", title: "Ink and All Things", desc: "Primeiro texto no Substack.",                                           type: "creative" },
  { date: "Mai 2025", title: "Diferencial",        desc: "Escrita científica e divulgação estudantil.",                           type: "creative" },
  { date: "Set 2025", title: "LASIGE",             desc: "LLMs e acelerometria. Progressão de Parkinson.",                        type: "academic" },
  { date: "Nov 2025", title: "IBEB",               desc: "Potenciais evocados. EEG e sinais bioelétricos.",                       type: "academic" },
  { date: "Fev 2026", title: "SENCY",              desc: "Bolsa de investigação. Transições energéticas em cozinhas industriais.", type: "academic" },
  { date: "Mar 2026", title: "Este site",          desc: "Uma tentativa de pôr em forma o que sou.",                              type: "creative" },
];

const TYPE_COLORS = { academic: "#5080c8", personal: "#c8a930", creative: "#c860a0" };

function LinhaTempoView({ onBack, onGoWorld }) {
  const events = [...LINHA_EVENTS].reverse();
  const [activeMuseumIdx, setActiveMuseumIdx] = useState(0);
  const activeEvent = events[activeMuseumIdx] ?? events[0];
  const palette = {
    "--linha-bg": "linear-gradient(135deg, #edf4f7 0%, #dfe9ee 32%, #d7e2e7 68%, #cad6dc 100%)",
    "--linha-wall-glow": "radial-gradient(circle at top, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0) 42%)",
    "--linha-wall-shade": "linear-gradient(to bottom, rgba(46,83,102,0.08), transparent 18%, transparent 82%, rgba(46,83,102,0.14))",
    "--linha-floor-glow": "linear-gradient(to bottom, rgba(55,89,109,0) 0%, rgba(55,89,109,0.08) 35%, rgba(55,89,109,0.18) 100%)",
    "--linha-floor-line": "rgba(63,101,122,0.18)",
    "--linha-floor-gap": "rgba(235,242,246,0.14)",
    "--linha-kicker": "rgba(53,90,108,0.7)",
    "--linha-title": "#18394d",
    "--linha-title-em": "#4c6f86",
    "--linha-back-bg": "rgba(255,255,255,0.36)",
    "--linha-back-border": "rgba(53,90,108,0.2)",
    "--linha-back-color": "rgba(30,59,78,0.82)",
    "--linha-back-hover-bg": "rgba(53,90,108,0.08)",
    "--linha-back-hover-color": "#18394d",
    "--linha-back-hover-border": "rgba(53,90,108,0.38)",
    "--linha-card-bg": "linear-gradient(145deg, rgba(255,255,255,0.82), rgba(224,235,241,0.96))",
    "--linha-card-shadow": "rgba(32,60,76,0.09)",
    "--linha-card-hover-shadow": "rgba(32,60,76,0.15)",
    "--linha-card-active-shadow": "rgba(32,60,76,0.18)",
    "--linha-card-thread": "rgba(70,110,132,0.65)",
    "--linha-card-title": "#173646",
    "--linha-card-text": "rgba(23,54,70,0.76)",
    "--linha-panel-bg": "rgba(244,248,250,0.82)",
    "--linha-panel-title": "#173646",
    "--linha-panel-text": "rgba(23,54,70,0.82)",
    "--linha-chip-bg": "rgba(76,111,134,0.1)",
    "--linha-chip-color": "rgba(23,54,70,0.78)",
    "--linha-stat-value": "#173646",
    "--linha-list-title": "#173646",
  };
  const typeLabels = {
    academic: "Investigacao",
    personal: "Vida",
    creative: "Criacao",
  };
  const layoutClasses = ["span-5", "span-7", "span-4", "span-6", "span-6", "span-5", "span-7"];
  const stats = [
    { value: events.length, label: "salas" },
    { value: new Set(events.map((event) => event.type)).size, label: "registos" },
    { value: activeEvent?.date, label: "abertura" },
  ];

  return (
    <div className="linha-wrap theme-museum" style={palette}>
      <button className="linha-back" onClick={onBack}>← voltar</button>
      <div className="lt-museum-shell">
        <div className="lt-museum-inner">
          <div className="lt-museum-topline">
            <div>
              <div className="lt-museum-kicker">arquivo biográfico em exposição permanente</div>
              <h1 className="lt-museum-title">Museu do Tempo</h1>
            </div>
          </div>

          <div className="lt-museum-grid">
            <div className="lt-museum-gallery">
              {events.map((event, index) => (
                <button
                  key={`${event.date}-${event.title}`}
                  className={`lt-museum-card ${layoutClasses[index % layoutClasses.length]}${activeMuseumIdx === index ? " active" : ""}`}
                  onClick={() => setActiveMuseumIdx(index)}
                >
                  <div className="lt-museum-card-header">
                    <div>
                      <div className="lt-museum-card-date">{event.date}</div>
                      <div className="lt-museum-card-title">{event.title}</div>
                    </div>
                    <div className="lt-museum-card-index">{String(index + 1).padStart(2, "0")}</div>
                  </div>
                  <div className="lt-museum-card-plaque">
                    <div className="lt-museum-card-type" style={{ color: TYPE_COLORS[event.type] }}>
                      {typeLabels[event.type]}
                    </div>
                    <div className="lt-museum-card-desc">{event.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <aside className="lt-museum-side">
              <div className="lt-museum-panel">
                <div className="lt-museum-panel-label">nota curatorial</div>
                <div className="lt-museum-panel-date">{activeEvent?.date}</div>
                <div className="lt-museum-panel-title">{activeEvent?.title}</div>
                <p className="lt-museum-panel-text">{activeEvent?.desc}</p>
                <div className="lt-museum-chip-row">
                  <span className="lt-museum-chip">
                    <span className="lt-museum-chip-dot" style={{ background: TYPE_COLORS[activeEvent?.type] }} />
                    {typeLabels[activeEvent?.type]}
                  </span>
                  <span className="lt-museum-chip">colecao viva</span>
                  <span className="lt-museum-chip">Lisboa, memoria, futuro</span>
                </div>
              </div>

              <div className="lt-museum-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="lt-museum-stat">
                    <div className="lt-museum-stat-value">{stat.value}</div>
                    <div className="lt-museum-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="lt-museum-list">
                {events.map((event, index) => (
                  <button
                    key={`list-${event.date}-${event.title}`}
                    className={`lt-museum-list-row${activeMuseumIdx === index ? " active" : ""}`}
                    onClick={() => setActiveMuseumIdx(index)}
                  >
                    <div className="lt-museum-list-date">{event.date}</div>
                    <div className="lt-museum-list-title">{event.title}</div>
                    <div className="lt-museum-list-dot" style={{ background: TYPE_COLORS[event.type] }} />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div style={{ position:'fixed', bottom:28, left:0, right:0, display:'flex', justifyContent:'space-between', padding:'0 40px', pointerEvents:'none' }}>
        <button className="world-nav-btn" style={{ pointerEvents:'all' }} onClick={() => onGoWorld("caderno")}>← O Caderno</button>
        <button className="world-nav-btn next" style={{ pointerEvents:'all' }} onClick={() => onGoWorld("portfolio-c")}>Portfólio Científico →</button>
      </div>
    </div>
  );
}


const TIME_MESSAGES = [
  "O tempo parou. A autarquia não se responsabiliza.",
  "Este momento dura para sempre. Ou talvez não. Ninguém sabe.",
  "Relógio avariado. Lisboa agradece a pausa.",
  "O universo decidiu respirar fundo. Aguarde.",
  "Tempo suspenso por excesso de saudade.",
];

/* ── App ────────────────────────────────────────────────── */
export default function App() {
  const [view, setView]               = useState("portfolio");
  const [isNight, setIsNight]         = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [lang, setLang]               = useState("pt");
  const [coverPhase, setCoverPhase]   = useState(null);
  const [visitedPanels, setVisitedPanels] = useState(new Set());
  const [isRaining, setIsRaining]     = useState(false);
  const [tramKey, setTramKey]         = useState(0);
  const [tramVisible, setTramVisible] = useState(false);
  const [tramFact, setTramFact]       = useState(null);
  const tramFactIdx                   = useRef(0);

  const [showOpening, setShowOpening] = useState(true);

  // New easter egg / world state
  const [fireflies, setFireflies]     = useState(false);
  const [timeFreeze, setTimeFreeze]   = useState(null);
  const [fogActive, setFogActive]     = useState(false);
  const [foundEggs, setFoundEggs]     = useState(new Set());
  const [eggToast, setEggToast]       = useState(null);
  const [showHints, setShowHints]     = useState(false);

  const EGGS = [
    { id: "fireflies", name: "pirilampos",      clue: "existe uma palavra que acende a cidade à noite" },
    { id: "freeze",    name: "tempo congelado", clue: "tenta mudar o tempo da cidade" },
    { id: "fog",       name: "névoa",           clue: "fica quieta... muito quieta" },
  ];

  const { playing, toggle: toggleJazz } = useJazz();

  const sceneRef        = useRef();
  const cloudsRef       = useRef();
  const progressDotRef  = useRef();
  const panRef          = useRef(0);
  const nightOverlayRef = useRef();

  const drag   = useRef({ active: false, startX: 0, startPan: 0, lastX: 0, lastT: 0, velX: 0 });
  const rafRef = useRef(null);

  const getMaxPan = useCallback(() => Math.min(0, window.innerWidth - SCENE_W), []);

  const updatePan = useCallback((val) => {
    const maxPan = getMaxPan();
    const clamped = Math.round(Math.max(maxPan, Math.min(0, val)));
    panRef.current = clamped;
    if (sceneRef.current)       sceneRef.current.style.transform  = `translateX(${clamped}px)`;
    if (cloudsRef.current)      cloudsRef.current.style.transform = `translateX(${Math.round(clamped * 0.3)}px)`;
    if (progressDotRef.current) {
      const progress = maxPan === 0 ? 0 : (-clamped) / Math.abs(maxPan);
      progressDotRef.current.style.left = `${progress * 100}%`;
    }
  }, [getMaxPan]);

  const stopInertia = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const startInertia = (vel) => {
    stopInertia();
    const tick = () => {
      vel *= 0.92;
      if (Math.abs(vel) < 0.4) return;
      updatePan(panRef.current + vel);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (view !== "street") return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      stopInertia();
      drag.current = { active: true, startX: e.clientX, startPan: panRef.current, lastX: e.clientX, lastT: Date.now(), velX: 0 };
    };
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      const now = Date.now(), dt = now - drag.current.lastT || 16;
      drag.current.velX = (e.clientX - drag.current.lastX) / dt * 16;
      drag.current.lastX = e.clientX;
      drag.current.lastT = now;
      updatePan(drag.current.startPan + (e.clientX - drag.current.startX));
    };
    const onMouseUp = (e) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      if (Math.abs(e.clientX - drag.current.startX) > 4) startInertia(drag.current.velX);
    };
    const onTouchStart = (e) => {
      stopInertia();
      const t = e.touches[0];
      drag.current = { active: true, startX: t.clientX, startPan: panRef.current, lastX: t.clientX, lastT: Date.now(), velX: 0 };
    };
    const onTouchMove = (e) => {
      if (!drag.current.active) return;
      e.preventDefault();
      const t = e.touches[0];
      const now = Date.now(), dt = now - drag.current.lastT || 16;
      drag.current.velX = (t.clientX - drag.current.lastX) / dt * 16;
      drag.current.lastX = t.clientX;
      drag.current.lastT = now;
      updatePan(drag.current.startPan + (t.clientX - drag.current.startX));
    };
    const onTouchEnd = () => {
      drag.current.active = false;
      startInertia(drag.current.velX);
    };

    window.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("mouseup",    onMouseUp);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("touchend",   onTouchEnd);
    return () => {
      window.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseup",    onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      stopInertia();
    };
  }, [view]);

  useEffect(() => {
    if (view !== "street") return;

    const syncPanToViewport = () => updatePan(panRef.current);
    syncPanToViewport();
    window.addEventListener("resize", syncPanToViewport);
    return () => window.removeEventListener("resize", syncPanToViewport);
  }, [view, updatePan]);

  // Tram scheduling
  useEffect(() => {
    if (view !== "street") return;
    let timer;
    const runTram = () => {
      setTramFact(null);
      setTramVisible(true);
      setTramKey(k => k + 1);
      timer = setTimeout(() => {
        setTramVisible(false);
        timer = setTimeout(runTram, 8000 + Math.random() * 10000);
      }, 43000);
    };
    timer = setTimeout(runTram, 3500);
    return () => clearTimeout(timer);
  }, [view]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setActivePanel(null);
      } else if (view === "street" && e.key === "ArrowRight") {
        updatePan(panRef.current - 220);
      } else if (view === "street" && e.key === "ArrowLeft") {
        updatePan(panRef.current + 220);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, updatePan]);

  // Easter egg discovery helper
  const discoverEgg = (id) => {
    setFoundEggs(prev => {
      if (prev.has(id)) return prev;
      const next = new Set([...prev, id]);
      setEggToast(id);
      setTimeout(() => setEggToast(null), 2200);
      return next;
    });
  };

  // Easter egg: "lisboa" keydown sequence → fireflies
  useEffect(() => {
    let buf = "";
    const onKey = (e) => {
      buf = (buf + e.key).slice(-6).toLowerCase();
      if (buf === "lisboa") {
        setFireflies(true);
        discoverEgg("fireflies");
        setTimeout(() => setFireflies(false), 4000);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Easter egg: 3 min inactivity fog (street view only)
  useEffect(() => {
    if (view !== "street") { setFogActive(false); return; }
    let timer = setTimeout(() => { setFogActive(true); discoverEgg("fog"); }, 3 * 60 * 1000);
    const reset = () => {
      setFogActive(false);
      clearTimeout(timer);
      timer = setTimeout(() => setFogActive(true), 3 * 60 * 1000);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("touchstart", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [view]);

  // Night sky gradient on city-wrap
  const nightSkyStyle = isNight
    ? { background: "linear-gradient(to bottom, #100818 0%, #1c0d2e 25%, #28143a 55%, #2a1832 100%)" }
    : {};

  const toggleNight = () => {
    setIsNight(n => !n);
    const msg = TIME_MESSAGES[Math.floor(Math.random() * TIME_MESSAGES.length)];
    setTimeFreeze(msg);
    discoverEgg("freeze");
    setTimeout(() => setTimeFreeze(null), 3500);
  };

  const goToStreet = (panelId) => {
    setCoverPhase("expand");
    setTimeout(() => {
      setView("street");
      if (panelId) setActivePanel(panelId);
      setCoverPhase("retract");
      setTimeout(() => setCoverPhase(null), 1100);
    }, 720);
  };

  const goToWorld = (worldId) => {
    if (worldId === "lgf") {
      // LiteratureGapFinder doesn't need the cover animation
      setView("lgf");
      return;
    }
    setCoverPhase("expand");
    setTimeout(() => {
      setView(worldId);
      setCoverPhase("retract");
      setTimeout(() => setCoverPhase(null), 1100);
    }, 720);
  };

  const goBack = () => {
    if (view === "lgf") {
      // LiteratureGapFinder back button switches directly
      setView("portfolio");
      return;
    }
    setCoverPhase("expand");
    setTimeout(() => {
      setView("portfolio"); setIsNight(false); setActivePanel(null);
      setCoverPhase("retract");
      setTimeout(() => setCoverPhase(null), 820);
    }, 580);
  };

  const openPanel = (id) => (e) => {
    e.stopPropagation();
    setActivePanel(id);
    setVisitedPanels(prev => new Set([...prev, id]));
  };

  // Generate firefly positions once per activation
  const fireflyDots = fireflies ? Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${20 + Math.random() * 70}%`,
    dur: `${3 + Math.random() * 1.5}s`,
    delay: `${Math.random() * 1.2}s`,
    dx: `${(Math.random() - 0.5) * 120}px`,
    dy: `${-(40 + Math.random() * 160)}px`,
  })) : [];

  return (
   <>
    <style>{css}</style>

    {showOpening && (
      <CadernoOpening onEnter={() => { setShowOpening(false); setView("street"); }} />
    )}

    {/* ── World views ── */}
    {view === "caderno"     && <CadernoView onBack={goBack} onGoWorld={goToWorld} />}
    {view === "timeline"    && <LinhaTempoView onBack={goBack} onGoWorld={goToWorld} />}
    {view === "portfolio-c" && <PortfolioCientificoView onBack={goBack} onGoWorld={goToWorld} />}
    {view === "research"    && <ResearchInterestsView onBack={goBack} onGoWorld={goToWorld} />}
    {view === "lgf"         && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 400, overflowY: 'auto', overflowX: 'hidden' }}>
        <LiteratureGapFinder />
        <button
          onClick={goBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 401,
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            color: '#5a4a2a',
            background: 'rgba(255, 250, 240, 0.9)',
            border: '1px solid rgba(200, 150, 80, 0.3)',
            borderRadius: '20px',
            padding: '8px 16px',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(230, 210, 170, 0.95)';
            e.target.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 250, 240, 0.9)';
            e.target.style.transform = 'none';
          }}
        >
          ← voltar
        </button>
      </div>
    )}

    {view === "portfolio" && (
      <PortfolioView
        onExplore={() => goToStreet(null)}
        onOpenPanel={(id) => goToStreet(id)}
        onGoWorld={goToWorld}
        lang={lang}
        onToggleLang={() => setLang(l => l === "en" ? "pt" : "en")}
      />
    )}

    {view === "street" && (
    <div className="city-wrap" style={nightSkyStyle}>
      <CustomCursor isNight={isNight} nightRef={nightOverlayRef} />

      {/* Stars + Moon (night only) */}
      {isNight && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2 }}>
          {STARS.map((s,i) => (
            <div key={i} style={{
              position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
              width:s.r*2, height:s.r*2, borderRadius:'50%',
              background:'white', opacity:s.o,
              boxShadow:`0 0 ${s.r*3}px rgba(255,255,255,0.7)`,
            }} />
          ))}
          <div style={{
            position:'absolute', right:'10%', top:'7%',
            width:56, height:56, borderRadius:'50%',
            background:'radial-gradient(circle at 38% 38%, #fffae8 0%, #f5d870 45%, #c8a030 100%)',
            boxShadow:'0 0 28px 10px rgba(255,220,80,0.35), 0 0 60px 24px rgba(255,200,50,0.18)',
            opacity:0.92,
          }} />
        </div>
      )}

      {/* Back button */}
      <button className="back-btn" onClick={goBack}>
        {T[lang].backBtn}
      </button>

      {/* Jazz music button */}
      <button className="jazz-btn" onClick={toggleJazz} title={playing ? "Pause jazz" : "Play jazz"}>
        {playing ? <span className="jazz-pause"><span/><span/></span> : "♪"}
      </button>


      {/* Clouds layer */}
      <div ref={cloudsRef} className="clouds-layer" style={{ width: SCENE_W }}>
        {CLOUDS.map((c, i) => (
          <CloudSvg key={i} x={c.x} y={c.y} w={c.w} h={c.h} seed={c.seed} />
        ))}
      </div>

      {/* Scene */}
      <div ref={sceneRef} className="city-scene">
        {/* Ground */}
        <div className="ground">
          <div className="sidewalk" />
        </div>

        {/* Tram overhead wire (fixed in scene) */}
        <div className="tram-wire" />

        {/* Tram track rails */}
        <svg style={{ position:'absolute', bottom:138, left:0, width:SCENE_W, height:18,
                      overflow:'visible', pointerEvents:'none', zIndex:2 }}
             viewBox={`0 0 ${SCENE_W} 18`}>
          <defs>
            <pattern id="tsleeper" x="0" y="0" width="40" height="18" patternUnits="userSpaceOnUse">
              <rect x="3" y="2" width="34" height="14" fill="#4a3820" rx="1.5" />
              <rect x="3" y="2" width="34" height="2.5" fill="rgba(255,255,255,0.07)" rx="1" />
            </pattern>
          </defs>
          {/* Sleepers (crossties) */}
          <rect x="0" y="0" width={SCENE_W} height="18" fill="url(#tsleeper)" />
          {/* Near rail (bottom) */}
          <rect x="0" y="12" width={SCENE_W} height="5" fill="#909090" rx="1" />
          <rect x="0" y="12" width={SCENE_W} height="1.5" fill="#c8c8c8" />
          {/* Far rail (top) */}
          <rect x="0" y="1" width={SCENE_W} height="4" fill="#808080" rx="1" />
          <rect x="0" y="1" width={SCENE_W} height="1.5" fill="#b8b8b8" />
        </svg>

        {/* Entry sign */}
        <div
          className="entry-sign"
          style={{ left: 40, width: 180, height: 340 }}
        >
          <div className="sign-roof" />
          <span className="sign-name">Mariana Brites Lameiro</span>
          <span className="sign-sub">
            Mathematics<br />
            Biology<br />
            Psychology<br />
            Writing
          </span>
          <span className="sign-coords">38°43'N 9°8'W · Lisboa</span>
        </div>

        {/* B1 — Universidade */}
        <UniversityBldg x={270} onOpen={openPanel("ch1")} isNight={isNight} glowing={visitedPanels.has("ch1")} />

        {/* B2 — Laboratório */}
        <LabBldg x={760} onOpen={openPanel("ch2")} isNight={isNight} glowing={visitedPanels.has("ch2")} />

        {/* B3 — Museu do Tempo */}
        <MuseumBldg x={1220} onOpen={() => goToWorld("timeline")} isNight={isNight} />

        {/* B4 — A Página */}
        <Bldg x={1820} w={360} h={400} wall="#e8c8a0" az={3} winCols={2} doorW={65} doorH={100} onOpen={openPanel("ch4")} isNight={isNight} glowing={visitedPanels.has("ch4")} />

        {/* B5 — Contacto */}
        <Bldg x={2260} w={380} h={480} wall="#c8dff0" az={2} winCols={3} doorW={65} doorH={100} onOpen={openPanel("connect")} isNight={isNight} glowing={visitedPanels.has("connect")} />

        {/* B6 — Epilogue (no door) */}
        <Bldg x={2730} w={240} h={360} wall="#f5f0e4" az={2} winCols={2} isNight={isNight} />

        {/* Tram */}
        {tramVisible && (
          <div key={tramKey} className="tram-wrap">
            <Tram
              fact={tramFact}
              onClick={() => {
                tramFactIdx.current = (tramFactIdx.current + 1) % BRAIN_FACTS.length;
                setTramFact(BRAIN_FACTS[tramFactIdx.current]);
              }}
            />
          </div>
        )}

        {/* Tram stop — between B3 and B4 */}
        <TramStop x={1570} isNight={isNight} onClick={() => { setTramVisible(true); setTramKey(k => k + 1); setTramFact(null); }} />

        {/* Lampposts — clicking toggles night + time freeze */}
        {[550, 1080, 1540, 1960, 2420].map((lx, i) => (
          <Lamppost key={lx} x={lx} h={180} isNight={isNight} delay={i * 0.7} onClick={toggleNight} />
        ))}
      </div>

      {/* Night overlay — after scene so it renders on top */}
      <div
        ref={nightOverlayRef}
        className={`night-overlay${isNight ? " on" : ""}`}
      />

      {/* Drag hint */}
      <div className="drag-hint">{T[lang].dragHint}</div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-dot" ref={progressDotRef} style={{ left: "0%" }} />
      </div>

      {/* Rain layer */}
      {isRaining && (
        <div className="rain-layer">
          {RAIN_DROPS.map((d, i) => (
            <div key={i} className="raindrop" style={{
              left: d.left, top: 0,
              height: d.h,
              opacity: d.op,
              animationDuration: d.dur,
              animationDelay: d.delay,
            }} />
          ))}
        </div>
      )}

      {/* Rain toggle */}
      <button
        className={`rain-btn${isRaining ? " active" : ""}`}
        onClick={() => setIsRaining(r => !r)}
        title={isRaining ? "Parar chuva" : "Chuva"}
      >
        {isRaining ? "🌧" : "🌂"}
      </button>

      {/* Content panel */}
      {activePanel && (
        <ContentPanel key={activePanel} id={activePanel} onClose={() => setActivePanel(null)} lang={lang} />
      )}

      {/* Fog layer (3 min inactivity) */}
      {fogActive && <div className="fog-layer" onClick={() => setFogActive(false)} style={{ pointerEvents: 'auto', cursor: 'default' }} />}
    </div>
    )}

    {/* ── Global overlays (render outside view so they always show) ── */}

    {/* Fireflies overlay */}
    {fireflies && (
      <div className="fireflies-overlay">
        {fireflyDots.map(f => (
          <div key={f.id} className="firefly" style={{
            left: f.left,
            top: f.top,
            animationDuration: f.dur,
            animationDelay: f.delay,
            '--dx': f.dx,
            '--dy': f.dy,
          }} />
        ))}
      </div>
    )}

    {/* Time freeze overlay */}
    {timeFreeze && (
      <div className="time-freeze-overlay">
        <p className="time-freeze-msg">{timeFreeze}</p>
      </div>
    )}

    {/* Easter egg counter */}
    <div className="egg-counter">
      {eggToast && <div className="egg-toast">✦ segredo descoberto</div>}
      {showHints && (
        <div className="egg-hints-panel">
          {EGGS.map(e => (
            <div key={e.id} className="egg-hint-row">
              <div className={`egg-hint-dot${foundEggs.has(e.id) ? " found" : ""}`} />
              {foundEggs.has(e.id)
                ? <span className="egg-hint-name">{e.name}</span>
                : <span className="egg-hint-clue">{e.clue}</span>
              }
            </div>
          ))}
        </div>
      )}
      <div className="egg-bar">
        <span className="egg-score">
          <span className="egg-n">{foundEggs.size}</span>/{EGGS.length} segredos
        </span>
        <div className="egg-dots">
          {EGGS.map(e => (
            <div key={e.id} className={`egg-dot${foundEggs.has(e.id) ? " found" : ""}`} />
          ))}
        </div>
        <button
          className={`egg-hint-btn${showHints ? " open" : ""}`}
          onClick={() => setShowHints(h => !h)}
          title="dicas"
        >?</button>
      </div>
    </div>

    {/* View transition cover — always at root level so it persists across view changes */}
    {coverPhase && <div className={`street-cover ${coverPhase}`} />}
   </>
  );
}
