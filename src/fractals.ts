/**
 * Fractal generation and L-Systems for procedural art and natural pattern creation.
 *
 * This module provides comprehensive tools for generating fractal patterns, implementing
 * L-Systems (Lindenmayer Systems), and creating complex procedural structures commonly
 * used in generative art, digital biology simulation, and nature-inspired graphics.
 *
 * @remarks
 * The fractals system encompasses several powerful paradigms:
 *
 * **L-Systems (Lindenmayer Systems):**
 * - Rule-based rewriting systems for modeling growth patterns
 * - Originally developed for modeling plant development
 * - Create complex structures from simple rules
 * - Support branching, recursive patterns, and organic growth
 *
 * **Turtle Graphics:**
 * - Logo-style drawing system for visualizing L-Systems
 * - State-based drawing with position, angle, and pen control
 * - Stack-based state management for branching structures
 * - Ideal for plant-like and organic pattern visualization
 *
 * **Classic Fractals:**
 * - Mathematical fractals (Mandelbrot, Julia sets)
 * - Geometric fractals (Sierpinski triangle, Koch snowflake)
 * - Natural fractals (Barnsley fern, fractal trees)
 * - Escape-time algorithms for complex plane exploration
 *
 * **Procedural Patterns:**
 * - Self-similar structures at multiple scales
 * - Recursive algorithms for infinite detail
 * - Natural-looking organic patterns
 * - Efficient generation of complex geometry
 *
 * @example
 * Basic L-System plant growth:
 * ```typescript
 * import { LSystem, Turtle, LSystemInterpreter } from 'play.ts';
 *
 * // Create L-System for plant-like structure
 * const plant = new LSystem('F', [
 *   { symbol: 'F', replacement: 'FF+[+F-F-F]-[-F+F+F]' }
 * ]);
 *
 * // Grow for several generations
 * plant.iterate(4);
 *
 * // Visualize with turtle graphics
 * const turtle = new Turtle(200, 400, -90); // Start at bottom, facing up
 * const interpreter = new LSystemInterpreter(turtle);
 *
 * interpreter.interpret(plant.getString(), {
 *   'F': () => turtle.forward(10),
 *   '+': () => turtle.right(25),
 *   '-': () => turtle.left(25),
 *   '[': () => turtle.push(),
 *   ']': () => turtle.pop()
 * });
 *
 * // Get the path for rendering
 * const plantPath = turtle.getPath();
 * ```
 *
 * @example
 * Mandelbrot set exploration:
 * ```typescript
 * import { mandelbrot, mandelbrotSet } from 'play.ts';
 *
 * // Generate Mandelbrot set data
 * const width = 800, height = 600;
 * const zoom = 1, centerX = -0.5, centerY = 0;
 *
 * const fractalData = mandelbrotSet(
 *   width, height,
 *   centerX, centerY,
 *   zoom, 100  // Max iterations
 * );
 *
 * // Render with custom coloring
 * for (let y = 0; y < height; y++) {
 *   for (let x = 0; x < width; x++) {
 *     const iterations = fractalData[y * width + x];
 *     const color = iterations === 100 ? 'black' : `hsl(${iterations * 3}, 70%, 50%)`;
 *     drawPixel(x, y, color);
 *   }
 * }
 * ```
 *
 * @example
 * Recursive fractal tree:
 * ```typescript
 * import { fractalTree } from 'play.ts';
 *
 * const drawTree = (ctx: CanvasRenderingContext2D) => {
 *   const branches = fractalTree(
 *     vec2(400, 500),  // Root position
 *     -90,             // Initial angle (up)
 *     100,             // Initial length
 *     8,               // Recursion depth
 *     0.7,             // Length reduction factor
 *     30               // Branch angle
 *   );
 *
 *   branches.forEach(branch => {
 *     ctx.beginPath();
 *     ctx.moveTo(branch.start.x, branch.start.y);
 *     ctx.lineTo(branch.end.x, branch.end.y);
 *     ctx.stroke();
 *   });
 * };
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/L-system | L-Systems (Wikipedia)}
 * @see {@link https://en.wikipedia.org/wiki/Turtle_graphics | Turtle Graphics}
 * @see {@link https://en.wikipedia.org/wiki/Mandelbrot_set | Mandelbrot Set}
 * @see {@link http://algorithmicbotany.org/papers/abop/abop.pdf | The Algorithmic Beauty of Plants}
 */

