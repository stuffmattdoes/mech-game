import { forwardRef, useContext, useMemo } from 'react';
import { DepthTexture, NearestFilter, Uniform, Vector2, Vector4 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
// @ts-ignore
import detailShader from './edges.glsl';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class EdgeEffect extends Effect {
	constructor(
		enabled: boolean = true,
		detailStrength: number,
		outlineStrength: number,
		resolution: Vector2,
		renderTexture:  Texture,
		depthTexture: Texture,
		normalTexture: Texture
	) {
		super(
			'EdgeShader',
			detailShader,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				defines: new Map([
					['ENABLED', String(enabled)]
				]),
				// @ts-ignore
				uniforms: new Map([
					['detailStrength', new Uniform(detailStrength)],
					['tDepth', new Uniform(depthTexture)],
					['tDiffuse', new Uniform(renderTexture)],
					['tNormal', new Uniform(normalTexture)],
					['outlineStrength', new Uniform(outlineStrength)],
					['resolution', new Uniform(resolution)]
				])
			}
		);

		this.enabled = enabled;
	}

	private set enabled(value: boolean) {
		value
			? this.defines.set('ENABLED', 'true')
			: this.defines.delete('ENABLED');

		// redundant since changing useControls param rerenders <EffectComponent/>
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
	/*
		1. Initial <shaderPass/> that downsamples texture, writes to output buffer
		2. Follow up <effectPass/> which receives downsampled textures as inputBuffer
	*/
	const { size } = useThree();
	const resolution = new Vector2(size.width, size.height).divideScalar(granularity).round();

	const renderTexture = useFBO({
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false,
		depthBuffer: true,
		depthTexture: new DepthTexture(resolution.x, resolution.y)
	});
	renderTexture.setSize(resolution.x, resolution.y);

	useFrame((state) => {
		state.gl.setRenderTarget(renderTexture);
		state.gl.render(state.scene, state.camera);
		state.gl.setRenderTarget(null);
	});
	// const depthBuffer = useDepthBuffer({ size: resolution.x > resolution.y ? resolution.x : resolution.y });
	const { normalPass } = useContext(EffectComposerContext);
	if (!normalPass)
		return null;
	normalPass.setSize(resolution.x, resolution.y);	

	const effect = useMemo(() =>
		new EdgeEffect(
			enabled,
			details,
			outlines,
			resolution,
			renderTexture.texture,
			renderTexture.depthTexture,
			normalPass.texture
		),
		[enabled, granularity, details, outlines, normalPass.texture]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});
