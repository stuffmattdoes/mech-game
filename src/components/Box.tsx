import { useTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Euler, NearestFilter, RepeatWrapping } from 'three';

export function Box({ position, rotation = new Euler(0, Math.PI / 4.0, 0), scale }: Partial<MeshProps>) {
  const texture = useTexture('textures/checker.png',
    (tex) => {
      if (Array.isArray(tex))
        return tex;
      tex.repeat.set(1.5, 1.5);
      tex.minFilter = NearestFilter;
      tex.magFilter = NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
    });

  return <RigidBody>
    <mesh
      castShadow
      position={position}
      rotation={rotation}
      receiveShadow
      scale={scale}
    >
      <boxGeometry />
      {/* <meshPhongMaterial map={texture} /> */}
      <meshToonMaterial map={texture} />
    </mesh>
  </RigidBody>
}