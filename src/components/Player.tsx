import { KeyboardControls, useFBX, useTexture } from "@react-three/drei";
import Ecctrl from 'ecctrl';

export function Player() {
  const texture = useTexture('/textures/criminalMaleA.png');
  const fbx = useFBX('/models/characterMedium.fbx');
  fbx.traverse((child) => {
    if (child.isMesh) {
      child.material.map = texture;
    }
  });

  return <KeyboardControls map={[
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    // { name: "jump", keys: ["Space"] },
    // { name: "run", keys: ["Shift"] },
    // Optional animation key map
    { name: "action1", keys: ["1"] },
    { name: "action2", keys: ["2"] },
    { name: "action3", keys: ["3"] },
    { name: "action4", keys: ["KeyF"] },
  ]}>
    <Ecctrl
      accDeltaTime={1.0}
      // capsuleHalfHeight={0.3}
      // capsuleRadius={0.1}
      maxVelLimit={1.2}
      moveImpulsePointY={0.0}
      turnSpeed={1000}

    >
      <mesh castShadow receiveShadow>
        <primitive
          object={fbx}
          scale={0.0015}
          position={[0, 0, 0]}
        />;
        <meshToonMaterial map={texture} />
        {/* <meshPhongMaterial map={texture}/> */}
        {/* <meshStandardMaterial map={texture}/> */}
      </mesh>
    </Ecctrl>
  </KeyboardControls>
}