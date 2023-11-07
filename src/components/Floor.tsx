import { useTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { NearestFilter, RepeatWrapping, Vector3 } from 'three';

export function Floor(props: Partial<MeshProps>) {
  const { scale = 10 } = props;

    const texture = useTexture('textures/checker2.png',
      (tex) => {
        if (Array.isArray(tex))
          return tex;
        tex.repeat.set(scale * 1.5, scale * 1.5);
        tex.minFilter = NearestFilter;
        tex.magFilter = NearestFilter;
        tex.generateMipmaps = false;
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
      });
  
    return <RigidBody friction={1.0}>
      <mesh
        position={new Vector3(0, 0, 0)}
        receiveShadow
        rotation={[-Math.PI / 2.0, 0.0, Math.PI / 4.0]}
        scale={scale}
      >
        <planeGeometry />
        {/* <meshPhongMaterial depthWrite={false} map={texture} /> */}
        <meshToonMaterial depthWrite={false} map={texture} />
      </mesh>
    </RigidBody>
  }