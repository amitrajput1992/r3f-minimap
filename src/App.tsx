import React from "react";
import "./App.css";
import React100Div from "react-div-100vh";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace, Vector3 } from "three";
import Terrain from "@/src/components/Terrain";
import Minimap from "@/src/components/Minimap";
import { cameraProps } from "@/src/helpers/utils.ts";
import { ResizeObserver } from "@juggle/resize-observer";

const mapURL = "https://u.vrgmetri.com/gb-sms-dev/media/2022-12/gmetri/2632a7cd-799a-4d66-b94c-fe12567a7fb5/o/city_map_compressed_2.glb";

function App() {
  return (
    <React100Div>
      <Canvas
        resize={{ polyfill: ResizeObserver }}
        onCreated={() => {
        }}
        gl={{
          powerPreference: "high-performance",
          // useLegacyLights: false,
          outputColorSpace: SRGBColorSpace,
          toneMapping: ACESFilmicToneMapping,
          // logarithmicDepthBuffer: true,
          antialias: true,
          alpha: true
        }}
        dpr={window.devicePixelRatio}
        orthographic={true}
        camera={{
          zoom: cameraProps.zoom,
          position: cameraProps.position,
          far: cameraProps.far,
          near: cameraProps.near,
          // up: [0, 0, 1],
        }}
      >
        <React.Suspense fallback={null}>
          <ambientLight intensity={1} />
          <OrbitControls position={new Vector3(0, 0, 0)} target={new Vector3(0, 0, -8)}/>

          <group name={"world"}>
            <React.Suspense fallback={null}>
              <Terrain
                mapURL={mapURL}
                spawnPos={[26, 0, 9]}
              />

              <Minimap />
            </React.Suspense>
          </group>
          <Stats />
        </React.Suspense>
      </Canvas>
    </React100Div>
  );
}

export default App;
