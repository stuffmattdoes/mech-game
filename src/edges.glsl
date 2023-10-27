uniform float detailStrength;
uniform float granularity;
uniform sampler2D tNormal;
// uniform sampler2D depthBuffer;
// uniform sampler2D renderTarget;
uniform float outlineStrength;
uniform vec4 resolution;

float getDepth(int x, int y, vec2 uv) {
    // samples depth buffer 
    return texture2D(depthBuffer, uv + vec2(x, y) * resolution.zw).r;
}

vec3 getNormal(int x, int y, vec2 uv) {
    return texture2D(tNormal, uv + vec2(x, y) * resolution.zw).rgb * 2.0 - 1.0;
}

float getOutline(float depth, vec2 uv) {
    float diff = 0.0;

    // sample pixel depths above and beside current pixel
    diff += clamp(getDepth(0, 1, uv) - depth, 0.0, 1.0);    // top
    diff += clamp(getDepth(1, 0, uv) - depth, 0.0, 1.0);    // mid right
    diff += clamp(getDepth(0, -1, uv) - depth, 0.0, 1.0);   // bot
    diff += clamp(getDepth(-1, 0, uv) - depth, 0.0, 1.0);   // mid left

    // few more samples, this time diagonally adjacent
    // diff += clamp(getDepth(1, 1) - depth, 0.0, 1.0);    // top right
    // diff += clamp(getDepth(1, -1) - depth, 0.0, 1.0);   // bot right
    // diff += clamp(getDepth(-1, -1) - depth, 0.0, 1.0);  // bot left
    // diff += clamp(getDepth(-1, 1) - depth, 0.0, 1.0);   // top left

    return floor(smoothstep(0.01, 0.02, diff) * 2.0) / 2.0;
}

float getNeighborDetail(int x, int y, float depth, vec3 normal, vec2 uv) {
    float depthDiff = getDepth(x, y, uv) - depth;
    vec3 neighborNormal = getNormal(x, y, uv);
    
    // Edge pixels should yield to faces who's normals are closer to the bias normal.
    vec3 normalEdgeBias = vec3(1.0, 1.0, 1.0);
    float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
    float normalIndicator = clamp(smoothstep(-0.01, 0.02, normalDiff), 0.0, 1.0);

    // Only the shallower pixel should detect the normal edge.
    float depthIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);

    return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;
}

float getDetail(float depth, vec3 normal, vec2 uv) {
    float indicator = 0.0;

    indicator += getNeighborDetail(0, -1, depth, normal, uv);
    indicator += getNeighborDetail(0, 1, depth, normal, uv);
    indicator += getNeighborDetail(-1, 0, depth, normal, uv);
    indicator += getNeighborDetail(1, 0, depth, normal, uv);

    return step(0.1, indicator);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    #ifdef ENABLED
        vec2 d = vec2(
            1.0 / resolution.x,
            1.0 / resolution.y
        ).xy;
        // downsampled UV
        vec2 dUv = vec2(
            d.x * floor(uv.x / d.x),
            d.y * floor(uv.y / d.y)
        );
        vec4 texel = texture2D(inputBuffer, dUv);
        vec3 normal = vec3(0.0);
        float _depth = 0.0;

        if (outlineStrength > 0.0 || detailStrength > 0.0) {
            _depth = depth;
            normal = getNormal(0, 0, dUv);
        }

        float outline = 0.0;
        if (outlineStrength > 0.0)
            outline = getOutline(_depth, dUv);

        float detail = 0.0;
        if (detailStrength > 0.0)
            detail = getDetail(_depth, normal, dUv);

        float strength = outline > 0.0
            ? (1.0 - outlineStrength * outline)
            : (1.0 + detailStrength * detail);

        outputColor = vec4(texel.rgb * strength, inputColor.a);
    #else
        outputColor = inputColor;
    #endif
}
