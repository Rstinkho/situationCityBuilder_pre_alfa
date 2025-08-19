import React, { useEffect, useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";
import Pointer from "../game/core/Pointer";
import { BUILDING_COSTS, BUILDING_TYPES } from "../game/core/constants";

// Import images for buildings
import house_img from "../assets/buildings_img/house.png";
import farm_img from "../assets/buildings_img/farm.png";
import lumber_img from "../assets/buildings_img/lumber.png";
import training_img from "../assets/buildings_img/training.png";

// Lets work with interface for game, options and buildings.
// 1. Remove controls display on canvas (1: house | 2: Training center ... etc) Instead add there display of Gold, Wood and population. Add icons for them as well. 
// 2.  Can remove existing HUD. Instead, need to have buttons bar which will display section below when we click on it:
// the button which open sections are:
// 1: Construction with the current building menu, prices and building pictures
// 2: People Management with information about our population, all types, employed/unemployed. Add icons.
// 3: Resources: display all resources there with icons and quantity. No need to display gold there. 
// Make it this interface relatively big, so can see everything clearly. 

// And minor fixes for buildings:
// 1. In training center show available unemployed villagers for training
// 2. For lumberyard: make it clear when button assign wood tyle available (green color when available, dark grey when not available with floating tip how to make it available). When tyle assigned, also display lumber axe over it all the time. When unassigned - remove it.
// 3. For farm: make it clear when create field button is available same way as we do for assign wood for lumber previously


export default function HUD() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const off = EventBus.on("hud-payload", () => {});
    return off;
  }, []);

  return null;
}

function BuildPanel() { return null; }

function countVillagers() {
  const grid = GameModel.gridData || [];
  let n = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[0]?.length || 0); x++) {
      const cell = grid[y][x];
      if (cell.buildingType === "house" && cell.root === cell)
        n += cell.villagers;
    }
  }
  return n;
}

function countEmployed() {
  const grid = GameModel.gridData || [];
  let farmer = 0;
  let forester = 0;
  let villager = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[0]?.length || 0); x++) {
      const cell = grid[y][x];
      if (cell.buildingType === "house" && cell.root === cell) {
        const e = cell.employed || {};
        farmer += e.farmer || 0;
        forester += e.forester || 0;
        villager += e.villager || 0;
      }
    }
  }
  return { farmer, forester, villager };
}

const btnSmall = {
  display: "inline-block",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #666",
  background: "#2a2a2a",
  color: "#fff",
  cursor: "pointer",
};