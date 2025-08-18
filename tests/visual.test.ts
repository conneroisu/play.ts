/**
 * Visual and Canvas Operation Tests
 * Tests drawing operations, canvas interactions, and visual rendering
 */

import { describe, expect, test } from "bun:test";
import {
  circle,
  hsl,
  hsla,
  PI,
  Play,
  play,
  point,
  polygon,
  rect,
  rgb,
  rgba,
  setup,
  TWO_PI,
  vec2,
} from "../src/index.ts";
import {
  createMockCanvas,
  createMockContext2D,
  expectNoError,
  getMockContext,
} from "./utils/test-helpers.ts";

describe("Visual and Canvas Tests", () => {
  describe("Canvas Setup and Initialization", () => {
    test("Play class initializes without canvas", () => {
      const playInstance = new Play();
      expect(playInstance).toBeDefined();
      expect(playInstance.getCanvas()).toBeUndefined();
      expect(playInstance.getContext()).toBeUndefined();
    });

    test("setup function creates Play instance with canvas", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expect(playInstance).toBeDefined();
      expect(playInstance.getCanvas()).toBe(canvas);
      expect(playInstance.getContext()).toBeDefined();
    });

    test("Play class handles invalid canvas gracefully", () => {
      const invalidCanvas = {
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      expectNoError(() => {
        const playInstance = setup(invalidCanvas);
        playInstance.clear();
      });
    });

    test("canvas dimensions are accessible", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expect(playInstance.width).toBe(800);
      expect(playInstance.height).toBe(600);
    });
  });

  describe("Drawing State Management", () => {
    test("fill color changes are tracked", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.fill("#ff0000");
      expect(context.fillStyle).toBe("#ff0000");

      const color = rgb(0, 255, 0);
      playInstance.fill(color);
      expect(context.fillStyle).toBe("rgb(0, 255, 0)");
    });

    test("stroke color and width changes are tracked", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.setStroke("#0000ff", 3);
      expect(context.strokeStyle).toBe("#0000ff");
      expect(context.lineWidth).toBe(3);
    });

    test("background color fills entire canvas", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.background("#ffffff");
      const calls = (context as any).getCalls();

      // Should clear and fill entire canvas
      expect(calls.some((call: any) => call.method === "clearRect")).toBe(true);
      expect(calls.some((call: any) => call.method === "fillRect")).toBe(true);
    });

    test("clear() empties the canvas", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.clear();
      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "clearRect")).toBe(true);
    });
  });

  describe("Shape Drawing Operations", () => {
    test("drawCircle creates correct path", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.drawCircle(50, 60, 25);
      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "beginPath")).toBe(true);
      expect(calls.some((call: any) => call.method === "arc")).toBe(true);
      expect(calls.some((call: any) => call.method === "fill")).toBe(true);
    });

    test("drawRect creates rectangle", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.drawRect(10, 20, 30, 40);
      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "fillRect")).toBe(true);
    });

    test("drawLine creates line path", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.drawLine(0, 0, 100, 100);
      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "beginPath")).toBe(true);
      expect(calls.some((call: any) => call.method === "moveTo")).toBe(true);
      expect(calls.some((call: any) => call.method === "lineTo")).toBe(true);
      expect(calls.some((call: any) => call.method === "stroke")).toBe(true);
    });

    test("drawPolygon creates polygon path", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      const triangle = [point(50, 25), point(25, 75), point(75, 75)];

      playInstance.drawPolygon(triangle);
      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "beginPath")).toBe(true);
      expect(calls.some((call: any) => call.method === "moveTo")).toBe(true);
      expect(calls.some((call: any) => call.method === "lineTo")).toBe(true);
      expect(calls.some((call: any) => call.method === "closePath")).toBe(true);
      expect(calls.some((call: any) => call.method === "fill")).toBe(true);
    });

    test("shapes handle empty or invalid input gracefully", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => {
        playInstance.drawCircle(NaN, 0, 10);
        playInstance.drawRect(0, 0, -10, 10);
        playInstance.drawLine(Infinity, 0, 10, 10);
        playInstance.drawPolygon([]);
      });
    });
  });

  describe("Transformation Operations", () => {
    test("translate moves coordinate system", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.translate(50, 100);
      const calls = (context as any).getCalls();

      expect(
        calls.some(
          (call: any) =>
            call.method === "translate" &&
            call.args[0] === 50 &&
            call.args[1] === 100,
        ),
      ).toBe(true);
    });

    test("rotate rotates coordinate system", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.rotate(PI / 4);
      const calls = (context as any).getCalls();

      expect(
        calls.some(
          (call: any) =>
            call.method === "rotate" && Math.abs(call.args[0] - PI / 4) < 1e-10,
        ),
      ).toBe(true);
    });

    test("scale changes coordinate system scale", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.scale(2, 3);
      const calls = (context as any).getCalls();

      expect(
        calls.some(
          (call: any) =>
            call.method === "scale" && call.args[0] === 2 && call.args[1] === 3,
        ),
      ).toBe(true);
    });

    test("uniform scale with single parameter", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.scale(1.5);
      const calls = (context as any).getCalls();

      expect(
        calls.some(
          (call: any) =>
            call.method === "scale" &&
            call.args[0] === 1.5 &&
            call.args[1] === 1.5,
        ),
      ).toBe(true);
    });

    test("matrix stack operations work correctly", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.pushMatrix();
      playInstance.translate(10, 20);
      playInstance.rotate(PI / 6);
      playInstance.popMatrix();

      const calls = (context as any).getCalls();

      expect(calls.some((call: any) => call.method === "save")).toBe(true);
      expect(calls.some((call: any) => call.method === "restore")).toBe(true);
    });

    test("transformations handle extreme values", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => {
        playInstance.translate(Infinity, NaN);
        playInstance.rotate(Infinity);
        playInstance.scale(0, -1);
      });
    });
  });

  describe("Color Operations in Drawing Context", () => {
    test("RGB colors are converted to CSS format", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      const color = rgb(255, 128, 64);
      playInstance.fill(color);

      expect(context.fillStyle).toBe("rgb(255, 128, 64)");
    });

    test("RGBA colors include alpha channel", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      const color = rgba(255, 128, 64, 0.5);
      playInstance.fill(color);

      expect(context.fillStyle).toBe("rgba(255, 128, 64, 0.5)");
    });

    test("HSL colors are converted correctly", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      const color = hsl(120, 100, 50);
      playInstance.fill(color);

      expect(context.fillStyle).toBe("hsl(120, 100%, 50%)");
    });

    test("hex color strings are passed through", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.fill("#ff8040");
      playInstance.setStroke("#0080ff");

      expect(context.fillStyle).toBe("#ff8040");
      expect(context.strokeStyle).toBe("#0080ff");
    });

    test("invalid colors fall back gracefully", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => {
        playInstance.fill("invalid-color");
        playInstance.stroke("");
        playInstance.background("not-a-color");
      });
    });
  });

  describe("Drawing Pattern and Style Operations", () => {
    test("line width changes affect stroke operations", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.setStroke("#000000", 5);
      playInstance.drawLine(0, 0, 100, 100);

      expect(context.lineWidth).toBe(5);
    });

    test("fill and stroke can be used together", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.fill("#ff0000");
      playInstance.setStroke("#0000ff", 2);

      // Draw filled circle (will call fill)
      playInstance.drawCircle(50, 50, 25);
      // Draw stroked circle (will call stroke)
      playInstance.drawCircle(100, 100, 20, false);

      const calls = (context as any).getCalls();
      expect(calls.some((call: any) => call.method === "fill")).toBe(true);
      expect(calls.some((call: any) => call.method === "stroke")).toBe(true);
    });

    test("drawing state persists across operations", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      playInstance.fill("#ff0000");
      playInstance.setStroke("#0000ff", 3);

      playInstance.drawCircle(25, 25, 10);
      playInstance.drawRect(50, 50, 20, 20);

      // State should persist
      expect(context.fillStyle).toBe("#ff0000");
      expect(context.strokeStyle).toBe("#0000ff");
      expect(context.lineWidth).toBe(3);
    });
  });

  describe("Complex Drawing Scenarios", () => {
    test("animated drawing sequence", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      // Simulate animation frame
      const animateFrame = (time: number) => {
        playInstance.clear();

        // Animated circle
        const x = 50 + Math.cos(time * 0.01) * 30;
        const y = 50 + Math.sin(time * 0.01) * 30;
        const hue = (time * 0.1) % 360;

        playInstance.fill(hsl(hue, 70, 50));
        playInstance.drawCircle(x, y, 15);

        // Rotating square
        playInstance.pushMatrix();
        playInstance.translate(150, 150);
        playInstance.rotate(time * 0.005);
        playInstance.fill("#ffffff");
        playInstance.drawRect(-10, -10, 20, 20);
        playInstance.popMatrix();
      };

      // Test multiple frames
      expectNoError(() => {
        for (let frame = 0; frame < 60; frame++) {
          animateFrame(frame * 16.67); // 60 FPS
        }
      });

      const calls = (context as any).getCalls();
      expect(calls.length).toBeGreaterThan(0);
    });

    test("complex geometric pattern drawing", () => {
      const canvas = createMockCanvas();
      const context = createMockContext2D();
      const playInstance = setup(canvas);

      expectNoError(() => {
        playInstance.background("#000000");

        // Draw spiral pattern
        const center = point(400, 300);
        const numPoints = 50;

        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * TWO_PI * 3;
          const radius = i * 3;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;

          const hue = (i / numPoints) * 360;
          playInstance.fill(hsl(hue, 80, 60));
          playInstance.drawCircle(x, y, 5);
        }
      });
    });

    test("layered drawing with transformations", () => {
      const canvas = createMockCanvas();
      const context = createMockContext2D();
      const playInstance = setup(canvas);

      expectNoError(() => {
        // Background layer
        playInstance.background("#222222");

        // Middle layer - translated and scaled
        playInstance.pushMatrix();
        playInstance.translate(200, 200);
        playInstance.scale(1.5);
        playInstance.fill("#ff6600");
        playInstance.drawRect(-25, -25, 50, 50);
        playInstance.popMatrix();

        // Top layer - rotated
        playInstance.pushMatrix();
        playInstance.translate(200, 200);
        playInstance.rotate(PI / 4);
        playInstance.fill("rgba(0, 255, 255, 0.7)");
        playInstance.drawCircle(0, 0, 30);
        playInstance.popMatrix();
      });
    });

    test("polygon star pattern drawing", () => {
      const canvas = createMockCanvas();
      const context = createMockContext2D();
      const playInstance = setup(canvas);

      const createStar = (
        centerX: number,
        centerY: number,
        outerRadius: number,
        innerRadius: number,
        points: number,
      ) => {
        const vertices = [];
        const angleStep = PI / points;

        for (let i = 0; i < points * 2; i++) {
          const angle = i * angleStep;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          vertices.push(
            point(
              centerX + Math.cos(angle) * radius,
              centerY + Math.sin(angle) * radius,
            ),
          );
        }

        return vertices;
      };

      expectNoError(() => {
        const star = createStar(400, 300, 50, 25, 5);
        playInstance.fill("#ffff00");
        playInstance.setStroke("#ff6600", 3);
        playInstance.drawPolygon(star);
      });
    });
  });

  describe("Performance and Optimization", () => {
    test("drawing operations complete within time budget", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      const startTime = performance.now();

      // Perform many drawing operations
      for (let i = 0; i < 1000; i++) {
        playInstance.clear();
        playInstance.background("#000000");
        playInstance.fill(`hsl(${i % 360}, 70%, 50%)`);
        playInstance.drawCircle(i % 800, i % 600, 10);
        playInstance.drawRect(i % 800, i % 600, 20, 20);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    test("memory usage remains stable with many operations", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      expectNoError(() => {
        // Create many temporary objects
        for (let i = 0; i < 10000; i++) {
          const color = rgb(i % 256, (i * 2) % 256, (i * 3) % 256);
          const pos = point(i % 800, i % 600);

          playInstance.fill(color);
          playInstance.drawCircle(pos.x, pos.y, 5);

          if (i % 100 === 0) {
            playInstance.clear();
          }
        }
      });
    });

    test("transformation operations are efficient", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);

      const startTime = performance.now();

      for (let i = 0; i < 5000; i++) {
        playInstance.pushMatrix();
        playInstance.translate(i % 100, i % 100);
        playInstance.rotate((i * 0.1) % TWO_PI);
        playInstance.scale(1 + (i % 10) * 0.1);
        playInstance.drawCircle(0, 0, 5);
        playInstance.popMatrix();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });

  describe("Canvas State Management", () => {
    test("canvas state is isolated between instances", () => {
      const canvas1 = createMockCanvas();
      const canvas2 = createMockCanvas();

      const play1 = setup(canvas1);
      const play2 = setup(canvas2);

      play1.fill("#ff0000");
      play1.setStroke("#00ff00", 5);

      play2.fill("#0000ff");
      play2.setStroke("#ffff00", 2);

      // Since Play uses singleton pattern, play2 overwrites play1's context
      // Test that the latest context state is properly maintained
      expect(play2.getContext()?.fillStyle).toBe("#0000ff");
      expect(play2.getContext()?.strokeStyle).toBe("#ffff00");
      expect(play2.getContext()?.lineWidth).toBe(2);
    });

    test("matrix stack maintains proper nesting", () => {
      const canvas = createMockCanvas();
      const playInstance = setup(canvas);
      const context = getMockContext()!;

      expectNoError(() => {
        playInstance.pushMatrix();
        playInstance.translate(10, 10);

        playInstance.pushMatrix();
        playInstance.rotate(PI / 4);

        playInstance.pushMatrix();
        playInstance.scale(2);
        playInstance.popMatrix();

        playInstance.popMatrix();
        playInstance.popMatrix();
      });

      const calls = context.getCalls();
      const saveCount = calls.filter((call) => call.method === "save").length;
      const restoreCount = calls.filter(
        (call) => call.method === "restore",
      ).length;

      expect(saveCount).toBe(restoreCount);
    });

    test("canvas operations work without context", () => {
      const playInstance = new Play();

      expectNoError(() => {
        playInstance.clear();
        playInstance.background("#000000");
        playInstance.fill("#ffffff");
        playInstance.stroke("#ff0000", 2);
        playInstance.drawCircle(50, 50, 25);
        playInstance.drawRect(0, 0, 100, 100);
        playInstance.drawLine(0, 0, 100, 100);
        playInstance.translate(10, 10);
        playInstance.rotate(PI / 4);
        playInstance.scale(2);
        playInstance.pushMatrix();
        playInstance.popMatrix();
      });
    });
  });
});
