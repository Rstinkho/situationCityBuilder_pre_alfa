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
  QUARRY_NEARBY_RADIUS,
  FISHERMAN_HUT_NEARBY_RADIUS,
  BUILDING_TYPES,
  BUILDING_SIZES,
  GRID_WIDTH,
  GRID_HEIGHT,
} from "./core/constants";
import {
  setTargetTile as setLumberTarget,
  assignWarehouse as assignLumberWarehouse,
} from "../buildings_logic/lumberyard";
import {
  setTargetTile as setQuarryTarget,
  assignWarehouse as assignQuarryWarehouse,
} from "../buildings_logic/quarry";
import { assignWarehouse as assignFarmWarehouse } from "../buildings_logic/farm";
import {
  setTargetTile as setFisherTarget,
  assignWarehouse as assignFisherWarehouse,
} from "../buildings_logic/fisherman_hut";
import { fetchLatestTilesFromSupabase } from "../utils/supabase";

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

    // Set up the camera to properly handle the grid
    this.cameras.main.setBounds(
      0,
      0,
      GRID_WIDTH * TILE_SIZE,
      GRID_HEIGHT * TILE_SIZE
    );
    this.cameras.main.setZoom(1);

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

    // Attempt to load saved tile types from Supabase and apply to grid
    this.loadSavedTilesIfAny();

    this.generateBuildingTextures();
    this.generateHudIconTextures();

    // Launch tower defense scene
    this.scene.launch("DefenseScene");

    Pointer.init(this);
    this.input.on("pointerdown", (p) => {
      // Convert pointer coordinates to world coordinates
      const worldX = p.worldX;
      const worldY = p.worldY;

      // Tower defense is now in a separate canvas, so no need to check viewport
      // Remove the viewport check that was interfering with main game clicks

      // Ensure we're within the grid bounds
      const grid = GameModel.gridData;
      if (!grid || !grid.length) {
        console.warn("Grid data not available");
        return;
      }

      const { cx, cy } = Grid.worldToCell(worldX, worldY);

      // Debug logging for coordinate issues
      if (cx < 0 || cy < 0 || cx >= grid[0].length || cy >= grid.length) {
        console.log(
          `Click outside grid bounds: world(${worldX}, ${worldY}) -> grid(${cx}, ${cy}), grid size: ${grid[0].length}x${grid.length}`
        );
        return;
      }

      // Log successful grid clicks for debugging
      console.log(
        `Click at grid(${cx}, ${cy}) from world(${worldX}, ${worldY})`
      );

      if (window.__pickLumberTile) {
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
      if (window.__pickQuarryTile) {
        const ok = setQuarryTarget(
          this,
          window.__pickQuarryTile.x,
          window.__pickQuarryTile.y,
          cx,
          cy
        );
        this.clearPickMode();
        return;
      }
      if (window.__pickFisherTile) {
        const ok = setFisherTarget(
          this,
          window.__pickFisherTile.x,
          window.__pickFisherTile.y,
          cx,
          cy
        );
        this.clearPickMode();
        return;
      }
      if (window.__pickAssign) {
        const wh = grid[cy]?.[cx];
        const src = window.__pickAssign;
        if (wh && wh.buildingType === BUILDING_TYPES.WAREHOUSE) {
          // Allow clicking on any warehouse tile, find the root for assignment
          const warehouseRoot = wh.root;
          if (
            warehouseRoot &&
            warehouseRoot.buildingType === BUILDING_TYPES.WAREHOUSE
          ) {
            if (src.type === "lumberyard") {
              assignLumberWarehouse(
                this,
                src.x,
                src.y,
                warehouseRoot.x,
                warehouseRoot.y
              );
            } else if (src.type === "quarry") {
              assignQuarryWarehouse(
                this,
                src.x,
                src.y,
                warehouseRoot.x,
                warehouseRoot.y
              );
            } else if (src.type === "farm") {
              assignFarmWarehouse(
                this,
                src.x,
                src.y,
                warehouseRoot.x,
                warehouseRoot.y
              );
            } else if (src.type === "fisherman_hut") {
              assignFisherWarehouse(
                this,
                src.x,
                src.y,
                warehouseRoot.x,
                warehouseRoot.y
              );
            }
          }
        }
        this.clearPickMode();
        return;
      }
      if (window.__adminMode && window.__adminTileType) {
        const cell = grid[cy]?.[cx];
        if (cell) {
          cell.tileType = window.__adminTileType;
          Grid.redrawTileOverlay(this, GameModel.gridData);
        }
        return;
      }

      // Handle normal building placement and interaction
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
    this.input.keyboard.on("keydown-SHIFT", () =>
      Grid.setTileOverlayVisible(this, true)
    );
    this.input.keyboard.on("keyup-SHIFT", () =>
      Grid.setTileOverlayVisible(this, !!window.__adminMode)
    );
    this.input.keyboard.on("keydown-ESC", () => this.clearPickMode());

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

  async loadSavedTilesIfAny() {
    try {
      const { data: tyles, error } = await fetchLatestTilesFromSupabase();
      if (error || !tyles) return;
      const grid = GameModel.gridData || [];
      const height = Math.min(grid.length, tyles.length || 0);
      for (let y = 0; y < height; y++) {
        const row = grid[y];
        const savedRow = tyles[y] || [];
        const width = Math.min(row.length, savedRow.length || 0);
        for (let x = 0; x < width; x++) {
          const cell = row[x];
          const savedType = savedRow[x];
          if (savedType && Object.values(TILE_TYPES).includes(savedType)) {
            cell.tileType = savedType;
          }
        }
      }
      Grid.redrawTileOverlay(this, grid);
    } catch (_) {
      // ignore loading errors to keep game running
    }
  }

  generateBuildingTextures() {
    const defs = [
      { base: "house", color: 0x88bbff },
      { base: "training", color: 0xffd37a },
      { base: "farm", color: 0xa8d08d },
      { base: "lumber", color: 0xb5651d },
      { base: "quarry", color: 0x7f8c8d },
      { base: "fisher", color: 0x3498db },
      { base: "warehouse", color: 0xb2955b },
      { base: "tower", color: 0x8d8f3a },
    ];
    defs.forEach(({ base, color }) => {
      for (let i = 1; i <= 3; i++) {
        const g = this.add.graphics();
        const w =
          base === "tower"
            ? TILE_SIZE - 2
            : TILE_SIZE * (base === "training" ? 3 : 2) - 2;
        const h = base === "tower" ? TILE_SIZE - 2 : TILE_SIZE * 2 - 2;
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, w, h, 4);
        // add a small animated accent varying by frame
        g.fillStyle(0xffffff, 0.15 * i);
        g.fillRect(4, 4, Math.max(4, Math.floor(w * 0.3)), 6);
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
    } else if (window.__pickMode === "quarry" && window.__pickQuarryTile) {
      this.input.setDefaultCursor("crosshair");
      this.showPickOverlay();
    } else if (
      window.__pickMode === "fisherman_hut" &&
      window.__pickFisherTile
    ) {
      this.input.setDefaultCursor("crosshair");
      this.showPickOverlay();
    } else if (
      window.__pickMode === "assign_warehouse" &&
      window.__pickAssign
    ) {
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
    } else if (ui?.type === "quarry") {
      const cell = GameModel.gridData?.[ui.y]?.[ui.x];
      const target = cell?.data?.targetTile;
      if (target) this.drawHighlightTile(target.x, target.y, 0x00ff00, 0.25);
    } else if (ui?.type === "fisherman_hut") {
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
    const isLumber =
      window.__pickMode === "lumberyard" && window.__pickLumberTile;
    const isQuarry = window.__pickMode === "quarry" && window.__pickQuarryTile;
    const isFisher =
      window.__pickMode === "fisherman_hut" && window.__pickFisherTile;
    const isAssignWh =
      window.__pickMode === "assign_warehouse" && window.__pickAssign;
    if (isAssignWh) {
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          const c = grid[y][x];
          if (c.buildingType === BUILDING_TYPES.WAREHOUSE && c.root === c) {
            // Highlight all 3x3 tiles of the warehouse
            const { w, h } = BUILDING_SIZES[BUILDING_TYPES.WAREHOUSE];
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                const highlightX = x + dx;
                const highlightY = y + dy;
                if (highlightX < grid[0].length && highlightY < grid.length) {
                  this.drawHighlightTile(highlightX, highlightY, 0x00aaff, 0.3);
                }
              }
            }
          }
        }
      }
      return;
    }
    const base = isLumber
      ? window.__pickLumberTile
      : isQuarry
      ? window.__pickQuarryTile
      : window.__pickFisherTile;
    const r = isLumber
      ? LUMBERYARD_NEARBY_RADIUS
      : isQuarry
      ? QUARRY_NEARBY_RADIUS
      : FISHERMAN_HUT_NEARBY_RADIUS;
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
        const ok = isLumber
          ? cell.tileType === TILE_TYPES.FOREST
          : isQuarry
          ? cell.tileType === TILE_TYPES.MOUNTAIN
          : cell.tileType === TILE_TYPES.WATER;
        if (ok) {
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
    window.__pickQuarryTile = null;
    window.__pickFisherTile = null;
    window.__pickAssign = null;
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
    // Stone icon
    if (!this.textures.exists("icon_stone")) {
      const g = this.add.graphics();
      g.fillStyle(0x95a5a6, 1);
      g.fillRoundedRect(3, 5, 10, 8, 2);
      g.lineStyle(1, 0x7f8c8d, 1);
      g.strokeRoundedRect(3, 5, 10, 8, 2);
      g.generateTexture("icon_stone", 16, 16);
      g.destroy();
    }
    // Pickaxe icon
    if (!this.textures.exists("icon_pickaxe")) {
      const g = this.add.graphics();
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(10, 4, 4, 20);
      g.fillStyle(0x95a5a6, 1);
      g.fillRoundedRect(2, 4, 12, 8, 3);
      g.generateTexture("icon_pickaxe", 24, 24);
      g.destroy();
    }
    // Fish icon
    if (!this.textures.exists("icon_fish")) {
      const g = this.add.graphics();
      g.fillStyle(0x3498db, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(11, 8, 2);
      g.generateTexture("icon_fish", 16, 16);
      g.destroy();
    }
  }

  createHudOverlay() {
    const baseX = 12;
    const baseY = 12;
    const gapY = 22;
    const iconSize = 16;

    const goldIcon = this.add.image(baseX, baseY, "icon_gold").setOrigin(0, 0);
    const goldText = this.add.text(baseX + iconSize + 6, baseY - 1, "0", {
      fontSize: 14,
      color: "#eaeaea",
    });
    const woodIcon = this.add
      .image(baseX, baseY + gapY, "icon_wood")
      .setOrigin(0, 0);
    const woodText = this.add.text(
      baseX + iconSize + 6,
      baseY + gapY - 1,
      "0",
      { fontSize: 14, color: "#eaeaea" }
    );
    const stoneIcon = this.add
      .image(baseX, baseY + gapY * 2, "icon_stone")
      .setOrigin(0, 0);
    const stoneText = this.add.text(
      baseX + iconSize + 6,
      baseY + gapY * 2 - 1,
      "0",
      { fontSize: 14, color: "#eaeaea" }
    );
    const popIcon = this.add
      .image(baseX, baseY + gapY * 3, "icon_pop")
      .setOrigin(0, 0);
    const popText = this.add.text(
      baseX + iconSize + 6,
      baseY + gapY * 3 - 1,
      "0/0",
      { fontSize: 14, color: "#eaeaea" }
    );

    // keep overlay anchored to camera
    [
      goldIcon,
      goldText,
      woodIcon,
      woodText,
      stoneIcon,
      stoneText,
      popIcon,
      popText,
    ].forEach((o) => o.setScrollFactor(0));
    const depth = 1000;
    [
      goldIcon,
      goldText,
      woodIcon,
      woodText,
      stoneIcon,
      stoneText,
      popIcon,
      popText,
    ].forEach((o) => o.setDepth(depth));

    this.__hudGoldText = goldText;
    this.__hudWoodText = woodText;
    this.__hudStoneText = stoneText;
    this.__hudPopText = popText;
    this.__hudLastGold = null;
    this.__hudLastWood = null;
    this.__hudLastStone = null;
    this.__hudLastPop = null;

    this.updateHudOverlay(true);
  }

  updateHudOverlay(force = false) {
    const gold = GameModel.gold.toFixed(2);
    const wood = (GameModel.resources?.wood || 0).toFixed(1);
    const stone = (GameModel.resources?.stone || 0).toFixed(1);
    const pop = `${GameModel.population?.current || 0}/${
      GameModel.population?.cap || 0
    }`;
    if (force || this.__hudLastGold !== gold) {
      this.__hudGoldText?.setText(gold);
      this.__hudLastGold = gold;
    }
    if (force || this.__hudLastWood !== wood) {
      this.__hudWoodText?.setText(wood);
      this.__hudLastWood = wood;
    }
    if (force || this.__hudLastStone !== stone) {
      this.__hudStoneText?.setText(stone);
      this.__hudLastStone = stone;
    }
    if (force || this.__hudLastPop !== pop) {
      this.__hudPopText?.setText(pop);
      this.__hudLastPop = pop;
    }
  }
}
