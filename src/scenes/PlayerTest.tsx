import { Physics } from '@react-three/rapier';
import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Box, CharacterController, Floor } from '../components';

export function PlayerTestScene() {
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
        <ambientLight
            color={0x2d3645}
            intensity={5}
        />
        <directionalLight
            intensity={0.4}
            color={0xfffc9c}
            position={[60, 400, 270]}
        />
        <directionalLight
            castShadow
            intensity={1}
            color={0xfffc9c}
            position={[60, 400, 270]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}  // improves shadow artifact on toon shader, but offsets shadow
        // shadow-normalBias={-0.02}
        // shadow-blurSamples={0}
        // shadow-radius={0}
        />
        {/* <OrbitControls/> */}
        <CharacterController />
        <Floor scale={10} />
    </Physics>
}
