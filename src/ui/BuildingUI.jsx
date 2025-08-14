import React, { useEffect, useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";
import { TILE_SIZE, TILE_TYPES } from "../game/core/constants";
import * as Lumberyard from "../buildings_logic/lumberyard";
import * as House from "../buildings_logic/house";
import * as Farm from "../buildings_logic/farm";

export default function BuildingUI({ open, payload, onClose }) {
  const [data, setData] = useState(payload);

  useEffect(() => {
    setData(payload);
  }, [payload]);

  // live refresh while panel is open
  useEffect(() => {
    if (!open || !data) return;
    const id = setInterval(() => {
      if (data.type === "house") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(House.getClickPayload(root));
      } else if (data.type === "lumberyard") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(Lumberyard.getClickPayload(root));
      } else if (data.type === "farm") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(Farm.getClickPayload(root));
      }
    }, 500);
    return () => clearInterval(id);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;
    window.__uiOpenForBuilding = { type: data.type, x: data.rootX, y: data.rootY };
    return () => { window.__uiOpenForBuilding = null; };
  }, [open, data]);

  if (!open || !data) return null;

  const destroyButton = (
    <button style={btnDestroy} onClick={() => destroyBuilding(data, onClose)}>Destroy</button>
  );

  if (data.type === "training_center") {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>Training Center</strong>
          <div style={{ display: "flex", gap: 8 }}>
            {destroyButton}
            <button onClick={onClose}>✕</button>
          </div>
        </div>
        {data.actions.map((a) => (
          <button key={a.key} style={btnStyle} onClick={() => EventBus.emit("train", { profession: a.key })}>
            {a.label}
          </button>
        ))}
        <p style={{ marginTop: 8, opacity: 0.8 }}>Training removes 1 villager from a house but keeps total population the same.</p>
      </div>
    );
  }

  if (data.type === "house") {
    const incomeText = data.incomePerInterval > 0
      ? `+${data.incomePerInterval} gold every ${Math.round(data.incomeIntervalMs / 1000)}s`
      : `No income until full`;
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>House</strong>
          <div style={{ display: "flex", gap: 8 }}>
            {destroyButton}
            <button onClick={onClose}>✕</button>
          </div>
        </div>
        <div>Occupants: {data.occupants}/{data.capacity}</div>
        <div>Villagers: {data.villagers} &nbsp; Farmers: {data.farmers} &nbsp; Foresters: {data.foresters}</div>
        <div>Income: {incomeText}</div>
      </div>
    );
  }

  if (data.type === "lumberyard") {
    const workers = data.workers || [];
    const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
    const canAssignForester = workers.length < 2 && GameModel.professions.forester > 0;
    const canUnassign = workers.length > 0;
    const canPickTile = workers.length > 0;

    const assign = (type) => {
      Lumberyard.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
      // data will refresh via interval
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

    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>Lumberyard</strong>
          <div style={{ display: "flex", gap: 8 }}>
            {destroyButton}
            <button onClick={onClose}>✕</button>
          </div>
        </div>
        <div>Workers: {workers.map((w) => w.type).join(", ") || "-"}</div>
        <div>Efficiency: {data.efficiency}%</div>
        <div>Assigned wood tile: {data.targetTile ? `${data.targetTile.x},${data.targetTile.y}` : "-"}</div>
        <div style={{ marginTop: 8 }}>
          <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>Assign villager (+15%)</button>
          <button style={btnStyle} disabled={!canAssignForester} onClick={() => assign("forester")}>Assign forester (+50%)</button>
          <button style={btnStyle} disabled={!canUnassign} onClick={unassign}>Unassign last</button>
        </div>
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button style={btnStyle} disabled={!canPickTile} onClick={pickTile}>Assign wood tile</button>
          <button style={btnStyle} disabled={!data.targetTile} onClick={clearTile}>Unassign tile</button>
        </div>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Production starts when workers assigned and a forest tile is selected nearby. 100% efficiency yields +1 wood/20s.</p>
      </div>
    );
  }

  if (data.type === "farm") {
    const workers = data.workers || [];
    const canAssignVillager = workers.length < 2 && GameModel.gridData && hasAnyVillager();
    const canAssignFarmer = workers.length < 2 && GameModel.professions.farmer > 0;
    const canUnassign = workers.length > 0;
    const canCreateFields = workers.length > 0 && (data.fields?.length || 0) < 2;

    const assign = (type) => {
      Farm.assignWorker(window.__phaserScene, data.rootX, data.rootY, type);
    };
    const unassign = () => {
      Farm.unassignLastWorker(window.__phaserScene, data.rootX, data.rootY);
    };
    const createFields = () => {
      Farm.createFields(window.__phaserScene, data.rootX, data.rootY);
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
        <div>Workers: {workers.map((w) => w.type).join(", ") || "-"}</div>
        <div>Efficiency: {data.efficiency}%</div>
        <div>Fields: {(data.fields?.length || 0)}/2</div>
        <div style={{ marginTop: 8 }}>
          <button style={btnStyle} disabled={!canAssignVillager} onClick={() => assign("villager")}>Assign villager (+15%)</button>
          <button style={btnStyle} disabled={!canAssignFarmer} onClick={() => assign("farmer")}>Assign farmer (+50%)</button>
          <button style={btnStyle} disabled={!canUnassign} onClick={unassign}>Unassign last</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <button style={btnStyle} disabled={!canCreateFields} onClick={createFields}>Create fields (2 tiles in front)</button>
        </div>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Production starts when at least 2 fields are built and workers are assigned. 100% efficiency yields +1 wheat/20s.</p>
      </div>
    );
  }

  return null;
}

function destroyBuilding(data, onClose) {
  const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
  if (!root) return;
  if (data.type === "house") {
    House.remove(window.__phaserScene, root);
  } else if (data.type === "lumberyard") {
    destroyGenericBuilding(root);
  } else if (data.type === "farm") {
    destroyFarm(root);
  } else if (data.type === "training_center") {
    destroyGenericBuilding(root);
  }
  onClose();
}

function destroyGenericBuilding(root) {
  const { width = 1, height = 1 } = root;
  const grid = GameModel.gridData;
  root.building?.destroy();
  if (root.data?.productionTimer) {
    root.data.productionTimer.remove(false);
    root.data.productionTimer = null;
  }
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const c = grid[root.y + dy][root.x + dx];
      c.building = null;
      c.buildingType = null;
      c.root = null;
      c.isUnderConstruction = false;
    }
  }
}

function destroyFarm(root) {
  const grid = GameModel.gridData;
  // remove fields
  const fields = root.data?.fields || [];
  fields.forEach(({ x, y }) => {
    const c = grid[y]?.[x];
    if (!c) return;
    c.building?.destroy();
    c.building = null;
    c.buildingType = null;
    c.root = null;
    c.isUnderConstruction = false;
  });
  destroyGenericBuilding(root);
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
  minWidth: 280,
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

const btnDestroy = {
  ...btnStyle,
  width: "auto",
  padding: "6px 8px",
  margin: 0,
  background: "#7a1f1f",
  border: "1px solid #a33",
};
