import React from "react";
import { useTrip, useTripDispatch } from "../context/TripContext.js";
import { getDayForIndex } from "../utils/days.js";

const EDGE_COLORS: Record<string, string> = {
  walk: "#94a3b8",
  train: "#3b82f6",
  bus: "#f59e0b",
  flight: "#ec4899",
  taxi: "#8b5cf6",
};

function edgeColor(mode: string): string {
  return EDGE_COLORS[mode] ?? "#8b5cf6";
}

export function Timeline() {
  const { trip, days, selectedDay, selectedNode } = useTrip();
  const dispatch = useTripDispatch();

  if (!trip) return null;

  return (
    <div className="timeline">
      {days.map((day, di) => {
        const dimmed = selectedDay !== null && selectedDay !== di;
        const items = trip.slice(day.startIndex, day.endIndex + 1);
        const baseIndex = day.startIndex;

        return (
          <div
            key={di}
            className={`timeline-day ${dimmed ? "dimmed" : ""}`}
            onClick={() => dispatch({ type: "SELECT_DAY", day: selectedDay === di ? null : di })}
          >
            <div className="timeline-day-label">{day.label}</div>
            <div className="timeline-chain">
              {items.map((item, ii) => {
                const chainIdx = baseIndex + ii;
                if (item.type === "node") {
                  const isSelected = selectedNode === chainIdx;
                  const overnight = (() => {
                    if (!item.arrival) return false;
                    const next = trip[chainIdx + 1];
                    return next?.type === "edge" && next.departure
                      ? next.departure.date !== item.arrival.date
                      : false;
                  })();

                  return (
                    <div
                      key={ii}
                      className={`timeline-node ${isSelected ? "selected" : ""} ${overnight ? "overnight" : ""}`}
                      title={item.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "SELECT_NODE", node: chainIdx });
                      }}
                    >
                      <div className="timeline-dot" />
                      <span className="timeline-node-name">{item.name}</span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={ii}
                      className="timeline-edge"
                      style={{ backgroundColor: edgeColor(item.mode) }}
                      title={item.mode}
                    >
                      <span className="timeline-edge-label">{item.mode}</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
