import React, { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three-stdlib/loaders/GLTFLoader";
import { attachDRACOLoader } from "../../helpers/attachDRACOLoader";
import NavMesh from "./NavMesh";
import { Object3D, Vector3 } from "three";

/**
 * Renders the Terrain Map and the associated Navmesh. Also manages the movement of the player across the map
 */

type Props = {
  spawnPos?: number[],
  mapURL: string,
  onPathWalkStart?: (v: Vector3) => void,
  onPathWalkStop?: () => void,
  onPathWalkPositionUpdate?: (v: Vector3) => void,
};

const Terrain = ({ spawnPos, mapURL, onPathWalkStop, onPathWalkStart, onPathWalkPositionUpdate }: Props) => {

  const gltf = useLoader(GLTFLoader, mapURL, (loader) => {
    const gltfLoader = loader as unknown as GLTFLoader;
    attachDRACOLoader(gltfLoader);
  });

  const gltfScene = gltf.scene;

  useEffect(() => {
    gltfScene.traverse(function(node: Object3D) {
      // * Terrain should only receive shadows. Only buildings can cast shadows
      if (node.type === "Mesh") {
        // node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [gltfScene]);

  return (
    <group name={"terrain"} position={[0, 0, 0]}>
      <primitive object={gltfScene} dispose={null} />
      <NavMesh
        spawnPos={spawnPos}
        terrain={gltfScene}
        onPathWalkStart={onPathWalkStart}
        onPathWalkStop={onPathWalkStop}
        onPathWalkPositionUpdate={onPathWalkPositionUpdate}
      />
    </group>
  );
};
export default React.memo(Terrain);