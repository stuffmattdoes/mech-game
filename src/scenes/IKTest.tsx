import { Physics } from '@react-three/rapier';
import { OrbitControls, OrthographicCamera, TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Box, CharacterController, Floor } from '../components';
import { Bone, BoxGeometry, BufferAttribute, Euler, Float32BufferAttribute, Group, InterleavedBufferAttribute, MeshBasicMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3, Vector4 } from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { mergeBufferGeometries } from 'three-stdlib';
import { WireframeMaterial } from '@react-three/drei/materials/WireframeMaterial';

export function IKTestScene() {
    const { viewport } = useThree();

    const [ geometry, skeleton ] = useMemo(() => {
        const bones = [];

        const upperLegGeo = new BoxGeometry(0.25, 1.0, 0.25);
        const upperLegBone = new Bone();
        bones.push(upperLegBone);
        
        const lowerLegGeo = new BoxGeometry(0.25, 1.0, 0.25);
        const lowerLegBone = new Bone();
        bones.push(lowerLegBone);
        upperLegBone.add(lowerLegBone);

        const footGeo = new BoxGeometry(0.75, 0.25, .5);
        const footBone = new Bone();
        bones.push(footBone);
        lowerLegBone.add(footBone);

        const mergedGeo = mergeBufferGeometries([upperLegGeo, lowerLegGeo, footGeo], true);
        
        if (!mergedGeo) return null;
        
        const skinIndices = [];
        const skinWeights = [];
        const position = mergedGeo.attributes.position;

        // for (let i = 0; i < mergedGeo.groups.length; i++) {
        //     const group = mergedGeo.groups[i];
        //     for (let j = group.start; j < group.count; j++) {
        //         // skinIndices.push([i, 0, 0, 0]);
        //         skinIndices.push([i, i + 1, 0, 0]);
        //         skinWeights.push([1, 0, 0, 0]);
        //     }
        // }

        for (let i = 0; i < position.count; i ++) {
            skinIndices.push([i, i + 1, 0, 0]);
            skinWeights.push([1, 0, 0, 0]);
        }

        mergedGeo.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices.flat(), 4));
        mergedGeo.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights.flat(), 4));
        
        return [
            mergedGeo,
            new Skeleton(bones)
        ];
    }, []);

    console.log(skeleton, geometry);

    return <Physics>
        <OrthographicCamera
            bottom={-1}
            // far={5}
            left={-viewport.aspect}
            makeDefault
            position={[0.0, 4.0, 4.0]}
            rotation={[-Math.PI / 4, 0, 0]}
            top={1}
            right={viewport.aspect}
            zoom={0.35}
        />
        <ambientLight
            color={0x2d3645}
            intensity={5}
        />
        <directionalLight
            intensity={0.4}
            color={0xfffc9c}
            position={[60, 400, 270]}
        />
        <directionalLight
            castShadow
            intensity={1}
            color={0xfffc9c}
            position={[60, 400, 270]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}  // improves shadow artifact on toon shader, but offsets shadow
        />
        {/* <TransformControls object={footRef.current}/> */}
        <skinnedMesh
            castShadow
            geometry={geometry}
            material={new WireframeMaterial()}
            // receiveShadow
            skeleton={skeleton}
        />
        <OrbitControls />
        <Floor/>
    </Physics>
}
