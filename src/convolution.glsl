// built-in
// will throw error if you define here without also passing in custom uniform through app code
// uniform sampler2D inputBuffer;
// uniform sampler2D depthBuffer;
uniform vec4 resolution;

// custom
uniform float detailStrength;
uniform sampler2D tDepth;
// uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
// uniform sampler2D tNormalDepth;
uniform float outlineStrength;

float getDepth(int x, int y) {
    return texture2D(tDepth, vUv + vec2(x, y) * (1.0 / resolution.xy)).r;
}

vec3 getNormal(int x, int y) {
    return texture2D(tNormal, vUv + vec2(x, y) * (1.0 / resolution.xy)).rgb * 2.0 - 1.0;
}

float getOutline(float depth) {
    float diff = 0.0;

    // sample pixel depths above and beside current pixel
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);    // top
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);    // mid right
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);   // bot
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);   // mid left

    // few more samples, this time diagonally adjacent
    // diff += clamp(getDepth(1, 1) - depth, 0.0, 1.0);    // top right
    // diff += clamp(getDepth(1, -1) - depth, 0.0, 1.0);   // bot right
    // diff += clamp(getDepth(-1, -1) - depth, 0.0, 1.0);  // bot left
    // diff += clamp(getDepth(-1, 1) - depth, 0.0, 1.0);   // top left

    return floor(smoothstep(0.01, 0.02, diff) * 2.0) / 2.0;
}

float getNeighborDetail(int x, int y, float depth, vec3 normal) {
    float depthDiff = getDepth(x, y) - depth;
    vec3 neighborNormal = getNormal(x, y);
    
    // Edge pixels should offset to faces who's normals are closer to the bias normal.
    vec3 normalEdgeOffset = vec3(1.0, 1.0, 1.0);
    float normalDiff = dot(normal - neighborNormal, normalEdgeOffset);
    float normalIndicator = clamp(smoothstep(-0.01, 0.02, normalDiff), 0.0, 1.0);

    // Only the shallower pixel should detect the normal edge.
    float depthIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);

    return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;
}

float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    indicator += getNeighborDetail(0, -1, depth, normal);
    indicator += getNeighborDetail(0, 1, depth, normal);
    indicator += getNeighborDetail(-1, 0, depth, normal);
    indicator += getNeighborDetail(1, 0, depth, normal);

    return step(0.1, indicator);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    #ifdef ENABLED
        // vec4 texel = texture2D(inputBuffer, vUv);
        vec4 texel = inputColor;

        vec3 normal = vec3(0.0);
        float _depth = 0.0;

        if (outlineStrength > 0.0 || detailStrength > 0.0) {
            _depth = getDepth(0, 0);
            normal = getNormal(0, 0);
        }

        float outline = 0.0;
        if (outlineStrength > 0.0)
            outline = getOutline(_depth);

        float detail = 0.0;
        if (detailStrength > 0.0)
            detail = getDetail(_depth, normal);

        float strength = outline > 0.0
            ? (1.0 - outlineStrength * outline)
            : (1.0 + detailStrength * detail);

        outputColor = vec4(texel.rgb * strength, inputColor.a);
    #else
        outputColor = inputColor;
    #endif
}