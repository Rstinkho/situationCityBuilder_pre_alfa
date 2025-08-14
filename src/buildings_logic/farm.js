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
		const house = findHouseWithVillagerAvailable();
		if (!house) return false;
		house.employed.villager = (house.employed.villager || 0) + 1;
		workers.push({ type: "villager", home: { x: house.x, y: house.y } });
	} else if (workerType === "farmer") {
		const house = findHouseWithProfessionalAvailable("farmer");
		if (!house) return false;
		house.employed.farmer = (house.employed.farmer || 0) + 1;
		workers.push({ type: "farmer", home: { x: house.x, y: house.y } });
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

	const home = getHouseByCoords(worker.home);
	if (home) {
		if (worker.type === "villager") home.employed.villager = Math.max(0, (home.employed.villager || 0) - 1);
		if (worker.type === "farmer") home.employed.farmer = Math.max(0, (home.employed.farmer || 0) - 1);
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

export function remove(scene, cell) {
	const root = cell.root || cell;
	const workers = root.data?.workers || [];
	while (workers.length) {
		const w = workers.pop();
		const home = getHouseByCoords(w.home);
		if (home) {
			if (w.type === "villager") home.employed.villager = Math.max(0, (home.employed.villager || 0) - 1);
			if (w.type === "farmer") home.employed.farmer = Math.max(0, (home.employed.farmer || 0) - 1);
		}
	}
	if (root.data?.productionTimer) {
		root.data.productionTimer.remove(false);
		root.data.productionTimer = null;
	}
	// remove fields
	const grid = GameModel.gridData;
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
	root.data.fields = [];
	// remove main building
	root.building?.destroy();
	const { width = 1, height = 1 } = root;
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

function findHouseWithVillagerAvailable() {
	const grid = GameModel.gridData;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const cell = grid[y][x];
			if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) {
				const free = cell.villagers - (cell.employed?.villager || 0);
				if (free > 0) return cell;
			}
		}
	}
	return null;
}

function findHouseWithProfessionalAvailable(key) {
	const grid = GameModel.gridData;
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0].length; x++) {
			const cell = grid[y][x];
			if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) {
				const total = cell.professionCounts?.[key] || 0;
				const employed = cell.employed?.[key] || 0;
				if (total - employed > 0) return cell;
			}
		}
	}
	return null;
}

function getHouseByCoords(home) {
	if (!home) return null;
	const grid = GameModel.gridData;
	const cell = grid[home.y]?.[home.x];
	if (cell && cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) return cell;
	return null;
}