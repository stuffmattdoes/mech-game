import { Physics } from '@react-three/rapier';
import { Box, CharacterController, Floor } from '../components';

export function PlayerTestScene() {
    return <Physics>
        <Box position={[1, 0.5, 1]} scale={1}/>
        <CharacterController />
        <Floor scale={10} />
    </Physics>
}
