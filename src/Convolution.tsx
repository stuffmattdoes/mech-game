import { forwardRef, useMemo } from 'react';
import { DepthTexture, MeshNormalMaterial, NearestFilter, Uniform, Vector2 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
// @ts-ignore
import edgeShader from './edges2.glsl';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class Convolution extends Effect {
	constructor(
		enabled: boolean = true,
		detailStrength: number,
		outlineStrength: number,
		resolution: Vector2,
		// renderTexture: Texture,
		// depthNormal: Texture
		depthTexture: Texture,
		normalTexture: Texture,
	) {
		super(
			'EdgesEffect',
			edgeShader,
			{
				// attributes: EffectAttribute.CONVOLUTION,
				blendFunction: BlendFunction.NORMAL,
				defines: new Map([
					['ENABLED', String(enabled)]
				]),
				// @ts-ignore
				uniforms: new Map([
					['detailStrength', new Uniform(detailStrength)],
					// ['tDiffuse', new Uniform(renderTexture)],
					['tDepth', new Uniform(depthTexture)],
					['tNormal', new Uniform(normalTexture)],
					// ['tDepthNormal', new Uniform(depthNormal)],
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
	// granularity: number,
	outlines: number,
	resolution: Vector2
}

export const ConvolutionEffect = forwardRef<Convolution, EdgeProps>(({ details, enabled, outlines, resolution }, ref) => {
	/*
		Future improvement:
		1. Initial <shaderPass/> that downsamples texture, writes to output buffer
		2. Follow up <effectPass/> which receives downsampled textures as inputBuffer
	*/
	const renderConfig = {
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false,
	};
	const renderTexture = useFBO({
		...renderConfig,
		depthBuffer: true,
		depthTexture: new DepthTexture(resolution.x, resolution.y)
	});

	const normalTexture = useFBO({
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false,
	});
	const normalMaterial = new MeshNormalMaterial();

	useFrame((state) => {
		// render standard texture
		renderTexture.setSize(resolution.x, resolution.y);
		state.gl.setRenderTarget(renderTexture);
		state.gl.render(state.scene, state.camera);
		state.gl.setRenderTarget(null);
		
		// render normal texture
		const sceneMaterial = state.scene.overrideMaterial;
		normalTexture.setSize(resolution.x, resolution.y);
		state.gl.setRenderTarget(normalTexture)
		state.scene.overrideMaterial = normalMaterial;
		state.gl.render(state.scene, state.camera);
		state.scene.overrideMaterial = sceneMaterial
	});

	const effect = useMemo(() =>
		new Convolution(
			enabled,
			details,
			outlines,
			resolution,
			// renderTexture.texture,
			renderTexture.depthTexture,
			normalTexture.texture,
		),
		[
			enabled,
			details,
			outlines,
			resolution,
			// renderTexture.texture,
			renderTexture.depthTexture,
			normalTexture.texture
		]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});
