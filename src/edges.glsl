// built-in
// will throw error if you define here without also passing in custom uniform through app code
// uniform sampler2D inputBuffer;
// uniform sampler2D depthBuffer;
uniform vec4 resolution;

// custom
uniform float detailStrength;
uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
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

    return floor(smoothstep(0.01, 0.04, diff) * 2.0) / 2.0;
}

// TODO: no line on concave surface
// if dot product > 0.0, normal vectors are aligned/facing toward (concave)
// if dot product < 0.0, normal vectors are facing apart (convex)

float getNeighborDetail(int x, int y, float depth, vec3 normal) {
    float depthDiff = getDepth(x, y) - depth;
    vec3 neighborNormal = getNormal(x, y);
    
    // Outline should bias towards normals that are pointed in similar direction to the bias normal.
    vec3 normalEdgeRef = vec3(1.0, 1.0, 1.0); // vector pointing to top right and towards camera
    float normalDiff = dot(normal - neighborNormal, normalEdgeRef);
    float normalIndicator = clamp(smoothstep(-0.01, 0.02, normalDiff), 0.0, 1.0);

    // Pixel closest to the screen should detect the normal edge.
    float depthIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);
    float dotProduct = dot(normal, neighborNormal);
    
    // if (dotProduct < 0.0) {
    //     return (1.0 - dotProduct) * depthIndicator * normalIndicator;
    // } else {
    //     return 0.0;
    // }

    return (1.0 - dotProduct) * depthIndicator * normalIndicator;
    // return distance(normal, neighborNormal) * depthIndicator * normalIndicator;
}

float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    indicator += getNeighborDetail(0, -1, depth, normal);
    indicator += getNeighborDetail(0, 1, depth, normal);
    indicator += getNeighborDetail(-1, 0, depth, normal);
    indicator += getNeighborDetail(1, 0, depth, normal);

    return step(0.1, indicator);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    #ifdef ENABLED
        // vec4 texel = texture2D(inputBuffer, vUv);
        vec4 texel = texture2D(tDiffuse, vUv);
        float _depth = getDepth(0, 0);
        vec3 normal = getNormal(0, 0);
        float outline = getOutline(_depth);
        float detail = getDetail(_depth, normal);
        float strength = outline > 0.0
            ? (1.0 - outlineStrength * outline)
            : (1.0 + detailStrength * detail);

        // outputColor = vec4(inputColor.rgb * strength, inputColor.a);
        outputColor = vec4(texel.rgb * strength, inputColor.a);
    #else
        outputColor = inputColor;
    #endif
}
