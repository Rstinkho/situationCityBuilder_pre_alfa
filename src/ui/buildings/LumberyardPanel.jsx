import React from "react";
import * as Lumberyard from "../../buildings_logic/lumberyard";
import GameModel from "../../game/core/GameModel";
import { panelStyle, btnMinimal, btnMinimalSecondary, btnMinimalSmall, btnMinimalDisabled } from "./styles";
import { BUILDING_TYPES } from "../../game/core/constants";

export default function LumberyardPanel({ data, onClose, destroyButton }) {
  const workers = data.workers || [];
  const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
  const canAssignForester = workers.length < 2 && GameModel.professions.forester > 0;
  const canUnassign = workers.length > 0;
  const hasWarehouse = hasAnyWarehouse();
  const assignedWh = data.assignedWarehouse;
  const whFull = assignedWh && isAssignedWarehouseFull(assignedWh);

  const assign = (type) => Lumberyard.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
  const unassign = () => Lumberyard.unassignLastWorker(window.__phaserScene, data.rootX, data.rootY);
  const startAssignWarehouse = () => {
    window.__pickMode = "assign_warehouse";
    window.__pickAssign = { x: data.rootX, y: data.rootY, type: "lumberyard" };
  };
  
  // Forest tile assignment functions
  const canPickTile = workers.length > 0;
  const pickTile = () => {
    window.__pickLumberTile = { x: data.rootX, y: data.rootY };
    window.__pickMode = "lumberyard";
  };
  const clearTile = () => {
    Lumberyard.clearTargetTile(window.__phaserScene, data.rootX, data.rootY);
  };

  return (
    <div style={panelStyle}>
      {/* Compact Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>🪵</span>
          <strong style={{ fontSize: 14 }}>Lumberyard</strong>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {destroyButton}
          <button 
            onClick={onClose}
            style={{
              ...btnMinimalSecondary,
              width: "auto",
              padding: "4px 6px",
              margin: 0,
              fontSize: 10,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 4, 
        marginBottom: 8,
        padding: "8px",
        background: "#1a1a1a",
        borderRadius: 6,
        border: "1px solid #333"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 1 }}>👥</div>
          <div style={{ fontSize: 11, fontWeight: "bold" }}>
            {workers.map((w) => w.type).join(", ") || "-"}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 1 }}>⚡</div>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#4caf50" }}>
            {data.efficiency}%
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 1 }}>🪵</div>
          <div style={{ fontSize: 11, fontWeight: "bold" }}>
            {Number(data.gatheredTotal || 0).toFixed(1)}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 1 }}>🚚</div>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#ff9800" }}>
            {Number(data.availableToDeliver || 0).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Combined Warehouse & Forest Tile Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {/* Warehouse Assignment */}
        <div>
          <button
            style={{
              ...btnMinimal,
              background: hasWarehouse ? (whFull ? "#7a1f1f" : "#2e7d32") : "#3a3a3a",
              border: hasWarehouse ? (whFull ? "1px solid #a33" : "1px solid #3fa143") : "1px solid #555",
              fontSize: 10,
              padding: "6px 8px",
            }}
            disabled={!hasWarehouse}
            onClick={startAssignWarehouse}
            title={hasWarehouse ? (whFull ? "Assigned warehouse is full" : "Pick a warehouse on map") : "Place a warehouse to enable"}
          >
            <span style={{ marginRight: 4 }}>🏗️</span>
            Warehouse
          </button>
          
          {data.assignedWarehouse && (
            <div style={{ 
              fontSize: 9, 
              opacity: 0.8, 
              marginTop: 2,
              textAlign: "center"
            }}>
              ({data.assignedWarehouse.x}, {data.assignedWarehouse.y})
            </div>
          )}
        </div>

        {/* Forest Tile Assignment */}
        <div>
          <button
            style={{
              ...btnMinimal,
              background: canPickTile ? "#2e7d32" : "#3a3a3a",
              border: canPickTile ? "1px solid #3fa143" : "1px solid #555",
              fontSize: 10,
              padding: "6px 8px",
            }}
            disabled={!canPickTile}
            onClick={pickTile}
            title={canPickTile ? "Click to choose a nearby forest tile" : "Assign requires at least 1 worker; then choose a nearby forest tile"}
          >
            <span style={{ marginRight: 4 }}>🌲</span>
            Forest Tile
          </button>
          
          {data.targetTile && (
            <div style={{ 
              fontSize: 9, 
              opacity: 0.8, 
              marginTop: 2,
              textAlign: "center"
            }}>
              ({data.targetTile.x}, {data.targetTile.y})
            </div>
          )}
        </div>
      </div>

      {/* Warning for limit reached */}
      {data.availableToDeliver >= 20 && (
        <div style={{ 
          color: "#ff9800", 
          fontWeight: "bold", 
          marginBottom: 8,
          padding: "6px 8px",
          background: "#1a1a1a",
          borderRadius: 4,
          border: "1px solid #ff9800",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          ⚠️ Limit reached!
        </div>
      )}

      {/* Compact Worker Management */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4, opacity: 0.8 }}>
          👥 Workers
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
          <button 
            style={{
              ...(canAssignVillager ? btnMinimalSmall : btnMinimalDisabled),
              fontSize: 9,
              padding: "4px 6px",
            }}
            disabled={!canAssignVillager} 
            onClick={() => assign("villager")}
          >
            <span style={{ marginRight: 2 }}>👤</span>
            +15%
          </button>
          
          <button 
            style={{
              ...(canAssignForester ? btnMinimalSmall : btnMinimalDisabled),
              fontSize: 9,
              padding: "4px 6px",
            }}
            disabled={!canAssignForester} 
            onClick={() => assign("forester")}
          >
            <span style={{ marginRight: 2 }}>🌲</span>
            +50%
          </button>

          <button 
            style={{
              ...(canUnassign ? btnMinimalSecondary : btnMinimalDisabled),
              fontSize: 9,
              padding: "4px 6px",
            }}
            disabled={!canUnassign} 
            onClick={unassign}
          >
            <span style={{ marginRight: 2 }}>❌</span>
            Remove
          </button>
        </div>

        {/* Clear Tile Button Row */}
        {data.targetTile && (
          <button 
            style={{
              ...btnMinimal,
              background: "#2e7d32",
              border: "1px solid #3fa143",
              fontSize: 9,
              padding: "4px 6px",
              marginTop: 4,
              width: "100%"
            }}
            onClick={clearTile}
          >
            <span style={{ marginRight: 4 }}>❌</span>
            Clear Forest Tile
          </button>
        )}
      </div>


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

