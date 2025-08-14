import { POPULATION_CAP_START } from "./constants";

const GameModel = {
  gold: 100,
  population: {
    current: 0,
    cap: POPULATION_CAP_START,
  },
  professions: {
    farmer: 0,
    forester: 0,
  },
  resources: {
    wheat: 0,
    wood: 0,
  },
  gridData: null,
};

export default GameModel;
