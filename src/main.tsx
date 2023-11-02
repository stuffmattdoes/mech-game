import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { OrthographicCamera as IOrthographicCamera, Vector3, Quaternion } from 'three';
import { Canvas, extend, useThree } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera, StatsGl, useProgress } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { useControls } from 'leva';
import { RenderPass } from 'three-stdlib';
import { Edges } from './effects/Edges';
import { Box, Gem, Plane, Player } from './components';
import './styles.css';

const NODE_ENV = process.env.NODE_ENV;

extend({ RenderPass });

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
		granularity: { min: 1, max: 32, step: 1, value: 8 },
    outlines: { min: 0, max: 1.0, step: 0.1, value: 0.6 },
    details: { min: 0, max: 2.0, step: 0.1, value: 0.6 },
	});

  return <EffectComposer depthBuffer multisampling={0}>
    <renderPass/>
    <Edges {...controls}/>
  </EffectComposer>
}

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>
}

function Environment() {
  const { viewport } = useThree();

  // useFrame(({ camera, viewport }) => {
  //   snapCameraToPixels(camera as IOrthographicCamera, viewport.aspect, 144, 120);
  // });

return <>
    <OrthographicCamera
      bottom={-1}
      far={5}
      left={-viewport.aspect}
      makeDefault
      near={0.1}
      // onUpdate={console.log}
      position={[ .5, 2 * Math.tan(Math.PI / 6), 2]}
      right={viewport.aspect}
      top={1}
    />
    <ambientLight
      color={0x2d3645}
      intensity={2}
    />
    {/* <spotLight
      angle={Math.PI / 6}
      castShadow
      color={0xff8800}
      decay={2}
      distance={10}
      intensity={1}
      penumbra={.02}
      position={[0, 1, 0]}
    /> */}
    <directionalLight
      castShadow
      intensity={0.8}
      color={0xfffc9c}
      position={[60, 50, 100]}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      // shadow-bias={-0.0001}  // improves shadow artifact on toon shader, but offsets shadow
      // shadow-normalBias={-0.02}
      shadow-radius={0}
    />
    <OrbitControls
      // enableRotate={false}
      // enableZoom={false}
      minAzimuthAngle={45}
      screenSpacePanning
      // mouseButtons={{
      //   LEFT: MOUSE.PAN,
      //   MIDDLE: MOUSE.DOLLY,
      //   RIGHT: MOUSE.ROTATE
      // }}
    />
  </>
}

function Scene() {
  return <scene>
    <Gem position={[0, 0.5, .25]}>
      <pointLight
        // castShadow
        color={0x2379cf}
        decay={.5}
        distance={1}
        intensity={8}
      />
    </Gem>
    {/* <Ball
      position={[0, 0.2 / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[0.1, 0.1, 0.1]}
    /> */}
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
    <Player/>
    <Plane scale={2} />
  </scene>
}



function snapCameraToPixels(
  camera: IOrthographicCamera,
  aspectRatio: number,
  pixelsPerScreenWidth: number,
  pixelsPerScreenHeight: number
) {

  // 0. Get Pixel Grid Units
  const worldScreenWidth = ( ( camera.right - camera.left ) / camera.zoom );
  const worldScreenHeight = ( ( camera.top - camera.bottom ) / camera.zoom );
  const pixelWidth = worldScreenWidth / pixelsPerScreenWidth;
  const pixelHeight = worldScreenHeight / pixelsPerScreenHeight;

  // 1. Project the current camera position along its local rotation bases
  const camPos = new Vector3(); camera.getWorldPosition( camPos );
  const camRot = new Quaternion(); camera.getWorldQuaternion( camRot );
  const camRight = new Vector3( 1.0, 0.0, 0.0 ).applyQuaternion( camRot );
  const camUp = new Vector3( 0.0, 1.0, 0.0 ).applyQuaternion( camRot );
  const camPosRight = camPos.dot( camRight );
  const camPosUp = camPos.dot( camUp );

  // 2. Find how far along its position is along these bases in pixel units
  const camPosRightPx = camPosRight / pixelWidth;
  const camPosUpPx = camPosUp / pixelHeight;

  // 3. Find the fractional pixel units and convert to world units
  const fractX = camPosRightPx - Math.round( camPosRightPx );
  const fractY = camPosUpPx - Math.round( camPosUpPx );

  // 4. Add fractional world units to the left/right top/bottom to align with the pixel grid
  camera.left = - aspectRatio - ( fractX * pixelWidth );
  camera.right = aspectRatio - ( fractX * pixelWidth );
  camera.top = 1.0 - ( fractY * pixelHeight );
  camera.bottom = - 1.0 - ( fractY * pixelHeight );
  camera.updateProjectionMatrix();
}