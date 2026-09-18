<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>TrashLift — BF Homes Trash Pickup</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
<style>
  :root{
    --green-900:#16342B;
    --green-800:#1B3E32;
    --green-700:#234B3C;
    --paper:#F7F2E4;
    --paper-dim:#EDE6D3;
    --amber:#E9A23B;
    --amber-dark:#C97F1E;
    --clay:#C1542F;
    --teal:#2F6F63;
    --teal-dark:#245650;
    --ink:#1B1B16;
    --ink-soft:#4A4A3F;
    --cream:#F7F2E4;
    --line: rgba(247,242,228,0.16);
    --radius-card: 18px;
    --radius-chip: 999px;
    --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
    --font-body: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --mint:#C5E07A;
    --mint-deep:#B4D46A;
    --mint-ink:#1A1A16;
    --surface-bg: #FFFFFF;
    --surface-card: #FFFFFF;
    --text-primary: #111111;
    --text-secondary: #2C2C28;
    --card-border: rgba(17,17,17,0.10);
  }

  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background-color: var(--surface-bg);
    background-image: url("assets/trash-pattern.png");
    background-repeat: repeat;
    background-size: 240px auto;
    background-position: top center;
    color: var(--text-primary);
    font-family: var(--font-body);
    min-height:100vh;
    display:flex;
    justify-content:center;
    -webkit-font-smoothing:antialiased;
  }

  .shell{
    width:100%;
    max-width:440px;
    min-height:100vh;
    background-color: var(--surface-bg);
    background-image: url("assets/trash-pattern.png");
    background-repeat: repeat;
    background-size: 240px auto;
    background-position: top center;
    display:flex;
    flex-direction:column;
    position:relative;
    overflow-x:hidden;
  }

  /* On roomier screens (this is a phone-app prototype viewed on desktop),
     present it as a contained device frame rather than a stretched page. */
  @media (min-width:640px){
    body{ background: #E8EED9; padding:32px 16px; align-items:flex-start; }
    .shell{
      min-height:min(860px, calc(100vh - 64px));
      height:min(860px, calc(100vh - 64px));
      margin-top:0;
      border-radius:32px;
      box-shadow:0 30px 60px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(17,17,17,0.06);
      overflow:hidden;
    }
    main{ overflow-y:auto; }
  }

  header.topbar{
    padding:20px 20px 8px;
    display:block;
  }
  .wordmark{
    font-family:var(--font-body);
    font-size:clamp(28px, 8vw, 34px);
    font-weight:800;
    color: var(--mint-ink);
    line-height:1.05;
    letter-spacing:-0.03em;
    background: var(--mint);
    border-radius: 22px;
    padding: 16px 20px 14px;
    animation: brandIn .55s cubic-bezier(.2,1.1,.3,1);
  }
  .wordmark small{
    display:block;
    font-family:var(--font-body);
    font-size:13.5px;
    font-weight:600;
    color: var(--mint-ink);
    margin-top:4px;
    letter-spacing:0;
    opacity:0.85;
  }
  .brgy-pill{ display:none; }
  @keyframes brandIn{
    from{ opacity:0; transform:translateY(-10px) scale(.96); }
    to{ opacity:1; transform:none; }
  }

  main{
    flex:1;
    padding: 4px 20px 100px;
    overflow-y:auto;
  }

  .screen{ display:none; animation: fade-in .28s ease; }
  .screen.active{ display:block; }
  @keyframes fade-in{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;} }

  /* ---- Map ---- */
  .map-wrap{
    position:relative;
    border-radius: var(--radius-card);
    overflow:hidden;
    border:1px solid var(--card-border);
    background: var(--paper);
    aspect-ratio: 1 / 1.05;
  }
  #map{ width:100%; height:100%; background:var(--paper); }
  .leaflet-control-attribution{ font-size:9.5px !important; }
  .map-hint{
    position:absolute; left:12px; top:12px; z-index:500;
    background: rgba(27,27,22,0.72);
    color:#fff;
    font-size:11.5px;
    font-weight:600;
    padding:6px 10px;
    border-radius: var(--radius-chip);
    pointer-events:none;
  }
  .coord-badge{
    position:absolute; left:12px; bottom:12px; right:12px; z-index:500;
    background: rgba(27,27,22,0.82);
    color: var(--cream);
    font-size:12px;
    font-weight:600;
    padding:8px 12px;
    border-radius:12px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    pointer-events:none;
  }
  .coord-badge span.muted{ color: rgba(247,242,228,0.6); font-weight:500; }
  .trashlift-pin{ filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4)); }

  .locate-btn{
    margin-top:12px;
    width:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:13px 16px;
    border-radius:14px;
    border:1px solid var(--card-border);
    background: var(--surface-card);
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:14.5px;
    cursor:pointer;
    transition: transform .18s ease, box-shadow .18s ease;
    box-shadow: 4px 4px 8px rgba(26,26,22,0.08);
  }
  .locate-btn:hover{
    transform: translateY(-8px) scale(1.04);
    box-shadow: 12px 14px 20px rgba(26,26,22,0.18);
  }
  .locate-btn:active{ transform: scale(0.99); box-shadow: 2px 3px 6px rgba(26,26,22,0.10); }

  /* ---- Home menu (Canva: mint cards, black type) ---- */
  .home-hero{
    border-radius: 28px;
    background: var(--mint);
    border: none;
    padding:18px 20px 20px;
    margin-top:10px;
    color: var(--mint-ink);
    animation: popIn .5s cubic-bezier(.2,1.2,.3,1) .05s both;
  }
  .home-hero .eyebrow{
    font-size:14px;
    font-weight:600;
    color: var(--mint-ink);
    opacity:0.88;
  }
  .home-hero h2{
    font-family:var(--font-body);
    font-weight:800;
    font-size:26px;
    margin:4px 0 8px;
    line-height:1.12;
    letter-spacing:-0.03em;
    color: var(--mint-ink);
  }
  .home-hero p{
    font-size:13.5px;
    color: var(--mint-ink);
    line-height:1.45;
    margin:0;
    max-width:36ch;
    opacity:0.92;
  }

  .menu-list{
    display:flex;
    flex-direction:column;
    gap:12px;
    margin-top:16px;
    padding: 8px 6px 14px;
  }
  .menu-card{
    --accent: #1B7A3A;
    display:flex;
    align-items:center;
    gap:14px;
    width:100%;
    text-align:left;
    padding:12px 16px 12px 12px;
    border-radius: 28px;
    border: none;
    background: var(--mint);
    color: var(--mint-ink);
    cursor:pointer;
    font-family:var(--font-body);
    animation: popIn .5s cubic-bezier(.2,1.2,.3,1) both;
    transition: transform .18s ease, box-shadow .18s ease;
    box-shadow: 4px 5px 10px rgba(26,26,22,0.10);
    position:relative;
  }
  .menu-card:nth-child(1){ animation-delay:.12s; }
  .menu-card:nth-child(2){ animation-delay:.2s; }
  .menu-card:nth-child(3){ animation-delay:.28s; }
  .menu-card:hover{
    z-index:2;
    transform: translateY(-12px) scale(1.055);
    box-shadow: 14px 16px 24px rgba(26,26,22,0.22);
  }
  .menu-card:active{ transform: scale(0.97); box-shadow: 2px 3px 6px rgba(26,26,22,0.12); }
  .menu-card:focus-visible{ outline:2px solid var(--mint-ink); outline-offset:3px; }
  .menu-card .menu-icon{
    flex:none;
    width:58px;
    height:58px;
    border-radius:16px;
    display:flex;
    align-items:center;
    justify-content:center;
    background: #fff;
    color: #1B7A3A;
    box-shadow: 0 1px 0 rgba(17,17,17,0.06);
  }
  .menu-card .menu-icon svg{ width:30px; height:30px; }
  .menu-card .menu-text{ flex:1; min-width:0; }
  .menu-card .menu-title{
    display:block;
    font-weight:800;
    font-size:16.5px;
    color: var(--mint-ink);
    letter-spacing:-0.02em;
  }
  .menu-card .menu-sub{
    display:block;
    font-size:12px;
    font-weight:600;
    color: var(--mint-ink);
    opacity:0.78;
    margin-top:2px;
    line-height:1.35;
  }
  .menu-card .menu-chevron{ display:none; }

  @keyframes popIn{
    from{ opacity:0; transform:translateY(14px) scale(.97); }
    to{ opacity:1; transform:none; }
  }

  .home-footnote{
    --c404-a: #1A1A16;
    --c404-b: #3E8E6A;
    --c404-c: #1B7A3A;
    --c404-glow: #C5E07A;
    text-align:center;
    margin:28px 0 10px;
    cursor:pointer;
    user-select:none;
    animation: popIn .55s cubic-bezier(.2,1.2,.3,1) .4s both;
  }
  .home-footnote .fn-by{
    display:block;
    font-size:13px;
    font-weight:700;
    color: var(--c404-c);
    letter-spacing:0.04em;
    transition: color .25s ease;
  }
  .home-footnote .fn-404{
    display:inline-block;
    margin-top:2px;
    font-family:var(--font-body);
    font-size:28px;
    font-weight:800;
    letter-spacing:0.08em;
    color: var(--mint-ink);
    background: linear-gradient(90deg, var(--c404-a) 0%, var(--c404-b) 40%, var(--c404-c) 70%, var(--c404-a) 100%);
    background-size: 220% 100%;
    -webkit-background-clip:text;
    background-clip:text;
    -webkit-text-fill-color:transparent;
    animation: teamFloat 2.8s ease-in-out infinite, teamShine 3.6s linear infinite;
    filter: drop-shadow(0 2px 0 var(--c404-glow));
    transition: filter .25s ease;
  }
  .home-footnote.bounce .fn-404{ animation: teamBounce .55s cubic-bezier(.2,1.4,.3,1); }
  @keyframes teamFloat{
    0%,100%{ transform: translateY(0) rotate(-1deg); }
    50%{ transform: translateY(-6px) rotate(1.5deg); }
  }
  @keyframes teamShine{
    0%{ background-position: 0% 50%; }
    100%{ background-position: 220% 50%; }
  }
  @keyframes teamBounce{
    0%{ transform: scale(1); }
    35%{ transform: scale(1.18) rotate(-6deg); }
    65%{ transform: scale(0.94) rotate(4deg); }
    100%{ transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce){
    .wordmark, .home-hero, .menu-card, .home-footnote, .home-footnote .fn-404{
      animation:none;
    }
  }

  /* ---- Sections ---- */
  .section-label{
    font-size:12.5px;
    font-weight:700;
    color: var(--text-secondary);
    margin: 18px 0 10px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--card-border);
  }
  .chips{ display:flex; flex-wrap:wrap; gap:8px; }
  .chip{
    padding:10px 14px;
    border-radius: var(--radius-chip);
    border:1.5px solid var(--card-border);
    background: var(--surface-card);
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:600;
    font-size:13.5px;
    cursor:pointer;
    display:flex;
    align-items:center;
    gap:7px;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
    box-shadow: 3px 3px 7px rgba(26,26,22,0.07);
  }
  .chip:hover{
    transform: translateY(-7px) scale(1.08);
    box-shadow: 10px 12px 16px rgba(26,26,22,0.16);
  }
  .chip:active{ transform: scale(0.97); }
  .chip .dot{ width:8px; height:8px; border-radius:50%; flex:none; }
  .chip.selected{
    border-color: var(--amber);
    background: color-mix(in srgb, var(--amber) 16%, var(--surface-card));
  }

  textarea.note{
    width:100%;
    margin-top:14px;
    min-height:72px;
    resize:vertical;
    border-radius:14px;
    border:1.5px solid var(--card-border);
    background: var(--surface-card);
    color: var(--text-primary);
    font-family:var(--font-body);
    font-size:14px;
    padding:12px 14px;
    outline:none;
  }
  textarea.note:focus{ border-color: var(--amber); }
  textarea.note::placeholder{ color: var(--text-secondary); }

  .submit-btn{
    margin-top:18px;
    width:100%;
    padding:16px;
    border:none;
    border-radius:16px;
    background: var(--amber);
    color: var(--green-900);
    font-family:var(--font-body);
    font-weight:800;
    font-size:15.5px;
    cursor:pointer;
    letter-spacing:0.01em;
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
    box-shadow: 4px 5px 10px rgba(201,127,30,0.28);
  }
  .submit-btn:hover:not(:disabled){
    transform: translateY(-8px) scale(1.04);
    box-shadow: 12px 14px 22px rgba(201,127,30,0.42);
  }
  .submit-btn:active:not(:disabled){ transform: scale(0.99); box-shadow: 2px 3px 6px rgba(201,127,30,0.28); }
  .submit-btn:disabled{ opacity:0.45; cursor:not-allowed; box-shadow: none; }

  .status-msg{
    margin-top:10px;
    font-size:12.5px;
    color: var(--text-secondary);
    text-align:center;
    min-height:0;
  }
  .status-msg:not(:empty){
    background: var(--surface-card);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .status-msg.warn{ color: var(--clay); font-weight:700; }

  /* ---- Request cards (track / collector) ---- */
  .req-card{
    border:1px solid var(--card-border);
    background: var(--surface-card);
    border-radius: var(--radius-card);
    padding:16px;
    margin-bottom:12px;
  }
  .req-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .req-type{ display:flex; align-items:center; gap:8px; font-weight:700; font-size:14.5px; }
  .req-type .dot{ width:9px; height:9px; border-radius:50%; flex:none; }
  .req-time{ font-size:11.5px; color: var(--text-secondary); font-weight:600; white-space:nowrap; }
  .req-coord{ font-size:12px; color: var(--text-secondary); margin-top:5px; }
  .req-note{ font-size:13px; color: var(--text-primary); margin-top:8px; line-height:1.4; }

  .timeline{ display:flex; gap:6px; margin-top:14px; }
  .tl-step{ flex:1; }
  .tl-bar{ height:4px; border-radius:2px; background: var(--card-border); }
  .tl-bar.done{ background: var(--amber); }
  .tl-label{ font-size:10.5px; font-weight:700; color: var(--text-secondary); margin-top:6px; text-align:center; }
  .tl-label.done{ color: var(--text-primary); }

  .req-actions{ display:flex; gap:8px; margin-top:14px; }
  .req-actions button{
    flex:1;
    padding:11px;
    border-radius:12px;
    border:1.5px solid var(--card-border);
    background:transparent;
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:13px;
    cursor:pointer;
    transition: transform .18s ease, box-shadow .18s ease;
    box-shadow: 3px 3px 7px rgba(26,26,22,0.07);
  }
  .req-actions button:hover{
    transform: translateY(-7px) scale(1.05);
    box-shadow: 10px 12px 16px rgba(26,26,22,0.16);
  }
  .req-actions button:active{ transform: scale(0.97); }
  .sync-pill{
    display:inline-flex;
    align-items:center;
    gap:6px;
    font-size:11px;
    font-weight:700;
    color: var(--mint-ink);
    margin: 10px 0 0;
    padding: 6px 10px 6px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.5);
  }
  .sync-pill .dot{
    width:7px; height:7px; border-radius:50%;
    background:#888; flex:none;
  }
  .sync-pill.live .dot{
    background:#3E8E6A;
    box-shadow:0 0 0 0 rgba(62,142,106,0.55);
    animation: livePulse 1.6s ease-out infinite;
  }
  .sync-pill.offline .dot{ background: var(--clay); }
  .track-live-map{
    height:220px;
    border-radius:14px;
    margin-top:12px;
    overflow:hidden;
    border:1px solid var(--card-border);
    background: var(--paper);
    position:relative;
  }
  .track-live-map .leaflet-container{ width:100%; height:100%; }
  .route-eta-badge{
    position:absolute;
    left:10px;
    bottom:10px;
    z-index:500;
    background: rgba(22,52,43,0.92);
    color:#F7F2E4;
    border-radius:12px;
    padding:8px 12px;
    min-width:112px;
    box-shadow:0 6px 18px rgba(0,0,0,0.25);
    pointer-events:none;
  }
  .route-eta-badge .eta-time{
    font-family:var(--font-display);
    font-size:20px;
    font-weight:600;
    line-height:1.1;
  }
  .route-eta-badge .eta-dist{
    font-size:11px;
    font-weight:600;
    opacity:0.8;
    margin-top:2px;
  }
  .loc-meta{
    font-size:11.5px;
    color: var(--text-secondary);
    margin-top:8px;
    font-weight:600;
  }
  a.maps-ext-btn{
    flex:1;
    display:block;
    text-align:center;
    text-decoration:none;
    padding:11px;
    border-radius:12px;
    border:1.5px solid var(--card-border);
    background:transparent;
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:13px;
    transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
    box-shadow: 3px 3px 7px rgba(26,26,22,0.07);
  }
  a.maps-ext-btn:hover{
    transform: translateY(-7px) scale(1.05);
    box-shadow: 10px 12px 16px rgba(26,26,22,0.16);
  }
  a.maps-ext-btn:active{ opacity:0.85; transform: scale(0.98); }

  .req-photo{
    width:100%;
    max-height:180px;
    object-fit:cover;
    border-radius:12px;
    margin-top:12px;
    display:block;
    border:1px solid var(--card-border);
    background:#1B1B16;
  }
  .camera-card{
    margin-top:14px;
    border:1.5px dashed var(--card-border);
    border-radius:16px;
    padding:14px;
    background: var(--surface-card);
  }
  .camera-card.has-shot{ border-style:solid; border-color: var(--amber); }
  .camera-preview{
    width:100%;
    height:160px;
    object-fit:cover;
    border-radius:12px;
    display:none;
    background:#111;
  }
  .camera-preview.visible{ display:block; }
  .camera-hint{
    font-size:12.5px;
    color: var(--text-secondary);
    margin:0 0 10px;
    line-height:1.45;
  }
  .camera-actions{ display:flex; gap:8px; }
  .camera-actions button{
    flex:1;
    padding:12px;
    border-radius:12px;
    border:1.5px solid var(--card-border);
    background:transparent;
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:13px;
    cursor:pointer;
    transition: transform .18s ease, box-shadow .18s ease;
    box-shadow: 3px 3px 7px rgba(26,26,22,0.07);
  }
  .camera-actions button:hover{
    transform: translateY(-7px) scale(1.05);
    box-shadow: 10px 12px 16px rgba(26,26,22,0.16);
  }
  .camera-actions button:active{ transform: scale(0.97); }
  .camera-actions button.primary{
    background: var(--amber);
    border-color: var(--amber);
    color: var(--green-900);
  }

  .camera-overlay{
    display:none;
    position:fixed;
    inset:0;
    z-index:80;
    background:#0c1411;
    flex-direction:column;
  }
  .camera-overlay.open{ display:flex; }
  .camera-overlay video{
    flex:1;
    width:100%;
    object-fit:cover;
    background:#000;
  }
  .camera-overlay .cam-bar{
    display:flex;
    gap:10px;
    padding:14px 14px calc(16px + env(safe-area-inset-bottom));
    background:#16342B;
  }
  .camera-overlay .cam-bar button{
    flex:1;
    padding:14px;
    border:none;
    border-radius:14px;
    font-family:var(--font-body);
    font-weight:800;
    font-size:15px;
    cursor:pointer;
  }
  .camera-overlay .cam-cancel{
    background:transparent;
    color:#F7F2E4;
    border:1.5px solid rgba(247,242,228,0.25) !important;
  }
  .camera-overlay .cam-shot{
    background: var(--amber);
    color: var(--green-900);
  }

  .req-actions button.primary{
    background: var(--amber);
    border-color: var(--amber);
    color: var(--green-900);
  }

  /* Clear-history button (Pick Up / Track page) */
  .clear-history-btn{
    width:100%;
    margin:0 0 14px;
    padding:12px 14px;
    border-radius:12px;
    border:1px solid color-mix(in srgb, var(--clay) 35%, var(--card-border));
    background: var(--surface-card);
    color: var(--clay);
    font-family:var(--font-body);
    font-weight:700;
    font-size:13.5px;
    cursor:pointer;
  }
  .clear-history-btn:disabled{ opacity:0.5; cursor:not-allowed; }

  .empty-state{
    text-align:center;
    padding:32px 20px;
    color: var(--text-secondary);
    background: var(--surface-card);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-card);
  }
  .empty-state .glyph{ font-family:var(--font-display); font-size:32px; color: var(--amber); margin-bottom:8px; }
  .empty-state p{ font-size:13.5px; margin:6px 0 0; line-height:1.5; }

  /* ---- Bottom nav ---- */
  nav.tabbar{
    position:sticky;
    bottom:0;
    left:0; right:0;
    display:flex;
    background: var(--mint);
    border-top: none;
    padding: 10px 10px calc(12px + env(safe-area-inset-bottom));
    gap:4px;
  }
  nav.tabbar button{
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:4px;
    background:none;
    border:none;
    color: var(--mint-ink);
    font-family:var(--font-body);
    font-weight:800;
    font-size:11px;
    padding:6px 2px;
    border-radius:14px;
    cursor:pointer;
    transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
  }
  nav.tabbar button:hover{
    transform: translateY(-5px) scale(1.06);
    box-shadow: 8px 10px 14px rgba(26,26,22,0.16);
    background: rgba(255,255,255,0.28);
  }
  nav.tabbar button:active{ transform: scale(0.94); box-shadow: none; }
  nav.tabbar button.active{
    color: var(--mint-ink);
    background: rgba(255,255,255,0.45);
  }
  nav.tabbar svg{ width:22px; height:22px; }

  .screen-head{
    border-radius: 22px;
    background: var(--mint);
    padding: 16px 18px 14px;
    margin: 6px 0 14px;
  }
  h2.screen-title{
    font-family:var(--font-body);
    font-weight:800;
    font-size:22px;
    letter-spacing:-0.03em;
    margin: 0;
    color: var(--mint-ink);
  }
  p.screen-sub{
    font-size:13.5px;
    color: var(--mint-ink);
    margin:6px 0 0;
    line-height:1.45;
    opacity:0.88;
  }

  /* ---- Auth ---- */
  .auth-card{
    margin-top:8px;
    border-radius: var(--radius-card);
    background: var(--surface-card);
    border:1px solid var(--card-border);
    padding:20px 18px 22px;
  }
  .auth-tabs{
    display:flex;
    gap:6px;
    padding:4px;
    border-radius:12px;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    margin-bottom:18px;
  }
  .auth-tabs button{
    flex:1;
    border:none;
    background:transparent;
    color: var(--text-secondary);
    font-family:var(--font-body);
    font-weight:800;
    font-size:13.5px;
    padding:10px 8px;
    border-radius:10px;
    cursor:pointer;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease;
  }
  .auth-tabs button:hover{
    transform: translateY(-5px) scale(1.04);
    box-shadow: 8px 10px 14px rgba(26,26,22,0.14);
  }
  .auth-tabs button.active{
    background: var(--surface-card);
    color: var(--text-primary);
    box-shadow: 4px 4px 8px rgba(0,0,0,0.08);
  }
  .field{ margin-bottom:14px; }
  .field label{
    display:block;
    font-size:12.5px;
    font-weight:700;
    color: var(--text-secondary);
    margin-bottom:6px;
  }
  .field label .req{ color: var(--clay); }
  .field input{
    width:100%;
    padding:13px 14px;
    border-radius:12px;
    border:1.5px solid var(--card-border);
    background: var(--surface-card);
    color: var(--text-primary);
    font-family:var(--font-body);
    font-size:14.5px;
    font-weight:600;
    outline:none;
  }
  .field input:focus{ border-color: var(--amber); }
  .field input:disabled{
    opacity:0.72;
    cursor:not-allowed;
    background: color-mix(in srgb, var(--ink) 4%, var(--surface-card));
    color: var(--text-secondary);
  }
  .field input::placeholder{ color: var(--text-secondary); font-weight:500; }
  .auth-hint{
    font-size:12px;
    color: var(--text-secondary);
    margin: -4px 0 14px;
    line-height:1.4;
  }
  .auth-back{
    margin-top:12px;
    width:100%;
    padding:12px;
    border:none;
    background:none;
    color: var(--text-secondary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:13.5px;
    cursor:pointer;
  }

  /* ---- Schedule / truck live ---- */
  .info-card{
    border:1px solid var(--card-border);
    background: var(--surface-card);
    border-radius: var(--radius-card);
    padding:16px;
    margin-top:14px;
  }
  .info-card h3{
    margin:0 0 6px;
    font-size:15px;
    font-weight:800;
    letter-spacing:-0.01em;
  }
  .info-card p{
    margin:0;
    font-size:13px;
    color: var(--text-secondary);
    line-height:1.45;
  }
  .eta-row{
    display:flex;
    align-items:baseline;
    justify-content:space-between;
    gap:12px;
    margin-top:10px;
  }
  .eta-big{
    font-family:var(--font-display);
    font-size:28px;
    font-weight:600;
    color: var(--amber-dark);
    line-height:1;
  }
  :root:not([data-theme="light"]) .eta-big,
  :root[data-theme="dark"] .eta-big{ color: var(--amber); }
  @media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]) .eta-big{ color: var(--amber-dark); }
  }
  .eta-meta{ font-size:12.5px; font-weight:600; color: var(--text-secondary); text-align:right; }
  .sched-list{ margin-top:10px; display:flex; flex-direction:column; gap:8px; }
  .sched-row{
    display:flex;
    justify-content:space-between;
    gap:10px;
    padding:10px 12px;
    border-radius:12px;
    background: color-mix(in srgb, var(--ink) 4%, transparent);
    font-size:13px;
    font-weight:700;
  }
  .sched-row span:last-child{ color: var(--text-secondary); font-weight:600; }
  .live-dot{
    display:inline-block;
    width:8px; height:8px;
    border-radius:50%;
    background:#2E9B5A;
    margin-right:6px;
    box-shadow:0 0 0 3px rgba(46,155,90,0.25);
    vertical-align:middle;
  }
  #truckMap{ width:100%; height:100%; background:var(--paper); }

  /* ---- Account FAB (Foodpanda-style) ---- */
  .account-fab{
    position:absolute;
    right:16px;
    bottom: calc(72px + env(safe-area-inset-bottom));
    z-index:800;
    width:52px;
    height:52px;
    border-radius:50%;
    border:none;
    background: var(--mint);
    color: var(--mint-ink);
    font-family:var(--font-body);
    font-weight:800;
    font-size:14px;
    cursor:pointer;
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    display:none;
    align-items:center;
    justify-content:center;
    animation: teamFloat 3.2s ease-in-out infinite;
  }
  .account-fab.visible{ display:flex; }
  .account-fab:active{ transform: scale(0.96); }

  .account-sheet{
    position:absolute;
    left:0; right:0; bottom:0;
    z-index:900;
    background: var(--surface-card);
    border-radius: 22px 22px 0 0;
    border-top:1px solid var(--card-border);
    padding: 14px 20px calc(18px + env(safe-area-inset-bottom));
    box-shadow: 0 -12px 40px rgba(0,0,0,0.18);
    transform: translateY(110%);
    transition: transform .28s ease;
    pointer-events:none;
  }
  .account-sheet.open{
    transform: translateY(0);
    pointer-events:auto;
  }
  .account-backdrop{
    position:absolute;
    inset:0;
    z-index:850;
    background: rgba(22,52,43,0.45);
    opacity:0;
    pointer-events:none;
    transition: opacity .28s ease;
  }
  .account-backdrop.open{
    opacity:1;
    pointer-events:auto;
  }
  .account-handle{
    width:40px; height:4px;
    border-radius:2px;
    background: var(--card-border);
    margin:0 auto 14px;
  }
  .account-head{
    display:flex;
    align-items:center;
    gap:12px;
    margin-bottom:16px;
  }
  .account-avatar{
    width:48px; height:48px;
    border-radius:50%;
    background: var(--green-900);
    color: var(--cream);
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight:800;
    font-size:16px;
    flex:none;
  }
  .account-name{ font-weight:800; font-size:16px; margin:0; }
  .account-email{ font-size:12.5px; color: var(--text-secondary); margin:2px 0 0; font-weight:600; }
  .account-role{
    display:inline-block;
    margin-top:6px;
    font-size:11px;
    font-weight:800;
    padding:4px 8px;
    border-radius:999px;
    background: color-mix(in srgb, var(--amber) 18%, transparent);
    color: var(--amber-dark);
  }
  :root:not([data-theme="light"]) .account-role,
  :root[data-theme="dark"] .account-role{ color: var(--amber); }
  .account-actions{ display:flex; flex-direction:column; gap:8px; }
  .account-actions button{
    width:100%;
    text-align:left;
    padding:13px 14px;
    border-radius:12px;
    border:1px solid var(--card-border);
    background:transparent;
    color: var(--text-primary);
    font-family:var(--font-body);
    font-weight:700;
    font-size:14px;
    cursor:pointer;
  }
  .account-actions button.danger{
    color: var(--clay);
    border-color: color-mix(in srgb, var(--clay) 35%, var(--card-border));
  }

  ::-webkit-scrollbar{ width:0; height:0; }
