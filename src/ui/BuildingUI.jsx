import React, { useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";
import { TILE_SIZE, TILE_TYPES } from "../game/core/constants";
import * as Lumberyard from "../buildings_logic/lumberyard";

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
    const incomeText = payload.incomePerInterval > 0
      ? `+${payload.incomePerInterval} gold every ${Math.round(payload.incomeIntervalMs / 1000)}s`
      : `No income until full`;
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>House</strong>
          <button onClick={onClose}>✕</button>
        </div>
        <div>Occupants: {payload.occupants}/{payload.capacity}</div>
        <div>Income: {incomeText}</div>
      </div>
    );
  }

  if (payload.type === "lumberyard") {
    const [tick, setTick] = useState(0);
    const workers = payload.workers || [];
    const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
    const canAssignForester = workers.length < 2 && GameModel.professions.forester > 0;
    const canUnassign = workers.length > 0;
    const canPickTile = workers.length > 0;

    const assign = (type) => {
      const ok = Lumberyard.assignWorker(window.__phaserScene, payload.rootX, payload.rootY, type);
      if (ok) setTick((t) => t + 1);
    };
    const unassign = () => {
      const ok = Lumberyard.unassignLastWorker(window.__phaserScene, payload.rootX, payload.rootY);
      if (ok) setTick((t) => t + 1);
    };
    const pickTile = () => {
      window.__pickLumberTile = { x: payload.rootX, y: payload.rootY };
    };

    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>Lumberyard</strong>
          <button onClick={onClose}>✕</button>
        </div>
        <div>Workers: {workers.map((w) => w.type).join(", ") || "-"}</div>
        <div>Efficiency: {payload.efficiency}%</div>
        <div style={{ marginTop: 8 }}>
          <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>Assign villager (+15%)</button>
          <button style={btnStyle} disabled={!canAssignForester} onClick={() => assign("forester")}>Assign forester (+50%)</button>
          <button style={btnStyle} disabled={!canUnassign} onClick={unassign}>Unassign last</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <button style={btnStyle} disabled={!canPickTile} onClick={pickTile}>Assign wood tile (nearby forest)</button>
        </div>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Production starts when workers assigned and a forest tile is selected nearby. 100% efficiency yields +1 wood/20s.</p>
      </div>
    );
  }

  if (payload.type === "farm") {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <strong>Farm</strong>
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ opacity: 0.8 }}>Coming soon: assign workers and create fields.</div>
      </div>
    );
  }

  return null;
}

function hasAnyVillager() {
  const grid = GameModel.gridData || [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[0]?.length || 0); x++) {
      const cell = grid[y][x];
      if (cell.buildingType === "house" && cell.root === cell && cell.villagers > 0) return true;
    }
  }
  return false;
}

const panelStyle = {
  position: "absolute",
  left: 12,
  bottom: 12,
  minWidth: 260,
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
