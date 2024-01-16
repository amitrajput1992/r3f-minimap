import { useEffect, useRef } from "react";
import { Hud, useFBO } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DoubleSide,
  Euler,
  Group,
  LinearFilter,
  MathUtils,
  PerspectiveCamera,
  RGBAFormat,
  Vector3,
} from "three";
import { OrthographicCamera as OrthographicCameraDrei, PerspectiveCamera as PerspectiveCameraDrei } from "@react-three/drei";
import { useStore } from "@/src/components/Minimap/store.ts";
import MFrame from "../MFrame";

const renderTargetParameters = {
  minFilter: LinearFilter,
  magFilter: LinearFilter,
  format: RGBAFormat,
};

/**
 * 1. Mount a camera on top of the avatar at a distance of 5M in Y
 * 2. Start rendering the camera scene with a render priority to a FBO
 * 3. Render the FBO to a Hud Scene on a plane
 */

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
};

const rad = MathUtils.degToRad(0);

const rotation = new Euler(rad, 0, 0, "XYZ")

const DynamicMinimap = (props: Props) => {
  const {
    renderPriority,
    alignment = "bottom-left",
    margin = [10, 10],
  } = props;

  const size = useThree((state) => state.size);
  const ref = useRef<Group>(null!);
  const fbo = useFBO();
  const cameraFBO = useRef<PerspectiveCamera>(null!);

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

  useEffect(() => useStore.subscribe(
    s => s.playerPosition,
    (playerPosition) => {
      if(!cameraFBO.current) {
        return;
      }

      cameraFBO.current.position.copy(playerPosition);
      cameraFBO.current.position.add(new Vector3(0, 10, 0));

      cameraFBO.current.lookAt(playerPosition);
    }), [])

  useFrame(({gl, scene, camera}) => {
    if(!cameraFBO.current) {
      return;
    }

    // render FBO scene
    gl.clear();
    gl.setRenderTarget( fbo );
    gl.render( scene, camera );
    // gl.render( scene, cameraFBO.current );

    gl.setRenderTarget( null );
  });

  return (
    <group>
      <PerspectiveCameraDrei position={[0, 0, 0]} ref={cameraFBO} />
      {/*<perspectiveCamera position={[0, 10, 0]} ref={cameraFBO} />*/}
      <Hud renderPriority={renderPriority}>
        <group name={"hud-scene"}>
          <OrthographicCameraDrei
            makeDefault={true}
            position={[0, 0, 10]}
            near={-1000}
            far={1000}
            up={[0, 1, 0]}
          />
          <group name={"hud-fbo"} ref={ref} position={[x, y, 0]}>
            <MFrame
              height={200}
              width={200}
              borderRadius={100}
              borderWidth={1}
              backgroundOpacity={0}
            >
              <mesh rotation={rotation} scale={200}>
                <circleGeometry attach={"geometry"} args={[0.5, 32]}/>
                <meshBasicMaterial
                  attach={"material"}
                  transparent={true}
                  side={DoubleSide}
                  map={fbo.texture}
                />
              </mesh>
            </MFrame>
          </group>
          <ambientLight intensity={2} />
        </group>
      </Hud>
    </group>
  );
};

export default DynamicMinimap;