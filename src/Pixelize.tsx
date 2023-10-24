import React, { forwardRef, useMemo } from 'react';
import { Uniform, Vector2, Vector4, WebGLRenderTarget, WebGLRenderer } from 'three';
import { Effect } from 'postprocessing';
import { useControls } from 'leva';
import { useFrame } from '@react-three/fiber';


const fragmentShader = `
	uniform bool u_enabled;
	uniform vec4 d;

	void mainUv(inout vec2 uv) {
		if (u_enabled) {
			uv = d.xy * (floor(uv * d.zw) + 0.5);
		}
	}
`;

/**
 * A pixelation effect.
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

export class PixelationEffect extends Effect {
	_enabled: boolean;
	_granularity: number;
	_resolution: Vector2;

	constructor({ enabled = true, granularity = 30.0 }) {
		super('PixelationEffect', fragmentShader, {
			// @ts-ignore
			uniforms: new Map([
				['u_enabled', new Uniform(false)],
				['d', new Uniform(new Vector4())]
			])
		});

		this._enabled = enabled;
		this._granularity = 0;
		this._resolution = new Vector2();
		this.granularity = granularity;

	}

	/**
	 * The pixel granularity.
	 * A higher value yields coarser visuals.
	 */
	get granularity() {
		return this._granularity;
	}

	set granularity(value) {
		let d = Math.floor(value);

		if (d % 2 > 0) {
			d += 1;
		}

		this._granularity = d;
		this.uniforms.get('u_enabled').value = (d > 0) && this._enabled;
		this.setSize(this._resolution.width, this._resolution.height);
	}

	/**
	 * Updates the granularity.
	 */
	setSize(width: number, height: number) {
		const resolution = this._resolution;
		resolution.set(width, height);
		const d = this.granularity;
		const x = d / resolution.x;
		const y = d / resolution.y;
		this.uniforms.get('d')!.value.set(x, y, 1.0 / x, 1.0 / y);
	}
}

type PixelizeProps = {
	enabled: boolean,
	granularity: number
}

export const Pixelize = forwardRef<PixelationEffect, PixelizeProps>((props, ref) => {
	const effect = useMemo(() => new PixelationEffect(props), [props.enabled, props.granularity]);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
