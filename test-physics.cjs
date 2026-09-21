const assert = require('node:assert/strict');
const P = require('./physics.js');

assert.equal(P.GOAL.halfWidth * 2, 7.32);
assert.equal(P.GOAL.height, 2.44);
const shot = (height, direction, spin = 0) => P.predict('free', { height, direction, spin, power: 65 }).ball;
assert.equal(shot(18, 0).event, 'wall');
assert.equal(shot(50, 0).event, 'goal');
assert.equal(shot(49, 3.7).event, 'post');
assert.equal(shot(55, 3.5).event, 'bar');
assert.equal(shot(50, 4.7).event, 'miss');
for (const [height, direction, contact] of [[49, 3.7, 'post'], [55, 3.5, 'bar']]) {
  const rebound = P.launch('free', { height, direction, spin: 0, power: 65 });
  let hit = false;
  for (let i = 0; i < 650 && !rebound.done; i++) {
    P.step(rebound);
    if (rebound.contact === contact) {
      hit = true;
      assert(!rebound.done, `${contact} contact must not stop the ball`);
      assert(Math.hypot(rebound.v.x, rebound.v.y, rebound.v.z) > 0, 'the rebound must retain velocity');
      break;
    }
  }
  assert(hit, `${contact} must physically collide`);
  while (!rebound.done) P.step(rebound);
  assert.equal(rebound.event, contact);
}
const netBall = P.launch('free', { height: 50, direction: 0, spin: 0, power: 65 });
while (!netBall.scored && !netBall.done) P.step(netBall);
assert(netBall.scored && !netBall.done, 'ball remains animated after crossing the goal line');
assert(netBall.p.y <= -P.GOAL.ballRadius, 'entire ball crosses the line before a goal is awarded');
while (!netBall.done) P.step(netBall);
assert.equal(netBall.event, 'goal');
assert(netBall.p.y >= -P.GOAL.depth, 'net keeps the ball inside the goal');
assert(shot(50, 0, -100).crossing.x < -1);
assert(shot(50, 0, 100).crossing.x > 1);
const flat = P.launch('free', { height: 18, direction: -11, spin: 0, power: 65 });
assert(flat.rolling, 'a low shot must start on the grass');
for (let i = 0; i < 40; i++) {
  const before = flat.p.y;
  P.step(flat);
  assert.equal(flat.p.z, P.GOAL.ballRadius, 'rolling ball must stay on the grass');
  assert(flat.p.y < before, 'rolling ball must continue towards the goal');
}
const rollingGoal = shot(18, -3);
assert.equal(rollingGoal.event, 'goal', 'a ground shot around the wall must be able to score');
assert.equal(rollingGoal.crossing.z, P.GOAL.ballRadius);
const landing = P.launch('free', { height: 35, direction: -11, spin: 0, power: 25 });
for (let i = 0; i < 200 && !landing.rolling && !landing.done; i++) P.step(landing);
assert(landing.rolling, 'airborne ball must roll after landing');
assert.equal(landing.p.z, P.GOAL.ballRadius);

for (const height of [30, 40, 50, 60]) {
  const corner = P.launch('corner', { height, direction: -5, spin: 0, power: 65 });
  for (let i = 0; i < 150 && corner.p.y < 11 && !corner.done; i++) P.step(corner);
  assert(corner.p.y >= 11, 'corner must reach the penalty area');
  assert(Math.abs(corner.p.x + 5) < .5, 'corner must reach its intended lateral area');
}
const header = P.launch('corner', { height: 50, direction: 2, spin: 0, power: 65 });
while (header.p.y < 11 && !header.done) P.step(header);
assert(header.p.z > 1.1 && header.p.z < 3.6, 'corner must arrive at heading height');
header.p.z = 1.85;
header.v.x = -header.p.x * 2.1;
header.v.y = -15;
header.v.z = 1.8;
while (!header.done) P.step(header);
assert.equal(header.event, 'goal', 'a well-placed header must be able to score');
console.log('Freekick physics checks passed');
