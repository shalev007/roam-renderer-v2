import React from "react";
import { useTrip } from "../context/TripContext.js";

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ExpenseBar() {
  const { agg, selectedDay } = useTrip();
  if (!agg) return null;

  const src = selectedDay !== null ? agg.days[selectedDay] : agg;
  if (!src) return null;

  const items = [
    { label: "Cost", value: src.totalCost > 0 ? `${src.totalCost}` : "–" },
    { label: "At places", value: src.totalDuration > 0 ? fmtDuration(src.totalDuration) : "–" },
    { label: "In transit", value: src.totalTravelTime > 0 ? fmtDuration(src.totalTravelTime) : "–" },
    { label: "Distance", value: src.totalDistance > 0 ? `${src.totalDistance.toFixed(1)} km` : "–" },
  ];

  return (
    <div className="expense-bar">
      {selectedDay !== null && agg.days[selectedDay] && (
        <div className="expense-item expense-day-label">
          <span className="expense-value">{agg.days[selectedDay]!.label}</span>
        </div>
      )}
      {items.map((item) => (
        <div key={item.label} className="expense-item">
          <span className="expense-value">{item.value}</span>
          <span className="expense-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
