import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { OrthographicCamera as IOrthographicCamera, Vector3, Quaternion } from 'three';
import { Canvas, extend } from '@react-three/fiber';
import { Html, StatsGl, useProgress } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { useControls } from 'leva';
import { RenderPass } from 'three-stdlib';
import { Edges } from './effects/Edges';
import { LevelTestScene } from './scenes';
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
          <LevelTestScene />
          <Effects />
        </Suspense>
      </Canvas>
    </div>
  </React.StrictMode>
);

function Effects() {
  const controls = useControls('Pixelize', {
    enabled: true,
		granularity: { min: 1, max: 32, step: 1, value: 6 },
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