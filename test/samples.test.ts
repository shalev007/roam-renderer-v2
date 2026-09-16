import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "../src/parser.js";
import { validate } from "../src/validator.js";

const cases = [
  { roam: "sample.roam", expected: "test/fixtures/sample.expected.json" },
  { roam: "sample-2.roam", expected: "test/fixtures/sample-2.expected.json" },
  { roam: "test.roam", expected: "test/fixtures/test.expected.json" },
];

for (const { roam, expected } of cases) {
  test(`${roam} is structurally valid per spec (starts/ends with node, alternates, monotonic time)`, () => {
    const trip = parse(readFileSync(roam, "utf-8"));
    assert.deepEqual(validate(trip), []);
  });

  test(`${roam} parses to the expected shape`, () => {
    const trip = parse(readFileSync(roam, "utf-8"));
    const want = JSON.parse(readFileSync(expected, "utf-8"));
    // Round-trip through JSON so `undefined`-valued keys (e.g. an edge with
    // no departure) drop out the same way they did when the fixture was
    // captured, instead of tripping deepEqual on key-presence alone.
    assert.deepEqual(JSON.parse(JSON.stringify(trip)), want);
  });
}
