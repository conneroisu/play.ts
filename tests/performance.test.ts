import { test, expect, describe } from 'bun:test';
import {
  // Math
  clamp,
  lerp,
  map,
  normalize,
  vec2,
  vec2Add,
  vec2Sub,
  vec2Mul,
  vec2Div,
  vec2Length,
  vec2Normalize,
  vec2Distance,
  vec2Angle,
  vec2FromAngle,
  vec2Lerp,
  vec2Rotate,
  vec3,
  vec3Add,
  vec3Sub,
  vec3Mul,
  vec3Div,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3Normalize,
  vec3Distance,
  vec3Lerp,
  // Color
  rgb,
  rgba,
  hsl,
  hsla,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  colorLerp,
  brighten,
  darken,
  saturate,
  desaturate,
  hueShift,
  grayscale,
  invert,
  complementary,
  // Animation
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  Tween,
  Spring,
  // Random
  randomInt,
  randomFloat,
  randomBool,
  randomChoice,
  randomAngle,
  randomInCircle,
  randomOnCircle,
  randomGaussian,
  setSeed,
  shuffle,
  noise,
  SeededRandom,
  PerlinNoise,
  // Geometry
  point,
  pointDistance,
  pointLerp,
  rect,
  rectIntersects,
  circle,
  pointInCircle,
  line,
  lineLength,
  lineIntersection,
  polygon,
  polygonArea,
  pointInPolygon,
  regularPolygon
} from '../src/index.ts';
import {
  measurePerformance,
  expectPerformance,
  generateRandomNumbers,
  generateRandomVectors2D,
  generateRandomIntegers
} from './utils/test-helpers.ts';

