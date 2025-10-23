export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this.programs = new Map();
    this.buffers = new Map();
    this.uniformLocations = new Map();

    // Enable blending for glow effects
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // For additive blending (glow effects)
    this.additiveBlending = () => {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
    };

    this.normalBlending = () => {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    };

    this.width = 0;
    this.height = 0;
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${info}`);
    }

    return shader;
  }

  createProgram(vertexSource, fragmentSource, programName) {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(`Program linking error: ${info}`);
    }

    // Clean up shaders (they're now linked into the program)
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    this.programs.set(programName, program);
    return program;
  }

  getProgram(name) {
    return this.programs.get(name);
  }

  useProgram(program) {
    this.gl.useProgram(program);
  }

  createBuffer(data, target = this.gl.ARRAY_BUFFER, usage = this.gl.STATIC_DRAW) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(target, buffer);
    this.gl.bufferData(target, data, usage);
    return buffer;
  }

  setUniform(program, name, type, value) {
    const key = `${program}_${name}`;
    let location = this.uniformLocations.get(key);

    if (location === undefined) {
      location = this.gl.getUniformLocation(program, name);
      this.uniformLocations.set(key, location);
    }

    if (location === null) return; // Uniform not found or optimized out

    switch (type) {
      case '1f':
        this.gl.uniform1f(location, value);
        break;
      case '2f':
        this.gl.uniform2f(location, value[0], value[1]);
        break;
      case '3f':
        this.gl.uniform3f(location, value[0], value[1], value[2]);
        break;
      case '4f':
        this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
        break;
      case '1i':
        this.gl.uniform1i(location, value);
        break;
      case 'mat4':
        this.gl.uniformMatrix4fv(location, false, value);
        break;
    }
  }

  clear(r = 0.0, g = 0.0, b = 0.0, a = 1.0) {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  resize() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.width = displayWidth;
      this.height = displayHeight;
      this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  getAspectRatio() {
    return this.width / this.height;
  }

  dispose() {
    // Clean up programs
    this.programs.forEach(program => {
      this.gl.deleteProgram(program);
    });
    this.programs.clear();

    // Clean up buffers
    this.buffers.forEach(buffer => {
      this.gl.deleteBuffer(buffer);
    });
    this.buffers.clear();

    this.uniformLocations.clear();
  }

  // Helper to create a full-screen quad (common for many effects)
  createFullScreenQuad() {
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    return this.createBuffer(vertices);
  }
}
