import React from "react";
import * as Farm from "../../buildings_logic/farm";
import GameModel from "../../game/core/GameModel";
import { panelStyle, btnStyle } from "./styles";
import { BUILDING_TYPES } from "../../game/core/constants";

export default function FarmPanel({ data, onClose, destroyButton }) {
  const workers = data.workers || [];
  const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
  const canAssignFarmer = workers.length < 2 && GameModel.professions.farmer > 0;
  const canUnassign = workers.length > 0;
  const canCreateFields = workers.length > 0 && (data.fields?.length || 0) < 2;
  const hasWarehouse = hasAnyWarehouse();
  const assignedWh = data.assignedWarehouse;
  const whFull = assignedWh && isAssignedWarehouseFull(assignedWh);

  const assign = (type) => Farm.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
  const unassign = () => Farm.unassignLastWorker(window.__phaserScene, data.rootX, data.rootY);
  const createFields = () => Farm.createFields(window.__phaserScene, data.rootX, data.rootY);
  const startAssignWarehouse = () => {
    window.__pickMode = "assign_warehouse";
    window.__pickAssign = { x: data.rootX, y: data.rootY, type: "farm" };
  };
  const deliver = () => {
    Farm.deliverIfReady(window.__phaserScene, data.rootX, data.rootY);
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>Farm</strong>
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
      <div>Gathered: {Number(data.gatheredTotal || 0).toFixed(1)}</div>
      <div>Available: {Number(data.availableToDeliver || 0).toFixed(1)}</div>
      <div>Assigned warehouse: {data.assignedWarehouse ? `${data.assignedWarehouse.x},${data.assignedWarehouse.y} yes` : '-'}</div>
      {data.availableToDeliver >= 20 && (
        <div style={{ 
          color: "#ff9800", 
          fontWeight: "bold", 
          marginTop: 8,
          padding: "8px",
          background: "#1a1a1a",
          borderRadius: "4px",
          border: "1px solid #ff9800"
        }}>
          ⚠️ Limit reached! Build more warehouses!
        </div>
      )}
      <div>Fields: {data.fields?.length || 0}/2</div>
      <div style={{ marginTop: 8 }}>
        <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>
          Assign villager (+15%)
        </button>
        <button style={btnStyle} disabled={!canAssignFarmer} onClick={() => assign("farmer")}>
          Assign farmer (+50%)
        </button>
        <button style={btnStyle} disabled={!canUnassign} onClick={unassign}>
          Unassign last
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button
          style={{
            ...btnStyle,
            background: canCreateFields ? "#2e7d32" : "#3a3a3a",
            border: canCreateFields ? "1px solid #3fa143" : "1px solid #555",
          }}
          disabled={!canCreateFields}
          onClick={createFields}
          title={canCreateFields ? "Create two field tiles in front of the farm" : "Requires at least 1 worker and two empty tiles directly in front"}
        >
          Create fields (2 tiles in front)
        </button>
      </div>
      {!canCreateFields && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Tip: assign a worker and ensure two empty tiles are available in front of the farm.
        </div>
      )}
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Production starts when at least 2 fields are built and workers are assigned. 100% efficiency yields +1 wheat/20s.
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

function hasAnyWarehouse() {
  const grid = GameModel.gridData || [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < (row?.length || 0); x++) {
      const c = row[x];
      if (c?.buildingType === BUILDING_TYPES.WAREHOUSE && c.root === c) return true;
    }
  }
  return false;
}

function isAssignedWarehouseFull(assignedWh) {
  if (!assignedWh) return false;
  const grid = GameModel.gridData || [];
  const w = grid[assignedWh.y]?.[assignedWh.x];
  if (!w || w.buildingType !== BUILDING_TYPES.WAREHOUSE || w.root !== w) return false;
  const cap = w.data?.capacity || 100;
  const s = w.data?.storage || {};
  const used = (s.wood || 0) + (s.stone || 0) + (s.wheat || 0) + (s.fish || 0);
  return used >= cap;
}

