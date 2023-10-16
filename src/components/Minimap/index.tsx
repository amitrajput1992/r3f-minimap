import { Suspense, useEffect, useMemo, useRef } from "react";
import { Hud, OrthographicCamera as OrthographicCameraDrei } from "@react-three/drei";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three-stdlib/loaders/GLTFLoader";
// @ts-ignore
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { Euler, Group, MathUtils, Mesh, Vector3, Box3 } from "three";
import { attachDRACOLoader } from "@/src/helpers/attachDRACOLoader.ts";
import { cameraProps } from "@/src/helpers/utils.ts";
import { useStore } from "@/src/store.ts";

type Props = {
  renderPriority?: number,
  alignment?:
    | "top-left"
    | "top-right"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center"
    | "center-right"
    | "center-left"
    | "center-center"
    | "top-center"
  margin?: [number, number]
};

const Minimap = (props: Props) => {
  const {
    renderPriority,
    alignment = "bottom-left",
    margin = [10, 10],
  } = props;

  const size = useThree((state) => state.size);
  const ref = useRef<Group>(null!);

  // Position gizmo component within scene
  const [marginX, marginY] = margin;
  const x = alignment.endsWith("-center")
    ? 0
    : alignment.endsWith("-left")
      ? -size.width / 2 + marginX
      : size.width / 2 - marginX;
  const y = alignment.startsWith("center-")
    ? 0
    : alignment.startsWith("top-")
      ? size.height / 2 - marginY
      : -size.height / 2 + marginY;

  useEffect(() => {
    const size = new Vector3();
    const box3 = new Box3().setFromObject(ref.current);
    box3.getSize(size);

    const [xt, yt] = (() => {
      switch(alignment) {
        case "bottom-center": return [x, y + size.y / 2, 0];
        case "top-center": return [x, y - size.y / 2, 0];
        case "bottom-left": return [x + size.x / 2, y + size.y / 2, 0];
        case "bottom-right": return [x - size.x / 2, y + size.y / 2, 0];
        case "top-left": return [x + size.x / 2, y - size.y / 2, 0];
        case "top-right": return [x - size.x / 2, y - size.y / 2, 0];
        default: return [x, y, 0];
      }
    })();

    ref.current.position.set(xt, yt, 0);

  }, [x, y]);

  return (
    <Hud renderPriority={renderPriority}>
      <group name={"HUD"}>
        <OrthographicCameraDrei
          makeDefault={true}
          near={cameraProps.near}
          far={cameraProps.far}
        />
        <group ref={ref} position={[x, y, 0]}>
          <Suspense fallback={null}>
            <Map />
          </Suspense>
          <ambientLight intensity={2} />
        </group>
      </group>
    </Hud>
  );
};

const minimapUrl = "https://u.vrgmetri.com/gb-sms-dev/media/2022-12/gmetri/2632a7cd-799a-4d66-b94c-fe12567a7fb5/o/city_map_compressed_2.glb";
const rad90 = MathUtils.degToRad(90);

const Map = () => {
  const gltf = useLoader(GLTFLoader, minimapUrl, (loader) => {
    const gltfLoader = loader as unknown as GLTFLoader;
    attachDRACOLoader(gltfLoader);
  });

  const ref = useRef<Group>(null!);
  const ball = useRef<Mesh>(null!);
  const gltfScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf]);

  const euler = new Euler(rad90, 0, 0, "XYZ");

  useEffect(() => useStore.subscribe(
    s => s.playerPosition,
    (playerPosition) => {
      ball.current?.position.copy(playerPosition);
    }
  ), [])

  return (
    <group rotation={euler}>
      <mesh ref={ball} scale={3}>
        <sphereGeometry args={[1, 32, 32, 0, 2 * Math.PI, 0, Math.PI]} />
        <meshBasicMaterial color={"red"} />
      </mesh>
      <primitive
        name={"minimap"}
        object={gltfScene}
        ref={ref}
      />
    </group>
  );
};

export default Minimap;