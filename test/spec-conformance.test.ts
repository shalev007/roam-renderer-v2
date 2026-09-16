import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "../src/parser.js";
import { validate } from "../src/validator.js";
import { derive, aggregate } from "../src/derive.js";

// Fixture is a byte-for-byte copy of the "Full example" in roam_spec_v1.0.md.
const trip = parse(readFileSync("test/fixtures/spec-worked-example.roam", "utf-8"));
const dtrip = derive(trip);
const agg = aggregate(dtrip);

function node(name: string) {
  const n = dtrip.find((i) => i.type === "node" && i.name === name);
  assert.ok(n, `expected a node named "${name}"`);
  return n as Extract<(typeof dtrip)[number], { type: "node" }>;
}

function edgeAfter(name: string) {
  const idx = dtrip.findIndex((i) => i.type === "node" && i.name === name);
  const e = dtrip[idx + 1];
  assert.ok(e?.type === "edge", `expected an edge right after "${name}"`);
  return e as Extract<(typeof dtrip)[number], { type: "edge" }>;
}

test("spec example is structurally valid", () => {
  assert.deepEqual(validate(trip), []);
});

test("walk from hotel to Mount of Olives takes 20 min (spec: 'Walk from hotel to Mount of Olives: 20 min')", () => {
  assert.equal(edgeAfter("Legacy Ottoman Hotel").travelTime, 20);
});

test("bus travel time to Yad Vashem is 30 min (spec: 'Bus travel time: 30 min')", () => {
  assert.equal(edgeAfter("Mount of Olives").travelTime, 30);
});

test("day 1 total cost is 325 (spec: 'Day 1 total cost: ~₪325')", () => {
  assert.equal(agg.days[0]?.totalCost, 325);
});

test("hotel stay duration, per spec's own duration rule (next edge departure minus node arrival), is 10h — not the 12h the spec prose claims", () => {
  // 22:00 (10.01) -> 08:00 (11.01) is 10 hours. The spec's "Full example"
  // walkthrough says "Hotel stay duration: 12h (22:00 -> 08:00)", which is
  // arithmetically wrong for its own worked example (that 12h figure matches
  // the *different*, earlier illustrative snippet in the "Timestamp
  // semantics" section, not this one). This test locks in the correct value
  // per the spec's derivation rule and documents the doc inconsistency.
  assert.equal(node("Legacy Ottoman Hotel").duration, 600);
});

test("distanceToNext is haversine to the nearest following node with a location, not an arbitrary later one", () => {
  // The spec's "Full example" walkthrough also claims "Distance hotel ->
  // Yad Vashem: ~5.2 km", but the implemented `distanceToNext` field is
  // defined (see derive.ts) as the distance to the *nearest subsequent*
  // node that has a #loc, which for the hotel is Mount of Olives, not Yad
  // Vashem — Yad Vashem is two location-bearing nodes further down the
  // chain. Nothing in the spec's generic derived-data rule ("Distance |
  // haversine of #loc coords") pins down which pair of nodes the sentence
  // is describing, so this is a spec ambiguity rather than a parser bug.
  // This test documents what the code actually computes for both hops.
  const hotelToMountOfOlives = node("Legacy Ottoman Hotel").distanceToNext!;
  const mountOfOlivesToYadVashem = node("Mount of Olives").distanceToNext!;
  assert.ok(Math.abs(hotelToMountOfOlives - 2.19) < 0.01);
  assert.ok(Math.abs(mountOfOlivesToYadVashem - 6.62) < 0.01);
});
