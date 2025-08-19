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
      handlePointerDown(this, p);
    });

    PopulationSystem.start(this);
    ResourceSystem.start(this);

    EventBus.on("train", ({ profession }) => {
      PopulationSystem.trainVillager(this, profession);
    });

    this.add.text(
      12,
      12,
      "1: House  |  2: Training Center  |  3: Farm  |  4: Lumberyard  |  Esc: Cancel  |  Shift: Tiles",
      { fontSize: 14, color: "#eaeaea" }
    );

    this.tileHint = this.add.text(0, 0, "", { fontSize: 12, color: "#ddd" });
    this.tileHint.setDepth(1000);
    this.input.keyboard.on("keydown-SHIFT", () =>
      Grid.setTileOverlayVisible(this, true)
    );
    this.input.keyboard.on("keyup-SHIFT", () =>
      Grid.setTileOverlayVisible(this, false)
    );

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
      this.tileHint.setVisible(pointer.event.shiftKey);
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
}
