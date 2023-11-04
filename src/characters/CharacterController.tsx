// import { Duck as Character } from '.';
import { Criminal as Character } from '../components';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useControls } from 'leva';
import { useRef } from 'react';
import { Euler, Quaternion, Vector3 } from 'three';

export const Controls = {
    Action: 'action',
    Down: 'down',
    Left: 'left',
    Right: 'right',
    Up: 'up',
};

export function CharacterController() {
    const controls = useControls('Player Controls', {
        maxVelocity: { min: 0.5, max: 4.0, step: 0.2, value: 2.0 },
    })
    return <group>
        <KeyboardControls map={[
            { name: Controls.Up, keys: ['ArrowUp', 'KeyW'] },
            { name: Controls.Down, keys: ['ArrowDown', 'KeyS'] },
            { name: Controls.Left, keys: ['ArrowLeft', 'KeyA'] },
            { name: Controls.Right, keys: ['ArrowRight', 'KeyD'] },
            { name: Controls.Action, keys: ['Space'] }
        ]}>
            <CharacterControllerBody {...controls}/>
        </KeyboardControls>
    </group>
}

type Props = {
    maxVelocity: number
}

function CharacterControllerBody({ maxVelocity }: Props) {
    const rigidBody = useRef<RapierRigidBody>() as React.MutableRefObject<RapierRigidBody>;
    const actionPressed = useKeyboardControls((state) => state[Controls.Action]);
    const downPressed = useKeyboardControls((state) => state[Controls.Down]);
    const leftPressed = useKeyboardControls((state) => state[Controls.Left]);
    const rightPressed = useKeyboardControls((state) => state[Controls.Right]);
    const upPressed = useKeyboardControls((state) => state[Controls.Up]);

    useFrame(({ camera }) =>  {
        if (!rigidBody.current) return;

        const delta = new Vector3(0.0, 0.0, 0.0);

        if (upPressed) {
            delta.z = -1.0;
        }

        if (downPressed) {
            delta.z = 1.0;
        }

        if (rightPressed) {
            delta.x = 1.0;
        }

        if (leftPressed) {
            delta.x = -1.0;
        }

        rigidBody.current.setLinvel(delta.normalize().multiplyScalar(maxVelocity), true);        
        const { x, z} = rigidBody.current.translation();

        // camera.position.set(charPos.x, 10, charPos.z + 10);  // causes camera jitter
        camera.position.lerp(new Vector3(x, 10, z + 10), 0.25);  // solves camera jitter

        if (rigidBody.current.isMoving()) {
            const { x, z } = rigidBody.current.linvel();
            rigidBody.current.setRotation(
                new Quaternion().setFromEuler(new Euler(
                    0.0,
                    Math.atan2(x, z),
                    0.0
                )),
                true
            );
        }
    });

    return <RigidBody
        colliders={false}
        gravityScale={0.0}
        ref={rigidBody}
        // enabledRotations={[false, true, false]}
        scale={0.25}
        lockRotations
    >
        <CapsuleCollider args={[1.0, 1.0]} position={[0, 2.0, 0]}/>
        <group>
            <Character />
        </group>
    </RigidBody>
}