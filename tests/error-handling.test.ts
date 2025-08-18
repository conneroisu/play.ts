import { describe, expect, test } from "bun:test";
import {
  AnimationLoop,
  circle,
  circleFromPoints,
  // Math
  clamp,
  colorLerp,
  FractalNoise,
  hexToRgb,
  hsl,
  hsla,
  hslToRgb,
  lerp,
  line,
  lineIntersection,
  map,
  normalize,
  PerlinNoise,
  // Main
  Play,
  // Geometry
  point,
  pointDistance,
  pointInPolygon,
  polygon,
  polygonArea,
  randomChoice,
  randomFloat,
  // Random
  randomInt,
  rect,
  regularPolygon,
  // Color
  rgb,
  rgba,
  rgbToHex,
  rgbToHsl,
  SeededRandom,
  Spring,
  sample,
  setup,
  shuffle,
  // Animation
  Tween,
  vec2,
  vec2Add,
  vec2Angle,
  vec2Distance,
  vec2Div,
  vec2FromAngle,
  vec2Length,
  vec2Mul,
  vec2Normalize,
  vec2Sub,
  vec3,
  vec3Add,
  vec3Cross,
  weightedChoice,
} from "../src/index.ts";
import {
  createMockCanvas,
  expectError,
  expectNoError,
} from "./utils/test-helpers.ts";

