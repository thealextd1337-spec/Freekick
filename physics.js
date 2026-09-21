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
    return {
      p: { ...p },
      v: { x: (shot.direction - p.x) / travel, y: mode === 'corner' ? 8 / travel : -speed, z: 2 + shot.height * 0.092 },
      spin: shot.spin,
      elapsed: 0,
      bounces: 0,
      done: false,
      event: null,
      crossing: null
    };
  }

  function step(ball, dt = DT) {
    if (ball.done) return ball;
    const old = { ...ball.p };
    // Side acceleration approximates the Magnus force and fades as the ball slows.
    const speedFactor = clamp(-ball.v.y / 30, 0, 1.2);
    ball.v.x += ball.spin * 0.045 * speedFactor * dt;
    ball.v.z -= 9.81 * dt;
    ball.p.x += ball.v.x * dt;
    ball.p.y += ball.v.y * dt;
    ball.p.z += ball.v.z * dt;
    ball.elapsed += dt;

    if (old.y > 14 && ball.p.y <= 14 && ball.p.x > -5.8 && ball.p.x < 3.5 && ball.p.z < 1.9) {
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

    if (ball.p.z < GOAL.ballRadius) {
      ball.p.z = GOAL.ballRadius;
      if (Math.abs(ball.v.z) > 1.6 && ball.bounces < 2) {
        ball.v.z *= -0.34;
        ball.v.x *= 0.91;
        ball.v.y *= 0.91;
        ball.bounces++;
      } else ball.v.z = 0;
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
