import { Plane, Player } from "../components";

export function PlayerTestScene() {
    return <scene>
        <Player />
        <Plane scale={10} />
    </scene>
}
