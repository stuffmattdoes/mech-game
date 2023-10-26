// uniform sampler2D inputBuffer;
uniform vec4 resolution;
// varying vec2 vUv;

// void mainUv(inout vec2 uv) {
//     #ifdef ENABLED
//         uv = resolution.xy * (floor(uv * resolution.zw) + 0.5);
//     #else
//         uv = uv;
//     #endif
// }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    #ifdef ENABLED
        vec2 iuv = (floor(resolution.xy * uv) + .5) * resolution.zw;
        vec4 texel = texture2D(inputBuffer, iuv );
        outputColor = texel;
    #else
        outputColor = inputColor;
    #endif
}
