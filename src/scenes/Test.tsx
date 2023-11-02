import { Box, Gem, Plane } from "../components";

export function TestScene() {
    return <scene>
      <Gem position={[0, 0.5, .25]}>
        <pointLight
          // castShadow
          color={0x2379cf}
          decay={.5}
          distance={1}
          intensity={8}
        />
      </Gem>
      {/* <Ball
        position={[0, 0.2 / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[0.1, 0.1, 0.1]}
      /> */}
      <Box
        position={[.4, 0.4 / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[0.4, 0.4, 0.4]}
      />
      <Box
        position={[-.4, 0.2 / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[0.2, 0.2, 0.2]}
      />
      <Plane scale={2} />
    </scene>
  }