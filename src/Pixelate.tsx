import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';

const fragmentShader = `some_shader_code`

// Effect implementation
class PixelateEffect extends Effect {
    granularity: Uniform<number>;

    constructor(granularity = 0.1) {
        super('Pixelize', fragmentShader, {
            uniforms: new Map([['param', new Uniform(granularity)]]),
        })

        this.granularity = new Uniform(granularity);
    }

    update(renderer, inputBuffer, deltaTime) {
        // this.uniforms.get('param').value = this._uParam;
        this.uniforms.set('granularity', this.granularity);
    }
}

type PixelateProps = {
    granularity: number
}
export const Pixelate = forwardRef(({ granularity }: PixelateProps, ref) => {
    const effect = useMemo(() => new PixelateEffect(granularity), [granularity]);
    return <primitive ref={ref} object={effect} dispose={null} />
})