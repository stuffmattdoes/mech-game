import { forwardRef, useMemo } from 'react';
import { Uniform, Vector2, Vector4 } from 'three';
import { EffectAttribute, Effect } from 'postprocessing';

// This effect is influenced by https://threejs.org/examples/#webgl_postprocessing_pixel

const fragmentShader = `
	uniform bool u_enabled;
	uniform vec4 d;

	void mainUv(inout vec2 uv) {
		if (u_enabled) {
			uv = d.xy * (floor(uv * d.zw) + 0.5);
		}
	}
`;

export class PixelationEffect extends Effect {
	private _enabled: boolean;
	private _granularity: number;
	private _resolution: Vector2;

	constructor({ enabled = true, granularity = 30.0 }) {
		super('PixelationEffect', fragmentShader, {
			// @ts-ignore
			uniforms: new Map([
				['u_enabled', new Uniform(false)],
				['d', new Uniform(new Vector4())]
			]),
			attributes: EffectAttribute.DEPTH
		});

		this._enabled = enabled;
		this._granularity = 0;
		this._resolution = new Vector2();
		this.granularity = granularity;

		console.log('defines', this.defines);
	}

	// get enabled() { return this._enabled; }
	
	set enabled(value: boolean) {
		this._enabled = value;
		this.setSize(this._resolution.width, this._resolution.height);
	}

	// get granularity() { return this._granularity; }

	set granularity(value: number) {
		let _value = Math.floor(value);

		if (_value % 2 > 0) {
			_value += 1;
		}

		this._granularity = _value;
		this.uniforms.get('u_enabled')!.value = (_value > 0) && this._enabled;
		this.setSize(this._resolution.width, this._resolution.height);
	}

	/**
	 * Updates the granularity.
	 */
	setSize(width: number, height: number) {
		const resolution = this._resolution;
		resolution.set(width, height);
		const x = this._granularity / resolution.x;
		const y = this._granularity / resolution.y;
		this.uniforms.get('d')!.value.set(x, y, 1.0 / x, 1.0 / y);
	}
}

type PixelizeProps = {
	enabled: boolean,
	granularity: number
}

export const Pixelize = forwardRef<PixelationEffect, PixelizeProps>((props, ref) => {
	const effect = useMemo(() => new PixelationEffect(props), [props.enabled, props.granularity]);
	console.log(effect);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
