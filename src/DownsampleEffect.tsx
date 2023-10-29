import { forwardRef, useMemo } from 'react';
import { NearestFilter, Uniform, Vector2 } from 'three';
import { type Texture } from 'three';
import { BlendFunction, EffectAttribute, Effect } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
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
}

type Props = {
	enabled: boolean,
	resolution: Vector2
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
