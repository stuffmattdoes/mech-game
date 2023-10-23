import { useThree } from '@react-three/fiber';
import { Ref, forwardRef, useMemo } from 'react';
import { useControls } from 'leva';
import {
    WebGLRenderTarget,
    MeshNormalMaterial,
    ShaderMaterial,
    Vector2,
    Vector4,
    DepthTexture,
    NearestFilter,
    HalfFloatType,
    Scene,
    Camera,
    Texture,
    Uniform,
} from 'three';
import { FullScreenQuad, Pass, RenderPixelatedPass } from 'three-stdlib';
import { Effect } from 'postprocessing';

export class PixelPass extends Pass {
    readonly beautyRenderTarget: WebGLRenderTarget<Texture>;
    readonly camera: Camera;
    readonly depthEdgeStrength: number;
    readonly fsQuad: FullScreenQuad<ShaderMaterial>;
    readonly normalEdgeStrength: number;
    readonly normalMaterial: MeshNormalMaterial;
    readonly normalRenderTarget: WebGLRenderTarget;
    readonly pixelatedMaterial: ShaderMaterial;
    pixelSize: number;
    readonly resolution: Vector2;
    readonly renderResolution: Vector2;
    readonly scene: Scene;

    constructor(
        pixelSize: number,
        scene: Scene,
        camera: Camera,
        options = {
            depthEdgeStrength: 0.4,
            enabled: true,
            normalEdgeStrength: 0.3
        }
    ) {
        super();
        console.log('constructor');

        this.pixelSize = pixelSize;
        this.resolution = new Vector2();
        this.renderResolution = new Vector2();

        this.pixelatedMaterial = this.createPixelatedMaterial();
        this.normalMaterial = new MeshNormalMaterial();

        this.fsQuad = new FullScreenQuad(this.pixelatedMaterial);
        this.scene = scene;
        this.camera = camera;

        this.normalEdgeStrength = options.normalEdgeStrength;
        this.depthEdgeStrength = options.depthEdgeStrength;

        this.beautyRenderTarget = new WebGLRenderTarget();
        this.beautyRenderTarget.texture.minFilter = NearestFilter;
        this.beautyRenderTarget.texture.magFilter = NearestFilter;
        this.beautyRenderTarget.texture.type = HalfFloatType;
        this.beautyRenderTarget.depthTexture = new DepthTexture();

        this.normalRenderTarget = new WebGLRenderTarget();
        this.normalRenderTarget.texture.minFilter = NearestFilter;
        this.normalRenderTarget.texture.magFilter = NearestFilter;
        this.normalRenderTarget.texture.type = HalfFloatType;
    }

    dispose() {
        console.log('dispose');
        this.beautyRenderTarget.dispose();
        this.normalRenderTarget.dispose();
        this.pixelatedMaterial.dispose();
        this.normalMaterial.dispose();
        this.fsQuad.dispose();
    }

    setSize(width: number, height: number) {
        console.log('setSize');
        this.resolution.set(width, height);
        this.renderResolution.set((width / this.pixelSize) | 0, (height / this.pixelSize) | 0);
        const { x, y } = this.renderResolution;
        this.beautyRenderTarget.setSize(x, y);
        this.normalRenderTarget.setSize(x, y);
        this.fsQuad.material.uniforms.resolution.value.set(x, y, 1 / x, 1 / y);
    }

    setPixelSize(pixelSize: number) {
        console.log('setPixelSize');
        this.pixelSize = pixelSize;
        this.setSize(this.resolution.x, this.resolution.y);
    }

    render(renderer, writeBuffer) {
        console.log('render');
        const uniforms = this.fsQuad.material.uniforms;
        uniforms.normalEdgeStrength.value = this.normalEdgeStrength;
        uniforms.depthEdgeStrength.value = this.depthEdgeStrength;

        renderer.setRenderTarget(this.beautyRenderTarget);
        renderer.render(this.scene, this.camera);

        const overrideMaterial_old = this.scene.overrideMaterial;
        renderer.setRenderTarget(this.normalRenderTarget);
        this.scene.overrideMaterial = this.normalMaterial;
        renderer.render(this.scene, this.camera);
        this.scene.overrideMaterial = overrideMaterial_old;

        uniforms.tDiffuse.value = this.beautyRenderTarget.texture;
        uniforms.tDepth.value = this.beautyRenderTarget.depthTexture;
        uniforms.tNormal.value = this.normalRenderTarget.texture;

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
        }

