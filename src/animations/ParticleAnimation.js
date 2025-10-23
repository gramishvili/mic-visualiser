import { BaseAnimation } from './BaseAnimation';

const vertexShader = `#version 300 es
in vec2 a_position;
in float a_index;

uniform float u_time;
uniform float u_intensity;
uniform float u_speed;
uniform vec2 u_resolution;

out vec4 v_color;
out float v_glow;

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float t = u_time * u_speed;
  float index = a_index;

  // Each particle has unique phase offset
  float phase = index * 0.1;

  // Orbital motion with Lissajous-like curves
  float angle = t * 0.5 + phase * 6.28318;
  float radius = 0.3 + sin(t * 0.3 + phase) * 0.2;

  float x = cos(angle * 3.0 + sin(t + phase)) * radius;
  float y = sin(angle * 2.0 + cos(t * 0.7 + phase)) * radius;

  // Add spiral motion
  float spiralAngle = t + index * 0.5;
  float spiralRadius = 0.1 + sin(t * 0.5 + index) * 0.05;
  x += cos(spiralAngle) * spiralRadius;
  y += sin(spiralAngle) * spiralRadius;

  // Pulsating effect
  float pulse = (sin(t * 2.0 + phase * 3.0) * 0.5 + 0.5) * u_intensity;

  vec2 aspectCorrect = vec2(u_resolution.y / u_resolution.x, 1.0);
  vec2 pos = vec2(x, y) * aspectCorrect;

  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = 2.0 + pulse * 4.0;

  // Color based on position and time
  float hue = fract(index * 0.1 + t * 0.1);
  float saturation = 0.8 + pulse * 0.2;
  float brightness = 0.5 + pulse * 0.5;

  v_color = vec4(hsv2rgb(vec3(hue, saturation, brightness)), 0.8);
  v_glow = pulse;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
in float v_glow;
out vec4 fragColor;

void main() {
  // Circular point shape
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  if (dist > 0.5) {
    discard;
  }

  // Soft edges with glow
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
  float glow = 1.0 / (dist * 10.0 + 1.0);

  vec3 color = v_color.rgb + glow * v_glow * 0.5;

  fragColor = vec4(color, alpha * v_color.a);
}
`;

export class ParticleAnimation extends BaseAnimation {
  constructor(renderer) {
    super(renderer);

    this.particleCount = 2000; // High count for rich visuals

    // Initialize default parameters
    this.params = {
      intensity: 0.8,
      speed: 1.0,
      colorShift: 0.0,
    };
  }

  init() {
    // Create shader program
    this.program = this.renderer.createProgram(vertexShader, fragmentShader, 'particle');

    // Generate particle data
    const positions = [];
    const indices = [];

    for (let i = 0; i < this.particleCount; i++) {
      // Position (will be animated in shader)
      positions.push(0, 0);
      indices.push(i);
    }

    // Create buffers
    this.positionBuffer = this.renderer.createBuffer(new Float32Array(positions));
    this.indexBuffer = this.renderer.createBuffer(new Float32Array(indices));

    // Get attribute locations
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.indexLocation = this.gl.getAttribLocation(this.program, 'a_index');
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
    renderer.setUniform(this.program, 'u_intensity', '1f', this.getParam('intensity', 0.8));
    renderer.setUniform(this.program, 'u_speed', '1f', this.getParam('speed', 1.0));

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Bind index buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.enableVertexAttribArray(this.indexLocation);
    gl.vertexAttribPointer(this.indexLocation, 1, gl.FLOAT, false, 0, 0);

    // Use additive blending for glow
    renderer.additiveBlending();

    // Draw particles
    gl.drawArrays(gl.POINTS, 0, this.particleCount);

    // Restore normal blending
    renderer.normalBlending();
  }

  dispose() {
    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
    }
    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
    }
  }
}