describe('Performance Tests', () => {
  describe('Math Operations Performance', () => {
    test('basic math functions performance', () => {
      const iterations = 100000;
      const testData = generateRandomNumbers(1000, -100, 100);

      const clampTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const value = testData[i % testData.length];
          clamp(value, 0, 100);
        }
      }, 1);

      const lerpTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const t = (i % 100) / 100;
          lerp(0, 100, t);
        }
      }, 1);

      const mapTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const value = testData[i % testData.length];
          map(value, -100, 100, 0, 1);
        }
      }, 1);

      // These should be very fast operations
      expect(clampTime).toBeLessThan(100);
      expect(lerpTime).toBeLessThan(100);
      expect(mapTime).toBeLessThan(100);

      console.log(`Math functions (${iterations} ops): clamp=${clampTime}ms, lerp=${lerpTime}ms, map=${mapTime}ms`);
    });

    test('vector2 operations performance', () => {
      const iterations = 50000;
      const vectors = generateRandomVectors2D(1000, -100, 100);

      const addTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors[i % vectors.length];
          const v2 = vectors[(i + 1) % vectors.length];
          vec2Add(v1, v2);
        }
      }, 1);

      const lengthTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v = vectors[i % vectors.length];
          vec2Length(v);
        }
      }, 1);

      const normalizeTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v = vectors[i % vectors.length];
          vec2Normalize(v);
        }
      }, 1);

      const distanceTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors[i % vectors.length];
          const v2 = vectors[(i + 1) % vectors.length];
          vec2Distance(v1, v2);
        }
      }, 1);

      expect(addTime).toBeLessThan(200);
      expect(lengthTime).toBeLessThan(200);
      expect(normalizeTime).toBeLessThan(200);
      expect(distanceTime).toBeLessThan(200);

      console.log(
        `Vector2 ops (${iterations} ops): add=${addTime}ms, length=${lengthTime}ms, normalize=${normalizeTime}ms, distance=${distanceTime}ms`
      );
    });

    test('vector3 operations performance', () => {
      const iterations = 50000;
      const vectors3d = [];
      for (let i = 0; i < 1000; i++) {
        vectors3d.push(vec3(Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 200 - 100));
      }

      const addTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors3d[i % vectors3d.length];
          const v2 = vectors3d[(i + 1) % vectors3d.length];
          vec3Add(v1, v2);
        }
      }, 1);

      const crossTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors3d[i % vectors3d.length];
          const v2 = vectors3d[(i + 1) % vectors3d.length];
          vec3Cross(v1, v2);
        }
      }, 1);

      const normalizeTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v = vectors3d[i % vectors3d.length];
          vec3Normalize(v);
        }
      }, 1);

      expect(addTime).toBeLessThan(200);
      expect(crossTime).toBeLessThan(300);
      expect(normalizeTime).toBeLessThan(300);

      console.log(
        `Vector3 ops (${iterations} ops): add=${addTime}ms, cross=${crossTime}ms, normalize=${normalizeTime}ms`
      );
    });

    test('trigonometric operations performance', () => {
      const iterations = 50000;
      const angles = generateRandomNumbers(1000, 0, Math.PI * 2);

      const fromAngleTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const angle = angles[i % angles.length];
          vec2FromAngle(angle);
        }
      }, 1);

      const rotateTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v = vec2(1, 0);
          const angle = angles[i % angles.length];
          vec2Rotate(v, angle);
        }
      }, 1);

      expect(fromAngleTime).toBeLessThan(300);
      expect(rotateTime).toBeLessThan(300);

      console.log(`Trigonometric ops (${iterations} ops): fromAngle=${fromAngleTime}ms, rotate=${rotateTime}ms`);
    });
  });

  describe('Color Operations Performance', () => {
    test('color creation and conversion performance', () => {
      const iterations = 50000;
      const rgbValues = generateRandomIntegers(1000, 0, 255);

      const rgbTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const r = rgbValues[i % rgbValues.length];
          const g = rgbValues[(i + 1) % rgbValues.length];
          const b = rgbValues[(i + 2) % rgbValues.length];
          rgb(r, g, b);
        }
      }, 1);

      const hslTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const h = i % 360;
          hsl(h, 50, 50);
        }
      }, 1);

      const conversionTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const r = rgbValues[i % rgbValues.length];
          const g = rgbValues[(i + 1) % rgbValues.length];
          const b = rgbValues[(i + 2) % rgbValues.length];
          const color = rgb(r, g, b);
          rgbToHsl(color);
        }
      }, 1);

      expect(rgbTime).toBeLessThan(200);
      expect(hslTime).toBeLessThan(200);
      expect(conversionTime).toBeLessThan(400);

      console.log(`Color ops (${iterations} ops): rgb=${rgbTime}ms, hsl=${hslTime}ms, conversion=${conversionTime}ms`);
    });

    test('color manipulation performance', () => {
      const iterations = 20000;
      const colors = [];
      for (let i = 0; i < 1000; i++) {
        colors.push(
          rgb(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
        );
      }

      const lerpTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const c1 = colors[i % colors.length];
          const c2 = colors[(i + 1) % colors.length];
          colorLerp(c1, c2, 0.5);
        }
      }, 1);

      const brightenTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const c = colors[i % colors.length];
          brighten(c, 20);
        }
      }, 1);

      const complementTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const c = colors[i % colors.length];
          complementary(c);
        }
      }, 1);

      expect(lerpTime).toBeLessThan(300);
      expect(brightenTime).toBeLessThan(400);
      expect(complementTime).toBeLessThan(400);

      console.log(
        `Color manipulation (${iterations} ops): lerp=${lerpTime}ms, brighten=${brightenTime}ms, complement=${complementTime}ms`
      );
    });
  });

  describe('Animation Performance', () => {
    test('easing functions performance', () => {
      const iterations = 100000;
      const tValues = generateRandomNumbers(1000, 0, 1);

      const linearTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const t = tValues[i % tValues.length];
          linear(t);
        }
      }, 1);

      const quadTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const t = tValues[i % tValues.length];
          easeInQuad(t);
        }
      }, 1);

      const sineTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const t = tValues[i % tValues.length];
          easeInSine(t);
        }
      }, 1);

      expect(linearTime).toBeLessThan(100);
      expect(quadTime).toBeLessThan(100);
      expect(sineTime).toBeLessThan(200);

      console.log(
        `Easing functions (${iterations} ops): linear=${linearTime}ms, quad=${quadTime}ms, sine=${sineTime}ms`
      );
    });
  });

  describe('Random Generation Performance', () => {
    test('random number generation performance', () => {
      const iterations = 100000;

      const mathRandomTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          Math.random();
        }
      }, 1);

      const randomFloatTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          randomFloat(0, 100);
        }
      }, 1);

      const randomIntTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          randomInt(0, 100);
        }
      }, 1);

      expect(mathRandomTime).toBeLessThan(100);
      expect(randomFloatTime).toBeLessThan(200);
      expect(randomIntTime).toBeLessThan(200);

      console.log(
        `Random generation (${iterations} ops): Math.random=${mathRandomTime}ms, randomFloat=${randomFloatTime}ms, randomInt=${randomIntTime}ms`
      );
    });

    test('seeded random performance', () => {
      const iterations = 50000;
      const rng = new SeededRandom(12345);

      const seededTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          rng.next();
        }
      }, 1);

      const gaussianTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          rng.gaussian();
        }
      }, 1);

      expect(seededTime).toBeLessThan(300);
      expect(gaussianTime).toBeLessThan(500);

      console.log(`Seeded random (${iterations} ops): next=${seededTime}ms, gaussian=${gaussianTime}ms`);
    });

    test('noise generation performance', () => {
      const iterations = 10000;
      const perlin = new PerlinNoise(12345);

      const noise1DTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          perlin.noise1D(i * 0.01);
        }
      }, 1);

      const noise2DTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          perlin.noise2D(i * 0.01, i * 0.01);
        }
      }, 1);

      const noise3DTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          perlin.noise3D(i * 0.01, i * 0.01, i * 0.01);
        }
      }, 1);

      expect(noise1DTime).toBeLessThan(500);
      expect(noise2DTime).toBeLessThan(800);
      expect(noise3DTime).toBeLessThan(1200);

      console.log(
        `Noise generation (${iterations} ops): 1D=${noise1DTime}ms, 2D=${noise2DTime}ms, 3D=${noise3DTime}ms`
      );
    });

    test('array shuffling performance', () => {
      const arraySizes = [100, 1000, 10000];

      for (const size of arraySizes) {
        const array = Array.from({ length: size }, (_, i) => i);

        const shuffleTime = measurePerformance(() => {
          shuffle(array);
        }, 1);

        expect(shuffleTime).toBeLessThan(size * 0.1); // Should be roughly O(n)

        console.log(`Shuffle array[${size}]: ${shuffleTime}ms`);
      }
    });
  });

  describe('Geometry Operations Performance', () => {
    test('point operations performance', () => {
      const iterations = 100000;
      const points = [];
      for (let i = 0; i < 1000; i++) {
        points.push(point(Math.random() * 200 - 100, Math.random() * 200 - 100));
      }

      const distanceTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const p1 = points[i % points.length];
          const p2 = points[(i + 1) % points.length];
          pointDistance(p1, p2);
        }
      }, 1);

      const lerpTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const p1 = points[i % points.length];
          const p2 = points[(i + 1) % points.length];
          pointLerp(p1, p2, 0.5);
        }
      }, 1);

      expect(distanceTime).toBeLessThan(300);
      expect(lerpTime).toBeLessThan(300);

      console.log(`Point operations (${iterations} ops): distance=${distanceTime}ms, lerp=${lerpTime}ms`);
    });

    test('collision detection performance', () => {
      const iterations = 50000;
      const circles = [];
      const rects = [];
      const testPoints = [];

      for (let i = 0; i < 1000; i++) {
        circles.push(circle(Math.random() * 200, Math.random() * 200, Math.random() * 20 + 5));
        rects.push(rect(Math.random() * 200, Math.random() * 200, Math.random() * 40 + 10, Math.random() * 40 + 10));
        testPoints.push(point(Math.random() * 200, Math.random() * 200));
      }

      const pointInCircleTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const p = testPoints[i % testPoints.length];
          const c = circles[i % circles.length];
          pointInCircle(p, c);
        }
      }, 1);

      const rectIntersectsTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const r1 = rects[i % rects.length];
          const r2 = rects[(i + 1) % rects.length];
          rectIntersects(r1, r2);
        }
      }, 1);

      expect(pointInCircleTime).toBeLessThan(300);
      expect(rectIntersectsTime).toBeLessThan(300);

      console.log(
        `Collision detection (${iterations} ops): pointInCircle=${pointInCircleTime}ms, rectIntersects=${rectIntersectsTime}ms`
      );
    });

    test('polygon operations performance', () => {
      const iterations = 10000;
      const polygons = [];

      // Create various polygon sizes
      for (let size = 3; size <= 20; size++) {
        for (let i = 0; i < 50; i++) {
          const vertices = [];
          for (let j = 0; j < size; j++) {
            vertices.push(point(Math.random() * 100, Math.random() * 100));
          }
          polygons.push(polygon(...vertices));
        }
      }

      const testPoints = [];
      for (let i = 0; i < 1000; i++) {
        testPoints.push(point(Math.random() * 100, Math.random() * 100));
      }

      const pointInPolygonTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const p = testPoints[i % testPoints.length];
          const poly = polygons[i % polygons.length];
          pointInPolygon(p, poly);
        }
      }, 1);

      const polygonAreaTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const poly = polygons[i % polygons.length];
          polygonArea(poly);
        }
      }, 1);

      expect(pointInPolygonTime).toBeLessThan(1000);
      expect(polygonAreaTime).toBeLessThan(500);

      console.log(
        `Polygon operations (${iterations} ops): pointInPolygon=${pointInPolygonTime}ms, area=${polygonAreaTime}ms`
      );
    });

    test('regular polygon generation performance', () => {
      const iterations = 10000;

      const time = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const sides = 3 + (i % 15); // 3-18 sides
          const center = point(50, 50);
          const radius = 20;
          regularPolygon(center, radius, sides);
        }
      }, 1);

      expect(time).toBeLessThan(500);

      console.log(`Regular polygon generation (${iterations} ops): ${time}ms`);
    });
  });

  describe('Memory and Allocation Performance', () => {
    test('vector creation allocation performance', () => {
      const iterations = 100000;

      const createTime = measurePerformance(() => {
        const vectors = [];
        for (let i = 0; i < iterations; i++) {
          vectors.push(vec2(Math.random(), Math.random()));
        }
      }, 1);

      expect(createTime).toBeLessThan(500);

      console.log(`Vector creation (${iterations} allocations): ${createTime}ms`);
    });

    test('color creation allocation performance', () => {
      const iterations = 100000;

      const createTime = measurePerformance(() => {
        const colors = [];
        for (let i = 0; i < iterations; i++) {
          colors.push(rgb(i % 256, (i * 2) % 256, (i * 3) % 256));
        }
      }, 1);

      expect(createTime).toBeLessThan(500);

      console.log(`Color creation (${iterations} allocations): ${createTime}ms`);
    });

    test('point array operations performance', () => {
      const arraySize = 10000;
      const points = [];

      // Create large array of points
      const creationTime = measurePerformance(() => {
        for (let i = 0; i < arraySize; i++) {
          points.push(point(Math.random() * 1000, Math.random() * 1000));
        }
      }, 1);

      // Process all points
      const processingTime = measurePerformance(() => {
        let totalDistance = 0;
        for (let i = 0; i < points.length - 1; i++) {
          totalDistance += pointDistance(points[i], points[i + 1]);
        }
      }, 1);

      expect(creationTime).toBeLessThan(200);
      expect(processingTime).toBeLessThan(300);

      console.log(
        `Point array operations (${arraySize} points): creation=${creationTime}ms, processing=${processingTime}ms`
      );
    });
  });

  describe('Stress Tests', () => {
    test('massive vector calculation stress test', () => {
      const numVectors = 50000;
      const numIterations = 10;

      // Generate large dataset
      const vectors = [];
      for (let i = 0; i < numVectors; i++) {
        vectors.push(vec2(Math.random() * 1000 - 500, Math.random() * 1000 - 500));
      }

      const stressTime = measurePerformance(() => {
        for (let iter = 0; iter < numIterations; iter++) {
          for (let i = 0; i < vectors.length; i++) {
            const v = vectors[i];

            // Perform multiple operations on each vector
            const length = vec2Length(v);
            const normalized = vec2Normalize(v);
            const scaled = vec2Mul(normalized, length * 1.1);
            const rotated = vec2Rotate(scaled, 0.1);

            vectors[i] = rotated;
          }
        }
      }, 1);

      expect(stressTime).toBeLessThan(5000); // 5 second max

      console.log(`Stress test (${numVectors} vectors, ${numIterations} iterations): ${stressTime}ms`);
    });

    test('particle system simulation stress test', () => {
      const numParticles = 5000;
      const numFrames = 100;

      interface Particle {
        position: { x: number; y: number };
        velocity: { x: number; y: number };
        acceleration: { x: number; y: number };
      }

      // Initialize particles
      const particles: Particle[] = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          position: vec2(Math.random() * 800, Math.random() * 600),
          velocity: vec2(Math.random() * 4 - 2, Math.random() * 4 - 2),
          acceleration: vec2(0, 0.1) // gravity
        });
      }

      const simulationTime = measurePerformance(() => {
        for (let frame = 0; frame < numFrames; frame++) {
          for (const particle of particles) {
            // Update physics
            particle.velocity = vec2Add(particle.velocity, particle.acceleration);
            particle.position = vec2Add(particle.position, particle.velocity);

            // Boundary collision
            if (particle.position.x <= 0 || particle.position.x >= 800) {
              particle.velocity = vec2(-particle.velocity.x * 0.8, particle.velocity.y);
            }
            if (particle.position.y <= 0 || particle.position.y >= 600) {
              particle.velocity = vec2(particle.velocity.x, -particle.velocity.y * 0.8);
            }
          }
        }
      }, 1);

      expect(simulationTime).toBeLessThan(2000); // 2 second max

      console.log(`Particle simulation (${numParticles} particles, ${numFrames} frames): ${simulationTime}ms`);
    });

    test('complex geometry operations stress test', () => {
      const numPolygons = 1000;
      const numTestPoints = 10000;

      // Generate complex polygons
      const polygons = [];
      for (let i = 0; i < numPolygons; i++) {
        const sides = 5 + Math.floor(Math.random() * 15); // 5-20 sides
        const vertices = [];

        for (let j = 0; j < sides; j++) {
          const angle = (j / sides) * Math.PI * 2;
          const radius = 20 + Math.random() * 30;
          vertices.push(point(50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius));
        }

        polygons.push(polygon(...vertices));
      }

      // Generate test points
      const testPoints = [];
      for (let i = 0; i < numTestPoints; i++) {
        testPoints.push(point(Math.random() * 200, Math.random() * 200));
      }

      const geometryTime = measurePerformance(() => {
        let hitCount = 0;

        for (const point of testPoints) {
          for (const poly of polygons) {
            if (pointInPolygon(point, poly)) {
              hitCount++;
            }
          }
        }
      }, 1);

      expect(geometryTime).toBeLessThan(3000); // 3 second max

      console.log(`Geometry stress test (${numPolygons} polygons, ${numTestPoints} points): ${geometryTime}ms`);
    });
  });

  describe('Comparative Performance', () => {
    test('compare vector operations vs manual calculations', () => {
      const iterations = 100000;
      const vectors = generateRandomVectors2D(1000, -100, 100);

      // Using vector functions
      const vectorTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors[i % vectors.length];
          const v2 = vectors[(i + 1) % vectors.length];
          const added = vec2Add(v1, v2);
          const length = vec2Length(added);
          const normalized = vec2Normalize(added);
        }
      }, 1);

      // Manual calculations
      const manualTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const v1 = vectors[i % vectors.length];
          const v2 = vectors[(i + 1) % vectors.length];

          const addedX = v1.x + v2.x;
          const addedY = v1.y + v2.y;

          const length = Math.sqrt(addedX * addedX + addedY * addedY);

          const normalizedX = length > 0 ? addedX / length : 0;
          const normalizedY = length > 0 ? addedY / length : 0;
        }
      }, 1);

      console.log(`Vector operations comparison (${iterations} ops): vector=${vectorTime}ms, manual=${manualTime}ms`);

      // Vector functions should be competitive with manual calculations
      // Allow up to 3x slower due to function call overhead and type safety
      expect(vectorTime).toBeLessThan(manualTime * 3);
    });

    test('compare color operations vs direct RGB manipulation', () => {
      const iterations = 50000;
      const colors = [];
      for (let i = 0; i < 1000; i++) {
        colors.push({
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256)
        });
      }

      // Using color functions
      const colorTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const c1 = colors[i % colors.length];
          const c2 = colors[(i + 1) % colors.length];
          const color1 = rgb(c1.r, c1.g, c1.b);
          const color2 = rgb(c2.r, c2.g, c2.b);
          const lerped = colorLerp(color1, color2, 0.5);
        }
      }, 1);

      // Direct manipulation
      const directTime = measurePerformance(() => {
        for (let i = 0; i < iterations; i++) {
          const c1 = colors[i % colors.length];
          const c2 = colors[(i + 1) % colors.length];

          const r = Math.round((c1.r + c2.r) / 2);
          const g = Math.round((c1.g + c2.g) / 2);
          const b = Math.round((c1.b + c2.b) / 2);
        }
      }, 1);

      console.log(`Color operations comparison (${iterations} ops): color=${colorTime}ms, direct=${directTime}ms`);

      // Should be reasonably close to direct manipulation
      expect(colorTime).toBeLessThan(directTime * 3);
    });
  });
});
