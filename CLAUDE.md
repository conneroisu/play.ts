# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**play.ts** is a comprehensive TypeScript library for creative coding and interactive graphics applications. It provides professional-grade utilities for mathematics, color manipulation, animations, physics simulation, and procedural generation optimized for 60fps real-time applications.

## Core Architecture

The library follows a modular architecture with 7 main modules:

- `src/math.ts` - Vector operations, interpolation, trigonometry, matrix transformations
- `src/color.ts` - RGB/HSL color spaces, color harmony, CSS utilities  
- `src/geometry.ts` - 2D shapes, collision detection, spatial operations
- `src/animation.ts` - Easing functions, tweens, springs, animation loops
- `src/random.ts` - Seeded randomness, Perlin noise, distributions
- `src/physics.ts` - Particle systems, forces, constraints, Verlet integration
- `src/fractals.ts` - L-Systems, procedural patterns, fractal generation
- `types/index.ts` - TypeScript type definitions for all interfaces

### Key Design Principles

1. **Performance First**: All functions optimized for 60fps real-time applications
2. **Type Safety**: Comprehensive TypeScript definitions with readonly interfaces
3. **Modular Imports**: Tree-shakeable with specific function imports
4. **Immutable Data**: All vector and color operations return new objects
5. **Browser/Node Compatibility**: Works across all JavaScript environments

## Build System & Commands

### Primary Commands (Bun-based)
```bash
# Development 
bun run dev                    # Start _examples development server on :3000
bun run build                  # Build library with types to dist/
bun test                       # Run comprehensive test suite
bun run type-check             # TypeScript type checking

# Quality Assurance
bun run lint                   # Type checking (alias for type-check)  
bun run format                 # Format code with Prettier
bun run format:check           # Check formatting without changes

# Building & Publishing
bun run build:all              # Build all formats (ESM, CJS, browser, modules)
bun run build:esm              # ESM build only
bun run build:cjs              # CommonJS build only  
bun run build:browser          # Browser build only
bun run build:modules          # Individual module builds
bun run clean                  # Clean build artifacts
bun run prepublishOnly         # Complete build + test for publishing
```

### Alternative Commands (Just/Nix)
```bash
# If using Justfile
just build                     # Build library
just test                      # Run tests  
just health                    # Full health check (typecheck + lint + test)

# If using Nix development environment
nix develop                    # Enter dev shell
nix run .#test                 # Run tests
nix run .#check                # Full quality checks
```

### Testing
```bash
# Core test commands
bun test                       # Run all tests
bun test --watch               # Watch mode
bun test --coverage            # With coverage

# Specific test files
bun test tests/math.test.ts    # Math module tests
bun test tests/*.test.ts       # All test files
```

## Module Architecture & Usage Patterns

### Vector Mathematics (`src/math.ts`)
Core 2D/3D vector operations following right-handed coordinate systems:
```typescript
import { vec2, vec2Add, vec2Normalize, lerp } from 'play.ts';

const position = vec2(100, 200);
const velocity = vec2Normalize(vec2(1, -1)); // Unit vector
const newPos = vec2Add(position, velocity);
const smooth = lerp(0, 100, 0.5); // Linear interpolation
```

### Color Systems (`src/color.ts`)  
RGB/HSL color spaces with CSS output:
```typescript
import { rgb, hsl, colorLerp, toCssRgb } from 'play.ts/color';

const red = rgb(255, 0, 0);
const blue = hsl(240, 100, 50);  
const purple = colorLerp(red, blue, 0.5);
const css = toCssRgb(purple); // "rgb(127, 0, 127)"
```

### Animation System (`src/animation.ts`)
Professional easing functions and animation loops:
```typescript
import { tween, easeInOutCubic, AnimationLoop } from 'play.ts/animation';

const myTween = tween({
  from: 0, to: 100, duration: 1000,
  easing: easeInOutCubic,
  onUpdate: (value) => updatePosition(value)
});
```

