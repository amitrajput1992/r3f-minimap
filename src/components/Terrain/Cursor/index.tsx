import React, { useEffect } from "react";
import { DoubleSide, Group, Vector3 } from "three";
import { a, useSpring } from "@react-spring/three";
import { Line } from "@react-three/drei";
import { SpringRef } from "@react-spring/core";

const innerRadius = 1;
const outerRadius = 1.2;
const multiplier = 1 / 4;

type Props = {
  animateRef: React.MutableRefObject<SpringRef<{x: number}> | undefined>;
};

const points = [
  new Vector3(0, 0.2, 0),
  new Vector3(0, 0.7, 0)
];

const AnimatedPointer = React.forwardRef((props: Props, ref: React.ForwardedRef<Group>) => {

  const [{ x }, api] = useSpring(
    () => ({
      from: { x: 0 },
      config: {
        duration: 500,
      },
    }),
    [],
  );

  useEffect(() => {
    if(props.animateRef) {
      props.animateRef.current = api;
    }
  }, [api]);

  return (
    <a.group ref={ref} scale={x}>
      <group scale={5}>
        {/* A normal line */}
        <Line points={points} color={"#FFF"} />
        {/* Ring */}
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.1, 0]}>
          <ringGeometry attach={"geometry"} args={[innerRadius * multiplier, outerRadius * multiplier]} />
          <meshBasicMaterial attach={"material"} color={"#FFF"} side={DoubleSide} />
        </mesh>
      </group>
    </a.group>
  );
});

export default AnimatedPointer;