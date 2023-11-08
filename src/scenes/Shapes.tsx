import { Physics } from '@react-three/rapier';
import { Box, Gem, Floor } from '../components';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function ShapeScene() {
  const { viewport } = useThree();

    return <Physics>
         <OrthographicCamera
            bottom={-1}
            // far={5}
            left={-viewport.aspect}
            makeDefault
            position={[0, 4.0, 4.0]}
            rotation={[-Math.PI / 4, 0, 0]}
            top={1}
            right={viewport.aspect}
            // zoom={0.5}
        />
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
      <Floor scale={2} />
      <OrbitControls/>
    </Physics>
  }