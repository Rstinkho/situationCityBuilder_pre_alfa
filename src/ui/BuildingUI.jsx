import React from "react";
import EventBus from "../game/events/eventBus";

export default function BuildingUI({ open, payload, onClose }) {
  if (!open || !payload) return null;

  if (payload.type === "training_center") {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>Training Center</strong>
          <button onClick={onClose}>✕</button>
        </div>
        {payload.actions.map((a) => (
          <button key={a.key} style={btnStyle} onClick={() => EventBus.emit("train", { profession: a.key })}>
            {a.label}
          </button>
        ))}
        <p style={{ marginTop: 8, opacity: 0.8 }}>Training removes 1 villager from a house but keeps total population the same.</p>
      </div>
    );
  }

  if (payload.type === "house") {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>House</strong>
          <button onClick={onClose}>✕</button>
        </div>
        <div>Villagers: {payload.villagers}/{payload.capacity}</div>
        <div>Income when full: +{payload.income} gold/10s</div>
      </div>
    );
  }

  return null;
}

const panelStyle = {
  position: "absolute",
  left: 12,
  bottom: 12,
  minWidth: 240,
  background: "rgba(20,20,20,0.9)",
  color: "#fff",
  padding: 12,
  borderRadius: 8,
  fontFamily: "sans-serif",
  fontSize: 14,
};

const btnStyle = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  margin: "6px 0",
  borderRadius: 6,
  border: "1px solid #666",
  background: "#2a2a2a",
  color: "#fff",
  cursor: "pointer",
};
