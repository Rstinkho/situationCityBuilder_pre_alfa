import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE } from "./constants";

const Pointer = {
  selected: null,
  preview: null,

  init(scene) {
    this.preview = scene.add.rectangle(0, 0, TILE_SIZE - 2, TILE_SIZE - 2, 0xffffff, 0.15);
    this.preview.setOrigin(0, 0);
    this.preview.setVisible(false);

    scene.input.keyboard.on("keydown-ONE", () => this.setSelected(scene, BUILDING_TYPES.HOUSE));
    scene.input.keyboard.on("keydown-TWO", () => this.setSelected(scene, BUILDING_TYPES.TRAINING_CENTER));
    scene.input.keyboard.on("keydown-ESC", () => this.clear(scene));

    scene.input.on("pointermove", (pointer) => {
      const x = Math.floor(pointer.worldX / TILE_SIZE) * TILE_SIZE + 1;
      const y = Math.floor(pointer.worldY / TILE_SIZE) * TILE_SIZE + 1;
      this.preview.setPosition(x, y);
    });
  },

  setSelected(scene, type) {
    this.selected = type;
    const { w, h } = BUILDING_SIZES[type];
    this.preview.setSize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
    this.preview.setVisible(true);
    scene.input.setDefaultCursor("crosshair");
  },

  clear(scene) {
    this.selected = null;
    this.preview.setVisible(false);
    scene.input.setDefaultCursor("default");
  },
};

export default Pointer;
