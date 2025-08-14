import React, { useEffect, useState } from "react";
import EventBus from "../game/events/eventBus";
import GameModel from "../game/core/GameModel";

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
		<div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontFamily: "sans-serif", fontSize: 14 }}>
			<div><strong>Gold:</strong> {GameModel.gold.toFixed(2)}</div>
			<div><strong>Population:</strong> {p.current}/{p.cap}</div>
			<div><strong>Villagers:</strong> {countVillagers()} <span style={{ opacity: 0.8 }}>(employed {emp.villager})</span></div>
			<div><strong>Farmers:</strong> {prof.farmer} <span style={{ opacity: 0.8 }}>(employed {emp.farmer})</span> &nbsp; <strong>Foresters:</strong> {prof.forester} <span style={{ opacity: 0.8 }}>(employed {emp.forester})</span></div>
			<div><strong>Wheat:</strong> {res.wheat} &nbsp; <strong>Wood:</strong> {res.wood}</div>
		</div>
	);
}

function countVillagers() {
	const grid = GameModel.gridData || [];
	let n = 0;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < (grid[0]?.length || 0); x++) {
			const cell = grid[y][x];
			if (cell.buildingType === "house" && cell.root === cell) n += cell.villagers;
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
