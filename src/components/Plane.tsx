import { useTexture } from "@react-three/drei";
import { MeshProps } from "@react-three/fiber";
import { NearestFilter, RepeatWrapping } from "three";

export function Plane({ scale }: Partial<MeshProps>) {
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
  
    return <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <planeGeometry />
      {/* <meshPhongMaterial depthWrite={false} map={texture} /> */}
      <meshToonMaterial depthWrite={false} map={texture} />
    </mesh>
  }