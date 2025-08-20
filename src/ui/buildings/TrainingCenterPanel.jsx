import React from "react";
import EventBus from "../../game/events/eventBus";
import { panelStyle, btnStyle, btnDestroy } from "./styles";

export default function TrainingCenterPanel({ data, onClose, destroyButton }) {
  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <strong>Training Center</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        Unemployed villagers available: <strong>{data.availableVillagers ?? 0}</strong>
      </div>
      {data.actions.map((a) => (
        <button
          key={a.key}
          style={btnStyle}
          onClick={() => EventBus.emit("train", { profession: a.key })}
        >
          {a.label}
        </button>
      ))}
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Training removes 1 villager from a house but keeps total population
        the same.
      </p>
    </div>
  );
}

