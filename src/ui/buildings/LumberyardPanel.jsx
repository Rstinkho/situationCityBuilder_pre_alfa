import React from "react";
import * as Lumberyard from "../../buildings_logic/lumberyard";
import GameModel from "../../game/core/GameModel";
import { panelStyle, btnStyle } from "./styles";
import { BUILDING_TYPES } from "../../game/core/constants";

export default function LumberyardPanel({ data, onClose, destroyButton }) {
  const workers = data.workers || [];
  const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
  const canAssignForester = workers.length < 2 && GameModel.professions.forester > 0;
  const canUnassign = workers.length > 0;
  const canPickTile = workers.length > 0;
  const hasWarehouse = hasAnyWarehouse();
  const assignedWh = data.assignedWarehouse;
  const whFull = assignedWh && isAssignedWarehouseFull(assignedWh);

  const assign = (type) => {
    Lumberyard.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
  };
  const unassign = () => {
    Lumberyard.unassignLastWorker(window.__phaserScene, data.rootX, data.rootY);
  };
  const pickTile = () => {
    window.__pickLumberTile = { x: data.rootX, y: data.rootY };
    window.__pickMode = "lumberyard";
  };
  const clearTile = () => {
    Lumberyard.clearTargetTile(window.__phaserScene, data.rootX, data.rootY);
  };
  const startAssignWarehouse = () => {
    window.__pickMode = "assign_warehouse";
    window.__pickAssign = { x: data.rootX, y: data.rootY, type: "lumberyard" };
  };
  const deliver = () => {
    Lumberyard.deliverIfReady(window.__phaserScene, data.rootX, data.rootY);
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>Lumberyard</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <button
          style={{
            ...btnStyle,
            background: hasWarehouse ? (whFull ? "#7a1f1f" : "#2e7d32") : "#3a3a3a",
            border: hasWarehouse ? (whFull ? "1px solid #a33" : "1px solid #3fa143") : "1px solid #555",
          }}
          disabled={!hasWarehouse}
          onClick={startAssignWarehouse}
          title={hasWarehouse ? (whFull ? "Assigned warehouse is full" : "Pick a warehouse on map") : "Place a warehouse to enable"}
        >
          Deliver to warehouse
        </button>
      </div>
      <div>Workers: {workers.map((w) => w.type).join(", ") || "-"}</div>
      <div>Efficiency: {data.efficiency}%</div>
      <div>Assigned wood tile: {data.targetTile ? `${data.targetTile.x},${data.targetTile.y}` : "-"}</div>
      <div style={{ marginTop: 8 }}>
        <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>
          Assign villager (+15%)
        </button>
        <button style={btnStyle} disabled={!canAssignForester} onClick={() => assign("forester")}>
          Assign forester (+50%)
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
          title={canPickTile ? "Click to choose a nearby forest tile" : "Assign requires at least 1 worker; then choose a nearby forest tile"}
        >
          Assign wood tile
        </button>
        <button style={btnStyle} disabled={!data.targetTile} onClick={clearTile}>
          Unassign tile
        </button>
      </div>
      {!canPickTile && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Tip: assign at least one worker, then select a forest tile within range.
        </div>
      )}
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Production starts when workers assigned and a forest tile is selected nearby. 100% efficiency yields +1 wood/20s.
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

