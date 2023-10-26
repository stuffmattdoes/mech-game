import { forwardRef, useMemo } from 'react';
import { Uniform, Vector2, Vector4 } from 'three';
import { BlendFunction, Effect } from 'postprocessing';
import { useThree } from '@react-three/fiber';
// @ts-ignore
import pixelShader from './pixelize.glsl';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class PixelEffect extends Effect {
	constructor(
		enabled: boolean = true,
		granularity: number = 30.0,
		resolution: Vector2
	) {
		super(
			'PixelShader',
			pixelShader,
			{
				blendFunction: BlendFunction.NORMAL,
				uniforms: new Map([
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

type PixelProps = {
	details: number,
	enabled: boolean,
	granularity: number,
	outlines: number
}

export const Pixels = forwardRef<PixelEffect, PixelProps>(({ enabled, granularity }, ref) => {
	const { size } = useThree();
	const effect = useMemo(() =>
		new PixelEffect(enabled, granularity, new Vector2(size.width, size.height)),
		[enabled, granularity, size]);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
