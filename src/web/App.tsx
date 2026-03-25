import React from "react";
import { TripProvider, useTrip } from "./context/TripContext.js";
import { InputView } from "./components/InputView.js";
import { TripMap } from "./components/TripMap.js";
import { Timeline } from "./components/Timeline.js";
import { ExpenseBar } from "./components/ExpenseBar.js";
import { DayChips } from "./components/DayChips.js";

function TripViewer() {
  const { trip } = useTrip();

  if (!trip) return <InputView />;

  return (
    <div className="viewer">
      <DayChips />
      <div className="map-container">
        <TripMap />
        <ExpenseBar />
      </div>
      <Timeline />
    </div>
  );
}

export function App() {
  return (
    <TripProvider>
      <TripViewer />
    </TripProvider>
  );
}
