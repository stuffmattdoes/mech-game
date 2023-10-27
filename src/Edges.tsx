import { forwardRef, useContext, useMemo } from 'react';
import { DepthTexture, NearestFilter, Uniform, Vector2, Vector4, WebGLRenderTarget } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
// @ts-ignore
import detailShader from './edges.glsl';
import { useFBO } from '@react-three/drei';
// import { useDepthBuffer } from '@react-three/drei';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class EdgeEffect extends Effect {
	constructor(
		enabled: boolean = true,
		granularity: number = 30.0,
		detailStrength: number,
		outlineStrength: number,
		normals: Texture,
		resolution: Vector2,
		renderTarget:  WebGLRenderTarget<Texture>
	) {
		super(
			'EdgeShader',
			detailShader,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				// @ts-ignore
				uniforms: new Map([
					['detailStrength', new Uniform(detailStrength)],
					// ['depthBuffer', new Uniform(depthTexture)],
					['renderTarget', new Uniform(renderTarget)],
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
		this.resolution = resolution;
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
		// this.setSize()
		// this.setChanged();
	}

	private set resolution(value: Vector2) {
		this.setChanged();
	}
}

type EdgeProps = {
	details: number,
	enabled: boolean,
	granularity: number,
	outlines: number
}

export const Edges = forwardRef<EdgeEffect, EdgeProps>(({ details, enabled, granularity, outlines }, ref) => {
	const { normalPass } = useContext(EffectComposerContext);
	const { size } = useThree();
	const renderTarget = useFBO({
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false
	});
	// useFrame((state) => {
	// 	state.gl.setRenderTarget(renderTarget);
	// 	state.gl.render(state.scene, state.camera);
	// 	state.gl.setRenderTarget(null);
	// });
	const resolution = new Vector2(size.width, size.height).divideScalar(granularity);
	const effect = useMemo(() =>
		new EdgeEffect(enabled, granularity, details, outlines, normalPass?.texture!, resolution, renderTarget),
		[details, enabled, granularity, normalPass, outlines, size]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});
