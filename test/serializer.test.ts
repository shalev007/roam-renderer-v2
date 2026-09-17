import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serialize, updateNode } from "../src/serializer.js";
import { parse } from "../src/parser.js";
import type { RoamNode, Cost, Timestamp } from "../src/types.js";

describe("serializer", () => {
  it("should serialize a simple node", () => {
    const node: RoamNode = {
      type: "node",
      name: "home",
      costs: [],
      notes: [],
      tags: [],
    };
    const result = serialize([node]);
    assert.equal(result, "home");
  });

  it("should serialize node with location and timestamp", () => {
    const node: RoamNode = {
      type: "node",
      name: "Jerusalem Central",
      location: { lat: 31.789, lng: 35.203 },
      arrival: { date: "10.01.2026", time: "10:10", raw: "10.01.2026::10:10" },
      costs: [],
      notes: [],
      tags: [],
    };
    const result = serialize([node]);
    assert.equal(
      result,
      '"Jerusalem Central" | #loc(31.789,35.203) | @10.01.2026::10:10'
    );
  });

  it("should serialize node with costs", () => {
    const node: RoamNode = {
      type: "node",
      name: "hotel",
      costs: [
        { amount: 280, currency: "ils", approximate: false, optional: false },
        { amount: 15, currency: "eur", approximate: true, optional: false },
      ],
      notes: [],
      tags: [],
    };
    const result = serialize([node]);
    assert.equal(result, "hotel | $280\\ils | ~$15\\eur");
  });

  it("should serialize node with notes and tags", () => {
    const node: RoamNode = {
      type: "node",
      name: "museum",
      costs: [],
      notes: [
        { type: "text", value: "free entry on Mondays" },
        { type: "link", value: "museum.org" },
      ],
      tags: ["culture", "art"],
      arrival: undefined,
    };
    const result = serialize([node]);
    assert.equal(
      result,
      "museum | ? free entry on Mondays | ?link:museum.org | #culture | #art"
    );
  });

  it("should serialize day header", () => {
    const trip = parse('## @10.01.2026 "Day One"\nhome');
    const result = serialize(trip);
    assert.equal(result, '## @10.01.2026 "Day One"\nhome');
  });

  it("should serialize chain with edge", () => {
    const roamText = `home | #loc(32.08,34.78) | @10.01.2026::08:30
  > train | $22\\ils
  > "Jerusalem Central" | #loc(31.78,35.20) | @10.01.2026::10:10`;

    const trip = parse(roamText);
    const result = serialize(trip);
    
    // Parse again to verify round-trip
    const reparsed = parse(result);
    assert.equal(reparsed.length, 3);
    assert.equal(reparsed[0]?.type, "node");
    assert.equal(reparsed[1]?.type, "edge");
    assert.equal(reparsed[2]?.type, "node");
  });

  it("should round-trip the spec worked example", () => {
    const original = `## @10.01.2026 "Jerusalem Day Trip"

home | #loc(32.0853,34.7818) | @10.01.2026::08:30
  > train | $22\\ils
  > "Jerusalem central" | #loc(31.7890,35.2030) | @10.01.2026::10:10
  > walk
  > "Jaffa Gate" | #loc(31.7767,35.2297) | @10.01.2026::10:30 | $0`;

    const trip = parse(original);
    const serialized = serialize(trip);
    const reparsed = parse(serialized);

    // Verify structure is preserved
    assert.equal(reparsed.length, trip.length);
    assert.equal(reparsed[0]?.type, "dayheader");
    
    if (reparsed[1]?.type === "node") {
      assert.equal(reparsed[1].name, "home");
      assert.equal(reparsed[1].location?.lat, 32.0853);
    }
  });

  it("should update a node in place", () => {
    const original = `home | @10.01.2026::08:30
  > train
  > "office" | @10.01.2026::10:00`;

    const trip = parse(original);
    
    // Update the office node (index 2)
    const updated = updateNode(trip, 2, {
      name: "new office",
      arrival: { date: "10.01.2026", time: "10:30", raw: "10.01.2026::10:30" },
      costs: [{ amount: 50, currency: "ils", approximate: false, optional: false }],
    });

    const reparsed = parse(updated);
    const node = reparsed[2];
    
    assert.equal(node?.type, "node");
    if (node?.type === "node") {
      assert.equal(node.name, "new office");
      assert.equal(node.arrival?.time, "10:30");
      assert.equal(node.costs.length, 1);
      assert.equal(node.costs[0]?.amount, 50);
    }
  });

  it("should handle optional costs", () => {
    const node: RoamNode = {
      type: "node",
      name: "restaurant",
      costs: [
        { amount: 15, currency: "ils", approximate: true, optional: true, label: "tip" },
      ],
      notes: [],
      tags: [],
    };
    const result = serialize([node]);
    assert.equal(result, "restaurant | ~$15\\ils:tip?");
  });

  it("should preserve unedited parts of trip", () => {
    const original = `## @10.01.2026 "Day One"

home | #loc(32.08,34.78) | @10.01.2026::08:30 | #home
  > train | $22\\ils
  > office | #loc(31.78,35.20) | @10.01.2026::10:00 | ? bring laptop`;

    const trip = parse(original);
    
    // Update only the office node name
    const updated = updateNode(trip, 3, {
      name: "new office",
    });

    // Verify day header and home node are unchanged
    const reparsed = parse(updated);
    assert.equal(reparsed[0]?.type, "dayheader");
    if (reparsed[0]?.type === "dayheader") {
      assert.equal(reparsed[0].label, "Day One");
    }
    
    if (reparsed[1]?.type === "node") {
      assert.equal(reparsed[1].name, "home");
      assert.equal(reparsed[1].tags[0], "home");
    }
    
    // Verify edge is unchanged
    if (reparsed[2]?.type === "edge") {
      assert.equal(reparsed[2].mode, "train");
      assert.equal(reparsed[2].costs[0]?.amount, 22);
    }
    
    // Verify office node is updated
    if (reparsed[3]?.type === "node") {
      assert.equal(reparsed[3].name, "new office");
      assert.equal(reparsed[3].notes[0]?.value, "bring laptop");
    }
  });
});
