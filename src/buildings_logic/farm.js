import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE, FARM_PER_100_EFF_MS } from "../game/core/constants";
import EventBus from "../game/events/eventBus";
import TimeSystem from "../game/core/TimeSystem";

export function init(scene, grid, x, y) {
	const { w, h } = BUILDING_SIZES[BUILDING_TYPES.FARM];
	const rect = scene.add.rectangle(
		x * TILE_SIZE + 1,
		y * TILE_SIZE + 1,
		w * TILE_SIZE - 2,
		h * TILE_SIZE - 2,
		0xa8d08d
	);
	rect.setOrigin(0, 0);
	rect.setInteractive({ useHandCursor: true });

	const root = grid[y][x];
	root.building = rect;
	root.buildingType = BUILDING_TYPES.FARM;
	root.root = root;
	root.isUnderConstruction = false;
	root.width = w;
	root.height = h;
	root.data = {
		workers: [], // { type: 'villager' | 'farmer', home: {x,y} }
		fields: [], // array of root cells for fields
		productionTimer: null,
	};

	for (let dy = 0; dy < h; dy++) {
		for (let dx = 0; dx < w; dx++) {
			const cell = grid[y + dy][x + dx];
			cell.building = rect;
			cell.buildingType = BUILDING_TYPES.FARM;
			cell.root = root;
			cell.isUnderConstruction = false;
		}
	}

	rect.on("pointerdown", () => {
		if (root.isUnderConstruction) return;
		EventBus.emit("open-building-ui", getClickPayload(root));
	});

	return rect;
}

export function getClickPayload(cell) {
	return {
		type: "farm",
		workers: cell.data?.workers || [],
		fields: cell.data?.fields || [],
		efficiency: computeEfficiency(cell),
		rootX: cell.x,
		rootY: cell.y,
	};
}

export function assignWorker(scene, x, y, workerType) {
	const grid = GameModel.gridData;
	const root = grid[y][x];
	if (!root || root.buildingType !== BUILDING_TYPES.FARM) return false;
	const workers = root.data.workers;
	if (workers.length >= 2) return false;

	if (workerType === "villager") {
		const house = findHouseWithVillager();
		if (!house) return false;
		house.villagers -= 1;
		workers.push({ type: "villager", home: { x: house.x, y: house.y } });
	} else if (workerType === "farmer") {
		if (GameModel.professions.farmer <= 0) return false;
		GameModel.professions.farmer -= 1;
		workers.push({ type: "farmer", home: findAnyHouseRoot() });
	} else {
		return false;
	}

	updateProductionTimer(scene, root);
	return true;
}

export function unassignLastWorker(scene, x, y) {
	const grid = GameModel.gridData;
	const root = grid[y][x];
	if (!root || root.buildingType !== BUILDING_TYPES.FARM) return false;
	const workers = root.data.workers;
	if (workers.length === 0) return false;
	const worker = workers.pop();

	if (worker.type === "villager") {
		const house = findHouseNeedingVillager();
		if (house) house.villagers += 1;
	} else if (worker.type === "farmer") {
		GameModel.professions.farmer += 1;
	}

	updateProductionTimer(scene, root);
	return true;
}

export function onWorkersChanged(scene, root) {
	updateProductionTimer(scene, root);
}

export function createFields(scene, x, y) {
	const grid = GameModel.gridData;
	const root = grid[y][x];
	if (!root || root.buildingType !== BUILDING_TYPES.FARM) return false;
	if (root.data.fields.length >= 2) return false;

	// place two 1x1 fields in front (positive y direction)
	const positions = [
		{ x: root.x, y: root.y + root.height },
		{ x: root.x + 1, y: root.y + root.height },
	];
	for (const pos of positions) {
		const cell = grid[pos.y]?.[pos.x];
		if (!cell || cell.building) return false; // blocked
	}

	for (const pos of positions) {
		const cell = grid[pos.y][pos.x];
		const fieldRect = scene.add.rectangle(
			pos.x * TILE_SIZE + 1,
			pos.y * TILE_SIZE + 1,
			TILE_SIZE - 2,
			TILE_SIZE - 2,
			0x7fbf6b
		);
		fieldRect.setOrigin(0, 0);
		cell.building = fieldRect;
		cell.buildingType = BUILDING_TYPES.FARM_FIELD;
		cell.root = cell; // field is a single-tile root
		cell.isUnderConstruction = false;
		root.data.fields.push({ x: pos.x, y: pos.y });
	}

	updateProductionTimer(scene, root);
	return true;
}

function computeEfficiency(root) {
	const workers = root.data?.workers || [];
	let eff = 0;
	workers.forEach((w) => {
		if (w.type === "villager") eff += 15;
		if (w.type === "farmer") eff += 50;
	});
	return Math.min(100, eff);
}

function updateProductionTimer(scene, root) {
	const hasWorkers = (root.data.workers?.length || 0) > 0;
	const hasTwoFields = (root.data.fields?.length || 0) >= 2;
	const canProduce = hasWorkers && hasTwoFields;
	if (!canProduce) {
		if (root.data.productionTimer) {
			root.data.productionTimer.remove(false);
			root.data.productionTimer = null;
		}
		return;
	}

	if (root.data.productionTimer) return; // already producing

	const t = TimeSystem.every(scene, FARM_PER_100_EFF_MS, () => {
		const eff = computeEfficiency(root) / 100;
		if (eff <= 0) return;
		GameModel.resources.wheat += eff;
	});
	root.data.productionTimer = t;
}

function findHouseWithVillager() {
	const grid = GameModel.gridData;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const cell = grid[y][x];
			if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell && cell.villagers > 0) {
				return cell;
			}
		}
	}
	return null;
}

function findHouseNeedingVillager() {
	const grid = GameModel.gridData;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const cell = grid[y][x];
			if (
				cell.buildingType === BUILDING_TYPES.HOUSE &&
				cell.root === cell &&
				cell.villagers < cell.occupants
			) {
				return cell;
			}
		}
	}
	return null;
}

function findAnyHouseRoot() {
	const grid = GameModel.gridData;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const cell = grid[y][x];
			if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) return { x: cell.x, y: cell.y };
		}
	}
	return null;
}