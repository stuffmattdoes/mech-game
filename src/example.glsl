uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec4 resolution;
uniform float detailStrength;
uniform float outlineStrength;
varying vec2 vUv;

float getDepth(int x, int y) {
    return texture2D( tDepth, vUv + vec2(x, y) * resolution.zw ).r;
}

vec3 getNormal(int x, int y) {
    return texture2D( tNormal, vUv + vec2(x, y) * resolution.zw ).rgb * 2.0 - 1.0;
}

float getOutline(float depth) {
    float diff = 0.0;
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
    return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
}

float getNeighborDetail(int x, int y, float depth, vec3 normal) {
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

float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    indicator += getNeighborDetail(0, -1, depth, normal);
    indicator += getNeighborDetail(0, 1, depth, normal);
    indicator += getNeighborDetail(-1, 0, depth, normal);
    indicator += getNeighborDetail(1, 0, depth, normal);

    return step(0.1, indicator);
}

void main() {
    vec4 texel = texture2D( tDiffuse, vUv );
    float depth = 0.0;
    vec3 normal = vec3(0.0);

    if (outlineStrength > 0.0 || detailStrength > 0.0) {
        depth = getDepth(0, 0);
        normal = getNormal(0, 0);
    }

    float outline = 0.0;
    if (outlineStrength > 0.0) 
        outline = getOutline(depth);

    float detail = 0.0; 
    if (detailStrength > 0.0) 
        detail = getDetail(depth, normal);

    float strength = outline > 0.0
        ? (1.0 - outlineStrength * outline)
        : (1.0 + detailStrength * detail);

    gl_FragColor = texel * strength;
}