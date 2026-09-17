import type { RoamTrip, Timestamp } from "./types.js";

export interface ValidationError {
  index: number;
  message: string;
}

function toDate(ts: Timestamp): Date {
  // DD.MM.YYYY::HH:mm
  const [day, month, year] = ts.date.split(".");
  return new Date(`${year}-${month}-${day}T${ts.time}:00`);
}

export function validate(trip: RoamTrip): ValidationError[] {
  const errors: ValidationError[] = [];

  if (trip.length === 0) {
    errors.push({ index: 0, message: "Trip is empty" });
    return errors;
  }

  // Find first non-dayheader item
  const firstNonHeader = trip.find(item => item.type !== "dayheader");
  if (firstNonHeader?.type !== "node") {
    errors.push({ index: 0, message: "Trip must start with a node (after any day headers), got edge" });
  }

  // Must end with a node
  const lastNonHeader = [...trip].reverse().find(item => item.type !== "dayheader");
  if (lastNonHeader?.type !== "node") {
    errors.push({ index: trip.length - 1, message: "Trip must end with a node, got edge" });
  }

  // Alternation: node, edge, node, edge, ..., node (skip dayheaders)
  let prevNonHeader: typeof trip[number] | null = null;
  for (let i = 0; i < trip.length; i++) {
    const curr = trip[i]!;
    if (curr.type === "dayheader") continue;

    if (prevNonHeader && prevNonHeader.type === curr.type) {
      const label = curr.type === "node" ? curr.name : curr.mode;
      errors.push({
        index: i,
        message: `Expected ${prevNonHeader.type === "node" ? "edge" : "node"} at position ${i}, got ${curr.type} ("${label}")`,
      });
    }
    prevNonHeader = curr;
  }

  // Timestamps must be monotonically non-decreasing
  let lastTime: { date: Date; index: number; label: string } | null = null;

  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    if (item.type === "dayheader") continue;
    const ts = item.type === "node" ? item.arrival : item.departure;
    if (!ts) continue;

    const date = toDate(ts);
    const label = item.type === "node" ? `node "${item.name}"` : `edge "${item.mode}"`;

    if (lastTime && date.getTime() < lastTime.date.getTime()) {
      errors.push({
        index: i,
        message: `Time goes backwards: ${label} at ${ts.raw} is before ${lastTime.label} at position ${lastTime.index}`,
      });
    }

    lastTime = { date, index: i, label };
  }

  // Nodes must have a name
  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    if (item.type === "node" && !item.name) {
      errors.push({ index: i, message: "Node is missing a name" });
    }
  }

  // Edges must have a mode
  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    if (item.type === "edge" && !item.mode) {
      errors.push({ index: i, message: "Edge is missing a transport mode" });
    }
  }

  return errors;
}
