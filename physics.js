/* Shared shot simulation. World units are metres; the goal line is y = 0. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FreeKickPhysics = api;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  'use strict';
  const GOAL = Object.freeze({ halfWidth: 3.66, height: 2.44, ballRadius: 0.11 });
  const DT = 1 / 120;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const start = mode => mode === 'corner' ? { x: -24, y: 3, z: GOAL.ballRadius } : { x: -3, y: 25, z: GOAL.ballRadius };

  function launch(mode, shot) {
    const p = start(mode);
    const speed = 18 + shot.power * 0.14;
    const travel = mode === 'corner' ? Math.max(0.38, (shot.direction - p.x) / speed) : p.y / speed;
    const rolling = shot.height <= 34;
    return {
      p: { ...p },
      v: { x: (shot.direction - p.x) / travel, y: mode === 'corner' ? 8 / travel : -speed, z: rolling ? 0 : 2 + shot.height * 0.092 },
      spin: shot.spin,
      elapsed: 0,
      rolling,
      done: false,
      event: null,
      crossing: null
    };
  }

  function step(ball, dt = DT) {
    if (ball.done) return ball;
    const old = { ...ball.p };
    // Side acceleration approximates the Magnus force and fades as the ball slows.
    const speedFactor = clamp(Math.hypot(ball.v.x, ball.v.y) / 30, 0, 1.2);
    ball.v.x += ball.spin * (ball.rolling ? 0.012 : 0.045) * speedFactor * dt;
    if (ball.rolling) {
      const horizontal = Math.hypot(ball.v.x, ball.v.y);
      const factor = horizontal > 0 ? Math.max(0, 1 - 2.8 * dt / horizontal) : 0;
      ball.v.x *= factor;
      ball.v.y *= factor;
    } else ball.v.z -= 9.81 * dt;
    ball.p.x += ball.v.x * dt;
    ball.p.y += ball.v.y * dt;
    if (ball.rolling) ball.p.z = GOAL.ballRadius;
    else ball.p.z += ball.v.z * dt;
    ball.elapsed += dt;

    if (ball.p.z <= GOAL.ballRadius) {
      ball.p.z = GOAL.ballRadius;
      ball.v.z = 0;
      ball.rolling = true;
    }

    if (old.y > 14 && ball.p.y <= 14 && ball.p.x > -1.95 && ball.p.x < 1.65 && ball.p.z < 1.9) {
      ball.done = true; ball.event = 'wall'; return ball;
    }

    if (old.y > 0 && ball.p.y <= 0) {
      const fraction = old.y / (old.y - ball.p.y);
      const x = old.x + (ball.p.x - old.x) * fraction;
      const z = old.z + (ball.p.z - old.z) * fraction;
      ball.crossing = { x, z, time: ball.elapsed - dt * (1 - fraction) };
      if (Math.abs(Math.abs(x) - GOAL.halfWidth) <= GOAL.ballRadius && z <= GOAL.height + GOAL.ballRadius) ball.event = 'post';
      else if (Math.abs(z - GOAL.height) <= GOAL.ballRadius && Math.abs(x) <= GOAL.halfWidth + GOAL.ballRadius) ball.event = 'bar';
      else if (Math.abs(x) < GOAL.halfWidth - GOAL.ballRadius && z >= GOAL.ballRadius - 0.01 && z < GOAL.height - GOAL.ballRadius) ball.event = 'goal';
      else ball.event = 'miss';
      ball.done = true; return ball;
    }

    if (ball.elapsed > 3.2 || ball.p.y < -4 || (Math.abs(ball.v.y) < 0.5 && ball.p.y > 0)) {
      ball.done = true; ball.event = 'short';
    }
    return ball;
  }

  function predict(mode, shot) {
    const ball = launch(mode, shot), points = [{ ...ball.p }];
    for (let n = 0; n < 400 && !ball.done; n++) {
      step(ball); if (n % 5 === 0) points.push({ ...ball.p });
    }
    return { ball, points };
  }
  return { GOAL, DT, clamp, start, launch, step, predict };
});
