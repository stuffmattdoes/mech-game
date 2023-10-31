// built-in
// will throw error if you define here without also passing in custom uniform through app code
// uniform sampler2D inputBuffer;
// uniform sampler2D depthBuffer;
uniform vec4 resolution;

// Custom uniforms
uniform float detailStrength;
uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform float outlineStrength;

// Function to get depth value at offset from the current pixel
float getDepth(int x, int y) {
    return texture2D(tDepth, vUv + vec2(x, y) * (1.0 / resolution.xy)).r;
}

// Function to get normalized normal vector at offset from the current pixel
vec3 getNormal(int x, int y) {
    return normalize(texture2D(tNormal, vUv + vec2(x, y) * (1.0 / resolution.xy)).rgb * 2.0 - 1.0);
}

// Function to calculate the outline strength based on differences in neighboring pixel depths
float getOutline(float depth) {
    float diff = 0.0;

    // Sample pixel depths above and beside the current pixel
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);    // Top
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);    // Right
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);   // Bottom
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);   // Left

    return floor(smoothstep(0.01, 0.04, diff) * 2.0) / 2.0;
}

// TODO: no line on concave surface
// if dot product = 1.0, normals are parallel aligned
// if dot product > 0.0, normals are facing toward (concave)
// if dot product < 0.0, normals are facing apart (convex)
// if dot product = 0.0, normals are perpendicular
// if dot product = -1.0, normals are parallel aligned opposite

// Function to calculate the detail indicator based on differences in neighboring pixel normals & depths
float getNeighborDetail(int x, int y, float thisDepth, vec3 thisNormal) {
    // Get the normal of the neighboring pixel
    vec3 neighborNormal = getNormal(x, y);
    vec3 normalBiasRef = vec3(1.0, 1.0, 1.0);
    
    /*
        taking the difference between this normal & neighboring normal
        gives us a single vector to compare to our bias normal via dot product
        which tells us if this surface is a candidate for the outline pixel
    */ 
    float normalBias = dot(thisNormal - neighborNormal, normalBiasRef);

     /*        
        translate normalBias range of -0.1 to 0.2 into a more fragment-friendly value of 0.0 to 1.0
        this means detailIndicator will be:
        * 0.0 when normalBias is less than -0.01
        * 1.0 when normalBias is greater than 0.02
        * smoothly interpolated between 0.0 and 1.0 when normalBias is between -0.01 and 0.02.
    */
    float detailIndicator = smoothstep(-0.01, 0.02, normalBias);
    // clamp(..., 0.0, 1.0) ensures that the detailIndicator is always within the range [0.0, 1.0].
    // pretty sure this is redundant, since smoothstep does that already
    // float detailIndicator = clamp(smoothstep(-0.01, 0.02, normalBias);, 0.0, 1.0);

    // Calculate the difference in depth between the current pixel and the neighboring pixel
    float depthDiff = getDepth(x, y) - thisDepth;

    // Calculate an outline indicator based on the depth difference
    float outlineIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);

    // Combine the detail and outline indicators to get the final neighbor detail
    float dotProduct = dot(thisNormal, neighborNormal);
    return (1.0 - dotProduct) * detailIndicator * outlineIndicator;
}

// Function to calculate the overall detail indicator based on neighboring pixels
float getDetail(float depth, vec3 normal) {
    float indicator = 0.0;

    // Sample neighboring pixels to determine normals and calculate detail indicators
    indicator += getNeighborDetail(0, 1, depth, normal);    // Top
    indicator += getNeighborDetail(1, 0, depth, normal);    // Right
    indicator += getNeighborDetail(0, -1, depth, normal);   // Bottom
    indicator += getNeighborDetail(-1, 0, depth, normal);   // Left

    // Use a step function to threshold the overall detail indicator
    return step(0.1, indicator);
}

// Main rendering function
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    #ifdef ENABLED
        // Sample the diffuse texture at the current UV coordinates
        vec4 texel = texture2D(tDiffuse, vUv);

        // Get depth and normal at the center pixel
        float _depth = getDepth(0, 0);
        vec3 normal = getNormal(0, 0);

        // Calculate outline and detail strengths
        float outline = getOutline(_depth);
        float detail = getDetail(_depth, normal);

        // Combine outline and detail strengths to determine the overall rendering strength
        float strength = outline > 0.0
            ? (1.0 - outlineStrength * outline)
            : (1.0 + detailStrength * detail);

        // Apply the final color with the determined strength
        outputColor = vec4(texel.rgb * strength, inputColor.a);
    #else
        // If not enabled, output the input color as is
        outputColor = inputColor;
    #endif
}