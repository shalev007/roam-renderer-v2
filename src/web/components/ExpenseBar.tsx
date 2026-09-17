import React from "react";
import { useTrip } from "../context/TripContext.js";

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCurrency(currency: string): string {
  const symbols: Record<string, string> = {
    ils: "₪",
    eur: "€",
    usd: "$",
    gbp: "£",
  };
  return symbols[currency.toLowerCase()] ?? currency.toUpperCase();
}

export function ExpenseBar() {
  const { agg, selectedDay } = useTrip();
  if (!agg) return null;

  const src = selectedDay !== null ? agg.days[selectedDay] : agg;
  if (!src) return null;

  const costItems = src.costsByCurrency.map((c) => {
    let value = `${formatCurrency(c.currency)}${c.total.toFixed(0)}`;
    if (c.approximate > 0 && c.optional > 0) {
      value += ` (~${c.approximate.toFixed(0)} approx, ${c.optional.toFixed(0)} optional)`;
    } else if (c.approximate > 0) {
      value += ` (~${c.approximate.toFixed(0)} approx)`;
    } else if (c.optional > 0) {
      value += ` (+${c.optional.toFixed(0)} optional)`;
    }
    return { label: "Cost", value };
  });

  const items = [
    ...costItems,
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
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="expense-item">
          <span className="expense-value">{item.value}</span>
          <span className="expense-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
