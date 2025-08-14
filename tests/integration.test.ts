import { test, expect, describe } from 'bun:test';
import {
  // Math
  vec2,
  vec2Add,
  vec2Length,
  vec2Normalize,
  lerp,
  map,
  PI,
  TWO_PI,
  // Color
  rgb,
  hsl,
  rgbToHsl,
  hslToRgb,
  colorLerp,
  brighten,
  complementary,
  // Animation
  linear,
  easeInQuad,
  easeOutBounce,
  AnimationLoop,
  Tween,
  // Random
  setSeed,
  randomFloat,
  randomInt,
  randomChoice,
  noise,
  SeededRandom,
  // Geometry
  point,
  circle,
  rect,
  line,
  polygon,
  pointInCircle,
  rectIntersects,
  lineIntersection,
  // Main
  Play,
  play,
  setup
} from '../src/index.ts';
import {
  expectCloseTo,
  expectVec2CloseTo,
  expectColorCloseTo,
  createMockCanvas,
  createMockContext2D,
  generateRandomNumbers,
  calculateMean,
  expectNormalDistribution
} from './utils/test-helpers.ts';

describe('Integration Tests', () => {
  describe('Math + Color Integration', () => {
    test('color interpolation with math utilities', () => {
      const red = rgb(255, 0, 0);
      const blue = rgb(0, 0, 255);

      // Use lerp with color interpolation
      const t = 0.3;
      const interpolated = colorLerp(red, blue, t);

      expectColorCloseTo(interpolated, {
        r: lerp(255, 0, t),
        g: lerp(0, 0, t),
        b: lerp(0, 255, t)
      });
    });

    test('color manipulation with vector math', () => {
      const color = rgb(128, 64, 192);
      const hslColor = rgbToHsl(color);

      // Create vector from HSL values
      const hslVec = vec2(hslColor.h, hslColor.s);
      const length = vec2Length(hslVec);

      expect(typeof length).toBe('number');
      expect(length).toBeGreaterThan(0);
    });

    test('color harmony with geometric patterns', () => {
      const baseColor = rgb(255, 128, 0);
      const complement = complementary(baseColor);

      // Create points based on color values
      const p1 = point((baseColor.r / 255) * 100, (baseColor.g / 255) * 100);
      const p2 = point((complement.r / 255) * 100, (complement.g / 255) * 100);

      // Calculate distance in color space
      const colorDistance = Math.sqrt(
        Math.pow(baseColor.r - complement.r, 2) +
          Math.pow(baseColor.g - complement.g, 2) +
          Math.pow(baseColor.b - complement.b, 2)
      );

      expect(colorDistance).toBeGreaterThan(100); // Complementary colors should be far apart
    });

    test('rainbow generation with math functions', () => {
      const rainbowColors = [];
      const steps = 10;

      for (let i = 0; i < steps; i++) {
        const hue = map(i, 0, steps - 1, 0, 360);
        const color = hslToRgb(hsl(hue, 100, 50));
        rainbowColors.push(color);
      }

      expect(rainbowColors).toHaveLength(steps);
      expect(rainbowColors[0].r).toBe(255); // Red at 0°
      expect(rainbowColors[0].g).toBe(0);
      expect(rainbowColors[0].b).toBe(0);
    });
  });

  describe('Animation + Math Integration', () => {
    test('animated vector movement', () => {
      const startPos = vec2(0, 0);
      const endPos = vec2(100, 50);
      const duration = 1000;

      // Simulate animation frames
      const frames = [];
      for (let t = 0; t <= 1; t += 0.1) {
        const easedT = easeInQuad(t);
        const currentPos = vec2(lerp(startPos.x, endPos.x, easedT), lerp(startPos.y, endPos.y, easedT));
        frames.push(currentPos);
      }

      expect(frames).toHaveLength(11);
      expectVec2CloseTo(frames[0], startPos);
      expectVec2CloseTo(frames[frames.length - 1], endPos);

      // Verify easing - should start slow
      const firstStep = vec2Length(vec2Add(frames[1], vec2(-frames[0].x, -frames[0].y)));
      const lastStep = vec2Length(
        vec2Add(frames[frames.length - 1], vec2(-frames[frames.length - 2].x, -frames[frames.length - 2].y))
      );
      expect(firstStep).toBeLessThan(lastStep);
    });

    test('circular motion with trigonometry', () => {
      const center = vec2(50, 50);
      const radius = 25;
      const steps = 8;

      const positions = [];
      for (let i = 0; i < steps; i++) {
        const angle = map(i, 0, steps, 0, TWO_PI);
        const pos = vec2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
        positions.push(pos);
      }

      // All positions should be radius distance from center
      positions.forEach(pos => {
        const distance = vec2Length(vec2Add(pos, vec2(-center.x, -center.y)));
        expectCloseTo(distance, radius, 5);
      });
    });

    test('bouncing ball physics simulation', () => {
      let position = vec2(0, 0);
      let velocity = vec2(5, 10);
      const gravity = vec2(0, -0.5);
      const bounds = rect(0, 0, 100, 100);
      const damping = 0.8;

      // Simulate several frames
      for (let frame = 0; frame < 50; frame++) {
        // Apply gravity
        velocity = vec2Add(velocity, gravity);

        // Update position
        position = vec2Add(position, velocity);

        // Bounce off walls
        if (position.x <= bounds.x || position.x >= bounds.x + bounds.width) {
          velocity = vec2(-velocity.x * damping, velocity.y);
        }
        if (position.y <= bounds.y) {
          velocity = vec2(velocity.x, -velocity.y * damping);
          position = vec2(position.x, bounds.y);
        }
      }

      // Ball should be within bounds
      expect(position.x).toBeGreaterThanOrEqual(bounds.x);
      expect(position.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(position.y).toBeGreaterThanOrEqual(bounds.y);
    });
  });

  describe('Random + Geometry Integration', () => {
    test('random point generation and spatial queries', () => {
      setSeed(12345);
      const bounds = rect(0, 0, 100, 100);
      const center = circle(50, 50, 25);

      const points = [];
      const pointsInCircle = [];

      for (let i = 0; i < 100; i++) {
        const p = point(
          randomFloat(bounds.x, bounds.x + bounds.width),
          randomFloat(bounds.y, bounds.y + bounds.height)
        );
        points.push(p);

        if (pointInCircle(p, center)) {
          pointsInCircle.push(p);
        }
      }

      expect(points).toHaveLength(100);
      expect(pointsInCircle.length).toBeGreaterThan(0);
      expect(pointsInCircle.length).toBeLessThan(100);

      // Approximate area check - circle area vs rectangle area
      const circleArea = PI * center.radius * center.radius;
      const rectArea = bounds.width * bounds.height;
      const expectedRatio = circleArea / rectArea;
      const actualRatio = pointsInCircle.length / points.length;

      // Should be within 20% of expected ratio (random variation)
      expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.2);
    });

    test('random polygon generation and analysis', () => {
      setSeed(54321);
      const numVertices = 6;
      const radius = 30;
      const center = point(50, 50);

      // Generate random polygon vertices around a circle
      const vertices = [];
      for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * TWO_PI + randomFloat(-0.5, 0.5);
        const r = radius + randomFloat(-5, 5);
        vertices.push(point(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r));
      }

      const poly = polygon(...vertices);

      // Calculate centroid
      let centroidX = 0;
      let centroidY = 0;
      for (const vertex of vertices) {
        centroidX += vertex.x;
        centroidY += vertex.y;
      }
      centroidX /= vertices.length;
      centroidY /= vertices.length;

      // Centroid should be near the original center
      const centroidDistance = Math.sqrt(Math.pow(centroidX - center.x, 2) + Math.pow(centroidY - center.y, 2));
      expect(centroidDistance).toBeLessThan(10);
    });

    test('noise-based terrain generation', () => {
      const width = 20;
      const height = 20;
      const terrain = [];

      for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
          const elevation = noise.noise2D(x * 0.1, y * 0.1);
          row.push(elevation);
        }
        terrain.push(row);
      }

      expect(terrain).toHaveLength(height);
      expect(terrain[0]).toHaveLength(width);

      // Check that terrain has reasonable variation
      const flatTerrain = terrain.flat();
      const min = Math.min(...flatTerrain);
      const max = Math.max(...flatTerrain);
      expect(max - min).toBeGreaterThan(0.1); // Should have some variation

      // Check smoothness - adjacent cells shouldn't differ too much
      let maxDifference = 0;
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const diff = Math.abs(terrain[y][x] - terrain[y][x + 1]);
          maxDifference = Math.max(maxDifference, diff);
        }
      }
      expect(maxDifference).toBeLessThan(1.0); // Noise should be relatively smooth
    });
  });

  describe('Play Class Integration', () => {
    test('Play class with mock canvas operations', () => {
      const canvas = createMockCanvas();
      const context = createMockContext2D();
      const playInstance = setup(canvas);

      // Test drawing operations
      playInstance.background('#ffffff');
      playInstance.stroke('#000000', 2);
      playInstance.fill('#ff0000');

      // Draw some shapes
      playInstance.drawCircle(50, 50, 25);
      playInstance.drawRect(25, 25, 50, 50);
      playInstance.drawLine(0, 0, 100, 100);

      // Draw a polygon
      const triangle = [point(50, 25), point(25, 75), point(75, 75)];
      playInstance.drawPolygon(triangle);

      // Test transformations
      playInstance.pushMatrix();
      playInstance.translate(50, 50);
      playInstance.rotate(PI / 4);
      playInstance.scale(2, 2);
      playInstance.drawCircle(0, 0, 10);
      playInstance.popMatrix();

      // Verify operations were called (in real implementation, would check mock calls)
      expect(playInstance.getCanvas()).toBe(canvas);
    });

    test('animated drawing with Play class', () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      let frameCount = 0;
      const maxFrames = 10;

      const animationCallback = (frame: { time: number; deltaTime: number; frame: number }) => {
        if (frameCount >= maxFrames) return;

        playInstance.background('#000000');

        // Animated circle
        const x = lerp(0, 100, frameCount / maxFrames);
        const y = 50 + Math.sin(frameCount * 0.5) * 20;
        const radius = 10 + Math.sin(frameCount * 0.3) * 5;

        // Color that changes over time
        const hue = map(frameCount, 0, maxFrames, 0, 360);
        const color = hslToRgb(hsl(hue, 100, 50));

        playInstance.fill(`rgb(${color.r}, ${color.g}, ${color.b})`);
        playInstance.drawCircle(x, y, radius);

        frameCount++;
      };

      // Simulate animation frames
      for (let i = 0; i < maxFrames; i++) {
        animationCallback({
          time: i * 16.67,
          deltaTime: 16.67,
          frame: i
        });
      }

      expect(frameCount).toBe(maxFrames);
    });
  });

  describe('Complex Algorithm Integration', () => {
    test('particle system with all modules', () => {
      setSeed(9999);

      interface Particle {
        position: typeof vec2;
        velocity: typeof vec2;
        acceleration: typeof vec2;
        color: typeof rgb;
        life: number;
        maxLife: number;
        size: number;
      }

      const createParticle = (x: number, y: number): Particle => ({
        position: vec2(x, y),
        velocity: vec2(randomFloat(-2, 2), randomFloat(0, 2)),
        acceleration: vec2(0, 0.1), // gravity
        color: rgb(randomInt(200, 255), randomInt(100, 200), randomInt(0, 100)),
        life: 1.0,
        maxLife: randomFloat(1, 3),
        size: randomFloat(2, 8)
      });

      const updateParticle = (particle: Particle, deltaTime: number): void => {
        // Physics
        particle.velocity = vec2Add(
          particle.velocity,
          vec2(particle.acceleration.x * deltaTime, particle.acceleration.y * deltaTime)
        );
        particle.position = vec2Add(
          particle.position,
          vec2(particle.velocity.x * deltaTime, particle.velocity.y * deltaTime)
        );

        // Life
        particle.life -= deltaTime / particle.maxLife;

        // Color fade
        const alpha = Math.max(0, particle.life);
        particle.color = rgb(particle.color.r * alpha, particle.color.g * alpha, particle.color.b * alpha);

        // Size shrink
        particle.size = particle.size * alpha;
      };

      // Create particle system
      const particles: Particle[] = [];
      const emitterPos = point(50, 10);

      // Emit particles
      for (let i = 0; i < 20; i++) {
        particles.push(createParticle(emitterPos.x, emitterPos.y));
      }

      // Simulate several time steps
      const deltaTime = 0.1;
      for (let step = 0; step < 10; step++) {
        particles.forEach(particle => updateParticle(particle, deltaTime));
      }

      // Verify particles have moved and aged
      particles.forEach(particle => {
        expect(particle.position.y).toBeGreaterThan(emitterPos.y); // Fallen due to gravity
        expect(particle.life).toBeLessThan(1); // Aged
        expect(particle.size).toBeLessThan(8); // Shrunk
      });

      // Count alive particles
      const aliveParticles = particles.filter(p => p.life > 0);
      expect(aliveParticles.length).toBeGreaterThan(0);
      expect(aliveParticles.length).toBeLessThanOrEqual(particles.length);
    });

    test('procedural maze generation', () => {
      setSeed(7777);

      const width = 10;
      const height = 10;

      // Initialize maze grid
      const maze: boolean[][] = [];
      for (let y = 0; y < height; y++) {
        maze[y] = [];
        for (let x = 0; x < width; x++) {
          maze[y][x] = false; // false = wall, true = path
        }
      }

      // Simple random maze generation
      const start = point(0, 0);
      const stack: (typeof point)[] = [start];
      maze[start.y][start.x] = true;

      while (stack.length > 0) {
        const current = stack[stack.length - 1];

        // Get valid neighbors
        const neighbors = [
          point(current.x + 1, current.y),
          point(current.x - 1, current.y),
          point(current.x, current.y + 1),
          point(current.x, current.y - 1)
        ].filter(p => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height && !maze[p.y][p.x]);

        if (neighbors.length > 0) {
          const next = randomChoice(neighbors);
          maze[next.y][next.x] = true;
          stack.push(next);
        } else {
          stack.pop();
        }
      }

      // Verify maze properties
      expect(maze[start.y][start.x]).toBe(true); // Start is path

      let pathCount = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (maze[y][x]) pathCount++;
        }
      }

      expect(pathCount).toBeGreaterThan(1); // Should have some paths
      expect(pathCount).toBeLessThanOrEqual(width * height); // Can have all paths in connected maze
    });

    test('Voronoi diagram approximation', () => {
      setSeed(4444);

      const width = 50;
      const height = 50;
      const numSeeds = 5;

      // Generate random seed points
      const seeds = [];
      for (let i = 0; i < numSeeds; i++) {
        seeds.push(point(randomInt(0, width - 1), randomInt(0, height - 1)));
      }

      // Create Voronoi diagram
      const diagram: number[][] = [];
      for (let y = 0; y < height; y++) {
        diagram[y] = [];
        for (let x = 0; x < width; x++) {
          const currentPoint = point(x, y);

          // Find closest seed
          let closestSeed = 0;
          let minDistance = Infinity;

          for (let i = 0; i < seeds.length; i++) {
            const distance = Math.sqrt(
              Math.pow(currentPoint.x - seeds[i].x, 2) + Math.pow(currentPoint.y - seeds[i].y, 2)
            );

            if (distance < minDistance) {
              minDistance = distance;
              closestSeed = i;
            }
          }

          diagram[y][x] = closestSeed;
        }
      }

      // Verify each seed point is in its own region
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        expect(diagram[seed.y][seed.x]).toBe(i);
      }

      // Verify all regions are used
      const usedRegions = new Set();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          usedRegions.add(diagram[y][x]);
        }
      }
      expect(usedRegions.size).toBe(numSeeds);
    });
  });

  describe('Statistical Validation', () => {
    test('random number distribution validation', () => {
      setSeed(1111);
      const samples = 10000;
      const numbers = [];

      for (let i = 0; i < samples; i++) {
        numbers.push(randomFloat(0, 1));
      }

      // Test uniform distribution
      expectNormalDistribution(numbers, 0.5, Math.sqrt(1 / 12), 0.1);

      // Test range
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThanOrEqual(1);
    });

    test('noise function continuity', () => {
      const resolution = 0.01;
      const range = 10;

      let maxDifference = 0;
      for (let x = 0; x < range; x += resolution) {
        const value1 = noise.noise1D(x);
        const value2 = noise.noise1D(x + resolution);
        const difference = Math.abs(value2 - value1);
        maxDifference = Math.max(maxDifference, difference);
      }

      // Noise should be continuous (no large jumps)
      expect(maxDifference).toBeLessThan(0.1);
    });

    test('easing function monotonicity', () => {
      const easingFunctions = [linear, easeInQuad, easeOutBounce];

      for (const easingFn of easingFunctions) {
        const samples = 100;
        let isMonotonic = true;
        let previousValue = easingFn(0);

        for (let i = 1; i <= samples; i++) {
          const t = i / samples;
          const currentValue = easingFn(t);

          // For most easing functions, should be non-decreasing
          // (Note: some like bounce functions may not be strictly monotonic)
          if (easingFn === easeOutBounce) {
            // Skip monotonicity test for bounce functions
            continue;
          }

          if (currentValue < previousValue) {
            isMonotonic = false;
            break;
          }
          previousValue = currentValue;
        }

        if (easingFn !== easeOutBounce) {
          expect(isMonotonic).toBe(true);
        }
      }
    });
  });
});
