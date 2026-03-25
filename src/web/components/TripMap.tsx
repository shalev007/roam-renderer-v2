import { useEffect, useRef } from "react";
import L from "leaflet";
import { useTrip, useTripDispatch } from "../context/TripContext.js";
import { getDayForIndex } from "../utils/days.js";
import type { RoamNode, Timestamp } from "../../types.js";

const TEAL = "#0d9488";
const BLUE = "#3b82f6";
const DIM = 0.25;

function formatTime(ts?: Timestamp): string {
  if (!ts) return "";
  return `${ts.time} · ${ts.date}`;
}

function isOvernight(nodes: { node: RoamNode; index: number }[], idx: number, trip: any[]): boolean {
  const node = trip[idx];
  if (!node || node.type !== "node" || !node.arrival) return false;
  const nextEdge = trip[idx + 1];
  if (!nextEdge || nextEdge.type !== "edge" || !nextEdge.departure) return false;
  return nextEdge.departure.date !== node.arrival.date;
}

export function TripMap() {
  const { trip, days, selectedDay, selectedNode } = useTrip();
  const dispatch = useTripDispatch();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = L.map(mapContainer.current, { zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.setView([31.78, 35.22], 13);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw trip
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !trip) return;

    layer.clearLayers();
    markersRef.current.clear();

    // Collect nodes with locations
    const locNodes: { node: RoamNode; index: number; latLng: L.LatLng }[] = [];
    for (let i = 0; i < trip.length; i++) {
      const item = trip[i]!;
      if (item.type === "node" && item.location) {
        locNodes.push({
          node: item,
          index: i,
          latLng: L.latLng(item.location.lat, item.location.lng),
        });
      }
    }

    if (locNodes.length === 0) return;

    // Draw polyline segments
    for (let s = 0; s < locNodes.length - 1; s++) {
      const from = locNodes[s]!;
      const to = locNodes[s + 1]!;
      const fromDay = getDayForIndex(days, from.index);
      const toDay = getDayForIndex(days, to.index);
      const dimmed =
        selectedDay !== null && fromDay !== selectedDay && toDay !== selectedDay;

      L.polyline([from.latLng, to.latLng], {
        color: dimmed ? "#cbd5e1" : TEAL,
        weight: dimmed ? 2 : 3,
        opacity: dimmed ? DIM : 0.8,
        dashArray: dimmed ? "4 6" : undefined,
      }).addTo(layer);
    }

    // Draw markers
    for (const ln of locNodes) {
      const day = getDayForIndex(days, ln.index);
      const dimmed = selectedDay !== null && day !== selectedDay;
      const overnight = isOvernight(locNodes, ln.index, trip);
      const color = overnight ? BLUE : TEAL;

      // Build popup
      let popup = `<strong>${ln.node.name}</strong>`;
      if (ln.node.arrival) popup += `<br/>${formatTime(ln.node.arrival)}`;

      // Duration: time until next edge departs
      const nextEdge = trip[ln.index + 1];
      if (ln.node.arrival && nextEdge?.type === "edge" && nextEdge.departure) {
        const arr = new Date(
          `${ln.node.arrival.date.split(".").reverse().join("-")}T${ln.node.arrival.time}:00`,
        );
        const dep = new Date(
          `${nextEdge.departure.date.split(".").reverse().join("-")}T${nextEdge.departure.time}:00`,
        );
        const mins = Math.round((dep.getTime() - arr.getTime()) / 60000);
        if (mins > 0) {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          popup += `<br/>Duration: ${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
        }
      }

      for (const c of ln.node.costs) {
        if (c.amount > 0) {
          popup += `<br/>${c.approximate ? "~" : ""}${c.amount} ${c.currency.toUpperCase()}${c.label ? ` (${c.label})` : ""}`;
        }
      }
      for (const n of ln.node.notes) {
        if (n.type === "link") {
          popup += `<br/><a href="https://${n.value}" target="_blank">${n.value}</a>`;
        } else {
          popup += `<br/><em>${n.value}</em>`;
        }
      }

      const marker = L.circleMarker(ln.latLng, {
        radius: 7,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: dimmed ? DIM : 0.9,
        opacity: dimmed ? DIM : 1,
      })
        .bindPopup(popup)
        .on("click", () => {
          dispatch({ type: "SELECT_NODE", node: ln.index });
        })
        .addTo(layer);

      markersRef.current.set(ln.index, marker);
    }

    // Fit bounds
    const bounds = L.latLngBounds(locNodes.map((n) => n.latLng));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [trip, days, selectedDay, dispatch]);

  // Open popup when selectedNode changes
  useEffect(() => {
    if (selectedNode === null) return;
    const marker = markersRef.current.get(selectedNode);
    if (marker) {
      marker.openPopup();
      mapRef.current?.panTo(marker.getLatLng());
    }
  }, [selectedNode]);

  // Fit to day bounds when day is selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !trip || selectedDay === null) return;

    const day = days[selectedDay];
    if (!day) return;

    const points: L.LatLng[] = [];
    for (let i = day.startIndex; i <= day.endIndex; i++) {
      const item = trip[i];
      if (item?.type === "node" && item.location) {
        points.push(L.latLng(item.location.lat, item.location.lng));
      }
    }
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [80, 80] });
    }
  }, [selectedDay, days, trip]);

  return <div ref={mapContainer} className="trip-map" />;
}