import type { Point, Vector2 } from "../types/index.ts";
import { radians, vec2, vec2Add, vec2Mul } from "./math.ts";

// ============================================================================
// L-Systems (Lindenmayer Systems)
// ============================================================================

/**
 * Represents a single rewriting rule in an L-System.
 *
 * @interface
 */
export interface LSystemRule {
  /** The symbol to be replaced */
  symbol: string;
  /** The string that replaces the symbol */
  replacement: string;
}

/**
 * L-System (Lindenmayer System) for modeling growth and branching patterns.
 *
 * @remarks
 * L-Systems are parallel rewriting systems that can model the growth processes
 * of plants, fractals, and other recursive structures. They work by:
 *
 * 1. Starting with an initial string (axiom)
 * 2. Applying rewriting rules in parallel to all symbols
 * 3. Iterating to create increasingly complex patterns
 * 4. Interpreting the final string to create visual output
 *
 * **Common L-System patterns:**
 * - **Plant growth**: Branching structures with leaves and flowers
 * - **Fractal curves**: Koch curves, Dragon curves, Hilbert curves
 * - **Cellular patterns**: Division and growth simulation
 * - **Architectural structures**: Building layouts and urban planning
 *
 * @example
 * Classic algae growth L-System:
 * ```typescript
 * const algae = new LSystem('A', [
 *   { symbol: 'A', replacement: 'AB' },
 *   { symbol: 'B', replacement: 'A' }
 * ]);
 *
 * console.log(algae.getString());      // "A"
 * algae.iterate(1);
 * console.log(algae.getString());      // "AB"
 * algae.iterate(1);
 * console.log(algae.getString());      // "ABA"
 * algae.iterate(1);
 * console.log(algae.getString());      // "ABAAB"
 * ```
 *
 * @example
 * Binary tree L-System:
 * ```typescript
 * const binaryTree = new LSystem('0', [
 *   { symbol: '1', replacement: '11' },
 *   { symbol: '0', replacement: '1[0]0' }
 * ]);
 *
 * binaryTree.iterate(3);
 * // Creates: "111[11[1[0]0]1[0]0]11[1[0]0]1[0]0"
 * ```
 */
export class LSystem {
  /** The initial string (starting state) */
  axiom: string;
  /** Map of rewriting rules */
  rules: Map<string, string>;
  /** Current string after iterations */
  current: string;
  /** Number of iterations performed */
  generation: number;

  /**
   * Creates a new L-System with the given axiom and rules.
   *
   * @param axiom - Initial string to start the system
   * @param rules - Array of rewriting rules
   */
  constructor(axiom: string, rules: LSystemRule[] = []) {
    this.axiom = axiom;
    this.rules = new Map();
    this.current = axiom;
    this.generation = 0;

    for (const rule of rules) {
      this.rules.set(rule.symbol, rule.replacement);
    }
  }

  /**
   * Adds a new rewriting rule to the L-System.
   *
   * @param symbol - Symbol to be replaced
   * @param replacement - String to replace the symbol with
   */
  addRule(symbol: string, replacement: string): void {
    this.rules.set(symbol, replacement);
  }

