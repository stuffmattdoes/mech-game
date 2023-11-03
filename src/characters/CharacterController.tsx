// import { Duck as Character } from '.';
import { Criminal as Character } from '../components';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useControls } from 'leva';
import { useRef } from 'react';
import { Euler, Group, Object3DEventMap, Quaternion, Vector3 } from 'three';

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
    acceleration: number
}

function CharacterControllerBody({ maxVelocity }: Props) {
    const rigidBody = useRef<RapierRigidBody>() as React.MutableRefObject<RapierRigidBody>;
    const { camera } = useThree();
    const actionPressed = useKeyboardControls((state) => state[Controls.Action]);
    const downPressed = useKeyboardControls((state) => state[Controls.Down]);
    const leftPressed = useKeyboardControls((state) => state[Controls.Left]);
    const rightPressed = useKeyboardControls((state) => state[Controls.Right]);
    const upPressed = useKeyboardControls((state) => state[Controls.Up]);

    useFrame(() =>  {
        if (!rigidBody.current) return;
        const delta = new Vector3(0.0, 0.0, 0.0);

        if (upPressed) {
            delta.z = -1.0;
        }

        if (downPressed) {
            delta.z = 1.0;
        }

        if (leftPressed) {
            delta.x = -1.0;
        }

        if (rightPressed) {
            delta.x = 1.0;
        }

        rigidBody.current.setLinvel(delta.normalize().multiplyScalar(maxVelocity), true);
        const { x, y, z} = rigidBody.current.translation();
        camera.lookAt(new Vector3(x, y, z));
        camera.position.setX(x);
        camera.position.setZ(z + 5.0);

        if (rigidBody.current.isMoving()) {

            rigidBody.current.setRotation(
                new Quaternion().setFromEuler(new Euler(0.0, Math.atan2(delta.x, delta.z), 0.0)),
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