        this.fsQuad.render(renderer);
    }

    createPixelatedMaterial() {
        console.log('createPixelatedMaterial');
        return new ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                tNormal: { value: null },
                resolution: {
                    value: new Vector4(
                        this.renderResolution.x,
                        this.renderResolution.y,
                        1 / this.renderResolution.x,
                        1 / this.renderResolution.y,
                    )
                },
                normalEdgeStrength: { value: 0 },
                depthEdgeStrength: { value: 0 }
            },
            vertexShader: /* glsl */`
				varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,
            fragmentShader: /* glsl */`
				uniform sampler2D tDiffuse;
				uniform sampler2D tDepth;
				uniform sampler2D tNormal;
				uniform vec4 resolution;
				uniform float normalEdgeStrength;
				uniform float depthEdgeStrength;
				varying vec2 vUv;

				float getDepth(int x, int y) {

					return texture2D( tDepth, vUv + vec2(x, y) * resolution.zw ).r;

				}

				vec3 getNormal(int x, int y) {

					return texture2D( tNormal, vUv + vec2(x, y) * resolution.zw ).rgb * 2.0 - 1.0;

				}

				float depthEdgeIndicator(float depth, vec3 normal) {

					float diff = 0.0;
					diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
					return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;

				}

				float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {

					float depthDiff = getDepth(x, y) - depth;
					vec3 neighborNormal = getNormal(x, y);

					// Edge pixels should yield to faces who's normals are closer to the bias normal.
					vec3 normalEdgeBias = vec3(1., 1., 1.); // This should probably be a parameter.
					float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
					float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);

					// Only the shallower pixel should detect the normal edge.
					float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);

					return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;

				}

				float normalEdgeIndicator(float depth, vec3 normal) {

					float indicator = 0.0;

					indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
					indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
					indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
					indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);

					return step(0.1, indicator);

				}

				void main() {

					vec4 texel = texture2D( tDiffuse, vUv );

					float depth = 0.0;
					vec3 normal = vec3(0.0);

					if (depthEdgeStrength > 0.0 || normalEdgeStrength > 0.0) {

						depth = getDepth(0, 0);
						normal = getNormal(0, 0);

					}

					float dei = 0.0;
					if (depthEdgeStrength > 0.0)
						dei = depthEdgeIndicator(depth, normal);

					float nei = 0.0;
					if (normalEdgeStrength > 0.0)
						nei = normalEdgeIndicator(depth, normal);

					float Strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);

					gl_FragColor = texel * Strength;

				}
			`
        });
    }
}

export class PixelPass2 extends Effect {
    readonly _granularity: number;
    readonly resolution: Vector2;
    readonly granularity: number;

	/**
	 * Constructs a new pixelation effect.
	 *
	 * @param {Object} [granularity=30.0] - The pixel granularity.
	 */

	constructor(
        granularity = 6,
        options = {
            enabled: true,
            depthEdgeStrength: 5,
            normalEdgeStrength: 5
        }
    ) {
		super('PixelationEffect', `
            uniform bool active;
            uniform vec4 d;
            
            void mainUv(inout vec2 uv) {
                if(active) {
                    uv = d.xy * (floor(uv * d.zw) + 0.5);
                }
            }
        `, {
			uniforms: new Map([
                ['granularity', new Uniform(granularity)],
				['active', new Uniform(options.enabled)],
				['d', new Uniform(new Vector4())]
			])
		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * Backing data for {@link granularity}.
		 *
		 * @type {Number}
		 * @private
		 */

		this._granularity = 0;
		this.granularity = granularity;

	}

	/**
	 * The pixel granularity.
	 *
	 * A higher value yields coarser visuals.
	 *
	 * @type {Number}
	 */

	// public get granularity() {
	// 	return this._granularity;
	// }

	// public set granularity(value: number) {
	// 	let d = Math.floor(value);
	// 	if(d % 2 > 0) {
	// 		d += 1;
	// 	}

	// 	this._granularity = d;
	// 	this.uniforms.get('active').value = (d > 0);
	// 	this.setSize(this.resolution.width, this.resolution.height);
	// }

	/**
	 * Updates the granularity.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width: number, height: number) {
		const resolution = this.resolution;
		resolution.set(width, height);

		const d = this.granularity;
		const x = d / resolution.x;
		const y = d / resolution.y;
		this.uniforms.get('d')?.value.set(x, y, 1.0 / x, 1.0 / y);
	}

}

export type PixelizeProps = {
    granularity?: number
  }
  
  export const Pixelize = forwardRef<PixelPass2, PixelizeProps>(function Pixelation({ granularity = 5 }, ref) {
    // const { camera, scene } = useThree();
    const { details, enabled, outline} = useControls('Pixelize', {
        enabled: true,
        details: { min: 0, max: 10, step: 1, value: 5 },
        outline: { min: 0, max: 10, step: 1, value: 5 },
    });

    // const effect = useMemo(() => new PixelPass(
    //     granularity,
    //     scene,
    //     camera, {
    //         enabled,
    //         depthEdgeStrength: outline,
    //         normalEdgeStrength: details
    //     }), [details, enabled, granularity]);

    const effect = useMemo(() => new PixelPass2(
        granularity,
        {
            enabled,
            depthEdgeStrength: outline,
            normalEdgeStrength: details
        }
    ), [granularity, enabled, outline, details]);

    return <primitive ref={ref} object={effect} dispose={null} />
  })