import React from "react";
import * as FishermanHut from "../../buildings_logic/fisherman_hut";
import GameModel from "../../game/core/GameModel";
import { panelStyle, btnStyle } from "./styles";

export default function FishermanHutPanel({ data, onClose, destroyButton }) {
  const workers = data.workers || [];
  const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
  const canAssignFisherman = workers.length < 2 && GameModel.professions.fisherman > 0;
  const canUnassign = workers.length > 0;
  const canPickTile = workers.length > 0;

  const assign = (type) => {
    FishermanHut.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
  };
  const unassign = () => {
    FishermanHut.unassignLastWorker(window.__phaserScene, data.rootX, data.rootY);
  };
  const pickTile = () => {
    window.__pickFisherTile = { x: data.rootX, y: data.rootY };
    window.__pickMode = "fisherman_hut";
  };
  const clearTile = () => {
    FishermanHut.clearTargetTile(window.__phaserScene, data.rootX, data.rootY);
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>Fisherman Hut</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div>Workers: {workers.map((w) => w.type).join(", ") || "-"}</div>
      <div>Efficiency: {data.efficiency}%</div>
      <div>Assigned water tile: {data.targetTile ? `${data.targetTile.x},${data.targetTile.y}` : "-"}</div>
      <div style={{ marginTop: 8 }}>
        <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>
          Assign villager (+15%)
        </button>
        <button style={btnStyle} disabled={!canAssignFisherman} onClick={() => assign("fisherman")}>
          Assign fisherman (+50%)
        </button>
        <button style={btnStyle} disabled={!canUnassign} onClick={unassign}>
          Unassign last
        </button>
      </div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          style={{
            ...btnStyle,
            background: canPickTile ? "#2e7d32" : "#3a3a3a",
            border: canPickTile ? "1px solid #3fa143" : "1px solid #555",
          }}
          disabled={!canPickTile}
          onClick={pickTile}
          title={canPickTile ? "Click to choose a nearby water tile" : "Assign requires at least 1 worker; then choose a nearby water tile"}
        >
          Assign fish tile
        </button>
        <button style={btnStyle} disabled={!data.targetTile} onClick={clearTile}>
          Unassign tile
        </button>
      </div>
      {!canPickTile && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Tip: assign at least one worker, then select a water tile within range.
        </div>
      )}
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Production starts when workers assigned and a water tile is selected nearby. 100% efficiency yields +1 fish/20s.
      </p>
    </div>
  );
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

