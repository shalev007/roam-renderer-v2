import React from "react";
import { useTrip, useTripDispatch } from "../context/TripContext.js";
import type { DerivedEdge, DerivedNode } from "../../types.js";

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

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function Timeline() {
  const { trip, agg, selectedDay, selectedNode } = useTrip();
  const dispatch = useTripDispatch();

  if (!trip || !agg) return null;

  return (
    <div className="timeline">
      {agg.days.map((day, di) => {
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
                  const node = item as DerivedNode;
                  const isSelected = selectedNode === chainIdx;
                  const overnight = node.duration !== undefined && node.duration >= 360;

                  let title = node.name;
                  if (node.duration !== undefined) title += ` · ${fmtDuration(node.duration)}`;

                  return (
                    <div
                      key={ii}
                      className={`timeline-node ${isSelected ? "selected" : ""} ${overnight ? "overnight" : ""}`}
                      title={title}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "SELECT_NODE", node: chainIdx });
                      }}
                    >
                      <div className="timeline-dot" />
                      <span className="timeline-node-name">{node.name}</span>
                    </div>
                  );
                } else {
                  const edge = item as DerivedEdge;
                  let label = edge.mode;
                  if (edge.travelTime !== undefined) label += ` ${fmtDuration(edge.travelTime)}`;

                  return (
                    <div
                      key={ii}
                      className="timeline-edge"
                      style={{ backgroundColor: edgeColor(edge.mode) }}
                      title={label}
                    >
                      <span className="timeline-edge-label">{label}</span>
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
