export interface Location {
  lat: number;
  lng: number;
}

export interface Cost {
  amount: number;
  currency: string;
  approximate: boolean;
  label?: string;
  optional: boolean;
}

export interface Note {
  type: "text" | "link";
  value: string;
}

export interface Timestamp {
  date: string;     // DD.MM.YYYY
  time: string;     // HH:mm
  raw: string;
}

export interface RoamNode {
  type: "node";
  name: string;
  location?: Location;
  arrival?: Timestamp;
  costs: Cost[];
  notes: Note[];
  tags: string[];
}

export interface RoamEdge {
  type: "edge";
  mode: string;
  departure?: Timestamp;
  costs: Cost[];
  notes: Note[];
}

// The trip is a flat linked list: [node, edge, node, edge, ..., node]
export type RoamChainItem = RoamNode | RoamEdge;
export type RoamTrip = RoamChainItem[];