### Physics Simulation (`src/physics.ts`)
Particle systems with realistic forces:
```typescript  
import { Particle, gravity, springForce } from 'play.ts/physics';

const particle = new Particle(x, y, vx, vy, mass);
particle.applyForce(gravity(mass, 0.2));
particle.update(deltaTime);
```

## Examples Application

The `_examples/` directory contains a comprehensive React application showcasing all library features:

### Structure
- **Interactive Examples**: Real-time demonstrations with canvas rendering
- **Professional UI**: TanStack Router, Tailwind CSS, Radix UI components  
- **Search Interface**: Command-K search for quick navigation
- **Categories**: Basic, Engineering, Visual examples with 50+ demonstrations

### Running Examples
```bash
cd _examples
bun install        # Install dependencies
bun run dev        # Start on http://localhost:3000

# Alternative from root
bun run dev        # Runs _examples dev server
```

### Key Example Categories
- **Basic**: Math operations, color theory, easing functions
- **Engineering**: Circuit analysis, fluid dynamics, structural analysis
- **Visual**: Particle systems, fractals, Conway's Game of Life, ASCII art

## Development Workflow

### Adding New Functions
1. Add function to appropriate module in `src/`
2. Add TypeScript types to `types/index.ts` if needed
3. Export from `src/index.ts` 
4. Write tests in `tests/{module}.test.ts`
5. Add example to `_examples/src/routes/examples.{category}.{name}.tsx`

### Code Quality Standards
- **TypeScript Strict Mode**: Full type checking enabled
- **Immutable Interfaces**: Use `readonly` properties
- **Performance**: Functions optimized for real-time use
- **Documentation**: JSDoc comments for all public APIs
- **Testing**: High test coverage across all modules

### File Organization
- Core library: `src/` - Never create files in root
- Tests: `tests/` - Comprehensive test coverage  
- Examples: `_examples/src/routes/` - Interactive demonstrations
- Types: `types/` - Centralized TypeScript definitions
- Build output: `dist/` - Generated, not version controlled

## Advanced Features

### Multi-Format Builds
The library builds to multiple formats for maximum compatibility:
- **ESM**: Modern ES modules for bundlers
- **CJS**: CommonJS for Node.js compatibility  
- **Browser**: Minified browser builds
- **Individual Modules**: Tree-shakeable module builds

### Type Safety Features  
- Readonly interfaces prevent mutations
- Comprehensive generic types for flexibility
- Utility types for advanced patterns
- Full IntelliSense support in editors

### Performance Optimizations
- Optimized vector operations avoiding object allocation
- Efficient collision detection algorithms
- 60fps animation loop with delta time management
- Memory-efficient particle systems

## Testing Strategy

The test suite includes:
- **Unit Tests**: Individual function testing across all modules
- **Integration Tests**: Cross-module functionality  
- **Performance Tests**: Benchmarking critical operations
- **Edge Case Tests**: Boundary conditions and error handling
- **Browser Compatibility**: Multi-environment testing

### Test Organization
- `tests/{module}.test.ts` - Core module tests
- `tests/integration.test.ts` - Cross-module tests  
- `tests/performance.test.ts` - Performance benchmarks
- `tests/{module}.edge-cases.test.ts` - Edge case testing

## Common Workflows

### Creating New Examples
1. Create route file: `_examples/src/routes/examples.{category}.{name}.tsx`
2. Import required play.ts functions
3. Implement canvas-based demonstration
4. Add to navigation structure
5. Test across devices/browsers

### Performance Optimization
1. Use `pointDistanceSq()` instead of `pointDistance()` for comparisons
2. Batch vector operations when possible  
3. Reuse objects in animation loops
4. Profile with browser dev tools
5. Run performance benchmarks: `bun test tests/performance.test.ts`

### Debugging
- Use comprehensive error messages in development
- Enable source maps for debugging built library
- Utilize TypeScript strict checking
- Test across multiple environments (browser, Node, Bun)

The library is designed for creative coding applications with emphasis on performance, type safety, and developer experience.
