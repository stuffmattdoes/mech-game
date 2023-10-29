import { forwardRef, useContext, useMemo } from 'react';
import { DepthTexture, MeshNormalMaterial, NearestFilter, Uniform, Vector2, Vector4, WebGLRenderTarget, WebGLRenderer } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { EffectComposerContext } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel
// About webgl shader variables https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram

class DownSample extends Effect {
	constructor(
		enabled: boolean,
		renderTexture:  Texture,
	) {
		super(
			'DownSampleEffect',
			`
				// uniform sampler2D tDepthNormal;
				uniform sampler2D tDiffuse;

				void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
					#ifdef ENABLED
						outputColor = texture2D(tDiffuse, uv);
					#else
						outputColor = texture2D(inputBuffer, uv);
					#endif
				}
			`,
			{
				attributes: EffectAttribute.DEPTH,
				blendFunction: BlendFunction.NORMAL,
				defines: new Map([
					['ENABLED', String(enabled)]
				]),
				uniforms: new Map([
					['tDiffuse', new Uniform(renderTexture)]
				])
			}
		);

		this.enabled = enabled;
		// this.resolution = resolution;
	}

	private set enabled(value: boolean) {
		value
			? this.defines.set('ENABLED', 'true')
			: this.defines.delete('ENABLED');

		// redundant since changing useControls param rerenders <EffectComponent/>
		this.setChanged();
	}

	// private set resolution(value: Vector2) {
	// 	this.setSize(value.x, value.y);
	// 	this.setChanged();
	// }
	
	// update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget<Texture>, deltaTime?: number | undefined): void {
	// 	// renderer.setSize(this.resolution.x, this.resolution.y);
	// 	console.log(this.resolution);
	// }
}

type Props = {
	enabled: boolean,
	resolution: Vector4
}

export const DownSampleEffect = forwardRef<DownSample, Props>(({ enabled, resolution }, ref) => {
	/*
		Future improvement:
		1. Initial <shaderPass/> that downsamples texture, writes to output buffer
		2. Follow up <effectPass/> which receives downsampled textures as inputBuffer
	*/
	const renderTexture = useFBO({
		generateMipmaps: false,
		magFilter: NearestFilter,
		minFilter: NearestFilter,
		stencilBuffer: false
	});
	renderTexture.setSize(resolution.x, resolution.y);

	useFrame((state) => {
		// render standard texture
		state.gl.setRenderTarget(renderTexture);
		state.gl.render(state.scene, state.camera);
		state.gl.setRenderTarget(null);
	});
	
	const effect = useMemo(() =>
		new DownSample(
			enabled,
			renderTexture.texture
		),
		[
			enabled,
			renderTexture
		]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});
