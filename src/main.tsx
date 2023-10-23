import React, { Suspense, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Color, NearestFilter, RepeatWrapping, Vector2, Vector4 } from 'three';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera, PerspectiveCamera, StatsGl, useProgress, useTexture } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
// import { Pixelate } from './Pixelate';
// import { blurShader } from './shaders';
import './App.css';
import { Pixelize } from './shaders/RenderPixelatedPass';
import { useControls } from 'leva';

const NODE_ENV = process.env.NODE_ENV;

extend({ EffectComposer });

const screenResolution = new Vector2(window.innerWidth, window.innerHeight);
const renderResolution = screenResolution.clone().divideScalar(6);
renderResolution.x |= 0;
renderResolution.y |= 0;
const aspectRatio = screenResolution.x / screenResolution.y;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div id='Canvas' style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows>
        <color attach='background' args={['#151729']} />
        <Suspense fallback={<Loader />}>
          {NODE_ENV !== 'production' ? <StatsGl /> : null}
          <Environment />
          <Scene />
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  </React.StrictMode>
);

function Effects() {
  const { granularity } = useControls('Pixelize', {
    enabled: true,
		granularity: { min: 0, max: 100, step: 1, value: 40 },
	});

  return <EffectComposer>
    <Pixelize enabled granularity={granularity} />
    {/* <Pixelation granularity={granularity}/> */}
  </EffectComposer>
}

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>
}

function Environment() {
  return <>
    {/* <OrthographicCamera
      bottom={-1}
      far={10}
      left={-aspectRatio}
      makeDefault
      near={0.1}
      position={[ 0, 2 * Math.tan(Math.PI / 6), 2]}
      right={aspectRatio}
      top={1}
    /> */}
    <PerspectiveCamera
      fov={5}
      makeDefault
      position={[0, 8, 14]}
    />
    <ambientLight
      color={0x2d3645}
      intensity={10}
    />
    <directionalLight
      castShadow
      color={0xfffc9c}
      position={[60, 50, 100]}
      // shadow-mapsize={{ mapSize: [2048, 2048]}}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    // shadow-blurSamples={0}
    />
    <OrbitControls />
  </>
}

function Scene() {
  return <scene>
    <Gem
      position={[0, 0.5, .25]}
    />
    <Box
      position={[.4, 0.4 / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[0.4, 0.4, 0.4]}
    />
    <Box
      position={[-.4, 0.2 / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[0.2, 0.2, 0.2]}
    />
    <Plane />
  </scene>
}

interface IGameObject {
  position?: [x: number, y: number, z: number],
  rotation?: [x: number, y: number, z: number],
  scale?: [x: number, y: number, z: number]
}
function Box({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}: IGameObject) {
  const texture = useTexture('textures/checker.png',
    (tex) => {
      if (Array.isArray(tex))
        return tex;
      texture.repeat.set(1.5, 1.5);
      tex.minFilter = NearestFilter;
      tex.magFilter = NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
    });

  return <mesh
    castShadow
    position={position}
    rotation={rotation}
    receiveShadow
  >
    <boxGeometry args={[...scale]} />
    <meshPhongMaterial args={[{ map: texture }]} />
  </mesh>
}

function Gem({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}: IGameObject) {
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
    <dodecahedronGeometry args={[.15]} />
    <meshPhongMaterial args={[{
      color: 0x2379cf,
      emissive: 0x143542,
      shininess: 100,
      specular: 0xffffff,
    }]}
      ref={materialRef} />
    <pointLight args={[new Color(0x2379cf), .5, 0, 2]} />
  </mesh>
}

function Plane() {
  const texture = useTexture('textures/checker.png',
    (tex) => {
      if (Array.isArray(tex))
        return tex;
      // tex.repeat.set(3, 3);
      tex.minFilter = NearestFilter;
      tex.magFilter = NearestFilter;
      texture.generateMipmaps = false;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    });

  return <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[2, 2]} />
    <meshPhongMaterial args={[{ map: texture }]} />
  </mesh>
}
