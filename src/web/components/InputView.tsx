import React, { useCallback, useEffect, useRef, useState } from "react";
import { parse } from "../../parser.js";
import { validate } from "../../validator.js";
import { deriveDays } from "../utils/days.js";
import { useTripDispatch } from "../context/TripContext.js";

const SAMPLE = `home | #loc(32.0853,34.7818) | @10.01.2026::08:30
  > train | $22\\ils
  > "Jerusalem central" | #loc(31.7890,35.2030) | @10.01.2026::10:10
  > walk
  > "Jaffa Gate" | #loc(31.7767,35.2297) | @10.01.2026::10:30 | $0
  > walk
  > "Abu Shukri" | #loc(31.7784,35.2297) | @10.01.2026::13:30 | ~$15\\ils | ? eat standing at the counter
  > walk | @10.01.2026::15:30
  > "Ramparts Walk" | #loc(31.7780,35.2310) | @10.01.2026::15:45 | $8\\ils | ?link:parks.org.il/ramparts
  > walk
  > "Legacy Ottoman Hotel" | #loc(31.7800,35.2260) | @10.01.2026::22:00 | $280\\ils
  > walk
  > "Mount of Olives" | #loc(31.7784,35.2460) | @11.01.2026::08:20 | $0 | ? go early — best light
  > bus | $5\\ils | @11.01.2026::10:30
  > "Yad Vashem" | #loc(31.7745,35.1756) | @11.01.2026::11:00 | $0 | ?link:yadvashem.org/visit`;

export function InputView() {
  const dispatch = useTripDispatch();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadRoam = useCallback(
    (raw: string) => {
      try {
        const trip = parse(raw);
        const errors = validate(trip);
        if (errors.length > 0) {
          setError(errors.map((e) => `[${e.index}] ${e.message}`).join("\n"));
          return;
        }
        const days = deriveDays(trip);
        dispatch({ type: "SET_TRIP", trip, days });
        setError(null);
      } catch (e: any) {
        setError(e.message ?? "Parse error");
      }
    },
    [dispatch],
  );

  // Check URL for ?roam=base64 on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("roam");
    if (b64) {
      try {
        const raw = atob(b64);
        setText(raw);
        loadRoam(raw);
      } catch {
        setError("Invalid base64 in URL");
      }
    }
  }, [loadRoam]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      setText(raw);
      loadRoam(raw);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="input-view">
      <div className="input-header">
        <h1>Roam</h1>
        <p>Drop a <code>.roam</code> file, paste your trip, or try the sample.</p>
      </div>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".roam,.txt"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <span>Drop .roam file here or click to browse</span>
      </div>

      <textarea
        className="roam-editor"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your .roam trip here..."
        spellCheck={false}
      />

      {error && <pre className="error">{error}</pre>}

      <div className="input-actions">
        <button className="btn primary" onClick={() => loadRoam(text)} disabled={!text.trim()}>
          Parse & View
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            setText(SAMPLE);
            loadRoam(SAMPLE);
          }}
        >
          Load Sample
        </button>
      </div>
    </div>
  );
}
