# Springy Thingy

A modern, web-based 2.5D platformer built with [Three.js](https://threejs.org/) and vanilla JavaScript. 

Loosely inspired by the 1980s computer game Thing on a Spring, but it's more of a standard platformer with a spring loaded jump mechanism.

Lots of work still to do, eg better graphics, adding sounds and music, more enemies and collectibles, and more (better)levels and block types. but it's playable.

Try it out at [https://springy.abn.cx](https://springy.abn.cx).

## Features

- **3D Physics & Movement**: Custom physics engine handling jumping, charging, and collision detection.
- **Dynamic Entities**: Moving enemies, rotating collectibles, and particle explosion effects.
- **Level Parsing**: Text-based level generation for quick and easy level design.
- **Autonomous Demo Mode**: An AI that plays the game automatically when idle.
- **Modular Architecture**: Clean separation of state, rendering, input, and game logic using ES6 Modules.
- **Vite Build System**: Extremely fast hot-reloading during development and optimized bundling for production.

## Project Structure

The codebase is organized into several key modules:

```
├── src/
│   ├── main.js           # Entry point and main game loop
│   ├── state.js          # Shared mutable game state
│   ├── constants.js      # Configuration constants and level maps
│   ├── graphics.js       # Three.js scene, camera, and particle setup
│   ├── level.js          # Logic for parsing and building levels
│   ├── player.js         # Player spawning and movement execution
│   ├── input.js          # Event listeners and Demo AI
│   ├── ui.js             # Highscores and DOM overlay manipulation
│   ├── cache.js          # Reusable geometries and materials to save memory
│   └── style.css         # UI styles and neon effects
├── index.html            # Main HTML wrapper
├── terraform/            # AWS Infrastructure as Code and deployment scripts
├── package.json          # Project metadata and scripts
└── vite.config.js        # Vite configuration (handles chunking for Three.js)
```

## Getting Started

### Prerequisites
You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/springy-thingy.git
   cd springy-thingy
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Development Server

To run the game locally with hot-reloading:

```bash
npm run dev
```

This will start a local web server (accessible via your network since it listens on `0.0.0.0`). Open the provided URL in your browser to play.

### Building for Production

To create an optimized, minified production build:

```bash
npm run build
```

This will generate a `dist/` directory containing your `index.html` and bundled `assets/`. You can upload the contents of the `dist/` directory directly to any static web hosting provider (e.g., GitHub Pages, Vercel, Netlify, or a traditional web server).

To preview the production build locally before deploying:

```bash
npm run preview
```

For fully automated deployment to AWS via Terraform and [Tiny Secrets Manager](https://github.com/abnabnabn/tiny-secrets-manager), see the [AWS Deployment Guide](AWS_DEPLOYMENT.md).

## Controls

- **Left / Right Arrow Keys**: Move the player
- **Spacebar**: Hold to compress your spring and charge your jump; release to jump. (You must be on the ground to charge).
- Touch controls are also supported via on-screen UI buttons for mobile play.

## Acknowledgments
- Built with [Three.js](https://threejs.org/)
- Bundled with [Vite](https://vitejs.dev/)
- Deployment secrets managed via [Tiny Secrets Manager](https://github.com/abnabnabn/tiny-secrets-manager)
