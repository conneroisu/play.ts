import { describe, expect, test } from "bun:test";
import {
	clamp,
	degrees,
	fract,
	HALF_PI,
	lerp,
	map,
	mat3FromValues,
	mat3Identity,
	mat3Multiply,
	mat3TransformVec2,
	normalize,
	PI,
	radians,
	sign,
	smootherstep,
	smoothstep,
	TAU,
	TWO_PI,
	vec2,
	vec2Add,
	vec2Angle,
	vec2Distance,
	vec2Div,
	vec2Dot,
	vec2FromAngle,
	vec2Length,
	vec2LengthSq,
	vec2Lerp,
	vec2Mul,
	vec2Normalize,
	vec2Rotate,
	vec2Sub,
	vec3,
	vec3Add,
	vec3Cross,
	vec3Distance,
	vec3Div,
	vec3Dot,
	vec3Length,
	vec3LengthSq,
	vec3Lerp,
	vec3Mul,
	vec3Normalize,
	vec3Sub,
	wrap,
} from "../src/math.ts";

describe("Math utilities", () => {
	describe("Constants", () => {
		test("PI constant", () => {
			expect(PI).toBe(Math.PI);
		});

		test("TWO_PI constant", () => {
			expect(TWO_PI).toBe(Math.PI * 2);
		});

		test("HALF_PI constant", () => {
			expect(HALF_PI).toBe(Math.PI / 2);
		});

		test("TAU constant", () => {
			expect(TAU).toBe(Math.PI * 2);
		});
	});

	describe("Basic math functions", () => {
		test("clamp", () => {
			expect(clamp(5, 0, 10)).toBe(5);
			expect(clamp(-5, 0, 10)).toBe(0);
			expect(clamp(15, 0, 10)).toBe(10);
			expect(clamp(0, 0, 10)).toBe(0);
			expect(clamp(10, 0, 10)).toBe(10);
		});

		test("lerp", () => {
			expect(lerp(0, 10, 0)).toBe(0);
			expect(lerp(0, 10, 1)).toBe(10);
			expect(lerp(0, 10, 0.5)).toBe(5);
			expect(lerp(-5, 5, 0.5)).toBe(0);
		});

		test("map", () => {
			expect(map(5, 0, 10, 0, 100)).toBe(50);
			expect(map(0, 0, 10, 0, 100)).toBe(0);
			expect(map(10, 0, 10, 0, 100)).toBe(100);
			expect(map(2.5, 0, 5, 10, 20)).toBe(15);
		});

		test("normalize", () => {
			expect(normalize(5, 0, 10)).toBe(0.5);
			expect(normalize(0, 0, 10)).toBe(0);
			expect(normalize(10, 0, 10)).toBe(1);
			expect(normalize(-5, -10, 0)).toBe(0.5);
		});

		test("smoothstep", () => {
			expect(smoothstep(0, 1, 0)).toBe(0);
			expect(smoothstep(0, 1, 1)).toBe(1);
			expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
			expect(smoothstep(0, 1, -0.5)).toBe(0);
			expect(smoothstep(0, 1, 1.5)).toBe(1);
		});

		test("smootherstep", () => {
			expect(smootherstep(0, 1, 0)).toBe(0);
			expect(smootherstep(0, 1, 1)).toBe(1);
			expect(smootherstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
		});

		test("degrees", () => {
			expect(degrees(PI)).toBe(180);
			expect(degrees(TWO_PI)).toBe(360);
			expect(degrees(HALF_PI)).toBe(90);
			expect(degrees(0)).toBe(0);
		});

		test("radians", () => {
			expect(radians(180)).toBe(PI);
			expect(radians(360)).toBe(TWO_PI);
			expect(radians(90)).toBe(HALF_PI);
			expect(radians(0)).toBe(0);
		});

		test("sign", () => {
			expect(sign(5)).toBe(1);
			expect(sign(-5)).toBe(-1);
			expect(sign(0)).toBe(0);
		});

		test("fract", () => {
			expect(fract(3.14)).toBeCloseTo(0.14, 5);
			expect(fract(5.0)).toBe(0);
			expect(fract(-2.3)).toBeCloseTo(0.7, 5);
		});

		test("wrap", () => {
			expect(wrap(5, 0, 10)).toBe(5);
			expect(wrap(15, 0, 10)).toBe(5);
			expect(wrap(-5, 0, 10)).toBe(5);
			expect(wrap(0, 0, 10)).toBe(0);
			expect(wrap(10, 0, 10)).toBe(0);
		});
	});

	describe("Vector2 operations", () => {
		test("vec2 creation", () => {
			const v = vec2(3, 4);
			expect(v.x).toBe(3);
			expect(v.y).toBe(4);
		});

		test("vec2Add", () => {
			const a = vec2(1, 2);
			const b = vec2(3, 4);
			const result = vec2Add(a, b);
			expect(result.x).toBe(4);
			expect(result.y).toBe(6);
		});

		test("vec2Sub", () => {
			const a = vec2(5, 7);
			const b = vec2(2, 3);
			const result = vec2Sub(a, b);
			expect(result.x).toBe(3);
			expect(result.y).toBe(4);
		});

		test("vec2Mul", () => {
			const v = vec2(2, 3);
			const result = vec2Mul(v, 2);
			expect(result.x).toBe(4);
			expect(result.y).toBe(6);
		});

		test("vec2Div", () => {
			const v = vec2(6, 8);
			const result = vec2Div(v, 2);
			expect(result.x).toBe(3);
			expect(result.y).toBe(4);
		});

		test("vec2Dot", () => {
			const a = vec2(1, 2);
			const b = vec2(3, 4);
			expect(vec2Dot(a, b)).toBe(11); // 1*3 + 2*4 = 11
		});

		test("vec2Length", () => {
			const v = vec2(3, 4);
			expect(vec2Length(v)).toBe(5); // 3-4-5 triangle
		});

		test("vec2LengthSq", () => {
			const v = vec2(3, 4);
			expect(vec2LengthSq(v)).toBe(25);
		});

		test("vec2Normalize", () => {
			const v = vec2(3, 4);
			const normalized = vec2Normalize(v);
			expect(vec2Length(normalized)).toBeCloseTo(1, 5);
			expect(normalized.x).toBeCloseTo(0.6, 5);
			expect(normalized.y).toBeCloseTo(0.8, 5);
		});

		test("vec2Distance", () => {
			const a = vec2(0, 0);
			const b = vec2(3, 4);
			expect(vec2Distance(a, b)).toBe(5);
		});

		test("vec2Angle", () => {
			const v = vec2(1, 0);
			expect(vec2Angle(v)).toBe(0);

			const v2 = vec2(0, 1);
			expect(vec2Angle(v2)).toBeCloseTo(HALF_PI, 5);
		});

		test("vec2FromAngle", () => {
			const v = vec2FromAngle(0, 5);
			expect(v.x).toBeCloseTo(5, 5);
			expect(v.y).toBeCloseTo(0, 5);

			const v2 = vec2FromAngle(HALF_PI, 3);
			expect(v2.x).toBeCloseTo(0, 5);
			expect(v2.y).toBeCloseTo(3, 5);
		});

		test("vec2Lerp", () => {
			const a = vec2(0, 0);
			const b = vec2(10, 20);
			const result = vec2Lerp(a, b, 0.5);
			expect(result.x).toBe(5);
			expect(result.y).toBe(10);
		});

		test("vec2Rotate", () => {
			const v = vec2(1, 0);
			const rotated = vec2Rotate(v, HALF_PI);
			expect(rotated.x).toBeCloseTo(0, 5);
			expect(rotated.y).toBeCloseTo(1, 5);
		});
	});

	describe("Vector3 operations", () => {
		test("vec3 creation", () => {
			const v = vec3(1, 2, 3);
			expect(v.x).toBe(1);
			expect(v.y).toBe(2);
			expect(v.z).toBe(3);
		});

		test("vec3Add", () => {
			const a = vec3(1, 2, 3);
			const b = vec3(4, 5, 6);
			const result = vec3Add(a, b);
			expect(result.x).toBe(5);
			expect(result.y).toBe(7);
			expect(result.z).toBe(9);
		});

		test("vec3Sub", () => {
			const a = vec3(5, 7, 9);
			const b = vec3(2, 3, 4);
			const result = vec3Sub(a, b);
			expect(result.x).toBe(3);
			expect(result.y).toBe(4);
			expect(result.z).toBe(5);
		});

		test("vec3Mul", () => {
			const v = vec3(1, 2, 3);
			const result = vec3Mul(v, 2);
			expect(result.x).toBe(2);
			expect(result.y).toBe(4);
			expect(result.z).toBe(6);
		});

		test("vec3Div", () => {
			const v = vec3(6, 8, 10);
			const result = vec3Div(v, 2);
			expect(result.x).toBe(3);
			expect(result.y).toBe(4);
			expect(result.z).toBe(5);
		});

		test("vec3Dot", () => {
			const a = vec3(1, 2, 3);
			const b = vec3(4, 5, 6);
			expect(vec3Dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6 = 32
		});

		test("vec3Cross", () => {
			const a = vec3(1, 0, 0);
			const b = vec3(0, 1, 0);
			const result = vec3Cross(a, b);
			expect(result.x).toBe(0);
			expect(result.y).toBe(0);
			expect(result.z).toBe(1);
		});

		test("vec3Length", () => {
			const v = vec3(2, 3, 6);
			expect(vec3Length(v)).toBe(7); // 2^2 + 3^2 + 6^2 = 49, sqrt(49) = 7
		});

		test("vec3LengthSq", () => {
			const v = vec3(2, 3, 6);
			expect(vec3LengthSq(v)).toBe(49);
		});

		test("vec3Normalize", () => {
			const v = vec3(2, 3, 6);
			const normalized = vec3Normalize(v);
			expect(vec3Length(normalized)).toBeCloseTo(1, 5);
		});

		test("vec3Distance", () => {
			const a = vec3(0, 0, 0);
			const b = vec3(2, 3, 6);
			expect(vec3Distance(a, b)).toBe(7);
		});

		test("vec3Lerp", () => {
			const a = vec3(0, 0, 0);
			const b = vec3(10, 20, 30);
			const result = vec3Lerp(a, b, 0.5);
			expect(result.x).toBe(5);
			expect(result.y).toBe(10);
			expect(result.z).toBe(15);
		});
	});

	describe("Matrix operations", () => {
		test("mat3Identity", () => {
			const identity = mat3Identity();
			const expected = [
				1,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				1,
			];
			expect(identity.elements).toEqual(expected);
		});

		test("mat3FromValues", () => {
			const matrix = mat3FromValues(1, 2, 3, 4, 5, 6, 7, 8, 9);
			const expected = [
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
			];
			expect(matrix.elements).toEqual(expected);
		});

		test("mat3Multiply", () => {
			const a = mat3FromValues(1, 2, 3, 4, 5, 6, 7, 8, 9);
			const identity = mat3Identity();
			const result = mat3Multiply(a, identity);
			expect(result.elements).toEqual(a.elements);
		});

		test("mat3TransformVec2", () => {
			// Translation matrix
			const translation = mat3FromValues(1, 0, 5, 0, 1, 3, 0, 0, 1);
			const point = vec2(2, 4);
			const transformed = mat3TransformVec2(translation, point);
			expect(transformed.x).toBe(7); // 2 + 5
			expect(transformed.y).toBe(7); // 4 + 3
		});
	});
});
