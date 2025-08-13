import Grid from "./core/Grid";
import GameModel from "./core/GameModel";
import Pointer from "./core/Pointer";
import TimeSystem from "./core/TimeSystem";
import PopulationSystem from "./core/PopulationSystem";
import ResourceSystem from "./core/ResourceSystem";
import handlePointerDown from "../../handlers/handlePointerDown";
import EventBus from "./events/eventBus";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.reactCallback = null;
  }

  init() {
    this.reactCallback = (payload) => EventBus.emit("open-building-ui", payload);
  }

  create() {
    GameModel.gridData = Grid.createGrid(this);

    Pointer.init(this);
    this.input.on("pointerdown", (p) => handlePointerDown(this, p));

    PopulationSystem.start(this);
    ResourceSystem.start(this);

    EventBus.on("train", ({ profession }) => {
      PopulationSystem.trainVillager(this, profession);
    });

    this.add.text(12, 12, "1: House  |  2: Training Center  |  Esc: Cancel", { fontSize: 14, color: "#eaeaea" });
  }

  update(time, delta) {
    // placeholder
  }
}
