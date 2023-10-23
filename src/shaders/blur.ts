import { Vector2 } from 'three';

export const blurShader = {
    uniforms: {
        tDiffuse: { value: null },
        resolution: {
            value: new Vector2(
                window.innerWidth,
                window.innerHeight
            ).multiplyScalar(window.devicePixelRatio)
        },
        blurSize: { value: 8 }
    },
    vertexShader: `
        varying vec2 v_uv;

        void main() {
            v_uv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float blurSize;

        varying vec2 v_uv;

        vec4 blur(sampler2D tex) {
            const float PI2 = 6.28318530718; // PI * 2
            const float directions = 16.0;
            const float quality = 3.0;

            vec2 radius = blurSize / resolution;

            // normalized pixel coordinates (0-1)
            // vec2 uv = gl_FragCoord.xy / resolution;
            vec2 uv = v_uv;

            // pixel color
            vec4 color = texture2D(tDiffuse, uv);

            int count = 1;
            for (float theta = 0.0; theta < PI2; theta += PI2 / directions) {
                vec2 dir = vec2(cos(theta), sin(theta)) * radius;

                for (float i = 1.0 / quality; i <= 1.0; i += 1.0 / quality) {
                    color += texture2D(tex, uv + dir * i);
                    count++;
                }
            }
            color /= float(count);

            return color;
        }

        void main() {
            gl_FragColor = blur(tDiffuse);
        }
    `
};