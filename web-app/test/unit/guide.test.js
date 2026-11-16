import { test } from "node:test";
import assert from "node:assert/strict";
import { placeCard, spotlightRect } from "../../src/components/guide/placement.js";
import { GOALS, tourFor } from "../../src/components/guide/tours.js";

const view = { width: 1200, height: 800 };
const card = { width: 360, height: 220 };

test("card goes under a target near the top", () => {
  const spot = { top: 20, left: 900, width: 160, height: 44 };
  const pos = placeCard(spot, card, view);
  assert.equal(pos.side, "below");
  assert.ok(pos.top >= spot.top + spot.height);
  assert.ok(pos.left + card.width <= view.width - 12, "stays inside the right edge");
});

test("card goes above a target near the bottom", () => {
  const spot = { top: 700, left: 40, width: 200, height: 60 };
  const pos = placeCard(spot, card, view);
  assert.equal(pos.side, "above");
  assert.ok(pos.top + card.height <= spot.top);
  assert.equal(pos.left, 12, "clamped to the left margin");
});

test("a target that fills the screen keeps the card on screen", () => {
  const pos = placeCard({ top: 0, left: 0, width: 1200, height: 800 }, card, view);
  assert.equal(pos.side, "inside");
  assert.ok(pos.top >= 12 && pos.top + card.height <= view.height - 12);
});

test("no target centres the card", () => {
  const pos = placeCard(null, card, view);
  assert.equal(pos.side, "center");
  assert.equal(pos.left, (view.width - card.width) / 2);
});

test("spotlight pads the target and never spills off screen", () => {
  assert.deepEqual(spotlightRect({ top: 100, left: 100, width: 50, height: 20 }, view, 8), { top: 92, left: 92, width: 66, height: 36 });
  const tall = spotlightRect({ top: -500, left: 0, width: 1200, height: 3000 }, view, 8);
  assert.ok(tall.top >= 0 && tall.top + tall.height <= view.height);
  assert.ok(tall.left >= 0 && tall.left + tall.width <= view.width);
});

test("every page has a tour, and every step says what it points at", () => {
  for (const path of ["/", "/dashboard", "/pets/3", "/profile", "/admin"]) {
    const steps = tourFor(path);
    assert.ok(steps.length >= 3, `${path} has a real tour`);
    for (const s of steps) assert.ok(s.target && s.title && s.body, `${path}: ${s.target}`);
  }
  assert.equal(tourFor("/pets/3"), tourFor("/pets/12"), "every pet page shares one tour");
});

test("each goal has a short path to follow", () => {
  assert.deepEqual(GOALS.map((g) => g.id), ["owner", "vet", "admin", "explore"]);
  for (const g of GOALS) assert.ok(g.steps.length >= 3 && g.steps.length <= 4, g.id);
});

test("every tour step points at something that's actually tagged in the app", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  const source = walk("src").filter((f) => /\.(js|jsx)$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
  const tagged = new Set([...source.matchAll(/data-guide="([a-z-]+)"/g)].map((m) => m[1]));
  for (const label of ["pack", "profile", "admin"]) tagged.add(`nav-${label}`);
  for (const path of ["/", "/dashboard", "/pets/1", "/profile", "/admin"]) {
    for (const { target } of tourFor(path)) assert.ok(tagged.has(target), `${path}: nothing has data-guide="${target}"`);
  }
});
