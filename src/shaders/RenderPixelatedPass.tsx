import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useControls } from 'leva';
import { Vector2, Vector4, Uniform, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BlendFunction, Effect, PixelationEffect } from 'postprocessing';

const fragmentShader = `
	uniform bool u_enabled;
	uniform vec4 d;

	void mainUv(inout vec2 uv) {
		if (u_enabled) {
			uv = d.xy * (floor(uv * d.zw) + 0.5);
		}
	}`

/**
 * A pixelation effect.
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

export class Pixelizer extends Effect {
	private _granularity: number;
	// public granularity: number;
	readonly resolution: Vector2;
	constructor({
		granularity = 30,
		enabled = true,
		depthEdgeStrength = 50,
		normalEdgeStrength = 50
	}) {
		super('PixelationEffect', fragmentShader, {
			// @ts-ignore
			uniforms: new Map([
				['u_enabled', new Uniform(enabled)],
				['d', new Uniform(new Vector4())]
			])
		});

		this.resolution = new Vector2();
		this.granularity = granularity;
	}

	public get granularity() {
		console.log('get granularity');
		return this._granularity;
	}

	public set granularity(value: number) {
		let d = Math.floor(value);
		console.log('set granularity', d);

		if (d % 2 > 0) {
			d += 1;
		}

		// this.granularity = value;
		this._granularity = d;
		// this.uniforms.get('d').value = this._granularity;
		this.uniforms.get('u_enabled')!.value = (d > 0);
		this.setSize(this.resolution.width, this.resolution.height);
	}

	/**
	 * Updates the granularity.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width: number, height: number) {
		const resolution = this.resolution;
		resolution.set(width, height);
		console.log('setSize', this.resolution);

		const d = this._granularity;
		const x = d / resolution.x;
		const y = d / resolution.y;

		if (this.uniforms.get('d')) {
			this.uniforms.get('d')!.value.set(x, y, 1.0 / x, 1.0 / y);
		}
	}
}

type PixelizeProps = {
	enabled: boolean,
	granularity: number
}

export const Pixelize = forwardRef<PixelationEffect, PixelizeProps>(({ enabled, granularity }, ref) => {
	const effect = useMemo(() => new PixelationEffect(granularity), [granularity]);
	return <primitive object={effect} dispose={null} />
});
