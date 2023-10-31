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
    return normalize(texture2D(tNormal, vUv + vec2(x, y) * (1.0 / resolution.xy)).rgb * 2.0 - 1.0);
    // return normalize(texture2D(tNormal, vUv + vec2(x, y) * (1.0 / resolution.xy)).rgb);
}

float getOutline(float depth) {
    float diff = 0.0;

    // sample pixel depths above and beside current pixel
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);    // top
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);    // right
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);   // bot
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);   // left

    return floor(smoothstep(0.01, 0.04, diff) * 2.0) / 2.0;
}

// TODO: no line on concave surface
// if dot product = 1.0, normals are parallel aligned
// if dot product > 0.0, normals are facing toward (concave)
// if dot product < 0.0, normals are facing apart (convex)
// if dot product = 0.0, normals are perpendicular
// if dot product = -1.0, normals are parallel aligned opposite
float getNeighborDetail(int x, int y, float thisDepth, vec3 thisNormal) {
    vec3 neighborNormal = getNormal(x, y);    
    // Outline should bias towards normals that are pointed in similar direction to the bias normal.
    vec3 normalBiasRef = vec3(1.0, 1.0, 1.0); // vector pointing to top right and towards camera
    float normalBias = dot(thisNormal - neighborNormal, normalBiasRef);

    /*
        smoothstep(-0.01, 0.02, normalBias) applies a smooth step function to normalBias in the range (-0.01, 0.02)
        
        this means detailIndicator will be:
        * 0.0 when normalBias is less than -0.01
        * 1.0 when normalBias is greater than 0.02
        * smoothly interpolated between 0.0 and 1.0 when normalBias is between -0.01 and 0.02.
        * clamp(..., 0.0, 1.0) ensures that the detailIndicator is always within the range [0.0, 1.0].

    */
    float detailIndicator = clamp(smoothstep(-0.01, 0.02, normalBias), 0.0, 1.0);

    // Pixel closest to the screen should detect the normal edge.
    float depthDiff = getDepth(x, y) - thisDepth;
    float outlineIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);
    
    float dotProduct = dot(thisNormal, neighborNormal);
    return (1.0 - dotProduct) * detailIndicator * outlineIndicator;
    // return distance(thisNormal, neighborNormal) * outlineIndicator * detailIndicator;
}

float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    // sample neighboring pixels to determine normals
    indicator += getNeighborDetail(0, 1, depth, normal);    // top
    indicator += getNeighborDetail(1, 0, depth, normal);    // right
    indicator += getNeighborDetail(0, -1, depth, normal);   // bot
    indicator += getNeighborDetail(-1, 0, depth, normal);   // left

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

        // outputColor = vec4(normal * strength, inputColor.a);
        // outputColor = vec4(_depth * strength, _depth * strength, _depth * strength, inputColor.a);
        outputColor = vec4(texel.rgb * strength, inputColor.a);
    #else
        outputColor = inputColor;
    #endif
}
