/**
 * Core types and interfaces for play.ts library
 */

// Vector types

/**
 * 2D vector type
 */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/**
 * 3D vector type
 */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * 4D vector type
 */
export interface Vector4 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

// Color types
export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * RGBA type
 */
export interface RGBA extends RGB {
  readonly a: number;
}

/**
 * HSL type
 */
export interface HSL {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

/**
 * HSLA type
 */
export interface HSLA extends HSL {
  readonly a: number;
}

// Geometry types
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Size type
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Rectangle type
 */
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Circle type
 */
export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

// Animation types
export interface EasingFunction {
  (t: number): number;
}

export interface AnimationFrame {
  readonly time: number;
  readonly deltaTime: number;
  readonly frame: number;
}

// Random types
export interface RandomGenerator {
  next(): number;
  seed(value: number): void;
}

/**
 * Noise types
 */
export interface NoiseGenerator {
  noise1D(x: number): number;
  noise2D(x: number, y: number): number;
  noise3D(x: number, y: number, z: number): number;
}

// Math types
export interface Matrix3x3 {
  readonly elements: readonly [
    number, number, number,
    number, number, number,
    number, number, number
  ];
}

/**
 * 4x4 matrix type
 */
export interface Matrix4x4 {
  readonly elements: readonly [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
  ];
}

// Utility types

/**
 * Clamp a value between a min and max
 */
export type Clamp = (value: number, min: number, max: number) => number;
/**
 * Linear interpolation between two values
 */
export type Lerp = (a: number, b: number, t: number) => number;
/**
 * Map a value from one range to another
 */
export type Map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
/**
 * Normalize a value between a min and max
 */
export type Normalize = (value: number, min: number, max: number) => number;

// Event types for creative coding
export interface MouseEvent {
  readonly x: number;
  readonly y: number;
  readonly button: number;
  readonly pressed: boolean;
}

/**
 * Keyboard event
 */
export interface KeyboardEvent {
  readonly key: string;
  readonly code: string;
  readonly pressed: boolean;
}

// Configuration types
export interface PlayConfig {
  readonly canvas?: HTMLCanvasElement;
  readonly width?: number;
  readonly height?: number;
  readonly pixelRatio?: number;
  readonly antialias?: boolean;
}

// Export utility type helpers
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make a type immutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
