export default {
	viewport: { x: 0, y: 0, w: 0, h: 0 },
	grid: null, // 2D array of plains cells for the defense area
	cols: 0,
	rows: 0,
	towers: [], // { cx, cy, sprite, lastShotMs }
	enemies: [], // [{ id, sprite, hp, speed, hpBg, hpFill }]
	nextEnemyId: 1,
};