</style>
</head>
<body>
<div class="shell">

  <header class="topbar">
    <div class="wordmark">TrashLift<small>For BF Homes</small></div>
    <div class="brgy-pill">📍 BF Homes, Parañaque</div>
  </header>

  <main>

    <!-- HOME / MAIN MENU -->
    <section class="screen active" id="screen-home">
      <div class="home-hero">
        <div class="eyebrow">BF Homes</div>
        <h2>Pick a service!</h2>
        <p>Log in to Collect or Pick up. Truck locations &amp; schedule are open to everyone — no account needed.</p>
      </div>

      <div class="menu-list">
        <button class="menu-card" id="roleWorkerBtn" data-auth-role="worker" style="--accent:var(--clay)">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h11A1.5 1.5 0 0 1 17 8.5V16H3V8.5z"/><path d="M17 10h2.4L22 13.2V16h-5v-6z"/><circle cx="6.5" cy="18.2" r="1.8"/><circle cx="17.5" cy="18.2" r="1.8"/><circle cx="9.5" cy="11.5" r="1.6" fill="#C5E07A"/></svg>
          </span>
          <span class="menu-text">
            <span class="menu-title">Collect</span>
            <span class="menu-sub">Barangay worker — opens Kolektor view after login</span>
          </span>
          <svg class="menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
        </button>

        <button class="menu-card" id="roleResidentBtn" data-auth-role="resident" style="--accent:var(--amber-dark)">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 3h4v2H4V6h4l1-3zm-3 7h12l-1.1 11.2A2 2 0 0 1 14.9 23H9.1a2 2 0 0 1-2-1.8L6 10zm5 3v7h2v-7h-2z"/></svg>
          </span>
          <span class="menu-text">
            <span class="menu-title">Pick Up</span>
            <span class="menu-sub">Resident — request a pickup, then track it</span>
          </span>
          <svg class="menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
        </button>

        <button class="menu-card" data-screen="screen-schedule" style="--accent:var(--teal)">
          <span class="menu-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.4 7.5 12.5 7.5 12.5s7.5-7.1 7.5-12.5A7.5 7.5 0 0 0 12 2zm0 10.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4z"/></svg>
          </span>
          <span class="menu-text">
            <span class="menu-title">Truck Location &amp; Schedule</span>
            <span class="menu-sub">Live truck, ETA, and pickup days — no login</span>
          </span>
          <svg class="menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
        </button>
      </div>

      <div class="home-footnote" id="team404" role="button" tabindex="0" title="Team 404">
        <span class="fn-by">Made by</span>
        <span class="fn-404">404</span>
      </div>
    </section>

    <!-- AUTH (login / sign up) — Collect & Pick up -->
    <section class="screen" id="screen-auth">
      <div class="screen-head">
        <h2 class="screen-title" id="authTitle">Log in</h2>
        <p class="screen-sub" id="authSub">Enter your name to continue. Email and password are locked for this prototype.</p>
      </div>

      <div class="auth-card">
        <div class="auth-tabs" role="tablist">
          <button type="button" class="active" id="authTabLogin" data-mode="login">Log in</button>
          <button type="button" id="authTabSignup" data-mode="signup">Sign up</button>
        </div>

        <form id="authForm" autocomplete="off">
          <div class="field">
            <label for="authName">Name <span class="req">*</span></label>
            <input type="text" id="authName" name="name" placeholder="e.g. Juan Dela Cruz" required autocomplete="name">
          </div>
          <div class="field">
            <label for="authEmail">Email</label>
            <input type="email" id="authEmail" name="email" placeholder="(Prototype: not required)" disabled tabindex="-1">
          </div>
          <div class="field">
            <label for="authPassword">Password</label>
            <input type="password" id="authPassword" name="password" placeholder="(Prototype: not required)" disabled tabindex="-1">
          </div>
          <p class="auth-hint" id="authModeHint">Prototype: only your name is needed to log in.</p>
          <button class="submit-btn" type="submit" id="authSubmitBtn">Continue</button>
        </form>
        <button type="button" class="auth-back" id="authBackBtn">← Back to Home</button>
      </div>
    </section>

    <!-- REQUEST SCREEN (residents after login) -->
    <section class="screen" id="screen-request">
      <div class="screen-head">
        <h2 class="screen-title">Where to pick up?</h2>
        <p class="screen-sub">Tap anywhere on the map, within BF Homes, to drop a pin — or use your current location.</p>
      </div>

      <div class="map-wrap">
        <span class="map-hint">Tap within BF Homes to drop a pin</span>
        <div id="map"></div>
        <div class="coord-badge" id="coordBadge">
          <span>No pin yet</span>
          <span class="muted" id="coordDetail"></span>
        </div>
      </div>

      <button class="locate-btn" id="locateBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg>
        Use my current location
      </button>

      <div class="section-label">What kind of trash?</div>
      <div class="chips" id="typeChips"></div>

      <div class="section-label">Live photo of the trash</div>
      <div class="camera-card" id="cameraCard">
        <p class="camera-hint" id="cameraHint">Take a live shot of basura</p>
        <img class="camera-preview" id="cameraPreview" alt="Captured trash">
        <div class="camera-actions">
          <button type="button" class="primary" id="openCameraBtn">Open camera</button>
          <button type="button" id="retakePhotoBtn" style="display:none;">Retake</button>
        </div>
      </div>

      <div class="section-label">Note for the collector (optional)</div>
      <textarea class="note" id="noteInput" placeholder="e.g. Sa tapat ng sari-sari store, malapit sa kanto…"></textarea>

      <button class="submit-btn" id="submitBtn" disabled>Request pickup</button>
      <div class="status-msg" id="submitStatus"></div>
    </section>

    <!-- TRACK SCREEN (residents — unlocked after first request) -->
    <section class="screen" id="screen-track">
      <div class="screen-head">
        <h2 class="screen-title">Mga kahilingan mo</h2>
        <p class="screen-sub">Follow your pickup requests from here to done.</p>
        <div class="sync-pill" id="syncPillTrack"><span class="dot"></span><span class="sync-label">Connecting…</span></div>
      </div>
      <button type="button" id="clearAllBtn" class="clear-history-btn">Clear all requests</button>
      <div id="trackList"></div>
    </section>

    <!-- TRUCK LOCATIONS & SCHEDULE (public) -->
    <section class="screen" id="screen-schedule">
      <div class="screen-head">
        <h2 class="screen-title">Truck &amp; schedule</h2>
        <p class="screen-sub">See the live truck, estimated arrival on your street, and regular pickup days — no request needed.</p>
      </div>

      <div class="map-wrap">
        <span class="map-hint"><span class="live-dot"></span>Live truck location</span>
        <div id="truckMap"></div>
        <div class="coord-badge" id="truckBadge">
          <span>Truck en route</span>
          <span class="muted" id="truckDetail">Updating…</span>
        </div>
      </div>

      <div class="info-card">
        <h3>Estimated arrival on your street</h3>
        <p>Based on the truck’s current route through BF Homes (prototype demo).</p>
        <div class="eta-row">
          <div class="eta-big" id="truckEta">~18 min</div>
          <div class="eta-meta" id="truckEtaMeta">Near Aguirre Ave.<br>Moving toward President’s Ave.</div>
        </div>
      </div>

      <div class="info-card">
        <h3>Regular pickup schedule</h3>
        <p>Scheduled collection days for Brgy. BF Homes.</p>
        <div class="sched-list">
          <div class="sched-row"><span>Mon · Wed · Fri</span><span>6:00 AM – 11:00 AM</span></div>
          <div class="sched-row"><span>Tue · Thu</span><span>1:00 PM – 5:00 PM</span></div>
          <div class="sched-row"><span>Saturday</span><span>7:00 AM – 12:00 NN</span></div>
          <div class="sched-row"><span>Sunday</span><span>No regular pickup</span></div>
        </div>
      </div>
    </section>

    <!-- COLLECTOR SCREEN (workers after login) -->
    <section class="screen" id="screen-collector">
      <div class="screen-head">
        <h2 class="screen-title">Kolektor view</h2>
      </div>
      <div id="collectorList"></div>
    </section>

  </main>

  <nav class="tabbar">
    <button class="tab-btn active" data-screen="screen-home">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"></path></svg>
      Home
    </button>
    <button class="tab-btn" data-screen="screen-schedule">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="7" width="15" height="10" rx="1.5"></rect><path d="M16 10h3.5L22 13.5V17h-6"></path><circle cx="6" cy="19" r="1.6"></circle><circle cx="17.5" cy="19" r="1.6"></circle></svg>
      Schedule
    </button>
    <button class="tab-btn" data-screen="screen-request" style="display:none;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>
      Request
    </button>
    <button class="tab-btn" data-screen="screen-track" style="display:none;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h6"></path></svg>
      Track
    </button>
    <button class="tab-btn" data-screen="screen-collector" style="display:none;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"></path><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path></svg>
      Kolektor
    </button>
  </nav>

  <button type="button" class="account-fab" id="accountFab" aria-label="Account" title="Account">?</button>
  <div class="account-backdrop" id="accountBackdrop"></div>
  <div class="account-sheet" id="accountSheet" aria-hidden="true">
    <div class="account-handle"></div>
    <div class="account-head">
      <div class="account-avatar" id="accountAvatar">?</div>
      <div>
        <p class="account-name" id="accountName">Guest</p>
        <p class="account-email" id="accountEmail">(Prototype: email not set)</p>
        <span class="account-role" id="accountRole">—</span>
      </div>
    </div>
    <div class="account-actions">
      <button type="button" id="accountSettingsBtn">Settings (coming soon)</button>
      <button type="button" class="danger" id="accountLogoutBtn">Log out</button>
    </div>
  </div>

