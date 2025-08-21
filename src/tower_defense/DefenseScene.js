import GameModel from "../game/core/GameModel";
import EventBus from "../game/events/eventBus";
import { TILE_SIZE } from "../game/core/constants";
import DefenseModel from "./DefenseModel";

export default class DefenseScene extends Phaser.Scene {
  constructor() {
    super("DefenseScene");
    this._offLaunch = null;
    this._border = null;
    this._gridLines = null;
  }

  create() {
    const gw = Number(this.sys.game.config.width);
    const gh = Number(this.sys.game.config.height);

    // Make defense screen wider and place it under interface (top-right area)
    const w = Math.floor(gw * 0.6);
    const h = Math.floor(gh * 0.45);
    const margin = 12;
    const x = Math.floor(gw - w - margin);
    const y = Math.floor(margin + 100); // push under top interface panels

    this.cameras.main.setViewport(x, y, w, h);
    this.cameras.main.setBackgroundColor(0x121416);

    DefenseModel.viewport = { x, y, w, h };
    window.__tdViewport = { x, y, w, h };

    this.drawBorder(w, h);
    this.createGrid(w, h);

    this.input.on("pointerdown", (p) => this.onPointerDown(p));

    this._offLaunch = EventBus.on("td-launch-attack", () => this.launchAttack());

    this.time.addEvent({ delay: 250, loop: true, callback: () => this.towerAI() });
  }

  shutdown() {
    if (this._offLaunch) {
      this._offLaunch();
      this._offLaunch = null;
    }
  }

  drawBorder(w, h) {
    if (this._border) this._border.destroy();
    const g = this.add.graphics();
    g.lineStyle(2, 0x555a60, 1);
    g.strokeRoundedRect(0.5, 0.5, w - 1, h - 1, 6);
    g.setDepth(5);
    this._border = g;
    const label = this.add.text(8, 6, "Tower Defense", { fontSize: 12, color: "#cdd3da" });
    label.setDepth(6);
  }

