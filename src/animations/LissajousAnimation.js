import { BaseAnimation } from './BaseAnimation';

const vertexShader = `#version 300 es
in float a_index;

uniform float u_time;
uniform float u_intensity;
uniform float u_speed;
uniform vec2 u_resolution;
uniform float u_colorShift;

out vec4 v_color;
out float v_glow;

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float t = u_time * u_speed;
  float index = a_index;

  // Multiple Lissajous curves with different frequencies
  float numPoints = 1000.0;
  float param = index / numPoints;

  // Animated frequency ratios
  float freqA = 3.0 + sin(t * 0.2) * 2.0;
  float freqB = 2.0 + cos(t * 0.15) * 2.0;
  float phaseShift = sin(t * 0.3) * 3.14159;

  // Lissajous curve equations
  float angle = param * 6.28318 * 4.0;
  float x = sin(angle * freqA + t) * 0.6;
  float y = sin(angle * freqB + phaseShift + t * 0.7) * 0.6;

  // Add secondary curve for complexity
  float freqC = 5.0 + sin(t * 0.25) * 1.0;
  float freqD = 4.0 + cos(t * 0.2) * 1.0;
  x += sin(angle * freqC - t * 0.5) * 0.2;
  y += cos(angle * freqD - t * 0.3) * 0.2;

  // Aspect ratio correction
  vec2 aspectCorrect = vec2(u_resolution.y / u_resolution.x, 1.0);
  vec2 pos = vec2(x, y) * aspectCorrect;

  gl_Position = vec4(pos, 0.0, 1.0);

  // Animated point size
  float pulseFreq = 10.0;
  float pulse = sin(angle * pulseFreq + t * 2.0) * 0.5 + 0.5;
  gl_PointSize = 2.0 + pulse * 3.0 * u_intensity;

  // Color based on position along curve
  float hue = fract(param + t * 0.1 + u_colorShift);
  float saturation = 0.8 + pulse * 0.2;
  float brightness = 0.6 + pulse * 0.4;

  v_color = vec4(hsv2rgb(vec3(hue, saturation, brightness)), 0.7);
  v_glow = pulse * u_intensity;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
in float v_glow;
out vec4 fragColor;

void main() {
  // Circular point with soft edges
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  if (dist > 0.5) {
    discard;
  }

  // Soft glow
  float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
  float glow = pow(1.0 - dist * 2.0, 2.0) * v_glow;

  vec3 color = v_color.rgb + glow * 0.5;

  fragColor = vec4(color, alpha * v_color.a);
}
`;

// Line rendering version for connected curves
const lineVertexShader = `#version 300 es
in float a_index;

uniform float u_time;
uniform float u_intensity;
uniform float u_speed;
uniform vec2 u_resolution;
uniform float u_colorShift;

out vec4 v_color;

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float t = u_time * u_speed;
  float index = a_index;

  float numPoints = 1000.0;
  float param = index / numPoints;

  // Lissajous with evolving parameters
  float freqA = 3.0 + sin(t * 0.2) * 2.0;
  float freqB = 2.0 + cos(t * 0.15) * 2.0;
  float phaseShift = sin(t * 0.3) * 3.14159;

  float angle = param * 6.28318 * 4.0;
  float x = sin(angle * freqA + t) * 0.6;
  float y = sin(angle * freqB + phaseShift + t * 0.7) * 0.6;

  // Secondary modulation
  float freqC = 5.0 + sin(t * 0.25) * 1.0;
  float freqD = 4.0 + cos(t * 0.2) * 1.0;
  x += sin(angle * freqC - t * 0.5) * 0.2;
  y += cos(angle * freqD - t * 0.3) * 0.2;

  vec2 aspectCorrect = vec2(u_resolution.y / u_resolution.x, 1.0);
  vec2 pos = vec2(x, y) * aspectCorrect;

  gl_Position = vec4(pos, 0.0, 1.0);

  // Color
  float hue = fract(param + t * 0.1 + u_colorShift);
  float brightness = 0.5 + u_intensity * 0.5;

  v_color = vec4(hsv2rgb(vec3(hue, 0.9, brightness)), 0.5);
}
`;

const lineFragmentShader = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;

export class LissajousAnimation extends BaseAnimation {
  constructor(renderer) {
    super(renderer);

    this.numPoints = 1000;

    // Initialize default parameters
    this.params = {
      intensity: 0.8,
      speed: 1.0,
      colorShift: 0.0,
    };
  }

  init() {
    // Create both point and line programs
    this.pointProgram = this.renderer.createProgram(vertexShader, fragmentShader, 'lissajous_point');
    this.lineProgram = this.renderer.createProgram(lineVertexShader, lineFragmentShader, 'lissajous_line');

    // Generate indices for points
    const indices = new Float32Array(this.numPoints);
    for (let i = 0; i < this.numPoints; i++) {
      indices[i] = i;
    }

    this.indexBuffer = this.renderer.createBuffer(indices);

    // Get attribute locations
    this.pointIndexLocation = this.gl.getAttribLocation(this.pointProgram, 'a_index');
    this.lineIndexLocation = this.gl.getAttribLocation(this.lineProgram, 'a_index');
  }

  render() {
    if (!this.initialized) {
      this.init();
      this.initialized = true;
    }

    const { gl, renderer } = this;

    // Draw lines first (background)
    renderer.useProgram(this.lineProgram);
    renderer.setUniform(this.lineProgram, 'u_time', '1f', this.time);
    renderer.setUniform(this.lineProgram, 'u_resolution', '2f', [renderer.width, renderer.height]);
    renderer.setUniform(this.lineProgram, 'u_intensity', '1f', this.getParam('intensity', 0.8));
    renderer.setUniform(this.lineProgram, 'u_speed', '1f', this.getParam('speed', 1.0));
    renderer.setUniform(this.lineProgram, 'u_colorShift', '1f', this.getParam('colorShift', 0.0));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.enableVertexAttribArray(this.lineIndexLocation);
    gl.vertexAttribPointer(this.lineIndexLocation, 1, gl.FLOAT, false, 0, 0);

    gl.lineWidth(1.0);
    gl.drawArrays(gl.LINE_STRIP, 0, this.numPoints);

    // Draw points with glow (foreground)
    renderer.useProgram(this.pointProgram);
    renderer.setUniform(this.pointProgram, 'u_time', '1f', this.time);
    renderer.setUniform(this.pointProgram, 'u_resolution', '2f', [renderer.width, renderer.height]);
    renderer.setUniform(this.pointProgram, 'u_intensity', '1f', this.getParam('intensity', 0.8));
    renderer.setUniform(this.pointProgram, 'u_speed', '1f', this.getParam('speed', 1.0));
    renderer.setUniform(this.pointProgram, 'u_colorShift', '1f', this.getParam('colorShift', 0.0));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.enableVertexAttribArray(this.pointIndexLocation);
    gl.vertexAttribPointer(this.pointIndexLocation, 1, gl.FLOAT, false, 0, 0);

    // Additive blending for glow
    renderer.additiveBlending();
    gl.drawArrays(gl.POINTS, 0, this.numPoints);
    renderer.normalBlending();
  }

  dispose() {
    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
    }
  }
}
