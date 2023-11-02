import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { Character } from '.';

export function CharacterController() {
    return <group>
        <RigidBody colliders={false} scale={[0.5, 0.5, 0.5]}>
            <CapsuleCollider args={[0.8, 0.4]} position={[0, 1.2, 0]}/>
            <Character/>
        </RigidBody>
    </group>
}