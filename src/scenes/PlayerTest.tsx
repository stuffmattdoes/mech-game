import { Physics } from "@react-three/rapier";
import { Box, CharacterController, Floor } from "../components";

export function PlayerTestScene() {
    return <Physics >
        <Box position={[2, 0.5, 2]} scale={1}/>
        <CharacterController />
        <Floor rotation={[20.0, 0, 0]} scale={10} />
    </Physics>
}
