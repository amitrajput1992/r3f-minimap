declare module "three-pathfinding" {
  import type { Vector3, BufferGeometry } from "three";
  type Group = Record<any, any>;
  type Node = Group;

  type Zone = {
    groups: Group[]
    vertices: Vector3[]
  };

  type Path = Vector3[];

  class Pathfinding {
    static createZone: (geometry: BufferGeometry, tolerance?: number) => Zone;
    setZoneData: (zoneID: string, zone: Zone) => void;
    getGroup: (zoneID: string, position: Vector3, checkPolygon?: boolean)=> number;
    findPath: (startPosition: Vector3, targetPosition: Vector3, zoneID: string, groupID: number | null)=> Path;
    getClosestNode: (position: Vector3, zoneID: string, groupID: number | null, checkPolygon?: boolean)=> Node;
    clampStep: (start: Vector3, end: Vector3, node: Node, zoneID: string, groupID: number | null, endTarget: Vector3)=> void;
  }

  class PathfindingHelper {
    reset: () => PathfindingHelper;
    setPlayerPosition: (playerPosition: Vector3) => PathfindingHelper;
    setTargetPosition: (playerPosition: Vector3) => PathfindingHelper;
    setNodePosition: (playerPosition: Vector3) => PathfindingHelper;
    setStepPosition: (playerPosition: Vector3) => PathfindingHelper;
    setPath: (path: Path) => PathfindingHelper;

  }
}