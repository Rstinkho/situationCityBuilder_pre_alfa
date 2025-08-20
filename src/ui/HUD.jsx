import React, { useEffect, useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";
import Pointer from "../game/core/Pointer";
import { BUILDING_COSTS, BUILDING_TYPES } from "../game/core/constants";

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