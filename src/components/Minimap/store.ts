import create from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Vector3 } from "three";

type Store = {
  playerPosition: Vector3,
  setPlayerPosition: (playerPosition: Vector3) => void,
};

export const useStore = create(subscribeWithSelector<Store>((set, _get) => ({
  playerPosition: new Vector3(),
  setPlayerPosition: (playerPosition: Vector3) => set({ playerPosition }),
})));