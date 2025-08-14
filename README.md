# play.ts

[![npm version](https://badge.fury.io/js/play.ts.svg)](https://badge.fury.io/js/play.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript library for **creative coding** and **interactive applications**. Built with modern TypeScript and optimized for performance, `play.ts` provides a rich set of utilities for mathematics, colors, animations, random generation, and geometric operations.

## ✨ Features

- 🧮 **Advanced Math**: Vector operations, interpolation, trigonometry
- 🎨 **Color Manipulation**: RGB/HSL conversion, color harmony, CSS utilities
- 🎬 **Animation System**: Easing functions, tweens, springs, frame loops
- 🎲 **Random & Noise**: Seeded randomness, Perlin noise, distributions
- 📐 **Geometry**: Shapes, collision detection, spatial operations
- 🚀 **Performance**: Tree-shakeable, optimized for modern browsers
- 📦 **TypeScript First**: Full type safety and IntelliSense support
- 🌐 **Multi-Platform**: Works in browsers, Node.js, Bun, and Deno

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install play.ts

# Using bun
bun add play.ts

# Using yarn
yarn add play.ts
```

### Basic Usage

```typescript
import { play, setup, vec2, randomColor, easeInOutQuad } from 'play.ts';

// Setup canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
setup(canvas);

// Start animation loop
play.start(({ time, deltaTime }) => {
  // Clear with random background
  play.background(randomColor());
  
  // Draw animated circle
  const pos = vec2(
    Math.sin(time * 0.001) * 100 + canvas.width / 2,
    canvas.height / 2
  );
  
  play.fill('#ffffff');
  play.drawCircle(pos.x, pos.y, 20 + easeInOutQuad(Math.sin(time * 0.002)) * 10);
});

play.play();
```

## 📚 API Overview

### 🧮 Math Module

```typescript
import { vec2, vec3, lerp, clamp, map, degrees, radians } from 'play.ts/math';

// 2D Vectors
const pos = vec2(10, 20);
const velocity = vec2(1, -1);
const newPos = vec2Add(pos, velocity);

// 3D Vectors
const point3d = vec3(1, 2, 3);
const normalized = vec3Normalize(point3d);

// Utilities
const interpolated = lerp(0, 100, 0.5); // 50
const clamped = clamp(150, 0, 100); // 100
const mapped = map(0.5, 0, 1, 0, 360); // 180
```

### 🎨 Color Module

```typescript
import { rgb, hsl, colorLerp, complementary, randomColor } from 'play.ts/color';

// Color creation
const red = rgb(255, 0, 0);
const blue = hsl(240, 100, 50);

// Color manipulation
const purple = colorLerp(red, blue, 0.5);
const complement = complementary(red);
const random = randomColor();

// CSS output
const cssString = toCssRgb(red); // "rgb(255, 0, 0)"
```

### 🎬 Animation Module

```typescript
import { tween, spring, AnimationLoop, easeInOutBounce } from 'play.ts/animation';

// Tweening
const myTween = tween({
  from: 0,
  to: 100,
  duration: 1000,
  easing: easeInOutBounce,
  onUpdate: (value) => console.log(value)
});

// Springs
const mySpring = spring({
  from: 0,
  to: 100,
  stiffness: 0.1,
  damping: 0.8
});

// Animation loop
const loop = new AnimationLoop();
loop.onFrame(({ time, deltaTime }) => {
  // Your animation code
});
loop.start();
```

### 🎲 Random Module

```typescript
import { random, randomInt, noise, setSeed, randomChoice } from 'play.ts/random';

// Basic random
const value = random(); // 0-1
const integer = randomInt(1, 10); // 1-10
const choice = randomChoice(['a', 'b', 'c']);

// Seeded random
setSeed(12345);
const seededValue = random(); // Reproducible

// Noise
const noiseValue = noise(x * 0.01, y * 0.01, time * 0.001);
```

### 📐 Geometry Module

```typescript
import { circle, rect, polygon, pointInCircle, lineIntersection } from 'play.ts/geometry';

// Shapes
const myCircle = circle(50, 50, 25);
const myRect = rect(0, 0, 100, 100);
const triangle = polygon([
  { x: 0, y: 0 },
  { x: 50, y: 100 },
  { x: 100, y: 0 }
]);

// Collision detection
const isInside = pointInCircle({ x: 60, y: 60 }, myCircle);
const intersection = lineIntersection(line1, line2);
```

## 🎯 Examples

### Animated Spirals

```typescript
import { play, setup, vec2FromAngle, hsl, TAU } from 'play.ts';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
setup(canvas);

play.start(({ time }) => {
  play.background('#000');
  
  const center = vec2(canvas.width / 2, canvas.height / 2);
  const spirals = 5;
  const points = 100;
  
  for (let s = 0; s < spirals; s++) {
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * TAU * 3 + time * 0.001 + (s * TAU / spirals);
      const radius = (i / points) * 150;
      const pos = vec2FromAngle(angle, radius);
      
      play.fill(toCssHsl(hsl((angle + time * 0.1) % 360, 70, 60)));
      play.drawCircle(center.x + pos.x, center.y + pos.y, 3);
    }
  }
});

play.play();
```

### Particle System

```typescript
import { play, setup, vec2, randomInCircle, colorLerp, rgb } from 'play.ts';

class Particle {
  constructor(
    public pos = randomInCircle(vec2(400, 300), 200),
    public vel = vec2(random(-2, 2), random(-2, 2)),
    public life = 1.0
  ) {}
  
  update(deltaTime: number) {
    this.pos = vec2Add(this.pos, vec2Mul(this.vel, deltaTime));
    this.life -= deltaTime * 0.001;
  }
  
  draw() {
    const color = colorLerp(rgb(255, 100, 100), rgb(100, 100, 255), 1 - this.life);
    play.fill(toCssRgba({ ...color, a: this.life }));
    play.drawCircle(this.pos.x, this.pos.y, 5 * this.life);
  }
}
```

## 🛠️ Development

### Requirements

- Node.js 18+
- TypeScript 5.0+
- Bun (recommended) or npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd play.ts

# Install dependencies
bun install

# Start development
bun run dev

# Run tests
bun test

# Build library
bun run build
```

### Nix Development Environment

This project supports Nix for reproducible development environments:

```bash
# Enter development shell
nix develop

# Available commands
dev      # Start development server
build    # Build the library
test     # Run tests
examples # Run example programs
```

## 📖 Documentation

### Module Structure

- **`/math`** - Mathematical utilities and vector operations
- **`/color`** - Color manipulation and conversion functions
- **`/animation`** - Easing functions and animation utilities
- **`/random`** - Random number generation and noise functions
- **`/geometry`** - Geometric shapes and spatial operations

### Live Examples

The repository includes a comprehensive examples application with interactive demonstrations of all library features. To explore the examples:

```bash
# Start the examples application
cd _examples
bun run dev
# Then visit http://localhost:3000
```

Features include:
- **Interactive Examples**: Real-time demonstrations of all library capabilities
- **Professional Search**: Command-K search interface for quick navigation  
- **Responsive Design**: Mobile-friendly interface with professional UI components
- **Code Examples**: Full source code for every demonstration

## 🤝 Contributing

We welcome contributions! To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by creative coding communities and Processing
- Built with modern TypeScript and web standards
- Optimized for performance and developer experience

---

**Happy Creative Coding! 🎨✨**
