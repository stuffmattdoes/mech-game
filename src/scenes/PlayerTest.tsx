import { Euler } from "three";
import { Floor, Player } from "../components";

export function PlayerTestScene() {
    return <scene>
        <Player />
        <Floor rotation={[20.0, 0, 0]} scale={10} />
    </scene>
}
