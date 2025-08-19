import Grid from "./core/Grid";
import GameModel from "./core/GameModel";
import Pointer from "./core/Pointer";
import TimeSystem from "./core/TimeSystem";
import PopulationSystem from "./core/PopulationSystem";
import ResourceSystem from "./core/ResourceSystem";
import handlePointerDown from "../../handlers/handlePointerDown";
import EventBus from "./events/eventBus";
import {
  TILE_SIZE,
  TILE_TYPES,
  LUMBERYARD_NEARBY_RADIUS,
} from "./core/constants";
import { setTargetTile as setLumberTarget } from "../buildings_logic/lumberyard";

//Import idle state of buildings
import farmIdle from "../buildings_logic/farm_idle.png";
import houseIdle from "../buildings_logic/house_idle.png";
import lumberIdle from "../buildings_logic/1.png";
import trainingIdle from "../buildings_logic/training_idle.png";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.reactCallback = null;
    this.tileHint = null;
    this.pickOverlay = null;
    this.__adminAssignRect = null;
  }
  preload() {
    this.load.image("bg", "assets/bg.png");
    this.load.spritesheet("farm_idle", farmIdle, {
      frameWidth: 63,
      frameHeight: 63,
    });
    this.load.spritesheet("house_idle", houseIdle, {
      frameWidth: 63,
      frameHeight: 63,
    });
    this.load.spritesheet("lumber_idle", lumberIdle, {
      frameWidth: 120,
      frameHeight: 88,
    });
    this.load.spritesheet("training_idle", trainingIdle, {
      frameWidth: 95,
      frameHeight: 63,
    });
  }
  init() {
    this.reactCallback = (payload) =>
      EventBus.emit("open-building-ui", payload);
  }

  create() {
    this.add.image(0, 0, "bg").setOrigin(0);
    if (!this.anims.exists("farm_idle_anim")) {
      this.anims.create({
        key: "farm_idle_anim",
        frames: this.anims.generateFrameNumbers("farm_idle", {
          start: 0,
          end: 2,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }
    if (!this.anims.exists("house_idle_anim")) {
      this.anims.create({
        key: "house_idle_anim",
        frames: this.anims.generateFrameNumbers("house_idle", {
          start: 0,
          end: 2,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }
    if (!this.anims.exists("lumber_idle_anim")) {
      this.anims.create({
        key: "lumber_idle_anim",
        frames: this.anims.generateFrameNumbers("lumber_idle", {
          start: 0,
          end: 2,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }
    if (!this.anims.exists("training_idle_anim")) {
      this.anims.create({
        key: "training_idle_anim",
        frames: this.anims.generateFrameNumbers("training_idle", {
          start: 0,
          end: 2,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }

    GameModel.gridData = Grid.createGrid(this);
    window.__phaserScene = this;

    this.generateBuildingTextures();
    this.generateHudIconTextures();

    Pointer.init(this);
    this.input.on("pointerdown", (p) => {
      if (window.__pickLumberTile) {
        const { cx, cy } = Grid.worldToCell(p.worldX, p.worldY);
        const ok = setLumberTarget(
          this,
          window.__pickLumberTile.x,
          window.__pickLumberTile.y,
          cx,
          cy
        );
        this.clearPickMode();
        return;
      }
      if (window.__adminMode && window.__adminTileType) {
        const { cx, cy } = Grid.worldToCell(p.worldX, p.worldY);
        const cell = GameModel.gridData?.[cy]?.[cx];
        if (cell) {
          cell.tileType = window.__adminTileType;
          Grid.redrawTileOverlay(this, GameModel.gridData);
        }
        return;
      }
      handlePointerDown(this, p);
    });

    PopulationSystem.start(this);
    ResourceSystem.start(this);

    EventBus.on("train", ({ profession }) => {
      PopulationSystem.trainVillager(this, profession);
    });

    // Create small HUD overlay with icons for Gold, Wood, and Population
    this.createHudOverlay();

    this.tileHint = this.add.text(0, 0, "", { fontSize: 12, color: "#ddd" });
    this.tileHint.setDepth(1000);
    this.input.keyboard.on("keydown-SHIFT", () => Grid.setTileOverlayVisible(this, true));
    this.input.keyboard.on("keyup-SHIFT", () => Grid.setTileOverlayVisible(this, !!window.__adminMode));

    this.input.on("pointermove", (pointer) => {
      const grid = GameModel.gridData;
      const cx = Math.max(
        0,
        Math.min(grid[0].length - 1, Math.floor(pointer.worldX / TILE_SIZE))
      );
      const cy = Math.max(
        0,
        Math.min(grid.length - 1, Math.floor(pointer.worldY / TILE_SIZE))
      );
      const cell = grid[cy][cx];
      this.tileHint.setPosition(pointer.worldX + 12, pointer.worldY + 8);
      this.tileHint.setText(cell?.tileType || "");
      this.tileHint.setVisible(pointer.event.shiftKey || window.__adminMode);
    });

    this.events.on("update", this.onUpdate, this);
  }

  generateBuildingTextures() {
    const defs = [
      { base: "house", color: 0x88bbff },
      { base: "training", color: 0xffd37a },
      { base: "farm", color: 0xa8d08d },
      { base: "lumber", color: 0xb5651d },
    ];
    defs.forEach(({ base, color }) => {
      for (let i = 1; i <= 3; i++) {
        const g = this.add.graphics();
        const w = TILE_SIZE * (base === "training" ? 3 : 2) - 2;
        const h = TILE_SIZE * 2 - 2;
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, w, h, 4);
        // add a small animated accent varying by frame
        g.fillStyle(0xffffff, 0.15 * i);
        g.fillRect(4, 4, Math.max(4, w * 0.3), 6);
        g.generateTexture(`${base}_frame_${i}`, w, h);
        g.destroy();
      }
    });
  }

  onUpdate() {
    // handle pick mode visuals
    if (window.__pickMode === "lumberyard" && window.__pickLumberTile) {
      this.input.setDefaultCursor("crosshair");
      this.showPickOverlay();
    } else {
      if (!Pointer.selected) this.input.setDefaultCursor("default");
      this.hidePickOverlayIfAny();
    }

    // keep selected tile highlighted when UI open
    const ui = window.__uiOpenForBuilding;
    if (ui?.type === "lumberyard") {
      const cell = GameModel.gridData?.[ui.y]?.[ui.x];
      const target = cell?.data?.targetTile;
      if (target) this.drawHighlightTile(target.x, target.y, 0x00ff00, 0.25);
    }

    // refresh HUD overlay values when changed
    this.updateHudOverlay();
  }

  showPickOverlay() {
    if (this.pickOverlay) this.pickOverlay.clear();
    else this.pickOverlay = this.add.graphics();
    this.pickOverlay.setDepth(999);
    this.pickOverlay.clear();
    const g = this.pickOverlay;
    const grid = GameModel.gridData;
    const base = window.__pickLumberTile;
    const r = LUMBERYARD_NEARBY_RADIUS;
    for (
      let y = Math.max(0, base.y - r);
      y <= Math.min(grid.length - 1, base.y + r);
      y++
    ) {
      for (
        let x = Math.max(0, base.x - r);
        x <= Math.min(grid[0].length - 1, base.x + r);
        x++
      ) {
        const cell = grid[y][x];
        if (cell.tileType === TILE_TYPES.FOREST) {
          this.drawHighlightTile(x, y, 0x00ff00, 0.3);
        }
      }
    }
  }

  drawHighlightTile(x, y, color, alpha = 0.3) {
    const g = this.pickOverlay || this.add.graphics();
    if (!this.pickOverlay) {
      this.pickOverlay = g;
      g.setDepth(999);
    }
    g.fillStyle(color, alpha);
    g.fillRect(
      x * TILE_SIZE + 1,
      y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  }

  hidePickOverlayIfAny() {
    if (this.pickOverlay) {
      this.pickOverlay.clear();
    }
  }

  clearPickMode() {
    window.__pickMode = null;
    window.__pickLumberTile = null;
    this.hidePickOverlayIfAny();
    if (!Pointer.selected) this.input.setDefaultCursor("default");
  }

  update(time, delta) {
    // placeholder
  }

  generateHudIconTextures() {
    // Gold icon
    if (!this.textures.exists("icon_gold")) {
      const g = this.add.graphics();
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(8, 8, 7);
      g.lineStyle(2, 0xb7950b, 1);
      g.strokeCircle(8, 8, 7);
      g.generateTexture("icon_gold", 16, 16);
      g.destroy();
    }
    // Wood icon
    if (!this.textures.exists("icon_wood")) {
      const g = this.add.graphics();
      g.fillStyle(0x8e5a2b, 1);
      g.fillRoundedRect(2, 5, 12, 6, 2);
      g.fillStyle(0x6e4520, 1);
      g.fillRoundedRect(1, 7, 14, 2, 1);
      g.generateTexture("icon_wood", 16, 16);
      g.destroy();
    }
    // Population icon (two small heads)
    if (!this.textures.exists("icon_pop")) {
      const g = this.add.graphics();
      g.fillStyle(0x95a5a6, 1);
      g.fillCircle(6, 6, 4);
      g.fillCircle(11, 7, 3.5);
      g.fillStyle(0x7f8c8d, 1);
      g.fillRoundedRect(3, 10, 10, 4, 2);
      g.generateTexture("icon_pop", 16, 16);
      g.destroy();
    }
    // Axe icon
    if (!this.textures.exists("icon_axe")) {
      const g = this.add.graphics();
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(10, 4, 4, 20);
      g.fillStyle(0x8e5a2b, 1);
      g.fillRoundedRect(2, 4, 12, 8, 3);
      g.generateTexture("icon_axe", 24, 24);
      g.destroy();
    }
  }

  createHudOverlay() {
    const baseX = 12;
    const baseY = 12;
    const gapY = 22;
    const iconSize = 16;

    const goldIcon = this.add.image(baseX, baseY, "icon_gold").setOrigin(0, 0);
    const goldText = this.add.text(baseX + iconSize + 6, baseY - 1, "0", { fontSize: 14, color: "#eaeaea" });
    const woodIcon = this.add.image(baseX, baseY + gapY, "icon_wood").setOrigin(0, 0);
    const woodText = this.add.text(baseX + iconSize + 6, baseY + gapY - 1, "0", { fontSize: 14, color: "#eaeaea" });
    const popIcon = this.add.image(baseX, baseY + gapY * 2, "icon_pop").setOrigin(0, 0);
    const popText = this.add.text(baseX + iconSize + 6, baseY + gapY * 2 - 1, "0/0", { fontSize: 14, color: "#eaeaea" });

    // keep overlay anchored to camera
    [goldIcon, goldText, woodIcon, woodText, popIcon, popText].forEach((o) => o.setScrollFactor(0));
    const depth = 1000;
    [goldIcon, goldText, woodIcon, woodText, popIcon, popText].forEach((o) => o.setDepth(depth));

    this.__hudGoldText = goldText;
    this.__hudWoodText = woodText;
    this.__hudPopText = popText;
    this.__hudLastGold = null;
    this.__hudLastWood = null;
    this.__hudLastPop = null;

    this.updateHudOverlay(true);
  }

  updateHudOverlay(force = false) {
    const gold = GameModel.gold.toFixed(2);
    const wood = (GameModel.resources?.wood || 0).toFixed(1);
    const pop = `${GameModel.population?.current || 0}/${GameModel.population?.cap || 0}`;
    if (force || this.__hudLastGold !== gold) {
      this.__hudGoldText?.setText(gold);
      this.__hudLastGold = gold;
    }
    if (force || this.__hudLastWood !== wood) {
      this.__hudWoodText?.setText(wood);
      this.__hudLastWood = wood;
    }
    if (force || this.__hudLastPop !== pop) {
      this.__hudPopText?.setText(pop);
      this.__hudLastPop = pop;
    }
  }
}
