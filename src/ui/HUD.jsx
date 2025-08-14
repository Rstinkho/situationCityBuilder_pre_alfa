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

  const p = GameModel.population;
  const prof = GameModel.professions;
  const res = GameModel.resources;
  const emp = countEmployed();

	return (
		<>
			<div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontFamily: "sans-serif", fontSize: 14 }}>
				<div><strong>Gold:</strong> {GameModel.gold.toFixed(2)}</div>
				<div><strong>Population:</strong> {p.current}/{p.cap}</div>
				<div><strong>Villagers:</strong> {countVillagers()} <span style={{ opacity: 0.8 }}>(employed {emp.villager})</span></div>
				<div><strong>Farmers:</strong> {prof.farmer} <span style={{ opacity: 0.8 }}>(employed {emp.farmer})</span> &nbsp; <strong>Foresters:</strong> {prof.forester} <span style={{ opacity: 0.8 }}>(employed {emp.forester})</span></div>
				<div><strong>Wheat:</strong> {res.wheat} &nbsp; <strong>Wood:</strong> {res.wood}</div>
			</div>
			<BuildPanel />
		</>
	);
}

function BuildPanel() {
	const items = [
		{ key: BUILDING_TYPES.HOUSE, label: "House", img: "/assets/house_1.png" },
		{ key: BUILDING_TYPES.TRAINING_CENTER, label: "Training", img: "/assets/training_1.png" },
		{ key: BUILDING_TYPES.FARM, label: "Farm", img: "/assets/farm_1.png" },
		{ key: BUILDING_TYPES.LUMBERYARD, label: "Lumberyard", img: "/assets/lumber_1.png" },
	];
	const canAfford = (key) => GameModel.gold >= (BUILDING_COSTS[key] || 0);
	const onPick = (key) => {
		if (!canAfford(key)) return;
		// Use Pointer static API via global scene reference
		Pointer.setSelected(window.__phaserScene, key);
	};
	return (
		<div style={{ position: "absolute", top: 120, right: 8, width: 180, background: "rgba(0,0,0,0.5)", color: "#fff", padding: 8, borderRadius: 8, fontFamily: "sans-serif", fontSize: 13 }}>
			<div style={{ fontWeight: 700, marginBottom: 6 }}>Build</div>
			{items.map((it) => (
				<div key={it.key} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center", gap: 8, padding: "6px 4px", opacity: canAfford(it.key) ? 1 : 0.6 }}>
					<img src={it.img} width={40} height={40} style={{ imageRendering: "pixelated", borderRadius: 4 }} />
					<div>
						<div style={{ fontWeight: 600 }}>{it.label}</div>
						<div style={{ opacity: 0.85 }}>Cost: {BUILDING_COSTS[it.key] || 0}g</div>
					</div>
					<button style={btnSmall} disabled={!canAfford(it.key)} onClick={() => onPick(it.key)}>Place</button>
				</div>
			))}
		</div>
	);
}

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
