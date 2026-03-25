import React, { createContext, useContext, useReducer } from "react";
import type { RoamTrip } from "../../types.js";
import type { Day } from "../utils/days.js";

export interface TripState {
  trip: RoamTrip | null;
  days: Day[];
  selectedDay: number | null; // index into days[], null = all
  selectedNode: number | null; // index into trip chain (only node indices)
}

type Action =
  | { type: "SET_TRIP"; trip: RoamTrip; days: Day[] }
  | { type: "SELECT_DAY"; day: number | null }
  | { type: "SELECT_NODE"; node: number | null };

const initialState: TripState = {
  trip: null,
  days: [],
  selectedDay: null,
  selectedNode: null,
};

function reducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case "SET_TRIP":
      return { ...initialState, trip: action.trip, days: action.days };
    case "SELECT_DAY":
      return { ...state, selectedDay: action.day, selectedNode: null };
    case "SELECT_NODE":
      return { ...state, selectedNode: action.node };
  }
}

const TripContext = createContext<TripState>(initialState);
const TripDispatchContext = createContext<React.Dispatch<Action>>(() => {});

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <TripContext.Provider value={state}>
      <TripDispatchContext.Provider value={dispatch}>
        {children}
      </TripDispatchContext.Provider>
    </TripContext.Provider>
  );
}

export function useTrip() {
  return useContext(TripContext);
}

export function useTripDispatch() {
  return useContext(TripDispatchContext);
}
