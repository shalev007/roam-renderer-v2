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

// ---- Derived (computed, never in .roam file) ----

export interface DerivedNode extends RoamNode {
  /** Minutes spent at this place (until next edge departs) */
  duration?: number;
  /** Km to next node (haversine) */
  distanceToNext?: number;
}

export interface DerivedEdge extends RoamEdge {
  /** Minutes of travel (departure → next node arrival) */
  travelTime?: number;
  /** Km covered by this edge (haversine between surrounding nodes) */
  distance?: number;
  /** km/h */
  speed?: number;
}

export type DerivedChainItem = DerivedNode | DerivedEdge;
export type DerivedTrip = DerivedChainItem[];

export interface DayAggregate {
  date: string;
  label: string;
  startIndex: number;
  endIndex: number;
  totalCost: number;
  totalDuration: number;    // minutes at places
  totalTravelTime: number;  // minutes in transit
  totalDistance: number;     // km
}

export interface TripAggregate {
  totalCost: number;
  totalDuration: number;
  totalTravelTime: number;
  totalDistance: number;
  days: DayAggregate[];
}
