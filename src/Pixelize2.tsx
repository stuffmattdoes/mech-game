import { forwardRef, useContext, useMemo } from 'react';
import { Uniform, Vector2, Vector4 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
// @ts-ignore
import detailShader from './details.glsl';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

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
			detailShader,
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
