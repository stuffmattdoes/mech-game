import { MeshProps, useFrame } from '@react-three/fiber';
import React from 'react';

export function Gem ({ children, position, rotation, scale }: Partial<MeshProps>) {
    const meshRef = React.useRef<any>();
    const materialRef = React.useRef<any>();
  
    useFrame(({ clock }) => {
      const time = clock.getElapsedTime();
      meshRef.current.rotation.y = time;
      meshRef.current.position.y = position[1] + Math.sin(time) / 8;
      materialRef.current.emissiveIntensity = Math.sin(time * 5) + 5;
    });
  
    return <mesh
      castShadow
      position={position}
      ref={meshRef}
      rotation={rotation}
      scale={scale}
    >
      <icosahedronGeometry args={[.15]} />
      {/* <meshPhongMaterial args={[{
        color: 0x2379cf,
        emissive: 0x143542,
        shininess: 100,
        specular: 0xffffff,
      }]}
        ref={materialRef} /> */}
        <meshToonMaterial
        args={[{
          color: 0x2379cf,
          emissive: 0x143542,
          // shininess: 100,
          // specular: 0xffffff,
        }]}
          ref={materialRef}
        />
        {children}
    </mesh>
  }
  