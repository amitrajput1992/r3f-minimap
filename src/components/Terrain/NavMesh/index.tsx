import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, DoubleSide, Group, Mesh, Object3D, Vector2, Vector3 } from "three";
import { Path, Pathfinding, PathfindingHelper } from "three-pathfinding";
import { ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events";
import { useFrame, useThree } from "@react-three/fiber";
import Cursor from "../Cursor";
import { SpringRef } from "@react-spring/core";
import { useStore } from "@/src/components/Minimap/store.ts";

const debug = true;

type Props = {
  spawnPos?: number[],
  terrain: Object3D,
  onPathWalkStart?: (v: Vector3) => void,
  onPathWalkStop?: () => void,
  onPathWalkPositionUpdate?: (v: Vector3) => void,
};

const mouseDown = new Vector2();
const mouse = new Vector2();
const ZONE = "level";
const SPEED = 20;
const clock = new Clock();
const navmeshHelperVisible = debug;
const largeDistance = 100;

const useForceUpdate = () => {
  const [value, set] = useState(0);

  const update = useCallback(() => {
    set(value + 1);
  }, [value]);

  return update;
};

const NavMesh = (props: Props) => {
  const {
    spawnPos = [0, 0, 0],
    terrain,
    onPathWalkStart,
    onPathWalkStop,
    onPathWalkPositionUpdate,
  } = props;

  const update = useForceUpdate();
  const setPlayerPosition = useStore(s => s.setPlayerPosition);

  const cursorAnimate = useRef<SpringRef<{ x: number }> | undefined>();
  const cursorRef = useRef(new Group());

  const newWalk = useRef(false);
  const ref = useRef(new Mesh());
  const navmeshMesh = useRef<Mesh | undefined>();

  const domElement = useThree(s => s.gl.domElement);

  const pathfinder = useMemo(() => new Pathfinding(), []);
  const helper = useMemo(() => new PathfindingHelper(), []);

  const playerPosition = useRef(new Vector3());
  const targetPosition = useRef(new Vector3());
  const groupID = useRef<number | null>(null);
  const playerPositioned = useRef(false);
  const path = useRef<null | Path>(null);

  const ball = useRef<any>();

  useEffect(() => {
    console.log("terrain updated");
    terrain.traverse(n => {
      if (n instanceof Mesh && n.name === "Navmesh") {
        navmeshMesh.current = n;
      }
    });

    // * Remove the mesh from the original mesh so it doesn't get rendered.
    if (navmeshMesh.current) {
      navmeshMesh.current.parent?.remove(navmeshMesh.current);
      update();
    }
  }, [terrain]);

  function positionCursor() {
    cursorRef.current.position.copy(targetPosition.current);
    cursorAnimate.current?.start({
      from: { x: 0 },

      to: async (next: any) => {
        await next({ x: 1 });
        await next({ x: 0 });
      },
      onStart: () => {
        cursorRef.current.visible = true;
      },
      onRest: () => {
        cursorRef.current.visible = false;
      },
    });
  }

  function setStartingPosition(point: Vector3) {
    playerPosition.current.copy(point);
    targetPosition.current.copy(point);
    helper
      .reset()
      .setPlayerPosition(playerPosition.current)
      .setTargetPosition(playerPosition.current);
    playerPositioned.current = true;

    setPlayerPosition(playerPosition.current.clone());
  }

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const rect = domElement.getBoundingClientRect();
    mouseDown.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function onPointerUp(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const rect = domElement.getBoundingClientRect();

    mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    // Prevent unwanted click when rotate camera.
    if (Math.abs(mouseDown.x - mouse.x) > 0 || Math.abs(mouseDown.y - mouse.y) > 0) {
      return;
    }

    const point = event.point;
    // ! UNCOMMENT TO DEBUG
    ball.current.position.copy(point);

    // * If the player was never positioned, set the starting location
    if (!playerPositioned.current) {
      setStartingPosition(point);
      return;
    }

    targetPosition.current.copy(point);

    helper
      .reset()
      .setPlayerPosition(playerPosition.current);

    /**
     * Detect if the distance between player's position and target position is large, then teleport the player to the target location
     * OR
     * CTRL/CMD key was pressed
     * OR
     * RMB is clicked
     */
    const rightMouseButtonClicked = event.button === 2;
    const ctrlOrCmdPressed = event.metaKey || event.ctrlKey;

    const distance = targetPosition.current.distanceTo(playerPosition.current);
    const teleportDueToLargeDistance = distance > largeDistance;

    // Teleport on ctrl/cmd click or RMB.
    if (ctrlOrCmdPressed || rightMouseButtonClicked || teleportDueToLargeDistance) {
      path.current = null;
      groupID.current = pathfinder.getGroup(ZONE, targetPosition.current, true);
      const closestNode = pathfinder.getClosestNode(playerPosition.current, ZONE, groupID.current, true);
      playerPosition.current.copy(targetPosition.current);
      helper.setPlayerPosition(playerPosition.current);
      if (closestNode) {
        helper.setNodePosition(closestNode.centroid);
      }
      onPathWalkPositionUpdate?.(playerPosition.current);
      onPathWalkStop?.();
      setPlayerPosition(playerPosition.current.clone());
      return;
    }


    const targetGroupID = pathfinder.getGroup(ZONE, targetPosition.current, true);

    const closestTargetNode = pathfinder.getClosestNode(targetPosition.current, ZONE, targetGroupID, true);

    helper.setTargetPosition(targetPosition.current);
    if (closestTargetNode) {
      helper.setNodePosition(closestTargetNode.centroid);
    }

    // * Calculate a path to the target and store it
    path.current = pathfinder.findPath(playerPosition.current, targetPosition.current, ZONE, groupID.current);

    if (path.current?.length) {
      helper.setPath(path.current);
      // when ever a new path is detected, reset the internal state so that the onPathWalkStart can be fired.
      newWalk.current = false;
    } else {

      const closestPlayerNode = pathfinder.getClosestNode(playerPosition.current, ZONE, groupID.current);
      const clamped = new Vector3();

      // TODO(donmccurdy): Don't clone targetPosition, fix the bug.
      pathfinder.clampStep(
        playerPosition.current, targetPosition.current.clone(), closestPlayerNode, ZONE, groupID.current, clamped);

      helper.setStepPosition(clamped);
    }
    positionCursor();
  }

  useEffect(() => {
    // Build the indexes only when the navmesh is available
    if (navmeshMesh.current) {
      const zone = Pathfinding.createZone(navmeshMesh.current.geometry);
      pathfinder.setZoneData(ZONE, zone);
      groupID.current = pathfinder.getGroup(ZONE, playerPosition.current);

      const spawnVector = new Vector3().fromArray(spawnPos);
      setStartingPosition(spawnVector);
      onPathWalkPositionUpdate?.(spawnVector);
      ball.current.position.copy(spawnVector);
    }
  }, [navmeshMesh.current, pathfinder, spawnPos]);

  useEffect(() => {
    const preventDefault = ((event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    document.addEventListener("drag", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("dragend", preventDefault);
    document.addEventListener("dragenter", preventDefault);
    document.addEventListener("dragleave", preventDefault);
    document.addEventListener("drop", preventDefault);
    return () => {
      document.removeEventListener("drag", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("dragend", preventDefault);
      document.removeEventListener("dragenter", preventDefault);
      document.removeEventListener("dragleave", preventDefault);
      document.removeEventListener("drop", preventDefault);
    };
  }, []);

  useFrame(() => {
    if (!playerPositioned.current || !path.current) {
      return;
    }

    const dt = clock.getDelta();
    const targetPosition = path.current[0];
    if (!targetPosition) {
      return;
    }
    const velocity = targetPosition.clone().sub(playerPosition.current);

    // if (velocity.lengthSq() > 0.09 * 0.09) {
    if (velocity.lengthSq() > 1) {
      velocity.normalize();
      // * Move player to target
      playerPosition.current.add(velocity.multiplyScalar(dt * SPEED));
      helper.setPlayerPosition(playerPosition.current);
      onPathWalkPositionUpdate?.(playerPosition.current);
      setPlayerPosition(playerPosition.current.clone());
      if (newWalk.current === false) {
        onPathWalkStart?.(targetPosition);
        newWalk.current = true;
      }
    } else {
      onPathWalkStop?.();
      newWalk.current = false;
      // Remove node from the path we calculated
      path.current.shift();
    }
  });

  if (!navmeshMesh) {
    return null;
  }

  return (
    <group name={"navmesh"}>
      <mesh
        ref={ref}
        geometry={navmeshMesh.current?.geometry}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <meshBasicMaterial
          color={"white"}
          wireframe={false}
          opacity={0}
          transparent={true}
          side={DoubleSide}
        />
      </mesh>

      <mesh geometry={navmeshMesh.current?.geometry}>
        <meshBasicMaterial
          color={"white"}
          // opacity={debug? 1: 0}
          opacity={0}
          transparent={true}
          side={DoubleSide}
          wireframe={true}
        />
      </mesh>

      <primitive object={helper} rotation={[0, 0, 0]} visible={navmeshHelperVisible} />

      {/* ! UNCOMMENT TO DEBUG */}
      <mesh ref={ball} visible={navmeshHelperVisible}>
        <sphereGeometry args={[1, 32, 32, 0, 2 * Math.PI, 0, Math.PI]} />
        <meshBasicMaterial color={"cyan"} />
      </mesh>
      <Cursor animateRef={cursorAnimate} ref={cursorRef} />
    </group>
  );
};


export default NavMesh;