  createGrid(w, h) {
    const cols = Math.max(4, Math.floor(w / TILE_SIZE));
    const rows = Math.max(4, Math.floor(h / TILE_SIZE));
    DefenseModel.cols = cols;
    DefenseModel.rows = rows;
    DefenseModel.grid = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        row.push({ x, y, tileType: "plains", tower: null });
      }
      DefenseModel.grid.push(row);
    }

    if (this._gridLines) this._gridLines.destroy();
    const g = this.add.graphics();
    g.lineStyle(1, 0x2f3338, 1);
    for (let yy = 0; yy <= rows; yy++) {
      g.strokeLineShape({ x1: 0, y1: yy * TILE_SIZE, x2: cols * TILE_SIZE, y2: yy * TILE_SIZE });
    }
    for (let xx = 0; xx <= cols; xx++) {
      g.strokeLineShape({ x1: xx * TILE_SIZE, y1: 0, x2: xx * TILE_SIZE, y2: rows * TILE_SIZE });
    }
    g.setDepth(1);
    this._gridLines = g;
  }

  onPointerDown(pointer) {
    const v = DefenseModel.viewport;
    if (!v) return;
    const within = pointer.x >= v.x && pointer.x <= v.x + v.w && pointer.y >= v.y && pointer.y <= v.y + v.h;
    if (!within) return;

    if (window.__tdPlaceTower) {
      const localX = pointer.x - v.x;
      const localY = pointer.y - v.y;
      const cx = Math.floor(localX / TILE_SIZE);
      const cy = Math.floor(localY / TILE_SIZE);
      this.placeTower(cx, cy);
      window.__tdPlaceTower = false;
      return;
    }
  }

  placeTower(cx, cy) {
    if (cx < 0 || cy < 0 || cx >= DefenseModel.cols || cy >= DefenseModel.rows) return;
    const cell = DefenseModel.grid?.[cy]?.[cx];
    if (!cell || cell.tower) return;

    const x = cx * TILE_SIZE + 1 + (TILE_SIZE - 2) / 2;
    const y = cy * TILE_SIZE + 1 + (TILE_SIZE - 2) / 2;
    const tower = this.add.image(x, y, "tower_frame_1");
    tower.setDisplaySize(TILE_SIZE - 2, TILE_SIZE - 2);
    tower.setOrigin(0.5, 0.5);
    tower.setDepth(3);
    const frames = ["tower_frame_1", "tower_frame_2", "tower_frame_3"];
    let fi = 0;
    this.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { tower.setTexture(frames[fi]); } catch {} } });

    const towerObj = { cx, cy, sprite: tower, lastShotMs: 0, cooldownMs: 900 };
    DefenseModel.towers.push(towerObj);
    cell.tower = towerObj;
  }

  launchAttack() {
    const v = DefenseModel.viewport;
    const startX = v.w - 10;
    const startY = Math.floor(v.h * (0.3 + Math.random() * 0.4));
    const enemy = this.add.circle(startX, startY, Math.max(4, Math.floor(TILE_SIZE / 3)), 0xa33a3a);
    enemy.setDepth(4);
    const speed = Math.max(40, Math.floor(v.w * (0.10 + Math.random() * 0.05)));
    const hp = 100;
    const id = DefenseModel.nextEnemyId++;

    // Simple HP bar
    const hpBg = this.add.rectangle(startX, startY - 10, 26, 4, 0x222222).setDepth(5);
    const hpFill = this.add.rectangle(startX, startY - 10, 26, 4, 0x4caf50).setDepth(6);

    const enemyObj = { id, sprite: enemy, hp, speed, hpBg, hpFill };
    DefenseModel.enemies.push(enemyObj);

    if (!this.__updateBound) {
      this.events.on("update", this.updateEnemies, this);
      this.__updateBound = true;
    }
  }

  updateEnemies(time, delta) {
    const v = DefenseModel.viewport;
    const enemies = DefenseModel.enemies;
    if (!enemies || enemies.length === 0) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const pxPerMs = enemy.speed / 1000;
      enemy.sprite.x -= pxPerMs * delta;
      if (enemy.hpBg && enemy.hpFill) {
        enemy.hpBg.x = enemy.sprite.x;
        enemy.hpFill.x = enemy.sprite.x;
      }
      if (enemy.sprite.x <= 0) {
        this.onBreach(enemy);
        enemies.splice(i, 1);
      }
    }

    if (enemies.length === 0 && this.__updateBound) {
      this.events.off("update", this.updateEnemies, this);
      this.__updateBound = false;
    }
  }

  onBreach(enemy) {
    if (enemy) {
      enemy.sprite.destroy();
      enemy.hpBg?.destroy();
      enemy.hpFill?.destroy();
    }
    // wipe only resources stored inside warehouses
    try {
      const grid = GameModel.gridData || [];
      for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          const cell = row[x];
          if (cell && cell.root === cell && cell.buildingType === "warehouse") {
            const storage = cell.data?.storage;
            if (storage) {
              storage.wood = 0;
              storage.stone = 0;
              storage.wheat = 0;
              storage.fish = 0;
            }
          }
        }
      }
    } catch (_) {}
    alert("U vas spizdili vse resursi");
  }

  towerAI() {
    const enemies = DefenseModel.enemies || [];
    if (enemies.length === 0) return;
    const v = DefenseModel.viewport;
    const radius = v.w * 0.4;

    const now = this.time.now;
    for (const t of DefenseModel.towers) {
      if (now - (t.lastShotMs || 0) < (t.cooldownMs || 900)) continue;
      // find the nearest enemy in range
      let target = null;
      let bestDist = Infinity;
      for (const e of enemies) {
        const dx = e.sprite.x - t.sprite.x;
        const dy = e.sprite.y - t.sprite.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius && dist < bestDist) {
          bestDist = dist;
          target = e;
        }
      }
      if (target) {
        t.lastShotMs = now;
        this.fireArrow(t.sprite.x, t.sprite.y, target.sprite.x, target.sprite.y, target.id);
      }
    }
  }

  fireArrow(sx, sy, tx, ty, targetId) {
    const arrow = this.add.triangle(sx, sy, 0, 5, 12, 0, 0, -5, 0xffffff);
    arrow.setDepth(6);
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.hypot(dx, dy);
    const duration = Math.max(250, Math.min(600, Math.floor(dist * 4)));
    const arc = Math.max(20, Math.min(120, dist * 0.25));

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: (tw) => {
        const t = tw.getValue();
        const x = sx + dx * t;
        const y = sy + dy * t - arc * 4 * t * (1 - t);
        const ddx = dx;
        const ddy = dy - arc * 4 * (1 - 2 * t);
        arrow.setPosition(x, y);
        arrow.setRotation(Math.atan2(ddy, ddx));
      },
      onComplete: () => {
        arrow.destroy();
        this.hitEnemy(targetId);
      },
    });
  }

  hitEnemy(targetId) {
    const enemies = DefenseModel.enemies || [];
    const idx = enemies.findIndex((e) => e.id === targetId);
    if (idx === -1) return;
    const enemy = enemies[idx];
    enemy.hp = Math.max(0, enemy.hp - 25);
    if (enemy.hpFill) {
      const pct = enemy.hp / 100;
      enemy.hpFill.width = 26 * pct;
      enemy.hpFill.fillColor = enemy.hp > 50 ? 0x4caf50 : enemy.hp > 25 ? 0xffc107 : 0xf44336;
    }
    if (enemy.hp <= 0) {
      enemy.sprite.destroy();
      enemy.hpBg?.destroy();
      enemy.hpFill?.destroy();
      enemies.splice(idx, 1);
      if (enemies.length === 0 && this.__updateBound) {
        this.events.off("update", this.updateEnemies, this);
        this.__updateBound = false;
      }
    }
  }
}
