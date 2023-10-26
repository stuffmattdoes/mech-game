import { forwardRef, useContext, useMemo } from 'react';
import { Uniform, Vector2, Vector4 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
// import fragmentShader from './pixelize.frag';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

const fragmentShader = `
uniform float detailStrength;
uniform sampler2D tNormal;
// uniform sampler2D tDepth;
// uniform sampler2D depthBuffer;
uniform float outlineStrength;
uniform vec4 resolution;

float getDepth(int x, int y) {
    return texture2D(depthBuffer, vUv + vec2(x, y) * resolution.zw).r;
}

vec3 getNormal(int x, int y) {
    return texture2D(tNormal, vUv + vec2(x, y) * resolution.zw).rgb * 2.0 - 1.0;
}

float getOutline(float depth) {
    float diff = 0.0;
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
    return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
}

float getNeighborDetail(int x, int y, float depth, vec3 normal) {
    float depthDiff = getDepth(x, y) - depth;
    vec3 neighborNormal = getNormal(x, y);
    
    // Edge pixels should yield to faces who's normals are closer to the bias normal.
    vec3 normalEdgeBias = vec3(1.0, 1.0, 1.0); // This should probably be a parameter.
    float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
    float normalIndicator = clamp(smoothstep(-0.01, 0.01, normalDiff), 0.0, 1.0);
    
    // Only the shallower pixel should detect the normal edge.
    float depthIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);

    return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;
}

float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    indicator += getNeighborDetail(0, -1, depth, normal);
    indicator += getNeighborDetail(0, 1, depth, normal);
    indicator += getNeighborDetail(-1, 0, depth, normal);
    indicator += getNeighborDetail(1, 0, depth, normal);

    return step(0.1, indicator);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    #ifdef ENABLED
        vec3 normal = vec3(0.0);
        float _depth = 0.0;

        if (outlineStrength > 0.0 || detailStrength > 0.0) {
            // _depth = getDepth(0, 0);
            _depth = depth;
            normal = getNormal(0, 0);
        }

		// Figure out depth packing. Depth is still 0 - 1
        float outline = 0.0;
        if (outlineStrength > 0.0) 
            outline = getOutline(_depth);

        float detail = 0.0; 
        if (detailStrength > 0.0) 
            detail = getDetail(_depth, normal);

        float strength = outline > 0.0
            ? (1.0 - outlineStrength * outline)
            : (1.0 + detailStrength * detail);

        // uv = resolution.xy * (floor(uv * resolution.zw) + 0.5);
        outputColor = inputColor * strength;
    #else
        outputColor = inputColor;
    #endif
}
`;

export class PixelationEffect extends Effect {
	constructor(
		enabled: boolean = true,
		granularity: number = 30.0,
		detailStrength: number,
		outlineStrength: number,
		normals: Texture,
		// depthTexture: DepthTexture,
		resolution: Vector2
	) {
		super(
			'CustomEffect',
			fragmentShader,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				// @ts-ignore
				uniforms: new Map([
					['detailStrength', new Uniform(detailStrength)],
					// ['tDepth', new Uniform(depthTexture)],
					['tNormal', new Uniform(normals)],
					['outlineStrength', new Uniform(outlineStrength)],
					['resolution', new Uniform(new Vector4(
						resolution.x,
						resolution.y,
						1.0 / resolution.x,
						1.0 / resolution.y,
					))]
				])
			}
		);

		this.enabled = enabled;
		this.granularity = granularity;
	}

	private set enabled(value: boolean) {
		value
			? this.defines.set('ENABLED', 'true')
			: this.defines.delete('ENABLED');

		// redundant since changing useControls param rerenders <EffectComponent/>
		this.setChanged();
	}

	private set granularity(value: number) {
		this.defines.set('GRANULARITY', String(value));
		this.setChanged();
	}
}

type PixelizeProps = {
	details: number,
	enabled: boolean,
	granularity: number,
	outlines: number
}

export const Pixelize = forwardRef<PixelationEffect, PixelizeProps>(({ details, enabled, granularity, outlines }, ref) => {
	const { normalPass } = useContext(EffectComposerContext);
	const { size } = useThree();
	// const depthTexture = useDepthBuffer({ size: size.width });
	const effect = useMemo(() =>
		new PixelationEffect(enabled, granularity, details, outlines, normalPass?.texture!, new Vector2(size.width, size.height)),
		[details, enabled, granularity, normalPass, outlines, size]);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
