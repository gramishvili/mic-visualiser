export class BaseAnimation {
  constructor(renderer) {
    this.renderer = renderer;
    this.gl = renderer.gl;
    this.time = 0;
    this.params = {}; // Normalized parameters (0-1) for morphing
    this.initialized = false;
  }

  // Initialize shaders and buffers (must be implemented by subclasses)
  init() {
    throw new Error('init() must be implemented by subclass');
  }

  // Update animation state
  update(deltaTime, audioData = null) {
    this.time += deltaTime;

    // If audio data is available, map it to parameters
    if (audioData) {
      this.updateFromAudio(audioData);
    }
  }

  // Update parameters based on audio data (can be overridden)
  updateFromAudio(audioData) {
    // Default: map bass to intensity, mid to speed, treble to color shift
    this.params.intensity = audioData.bass;
    this.params.speed = 0.5 + audioData.mid * 0.5;
    this.params.colorShift = audioData.treble;
  }

  // Render the animation (must be implemented by subclasses)
  render() {
    if (!this.initialized) {
      this.init();
      this.initialized = true;
    }
    throw new Error('render() must be implemented by subclass');
  }

  // Get parameter value for morphing (normalized 0-1)
  getParam(name, defaultValue = 0.5) {
    return this.params[name] !== undefined ? this.params[name] : defaultValue;
  }

  // Set parameter value for morphing
  setParam(name, value) {
    this.params[name] = Math.max(0, Math.min(1, value)); // Clamp to 0-1
  }

  // Interpolate parameters with another animation for morphing
  lerpParams(other, t) {
    const allKeys = new Set([...Object.keys(this.params), ...Object.keys(other.params)]);

    allKeys.forEach(key => {
      const a = this.getParam(key);
      const b = other.getParam(key);
      this.setParam(key, a + (b - a) * t);
    });
  }

  // Dispose resources
  dispose() {
    // Override in subclasses to clean up resources
  }
}
