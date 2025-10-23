import { BaseAnimation } from './BaseAnimation';

const vertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform float u_speed;
uniform float u_colorShift;

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Smooth glow function
float glow(float dist, float radius, float intensity) {
  return pow(radius / dist, intensity);
}

void main() {
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Multiple wave layers
  float wave1 = sin(p.x * 3.0 + t) * cos(p.y * 2.0 + t * 0.5);
  float wave2 = sin(p.x * 5.0 - t * 1.5) * cos(p.y * 3.0 - t);
  float wave3 = sin(p.x * 2.0 + p.y * 2.0 + t * 0.7);

  // Combine waves
  float waves = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
  waves *= u_intensity * 2.0;

  // Distance field for glow
  float dist = length(vec2(p.x, p.y + waves * 0.3));

  // Create colorful interference patterns
  float pattern = sin(dist * 10.0 - t * 2.0) * 0.5 + 0.5;

  // Color based on position and time
  float hue = fract(waves * 0.5 + dist * 0.3 + t * 0.1 + u_colorShift);
  float saturation = 0.8 + pattern * 0.2;
  float brightness = pattern * u_intensity;

  vec3 color = hsv2rgb(vec3(hue, saturation, brightness));

  // Add glow effect
  float glowAmount = glow(abs(waves) + 0.1, 0.5, 2.0) * 0.3;
  color += glowAmount * hsv2rgb(vec3(hue + 0.1, 0.9, 1.0));

  // Additional radial glow
  float radialGlow = glow(dist, 0.8, 1.5) * 0.2 * u_intensity;
  color += radialGlow * hsv2rgb(vec3(hue + 0.2, 1.0, 1.0));

  // Vignette for depth
  float vignette = 1.0 - length(p) * 0.3;
  color *= vignette;

  fragColor = vec4(color, 1.0);
}
`;

export class WaveAnimation extends BaseAnimation {
  constructor(renderer) {
    super(renderer);

    // Initialize default parameters
    this.params = {
      intensity: 0.7,
      speed: 1.0,
      colorShift: 0.0,
    };
  }

  init() {
    // Create shader program
    this.program = this.renderer.createProgram(vertexShader, fragmentShader, 'wave');

    // Create full-screen quad
    this.quadBuffer = this.renderer.createFullScreenQuad();

    // Get attribute location
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
  }

  render() {
    if (!this.initialized) {
      this.init();
      this.initialized = true;
    }

    const { gl, renderer } = this;

    renderer.useProgram(this.program);

    // Set uniforms
    renderer.setUniform(this.program, 'u_time', '1f', this.time);
    renderer.setUniform(this.program, 'u_resolution', '2f', [renderer.width, renderer.height]);
    renderer.setUniform(this.program, 'u_intensity', '1f', this.getParam('intensity', 0.7));
    renderer.setUniform(this.program, 'u_speed', '1f', this.getParam('speed', 1.0));
    renderer.setUniform(this.program, 'u_colorShift', '1f', this.getParam('colorShift', 0.0));

    // Bind and draw quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
    }
  }
}
