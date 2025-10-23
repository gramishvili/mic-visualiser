import { useEffect, useRef, useState } from 'react';
import { WebGLRenderer } from '../engine/WebGLRenderer';
import { WaveAnimation } from '../animations/WaveAnimation';
import { ParticleAnimation } from '../animations/ParticleAnimation';
import { FractalAnimation } from '../animations/FractalAnimation';
import { LissajousAnimation } from '../animations/LissajousAnimation';
import { MorphEngine } from '../morphing/MorphEngine';
import { AudioAnalyzer } from '../engine/AudioAnalyzer';

export default function ArtCanvas() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const morphEngineRef = useRef(null);
  const audioAnalyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isAudioActive, setIsAudioActive] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL renderer
    const renderer = new WebGLRenderer(canvas);
    rendererRef.current = renderer;

    // Initialize animations
    const animations = [
      new WaveAnimation(renderer),
      new ParticleAnimation(renderer),
      new FractalAnimation(renderer),
      new LissajousAnimation(renderer),
    ];

    // Initialize morph engine
    const morphEngine = new MorphEngine(animations);
    morphEngineRef.current = morphEngine;
    morphEngine.setActiveAnimation(0);

    // Initialize audio analyzer
    const audioAnalyzer = new AudioAnalyzer();
    audioAnalyzerRef.current = audioAnalyzer;

    // Performance tracking
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = 0;

    // Main render loop
    const render = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // FPS calculation
      frameCount++;
      fpsTime += deltaTime;
      if (fpsTime >= 1.0) {
        setFps(frameCount);
        frameCount = 0;
        fpsTime = 0;
      }

      // Get audio data if active
      let audioData = null;
      if (isAudioActive && audioAnalyzer.isActive()) {
        audioData = audioAnalyzer.getFrequencyData();
      }

      // Update and render
      renderer.clear();
      morphEngine.update(deltaTime, audioData);
      morphEngine.render(renderer);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Handle resize
    const handleResize = () => {
      renderer.resize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (audioAnalyzer.isActive()) {
        audioAnalyzer.stop();
      }
    };
  }, [isAudioActive]);

  const handleShuffle = () => {
    if (!morphEngineRef.current) return;
    const nextIndex = (currentAnimationIndex + 1) % morphEngineRef.current.animations.length;
    morphEngineRef.current.morphTo(nextIndex, 2.0); // 2 second transition
    setCurrentAnimationIndex(nextIndex);
  };

  const handleToggleAudio = async () => {
    if (!audioAnalyzerRef.current) return;

    if (isAudioActive) {
      audioAnalyzerRef.current.stop();
      setIsAudioActive(false);
    } else {
      const started = await audioAnalyzerRef.current.start();
      if (started) {
        setIsAudioActive(true);
      } else {
        alert('Microphone access denied or unavailable');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#000',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Control UI */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: 'monospace',
        color: '#fff',
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          FPS: {fps}
        </div>
        <button
          onClick={handleShuffle}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '5px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
          }}
        >
          Shuffle Animation
        </button>
        <button
          onClick={handleToggleAudio}
          style={{
            padding: '10px 20px',
            backgroundColor: isAudioActive
              ? 'rgba(255,100,100,0.2)'
              : 'rgba(100,255,100,0.2)',
            border: `1px solid ${isAudioActive ? 'rgba(255,100,100,0.5)' : 'rgba(100,255,100,0.5)'}`,
            borderRadius: '5px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
          }}
        >
          {isAudioActive ? '🎤 Audio ON' : '🎤 Audio OFF'}
        </button>
      </div>
    </div>
  );
}
