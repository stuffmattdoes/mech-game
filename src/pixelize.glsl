	// uniform vec2 resolution;
	// uniform vec2 texelSize;
	// uniform float cameraNear;
	// uniform float cameraFar;
	// uniform float aspect;
	// uniform float time;

	// uniform sampler2D inputBuffer;
	// uniform sampler2D depthBuffer;

	// varying vec2 vUv;

	// void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	// 	outputColor = vec4(inputColor.rgb, inputColor.a);
	// }

	precision mediump float;

	// varying vec2 position;

	void main() {
        gl_FragColor.r = position.x;
        gl_FragColor.g = 0.0;
        gl_FragColor.b = 0.0;
        gl_FragColor.a = 1.0;
	}