  /**
   * Evolves the L-System by applying rewriting rules for the specified generations.
   *
   * @param generations - Number of iterations to perform (default: 1)
   * @returns The resulting string after evolution
   *
   * @remarks
   * Each iteration applies all rules in parallel to every symbol in the current
   * string. This parallel application is what gives L-Systems their power to
   * model simultaneous growth processes.
   *
   * @example
   * ```typescript
   * const system = new LSystem('F', [
   *   { symbol: 'F', replacement: 'F+F-F-F+F' }
   * ]);
   *
   * system.iterate(1);  // "F+F-F-F+F"
   * system.iterate(2);  // Very long string with complex pattern
   * ```
   */
  iterate(generations: number = 1): string {
    for (let i = 0; i < generations; i++) {
      let next = "";
      for (const symbol of this.current) {
        next += this.rules.get(symbol) || symbol;
      }
      this.current = next;
      this.generation++;
    }
    return this.current;
  }

  /**
   * Resets the L-System to its initial state (axiom).
   */
  reset(): void {
    this.current = this.axiom;
    this.generation = 0;
  }

  /**
   * Gets the current string representation of the L-System.
   *
   * @returns Current evolved string
   */
  getString(): string {
    return this.current;
  }

  /**
   * Gets the current generation number (number of iterations performed).
   *
   * @returns Current generation count
   */
  getGeneration(): number {
    return this.generation;
  }
}

// Turtle graphics for L-System visualization
export class Turtle {
  position: Vector2;
  angle: number;
  stack: Array<{
    position: Vector2;
    angle: number;
  }>;
  path: Vector2[];
  penDown: boolean;

  constructor(x: number = 0, y: number = 0, angle: number = 0) {
    this.position = vec2(x, y);
    this.angle = angle;
    this.stack = [];
    this.path = [];
    this.penDown = true;
  }

  forward(distance: number): void {
    const newPosition = vec2Add(
      this.position,
      vec2(Math.cos(this.angle) * distance, Math.sin(this.angle) * distance),
    );

    if (this.penDown) {
      this.path.push({
        ...this.position,
      });
      this.path.push({
        ...newPosition,
      });
    }

    this.position = newPosition;
  }

  turn(angle: number): void {
    this.angle += angle;
  }

  turnLeft(angle: number): void {
    this.turn(-angle);
  }

  turnRight(angle: number): void {
    this.turn(angle);
  }

  push(): void {
    this.stack.push({
      position: {
        ...this.position,
      },
      angle: this.angle,
    });
  }

  pop(): void {
    const state = this.stack.pop();
    if (state) {
      this.position = state.position;
      this.angle = state.angle;
    }
  }

  penUp(): void {
    this.penDown = false;
  }

  penDownFn(): void {
    this.penDown = true;
  }

  getPath(): Vector2[] {
    return this.path;
  }

  reset(x: number = 0, y: number = 0, angle: number = 0): void {
    this.position = vec2(x, y);
    this.angle = angle;
    this.stack = [];
    this.path = [];
    this.penDown = true;
  }
}

// Predefined L-Systems
export const lSystems = {
  // Koch curve
  koch: new LSystem("F", [
    {
      symbol: "F",
      replacement: "F+F-F-F+F",
    },
  ]),

  // Sierpinski triangle
  sierpinski: new LSystem("F-G-G", [
    {
      symbol: "F",
      replacement: "F-G+F+G-F",
    },
    {
      symbol: "G",
      replacement: "GG",
    },
  ]),

  // Dragon curve
  dragon: new LSystem("FX", [
    {
      symbol: "X",
      replacement: "X+YF+",
    },
    {
      symbol: "Y",
      replacement: "-FX-Y",
    },
  ]),

  // Plant-like structure
  plant: new LSystem("X", [
    {
      symbol: "X",
      replacement: "F+[[X]-X]-F[-FX]+X",
    },
    {
      symbol: "F",
      replacement: "FF",
    },
  ]),

  // Fractal tree
  tree: new LSystem("F", [
    {
      symbol: "F",
      replacement: "F[+F]F[-F]F",
    },
  ]),

  // Cantor set
  cantor: new LSystem("F", [
    {
      symbol: "F",
      replacement: "F F",
    },
    {
      symbol: " ",
      replacement: "   ",
    },
  ]),
};

// L-System interpreter
export interface TurtleCommand {
  symbol: string;
  action: (turtle: Turtle, params?: any) => void;
}

