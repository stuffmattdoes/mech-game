import { forwardRef, useMemo } from 'react';
import { Uniform, Vector2, Vector3, Vector4 } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel

// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram


const fragmentShader = `
	// uniform vec2 resolution;
	// uniform vec2 texelSize;
	// uniform float cameraNear;
	// uniform float cameraFar;
	// uniform float aspect;
	// uniform float time;

	// uniform sampler2D inputBuffer;
	// uniform sampler2D depthBuffer;
	
	void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
		outputColor = inputColor * uv.x;
	}
`;

export class PixelationEffect extends Effect {
	constructor({ enabled = true, granularity = 30.0 }) {
		super(
			'CustomEffect',
			fragmentShader,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				// @ts-ignore
				uniforms: new Map([
					['angle', new Uniform(new Vector2(0, 0))],
					['scale', new Uniform(1.0)]
				])
			}
		);
	}
}

type PixelizeProps = {
	enabled: boolean,
	granularity: number
}

export const Pixelize = forwardRef<PixelationEffect, PixelizeProps>((props, ref) => {
	const effect = useMemo(() => new PixelationEffect(props), [props.enabled, props.granularity]);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
