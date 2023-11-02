import { useFBX, useTexture } from "@react-three/drei";

export function Player() {
  const texture = useTexture('/textures/criminalMaleA.png');
  const fbx = useFBX('/models/characterMedium.fbx');
  fbx.traverse((child) => {
    if (child.isMesh) {
      child.material.map = texture;
    }
  });

  return <mesh castShadow receiveShadow>
    <primitive
      object={fbx}
      scale={0.0015}
      position={[0, 0, 0]}
    />;
    <meshToonMaterial map={texture} />
    {/* <meshPhongMaterial map={texture}/> */}
    {/* <meshStandardMaterial map={texture}/> */}
  </mesh>;
}