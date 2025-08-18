import { describe, expect, test } from "bun:test";
import playCore, {
  AnimationLoop,
  circle,
  // Math exports
  clamp,
  colors,
  easeInQuad,
  hsl,
  hsla,
  info,
  lerp,
  // Animation exports
  linear,
  PerlinNoise,
  PI,
  // Main classes
  Play,
  play,
  // Geometry exports
  point,
  pointInRect,
  randomFloat,
  // Random exports
  randomInt,
  rect,
  // Color exports
  rgb,
  rgba,
  SeededRandom,
  setup,
  TWO_PI,
  Tween,
  vec2,
  vec3,
  // Meta exports
  version,
} from "../src/index.ts";

describe("Main library exports", () => {
  describe("Default export structure", () => {
    test("default export contains all modules", () => {
      expect(playCore).toBeDefined();
      expect(playCore.math).toBeDefined();
      expect(playCore.color).toBeDefined();
      expect(playCore.animation).toBeDefined();
      expect(playCore.random).toBeDefined();
      expect(playCore.geometry).toBeDefined();
    });

    test("default export contains utility classes", () => {
      expect(playCore.Play).toBe(Play);
      expect(playCore.play).toBe(play);
      expect(playCore.setup).toBe(setup);
    });

    test("default export contains meta info", () => {
      expect(playCore.version).toBe(version);
      expect(playCore.info).toBe(info);
    });
  });

  describe("Named exports availability", () => {
    test("math utilities are exported", () => {
      expect(clamp).toBeDefined();
      expect(typeof clamp).toBe("function");
      expect(clamp(5, 0, 10)).toBe(5);

      expect(lerp).toBeDefined();
      expect(typeof lerp).toBe("function");
      expect(lerp(0, 10, 0.5)).toBe(5);

      expect(vec2).toBeDefined();
      expect(typeof vec2).toBe("function");
      const v = vec2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);

      expect(vec3).toBeDefined();
      expect(typeof vec3).toBe("function");

      expect(PI).toBe(Math.PI);
      expect(TWO_PI).toBe(Math.PI * 2);
    });

    test("color utilities are exported", () => {
      expect(rgb).toBeDefined();
      expect(typeof rgb).toBe("function");
      const color = rgb(255, 128, 64);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);

      expect(rgba).toBeDefined();
      expect(hsl).toBeDefined();
      expect(hsla).toBeDefined();
      expect(colors).toBeDefined();
      expect(colors.red).toEqual({
        r: 255,
        g: 0,
        b: 0,
      });
    });

    test("animation utilities are exported", () => {
      expect(linear).toBeDefined();
      expect(typeof linear).toBe("function");
      expect(linear(0.5)).toBe(0.5);

      expect(easeInQuad).toBeDefined();
      expect(typeof easeInQuad).toBe("function");

      expect(AnimationLoop).toBeDefined();
      expect(Tween).toBeDefined();
    });

    test("random utilities are exported", () => {
      expect(randomInt).toBeDefined();
      expect(typeof randomInt).toBe("function");

      expect(randomFloat).toBeDefined();
      expect(typeof randomFloat).toBe("function");

      expect(SeededRandom).toBeDefined();
      expect(PerlinNoise).toBeDefined();
    });

    test("geometry utilities are exported", () => {
      expect(point).toBeDefined();
      expect(typeof point).toBe("function");
      const p = point(3, 4);
      expect(p.x).toBe(3);
      expect(p.y).toBe(4);

      expect(rect).toBeDefined();
      expect(typeof rect).toBe("function");

      expect(circle).toBeDefined();
      expect(typeof circle).toBe("function");

      expect(pointInRect).toBeDefined();
      expect(typeof pointInRect).toBe("function");
    });
  });

  describe("Play class and instance", () => {
    test("Play class is exported", () => {
      expect(Play).toBeDefined();
      expect(typeof Play).toBe("function");
    });

    test("play instance is singleton", () => {
      expect(play).toBeDefined();
      expect(play).toBeInstanceOf(Play);
      expect(Play.getInstance()).toBe(play);
    });

    test("setup function creates Play instance", () => {
      // Mock canvas element
      const mockCanvas = {
        getContext: () => ({}),
      } as HTMLCanvasElement;

      const playInstance = setup(mockCanvas);
      expect(playInstance).toBeInstanceOf(Play);
      expect(playInstance).toBe(play);
    });

    test("Play instance has expected methods", () => {
      expect(typeof play.setCanvas).toBe("function");
      expect(typeof play.getCanvas).toBe("function");
      expect(typeof play.getContext).toBe("function");
      expect(typeof play.start).toBe("function");
      expect(typeof play.play).toBe("function");
      expect(typeof play.pause).toBe("function");
      expect(typeof play.clear).toBe("function");
      expect(typeof play.background).toBe("function");
      expect(typeof play.stroke).toBe("function");
      expect(typeof play.fill).toBe("function");
      expect(typeof play.noStroke).toBe("function");
      expect(typeof play.noFill).toBe("function");
      expect(typeof play.drawCircle).toBe("function");
      expect(typeof play.drawRect).toBe("function");
      expect(typeof play.drawLine).toBe("function");
      expect(typeof play.drawPolygon).toBe("function");
      expect(typeof play.drawText).toBe("function");
      expect(typeof play.translate).toBe("function");
      expect(typeof play.rotate).toBe("function");
      expect(typeof play.scale).toBe("function");
      expect(typeof play.pushMatrix).toBe("function");
      expect(typeof play.popMatrix).toBe("function");
    });
  });

  describe("Library metadata", () => {
    test("version is defined", () => {
      expect(version).toBe("1.0.0");
      expect(typeof version).toBe("string");
    });

    test("info contains library metadata", () => {
      expect(info).toBeDefined();
      expect(info.name).toBe("play.ts");
      expect(info.version).toBe(version);
      expect(info.description).toBeDefined();
      expect(info.author).toBeDefined();
      expect(info.license).toBe("MIT");
      expect(info.modules).toBeDefined();
      expect(info.modules.math).toBeDefined();
      expect(info.modules.color).toBeDefined();
      expect(info.modules.animation).toBeDefined();
      expect(info.modules.random).toBeDefined();
      expect(info.modules.geometry).toBeDefined();
    });
  });

  describe("Module integration", () => {
    test("modules work together - vector math with colors", () => {
      const position = vec2(10, 20);
      const color = rgb(255, 128, 64);

      // Should be able to use both together
      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(color.r).toBe(255);
    });

    test("modules work together - geometry with random", () => {
      const center = point(0, 0);
      const radius = 10;
      const c = circle(center.x, center.y, radius);

      // Generate random point and test collision
      const testPoint = point(5, 0);
      const isInside = pointInRect(testPoint, rect(-1, -1, 2, 2));

      expect(c.radius).toBe(radius);
      expect(typeof isInside).toBe("boolean");
    });

    test("modules work together - animation with math", () => {
      const startValue = 0;
      const endValue = 100;
      const t = 0.5;

      const linearInterpolated = lerp(startValue, endValue, linear(t));
      const easedInterpolated = lerp(startValue, endValue, easeInQuad(t));

      expect(linearInterpolated).toBe(50);
      expect(easedInterpolated).toBe(25); // easeInQuad(0.5) = 0.25
    });

    test("type definitions work correctly", () => {
      // Test that TypeScript types are working by using typed functions
      const p1 = point(0, 0);
      const p2 = point(3, 4);
      const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

      expect(distance).toBe(5);

      const color1 = rgb(255, 0, 0);
      const color2 = rgb(0, 255, 0);
      const blended = {
        r: (color1.r + color2.r) / 2,
        g: (color1.g + color2.g) / 2,
        b: (color1.b + color2.b) / 2,
      };

      expect(blended.r).toBe(127.5);
      expect(blended.g).toBe(127.5);
      expect(blended.b).toBe(0);
    });
  });

  describe("Error handling", () => {
    test("functions handle edge cases gracefully", () => {
      // Test clamp with invalid ranges
      expect(clamp(5, 10, 0)).toBe(5); // min > max should swap to (0, 10), so 5 stays 5

      // Test lerp with t outside [0,1]
      expect(lerp(0, 10, -0.5)).toBe(-5);
      expect(lerp(0, 10, 1.5)).toBe(15);

      // Test color creation with out-of-range values
      const color = rgb(-50, 300, 128);
      expect(color.r).toBe(0);
      expect(color.g).toBe(255);
      expect(color.b).toBe(128);
    });

    test("Play class methods handle missing canvas gracefully", () => {
      // Play class already has built-in null checks for canvas and context
      expect(() => {
        const playInstance = new Play();
        playInstance.clear();
        playInstance.background("#000000");
        playInstance.stroke("#ffffff");
        playInstance.fill("#ff0000");
        playInstance.drawCircle(0, 0, 10);
        playInstance.drawRect(0, 0, 10, 10);
        playInstance.drawLine(0, 0, 10, 10);
      }).not.toThrow();
    });
  });

  describe("Performance considerations", () => {
    test("commonly used functions are fast", () => {
      const iterations = 1000;

      // Test math operations
      const startMath = performance.now();
      for (let i = 0; i < iterations; i++) {
        clamp(i, 0, 500);
        lerp(0, 100, i / iterations);
        vec2(i, i + 1);
      }
      const mathTime = performance.now() - startMath;

      // Test color operations
      const startColor = performance.now();
      for (let i = 0; i < iterations; i++) {
        rgb(i % 256, (i * 2) % 256, (i * 3) % 256);
      }
      const colorTime = performance.now() - startColor;

      // These operations should be fast (less than 100ms for 1000 iterations)
      expect(mathTime).toBeLessThan(100);
      expect(colorTime).toBeLessThan(100);
    });
  });
});
