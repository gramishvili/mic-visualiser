export class MorphEngine {
  constructor(animations) {
    this.animations = animations;
    this.currentIndex = 0;
    this.targetIndex = 0;
    this.morphProgress = 0;
    this.morphDuration = 0;
    this.isMorphing = false;
  }

  setActiveAnimation(index) {
    this.currentIndex = index;
    this.targetIndex = index;
    this.morphProgress = 0;
    this.isMorphing = false;
  }

  morphTo(targetIndex, duration = 2.0) {
    if (targetIndex === this.currentIndex) return;

    this.targetIndex = targetIndex;
    this.morphDuration = duration;
    this.morphProgress = 0;
    this.isMorphing = true;
  }

  update(deltaTime, audioData = null) {
    if (this.isMorphing) {
      this.morphProgress += deltaTime / this.morphDuration;

      if (this.morphProgress >= 1.0) {
        this.morphProgress = 1.0;
        this.currentIndex = this.targetIndex;
        this.isMorphing = false;
      }
    }

    // Update all animations (they might need time updates)
    this.animations.forEach((anim, index) => {
      // Only update active animations to save performance
      if (index === this.currentIndex || (this.isMorphing && index === this.targetIndex)) {
        anim.update(deltaTime, audioData);
      }
    });
  }

  render(renderer) {
    if (!this.isMorphing) {
      // Just render current animation
      this.animations[this.currentIndex].render();
    } else {
      // Blend between current and target
      const t = this.easeInOutCubic(this.morphProgress);
      const current = this.animations[this.currentIndex];
      const target = this.animations[this.targetIndex];

      // Render current with decreasing opacity
      renderer.gl.enable(renderer.gl.BLEND);
      renderer.gl.blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);

      // You can implement opacity control in shaders or render both and blend
      // For now, we'll render both with a crossfade approach
      current.render();

      // Set blend mode for overlay
      renderer.additiveBlending();
      target.render();
      renderer.normalBlending();
    }
  }

  // Easing function for smooth morphing
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}
