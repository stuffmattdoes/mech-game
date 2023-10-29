import { forwardRef, useContext, useMemo } from 'react';
import { DepthTexture, MeshNormalMaterial, NearestFilter, Uniform, Vector2 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useDepthBuffer, useFBO } from '@react-three/drei';
// @ts-ignore
import edgeShader from './edges.glsl';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class Edges extends Effect {
	constructor(
		enabled: boolean = true,
		detailStrength: number,
		outlineStrength: number,
		resolution: Vector2,
		// renderTexture:  Texture,
		// depthTexture: Texture,
		normalTexture: Texture,
		downSampleTexture: Texture
	) {
		super(
			'EdgesEffect',
			edgeShader,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				defines: new Map([
					['ENABLED', String(enabled)]
				]),
				// @ts-ignore
				uniforms: new Map([
					['detailStrength', new Uniform(detailStrength)],
					// ['tDepth', new Uniform(depthTexture)],
					// ['tDiffuse', new Uniform(renderTexture)],
					['tDownSample', new Uniform(downSampleTexture)],
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

export const EdgesEffect = forwardRef<Edges, EdgeProps>(({ details, enabled, granularity, outlines }, ref) => {
	/*
		Future improvement:
		1. Initial <shaderPass/> that downsamples texture, writes to output buffer
		2. Follow up <effectPass/> which receives downsampled textures as inputBuffer
	*/
	const { size } = useThree();
	const resolution = new Vector2(size.width, size.height).divideScalar(granularity).round();
	// console.log(resolution);
	// const renderConfig = {
	// 	generateMipmaps: false,
	// 	magFilter: NearestFilter,
	// 	minFilter: NearestFilter,
	// 	stencilBuffer: false,
	// };
	// const renderTexture = useFBO({
	// 	...renderConfig,
	// 	depthBuffer: true,
	// 	depthTexture: new DepthTexture(resolution.x, resolution.y)
	// });
	// renderTexture.setSize(resolution.x, resolution.y);

	const normalTexture = useFBO({
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false,
	});
	normalTexture.setSize(resolution.x, resolution.y);
	const normalMaterial = new MeshNormalMaterial();

	useFrame((state) => {
		// render standard texture
		// state.gl.setRenderTarget(renderTexture);
		// state.gl.render(state.scene, state.camera);
		// state.gl.setRenderTarget(null);
		
		// render normal texture
		const sceneMaterial = state.scene.overrideMaterial;
		state.gl.setRenderTarget(normalTexture)
		state.scene.overrideMaterial = normalMaterial;
		state.gl.render(state.scene, state.camera);
		state.scene.overrideMaterial = sceneMaterial
	});
	const { downSamplingPass, normalPass } = useContext(EffectComposerContext);

	if (!normalPass || !downSamplingPass)
		return null;
	console.log('downSamplingPass', downSamplingPass);
	// normalPass.setSize(resolution.x, resolution.y);	

	const effect = useMemo(() =>
		new Edges(
			enabled,
			details,
			outlines,
			resolution,
			// renderTexture.texture,
			// renderTexture.depthTexture,
			// normalPass.texture
			normalTexture.texture,
			downSamplingPass?.texture
		),
		[
			enabled,
			details,
			outlines,
			resolution,
			// renderTexture.texture,
			// renderTexture.depthTexture,
			// normalPass.texture
			normalTexture.texture
		]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});
