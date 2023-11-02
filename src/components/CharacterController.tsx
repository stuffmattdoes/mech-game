import { Character } from '.';
import { KeyboardControls } from '@react-three/drei';
import Ecctrl from 'ecctrl';

export function CharacterController() {
    return <group>
        <KeyboardControls map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
            { name: 'action', keys: ['Space'] }
        ]}>
            {/* @ts-ignore */}
            <Ecctrl
                // accDeltaTime={0.1}
                debug
                // characterInitDir={Math.PI}
                // floatHeight={0.0}
                // capsuleHalfHeight={0.3}
                moveImpulsePointY={10.0}
            >
                {/* <RigidBody colliders={false} scale={[0.5, 0.5, 0.5]}> */}
                    {/* <CapsuleCollider args={[0.8, 0.4]} position={[0, 1.2, 0]} /> */}
                    <Character />
                {/* </RigidBody> */}
            </Ecctrl>
        </KeyboardControls>
    </group>
}