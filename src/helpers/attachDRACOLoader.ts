import { GLTFLoader } from "three-stdlib/loaders/GLTFLoader";
import { DRACOLoader } from "three-stdlib/loaders/DRACOLoader";


export function attachDRACOLoader(loader: GLTFLoader): void {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://s.vrgmetri.com/gb-web/z5-edge/draco/1.5.3/");
  loader.setDRACOLoader(dracoLoader);
}