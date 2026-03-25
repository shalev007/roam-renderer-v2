import type { RoamTrip } from "../../types.js";

export interface Day {
  date: string; // DD.MM.YYYY
  label: string; // "Day 1", "Day 2", etc.
  startIndex: number; // first chain index in this day
  endIndex: number; // last chain index in this day (inclusive)
}

export function deriveDays(trip: RoamTrip): Day[] {
  const days: Day[] = [];
  let currentDate: string | null = null;
  let dayNum = 0;

  for (let i = 0; i < trip.length; i++) {
    const item = trip[i]!;
    const ts = item.type === "node" ? item.arrival : item.departure;
    if (!ts) continue;

    const date = ts.date;
    if (date !== currentDate) {
      currentDate = date;
      dayNum++;
      days.push({
        date,
        label: `Day ${dayNum}`,
        startIndex: i,
        endIndex: i,
      });
    } else {
      days[days.length - 1]!.endIndex = i;
    }
  }

  // Extend each day's endIndex to include trailing edges/nodes without timestamps
  for (let d = 0; d < days.length - 1; d++) {
    days[d]!.endIndex = days[d + 1]!.startIndex - 1;
  }
  if (days.length > 0) {
    days[days.length - 1]!.endIndex = trip.length - 1;
  }

  return days;
}

export function getDayForIndex(days: Day[], index: number): number | null {
  for (let d = 0; d < days.length; d++) {
    const day = days[d]!;
    if (index >= day.startIndex && index <= day.endIndex) return d;
  }
  return null;
}