</div>

  <div class="camera-overlay" id="cameraOverlay" aria-hidden="true">
    <video id="cameraVideo" autoplay playsinline muted></video>
    <canvas id="cameraCanvas" hidden></canvas>
    <div class="cam-bar">
      <button type="button" class="cam-cancel" id="cameraCancelBtn">Cancel</button>
      <button type="button" class="cam-shot" id="cameraShotBtn">Take photo</button>
    </div>
  </div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
(function(){
  "use strict";

  var audioCtx = null;
  function ensureAudio(){
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  }
  function playTap(kind){
    var ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = kind === "pop" ? "sine" : "triangle";
    var freq = kind === "pop" ? 560 : kind === "ok" ? 640 : 390;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 0.5), t + 0.08);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(kind === "pop" ? 0.06 : 0.038, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }
  document.addEventListener("pointerdown", function(e){
    var el = e.target.closest("button, .menu-card, .chip, a.maps-ext-btn, .home-footnote, .account-fab");
    if (!el || el.disabled) return;
    var kind = "tap";
    if (el.id === "team404" || el.classList.contains("home-footnote")) kind = "pop";
    else if (el.classList.contains("submit-btn") || (el.classList.contains("primary") && el.tagName === "BUTTON")) kind = "ok";
    playTap(kind);
  }, true);

  var USER_KEY = "trashlift-user-v1";
  var BRGY_NAME = "BF Homes";
  var SYNC_MS = 1500;

  var BF_HOMES_CENTER = [14.4517, 121.0249];
  var BF_HOMES_BOUNDS = L.latLngBounds(
    [14.4377, 121.0089],
    [14.4657, 121.0409]
  );

  // Prototype truck route waypoints (within BF Homes)
  var TRUCK_ROUTE = [
    [14.4485, 121.0185],
    [14.4498, 121.0210],
    [14.4512, 121.0235],
    [14.4528, 121.0258],
    [14.4540, 121.0280],
    [14.4525, 121.0305],
    [14.4505, 121.0320],
    [14.4488, 121.0295],
    [14.4475, 121.0265],
    [14.4480, 121.0225]
  ];

  var WASTE_TYPES = [
    { id:"general",  label:"General / Mixed",     color:"#8B8B7A" },
    { id:"recycle",  label:"Recyclables",         color:"#3E8E6A" },
    { id:"bulky",    label:"Bulky / Yard waste",  color:"#E9A23B" },
    { id:"hazard",   label:"Hazardous",           color:"#C1542F" }
  ];

  var state = {
    pin: null,
    selectedType: null,
    requests: [],
    locations: {},
    syncOk: false,
    syncTimer: null,
    map: null,
    marker: null,
    truckMap: null,
    truckMarker: null,
    truckTimer: null,
    truckIdx: 0,
    trackMaps: {},      // requestId -> map entry
    driverMaps: {},     // requestId -> map entry (Kolektor nav)
    geoWatchId: null,
    lastPostedLoc: null,
    trashPhoto: null,
    cameraStream: null,
    pendingRole: null,
    authMode: "login",
    user: null
  };

  // ---------- live sync API ----------
  function apiUrl(path){
    return path;
  }

  function setSyncUI(ok, detail){
    state.syncOk = ok;
    ["syncPillTrack", "syncPillCollector"].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("live", ok);
      el.classList.toggle("offline", !ok);
      var label = el.querySelector(".sync-label");
      if (label) label.textContent = ok ? (detail || "Live sync on") : (detail || "Offline — start server.js");
    });
  }

  function applyServerState(payload){
    if (!payload) return;
    var next = Array.isArray(payload.requests) ? payload.requests : [];
    var locs = payload.locations && typeof payload.locations === "object" ? payload.locations : {};
    var sameReqs = JSON.stringify(next) === JSON.stringify(state.requests);
    var sameLocs = JSON.stringify(locs) === JSON.stringify(state.locations);
    state.requests = next;
    state.locations = locs;
    if (!sameReqs){
      updateRoleUI();
      renderTrackList();
      renderCollectorList();
      syncWorkerGeolocation();
    } else if (!sameLocs){
      updateTrackMapMarkers();
      updateDriverMapMarkers();
    }
  }

  function pullState(){
    return fetch(apiUrl("/api/state"), { cache: "no-store" })
      .then(function(r){
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function(data){
        setSyncUI(true, "Live sync on");
        applyServerState(data);
        return data;
      })
      .catch(function(){
        setSyncUI(false, "Can't reach live server");
      });
  }

  function postRequest(req){
    return fetch(apiUrl("/api/requests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    }).then(function(r){
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function(data){
      setSyncUI(true);
      applyServerState(data);
      return data;
    });
  }

  function patchRequest(id, patch){
    return fetch(apiUrl("/api/requests/" + encodeURIComponent(id)), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).then(function(r){
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function(data){
      setSyncUI(true);
      applyServerState(data);
      return data;
    });
  }

  function postLocation(requestId, lat, lng){
    var name = state.user && state.user.name ? state.user.name : null;
    return fetch(apiUrl("/api/location"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: requestId, lat: lat, lng: lng, workerName: name })
    }).then(function(r){
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function(data){
      if (data.locations) state.locations = data.locations;
      return data;
    }).catch(function(){ /* ignore transient GPS post errors */ });
  }

  function uploadPhoto(id, dataUrl){
    return fetch(apiUrl("/api/photos"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, dataUrl: dataUrl })
    }).then(function(r){
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function(data){ return data.photoUrl; });
  }

  function clearAllRequests(){
    return fetch(apiUrl("/api/requests"), { method: "DELETE" })
      .then(function(r){
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function(data){
        setSyncUI(true);
        applyServerState(data);
        return data;
      });
  }

  function startSyncLoop(){
    if (state.syncTimer) clearInterval(state.syncTimer);
    pullState();
    state.syncTimer = setInterval(pullState, SYNC_MS);
  }

  function loadUser(){
    try{
      var raw = localStorage.getItem(USER_KEY);
      state.user = raw ? JSON.parse(raw) : null;
    }catch(e){ state.user = null; }
  }
  function saveUser(){
    try{
      if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      else localStorage.removeItem(USER_KEY);
    }catch(e){ /* storage unavailable */ }
  }

  function initials(name){
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function hasTrackAccess(){
    return !!(state.user && state.user.role === "resident" && state.requests.length > 0);
  }

  function updateRoleUI(){
    var homeTab = document.querySelector('.tab-btn[data-screen="screen-home"]');
    var reqTab = document.querySelector('.tab-btn[data-screen="screen-request"]');
    var trackTab = document.querySelector('.tab-btn[data-screen="screen-track"]');
    var kolTab = document.querySelector('.tab-btn[data-screen="screen-collector"]');
    var isResident = state.user && state.user.role === "resident";
    var isWorker = state.user && state.user.role === "worker";

    if (homeTab) homeTab.style.display = state.user ? "none" : "";
    if (reqTab) reqTab.style.display = isResident ? "" : "none";
    if (trackTab) trackTab.style.display = hasTrackAccess() ? "" : "none";
    if (kolTab) kolTab.style.display = isWorker ? "" : "none";

    updateAccountUI();
  }

  function updateAccountUI(){
    var fab = document.getElementById("accountFab");
    if (!state.user){
      fab.classList.remove("visible");
      closeAccountSheet();
      return;
    }
    fab.classList.add("visible");
    fab.textContent = initials(state.user.name);
    document.getElementById("accountAvatar").textContent = initials(state.user.name);
    document.getElementById("accountName").textContent = state.user.name;
    document.getElementById("accountEmail").textContent =
      state.user.email || "(Prototype: email not set)";
    document.getElementById("accountRole").textContent =
      state.user.role === "worker" ? "Barangay worker" : "Resident";
  }

  function openAccountSheet(){
    document.getElementById("accountSheet").classList.add("open");
    document.getElementById("accountSheet").setAttribute("aria-hidden", "false");
    document.getElementById("accountBackdrop").classList.add("open");
  }
  function closeAccountSheet(){
    document.getElementById("accountSheet").classList.remove("open");
    document.getElementById("accountSheet").setAttribute("aria-hidden", "true");
    document.getElementById("accountBackdrop").classList.remove("open");
  }

  function logout(){
    state.user = null;
    state.pendingRole = null;
    saveUser();
    closeAccountSheet();
    updateRoleUI();
    goToScreen("screen-home");
  }

  // ---------- auth ----------
  function openAuth(role){
    state.pendingRole = role;
    state.authMode = "login";
    document.getElementById("authName").value = "";
    setAuthMode("login");
    var title = document.getElementById("authTitle");
    var sub = document.getElementById("authSub");
    if (role === "worker"){
      title.textContent = "Collect — log in";
      sub.textContent = "Barangay workers unlock Kolektor view after logging in. Name only for this prototype.";
    } else {
      title.textContent = "Pick up — log in";
      sub.textContent = "Residents unlock Request after logging in, then Track after sending a request.";
    }
    goToScreen("screen-auth", true);
  }

  function setAuthMode(mode){
    state.authMode = mode;
    document.getElementById("authTabLogin").classList.toggle("active", mode === "login");
    document.getElementById("authTabSignup").classList.toggle("active", mode === "signup");
    document.getElementById("authSubmitBtn").textContent =
      mode === "signup" ? "Create account" : "Continue";
    document.getElementById("authModeHint").textContent =
      mode === "signup"
        ? "Prototype: sign up with your name only. Email & password stay locked."
        : "Prototype: only your name is needed to log in.";
  }

  function initAuth(){
    document.getElementById("authTabLogin").addEventListener("click", function(){ setAuthMode("login"); });
    document.getElementById("authTabSignup").addEventListener("click", function(){ setAuthMode("signup"); });
    document.getElementById("authBackBtn").addEventListener("click", function(){
      state.pendingRole = null;
      goToScreen("screen-home", true);
    });
    document.getElementById("authForm").addEventListener("submit", function(e){
      e.preventDefault();
      var name = document.getElementById("authName").value.trim();
      if (!name){
        document.getElementById("authName").focus();
        return;
      }
      var role = state.pendingRole || "resident";
      state.user = { name: name, email: "", role: role };
      state.pendingRole = null;
      saveUser();
      updateRoleUI();
      if (role === "worker") goToScreen("screen-collector");
      else goToScreen("screen-request");
    });
  }

  // ---------- maps ----------
  function pinDivIcon(color){
    var svg = '<svg viewBox="0 0 24 30" width="30" height="30" xmlns="http://www.w3.org/2000/svg" class="trashlift-pin">' +
      '<path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.3 12 30 12 30s12-9.7 12-18.3C24 5.2 18.6 0 12 0z" fill="'+color+'"/>' +
      '<circle cx="12" cy="11.5" r="4.6" fill="#F7F2E4"/></svg>';
    return L.divIcon({
      html: svg,
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 28]
    });
  }

  function truckDivIcon(){
    var svg = '<div style="width:40px;height:40px;border-radius:50%;background:#16342B;border:2px solid #E9A23B;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.35)">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F7F2E4" stroke-width="2"><rect x="1" y="7" width="15" height="10" rx="1.5"></rect><path d="M16 10h3.5L22 13.5V17h-6"></path><circle cx="6" cy="19" r="1.6"></circle><circle cx="17.5" cy="19" r="1.6"></circle></svg></div>';
    return L.divIcon({ html: svg, className: "", iconSize: [40, 40], iconAnchor: [20, 20] });
  }

  function initMap(){
    var map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
      maxBounds: BF_HOMES_BOUNDS.pad(0.15),
      maxBoundsViscosity: 1.0,
      minZoom: 14
    }).fitBounds(BF_HOMES_BOUNDS);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.rectangle(BF_HOMES_BOUNDS, {
      color: "#C1542F",
      weight: 1.5,
      fillOpacity: 0,
      dashArray: "4 6"
    }).addTo(map);

    map.on("click", function(e){
      if (!BF_HOMES_BOUNDS.contains(e.latlng)){
        showStatus("That spot is outside Barangay BF Homes. Please pin somewhere within the dashed boundary.", true);
        return;
      }
      placePin(e.latlng.lat, e.latlng.lng, "tap");
    });

    state.map = map;
  }

  function initTruckMap(){
    if (state.truckMap) return;
    var map = L.map("truckMap", {
      zoomControl: true,
      attributionControl: true,
      maxBounds: BF_HOMES_BOUNDS.pad(0.15),
      maxBoundsViscosity: 1.0,
      minZoom: 14
    }).fitBounds(BF_HOMES_BOUNDS);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.rectangle(BF_HOMES_BOUNDS, {
      color: "#2F6F63",
      weight: 1.5,
      fillOpacity: 0,
      dashArray: "4 6"
    }).addTo(map);

    L.polyline(TRUCK_ROUTE, {
      color: "#E9A23B",
      weight: 3,
      opacity: 0.75,
      dashArray: "8 10"
    }).addTo(map);

    state.truckMap = map;
    state.truckIdx = 0;
    var start = TRUCK_ROUTE[0];
    state.truckMarker = L.marker(start, { icon: truckDivIcon() }).addTo(map);
    updateTruckUI(start);
  }

  function startTruckSim(){
    stopTruckSim();
    state.truckTimer = setInterval(function(){
      if (!state.truckMap || !state.truckMarker) return;
      state.truckIdx = (state.truckIdx + 1) % TRUCK_ROUTE.length;
      var pt = TRUCK_ROUTE[state.truckIdx];
      state.truckMarker.setLatLng(pt);
      updateTruckUI(pt);
    }, 3500);
  }

  function stopTruckSim(){
    if (state.truckTimer){
      clearInterval(state.truckTimer);
      state.truckTimer = null;
    }
  }

  function updateTruckUI(pt){
    var etaMin = 8 + ((TRUCK_ROUTE.length - state.truckIdx) % TRUCK_ROUTE.length) * 2;
    document.getElementById("truckEta").textContent = "~" + etaMin + " min";
    document.getElementById("truckEtaMeta").innerHTML =
      "Near street segment " + (state.truckIdx + 1) + "/" + TRUCK_ROUTE.length +
      "<br>Moving along the scheduled BF Homes route";
    document.getElementById("truckDetail").textContent =
      pt[0].toFixed(5) + "°N, " + pt[1].toFixed(5) + "°E";
  }

  function placePin(lat, lng, source){
    state.pin = { lat:lat, lng:lng, source:source };
    if (state.marker) state.map.removeLayer(state.marker);
    state.marker = L.marker([lat, lng], { icon: pinDivIcon("#C1542F") }).addTo(state.map);
    document.getElementById("coordBadge").innerHTML =
      "<span>Pin dropped" + (source === "gps" ? " (your location)" : "") + "</span>" +
      "<span class=\"muted\">" + lat.toFixed(5) + "°N, " + lng.toFixed(5) + "°E</span>";
    updateSubmitState();
  }

  function showStatus(msg, warn){
    var el = document.getElementById("submitStatus");
    el.textContent = msg;
    el.className = "status-msg" + (warn ? " warn" : "");
  }

  function initLocateBtn(){
    var btn = document.getElementById("locateBtn");
    btn.addEventListener("click", function(){
      if (!("geolocation" in navigator)){
        showStatus("Geolocation isn't available on this device — tap the map instead.", true);
        return;
      }
      btn.disabled = true;
      showStatus("Getting your location…", false);
      navigator.geolocation.getCurrentPosition(
        function(pos){
          btn.disabled = false;
          var latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
          if (!BF_HOMES_BOUNDS.contains(latlng)){
            showStatus("Your current location looks like it's outside BF Homes. Tap the map to pin the exact spot instead.", true);
            return;
          }
          showStatus("", false);
          state.map.flyTo(latlng, 17);
          placePin(latlng.lat, latlng.lng, "gps");
        },
        function(err){
          btn.disabled = false;
          showStatus("Couldn't get your location (" + err.message + "). Tap the map instead.", true);
        },
        { enableHighAccuracy:true, timeout:8000 }
      );
    });
  }

  // ---------- waste type chips ----------
  function buildChips(){
    var wrap = document.getElementById("typeChips");
    wrap.innerHTML = "";
    WASTE_TYPES.forEach(function(t){
      var chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.dataset.id = t.id;
      chip.innerHTML = '<span class="dot" style="background:'+t.color+'"></span>' + t.label;
      chip.addEventListener("click", function(){
        state.selectedType = t.id;
        Array.prototype.forEach.call(wrap.children, function(c){ c.classList.remove("selected"); });
        chip.classList.add("selected");
        updateSubmitState();
      });
      wrap.appendChild(chip);
    });
  }

  function updateSubmitState(){
    document.getElementById("submitBtn").disabled = !(state.pin && state.selectedType && state.trashPhoto);
  }

  function stopCameraStream(){
    if (state.cameraStream){
      state.cameraStream.getTracks().forEach(function(t){ t.stop(); });
      state.cameraStream = null;
    }
    var video = document.getElementById("cameraVideo");
    if (video) video.srcObject = null;
  }

  function closeCameraOverlay(){
    stopCameraStream();
    var overlay = document.getElementById("cameraOverlay");
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function setCapturedPhoto(dataUrl){
    state.trashPhoto = dataUrl;
    var preview = document.getElementById("cameraPreview");
    preview.src = dataUrl;
    preview.classList.add("visible");
    document.getElementById("cameraCard").classList.add("has-shot");
    document.getElementById("cameraHint").textContent = "Live photo attached. Collectors will see this before they accept.";
    document.getElementById("retakePhotoBtn").style.display = "";
    document.getElementById("openCameraBtn").textContent = "Retake live photo";
    updateSubmitState();
  }

  function openLiveCamera(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      showStatus("This device has no live camera. Pickup requests need a live photo.", true);
      return;
    }
    var overlay = document.getElementById("cameraOverlay");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(function(stream){
      state.cameraStream = stream;
      var video = document.getElementById("cameraVideo");
      video.srcObject = stream;
      return video.play();
    }).catch(function(){
      closeCameraOverlay();
      showStatus("Allow camera access to take a live photo of the trash. Gallery / files are not allowed.", true);
    });
  }

  function captureLiveFrame(){
    var video = document.getElementById("cameraVideo");
    var canvas = document.getElementById("cameraCanvas");
    if (!video.videoWidth){
      showStatus("Camera is still starting — wait a second, then tap Take photo.", true);
      return;
    }
    var maxW = 960;
    var scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    closeCameraOverlay();
    setCapturedPhoto(dataUrl);
    showStatus("", false);
  }

  function initCamera(){
    document.getElementById("openCameraBtn").addEventListener("click", openLiveCamera);
    document.getElementById("retakePhotoBtn").addEventListener("click", openLiveCamera);
    document.getElementById("cameraCancelBtn").addEventListener("click", closeCameraOverlay);
    document.getElementById("cameraShotBtn").addEventListener("click", captureLiveFrame);
  }

  function trashPhotoMarkup(r){
    if (!r.photoUrl) return "";
    return '<img class="req-photo" src="' + escapeHtml(r.photoUrl) + '" alt="Live trash photo from resident">';
  }

  // ---------- submit ----------
  function initSubmit(){
    document.getElementById("submitBtn").addEventListener("click", function(){
      if (!state.trashPhoto){
        showStatus("Take a live camera photo of the trash first.", true);
        return;
      }
      var typeObj = WASTE_TYPES.filter(function(t){ return t.id === state.selectedType; })[0];
      var reqId = "r" + Date.now();
      var req = {
        id: reqId,
        typeId: typeObj.id,
        typeLabel: typeObj.label,
        typeColor: typeObj.color,
        lat: state.pin.lat,
        lng: state.pin.lng,
        note: document.getElementById("noteInput").value.trim(),
        status: "waiting",
        collector: null,
        createdAt: Date.now(),
        brgy: BRGY_NAME,
        residentName: state.user && state.user.name ? state.user.name : null,
        photoUrl: null
      };

      showStatus("Uploading live photo…", false);
      uploadPhoto(reqId, state.trashPhoto).then(function(photoUrl){
        req.photoUrl = photoUrl;
        showStatus("Sending request…", false);
        return postRequest(req);
      }).then(function(){
        showStatus("Request sent! Track is now unlocked — live on all devices.", false);
        document.getElementById("noteInput").value = "";
        state.pin = null;
        state.trashPhoto = null;
        if (state.marker){ state.map.removeLayer(state.marker); state.marker = null; }
        document.getElementById("coordBadge").innerHTML = "<span>No pin yet</span><span class=\"muted\"></span>";
        state.selectedType = null;
        Array.prototype.forEach.call(document.querySelectorAll("#typeChips .chip"), function(c){ c.classList.remove("selected"); });
        var preview = document.getElementById("cameraPreview");
        preview.removeAttribute("src");
        preview.classList.remove("visible");
        document.getElementById("cameraCard").classList.remove("has-shot");
        document.getElementById("cameraHint").textContent = "Take a live shot of basura";
        document.getElementById("retakePhotoBtn").style.display = "none";
        document.getElementById("openCameraBtn").textContent = "Open camera";
        updateSubmitState();
        setTimeout(function(){
          showStatus("", false);
          goToScreen("screen-track");
        }, 900);
      }).catch(function(){
        showStatus("Couldn't reach the live server. Keep server.js running, then try again.", true);
      });
    });
  }

  // ---------- timeline ----------
  var STEPS = [
    { key:"waiting",  label:"Requested" },
    { key:"accepted", label:"Accepted" },
    { key:"enroute",  label:"On the way" },
    { key:"done",     label:"Picked up" }
  ];
  function stepIndex(status){
    for (var i=0;i<STEPS.length;i++){ if (STEPS[i].key === status) return i; }
    return 0;
  }
  function timelineMarkup(status){
    var idx = stepIndex(status);
    return '<div class="timeline">' + STEPS.map(function(s, i){
      var done = i <= idx;
      return '<div class="tl-step"><div class="tl-bar' + (done?" done":"") + '"></div>' +
             '<div class="tl-label' + (done?" done":"") + '">' + s.label + '</div></div>';
    }).join("") + '</div>';
  }

  function timeAgo(ts){
    var diff = Math.max(0, Date.now() - ts);
    var m = Math.floor(diff/60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    var h = Math.floor(m/60);
    if (h < 24) return h + "h ago";
    return Math.floor(h/24) + "d ago";
  }

  function destroyTrackMaps(){
    Object.keys(state.trackMaps).forEach(function(id){
      try{ state.trackMaps[id].map.remove(); }catch(e){}
    });
    state.trackMaps = {};
  }

  function haversineMeters(aLat, aLng, bLat, bLng){
    var R = 6371000;
    var toRad = Math.PI / 180;
    var dLat = (bLat - aLat) * toRad;
    var dLng = (bLng - aLng) * toRad;
    var lat1 = aLat * toRad;
    var lat2 = bLat * toRad;
    var h = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function formatEta(seconds){
    var m = Math.max(1, Math.round(seconds / 60));
    if (m < 60) return "~" + m + " min";
    var h = Math.floor(m / 60);
    var rem = m % 60;
    return rem ? "~" + h + " h " + rem + " min" : "~" + h + " h";
  }

  function formatDistance(meters){
    if (meters < 1000) return Math.round(meters) + " m";
    return (meters / 1000).toFixed(meters < 10000 ? 1 : 0) + " km";
  }

  function setRouteEtaBadge(requestId, durationSec, distanceM, fallback){
    var badge = document.getElementById("route-eta-" + requestId) ||
      document.getElementById("driver-eta-" + requestId);
    if (!badge) return;
    badge.style.display = "";
    badge.querySelector(".eta-time").textContent = formatEta(durationSec);
    badge.querySelector(".eta-dist").textContent =
      formatDistance(distanceM) + (fallback ? " · straight estimate" : " via roads");
  }

  function drawRouteLine(entry, latlngs, dashed){
    if (entry.routeLine){
      try{ entry.map.removeLayer(entry.routeLine); }catch(e){}
      entry.routeLine = null;
    }
    entry.routeLine = L.polyline(latlngs, {
      color: "#E9A23B",
      weight: 5,
      opacity: 0.92,
      lineJoin: "round",
      lineCap: "round",
      dashArray: dashed ? "8 10" : null
    }).addTo(entry.map);
    try{
      entry.map.fitBounds(entry.routeLine.getBounds().pad(0.28));
    }catch(e){}
  }

  function fetchDrivingRoute(fromLat, fromLng, toLat, toLng){
    var url = "https://router.project-osrm.org/route/v1/driving/" +
      fromLng + "," + fromLat + ";" + toLng + "," + toLat +
      "?overview=full&geometries=geojson&steps=false";
    return fetch(url)
      .then(function(r){
        if (!r.ok) throw new Error("OSRM " + r.status);
        return r.json();
      })
      .then(function(data){
        if (!data || data.code !== "Ok" || !data.routes || !data.routes[0]){
          throw new Error("No route");
        }
        var route = data.routes[0];
        var coords = route.geometry.coordinates.map(function(c){
          return [c[1], c[0]];
        });
        return {
          latlngs: coords,
          duration: route.duration,
          distance: route.distance,
          fallback: false
        };
      });
  }

  function straightFallback(fromLat, fromLng, toLat, toLng){
    var meters = haversineMeters(fromLat, fromLng, toLat, toLng);
    // ~22 km/h average for barangay streets
    var seconds = (meters / 22000) * 3600;
    return {
      latlngs: [[fromLat, fromLng], [toLat, toLng]],
      duration: seconds,
      distance: meters,
      fallback: true
    };
  }

  function refreshTrackRoute(requestId, destLat, destLng, fromLat, fromLng, force){
    var entry = state.trackMaps[requestId];
    if (!entry) return;

    var key = fromLat.toFixed(4) + "," + fromLng.toFixed(4) + ">" + destLat.toFixed(4) + "," + destLng.toFixed(4);
    var now = Date.now();
    if (!force && entry.lastRouteKey === key) return;
    if (!force && entry.lastRouteFrom){
      var moved = haversineMeters(entry.lastRouteFrom.lat, entry.lastRouteFrom.lng, fromLat, fromLng);
      if (moved < 45 && entry.routeLine) return;
    }
    if (!force && entry.routeFetchAt && now - entry.routeFetchAt < 8000) return;

    entry.lastRouteKey = key;
    entry.routeFetchAt = now;
    entry.lastRouteFrom = { lat: fromLat, lng: fromLng };
    entry.routePending = true;

    var badge = document.getElementById("route-eta-" + requestId);
    if (badge && !entry.routeLine){
      badge.style.display = "";
      badge.querySelector(".eta-dist").textContent = "Calculating route…";
    }

    fetchDrivingRoute(fromLat, fromLng, destLat, destLng)
      .catch(function(){
        return straightFallback(fromLat, fromLng, destLat, destLng);
      })
      .then(function(result){
        if (!state.trackMaps[requestId]) return;
        entry = state.trackMaps[requestId];
        drawRouteLine(entry, result.latlngs, result.fallback);
        setRouteEtaBadge(requestId, result.duration, result.distance, result.fallback);
        entry.routePending = false;
        var meta = document.getElementById("loc-meta-" + requestId);
        if (meta){
          meta.textContent = "Collector en route · updated " + timeAgo((state.locations[requestId] || {}).updatedAt || Date.now());
        }
      });
  }

  function updateTrackMapMarkers(){
    Object.keys(state.trackMaps).forEach(function(id){
      var entry = state.trackMaps[id];
      var loc = state.locations[id];
      var req = state.requests.filter(function(r){ return r.id === id; })[0];
      if (!entry || !loc || !req) return;
      if (entry.worker){
        entry.worker.setLatLng([loc.lat, loc.lng]);
      } else {
        entry.worker = L.marker([loc.lat, loc.lng], { icon: truckDivIcon() }).addTo(entry.map);
      }
      refreshTrackRoute(id, req.lat, req.lng, loc.lat, loc.lng, false);
      var meta = document.getElementById("loc-meta-" + id);
      if (meta && !entry.routePending){
        meta.textContent = "Collector en route · updated " + timeAgo(loc.updatedAt);
      }
    });
  }

  function mountTrackMaps(){
    state.requests.forEach(function(r){
      if (r.status !== "accepted" && r.status !== "enroute") return;
      var el = document.getElementById("track-map-" + r.id);
      if (!el || state.trackMaps[r.id]) return;

      var map = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false
      }).setView([r.lat, r.lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      var pin = L.marker([r.lat, r.lng], { icon: pinDivIcon("#C1542F") }).addTo(map);
      var worker = null;
      var loc = state.locations[r.id];
      state.trackMaps[r.id] = {
        map: map,
        pin: pin,
        worker: worker,
        routeLine: null,
        lastRouteKey: null,
        lastRouteFrom: null,
        routeFetchAt: 0,
        routePending: false
      };
      if (loc){
        worker = L.marker([loc.lat, loc.lng], { icon: truckDivIcon() }).addTo(map);
        state.trackMaps[r.id].worker = worker;
        refreshTrackRoute(r.id, r.lat, r.lng, loc.lat, loc.lng, true);
      }
      setTimeout(function(){ map.invalidateSize(); }, 80);
    });
  }

  function destroyDriverMaps(){
    Object.keys(state.driverMaps).forEach(function(id){
      try{ state.driverMaps[id].map.remove(); }catch(e){}
    });
    state.driverMaps = {};
  }

  function refreshDriverRoute(requestId, destLat, destLng, fromLat, fromLng, force){
    var entry = state.driverMaps[requestId];
    if (!entry) return;

    var key = fromLat.toFixed(4) + "," + fromLng.toFixed(4) + ">" + destLat.toFixed(4) + "," + destLng.toFixed(4);
    var now = Date.now();
    if (!force && entry.lastRouteKey === key) return;
    if (!force && entry.lastRouteFrom){
      var moved = haversineMeters(entry.lastRouteFrom.lat, entry.lastRouteFrom.lng, fromLat, fromLng);
      if (moved < 45 && entry.routeLine) return;
    }
    if (!force && entry.routeFetchAt && now - entry.routeFetchAt < 8000) return;

    entry.lastRouteKey = key;
    entry.routeFetchAt = now;
    entry.lastRouteFrom = { lat: fromLat, lng: fromLng };
    entry.routePending = true;

    var badge = document.getElementById("driver-eta-" + requestId);
    if (badge && !entry.routeLine){
      badge.style.display = "";
      badge.querySelector(".eta-dist").textContent = "Calculating route…";
    }

    fetchDrivingRoute(fromLat, fromLng, destLat, destLng)
      .catch(function(){
        return straightFallback(fromLat, fromLng, destLat, destLng);
      })
      .then(function(result){
        if (!state.driverMaps[requestId]) return;
        entry = state.driverMaps[requestId];
        drawRouteLine(entry, result.latlngs, result.fallback);
        var badgeEl = document.getElementById("driver-eta-" + requestId);
        if (badgeEl){
          badgeEl.style.display = "";
          badgeEl.querySelector(".eta-time").textContent = formatEta(result.duration);
          badgeEl.querySelector(".eta-dist").textContent =
            formatDistance(result.distance) + (result.fallback ? " · straight estimate" : " via roads");
        }
        entry.routePending = false;
        var meta = document.getElementById("driver-meta-" + requestId);
        if (meta){
          meta.textContent = "Navigate to pickup · updated " + timeAgo((state.locations[requestId] || {}).updatedAt || Date.now());
        }
      });
  }

  function updateDriverMapMarkers(){
    Object.keys(state.driverMaps).forEach(function(id){
      var entry = state.driverMaps[id];
      var loc = state.locations[id];
      var req = state.requests.filter(function(r){ return r.id === id; })[0];
      if (!entry || !req) return;
      var from = loc || state.lastPostedLoc;
      if (!from) return;
      if (entry.worker){
        entry.worker.setLatLng([from.lat, from.lng]);
      } else {
        entry.worker = L.marker([from.lat, from.lng], { icon: truckDivIcon() }).addTo(entry.map);
      }
      if (req.status === "accepted" || req.status === "enroute"){
        refreshDriverRoute(id, req.lat, req.lng, from.lat, from.lng, false);
      }
    });
  }

  function mountDriverMaps(){
    state.requests.forEach(function(r){
      if (r.status === "done") return;
      var el = document.getElementById("driver-map-" + r.id);
      if (!el || state.driverMaps[r.id]) return;

      var map = L.map(el, {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false
      }).setView([r.lat, r.lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      var pin = L.marker([r.lat, r.lng], { icon: pinDivIcon("#C1542F") }).addTo(map);
      state.driverMaps[r.id] = {
        map: map,
        pin: pin,
        worker: null,
        routeLine: null,
        lastRouteKey: null,
        lastRouteFrom: null,
        routeFetchAt: 0,
        routePending: false
      };

      var loc = state.locations[r.id];
      var from = loc || state.lastPostedLoc;
      if (from && (r.status === "accepted" || r.status === "enroute")){
        state.driverMaps[r.id].worker = L.marker([from.lat, from.lng], { icon: truckDivIcon() }).addTo(map);
        refreshDriverRoute(r.id, r.lat, r.lng, from.lat, from.lng, true);
      }
      setTimeout(function(){ map.invalidateSize(); }, 80);
    });
  }

  function activeWorkerJobIds(){
    if (!state.user || state.user.role !== "worker") return [];
    var name = state.user.name;
    return state.requests.filter(function(r){
      return (r.status === "accepted" || r.status === "enroute") &&
        r.collector && (r.collector === name || r.collector.indexOf(name) === 0 || r.collector === "Ikaw (You)");
    }).map(function(r){ return r.id; });
  }

  function stopWorkerGeolocation(){
    if (state.geoWatchId != null && navigator.geolocation){
      navigator.geolocation.clearWatch(state.geoWatchId);
      state.geoWatchId = null;
    }
  }

  function syncWorkerGeolocation(){
    var ids = activeWorkerJobIds();
    if (!ids.length){
      stopWorkerGeolocation();
      return;
    }
    if (state.geoWatchId != null) return;
    if (!("geolocation" in navigator)) return;

    state.geoWatchId = navigator.geolocation.watchPosition(
      function(pos){
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var last = state.lastPostedLoc;
        if (last && Math.abs(last.lat - lat) < 0.00005 && Math.abs(last.lng - lng) < 0.00005 &&
            Date.now() - last.at < 4000){
          return;
        }
        state.lastPostedLoc = { lat: lat, lng: lng, at: Date.now() };
        ids = activeWorkerJobIds();
        ids.forEach(function(id){
          var req = state.requests.filter(function(r){ return r.id === id; })[0];
          var entry = state.driverMaps[id];
          if (entry && req){
            if (entry.worker){
              entry.worker.setLatLng([lat, lng]);
            } else {
              entry.worker = L.marker([lat, lng], { icon: truckDivIcon() }).addTo(entry.map);
            }
            refreshDriverRoute(id, req.lat, req.lng, lat, lng, false);
          }
          postLocation(id, lat, lng);
        });
      },
      function(){ /* permission denied / timeout */ },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 }
    );
  }

  function renderTrackList(){
    var wrap = document.getElementById("trackList");
    destroyTrackMaps();
    if (!state.requests.length){
      wrap.innerHTML = '<div class="empty-state"><div class="glyph">—</div><p>No requests yet.<br>Drop a pin under "Request" to get started.</p></div>';
      return;
    }
    wrap.innerHTML = state.requests.map(function(r){
      var loc = state.locations[r.id];
      var showMap = r.status === "accepted" || r.status === "enroute";
      var locHtml = "";
      if (showMap){
        locHtml =
          '<div class="track-live-map" id="track-map-' + r.id + '">' +
            '<div class="route-eta-badge" id="route-eta-' + r.id + '" style="display:none">' +
              '<div class="eta-time">—</div>' +
              '<div class="eta-dist">Calculating route…</div>' +
            '</div>' +
          '</div>' +
          '<div class="loc-meta" id="loc-meta-' + r.id + '">' +
            (loc
              ? "Collector en route · road path + ETA updating live"
              : "Waiting for collector GPS… Allow location on the worker phone.") +
          "</div>";
      }
      return '<div class="req-card">' +
        '<div class="req-top">' +
          '<div class="req-type"><span class="dot" style="background:'+r.typeColor+'"></span>' + r.typeLabel + '</div>' +
          '<div class="req-time">' + timeAgo(r.createdAt) + '</div>' +
        '</div>' +
        '<div class="req-coord">' + r.lat.toFixed(5) + '°N, ' + r.lng.toFixed(5) + '°E · Brgy. ' + escapeHtml(r.brgy) + '</div>' +
        (r.note ? '<div class="req-note">' + escapeHtml(r.note) + '</div>' : '') +
        trashPhotoMarkup(r) +
        timelineMarkup(r.status) +
        (r.collector ? '<div class="req-note" style="margin-top:10px;">Collector: <strong>' + escapeHtml(r.collector) + '</strong></div>' : '') +
        locHtml +
      '</div>';
    }).join("");
    mountTrackMaps();
  }

  function renderCollectorList(){
    var wrap = document.getElementById("collectorList");
    destroyDriverMaps();
    var relevant = state.requests.filter(function(r){ return r.status !== "done"; });
    if (!relevant.length){
      wrap.innerHTML = '<div class="empty-state"><div class="glyph">✓</div><p>No pending pickups right now.</p></div>';
      return;
    }
    wrap.innerHTML = "";
    relevant.forEach(function(r){
      var card = document.createElement("div");
      card.className = "req-card";
      var actionsHtml = "";
      if (r.status === "waiting"){
        actionsHtml = '<div class="req-actions"><button class="primary" data-action="accept" data-id="'+r.id+'">Accept pickup</button></div>';
      } else if (r.status === "accepted"){
        actionsHtml = '<div class="req-actions"><button data-action="enroute" data-id="'+r.id+'">Start heading over</button></div>';
      } else if (r.status === "enroute"){
        actionsHtml = '<div class="req-actions"><button class="primary" data-action="done" data-id="'+r.id+'">Mark picked up</button></div>';
      }
      var who = r.residentName ? '<div class="req-note" style="margin-top:8px;">From: <strong>' + escapeHtml(r.residentName) + '</strong></div>' : '';
      var mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(r.lat + "," + r.lng);
      var loc = state.locations[r.id];
      var showRoute = r.status === "accepted" || r.status === "enroute";
      var mapHtml =
        '<div class="track-live-map" id="driver-map-' + r.id + '">' +
          '<div class="route-eta-badge" id="driver-eta-' + r.id + '" style="display:' + (showRoute ? "none" : "none") + '">' +
            '<div class="eta-time">—</div>' +
            '<div class="eta-dist">Calculating route…</div>' +
          '</div>' +
        '</div>' +
        '<div class="loc-meta" id="driver-meta-' + r.id + '">' +
          (showRoute
            ? (loc || state.lastPostedLoc
                ? "Your nav map · path to resident pin"
                : "Allow location to draw your route to the pin.")
            : "Pickup location · accept the job to navigate here") +
        '</div>' +
        '<div class="req-actions" style="margin-top:10px">' +
          '<a class="maps-ext-btn" href="' + mapsUrl + '" target="_blank" rel="noopener">Open in Google Maps</a>' +
        '</div>';

      card.innerHTML =
        '<div class="req-top">' +
          '<div class="req-type"><span class="dot" style="background:'+r.typeColor+'"></span>' + r.typeLabel + '</div>' +
          '<div class="req-time">' + timeAgo(r.createdAt) + '</div>' +
        '</div>' +
        '<div class="req-coord">' + r.lat.toFixed(5) + '°N, ' + r.lng.toFixed(5) + '°E · Brgy. ' + escapeHtml(r.brgy) + '</div>' +
        (r.note ? '<div class="req-note">' + escapeHtml(r.note) + '</div>' : '') +
        trashPhotoMarkup(r) +
        who +
        timelineMarkup(r.status) +
        mapHtml +
        actionsHtml;
      wrap.appendChild(card);
    });
    mountDriverMaps();
    wrap.querySelectorAll("button[data-action]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.dataset.id, action = btn.dataset.action;
        var req = state.requests.filter(function(r){ return r.id === id; })[0];
        if (!req) return;
        var patch = {};
        if (action === "accept"){
          patch.status = "accepted";
          patch.collector = (state.user && state.user.name) ? state.user.name : "Collector";
        } else if (action === "enroute"){
          patch.status = "enroute";
        } else if (action === "done"){
          patch.status = "done";
        }
        btn.disabled = true;
        patchRequest(id, patch).then(function(){
          syncWorkerGeolocation();
        }).catch(function(){
          btn.disabled = false;
          setSyncUI(false, "Update failed — check server");
        });
      });
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c];
    });
  }

  // Guest: Home + Schedule
  // Auth: only while logging in
  // After login: Home is locked until logout
  // Request / Track: resident   |  Kolektor: worker
  function roleHomeScreen(){
    if (state.user && state.user.role === "worker") return "screen-collector";
    if (state.user && state.user.role === "resident") return "screen-request";
    return "screen-home";
  }

  function canAccess(screenId){
    if (screenId === "screen-home") return !state.user;
    if (screenId === "screen-schedule") return true;
    if (screenId === "screen-auth") return !state.user || !!state.pendingRole;
    if (screenId === "screen-request") return !!(state.user && state.user.role === "resident");
    if (screenId === "screen-track") return hasTrackAccess();
    if (screenId === "screen-collector") return !!(state.user && state.user.role === "worker");
    return false;
  }

  function goToScreen(screenId, allowAuth){
    if (screenId === "screen-auth" && !allowAuth && !state.pendingRole){
      screenId = roleHomeScreen();
    }
    if (!canAccess(screenId)){
      if (!state.user && (screenId === "screen-request" || screenId === "screen-collector")){
        openAuth(screenId === "screen-collector" ? "worker" : "resident");
        return;
      }
      screenId = roleHomeScreen();
    }

    document.querySelectorAll(".tab-btn").forEach(function(b){
      b.classList.toggle("active", b.dataset.screen === screenId);
    });
    document.querySelectorAll(".screen").forEach(function(s){
      s.classList.toggle("active", s.id === screenId);
    });

    if (screenId === "screen-track") renderTrackList();
    if (screenId === "screen-collector") renderCollectorList();
    if (screenId === "screen-request" && state.map) setTimeout(function(){ state.map.invalidateSize(); }, 50);
    if (screenId === "screen-schedule"){
      initTruckMap();
      startTruckSim();
      setTimeout(function(){ if (state.truckMap) state.truckMap.invalidateSize(); }, 50);
    } else {
      stopTruckSim();
    }
    closeAccountSheet();
    window.scrollTo(0, 0);
  }

  function initTabs(){
    document.querySelectorAll(".tab-btn").forEach(function(btn){
      btn.addEventListener("click", function(){ goToScreen(btn.dataset.screen); });
    });
    document.querySelectorAll(".menu-card[data-screen]").forEach(function(card){
      card.addEventListener("click", function(){ goToScreen(card.dataset.screen); });
    });
    document.querySelectorAll(".menu-card[data-auth-role]").forEach(function(card){
      card.addEventListener("click", function(){
        var role = card.dataset.authRole;
        if (state.user && state.user.role === role){
          goToScreen(role === "worker" ? "screen-collector" : "screen-request");
          return;
        }
        // Switching role or first login — go through auth
        openAuth(role);
      });
    });

    document.getElementById("accountFab").addEventListener("click", openAccountSheet);
    document.getElementById("accountBackdrop").addEventListener("click", closeAccountSheet);
    document.getElementById("accountLogoutBtn").addEventListener("click", logout);
    document.getElementById("accountSettingsBtn").addEventListener("click", function(){
      alert("Settings will be available in a future version.");
    });

    // Clear-all lives on the Pick Up (Track) page
    var clearAllBtn = document.getElementById("clearAllBtn");
    if (clearAllBtn){
      clearAllBtn.addEventListener("click", function(){
        if (!confirm("Delete ALL pickup requests for every user? This can't be undone.")) return;
        clearAllBtn.disabled = true;
        clearAllBtn.textContent = "Clearing…";
        clearAllRequests()
          .then(function(){
            // Track tab hides itself when there are no requests, so send the resident back to Request
            if (state.user && state.user.role === "resident") goToScreen("screen-request");
          })
          .catch(function(){ alert("Couldn't reach the live server — check your connection and try again."); })
          .then(function(){
            clearAllBtn.disabled = false;
            clearAllBtn.textContent = "Clear all requests";
          });
      });
    }

    var credit = document.getElementById("team404");
    if (credit){
      var palettes404 = [
        { a:"#1A1A16", b:"#3E8E6A", c:"#1B7A3A", glow:"#C5E07A" },
        { a:"#C97F1E", b:"#E9A23B", c:"#C1542F", glow:"#F3D38A" },
        { a:"#16342B", b:"#2F6F63", c:"#C5E07A", glow:"#8FCFB8" },
        { a:"#6B2D5B", b:"#C1542F", c:"#E9A23B", glow:"#F0B7A0" },
        { a:"#1B3E32", b:"#245650", c:"#4A90A4", glow:"#A8D4E0" },
        { a:"#2C1810", b:"#C1542F", c:"#E07A5F", glow:"#F2C4B0" }
      ];
      var palette404Index = 0;
      function bounce404(){
        palette404Index = (palette404Index + 1) % palettes404.length;
        var p = palettes404[palette404Index];
        credit.style.setProperty("--c404-a", p.a);
        credit.style.setProperty("--c404-b", p.b);
        credit.style.setProperty("--c404-c", p.c);
        credit.style.setProperty("--c404-glow", p.glow);
        credit.classList.remove("bounce");
        void credit.offsetWidth;
        credit.classList.add("bounce");
      }
      credit.addEventListener("click", bounce404);
      credit.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); bounce404(); }
      });
      credit.addEventListener("animationend", function(e){
        if (e.animationName === "teamBounce") credit.classList.remove("bounce");
      });
    }
  }

  // ---------- init ----------
  function init(){
    loadUser();
    initMap();
    initLocateBtn();
    buildChips();
    initCamera();
    initSubmit();
    initAuth();
    initTabs();
    updateRoleUI();
    startSyncLoop();
    goToScreen(roleHomeScreen());
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
</script>
</body>
</html>