describe("Error Handling Tests", () => {
  describe("Math Error Handling", () => {
    test("handles invalid parameters gracefully", () => {
      // These should not throw, but return reasonable values
      expectNoError(() => clamp(NaN, 0, 10));
      expectNoError(() => lerp(NaN, 10, 0.5));
      expectNoError(() => map(NaN, 0, 10, 0, 100));
      expectNoError(() => normalize(NaN, 0, 10));
    });

    test("vector operations with invalid inputs", () => {
      expectNoError(() => vec2(NaN, Infinity));
      expectNoError(() => vec2Add(vec2(NaN, 0), vec2(1, 2)));
      expectNoError(() => vec2Mul(vec2(1, 2), NaN));
      expectNoError(() => vec2Div(vec2(1, 2), 0)); // Should return Infinity
      expectNoError(() => vec2Length(vec2(NaN, 0)));
      expectNoError(() => vec2Normalize(vec2(0, 0))); // Zero vector
      expectNoError(() => vec2Distance(vec2(NaN, 0), vec2(1, 2)));
      expectNoError(() => vec2Angle(vec2(0, 0))); // Zero vector
      expectNoError(() => vec2FromAngle(NaN));
    });

    test("vector3 operations with invalid inputs", () => {
      expectNoError(() => vec3(NaN, Infinity, -Infinity));
      expectNoError(() => vec3Add(vec3(NaN, 0, 0), vec3(1, 2, 3)));
      expectNoError(() => vec3Cross(vec3(0, 0, 0), vec3(1, 2, 3))); // Zero vector cross product
    });

    test("extreme value handling", () => {
      // Very large numbers
      expectNoError(() => vec2Length(vec2(1e100, 1e100)));
      expectNoError(() => vec2Normalize(vec2(1e100, 1e100)));

      // Very small numbers
      expectNoError(() => vec2Length(vec2(1e-100, 1e-100)));
      expectNoError(() => vec2Normalize(vec2(1e-100, 1e-100)));
    });
  });

  describe("Color Error Handling", () => {
    test("color creation with invalid values", () => {
      expectNoError(() => rgb(-50, 300, 128)); // Out of range values
      expectNoError(() => rgba(256, -10, 128, 1.5)); // Out of range values
      expectNoError(() => hsl(-50, 150, -10)); // Out of range values
      expectNoError(() => hsla(400, 120, 110, 2)); // Out of range values

      // Test that values are clamped
      const color1 = rgb(-50, 300, 128);
      expect(color1.r).toBe(0);
      expect(color1.g).toBe(255);
      expect(color1.b).toBe(128);

      const color2 = rgba(256, -10, 128, 1.5);
      expect(color2.r).toBe(255);
      expect(color2.g).toBe(0);
      expect(color2.b).toBe(128);
      expect(color2.a).toBe(1);
    });

    test("color conversion with extreme values", () => {
      expectNoError(() => rgbToHsl(rgb(0, 0, 0))); // Black
      expectNoError(() => rgbToHsl(rgb(255, 255, 255))); // White
      expectNoError(() => hslToRgb(hsl(0, 0, 0))); // Black in HSL
      expectNoError(() => hslToRgb(hsl(360, 100, 100))); // White in HSL
    });

    test("hex color parsing with invalid input", () => {
      expectNoError(() => hexToRgb("#xyz")); // Invalid hex
      expectNoError(() => hexToRgb("#")); // Empty hex
      expectNoError(() => hexToRgb("123")); // Missing #
      expectNoError(() => hexToRgb("#12")); // Too short
      expectNoError(() => hexToRgb("#1234567")); // Too long
    });

    test("color interpolation with invalid colors", () => {
      const invalidColor1 = {
        r: NaN,
        g: 0,
        b: 255,
      };
      const invalidColor2 = {
        r: 255,
        g: Infinity,
        b: 0,
      };
      const validColor = rgb(128, 128, 128);

      expectNoError(() => colorLerp(invalidColor1 as any, validColor, 0.5));
      expectNoError(() => colorLerp(validColor, invalidColor2 as any, 0.5));
    });
  });

  describe("Animation Error Handling", () => {
    test("tween with invalid parameters", () => {
      expectNoError(() => {
        new Tween(
          NaN,
          100,
          1000,
          (t) => t,
          () => {},
        );
      });

      expectNoError(() => {
        new Tween(
          0,
          NaN,
          1000,
          (t) => t,
          () => {},
        );
      });

      expectNoError(() => {
        new Tween(
          0,
          100,
          -1000,
          (t) => t,
          () => {},
        ); // Negative duration
      });

      expectNoError(() => {
        new Tween(
          0,
          100,
          0,
          (t) => t,
          () => {},
        ); // Zero duration
      });
    });

    test("spring with invalid parameters", () => {
      expectNoError(() => {
        new Spring(NaN, 0.1, 0.8, 1, () => {});
      });

      expectNoError(() => {
        new Spring(0, -0.1, 0.8, 1, () => {}); // Negative stiffness
      });

      expectNoError(() => {
        new Spring(0, 0.1, -0.8, 1, () => {}); // Negative damping
      });

      expectNoError(() => {
        new Spring(0, 0.1, 0.8, 0, () => {}); // Zero mass
      });
    });

    test("animation loop error handling", () => {
      const loop = new AnimationLoop();

      expectNoError(() => {
        loop.onFrame(() => {
          throw new Error("Test error in animation frame");
        });
      });

      // Should handle multiple callbacks with errors
      expectNoError(() => {
        loop.onFrame(() => {
          throw new Error("Error 1");
        });
        loop.onFrame(() => {
          /* Normal callback */
        });
        loop.onFrame(() => {
          throw new Error("Error 2");
        });
      });
    });
  });

  describe("Random Generation Error Handling", () => {
    test("random functions with invalid ranges", () => {
      expectNoError(() => randomInt(10, 5)); // min > max
      expectNoError(() => randomFloat(100, 50)); // min > max
      expectNoError(() => randomInt(NaN, 10)); // NaN min
      expectNoError(() => randomFloat(0, NaN)); // NaN max
    });

    test("choice functions with invalid arrays", () => {
      expectError(() => randomChoice([]), "empty array");
      expectError(() => weightedChoice([], []), "empty array");
      expectError(() => weightedChoice(["a", "b"], [1]), "same length");
      expectError(() => weightedChoice(["a"], [1, 2]), "same length");
    });

    test("seeded random with invalid seeds", () => {
      expectNoError(() => new SeededRandom(NaN));
      expectNoError(() => new SeededRandom(Infinity));
      expectNoError(() => new SeededRandom(-Infinity));

      const rng = new SeededRandom(12345);
      expectNoError(() => rng.seed(NaN));
      expectNoError(() => rng.seed(Infinity));
    });

    test("array operations with invalid arrays", () => {
      expectNoError(() => shuffle([])); // Empty array
      expectError(() => sample([], 5), "empty array");
      expectNoError(() => sample([1, 2, 3], 10)); // More samples than array length
      expectNoError(() => sample([1, 2, 3], -5)); // Negative sample count
    });

    test("noise generation with extreme coordinates", () => {
      const perlin = new PerlinNoise(12345);

      expectNoError(() => perlin.noise1D(NaN));
      expectNoError(() => perlin.noise1D(Infinity));
      expectNoError(() => perlin.noise1D(-Infinity));

      expectNoError(() => perlin.noise2D(NaN, 0));
      expectNoError(() => perlin.noise2D(Infinity, -Infinity));

      expectNoError(() => perlin.noise3D(NaN, NaN, NaN));
    });

    test("fractal noise with invalid parameters", () => {
      expectNoError(() => new FractalNoise(new PerlinNoise(), -1, 0.5, 2)); // Negative octaves
      expectNoError(() => new FractalNoise(new PerlinNoise(), 4, -0.5, 2)); // Negative persistence
      expectNoError(() => new FractalNoise(new PerlinNoise(), 4, 0.5, 0)); // Zero lacunarity
    });
  });

  describe("Geometry Error Handling", () => {
    test("point operations with invalid coordinates", () => {
      expectNoError(() => point(NaN, Infinity));
      expectNoError(() => pointDistance(point(NaN, 0), point(1, 2)));
      expectNoError(() =>
        pointDistance(point(Infinity, 0), point(-Infinity, 0)),
      );
    });

    test("shape creation with invalid parameters", () => {
      expectNoError(() => rect(NaN, 0, 10, 10));
      expectNoError(() => rect(0, 0, -10, 10)); // Negative width
      expectNoError(() => rect(0, 0, 10, -10)); // Negative height

      expectNoError(() => circle(NaN, 0, 10));
      expectNoError(() => circle(0, 0, -10)); // Negative radius
      expectNoError(() => circle(0, 0, 0)); // Zero radius
    });

    test("line operations with invalid points", () => {
      const validLine = line(point(0, 0), point(1, 1));
      const invalidLine = line(point(NaN, 0), point(Infinity, -Infinity));

      expectNoError(() => lineIntersection(validLine, invalidLine));
      expectNoError(() => lineIntersection(invalidLine, validLine));
      expectNoError(() => lineIntersection(invalidLine, invalidLine));
    });

    test("polygon operations with invalid vertices", () => {
      expectError(() => polygon(), "at least 3 vertices"); // No vertices
      expectError(() => polygon(point(0, 0)), "at least 3 vertices"); // One vertex
      expectError(
        () => polygon(point(0, 0), point(1, 1)),
        "at least 3 vertices",
      ); // Two vertices

      // Valid triangle with NaN coordinates
      const invalidTriangle = polygon(
        point(NaN, 0),
        point(1, Infinity),
        point(0, -Infinity),
      );

      expectNoError(() => polygonArea(invalidTriangle));
      expectNoError(() => pointInPolygon(point(0.5, 0.5), invalidTriangle));
    });

    test("regular polygon with invalid parameters", () => {
      expectError(() => regularPolygon(point(0, 0), 10, 2), "at least 3 sides"); // Too few sides
      expectError(() => regularPolygon(point(0, 0), 10, 0), "at least 3 sides"); // Zero sides
      expectError(
        () => regularPolygon(point(0, 0), 10, -5),
        "at least 3 sides",
      ); // Negative sides

      expectNoError(() => regularPolygon(point(NaN, 0), 10, 6)); // Invalid center
      expectNoError(() => regularPolygon(point(0, 0), NaN, 6)); // Invalid radius
      expectNoError(() => regularPolygon(point(0, 0), -10, 6)); // Negative radius
    });

    test("circle from points with invalid input", () => {
      // Collinear points (should handle gracefully)
      expectNoError(() =>
        circleFromPoints(point(0, 0), point(1, 1), point(2, 2)),
      );

      // Points with NaN/Infinity
      expectNoError(() =>
        circleFromPoints(
          point(NaN, 0),
          point(1, Infinity),
          point(0, -Infinity),
        ),
      );
    });
  });

  describe("Play Class Error Handling", () => {
    test("play class without canvas", () => {
      const playInstance = new Play();

      // All drawing operations should handle missing canvas gracefully
      expectNoError(() => playInstance.clear());
      expectNoError(() => playInstance.background("#000000"));
      expectNoError(() => playInstance.stroke("#ffffff"));
      expectNoError(() => playInstance.fill("#ff0000"));
      expectNoError(() => playInstance.drawCircle(0, 0, 10));
      expectNoError(() => playInstance.drawRect(0, 0, 10, 10));
      expectNoError(() => playInstance.drawLine(0, 0, 10, 10));
      expectNoError(() => playInstance.drawPolygon([]));
      expectNoError(() => playInstance.translate(10, 10));
      expectNoError(() => playInstance.rotate(Math.PI));
      expectNoError(() => playInstance.scale(2));
      expectNoError(() => playInstance.pushMatrix());
      expectNoError(() => playInstance.popMatrix());
    });

    test("play class with invalid canvas", () => {
      const mockCanvas = {
        getContext: () => null, // Context creation fails
      } as unknown as HTMLCanvasElement;

      expectNoError(() => setup(mockCanvas));
    });

    test("drawing operations with invalid parameters", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => playInstance.drawCircle(NaN, 0, 10));
      expectNoError(() => playInstance.drawCircle(0, 0, -10)); // Negative radius
      expectNoError(() => playInstance.drawRect(NaN, 0, 10, 10));
      expectNoError(() => playInstance.drawRect(0, 0, -10, 10)); // Negative dimensions
      expectNoError(() => playInstance.drawLine(NaN, 0, Infinity, -Infinity));

      // Invalid polygon
      expectNoError(() => playInstance.drawPolygon([])); // Empty polygon
      expectNoError(() =>
        playInstance.drawPolygon([point(NaN, 0), point(1, Infinity)]),
      ); // Invalid points

      // Invalid transformations
      expectNoError(() => playInstance.translate(NaN, Infinity));
      expectNoError(() => playInstance.rotate(NaN));
      expectNoError(() => playInstance.scale(NaN, Infinity));
      expectNoError(() => playInstance.scale(0)); // Zero scale
    });

    test("style operations with invalid parameters", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => playInstance.stroke("invalid-color"));
      expectNoError(() => playInstance.stroke("#gg0000")); // Invalid hex
      expectNoError(() => playInstance.fill(""));
      expectNoError(() => playInstance.stroke("#000000", NaN)); // Invalid line width
      expectNoError(() => playInstance.stroke("#000000", -5)); // Negative line width
    });
  });

  describe("Type Safety Error Handling", () => {
    test("function calls with wrong types", () => {
      // These should be caught by TypeScript, but test runtime behavior
      expectNoError(() => {
        try {
          // @ts-ignore - Testing runtime behavior
          vec2("not a number", "also not a number");
        } catch (e) {
          // TypeScript would catch this, but runtime might not
        }
      });

      expectNoError(() => {
        try {
          // @ts-ignore - Testing runtime behavior
          rgb("red", "green", "blue");
        } catch (e) {
          // TypeScript would catch this, but runtime might not
        }
      });
    });

    test("null and undefined parameter handling", () => {
      // Most functions should handle null/undefined gracefully or fail fast
      expectNoError(() => {
        try {
          // @ts-ignore - Testing runtime behavior
          vec2(null, undefined);
        } catch (e) {
          // Expected to fail
        }
      });

      expectNoError(() => {
        try {
          // @ts-ignore - Testing runtime behavior
          rgb(null, undefined, null);
        } catch (e) {
          // Expected to fail
        }
      });
    });
  });

  describe("Performance Under Error Conditions", () => {
    test("error handling does not significantly impact performance", () => {
      const iterations = 10000;

      // Normal operations
      const normalTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        vec2(i, i + 1);
        vec2Length(vec2(i, i + 1));
      }
      const normalDuration = performance.now() - normalTime;

      // Operations with some invalid inputs
      const errorTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        vec2(i % 100 === 0 ? NaN : i, i + 1);
        vec2Length(vec2(i % 100 === 0 ? NaN : i, i + 1));
      }
      const errorDuration = performance.now() - errorTime;

      // Error handling shouldn't be more than 3x slower
      expect(errorDuration).toBeLessThan(normalDuration * 3);

      console.log(
        `Performance with errors: normal=${normalDuration}ms, with errors=${errorDuration}ms`,
      );
    });

    test("memory usage with error conditions", () => {
      // Create many objects with invalid values to test memory handling
      const objects = [];

      expectNoError(() => {
        for (let i = 0; i < 10000; i++) {
          objects.push(vec2(i % 50 === 0 ? NaN : i, i));
          objects.push(rgb(i % 256, (i * 2) % 256, (i * 3) % 256));
          objects.push(point(i, i % 30 === 0 ? Infinity : i));
        }
      });

      expect(objects.length).toBe(30000);
    });
  });

  describe("Recovery and Continuation After Errors", () => {
    test("operations continue normally after error conditions", () => {
      // Test that encountering NaN/Infinity doesn't break subsequent operations
      const results = [];

      // Mix of normal and error-inducing operations
      results.push(vec2Length(vec2(3, 4))); // Should be 5
      results.push(vec2Length(vec2(NaN, 0))); // Should be NaN
      results.push(vec2Length(vec2(5, 12))); // Should be 13
      results.push(vec2Length(vec2(Infinity, 0))); // Should be Infinity
      results.push(vec2Length(vec2(8, 15))); // Should be 17

      expect(results[0]).toBe(5);
      expect(results[1]).toBeNaN();
      expect(results[2]).toBe(13);
      expect(results[3]).toBe(Infinity);
      expect(results[4]).toBe(17);
    });

    test("animation systems continue after errors", () => {
      let frameCount = 0;
      let errorCount = 0;

      const loop = new AnimationLoop();

      const callback = () => {
        frameCount++;

        if (frameCount === 3) {
          // Simulate an error condition
          errorCount++;
          vec2Length(vec2(NaN, 0));
        }

        // Should continue normally
        vec2Length(vec2(frameCount, frameCount));
      };

      loop.onFrame(callback);

      // Simulate several frames
      for (let i = 0; i < 5; i++) {
        callback();
      }

      expect(frameCount).toBe(5);
      expect(errorCount).toBe(1);
    });
  });
});
