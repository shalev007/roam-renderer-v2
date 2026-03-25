import React from "react";
import { useTrip, useTripDispatch } from "../context/TripContext.js";

export function DayChips() {
  const { days, selectedDay } = useTrip();
  const dispatch = useTripDispatch();

  if (days.length === 0) return null;

  return (
    <div className="day-chips">
      <button
        className={`chip ${selectedDay === null ? "active" : ""}`}
        onClick={() => dispatch({ type: "SELECT_DAY", day: null })}
      >
        All days
      </button>
      {days.map((day, i) => (
        <button
          key={i}
          className={`chip ${selectedDay === i ? "active" : ""}`}
          onClick={() => dispatch({ type: "SELECT_DAY", day: i })}
        >
          {day.label}
          <span className="chip-date">{day.date}</span>
        </button>
      ))}
    </div>
  );
}
