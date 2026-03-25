import type { RoamTrip } from "../../types.js";
import type { Day } from "./days.js";

export interface ExpenseBreakdown {
  total: number;
  transport: number;
  stay: number;
  activities: number;
}

function isOvernight(trip: RoamTrip, nodeIndex: number): boolean {
  // A node is "overnight" if the next edge departs on a different date
  const node = trip[nodeIndex];
  if (!node || node.type !== "node" || !node.arrival) return false;

  const nextEdge = trip[nodeIndex + 1];
  if (!nextEdge || nextEdge.type !== "edge" || !nextEdge.departure) return false;

  return nextEdge.departure.date !== node.arrival.date;
}

export function calcExpenses(
  trip: RoamTrip,
  days: Day[],
  selectedDay: number | null,
): ExpenseBreakdown {
  const result: ExpenseBreakdown = { total: 0, transport: 0, stay: 0, activities: 0 };

  const startIdx = selectedDay !== null ? (days[selectedDay]?.startIndex ?? 0) : 0;
  const endIdx = selectedDay !== null ? (days[selectedDay]?.endIndex ?? trip.length - 1) : trip.length - 1;

  for (let i = startIdx; i <= endIdx; i++) {
    const item = trip[i];
    if (!item) continue;

    for (const cost of item.costs) {
      const amount = cost.amount;
      result.total += amount;

      if (item.type === "edge") {
        result.transport += amount;
      } else if (isOvernight(trip, i)) {
        result.stay += amount;
      } else {
        result.activities += amount;
      }
    }
  }

  return result;
}
