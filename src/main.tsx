import React, { PropsWithChildren, Suspense, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Color, NearestFilter, RepeatWrapping, Vector2, Vector4 } from 'three';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera, PerspectiveCamera, StatsGl, useProgress, useTexture } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
// import { Pixelate } from './Pixelate';
// import { blurShader } from './shaders';
import './styles.css';
import { useControls } from 'leva';
import { RenderPass } from 'three-stdlib';
import { Edges } from './Edges';
import { Pixels } from './Pixelize';

const NODE_ENV = process.env.NODE_ENV;

extend({ RenderPass });

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
  const controls = useControls('Pixelize', {
    enabled: true,
		granularity: { min: 0, max: 16, step: 1, value: 16 },
    outlines: { min: 0, max: 1.0, step: 0.1, value: 1.0 },
    details: { min: 0, max: 2.0, step: 0.2, value: 2.0},
	});

  return <EffectComposer depthBuffer multisampling={0}>
    {/* <renderPass/> */}
    <Edges {...controls}/>
    {/* <Pixelation granularity={controls.granularity}/> */}
    {/* <Pixels {...controls}/> */}
  </EffectComposer>
}

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>
}

function Environment() {
  return <>
    <OrthographicCamera
      bottom={-1}
      far={10}
      left={-aspectRatio}
      makeDefault
      near={0.1}
      position={[ 0, 2 * Math.tan(Math.PI / 6), 2]}
      right={aspectRatio}
      top={1}
    />
    {/* <PerspectiveCamera
      fov={5}
      makeDefault
      position={[0, 8, 14]}
    /> */}
    <ambientLight
      color={0x2d3645}
      intensity={.4}
    />
    <directionalLight
      castShadow
      intensity={0.8}
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
    <Gem position={[0, 0.5, .25]}>
      {/* <spotLight
        angle={Math.PI / 4}
        castShadow
        color={0xff8800}
        decay={2}
        distance={10}
        intensity={1}
        penumbra={.02}
        position={[0, 0, 0]}
        // target={[0, 0, 0]}
      /> */}
      <pointLight
        // args={[new Color(0x2379cf), 2.0, 20, .2]}
        color={0x2379cf}
        decay={.2}
        distance={4}
        intensity={2}
        // decay={20}
        // castShadow
      />
    </Gem>
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

const Gem: React.FC<PropsWithChildren<IGameObject>> = ({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
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
      {children}
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
