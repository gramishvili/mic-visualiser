import { BaseAnimation } from './BaseAnimation';

const vertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position;
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

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Complex number multiplication
vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// Julia set
float julia(vec2 z, vec2 c, int maxIter) {
  float iter = 0.0;

  for (int i = 0; i < 100; i++) {
    if (i >= maxIter) break;

    z = complexMul(z, z) + c;

    if (length(z) > 2.0) {
      break;
    }

    iter += 1.0;
  }

  return iter;
}

// Mandelbrot set
float mandelbrot(vec2 c, int maxIter) {
  vec2 z = vec2(0.0);
  float iter = 0.0;

  for (int i = 0; i < 100; i++) {
    if (i >= maxIter) break;

    z = complexMul(z, z) + c;

    if (length(z) > 2.0) {
      break;
    }

    iter += 1.0;
  }

  return iter;
}

void main() {
  vec2 uv = v_uv;
  vec2 p = uv * 2.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed * 0.3;

  // Animate Julia set parameter
  vec2 c = vec2(
    cos(t * 0.5) * 0.7,
    sin(t * 0.3) * 0.7
  );

  // Zoom and rotate
  float zoom = 1.0 + sin(t * 0.2) * 0.3;
  float angle = t * 0.1;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  p = rot * p / zoom;

  // Mix Julia and Mandelbrot based on time
  float mixFactor = sin(t * 0.15) * 0.5 + 0.5;

  int maxIter = 80;
  float juliaValue = julia(p, c, maxIter);
  float mandelbrotValue = mandelbrot(p, maxIter);

  float fractalValue = mix(juliaValue, mandelbrotValue, mixFactor);

  // Smooth coloring
  float smoothValue = fractalValue / float(maxIter);
  smoothValue = sqrt(smoothValue); // More interesting distribution

  // Color mapping
  float hue = fract(smoothValue * 3.0 + u_colorShift + t * 0.05);
  float saturation = 0.7 + smoothValue * 0.3;
  float brightness = smoothValue * u_intensity;

  vec3 color = hsv2rgb(vec3(hue, saturation, brightness));

  // Add glow at boundaries
  float boundary = fract(fractalValue);
  float glow = smoothstep(0.9, 1.0, boundary) * 0.5;
  color += glow * hsv2rgb(vec3(hue + 0.1, 1.0, 1.0));

  // Inner glow
  if (fractalValue >= float(maxIter - 1)) {
    float innerDist = length(p);
    float innerGlow = 1.0 / (innerDist * 5.0 + 1.0);
    color += innerGlow * hsv2rgb(vec3(hue + 0.2, 0.8, 0.5)) * 0.3;
  }

  fragColor = vec4(color, 1.0);
}
`;

export class FractalAnimation extends BaseAnimation {
  constructor(renderer) {
    super(renderer);

    // Initialize default parameters
    this.params = {
      intensity: 0.9,
      speed: 1.0,
      colorShift: 0.0,
    };
  }

  init() {
    // Create shader program
    this.program = this.renderer.createProgram(vertexShader, fragmentShader, 'fractal');

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
    renderer.setUniform(this.program, 'u_intensity', '1f', this.getParam('intensity', 0.9));
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
