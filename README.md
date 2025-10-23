# AI-Generated Art: Audio Visualization & Geometric Patterns

An interactive web application that creates mesmerizing visual art by combining real-time audio visualization with dynamic geometric patterns. Built with React and Vite for smooth performance and beautiful animations.

## Features

### Audio Visualization
- **Real-time Audio Analysis**: Capture and analyze audio from microphone or system audio
- **Frequency Spectrum**: Visualize audio frequencies using FFT (Fast Fourier Transform)
- **Waveform Display**: Display audio waveforms in real-time
- **Reactive Animations**: Geometric patterns that respond dynamically to audio input

### Geometric Patterns
- **Procedural Generation**: AI-powered algorithms create unique geometric patterns
- **Dynamic Transformations**: Patterns morph and evolve based on audio characteristics
- **Multiple Visualizers**: Choose from various visualization styles:
  - Circular/radial patterns
  - Grid-based formations
  - Particle systems
  - Abstract shapes
  - Fractal designs

### Customization
- **Color Themes**: Multiple color palettes and gradients
- **Sensitivity Controls**: Adjust how patterns respond to audio
- **Pattern Parameters**: Customize complexity, size, and behavior
- **Export Options**: Save your favorite visualizations as images or videos

## Technology Stack

- **React**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Web Audio API**: Real-time audio processing and analysis
- **Canvas API / WebGL**: High-performance rendering
- **CSS3**: Modern styling and animations

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Usage

1. **Grant Microphone Access**: Allow the browser to access your microphone when prompted
2. **Play Audio**: Start playing music or speak into your microphone
3. **Watch the Magic**: See geometric patterns react and transform with the audio
4. **Customize**: Adjust settings to create your perfect visualization
5. **Capture**: Save screenshots or recordings of your favorite moments

## How It Works

The application uses the Web Audio API to analyze audio input in real-time:

1. **Audio Capture**: Microphone/system audio is captured via `getUserMedia()`
2. **Analysis**: Audio is processed through an `AnalyserNode` to extract frequency and time-domain data
3. **Pattern Generation**: Algorithms interpret audio data to drive geometric transformations
4. **Rendering**: Canvas or WebGL renders the animated patterns at 60 FPS

## Project Structure

```
ai-generated-art-code/
├── src/
│   ├── components/     # React components
│   ├── visualizers/    # Visualization algorithms
│   ├── utils/          # Audio processing utilities
│   ├── hooks/          # Custom React hooks
│   └── App.jsx         # Main application
├── public/             # Static assets
└── index.html          # Entry point
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (with limited Web Audio API support)

**Note**: Requires a browser that supports the Web Audio API and getUserMedia.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Inspiration

This project combines concepts from:
- Generative art and creative coding
- Music visualization and VJing
- Procedural geometry and mathematics
- AI-driven pattern generation

---

**Made with React + Vite** | Powered by the Web Audio API
