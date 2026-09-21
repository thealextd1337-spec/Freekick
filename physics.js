/* Shared shot simulation. World units are metres; the goal line is y = 0. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FreeKickPhysics = api;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  'use strict';
  const GOAL = Object.freeze({ halfWidth: 3.66, height: 2.44, ballRadius: 0.11, frameRadius: 0.06, depth: 1.8 });
  const DT = 1 / 120;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const start = (mode, shot) => mode === 'corner' ? { x: -24, y: 3, z: GOAL.ballRadius } : { x: shot?.origin?.x ?? -3, y: shot?.origin?.y ?? 25, z: GOAL.ballRadius };
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

  function launch(mode, shot) {
    const p = start(mode, shot);
    const speed = 18 + shot.power * 0.14;
    const travel = mode === 'corner' ? Math.max(0.38, (shot.direction - p.x) / speed) : p.y / speed;
    const rolling = shot.height <= 34;
    return {
      p: { ...p },
      v: { x: (shot.direction - p.x) / travel, y: mode === 'corner' ? 8 / travel : -speed, z: rolling ? 0 : 2 + shot.height * 0.092 },
      spin: shot.spin, elapsed: 0, rolling, done: false, event: null,
      crossing: null, contact: null, lastContact: null, contactCooldown: 0,
      scored: false, goalTime: null, missed: false
    };
  }

  // Closest points on the ball's travel segment and a round goal-frame segment.
  function segmentContact(old, next, a, b) {
    const u = sub(next, old), v = sub(b, a), w = sub(old, a);
    const uu = dot(u, u), uv = dot(u, v), vv = dot(v, v), uw = dot(u, w), vw = dot(v, w);
    const denom = uu * vv - uv * uv;
    let t = denom > 1e-9 ? clamp((uv * vw - vv * uw) / denom, 0, 1) : 0;
    let q = clamp((uv * t + vw) / vv, 0, 1);
    t = uu > 1e-9 ? clamp((uv * q - uw) / uu, 0, 1) : 0;
    q = clamp((uv * t + vw) / vv, 0, 1);
    const center = { x: old.x + u.x * t, y: old.y + u.y * t, z: old.z + u.z * t };
    const frame = { x: a.x + v.x * q, y: a.y + v.y * q, z: a.z + v.z * q };
    const difference = sub(center, frame), distance = Math.hypot(difference.x, difference.y, difference.z);
    return { t, center, difference, distance };
  }

  function frameImpact(ball, old, next, dt) {
    if (ball.contactCooldown > 0) return false;
    const hw = GOAL.halfWidth, h = GOAL.height;
    const pieces = [
      { event: 'post', a: { x: -hw, y: 0, z: 0 }, b: { x: -hw, y: 0, z: h } },
      { event: 'post', a: { x: hw, y: 0, z: 0 }, b: { x: hw, y: 0, z: h } },
      { event: 'bar', a: { x: -hw, y: 0, z: h }, b: { x: hw, y: 0, z: h } }
    ];
    let hit = null;
    for (const piece of pieces) {
      const candidate = segmentContact(old, next, piece.a, piece.b);
      if (candidate.distance <= GOAL.ballRadius + GOAL.frameRadius && (!hit || candidate.t < hit.t)) hit = { ...candidate, event: piece.event };
    }
    if (!hit) return false;
    const len = Math.max(hit.distance, 1e-6);
    const normal = len > 1e-5 ? { x: hit.difference.x / len, y: hit.difference.y / len, z: hit.difference.z / len } : { x: 0, y: 1, z: 0 };
    const approach = dot(ball.v, normal);
    if (approach >= 0) return false;
    const restitution = hit.event === 'bar' ? .6 : .67;
    ball.v.x -= (1 + restitution) * approach * normal.x;
    ball.v.y -= (1 + restitution) * approach * normal.y;
    ball.v.z -= (1 + restitution) * approach * normal.z;
    ball.v.x *= .96; ball.v.y *= .96;
    const separation = GOAL.ballRadius + GOAL.frameRadius + .003;
    ball.p = {
      x: hit.center.x + normal.x * (separation - hit.distance) + ball.v.x * dt * (1 - hit.t),
      y: hit.center.y + normal.y * (separation - hit.distance) + ball.v.y * dt * (1 - hit.t),
      z: hit.center.z + normal.z * (separation - hit.distance) + ball.v.z * dt * (1 - hit.t)
    };
    ball.contact = hit.event;
    ball.lastContact = hit.event;
    ball.contactCooldown = .055;
    if (ball.v.z > .15) ball.rolling = false;
    return true;
  }

  function step(ball, dt = DT) {
    if (ball.done) return ball;
    const old = { ...ball.p };
    ball.contact = null;
    ball.contactCooldown = Math.max(0, ball.contactCooldown - dt);
    const speedFactor = clamp(Math.hypot(ball.v.x, ball.v.y) / 30, 0, 1.2);
    ball.v.x += ball.spin * (ball.rolling ? .012 : .045) * speedFactor * dt;
    if (ball.rolling) {
      const horizontal = Math.hypot(ball.v.x, ball.v.y);
      const factor = horizontal > 0 ? Math.max(0, 1 - 3.2 * dt / horizontal) : 0;
      ball.v.x *= factor; ball.v.y *= factor;
    } else ball.v.z -= 9.81 * dt;
    const next = { x: old.x + ball.v.x * dt, y: old.y + ball.v.y * dt, z: ball.rolling ? GOAL.ballRadius : old.z + ball.v.z * dt };
    ball.p = next;
    ball.elapsed += dt;

    if (old.y > 14 && next.y <= 14 && next.x > -1.95 && next.x < 1.65 && next.z < 1.9) {
      ball.done = true; ball.event = 'wall'; return ball;
    }

    frameImpact(ball, old, next, dt);
    if (ball.p.z <= GOAL.ballRadius) {
      ball.p.z = GOAL.ballRadius;
      if (!ball.rolling && ball.v.z < -1.8) {
        ball.v.z = -ball.v.z * .3;
        ball.v.x *= .84; ball.v.y *= .84;
        ball.contact = ball.contact || 'grass';
      } else { ball.v.z = 0; ball.rolling = true; }
    }

    // Keep the first centre crossing for goalkeeper prediction. A goal requires
    // the entire ball to have passed the line within the open frame.
    if (!ball.crossing && old.y > 0 && ball.p.y <= 0) {
      const fraction = old.y / (old.y - ball.p.y);
      ball.crossing = {
        x: old.x + (ball.p.x - old.x) * fraction,
        z: old.z + (ball.p.z - old.z) * fraction,
        time: ball.elapsed - dt * (1 - fraction)
      };
    }
    if (!ball.scored && !ball.missed && old.y > -GOAL.ballRadius && ball.p.y <= -GOAL.ballRadius) {
      const inside = Math.abs(ball.p.x) < GOAL.halfWidth - GOAL.ballRadius - GOAL.frameRadius && ball.p.z < GOAL.height - GOAL.ballRadius - GOAL.frameRadius;
      if (inside) { ball.scored = true; ball.goalTime = ball.elapsed; ball.event = 'goal'; }
      else ball.missed = true;
    }

    if (ball.scored) {
      const side = GOAL.halfWidth - GOAL.ballRadius;
      if (ball.p.y < -GOAL.depth + GOAL.ballRadius) { ball.p.y = -GOAL.depth + GOAL.ballRadius; ball.v.y = Math.abs(ball.v.y) * .12; ball.contact = ball.contact || 'net'; }
      if (Math.abs(ball.p.x) > side) { ball.p.x = Math.sign(ball.p.x) * side; ball.v.x *= -.12; ball.contact = ball.contact || 'net'; }
      if (ball.p.z > GOAL.height - GOAL.ballRadius) { ball.p.z = GOAL.height - GOAL.ballRadius; ball.v.z *= -.12; ball.contact = ball.contact || 'net'; }
      ball.v.x *= .985; ball.v.y *= .985;
      if (ball.elapsed - ball.goalTime > .85) ball.done = true;
    } else if (ball.elapsed > 4.6 || (ball.missed && ball.elapsed > (ball.crossing?.time || 0) + .75) || (ball.rolling && Math.hypot(ball.v.x, ball.v.y) < .55)) {
      ball.done = true;
      ball.event = ball.lastContact || (ball.missed ? 'miss' : 'short');
    }
    return ball;
  }

  function predict(mode, shot) {
    const ball = launch(mode, shot), points = [{ ...ball.p }];
    for (let n = 0; n < 650 && !ball.done; n++) {
      step(ball); if (n % 5 === 0) points.push({ ...ball.p });
    }
    return { ball, points };
  }
  return { GOAL, DT, clamp, start, launch, step, predict };
});
