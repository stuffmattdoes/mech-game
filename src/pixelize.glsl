// uniform sampler2D inputBuffer;
uniform vec4 resolution;
uniform float granularity;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    #ifdef ENABLED
        vec2 d = vec2(
            1.0 / resolution.x,
            1.0 / resolution.y
        ).xy;
        d *= granularity;
        vec2 downSampledUv = vec2(
            d.x * floor(uv.x / d.x),
            d.y * floor(uv.y / d.y)
        );
        vec4 texel = texture2D(inputBuffer, downSampledUv);
        outputColor = texel;
    #else
        outputColor = inputColor;
    #endif
}
