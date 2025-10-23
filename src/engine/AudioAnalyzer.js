export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.active = false;
  }

  async start() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();

      // Configure analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.active = true;
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }

  stop() {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.active = false;
  }

  isActive() {
    return this.active;
  }

  getFrequencyData() {
    if (!this.active || !this.analyser) {
      return { bass: 0, mid: 0, treble: 0, volume: 0, spectrum: [] };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Split frequency spectrum into ranges
    const bass = this.getAverageFrequency(0, 100); // 0-100 bins (low freq)
    const mid = this.getAverageFrequency(100, 500); // 100-500 bins (mid freq)
    const treble = this.getAverageFrequency(500, this.bufferLength); // 500+ bins (high freq)

    // Overall volume
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    const volume = sum / this.bufferLength / 255;

    // Return normalized spectrum for visualization
    const spectrumSamples = 64;
    const spectrum = [];
    const step = Math.floor(this.bufferLength / spectrumSamples);

    for (let i = 0; i < spectrumSamples; i++) {
      spectrum.push(this.dataArray[i * step] / 255);
    }

    return {
      bass,
      mid,
      treble,
      volume,
      spectrum,
      raw: this.dataArray,
    };
  }

  getAverageFrequency(startBin, endBin) {
    let sum = 0;
    const count = endBin - startBin;

    for (let i = startBin; i < endBin && i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }

    return sum / count / 255; // Normalize to 0-1
  }

  // Get dominant frequency for pitch detection
  getDominantFrequency() {
    if (!this.active) return 0;

    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }

    // Convert bin to frequency
    const nyquist = this.audioContext.sampleRate / 2;
    return (maxIndex * nyquist) / this.bufferLength;
  }
}
