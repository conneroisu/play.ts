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
import type { Vector2, Point } from '../types/index.ts';
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
export declare class LSystem {
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
    constructor(axiom: string, rules?: LSystemRule[]);
    /**
     * Adds a new rewriting rule to the L-System.
     *
     * @param symbol - Symbol to be replaced
     * @param replacement - String to replace the symbol with
     */
    addRule(symbol: string, replacement: string): void;
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
    iterate(generations?: number): string;
    /**
     * Resets the L-System to its initial state (axiom).
     */
    reset(): void;
    /**
     * Gets the current string representation of the L-System.
     *
     * @returns Current evolved string
     */
    getString(): string;
    /**
     * Gets the current generation number (number of iterations performed).
     *
     * @returns Current generation count
     */
    getGeneration(): number;
}
export declare class Turtle {
    position: Vector2;
    angle: number;
    stack: Array<{
        position: Vector2;
        angle: number;
    }>;
    path: Vector2[];
    penDown: boolean;
    constructor(x?: number, y?: number, angle?: number);
    forward(distance: number): void;
    turn(angle: number): void;
    turnLeft(angle: number): void;
    turnRight(angle: number): void;
    push(): void;
    pop(): void;
    penUp(): void;
    penDownFn(): void;
    getPath(): Vector2[];
    reset(x?: number, y?: number, angle?: number): void;
}
export declare const lSystems: {
    koch: LSystem;
    sierpinski: LSystem;
    dragon: LSystem;
    plant: LSystem;
    tree: LSystem;
    cantor: LSystem;
};
export interface TurtleCommand {
    symbol: string;
    action: (turtle: Turtle, params?: any) => void;
}
export declare class LSystemInterpreter {
    commands: Map<string, (turtle: Turtle, params?: any) => void>;
    defaultAngle: number;
    defaultDistance: number;
    constructor(angle?: number, distance?: number);
    addCommand(symbol: string, action: (turtle: Turtle, params?: any) => void): void;
    interpret(lSystem: string, turtle: Turtle): Vector2[];
    draw(lSystem: LSystem, generations: number, turtle: Turtle): Vector2[];
}
export declare const mandelbrot: (c: {
    real: number;
    imag: number;
}, maxIterations?: number) => number;
export declare const mandelbrotSet: (width: number, height: number, xMin?: number, xMax?: number, yMin?: number, yMax?: number, maxIterations?: number) => number[][];
export declare const julia: (z: {
    real: number;
    imag: number;
}, c: {
    real: number;
    imag: number;
}, maxIterations?: number) => number;
export declare const juliaSet: (width: number, height: number, c: {
    real: number;
    imag: number;
}, xMin?: number, xMax?: number, yMin?: number, yMax?: number, maxIterations?: number) => number[][];
export declare const sierpinskiTriangle: (points: Point[], iterations: number, startPoint?: Point) => Point[];
export declare const barnsleyFern: (iterations: number) => Point[];
export declare const kochSnowflake: (start: Point, end: Point, depth: number) => Point[];
export declare const createKochSnowflake: (center: Point, radius: number, depth: number) => Point[];
export declare const fractalTree: (start: Point, angle: number, length: number, depth: number, branchAngle?: number, lengthRatio?: number) => Point[][];
//# sourceMappingURL=fractals.d.ts.map