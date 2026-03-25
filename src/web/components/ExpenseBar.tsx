import React from "react";
import { useTrip } from "../context/TripContext.js";
import { calcExpenses } from "../utils/expenses.js";

export function ExpenseBar() {
  const { trip, days, selectedDay } = useTrip();
  if (!trip) return null;

  const exp = calcExpenses(trip, days, selectedDay);
  if (exp.total === 0) return null;

  const items = [
    { label: "Total", value: exp.total },
    { label: "Transport", value: exp.transport },
    { label: "Stay", value: exp.stay },
    { label: "Activities", value: exp.activities },
  ];

  return (
    <div className="expense-bar">
      {items.map((item) => (
        <div key={item.label} className="expense-item">
          <span className="expense-value">{item.value > 0 ? `${item.value}` : "–"}</span>
          <span className="expense-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
