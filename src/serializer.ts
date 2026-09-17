import type {
  Cost,
  DayHeader,
  Location,
  Note,
  RoamChainItem,
  RoamEdge,
  RoamNode,
  RoamTrip,
  Timestamp,
} from "./types.js";

function serializeTimestamp(ts: Timestamp): string {
  return `@${ts.date}::${ts.time}`;
}

function serializeLocation(loc: Location): string {
  return `#loc(${loc.lat},${loc.lng})`;
}

function serializeCost(cost: Cost): string {
  let result = "";
  if (cost.approximate) result += "~";
  result += `$${cost.amount}`;
  if (cost.currency) result += `\\${cost.currency}`;
  if (cost.label) result += `:${cost.label}`;
  if (cost.optional) result += "?";
  return result;
}

function serializeNote(note: Note): string {
  if (note.type === "link") {
    return `?link:${note.value}`;
  }
  return `? ${note.value}`;
}

function serializeTag(tag: string): string {
  return `#${tag}`;
}

function needsQuotes(name: string): boolean {
  // Quote if contains spaces or special chars
  return /[\s|@#$?]/.test(name);
}

function serializeName(name: string): string {
  if (needsQuotes(name)) {
    return `"${name}"`;
  }
  return name;
}

function serializeDayHeader(header: DayHeader): string {
  if (header.label) {
    return `## @${header.date} "${header.label}"`;
  }
  return `## @${header.date}`;
}

function serializeNode(node: RoamNode, indent: boolean): string {
  const parts: string[] = [];
  
  parts.push(serializeName(node.name));
  
  if (node.location) {
    parts.push(serializeLocation(node.location));
  }
  
  if (node.arrival) {
    parts.push(serializeTimestamp(node.arrival));
  }
  
  for (const cost of node.costs) {
    parts.push(serializeCost(cost));
  }
  
  for (const note of node.notes) {
    parts.push(serializeNote(note));
  }
  
  for (const tag of node.tags) {
    parts.push(serializeTag(tag));
  }
  
  const line = parts.join(" | ");
  return indent ? `  > ${line}` : line;
}

function serializeEdge(edge: RoamEdge): string {
  const parts: string[] = [edge.mode];
  
  if (edge.departure) {
    parts.push(serializeTimestamp(edge.departure));
  }
  
  for (const cost of edge.costs) {
    parts.push(serializeCost(cost));
  }
  
  for (const note of edge.notes) {
    parts.push(serializeNote(note));
  }
  
  const line = parts.join(" | ");
  return `  > ${line}`;
}

function serializeItem(item: RoamChainItem, prevItem: RoamChainItem | null): string {
  if (item.type === "dayheader") {
    return serializeDayHeader(item);
  }
  
  if (item.type === "edge") {
    return serializeEdge(item);
  }
  
  // Node: indent if previous item was a node or edge
  const indent = prevItem !== null && prevItem.type !== "dayheader";
  return serializeNode(item, indent);
}

export function serialize(trip: RoamTrip): string {
  const lines: string[] = [];
  
  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    const prevItem = i > 0 ? trip[i - 1]! : null;
    lines.push(serializeItem(item, prevItem));
  }
  
  return lines.join("\n");
}

/**
 * Update a single node in the trip and return the serialized .roam text.
 * This is a helper for the edit panel to apply changes.
 */
export function updateNode(trip: RoamTrip, nodeIndex: number, updates: Partial<RoamNode>): string {
  const updatedTrip = trip.map((item, i) => {
    if (i === nodeIndex && item.type === "node") {
      return { ...item, ...updates };
    }
    return item;
  });
  return serialize(updatedTrip);
}
