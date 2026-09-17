import type { Cost, DayHeader, Location, Note, RoamEdge, RoamNode, RoamTrip, Timestamp } from "./types.js";

function parseTimestamp(raw: string): Timestamp {
  const cleaned = raw.replace(/^@/, "");
  const parts = cleaned.split("::");
  return { date: parts[0] ?? "", time: parts[1] ?? "", raw: cleaned };
}

function parseLocation(raw: string): Location {
  const match = raw.match(/^#loc\(([-\d.]+),([-\d.]+)\)$/);
  if (!match) throw new Error(`Invalid location: ${raw}`);
  return { lat: parseFloat(match[1]!), lng: parseFloat(match[2]!) };
}

function parseCost(raw: string): Cost {
  let s = raw;
  const approximate = s.startsWith("~");
  if (approximate) s = s.slice(1);

  const optional = s.endsWith("?");
  if (optional) s = s.slice(0, -1);

  const match = s.match(/^\$([\d.]+)(?:\\(\w+))?(?::(.+))?$/);
  if (!match) throw new Error(`Invalid cost: ${raw}`);

  return {
    amount: parseFloat(match[1]!),
    currency: match[2] ?? "",
    approximate,
    label: match[3],
    optional,
  };
}

function parseNote(raw: string): Note {
  const trimmed = raw.replace(/^\?\s*/, "");
  if (trimmed.startsWith("link:")) {
    return { type: "link", value: trimmed.slice(5) };
  }
  return { type: "text", value: trimmed };
}

function parseProperties(props: string[]) {
  const result: {
    location?: Location;
    timestamp?: Timestamp;
    costs: Cost[];
    notes: Note[];
    tags: string[];
  } = { costs: [], notes: [], tags: [] };

  for (const prop of props) {
    const p = prop.trim();
    if (!p) continue;

    if (p.startsWith("@")) {
      result.timestamp = parseTimestamp(p);
    } else if (p.startsWith("#loc(")) {
      result.location = parseLocation(p);
    } else if (p.startsWith("#")) {
      result.tags.push(p.slice(1));
    } else if (p.startsWith("$") || p.startsWith("~$")) {
      result.costs.push(parseCost(p));
    } else if (p.startsWith("?")) {
      result.notes.push(parseNote(p));
    }
  }

  return result;
}

function splitProperties(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "|" && !inQuotes) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDayHeader(line: string): DayHeader | null {
  const match = line.match(/^##\s*@([\d.]+)(?:\s+"([^"]+)")?/);
  if (!match) return null;
  return {
    type: "dayheader",
    date: match[1]!,
    label: match[2] ?? "",
  };
}

export function parse(input: string): RoamTrip {
  const lines = input.split("\n").filter((l) => l.trim());
  const chain: RoamTrip = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse day headers
    if (trimmed.startsWith("##")) {
      const header = parseDayHeader(trimmed);
      if (header) chain.push(header);
      continue;
    }

    if (trimmed.startsWith(">")) {
      const content = trimmed.slice(1).trim();
      const parts = splitProperties(content);
      const firstPart = parts[0] ?? "";

      const isEdge =
        !firstPart.startsWith('"') &&
        !firstPart.startsWith("@") &&
        !firstPart.startsWith("#") &&
        !firstPart.startsWith("$") &&
        !firstPart.startsWith("?") &&
        /^[a-z][\w-]*$/.test(firstPart);

      if (isEdge) {
        const props = parseProperties(parts.slice(1));
        const edge: RoamEdge = {
          type: "edge",
          mode: firstPart,
          departure: props.timestamp,
          costs: props.costs,
          notes: props.notes,
        };
        chain.push(edge);
      } else {
        const props = parseProperties(parts.slice(1));
        const node: RoamNode = {
          type: "node",
          name: parseName(firstPart),
          location: props.location,
          arrival: props.timestamp,
          costs: props.costs,
          notes: props.notes,
          tags: props.tags,
        };
        chain.push(node);
      }
    } else {
      const parts = splitProperties(trimmed);
      const props = parseProperties(parts.slice(1));
      const node: RoamNode = {
        type: "node",
        name: parseName(parts[0] ?? ""),
        location: props.location,
        arrival: props.timestamp,
        costs: props.costs,
        notes: props.notes,
        tags: props.tags,
      };
      chain.push(node);
    }
  }

  return chain;
}
