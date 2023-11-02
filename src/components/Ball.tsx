import { useTexture } from "@react-three/drei";
import { MeshProps } from "@react-three/fiber";

export function Ball({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}: Partial<MeshProps>) {
  const texture = useTexture('textures/checker.png');

  return <mesh
    castShadow
    position={position}
    rotation={rotation}
    scale={scale}
    receiveShadow
  >
    <sphereGeometry/>
    <meshToonMaterial map={texture} />
    {/* <meshPhongMaterial map={texture} /> */}
  </mesh>
}