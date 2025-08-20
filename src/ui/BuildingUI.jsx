import React, { useEffect, useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";
import { TILE_SIZE, TILE_TYPES } from "../game/core/constants";
import * as Lumberyard from "../buildings_logic/lumberyard";
import * as House from "../buildings_logic/house";
import * as Farm from "../buildings_logic/farm";
import * as TrainingCenter from "../buildings_logic/training_center";
import * as Quarry from "../buildings_logic/quarry";
import * as FishermanHut from "../buildings_logic/fisherman_hut";
import TrainingCenterPanel from "./buildings/TrainingCenterPanel";
import HousePanel from "./buildings/HousePanel";
import LumberyardPanel from "./buildings/LumberyardPanel";
import QuarryPanel from "./buildings/QuarryPanel";
import FarmPanel from "./buildings/FarmPanel";
import FishermanHutPanel from "./buildings/FishermanHutPanel";
import TrainingCenterPanel from "./buildings/TrainingCenterPanel";
import HousePanel from "./buildings/HousePanel";
import LumberyardPanel from "./buildings/LumberyardPanel";
import QuarryPanel from "./buildings/QuarryPanel";
import FarmPanel from "./buildings/FarmPanel";
import FishermanHutPanel from "./buildings/FishermanHutPanel";

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
      } else if (data.type === "quarry") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(Quarry.getClickPayload(root));
      } else if (data.type === "fisherman_hut") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(FishermanHut.getClickPayload(root));
      } else if (data.type === "farm") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(Farm.getClickPayload(root));
      } else if (data.type === "training_center") {
        const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
        if (root) setData(TrainingCenter.getClickPayload(root));
      }
    }, 500);
    return () => clearInterval(id);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;
    window.__uiOpenForBuilding = {
      type: data.type,
      x: data.rootX,
      y: data.rootY,
    };
    return () => {
      window.__uiOpenForBuilding = null;
    };
  }, [open, data]);

  if (!open || !data) return null;

  const destroyButton = (
    <button style={btnDestroy} onClick={() => destroyBuilding(data, onClose)}>
      Destroy
    </button>
  );

  if (data.type === "training_center") return <TrainingCenterPanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  if (data.type === "house") return <HousePanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  if (data.type === "lumberyard") return <LumberyardPanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  if (data.type === "quarry") return <QuarryPanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  if (data.type === "fisherman_hut") return <FishermanHutPanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  if (data.type === "farm") return <FarmPanel data={data} onClose={onClose} destroyButton={destroyButton} />;

  return null;
}

function destroyBuilding(data, onClose) {
  const root = GameModel.gridData?.[data.rootY]?.[data.rootX];
  if (!root) return;
  if (data.type === "house") {
    House.remove(window.__phaserScene, root);
  } else if (data.type === "lumberyard") {
    Lumberyard.remove(window.__phaserScene, root);
  } else if (data.type === "quarry") {
    Quarry.remove(window.__phaserScene, root);
  } else if (data.type === "fisherman_hut") {
    FishermanHut.remove(window.__phaserScene, root);
  } else if (data.type === "farm") {
    Farm.remove(window.__phaserScene, root);
  } else if (data.type === "training_center") {
    TrainingCenter.remove(window.__phaserScene, root);
  }
  onClose();
}

function hasAnyVillager() {
  const grid = GameModel.gridData || [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[0]?.length || 0); x++) {
      const cell = grid[y][x];
      if (
        cell.buildingType === "house" &&
        cell.root === cell &&
        cell.villagers > 0
      )
        return true;
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