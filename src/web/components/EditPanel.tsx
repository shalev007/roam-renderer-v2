import React, { useEffect, useState } from "react";
import type { RoamNode, Cost, Note } from "../../types.js";

interface EditPanelProps {
  node: RoamNode;
  onSave: (updates: Partial<RoamNode>) => void;
  onClose: () => void;
}

export function EditPanel({ node, onSave, onClose }: EditPanelProps) {
  const [name, setName] = useState(node.name);
  const [arrivalDate, setArrivalDate] = useState(node.arrival?.date ?? "");
  const [arrivalTime, setArrivalTime] = useState(node.arrival?.time ?? "");
  const [costs, setCosts] = useState<Cost[]>(node.costs);
  const [notes, setNotes] = useState<Note[]>(node.notes);
  const [tags, setTags] = useState<string[]>(node.tags);

  // Reset state when node changes
  useEffect(() => {
    setName(node.name);
    setArrivalDate(node.arrival?.date ?? "");
    setArrivalTime(node.arrival?.time ?? "");
    setCosts(node.costs);
    setNotes(node.notes);
    setTags(node.tags);
  }, [node]);

  const handleSave = () => {
    const updates: Partial<RoamNode> = {
      name,
      costs,
      notes,
      tags,
    };

    if (arrivalDate && arrivalTime) {
      updates.arrival = {
        date: arrivalDate,
        time: arrivalTime,
        raw: `${arrivalDate}::${arrivalTime}`,
      };
    } else if (!arrivalDate && !arrivalTime) {
      updates.arrival = undefined;
    }

    onSave(updates);
  };

  const addCost = () => {
    setCosts([...costs, { amount: 0, currency: "ils", approximate: false, optional: false }]);
  };

  const updateCost = (index: number, field: keyof Cost, value: any) => {
    const updated = costs.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setCosts(updated);
  };

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const addNote = () => {
    setNotes([...notes, { type: "text", value: "" }]);
  };

  const updateNote = (index: number, value: string) => {
    const updated = notes.map((n, i) => (i === index ? { ...n, value } : n));
    setNotes(updated);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const addTag = () => {
    setTags([...tags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    const updated = tags.map((t, i) => (i === index ? value : t));
    setTags(updated);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <h3>Edit Stop</h3>
        <button className="btn-close" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="edit-panel-content">
        <div className="edit-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Place name"
          />
        </div>

        <div className="edit-field">
          <label>Arrival Time</label>
          <div className="edit-field-row">
            <input
              type="text"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              placeholder="DD.MM.YYYY"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              placeholder="HH:mm"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="edit-field">
          <label>
            Costs
            <button className="btn-add" onClick={addCost} title="Add cost">
              +
            </button>
          </label>
          {costs.map((cost, i) => (
            <div key={i} className="edit-field-row">
              <input
                type="number"
                value={cost.amount}
                onChange={(e) => updateCost(i, "amount", parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={{ width: "80px" }}
              />
              <input
                type="text"
                value={cost.currency}
                onChange={(e) => updateCost(i, "currency", e.target.value)}
                placeholder="ils"
                style={{ width: "60px" }}
              />
              <label title="Approximate">
                <input
                  type="checkbox"
                  checked={cost.approximate}
                  onChange={(e) => updateCost(i, "approximate", e.target.checked)}
                />
                ~
              </label>
              <label title="Optional">
                <input
                  type="checkbox"
                  checked={cost.optional}
                  onChange={(e) => updateCost(i, "optional", e.target.checked)}
                />
                ?
              </label>
              <button className="btn-remove" onClick={() => removeCost(i)} title="Remove">
                −
              </button>
            </div>
          ))}
        </div>

        <div className="edit-field">
          <label>
            Notes
            <button className="btn-add" onClick={addNote} title="Add note">
              +
            </button>
          </label>
          {notes.map((note, i) => (
            <div key={i} className="edit-field-row">
              <input
                type="text"
                value={note.value}
                onChange={(e) => updateNote(i, e.target.value)}
                placeholder={note.type === "link" ? "url" : "note text"}
                style={{ flex: 1 }}
              />
              <button className="btn-remove" onClick={() => removeNote(i)} title="Remove">
                −
              </button>
            </div>
          ))}
        </div>

        <div className="edit-field">
          <label>
            Tags
            <button className="btn-add" onClick={addTag} title="Add tag">
              +
            </button>
          </label>
          {tags.map((tag, i) => (
            <div key={i} className="edit-field-row">
              <input
                type="text"
                value={tag}
                onChange={(e) => updateTag(i, e.target.value)}
                placeholder="tag"
                style={{ flex: 1 }}
              />
              <button className="btn-remove" onClick={() => removeTag(i)} title="Remove">
                −
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="edit-panel-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Apply Changes
        </button>
      </div>
    </div>
  );
}
