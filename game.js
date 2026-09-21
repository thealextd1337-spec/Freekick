(() => {
  'use strict';
  const P = window.FreeKickPhysics, canvas = document.querySelector('#pitch'), ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s), clamp = P.clamp;
  let W = 960, H = 600;
  const view = { ox: 480, oy: 220, sx: 45, dx: 8, tilt: -11, dy: 12.5, sz: 48, spriteScale: 1, zoom: 1 };
  const project = (x, y, z = 0) => {
    const px = view.ox + x * view.sx + y * view.dx;
    const py = view.oy + x * view.tilt + y * view.dy - z * view.sz;
    return { x: view.ox + (px - view.ox) * view.zoom, y: view.oy + (py - view.oy) * view.zoom };
  };
  const images = {};
  for (const name of ['player-home', 'player-away', 'keeper', 'ball', 'goal', 'player-kick-1', 'player-kick-2', 'player-kick-3', 'keeper-dive-left', 'keeper-dive-right']) {
    const im = new Image(); im.src = `assets/${name}.png?v=4`; im.onload = draw; images[name] = im;
  }
  const s = { mode: 'free', phase: 'height', height: 50, direction: 0, spin: 0, power: 65, meter: .3, ball: null, shot: null, predicted: null, runup: 0, keeperX: 0, keeperPose: 0, keeperTarget: 0, header: false, goals: 0, tries: 0, freeAttempt: -1, origin: { x: -3, y: 25 }, last: 0, accumulator: 0, flash: 0, message: '', contactMessageUntil: 0 };
  function line(a, b, color, width = 2) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
  function poly(p, fill, stroke, width = 1) { ctx.beginPath(); p.forEach((a, i) => i ? ctx.lineTo(a.x, a.y) : ctx.moveTo(a.x, a.y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } }
  function circle(p, r, fill, stroke) { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } }
  function field() {
    ctx.fillStyle = '#80a8c5'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#438852'; ctx.fillRect(0, 80, W, H - 80);
    for (let y = -6, i = 0; y < 34; y += 3, i++) poly([project(-17, y), project(17, y), project(17, y + 3), project(-17, y + 3)], i % 2 ? '#438852' : '#4b965a');
    poly([project(-17, -5), project(17, -5), project(17, 34), project(-17, 34)], null, '#dceecb', 3);
    line(project(-17, 0), project(17, 0), '#e9f3dc', 3);
    poly([project(-13, 0), project(13, 0), project(13, 16.5), project(-13, 16.5)], null, '#e9f3dc', 3);
    poly([project(-9.16, 0), project(9.16, 0), project(9.16, 5.5), project(-9.16, 5.5)], null, '#e9f3dc', 3);
    circle(project(0, 11), 4, '#e9f3dc');
    const goal = images.goal;
    if (goal.complete && goal.naturalWidth) {
      const left = project(-P.GOAL.halfWidth, 0), right = project(P.GOAL.halfWidth, 0);
      const scale = (right.x - left.x) / 774;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(goal, left.x - 326 * scale, left.y - 625 * scale, goal.width * scale, goal.height * scale);
    } else {
      line(project(-3.66, 0), project(-3.66, 0, 2.44), '#fafcf3', 8);
      line(project(3.66, 0), project(3.66, 0, 2.44), '#fafcf3', 8);
      line(project(-3.66, 0, 2.44), project(3.66, 0, 2.44), '#fafcf3', 8);
    }
  }
  function sprite(name, x, y, size, dx = 0, dy = 0) {
    size *= view.spriteScale * view.zoom;
    const p = project(x, y), im = images[name];
    circle({ x: p.x, y: p.y + 4 }, size * .2, '#102a2780');
    if (im?.complete && im.naturalWidth) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, p.x - size / 2 + dx, p.y - size * .76 + dy, size, size); }
    else circle({ x: p.x, y: p.y - 20 }, size * .23, name.includes('keeper') ? '#d3ad28' : '#e9cf32');
  }
  function people(time) {
    const run = s.phase === 'runup' ? clamp(s.runup / .38, 0, 1) : ['flight', 'result'].includes(s.phase) ? 1 : 0;
    const pose = s.phase === 'runup' ? Math.min(3, Math.floor(run * 4)) : run ? 3 : 0;
    const kick = pose ? `player-kick-${pose}` : 'player-home';
    const keeper = s.keeperPose > .5 ? (s.keeperTarget < 0 ? 'keeper-dive-left' : 'keeper-dive-right') : 'keeper';
    sprite(keeper, s.keeperX, 1.35, 108, s.keeperPose * (s.keeperTarget < 0 ? -14 : 14), -s.keeperPose * 8 + Math.sin(time * 3) * 2);
    if (s.mode === 'free') [-1.5, -.6, .3, 1.2].forEach((x, i) => sprite('player-away', x, 14, 79, 0, Math.sin(time * 2 + i) * 2));
    else {
      [[-8, 10], [-2, 7], [4, 11], [9, 8]].forEach(([x, y], i) => sprite('player-away', x, y, 77, 0, Math.sin(time * 2 + i) * 2));
      [[-5, 12], [2, 10], [8, 14]].forEach(([x, y], i) => sprite('player-home', x, y, 80, 0, Math.sin(time * 3 + i) * 3));
    }
    sprite(kick, s.mode === 'free' ? s.origin.x - .7 : -25, (s.mode === 'free' ? s.origin.y + .2 : 4) - run * 1.25, 91, 0, Math.sin(run * Math.PI * 4) * 3);
  }
  const tri = t => 1 - Math.abs((t % 2 + 2) % 2 - 1);
  function meterValue() {
    const v = tri(s.meter);
    if (s.phase === 'height') return 18 + v * 62;
    if (s.phase === 'direction') return s.mode === 'free' ? -4.7 + v * 9.4 : -10 + v * 19;
    return -100 + v * 200;
  }
  const shotNow = () => ({ height: s.phase === 'height' ? meterValue() : s.height, direction: s.phase === 'direction' ? meterValue() : s.direction, spin: s.phase === 'spin' ? meterValue() : s.spin, power: s.power, origin: s.origin });
  function drawAim() {
    const shot = shotNow(), p = project(shot.direction, s.mode === 'free' ? 0 : 11, .18);
    circle(p, 17, '#d9fc5a44', '#f4ffb1');
    line({ x: p.x - 23, y: p.y }, { x: p.x + 23, y: p.y }, '#f4ffb1', 2);
    line({ x: p.x, y: p.y - 23 }, { x: p.x, y: p.y + 23 }, '#f4ffb1', 2);
    const preview = P.launch(s.mode, shot), points = [{ ...preview.p }];
    for (let i = 0; i < 70 && !preview.done; i++) { P.step(preview); if (i % 5 === 0) points.push({ ...preview.p }); }
    ctx.setLineDash([6, 8]);
    for (let i = 1; i < points.length; i++) line(project(points[i - 1].x, points[i - 1].y, points[i - 1].z), project(points[i].x, points[i].y, points[i].z), '#f8ffcf9c', 2);
    ctx.setLineDash([]);
  }
  function drawBall() {
    const b = s.ball ? s.ball.p : P.start(s.mode, { origin: s.origin }), p = project(b.x, b.y, b.z);
    const size = clamp(W * .05, 28, 44) * view.zoom * (s.mode === 'corner' ? .62 : 1);
    circle(project(b.x, b.y), size * .27, '#102a2780');
    const im = images.ball;
    const center = { x: p.x, y: p.y - size * .22 };
    if (im.complete && im.naturalWidth) {
      ctx.save(); ctx.translate(center.x, center.y);
      ctx.rotate(s.ball ? s.ball.elapsed * (s.ball.rolling ? 12 : 6) : 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(im, 64, 64, 64, 64, -size / 2, -size / 2, size, size); ctx.restore();
    } else circle(center, size * .45, '#f4f0da', '#192e38');
  }
  function draw(time = performance.now() / 1000) {
    const approach = s.ball ? clamp((16 - Math.abs(s.ball.p.y)) / 16, 0, 1) : 0;
    view.zoom = s.phase === 'flight' || s.phase === 'result' ? 1 + approach * (s.mode === 'corner' ? .42 : .14) : 1;
    ctx.clearRect(0, 0, W, H); field(); people(time);
    if (['height', 'direction', 'spin'].includes(s.phase)) drawAim();
    drawBall();
    if (s.flash > 0) { ctx.fillStyle = `rgba(235,255,192,${s.flash * .3})`; ctx.fillRect(0, 0, W, H); }
  }
  function ui() {
    const names = { height: 'HÖHE', direction: 'RICHTUNG', spin: 'EFFET', runup: 'ANLAUF', flight: 'BALLFLUG', result: 'ERGEBNIS' };
    const prompts = { height: 'Höhe festlegen', direction: 'Richtung festlegen', spin: 'Effet festlegen & schießen', result: 'Noch ein Versuch' };
    $('#stage-name').textContent = names[s.phase]; $('#action').disabled = !prompts[s.phase]; $('#action').textContent = prompts[s.phase] || 'Ball unterwegs …';
    $('#meter').hidden = !['height', 'direction', 'spin'].includes(s.phase);
    if (!$('#meter').hidden) {
      const v = meterValue();
      const fraction = s.phase === 'height' ? (v - 18) / 62 : s.phase === 'direction' ? (s.mode === 'free' ? (v + 4.7) / 9.4 : (v + 10) / 19) : (v + 100) / 200;
      $('#meter-needle').style.left = `${fraction * 100}%`;
      $('#meter-value').textContent = s.phase === 'height' ? `${Math.round(v)} %` : s.phase === 'direction' ? `${v > 0 ? '+' : ''}${v.toFixed(1)} m` : `${Math.round(v)}`;
    }
    $('#stage-help').textContent = s.phase === 'height' ? 'Links: Flachschuss rollt am Rasen.' : s.phase === 'direction' ? 'Die Zielmarke pendelt. Tippen legt die Richtung fest.' : s.phase === 'spin' ? 'Effet pendelt. Tippen löst den Schuss aus.' : '';
    $('#status').textContent = s.message;
  }
  function mode(name) {
    configureView(name);
    $('.field').classList.toggle('corner-view', name === 'corner');
    if (name === 'free') {
      const positions = [{ x: -3, y: 25 }, { x: -5, y: 22 }, { x: -1, y: 28 }];
      s.origin = positions[++s.freeAttempt % positions.length];
    }
    s.mode = name; s.phase = 'height'; s.height = 50; s.direction = 0; s.spin = 0; s.meter = .3; s.ball = null; s.shot = null;
    s.runup = 0; s.keeperX = 0; s.keeperPose = 0; s.header = false; s.accumulator = 0; s.contactMessageUntil = 0;
    s.message = name === 'free' ? `Freistoß aus ${s.origin.y} m: Wähle zuerst die Höhe.` : 'Wähle zuerst die Höhe deiner Ecke.';
    $('#free').classList.toggle('active', name === 'free'); $('#corner').classList.toggle('active', name === 'corner');
    $('#tip').textContent = 'Tippen oder Leertaste: Wert festlegen'; ui(); draw();
  }
  function configureView(name) {
    const rect = $('.field').getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const portrait = W / H < .9;
    if (name === 'free') {
      const sx = portrait ? Math.min(W * .104, H * .058) : Math.min(W * .047, H * .084);
      Object.assign(view, portrait
        ? { ox: W * .53, oy: H * .3, sx, dx: sx * .09, tilt: -sx * .22, dy: H * .016, sz: sx * 1.05, spriteScale: clamp(W / 560, .68, 1.15) }
        : { ox: W * .52, oy: H * .43, sx, dx: sx * .18, tilt: -sx * .24, dy: H * .014, sz: sx * 1.05, spriteScale: clamp(W / 960, .75, 1.25) });
    } else {
      const sx = portrait ? W * .031 : Math.min(W * .03, H * .054);
      Object.assign(view, portrait
        ? { ox: W * .82, oy: H * .3, sx, dx: sx * .17, tilt: -sx * .24, dy: H * .019, sz: sx * 1.05, spriteScale: .7 }
        : { ox: W * .77, oy: H * .4, sx, dx: sx * .25, tilt: -sx * .24, dy: H * .016, sz: sx * 1.05, spriteScale: clamp(W / 960, .7, 1.15) });
    }
  }
  function action() {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) { /* Sound is optional. */ }
    if (s.phase === 'result') { mode(s.mode); return; }
    if (s.phase === 'height') { s.height = meterValue(); s.phase = 'direction'; s.meter = .5; s.message = 'Lege jetzt die Richtung fest.'; }
    else if (s.phase === 'direction') { s.direction = meterValue(); s.phase = 'spin'; s.meter = 1; s.message = 'Lege jetzt den Effet fest.'; }
    else if (s.phase === 'spin') {
      s.spin = meterValue(); s.shot = { height: s.height, direction: s.direction, spin: s.spin, power: s.power, origin: s.origin };
      s.predicted = P.predict(s.mode, s.shot).ball;
      s.keeperTarget = clamp(s.predicted.crossing?.x ?? s.direction, -3.1, 3.1);
      s.phase = 'runup'; s.runup = 0; s.message = 'Der Schütze läuft an …';
    }
    ui(); draw();
  }
  function finish(event) {
    s.phase = 'result'; s.tries++;
    const messages = { wall: 'Die Mauer blockt den Schuss.', post: 'Pfosten! So knapp war es.', bar: 'Latte! Der Ball springt zurück.', miss: 'Am Tor vorbei oder darüber.', short: 'Der Ball erreicht das Tor nicht.', noheader: 'Die Flanke findet keinen Mitspieler.', save: 'Starke Parade des Torwarts!', goal: s.header ? 'TOR! Die Ecke wird eingeköpft.' : 'TOR! Perfekt getroffen.' };
    if (event === 'goal') { s.goals++; s.flash = 1; }
    s.message = messages[event] || 'Die Flanke findet keinen Mitspieler.';
    $('#goals').textContent = s.goals; $('#tries').textContent = s.tries; ui(); draw();
  }
  function tick() {
    const b = s.ball, before = { ...b.p }; P.step(b);
    if (b.contact === 'post' || b.contact === 'bar') {
      s.message = b.contact === 'post' ? 'Pfosten! Der Ball bleibt im Spiel.' : 'Latte! Der Ball springt weiter.';
      s.contactMessageUntil = b.elapsed + 1.1;
      $('#status').textContent = s.message;
      sound('metal');
    } else if (b.contact === 'net' && !b.netSoundPlayed) { b.netSoundPlayed = true; sound('net'); }
    if (b.elapsed > .2) {
      s.keeperX += clamp(s.keeperTarget - s.keeperX, -2.6 * P.DT, 2.6 * P.DT);
      s.keeperPose = clamp((b.elapsed - .45) / .34, 0, 1);
    }
    if (s.mode === 'corner' && !s.header && before.y < 11 && b.p.y >= 11) {
      const near = Math.min(...[[-5, 12], [2, 10], [8, 14]].map(([x, y]) => Math.hypot(b.p.x - x, b.p.y - y)));
      if (near < 2.7 && b.p.z > 1.1 && b.p.z < 3.6) {
        s.header = true; b.p.z = 1.85; b.v.x = -b.p.x * 2.1; b.v.y = -15; b.v.z = 1.8;
        s.keeperTarget = clamp(b.p.x * .2, -2.5, 2.5); s.message = 'Kopfball aufs Tor!'; $('#status').textContent = s.message;
      } else { b.done = true; b.event = 'noheader'; }
    }
    if (before.y > 1.35 && b.p.y <= 1.35 && b.p.z < 2.3) {
      const reach = .45 + s.keeperPose * .55;
      if (Math.abs(b.p.x - s.keeperX) < reach && b.p.z < 1.6 + s.keeperPose * .5) { b.done = true; b.event = 'save'; }
    }
    if (b.done) finish(s.mode === 'corner' && !s.header && b.event === 'goal' ? 'miss' : b.event);
  }
  function frame(now) {
    const dt = Math.min(.05, (now - (s.last || now)) / 1000); s.last = now;
    if (['height', 'direction', 'spin'].includes(s.phase)) { s.meter += dt * (s.phase === 'height' ? .63 : s.phase === 'direction' ? .87 : 1.05); ui(); }
    if (s.phase === 'runup') { s.runup += dt; if (s.runup >= .38) { s.ball = P.launch(s.mode, s.shot); s.phase = 'flight'; s.message = 'Der Ball ist unterwegs …'; ui(); } }
    if (s.phase === 'flight') {
      s.accumulator += dt;
      while (s.accumulator >= P.DT && s.phase === 'flight') { tick(); s.accumulator -= P.DT; }
      if (s.ball && s.contactMessageUntil && s.ball.elapsed > s.contactMessageUntil && s.phase === 'flight') { s.contactMessageUntil = 0; s.message = 'Der Ball ist noch im Spiel …'; $('#status').textContent = s.message; }
    }
    s.flash = Math.max(0, s.flash - dt * 1.4); draw(now / 1000); requestAnimationFrame(frame);
  }
  $('#free').onclick = () => mode('free'); $('#corner').onclick = () => mode('corner'); $('#action').onclick = action;
  canvas.addEventListener('pointerup', e => { e.preventDefault(); action(); });
  $('#power').addEventListener('input', e => { s.power = Number(e.target.value); $('#power-value').textContent = `${s.power} %`; });
  const shell = $('.game-shell'), fullButton = $('#fullscreen');
  let audioContext;
  function sound(kind) {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state !== 'running') return;
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = kind === 'metal' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(kind === 'metal' ? 720 : 125, now);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'metal' ? 340 : 70, now + .23);
      gain.gain.setValueAtTime(kind === 'metal' ? .13 : .045, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .26);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now); oscillator.stop(now + .27);
    } catch (_) { /* Sound is optional. */ }
  }
  document.addEventListener('pointerdown', () => { if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {}); }, { passive: true });
  function syncFullscreen() {
    const active = document.fullscreenElement === shell;
    fullButton.innerHTML = active ? '⤢ <span>Schließen</span>' : '⛶ <span>Vollbild</span>';
    fullButton.setAttribute('aria-label', active ? 'Vollbildmodus verlassen' : 'Vollbildmodus öffnen');
    fullButton.setAttribute('aria-pressed', String(active));
    fullButton.title = active ? 'Vollbildmodus verlassen' : 'Vollbildmodus öffnen';
    requestAnimationFrame(() => { configureView(s.mode); draw(); });
  }
  fullButton.addEventListener('click', async () => {
    if (document.fullscreenElement === shell) { await document.exitFullscreen(); return; }
    if (shell.requestFullscreen) {
      try { await shell.requestFullscreen({ navigationUI: 'hide' }); $('#install-hint').hidden = true; syncFullscreen(); return; } catch (_) { /* Explain browser limitation below. */ }
    }
    $('#install-hint').hidden = false;
    $('#status').textContent = 'Dieser Browser unterstützt hier kein echtes Vollbild.';
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('fullscreenerror', () => { $('#install-hint').hidden = false; });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'BUTTON'].includes(e.target?.tagName)) { e.preventDefault(); if (!e.repeat) action(); } });
  window.addEventListener('resize', () => { configureView(s.mode); draw(); });
  new ResizeObserver(() => { configureView(s.mode); draw(); }).observe($('.field'));
  mode('free'); requestAnimationFrame(frame);
})();
