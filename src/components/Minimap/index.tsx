import { Suspense, useEffect, useRef } from "react";
import { Hud, OrthographicCamera as OrthographicCameraDrei } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Group, Vector3, Box3 } from "three";
import { cameraProps } from "@/src/helpers/utils.ts";
import Map from "@/src/components/Minimap/Map";

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
  margin?: [number, number],
  scale?: number,
  url: string
};

const Minimap = (props: Props) => {
  const {
    renderPriority,
    alignment = "bottom-left",
    margin = [10, 10],
    url,
    scale
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

    console.log({ size });

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
        {/*<OrbitControls />*/}
        <group ref={ref} position={[x, y, 0]}>
          <Suspense fallback={null}>
            <Map scale={scale} url={url}/>
          </Suspense>
          <ambientLight intensity={2} />
        </group>
      </group>
    </Hud>
  );
};

export default Minimap;