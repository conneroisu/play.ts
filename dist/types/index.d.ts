/**
 * Core types and interfaces for play.ts library
 */
export interface Vector2 {
    readonly x: number;
    readonly y: number;
}
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
export interface Vector4 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}
export interface RGB {
    readonly r: number;
    readonly g: number;
    readonly b: number;
}
export interface RGBA extends RGB {
    readonly a: number;
}
export interface HSL {
    readonly h: number;
    readonly s: number;
    readonly l: number;
}
export interface HSLA extends HSL {
    readonly a: number;
}
export interface Point {
    readonly x: number;
    readonly y: number;
}
export interface Size {
    readonly width: number;
    readonly height: number;
}
export interface Rectangle {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface Circle {
    readonly x: number;
    readonly y: number;
    readonly radius: number;
}
export interface EasingFunction {
    (t: number): number;
}
export interface AnimationFrame {
    readonly time: number;
    readonly deltaTime: number;
    readonly frame: number;
}
export interface RandomGenerator {
    next(): number;
    seed(value: number): void;
}
export interface NoiseGenerator {
    noise1D(x: number): number;
    noise2D(x: number, y: number): number;
    noise3D(x: number, y: number, z: number): number;
}
export interface Matrix3x3 {
    readonly elements: readonly [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ];
}
export interface Matrix4x4 {
    readonly elements: readonly [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ];
}
export type Clamp = (value: number, min: number, max: number) => number;
export type Lerp = (a: number, b: number, t: number) => number;
export type Map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
export type Normalize = (value: number, min: number, max: number) => number;
export interface MouseEvent {
    readonly x: number;
    readonly y: number;
    readonly button: number;
    readonly pressed: boolean;
}
export interface KeyboardEvent {
    readonly key: string;
    readonly code: string;
    readonly pressed: boolean;
}
export interface PlayConfig {
    readonly canvas?: HTMLCanvasElement;
    readonly width?: number;
    readonly height?: number;
    readonly pixelRatio?: number;
    readonly antialias?: boolean;
}
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
//# sourceMappingURL=index.d.ts.map