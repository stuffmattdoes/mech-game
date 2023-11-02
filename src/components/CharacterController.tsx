import { Character } from '.';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useControls } from 'leva';
import { useRef } from 'react';
import { Group, Object3DEventMap, Vector3 } from 'three';

export const Controls = {
    Action: 'action',
    Down: 'down',
    Left: 'left',
    Right: 'right',
    Up: 'up',
};

export function CharacterController() {
    const controls = useControls('Player Controls', {
        maxVelocity: { min: 0.5, max: 3.0, step: 0.2, value: 1.0 },
        acceleration: { min: 0.1, max: 0.5, step: 0.1, value: 1.0 }
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

function CharacterControllerBody({ acceleration, maxVelocity }: Props) {
    const characterRef = useRef<Group<Object3DEventMap>>();
    const rigidBodyRef = useRef<RapierRigidBody>();

    // const { camera } = useThree();
    const actionPressed = useKeyboardControls((state) => state[Controls.Action]);
    const downPressed = useKeyboardControls((state) => state[Controls.Down]);
    const leftPressed = useKeyboardControls((state) => state[Controls.Left]);
    const rightPressed = useKeyboardControls((state) => state[Controls.Right]);
    const upPressed = useKeyboardControls((state) => state[Controls.Up]);

    useFrame(() =>  {
        if (!rigidBodyRef.current || !characterRef.current) return;

        const delta = new Vector3(0, 0, 0);
        const linearVelocity = rigidBodyRef.current.linvel();


        if (upPressed && linearVelocity.z < maxVelocity) {
            delta.z += acceleration;
        }

        if (downPressed && -linearVelocity.z < maxVelocity) {
            delta.z -= acceleration;
        }        

        if (leftPressed && -linearVelocity.x < maxVelocity) {
            delta.x -= acceleration;
        }

        if (rightPressed && linearVelocity.x < maxVelocity) {
            delta.x += acceleration;
        }

        rigidBodyRef.current.applyImpulse(delta.normalize(), true);
        const nextRotation = rigidBodyRef.current.rotation();
        if (rigidBodyRef.current.isMoving) {
            // if (Math.abs(linearVelocity.x) > 0.1 || Math.abs(linearVelocity.z) > 0.1) {
                // characterRef.current.rotation.y = Math.atan2(linearVelocity.x, linearVelocity.z);
                nextRotation.y = Math.atan2(linearVelocity.x, linearVelocity.z);
                rigidBodyRef.current.setRotation(nextRotation, true);
            // }
        }
    });

    return <RigidBody
        colliders={false}
        ref={rigidBodyRef}
        enabledRotations={[false, true, false]}
        scale={0.25}
        lockRotations
    >
        <CapsuleCollider args={[1.0, 1.0]} position={[0, 2.0, 0]}/>
        <group ref={characterRef}>
            <Character />
        </group>
    </RigidBody>
}