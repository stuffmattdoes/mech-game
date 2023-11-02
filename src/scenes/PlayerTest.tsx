import { CharacterController, Floor } from "../components";

export function PlayerTestScene() {
    return <scene>
        <CharacterController />
        <Floor rotation={[20.0, 0, 0]} scale={10} />
    </scene>
}
