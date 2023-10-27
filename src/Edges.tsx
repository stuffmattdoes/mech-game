import { forwardRef, useContext, useMemo } from 'react';
import { DepthTexture, NearestFilter, RGBAFormat, Uniform, Vector2, Vector4, WebGLRenderTarget, WebGLRenderer } from 'three';
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
		resolution: Vector2,
		// renderTarget:  WebGLRenderTarget<Texture>,
		normalTexture: Texture,
		// depthTexture: null,
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
					// ['tDepth', new Uniform(depthTexture)],
					['granularity', new Uniform(granularity)],
					// ['tInput', new Uniform(renderTarget)],
					['tNormal', new Uniform(normalTexture)],
					['outlineStrength', new Uniform(outlineStrength)],
					['resolution', new Uniform(new Vector4(
						resolution.x,
						resolution.y,
						1 / resolution.x,
						1 / resolution.y,
					))]
				])
			}
		);

		// this.rgbRenderTarget = pixelRenderTarget( resolution, RGBAFormat, true);
        // this.normalRenderTarget = pixelRenderTarget( resolution, RGBAFormat, false);

		this.resolution = resolution;
		this.enabled = enabled;
		// this.granularity = granularity;
	}

	private set resolution(value: Vector2) {
		this.setSize(value.x, value.y);
		this.setChanged();
	}

	private set enabled(value: boolean) {
		value
			? this.defines.set('ENABLED', 'true')
			: this.defines.delete('ENABLED');

		// redundant since changing useControls param rerenders <EffectComponent/>
		this.setChanged();
	}

	// update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget<Texture>, deltaTime?: number | undefined): void {
	// }

	// private set granularity(value: number) {
	// 	this.uniforms.set('granularity', new Uniform(value));
	// 	this.setChanged();
	// }
}

type EdgeProps = {
	details: number,
	enabled: boolean,
	granularity: number,
	outlines: number
}

export const Edges = forwardRef<EdgeEffect, EdgeProps>(({ details, enabled, granularity, outlines }, ref) => {
	/*
		1. Create downsampled textures:
			* render texture - useFBO()
			* depth texture - useDepthBuffer()
			* normal texture - ???
		2. Pass textures to new EdgeEffect(...)
		3. Update textures every frame with useFrame(...)
	*/
	const { size } = useThree();
	const resolution = new Vector2(size.width, size.height).divideScalar(granularity).round();
	const { normalPass } = useContext(EffectComposerContext);
	// normalPass!.texture.format = RGBAFormat;
    // normalPass!.texture.minFilter = NearestFilter;
    // normalPass!.texture.magFilter = NearestFilter;
    // normalPass!.texture.generateMipmaps = false;
	
	// const normalRenderTarget = pixelRenderTarget(resolution, RGBAFormat, false);
	// normalRenderTarget.texture.format = RGBAFormat;
	// normalRenderTarget.depthBuffer = false;
    // normalRenderTarget.texture.minFilter = NearestFilter;
    // normalRenderTarget.texture.magFilter = NearestFilter;
    // normalRenderTarget.texture.generateMipmaps = false;
    // normalRenderTarget.stencilBuffer = false;
	// console.log(resolution);
	// console.log(normalRenderTarget);

	// const renderTarget = useFBO({
	// 	generateMipmaps: false,
	// 	magFilter: NearestFilter,
	// 	minFilter: NearestFilter,
	// 	stencilBuffer: false,
	// 	depthBuffer: true
	// });
	// useFrame((state) => {
	// 	state.gl.setRenderTarget(renderTarget);
	// 	state.gl.render(state.scene, state.camera);
	// 	state.gl.setRenderTarget(null);
	// });

	const effect = useMemo(() =>
		new EdgeEffect(
			enabled,
			granularity,
			details,
			outlines,
			resolution,
			// renderTarget,
			normalPass?.texture!,
			// normalRenderTarget.texture,
			// renderTarget
		),
		[details, enabled, granularity, outlines, resolution]);
	return <primitive ref={ref} object={effect} dispose={null}/>;
});

// function pixelRenderTarget( resolution: THREE.Vector2, pixelFormat: THREE.PixelFormat, depthTexture: boolean ) {
//     const renderTarget = new WebGLRenderTarget(
//         resolution.x, resolution.y,
//         !depthTexture ?
//             undefined
//             : {
//                 depthTexture: new DepthTexture(
//                     resolution.x,
//                     resolution.y
//                 ),
//                 depthBuffer: true
//             }
//     )
//     renderTarget.texture.format = pixelFormat
//     renderTarget.texture.minFilter = NearestFilter
//     renderTarget.texture.magFilter = NearestFilter
//     renderTarget.texture.generateMipmaps = false
//     renderTarget.stencilBuffer = false
//     return renderTarget
// }
