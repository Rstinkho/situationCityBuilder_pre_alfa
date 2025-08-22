import GameModel from "../game/core/GameModel";
import EventBus from "../game/events/eventBus";
import { TILE_SIZE, BUILDING_COSTS, BUILDING_TYPES } from "../game/core/constants";
import DefenseModel from "./DefenseModel";

export default class DefenseScene extends Phaser.Scene {
  constructor() {
    super("DefenseScene");
    this._offLaunch = null;
    this._border = null;
    this._gridLines = null;
    this._buildingPreview = null;
    this._selectedBuildingType = null;
    this._attackTimer = null;
    this._attackTimerText = null;
  }

  create() {
    const gw = Number(this.sys.game.config.width);
    const gh = Number(this.sys.game.config.height);

    // Use the full dimensions of the tower defense container
    const w = gw;
    const h = gh;
    const x = 0;
    const y = 0;

    // No need to set viewport since this scene has its own game instance
    // this.cameras.main.setViewport(x, y, w, h);
    this.cameras.main.setBackgroundColor(0x121416);

    DefenseModel.viewport = { x, y, w, h };
    window.__tdViewport = { x, y, w, h };

    this.drawBorder(w, h);
    this.createGrid(w, h);

    this.input.on("pointerdown", (p) => this.onPointerDown(p));
    this.input.on("pointermove", (p) => this.onPointerMove(p));
    this.input.keyboard.on("keydown-ESC", () => this.cancelBuildingMode());

    // Create building preview
    this._buildingPreview = this.add.rectangle(0, 0, TILE_SIZE - 2, TILE_SIZE * 2 - 2, 0xffffff, 0.3);
    this._buildingPreview.setOrigin(0, 0);
    this._buildingPreview.setVisible(false);
    this._buildingPreview.setDepth(10);

    // Make this scene globally accessible
    window.__defenseScene = this;

    this._offLaunch = EventBus.on("td-launch-attack", () => this.launchAttack());

    this.time.addEvent({ delay: 250, loop: true, callback: () => this.towerAI() });
    this.time.addEvent({ delay: 100, loop: true, callback: () => this.updateBuildingMode() });
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

  onPointerMove(pointer) {
    if (window.__tdPlaceTower && this._buildingPreview) {
      const localX = pointer.x;
      const localY = pointer.y;
      const cx = Math.floor(localX / TILE_SIZE);
      const cy = Math.floor(localY / TILE_SIZE);
      
      // Snap to grid
      const x = cx * TILE_SIZE + 1;
      const y = cy * TILE_SIZE + 1;
      this._buildingPreview.setPosition(x, y);
      this._buildingPreview.setVisible(true);
      
      // Check if placement is valid and change color accordingly
      const canPlace = this.canPlaceTower(cx, cy);
      this._buildingPreview.setFillStyle(canPlace ? 0x00ff00 : 0xff0000, 0.3);
    }
  }

  cancelBuildingMode() {
    if (window.__tdPlaceTower) {
      window.__tdPlaceTower = false;
      window.__tdTowerType = null;
      this.input.setDefaultCursor("default");
      if (this._buildingPreview) {
        this._buildingPreview.setVisible(false);
      }
    }
  }

  updateBuildingMode() {
    if (window.__tdPlaceTower) {
      if (!this._buildingPreview.visible) {
        this.input.setDefaultCursor("crosshair");
      }
    } else {
      if (this._buildingPreview && this._buildingPreview.visible) {
        this._buildingPreview.setVisible(false);
        this.input.setDefaultCursor("default");
      }
    }
  }

  onPointerDown(pointer) {
    // Since this scene now has its own game instance, coordinates are already local
    const localX = pointer.x;
    const localY = pointer.y;

    if (window.__tdPlaceTower) {
      const cx = Math.floor(localX / TILE_SIZE);
      const cy = Math.floor(localY / TILE_SIZE);
      this.placeTower(cx, cy);
      window.__tdPlaceTower = false;
      window.__tdTowerType = null;
      this.input.setDefaultCursor("default");
      return;
    }
  }

  canPlaceTower(cx, cy) {
    if (cx < 0 || cy < 0 || cx >= DefenseModel.cols || cy >= DefenseModel.rows) return false;
    
    // Check if we can place a 2-tile high tower
    if (cy + 1 >= DefenseModel.rows) return false; // Need space for 2 tiles vertically
    
    const cell = DefenseModel.grid?.[cy]?.[cx];
    const cellBelow = DefenseModel.grid?.[cy + 1]?.[cx];
    
    return cell && !cell.tower && cellBelow && !cellBelow.tower;
  }

  placeTower(cx, cy) {
    if (!this.canPlaceTower(cx, cy)) return;

    // Check if we have enough gold
    const towerCost = BUILDING_COSTS[BUILDING_TYPES.TOWER];
    if (GameModel.gold < towerCost) {
      alert("Not enough gold to place tower!");
      return;
    }

    // Deduct gold and place tower
    GameModel.gold -= towerCost;
    
    const cell = DefenseModel.grid[cy][cx];
    const cellBelow = DefenseModel.grid[cy + 1][cx];

    // Use same coordinate calculation as preview
    const x = cx * TILE_SIZE + 1;
    const y = cy * TILE_SIZE + 1;
    const tower = this.add.image(x, y, "tower_frame_1");
    tower.setDisplaySize(TILE_SIZE - 2, TILE_SIZE * 2 - 2); // 2 tiles high
    tower.setOrigin(0, 0); // Anchor to top-left to match preview alignment
    tower.setDepth(3);
    
    const frames = ["tower_frame_1", "tower_frame_2", "tower_frame_3"];
    let fi = 0;
    this.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { tower.setTexture(frames[fi]); } catch {} } });

    const towerObj = { cx, cy, sprite: tower, lastShotMs: 0, cooldownMs: 900 };
    DefenseModel.towers.push(towerObj);
    
    // Mark both cells as occupied by the tower
    cell.tower = towerObj;
    cellBelow.tower = towerObj;
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
    
    // Steal 5 gold from the player
    if (GameModel.gold !== undefined) {
      GameModel.gold -= 5;
      
      // Show gold stolen message
      this.showGoldStolenMessage();
      
      // Check for game over condition
      if (GameModel.gold < 0) {
        this.triggerGameOver();
      }
    }
  }

  showGoldStolenMessage() {
    // Create temporary message
    const message = this.add.text(100, 80, "5 GOLD STOLEN!", {
      fontSize: "20px",
      color: "#ff4444",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3
    });
    message.setOrigin(0.5);
    message.setDepth(25);
    
    // Animate the message
    this.tweens.add({
      targets: message,
      y: 60,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        message.destroy();
      }
    });
  }

  triggerGameOver() {
    // Stop all game systems
    if (window.__questSystem) {
      window.__questSystem.stop();
    }
    
    // Emit game over event with final score
    EventBus.emit("game-over", GameModel.gold);
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

  // Show attack timer on tower defense screen
  showAttackTimer() {
    if (this._attackTimer) {
      this._attackTimer.destroy();
    }
    if (this._attackTimerText) {
      this._attackTimerText.destroy();
    }

    // Create timer background
    this._attackTimer = this.add.rectangle(100, 30, 200, 40, 0x8b0000, 0.8);
    this._attackTimer.setDepth(20);
    
    // Create timer text
    this._attackTimerText = this.add.text(100, 30, "ATTACK IN: 30s", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this._attackTimerText.setOrigin(0.5);
    this._attackTimerText.setDepth(21);

    // Start countdown
    let timeLeft = 30;
    const countdown = setInterval(() => {
      timeLeft--;
      if (this._attackTimerText) {
        this._attackTimerText.setText(`ATTACK IN: ${timeLeft}s`);
      }
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        if (this._attackTimer) {
          this._attackTimer.destroy();
          this._attackTimer = null;
        }
        if (this._attackTimerText) {
          this._attackTimerText.destroy();
          this._attackTimerText = null;
        }
      }
    }, 1000);
  }
}
