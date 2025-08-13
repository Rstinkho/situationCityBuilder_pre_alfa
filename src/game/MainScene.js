import Grid from "./core/Grid";
import GameModel from "./core/GameModel";
import Pointer from "./core/Pointer";
import TimeSystem from "./core/TimeSystem";
import PopulationSystem from "./core/PopulationSystem";
import ResourceSystem from "./core/ResourceSystem";
import handlePointerDown from "../../handlers/handlePointerDown";
import EventBus from "./events/eventBus";
import { TILE_SIZE } from "./core/constants";
import { setTargetTile as setLumberTarget } from "../buildings_logic/lumberyard";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.reactCallback = null;
    this.tileHint = null;
  }

  init() {
    this.reactCallback = (payload) => EventBus.emit("open-building-ui", payload);
  }

  create() {
    GameModel.gridData = Grid.createGrid(this);
    window.__phaserScene = this;

    Pointer.init(this);
    this.input.on("pointerdown", (p) => {
      if (window.__pickLumberTile) {
        const { cx, cy } = Grid.worldToCell(p.worldX, p.worldY);
        const ok = setLumberTarget(this, window.__pickLumberTile.x, window.__pickLumberTile.y, cx, cy);
        window.__pickLumberTile = null;
        return;
      }
      handlePointerDown(this, p);
    });

    PopulationSystem.start(this);
    ResourceSystem.start(this);

    EventBus.on("train", ({ profession }) => {
      PopulationSystem.trainVillager(this, profession);
    });

    this.add.text(12, 12, "1: House  |  2: Training Center  |  3: Farm  |  4: Lumberyard  |  Esc: Cancel  |  Shift: Tiles", { fontSize: 14, color: "#eaeaea" });

    this.tileHint = this.add.text(0, 0, "", { fontSize: 12, color: "#ddd" });
    this.tileHint.setDepth(1000);
    this.input.keyboard.on("keydown-SHIFT", () => Grid.setTileOverlayVisible(this, true));
    this.input.keyboard.on("keyup-SHIFT", () => Grid.setTileOverlayVisible(this, false));

    this.input.on("pointermove", (pointer) => {
      const grid = GameModel.gridData;
      const cx = Math.max(0, Math.min(grid[0].length - 1, Math.floor(pointer.worldX / TILE_SIZE)));
      const cy = Math.max(0, Math.min(grid.length - 1, Math.floor(pointer.worldY / TILE_SIZE)));
      const cell = grid[cy][cx];
      this.tileHint.setPosition(pointer.worldX + 12, pointer.worldY + 8);
      this.tileHint.setText(cell?.tileType || "");
      this.tileHint.setVisible(pointer.event.shiftKey);
    });
  }

  update(time, delta) {
    // placeholder
  }
}
