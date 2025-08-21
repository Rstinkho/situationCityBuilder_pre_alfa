import MainScene from "../MainScene";
import DefenseScene from "../../tower_defense/DefenseScene";

const phaserConfig = {
  type: Phaser.AUTO,
  width: 1026,
  height: 1024,
  backgroundColor: "#202428",
  pixelArt: true,
  scene: [MainScene, DefenseScene],
};

export default phaserConfig;