export class LSystemInterpreter {
  commands: Map<string, (turtle: Turtle, params?: any) => void>;
  defaultAngle: number;
  defaultDistance: number;

  constructor(angle: number = 60, distance: number = 10) {
    this.commands = new Map();
    this.defaultAngle = radians(angle);
    this.defaultDistance = distance;

    // Standard turtle commands
    this.addCommand("F", (turtle) => turtle.forward(this.defaultDistance));
    this.addCommand("G", (turtle) => turtle.forward(this.defaultDistance));
    this.addCommand("+", (turtle) => turtle.turnLeft(this.defaultAngle));
    this.addCommand("-", (turtle) => turtle.turnRight(this.defaultAngle));
    this.addCommand("[", (turtle) => turtle.push());
    this.addCommand("]", (turtle) => turtle.pop());
  }

  addCommand(
    symbol: string,
    action: (turtle: Turtle, params?: any) => void,
  ): void {
    this.commands.set(symbol, action);
  }

  interpret(lSystem: string, turtle: Turtle): Vector2[] {
    for (const symbol of lSystem) {
      const command = this.commands.get(symbol);
      if (command) {
        command(turtle);
      }
    }
    return turtle.getPath();
  }

  draw(lSystem: LSystem, generations: number, turtle: Turtle): Vector2[] {
    lSystem.iterate(generations);
    return this.interpret(lSystem.getString(), turtle);
  }
}

// Mandelbrot set utilities
export const mandelbrot = (
  c: {
    real: number;
    imag: number;
  },
  maxIterations: number = 100,
): number => {
  const z = {
    real: 0,
    imag: 0,
  };
  let iterations = 0;

  while (iterations < maxIterations) {
    const zReal = z.real * z.real - z.imag * z.imag + c.real;
    const zImag = 2 * z.real * z.imag + c.imag;

    z.real = zReal;
    z.imag = zImag;

    if (z.real * z.real + z.imag * z.imag > 4) {
      break;
    }

    iterations++;
  }

  return iterations;
};

export const mandelbrotSet = (
  width: number,
  height: number,
  xMin: number = -2.5,
  xMax: number = 1.5,
  yMin: number = -2,
  yMax: number = 2,
  maxIterations: number = 100,
): number[][] => {
  const result: number[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const real = xMin + (x / width) * (xMax - xMin);
      const imag = yMin + (y / height) * (yMax - yMin);

      result[y][x] = mandelbrot(
        {
          real,
          imag,
        },
        maxIterations,
      );
    }
  }

  return result;
};

// Julia set utilities
export const julia = (
  z: {
    real: number;
    imag: number;
  },
  c: {
    real: number;
    imag: number;
  },
  maxIterations: number = 100,
): number => {
  let iterations = 0;

  while (iterations < maxIterations) {
    const zReal = z.real * z.real - z.imag * z.imag + c.real;
    const zImag = 2 * z.real * z.imag + c.imag;

    z.real = zReal;
    z.imag = zImag;

    if (z.real * z.real + z.imag * z.imag > 4) {
      break;
    }

    iterations++;
  }

  return iterations;
};

export const juliaSet = (
  width: number,
  height: number,
  c: {
    real: number;
    imag: number;
  },
  xMin: number = -2,
  xMax: number = 2,
  yMin: number = -2,
  yMax: number = 2,
  maxIterations: number = 100,
): number[][] => {
  const result: number[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const real = xMin + (x / width) * (xMax - xMin);
      const imag = yMin + (y / height) * (yMax - yMin);

      result[y][x] = julia(
        {
          real,
          imag,
        },
        c,
        maxIterations,
      );
    }
  }

  return result;
};

// Sierpinski triangle
export const sierpinskiTriangle = (
  points: Point[],
  iterations: number,
  startPoint?: Point,
): Point[] => {
  if (points.length < 3) throw new Error("Need at least 3 vertices");

  const result: Point[] = [];
  let current = startPoint || {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };

  for (let i = 0; i < iterations; i++) {
    const target = points[Math.floor(Math.random() * points.length)];
    current = {
      x: (current.x + target.x) / 2,
      y: (current.y + target.y) / 2,
    };
    result.push({
      ...current,
    });
  }

  return result;
};

