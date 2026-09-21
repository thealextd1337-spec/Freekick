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
assert(shot(50, 0, -100).crossing.x < -1);
assert(shot(50, 0, 100).crossing.x > 1);

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
