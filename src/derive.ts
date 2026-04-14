import type {
  DayAggregate,
  DerivedEdge,
  DerivedNode,
  DerivedTrip,
  Location,
  RoamTrip,
  Timestamp,
  TripAggregate,
} from "./types.js";

// ---- helpers ----

function toDate(ts: Timestamp): Date {
  const [day, month, year] = ts.date.split(".");
  return new Date(`${year}-${month}-${day}T${ts.time}:00`);
}

function diffMinutes(a: Timestamp, b: Timestamp): number {
  return (toDate(b).getTime() - toDate(a).getTime()) / 60_000;
}

/** Haversine distance in km */
function haversine(a: Location, b: Location): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

// ---- derive per-item fields ----

export function derive(trip: RoamTrip): DerivedTrip {
  const out: DerivedTrip = [];

  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;

    if (item.type === "node") {
      const node: DerivedNode = { ...item };

      // duration = time until next edge departs
      const nextEdge = trip[i + 1];
      if (node.arrival && nextEdge?.type === "edge" && nextEdge.departure) {
        const mins = diffMinutes(node.arrival, nextEdge.departure);
        if (mins >= 0) node.duration = mins;
      }

      // distanceToNext = haversine to next node with a location
      if (node.location) {
        for (let j = i + 1; j < trip.length; j++) {
          const next = trip[j]!;
          if (next.type === "node" && next.location) {
            node.distanceToNext = haversine(node.location, next.location);
            break;
          }
        }
      }

      out.push(node);
    } else {
      const edge: DerivedEdge = { ...item };

      // travelTime = departure → next node arrival
      const nextNode = trip[i + 1];
      if (edge.departure && nextNode?.type === "node" && nextNode.arrival) {
        const mins = diffMinutes(edge.departure, nextNode.arrival);
        if (mins >= 0) edge.travelTime = mins;
      }

      // distance = haversine between surrounding nodes
      const prevNode = trip[i - 1];
      if (
        prevNode?.type === "node" &&
        prevNode.location &&
        nextNode?.type === "node" &&
        nextNode.location
      ) {
        edge.distance = haversine(prevNode.location, nextNode.location);
      }

      // speed = distance / travelTime
      if (edge.distance !== undefined && edge.travelTime && edge.travelTime > 0) {
        edge.speed = edge.distance / (edge.travelTime / 60);
      }

      out.push(edge);
    }
  }

  return out;
}

// ---- aggregation ----

function deriveDayBoundaries(trip: DerivedTrip): { date: string; startIndex: number; endIndex: number }[] {
  const boundaries: { date: string; startIndex: number; endIndex: number }[] = [];
  let currentDate: string | null = null;

  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    const ts = item.type === "node" ? item.arrival : item.departure;
    if (!ts) continue;

    if (ts.date !== currentDate) {
      currentDate = ts.date;
      boundaries.push({ date: ts.date, startIndex: i, endIndex: i });
    } else {
      boundaries[boundaries.length - 1]!.endIndex = i;
    }
  }

  // extend to fill gaps (trailing items without timestamps)
  for (let d = 0; d < boundaries.length - 1; d++) {
    boundaries[d]!.endIndex = boundaries[d + 1]!.startIndex - 1;
  }
  if (boundaries.length > 0) {
    boundaries[boundaries.length - 1]!.endIndex = trip.length - 1;
  }

  return boundaries;
}

function aggregateRange(trip: DerivedTrip, start: number, end: number) {
  let totalCost = 0;
  let totalDuration = 0;
  let totalTravelTime = 0;
  let totalDistance = 0;

  for (let i = start; i <= end; i++) {
    const item = trip[i]!;
    for (const c of item.costs) totalCost += c.amount;

    if (item.type === "node" && item.duration !== undefined) {
      totalDuration += item.duration;
    }
    if (item.type === "edge") {
      if (item.travelTime !== undefined) totalTravelTime += item.travelTime;
      if (item.distance !== undefined) totalDistance += item.distance;
    }
  }

  return { totalCost, totalDuration, totalTravelTime, totalDistance };
}

export function aggregate(trip: DerivedTrip): TripAggregate {
  const bounds = deriveDayBoundaries(trip);

  const days: DayAggregate[] = bounds.map((b, i) => ({
    date: b.date,
    label: `Day ${i + 1}`,
    startIndex: b.startIndex,
    endIndex: b.endIndex,
    ...aggregateRange(trip, b.startIndex, b.endIndex),
  }));

  const totals = aggregateRange(trip, 0, trip.length - 1);

  return { ...totals, days };
}
