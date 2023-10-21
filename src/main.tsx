import { Color, NearestFilter, RepeatWrapping, Vector2 } from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera, PerspectiveCamera, Stats, StatsGl, useProgress, useTexture } from '@react-three/drei';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const NODE_ENV = process.env.NODE_ENV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div id='Canvas' style={{ width: '100vw', height: '100vh'}}>
      <Canvas shadows>
        <Suspense fallback={<Loader/>}>
        {NODE_ENV !== 'production' ? <StatsGl/> : null}
          <Environment/>
          <Scene/>
        </Suspense>
      </Canvas>
    </div>
  </React.StrictMode>,
)

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>
}

function Environment() {
  // const screenResolution = new Vector2(window.innerWidth, window.innerHeight);
  // const renderResolution = screenResolution.clone().divideScalar(6);
  // renderResolution.x |= 0;
  // renderResolution.y |= 0;
  // const aspectRatio = screenResolution.x / screenResolution.y;

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
      position={[0, 6, 12]}
    />
    <ambientLight
      color={new Color(0x2d3645)}
      intensity={10}
    />
    <directionalLight
      castShadow
      color={new Color(0xfffc9c)}
      position={[100, 100, 100]}
      shadow-mapsize={{ mapSize: new Vector2(2048, 2048)}}
      shadow-blurSamples={0}
    />
    <OrbitControls/>
  </>
}

function Scene() {
  const texture = useTexture('textures/checker.png',
    (tex) => {
      if (Array.isArray(tex))
        return tex;
      tex.repeat.set(1.5, 1.5);
      tex.minFilter = NearestFilter;
      tex.magFilter = NearestFilter;
      texture.generateMipmaps = false;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    });

  return <scene background={new Color(0x151729)}>
    <Gem
      position={[-.3, 0.6, .4]}
    />
    <Box
      position={[0, 0.4 / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[0.4, 0.4, 0.4]}
    />
    <Box
      position={[-.4, 0.2 / 2, -.15]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[0.2, 0.2, 0.2]}
    />
    <Plane/>
  </scene>
}

interface IGameObject {
  position?: [x: number, y: number, z: number],
  rotation?: [x: number, y: number, z: number],
  scale?: [x: number, y: number, z: number]
}
function Box({
  position = [0,0,0],
  rotation = [0,0,0],
  scale = [1,1,1]
}: IGameObject) {
  const texture = useTexture('textures/checker.png',
  (tex) => {
    if (Array.isArray(tex))
      return tex;
    // tex.repeat.set(1.5, 1.5);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
  });

  return <mesh
    castShadow
    position={position}
    rotation={rotation}
    receiveShadow
  >
    <boxGeometry args={[...scale]} />
    <meshPhongMaterial args={[{ map: texture }]}/>
  </mesh>
}

function Gem({
  position = [0,0,0],
  rotation = [0,0,0],
  scale = [1,1,1]
}: IGameObject) {
  const meshRef = React.useRef<any>();
  const materialRef = React.useRef<any>();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    meshRef.current.rotation.y = time;
    meshRef.current.position.y = position[1] + Math.sin(time) / 8;
    materialRef.current.emissiveIntensity = Math.sin(time * 3 ) + 1
  });

  return <mesh
    castShadow
    position={position}
    ref={meshRef}
    rotation={rotation}
    scale={scale}
  >
    <dodecahedronGeometry args={[.15]}/>
    <meshPhongMaterial args={[{
      color: 0x2379cf,
      emissive: 0x143542,
      shininess: 100,
      specular: 0xffffff,
    }]}
    ref={materialRef}/>
    <pointLight args={[ new Color(0x2379cf), .5, 0, 2 ]}/>
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
    <planeGeometry args={[2, 2]}/>
    <meshPhongMaterial args={[{ map: texture }]}/>
  </mesh>
}