// Barnsley fern
export const barnsleyFern = (iterations: number): Point[] => {
  const result: Point[] = [];
  let x = 0,
    y = 0;

  for (let i = 0; i < iterations; i++) {
    const r = Math.random();
    let newX, newY;

    if (r < 0.01) {
      // Stem
      newX = 0;
      newY = 0.16 * y;
    } else if (r < 0.86) {
      // Leaflet
      newX = 0.85 * x + 0.04 * y;
      newY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      // Left-hand leaflet
      newX = 0.2 * x - 0.26 * y;
      newY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      // Right-hand leaflet
      newX = -0.15 * x + 0.28 * y;
      newY = 0.26 * x + 0.24 * y + 0.44;
    }

    x = newX;
    y = newY;
    result.push({
      x,
      y,
    });
  }

  return result;
};

// Recursive fractal generators
export const kochSnowflake = (
  start: Point,
  end: Point,
  depth: number,
): Point[] => {
  if (depth === 0) {
    return [start, end];
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const p1 = start;
  const p2 = {
    x: start.x + dx / 3,
    y: start.y + dy / 3,
  };
  const p4 = {
    x: start.x + (2 * dx) / 3,
    y: start.y + (2 * dy) / 3,
  };
  const p5 = end;

  // Calculate the peak of the equilateral triangle
  const cx = (p2.x + p4.x) / 2;
  const cy = (p2.y + p4.y) / 2;
  const angle = Math.atan2(dy, dx) - Math.PI / 2;
  const height = Math.sqrt(dx * dx + dy * dy) / (2 * Math.sqrt(3));

  const p3 = {
    x: cx + Math.cos(angle) * height,
    y: cy + Math.sin(angle) * height,
  };

  return [
    ...kochSnowflake(p1, p2, depth - 1).slice(0, -1),
    ...kochSnowflake(p2, p3, depth - 1).slice(0, -1),
    ...kochSnowflake(p3, p4, depth - 1).slice(0, -1),
    ...kochSnowflake(p4, p5, depth - 1),
  ];
};

// Utility function to create a complete Koch snowflake
export const createKochSnowflake = (
  center: Point,
  radius: number,
  depth: number,
): Point[] => {
  const vertices = [
    {
      x: center.x + radius * Math.cos(0),
      y: center.y + radius * Math.sin(0),
    },
    {
      x: center.x + radius * Math.cos((2 * Math.PI) / 3),
      y: center.y + radius * Math.sin((2 * Math.PI) / 3),
    },
    {
      x: center.x + radius * Math.cos((4 * Math.PI) / 3),
      y: center.y + radius * Math.sin((4 * Math.PI) / 3),
    },
  ];

  return [
    ...kochSnowflake(vertices[0], vertices[1], depth).slice(0, -1),
    ...kochSnowflake(vertices[1], vertices[2], depth).slice(0, -1),
    ...kochSnowflake(vertices[2], vertices[0], depth),
  ];
};

// Fractal tree
export const fractalTree = (
  start: Point,
  angle: number,
  length: number,
  depth: number,
  branchAngle: number = Math.PI / 6,
  lengthRatio: number = 0.7,
): Point[][] => {
  const end = {
    x: start.x + Math.cos(angle) * length,
    y: start.y + Math.sin(angle) * length,
  };

  const branches: Point[][] = [[start, end]];

  if (depth > 0) {
    const leftBranches = fractalTree(
      end,
      angle - branchAngle,
      length * lengthRatio,
      depth - 1,
      branchAngle,
      lengthRatio,
    );

    const rightBranches = fractalTree(
      end,
      angle + branchAngle,
      length * lengthRatio,
      depth - 1,
      branchAngle,
      lengthRatio,
    );

    branches.push(...leftBranches, ...rightBranches);
  }

  return branches;
};
