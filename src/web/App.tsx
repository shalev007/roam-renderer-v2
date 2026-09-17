import React, { useCallback, useEffect, useRef, useState } from "react";
import { TripProvider, useTrip, useTripDispatch } from "./context/TripContext.js";
import { parse } from "../parser.js";
import { validate } from "../validator.js";
import { derive, aggregate } from "../derive.js";
import { TripMap } from "./components/TripMap.js";
import { Timeline } from "./components/Timeline.js";
import { ExpenseBar } from "./components/ExpenseBar.js";
import { DayChips } from "./components/DayChips.js";

const SAMPLE = `## @10.01.2026 "Jerusalem Day Trip"

home | #loc(32.0853,34.7818) | @10.01.2026::08:30
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

function Editor() {
  const dispatch = useTripDispatch();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const loadRoam = useCallback(
    (raw: string) => {
      try {
        const parsed = parse(raw);
        const errors = validate(parsed);
        if (errors.length > 0) {
          setError(errors.map((e) => `Line ${e.index}: ${e.message}`).join("\n"));
          return;
        }
        const trip = derive(parsed);
        const agg = aggregate(trip);
        dispatch({ type: "SET_TRIP", trip, agg });
        setError(null);
      } catch (e: any) {
        setError(e.message ?? "Parse error");
      }
    },
    [dispatch],
  );

  // Debounced parsing on text change
  useEffect(() => {
    if (!text.trim()) return;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      loadRoam(text);
    }, 500);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, loadRoam]);

  // Load from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("roam");
    if (b64) {
      try {
        const raw = atob(b64);
        setText(raw);
      } catch {
        setError("Invalid base64 in URL");
      }
    }
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      setText(raw);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCopyLink = () => {
    const b64 = btoa(text);
    const url = `${window.location.origin}${window.location.pathname}?roam=${b64}`;
    
    // URL length limit check (most browsers support ~2000 chars safely)
    if (url.length > 2000) {
      setError("Trip is too long to share as URL (> 2000 chars). Download the .roam file or copy the text instead.");
      return;
    }
    
    navigator.clipboard.writeText(url);
    // Optional: show success feedback
    const originalError = error;
    setError("✓ Link copied to clipboard!");
    setTimeout(() => setError(originalError), 2000);
  };

  const handleClear = () => {
    setText("");
    setError(null);
    dispatch({ type: "SET_TRIP", trip: null, agg: null });
  };

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h1>Roam</h1>
        <div className="editor-actions">
          <button
            className="btn-icon"
            onClick={() => fileRef.current?.click()}
            title="Open .roam file"
          >
            📁
          </button>
          <button
            className="btn-icon"
            onClick={() => { setText(SAMPLE); }}
            title="Load sample"
          >
            📋
          </button>
          <button
            className="btn-icon"
            onClick={handleCopyLink}
            disabled={!text.trim()}
            title="Copy shareable link"
          >
            🔗
          </button>
          <button
            className="btn-icon"
            onClick={handleClear}
            disabled={!text.trim()}
            title="Clear trip"
          >
            🗑️
          </button>
        </div>
      </div>

      <div
        className={`editor-drop-target ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          className="roam-editor-main"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your .roam trip here, or drag & drop a .roam file..."
          spellCheck={false}
        />
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
      </div>

      {error && <pre className="error">{error}</pre>}
    </div>
  );
}

function Viewer() {
  const { trip, agg } = useTrip();

  const handleCopyPrompt = async () => {
    try {
      const response = await fetch("/roam_prompt.md");
      const prompt = await response.text();
      await navigator.clipboard.writeText(prompt);
    } catch (e) {
      console.error("Failed to copy prompt:", e);
    }
  };

  if (!trip || !agg) {
    return (
      <div className="viewer-panel viewer-empty">
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h2>Live Preview</h2>
          <p>Edit your .roam file on the left to see your trip update here</p>
          
          <div className="empty-help">
            <h3>✨ How to use with AI</h3>
            <ol>
              <li>Copy the LLM prompt below</li>
              <li>Paste it into any LLM (ChatGPT, Claude, etc.)</li>
              <li>Describe your trip</li>
              <li>Paste the generated <code>.roam</code> code into the editor</li>
            </ol>
            <button className="btn-primary" onClick={handleCopyPrompt}>
              📋 Copy LLM Prompt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-panel">
      <DayChips />
      <div className="map-container">
        <TripMap />
        <ExpenseBar />
      </div>
      <Timeline />
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-layout">
      <Editor />
      <Viewer />
    </div>
  );
}

export function App() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
