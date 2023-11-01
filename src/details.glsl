// built-in
// will throw error if you define here without also passing in custom uniform through app code
uniform vec2 resolution;
// uniform vec2 texelSize;
// uniform float cameraNear;
// uniform float cameraFar;
// uniform float aspect;
// uniform float time;
// uniform sampler2D inputBuffer;
// uniform sampler2D depthBuffer;

// Custom uniforms
uniform float detailStrength;
uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform float outlineStrength;

// vec3 getNormal(vec2 coords) {
//     return normalize(texture2D(tNormal, coords).rgb);
// }

vec3 getNormal(vec2 coords) {
    return texture2D(tNormal, vUv + coords * (1.0 / resolution.xy)).rgb;
    // return texture2D(tNormal, vUv + coords * (1.0 / resolution.xy)).rgb * 2.0 - 1.0;

    // return normalize(texture2D(tNormal, vUv + coords * (1.0 / resolution.xy)).rgb);
    // return normalize(texture2D(tNormal, vUv + coords * (1.0 / resolution.xy)).rgb * 2.0 - 1.0);
}

// returns either 0.0 or 1.0;
vec3 getNeighborDetail(vec2 coords, vec3 thisNormal) {
    vec3 detail = vec3(0.0, 0.0, 0.0);
    vec3 neighborNormal = getNormal(coords);
    vec3 normalBiasRef = vec3(1.0, 1.0, 1.0);
    float normalBias = dot(thisNormal - neighborNormal, normalBiasRef);
    float detailCandidate = smoothstep(-0.01, 0.02, normalBias);
    
    if (detailCandidate >= 1.0) {
        return vec3(1.0, 0.0, 0.0);
    } else {
        return vec3(0.5, 0.5, 0.5);
    }

    /*
        we want to determine if the two normals are concave or convex
        if convex, outline
        if concave, SKIP!
    */

    // float dotProduct = dot(thisNormal, neighborNormal);
    vec3 crossProduct = cross(thisNormal, neighborNormal);
    float signCheck = dot(crossProduct, cross(vec3(0.0, 0.0, -1.0), thisNormal));

    if (signCheck > 0.9) {
        detail = vec3(1.0, 0.0, 0.0); // Red
    } else if (signCheck > 0.0) {
        detail = vec3(0.0, 1.0, 0.0); // Green
    } else if (signCheck < 0.0) {
        detail = vec3(0.0, 0.0, 1.0); // Blue
    } else if (signCheck < -0.9) {
        detail = vec3(1.0, 0.0, 1.0); // Purple
    } else {
        detail = vec3(0.5, 0.5, 0.5); // Gray
    }

    // detail *= detailCandidate;
    return detail;
}

vec3 getDetail(vec3 thisNormal) {
    vec3 detail = vec3(0.0, 0.0, 0.0);
    detail += getNeighborDetail(vec2(0, 1), thisNormal).rgb;    // top
    // detail += getNeighborDetail(vec2(1, 0), thisNormal).rgb;    // right
    // detail += getNeighborDetail(vec2(0, -1), thisNormal).rgb;    // bot
    // detail += getNeighborDetail(vec2(-1, 0), thisNormal).rgb;    // left
    // detail /= 4.0;
    return detail;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    #ifdef ENABLED
        // vec3 normal = getNormal(uv);
        // vec4 texel = texture2D(tDiffuse, uv);
        // vec3 detail = getDetail(normal);

    vec2 texelSize = 1.0 / vec2(textureSize(tNormal, 1));
    vec3 normal = texture2D(normalMap, vUv).xyz;
    vec3 dx = texture2D(tNormal, vUv + vec2(texelSize.x, 0.0)).xyz - normal;
    vec3 dy = texture2D(tNormal, vUv + vec2(0.0, texelSize.y)).xyz - normal;

    // Adjust the sensitivity to edges by changing the threshold value
    float threshold = 0.1;

    // Calculate the length of the gradient to detect edges
    float gradient = length(vec2(length(dx), length(dy)));

    // Output black for non-edges, white for edges
        outputColor.rgb = vec4(vec3(step(threshold, gradient)), 1.0);

        // outputColor.rgb = detail * detailStrength;
        // outputColor.rgb = normal;
        outputColor.a = texel.a;
    #else
        // If not enabled, output the input color as is
        outputColor = inputColor;
    #endif
}