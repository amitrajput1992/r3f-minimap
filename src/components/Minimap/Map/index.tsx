import { useEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three-stdlib";
import { attachDRACOLoader } from "@/src/helpers/attachDRACOLoader.ts";
import { Box3, BoxGeometry, Euler, Group, MathUtils, Mesh, Vector2, Vector3 } from "three";
// @ts-ignore
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { useStore } from "@/src/components/Minimap/store.ts";
import { ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events";

const rad90 = MathUtils.degToRad(90);
const rotation = [rad90, 0, 0];
const pointer = new Vector2();
let pointerDown = false;

const scaleMultiplier = 20;

const Map = ({ enableRotate, scale = 1, url }: { enableRotate?: boolean, scale?: number, url: string }) => {
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    const gltfLoader = loader as unknown as GLTFLoader;
    attachDRACOLoader(gltfLoader);
  });
  const size = useThree(s => s.size);

  const parent = useRef<Group>(null!);
  const container = useRef<Mesh>(null!);
  const ref = useRef<Group>(null!);
  const ball = useRef<Mesh>(null!);
  const gltfScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf]);

  // const euler = new Euler(0, 0, 0, "XYZ");
  const euler = new Euler(rotation[0], rotation[1], rotation[2], "XYZ");

  useEffect(() => useStore.subscribe(
    s => s.playerPosition,
    (playerPosition) => {
      ball.current?.position.copy(playerPosition);
    },
  ), []);


  // Manually track the pointer events on the map mesh and
  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    pointerDown = true;
    pointer.set(
      event.clientX,
      event.clientY,
    );
  }

  function onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    pointerDown = false;
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointerDown) {
      return;
    }
    event.stopPropagation();

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;

    const fov = 60 * MathUtils.DEG2RAD;
    const aspect = size.width / size.height;
    const y = dx / size.width * fov * aspect;
    const x = dy / size.height * fov;

    const fx = parent.current.rotation.x + x;
    const fy = parent.current.rotation.y + y;

    if (enableRotate) {
      parent.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, fx));
      parent.current.rotation.y = fy;
    }
  }

  useEffect(() => {
    const size = new Vector3();
    const box3 = new Box3().setFromObject(ref.current);
    box3.getSize(size);

    const geom = new BoxGeometry(size.x, size.y * 4, size.z);
    container.current.geometry = geom;
    container.current.matrixWorldNeedsUpdate = true;

    document.addEventListener("pointerup", onPointerUp, false);
    document.addEventListener("pointermove", onPointerMove, false);

    return () => {
      document.removeEventListener("pointerup", onPointerUp, false);
      document.removeEventListener("pointermove", onPointerMove, false);
    };
  }, []);

  return (
    <group rotation={euler} ref={parent} onPointerDown={onPointerDown} scale={scale}>
      {/* Wrapping box */}
      <mesh ref={container}>
        <boxGeometry attach={"geometry"} args={[50, 50, 50]} />
        <meshBasicMaterial attach={"material"} transparent={true} opacity={0} />
      </mesh>

      <mesh ref={ball} scale={3}>
        <sphereGeometry args={[1, 32, 32, 0, 2 * Math.PI, 0, Math.PI]} />
        <meshBasicMaterial color={"red"} />
      </mesh>
      <primitive
        name={"minimap"}
        object={gltfScene}
        ref={ref}
        scale={scaleMultiplier}
      />
    </group>
  );
};

export default Map;