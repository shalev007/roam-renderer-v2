import { useEffect, useRef } from "react";
import L from "leaflet";
import { useTrip, useTripDispatch } from "../context/TripContext.js";
import type { DerivedNode, Timestamp } from "../../types.js";

const TEAL = "#0d9488";
const BLUE = "#3b82f6";
const DIM = 0.25;

function formatTime(ts?: Timestamp): string {
  if (!ts) return "";
  return `${ts.time} · ${ts.date}`;
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function getDayForIndex(days: { startIndex: number; endIndex: number }[], index: number): number | null {
  for (let d = 0; d < days.length; d++) {
    const day = days[d]!;
    if (index >= day.startIndex && index <= day.endIndex) return d;
  }
  return null;
}

export function TripMap() {
  const { trip, agg, selectedDay, selectedNode } = useTrip();
  const dispatch = useTripDispatch();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  const days = agg?.days ?? [];

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
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !trip) return;

    layer.clearLayers();
    markersRef.current.clear();

    const locNodes: { node: DerivedNode; index: number; latLng: L.LatLng }[] = [];
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

    // Polyline segments
    for (let s = 0; s < locNodes.length - 1; s++) {
      const from = locNodes[s]!;
      const to = locNodes[s + 1]!;
      const fromDay = getDayForIndex(days, from.index);
      const toDay = getDayForIndex(days, to.index);
      const dimmed = selectedDay !== null && fromDay !== selectedDay && toDay !== selectedDay;

      L.polyline([from.latLng, to.latLng], {
        color: dimmed ? "#cbd5e1" : TEAL,
        weight: dimmed ? 2 : 3,
        opacity: dimmed ? DIM : 0.8,
        dashArray: dimmed ? "4 6" : undefined,
      }).addTo(layer);
    }

    // Markers
    for (const ln of locNodes) {
      const day = getDayForIndex(days, ln.index);
      const dimmed = selectedDay !== null && day !== selectedDay;
      const overnight = ln.node.duration !== undefined && ln.node.duration >= 360; // 6h+
      const color = overnight ? BLUE : TEAL;

      let popup = `<strong>${ln.node.name}</strong>`;
      if (ln.node.arrival) popup += `<br/>${formatTime(ln.node.arrival)}`;

      if (ln.node.duration !== undefined) {
        popup += `<br/>Stay: <b>${fmtDuration(ln.node.duration)}</b>`;
      }

      if (ln.node.distanceToNext !== undefined) {
        popup += `<br/>Next stop: ${fmtDistance(ln.node.distanceToNext)} (straight-line)`;
      }

      // Edge info (travel time, speed)
      const nextEdge = trip[ln.index + 1];
      if (nextEdge?.type === "edge") {
        if (nextEdge.travelTime !== undefined) {
          popup += `<br/>Travel: ${fmtDuration(nextEdge.travelTime)} by ${nextEdge.mode}`;
        }
        if (nextEdge.speed !== undefined) {
          popup += ` (${Math.round(nextEdge.speed)} km/h)`;
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
        .on("click", () => dispatch({ type: "SELECT_NODE", node: ln.index }))
        .addTo(layer);

      markersRef.current.set(ln.index, marker);
    }

    const bounds = L.latLngBounds(locNodes.map((n) => n.latLng));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [trip, days, selectedDay, dispatch]);

  useEffect(() => {
    if (selectedNode === null) return;
    const marker = markersRef.current.get(selectedNode);
    if (marker) {
      marker.openPopup();
      mapRef.current?.panTo(marker.getLatLng());
    }
  }, [selectedNode]);

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
