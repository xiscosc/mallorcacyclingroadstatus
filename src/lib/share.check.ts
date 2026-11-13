// Self-check for the share-link encoding. Run: bun src/lib/share.check.ts
import assert from 'node:assert/strict';
import { decodeRoute, densify, encodeRoute, readShare, shareParams, simplify } from './share';

// A wiggly ~34 km line around Valldemossa with a point every ~10 m.
const route: [number, number][] = Array.from({ length: 4000 }, (_, i) => [
	2.6 + i * 0.0001,
	39.7 + 0.01 * Math.sin(i / 50)
]);

// Round-trips to ~1 m.
const back = decodeRoute(encodeRoute(route))!;
assert.equal(back.length, route.length);
back.forEach(([lng, lat], i) => {
	assert.ok(Math.abs(lng - route[i][0]) < 1e-5 && Math.abs(lat - route[i][1]) < 1e-5);
});

// URL-safe, compact, and read back with name and date.
const params = shareParams({ name: 'Test', coordinates: route }, '2026-11-14');
assert.match(params.get('r')!, /^[A-Za-z0-9_-]+$/);
assert.ok(params.toString().length < 4000, `params are ${params.toString().length} chars`);
const shared = readShare(params)!;
assert.equal(shared.name, 'Test');
assert.equal(shared.date, '2026-11-14');

// Simplification drops most points but keeps both ends.
const simple = simplify(route, 10);
assert.ok(simple.length < route.length / 4);
assert.deepEqual([simple[0], simple.at(-1)], [route[0], route.at(-1)]);

// Densify keeps points at most the step apart (~856 m / 20 m).
const dense = densify(
	[
		[2.6, 39.7],
		[2.61, 39.7]
	],
	20
);
assert.ok(dense.length >= 43);
assert.deepEqual(dense.at(-1), [2.61, 39.7]);

// Malformed params are rejected.
assert.equal(readShare(new URLSearchParams('r=%21%21')), null);
assert.equal(readShare(new URLSearchParams('')), null);
assert.equal(readShare(new URLSearchParams(`r=${encodeRoute(route)}&d=bad`))?.date, '');

console.log(`share.check ok (4000 points → ${simple.length}, ${params.toString().length} chars)`);
