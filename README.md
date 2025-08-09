# Portfolio 3D

A Three.js-powered 3D portfolio application built with React, TypeScript, and Vite.

## Features

- **Immersive 3D Environment**: Dark space environment with ambient lighting
- **6DOF Camera Controls**: WASD keyboard, mouse look, and touch controls
- **Performance Monitoring**: Automatic quality adjustment based on FPS
- **Cross-Platform**: Desktop and mobile support
- **Type-Safe**: Built with TypeScript for robust development

## Tech Stack

- **Frontend**: React 18, TypeScript
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **State Management**: Zustand with Immer
- **Build Tool**: Vite
- **Testing**: Vitest, Playwright, Testing Library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit and integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code

## Controls

### Desktop
- **WASD** - Move forward/backward/left/right
- **Mouse** - Look around (click and drag)
- **Space** - Move up
- **Shift** - Move down
- **Arrow Keys** - Alternative movement

### Mobile
- **Touch and Drag** - Look around
- **Touch Controls** - Basic navigation

## Performance Features

- **Automatic Quality Adjustment**: Adjusts rendering quality based on FPS
- **Performance Modes**: High (60fps), Medium (45fps), Low (30fps)
- **WebGL Detection**: Graceful fallback for unsupported browsers
- **Memory Monitoring**: Tracks memory usage where available

## Browser Support

- Chrome 56+
- Firefox 51+
- Safari 15+
- WebGL 2.0 recommended, WebGL 1.0 supported

## Project Structure

```
src/
├── components/3d/Scene/     # 3D scene components
├── services/               # Performance and utility services
├── store/                 # Zustand state management
├── hooks/                 # Custom React hooks
└── test/                  # Test setup and utilities

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

## License

MIT License - see LICENSE file for details