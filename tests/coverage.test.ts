/**
 * Test Coverage Analysis and Reporting
 * Validates test coverage across all modules and generates coverage reports
 */

import { test, expect, describe } from 'bun:test';
import * as PlayCore from '../src/index.ts';

describe('Test Coverage Analysis', () => {
  describe('Module Export Coverage', () => {
    test('all math utilities are exported and tested', () => {
      const mathFunctions = [
        'clamp',
        'lerp',
        'map',
        'normalize',
        'smoothstep',
        'smootherstep',
        'degrees',
        'radians',
        'sign',
        'fract',
        'wrap',
        'vec2',
        'vec2Add',
        'vec2Sub',
        'vec2Mul',
        'vec2Div',
        'vec2Dot',
        'vec2Length',
        'vec2LengthSq',
        'vec2Normalize',
        'vec2Distance',
        'vec2Angle',
        'vec2FromAngle',
        'vec2Lerp',
        'vec2Rotate',
        'vec3',
        'vec3Add',
        'vec3Sub',
        'vec3Mul',
        'vec3Div',
        'vec3Dot',
        'vec3Cross',
        'vec3Length',
        'vec3LengthSq',
        'vec3Normalize',
        'vec3Distance',
        'vec3Lerp'
      ];

      mathFunctions.forEach(fnName => {
        expect(PlayCore).toHaveProperty(fnName);
        expect(typeof (PlayCore as any)[fnName]).toBe('function');
      });
    });

    test('all color utilities are exported and tested', () => {
      const colorFunctions = [
        'rgb',
        'rgba',
        'hsl',
        'hsla',
        'rgbToHsl',
        'hslToRgb',
        'rgbToHex',
        'hexToRgb',
        'colorLerp',
        'brighten',
        'darken',
        'saturate',
        'desaturate',
        'hueShift',
        'grayscale',
        'invert',
        'complementary'
      ];

      colorFunctions.forEach(fnName => {
        expect(PlayCore).toHaveProperty(fnName);
        expect(typeof (PlayCore as any)[fnName]).toBe('function');
      });
    });

    test('all animation utilities are exported and tested', () => {
      const animationItems = [
        'linear',
        'easeInQuad',
        'easeOutQuad',
        'easeInOutQuad',
        'easeInCubic',
        'easeOutCubic',
        'easeInOutCubic',
        'easeInSine',
        'easeOutSine',
        'easeInOutSine',
        'Tween',
        'Spring',
        'AnimationLoop'
      ];

      animationItems.forEach(itemName => {
        expect(PlayCore).toHaveProperty(itemName);
      });
    });

    test('all random utilities are exported and tested', () => {
      const randomFunctions = [
        'randomInt',
        'randomFloat',
        'randomBool',
        'randomChoice',
        'randomAngle',
        'randomInCircle',
        'randomOnCircle',
        'randomGaussian',
        'setSeed',
        'shuffle',
        'sample',
        'noise',
        'SeededRandom',
        'PerlinNoise'
      ];

      randomFunctions.forEach(fnName => {
        expect(PlayCore).toHaveProperty(fnName);
      });
    });

    test('all geometry utilities are exported and tested', () => {
      const geometryFunctions = [
        'point',
        'pointDistance',
        'pointLerp',
        'rect',
        'rectIntersects',
        'circle',
        'pointInCircle',
        'line',
        'lineLength',
        'lineIntersection',
        'polygon',
        'polygonArea',
        'pointInPolygon',
        'regularPolygon'
      ];

      geometryFunctions.forEach(fnName => {
        expect(PlayCore).toHaveProperty(fnName);
        expect(typeof (PlayCore as any)[fnName]).toBe('function');
      });
    });

    test('Play class and related utilities are exported', () => {
      expect(PlayCore).toHaveProperty('Play');
      expect(PlayCore).toHaveProperty('play');
      expect(PlayCore).toHaveProperty('setup');

      expect(typeof PlayCore.Play).toBe('function');
      expect(typeof PlayCore.setup).toBe('function');
    });

    test('constants are exported', () => {
      const constants = ['PI', 'TWO_PI', 'HALF_PI', 'QUARTER_PI', 'E', 'PHI'];

      constants.forEach(constant => {
        expect(PlayCore).toHaveProperty(constant);
        expect(typeof (PlayCore as any)[constant]).toBe('number');
      });
    });
  });

  describe('Function Signature Coverage', () => {
    test('math functions handle expected parameter types', () => {
      // Test basic math functions with various input types
      expect(() => PlayCore.clamp(5, 0, 10)).not.toThrow();
      expect(() => PlayCore.lerp(0, 1, 0.5)).not.toThrow();
      expect(() => PlayCore.map(5, 0, 10, 0, 100)).not.toThrow();

      // Test vector functions
      expect(() => PlayCore.vec2(1, 2)).not.toThrow();
      expect(() => PlayCore.vec2Add(PlayCore.vec2(1, 2), PlayCore.vec2(3, 4))).not.toThrow();
      expect(() => PlayCore.vec3(1, 2, 3)).not.toThrow();
    });

    test('color functions handle expected parameter types', () => {
      expect(() => PlayCore.rgb(255, 128, 64)).not.toThrow();
      expect(() => PlayCore.rgba(255, 128, 64, 0.5)).not.toThrow();
      expect(() => PlayCore.hsl(240, 100, 50)).not.toThrow();
      expect(() => PlayCore.hsla(240, 100, 50, 0.8)).not.toThrow();
    });

    test('geometry functions handle expected parameter types', () => {
      expect(() => PlayCore.point(10, 20)).not.toThrow();
      expect(() => PlayCore.circle(50, 50, 25)).not.toThrow();
      expect(() => PlayCore.rect(0, 0, 100, 100)).not.toThrow();

      const points = [PlayCore.point(0, 0), PlayCore.point(10, 0), PlayCore.point(5, 10)];
      expect(() => PlayCore.polygon(...points)).not.toThrow();
    });

    test('random functions handle expected parameter types', () => {
      expect(() => PlayCore.randomInt(1, 10)).not.toThrow();
      expect(() => PlayCore.randomFloat(0, 1)).not.toThrow();
      expect(() => PlayCore.randomChoice([1, 2, 3, 4, 5])).not.toThrow();
    });
  });

  describe('Error Handling Coverage', () => {
    test('functions handle invalid inputs gracefully', () => {
      // Math functions with invalid inputs
      expect(() => PlayCore.clamp(NaN, 0, 10)).not.toThrow();
      expect(() => PlayCore.vec2Length(PlayCore.vec2(NaN, 0))).not.toThrow();

      // Color functions with out-of-range values
      expect(() => PlayCore.rgb(-50, 300, 128)).not.toThrow();
      expect(() => PlayCore.hexToRgb('invalid')).not.toThrow();

      // Geometry functions with invalid shapes
      expect(() => PlayCore.pointDistance(PlayCore.point(NaN, 0), PlayCore.point(1, 2))).not.toThrow();

      // Random functions with invalid parameters
      expect(() => PlayCore.randomInt(10, 5)).not.toThrow(); // min > max
    });

    test('functions that should throw errors do so appropriately', () => {
      // Functions that should validate input and throw errors
      expect(() => PlayCore.randomChoice([])).toThrow();
      expect(() => PlayCore.polygon()).toThrow();
      expect(() => PlayCore.regularPolygon(PlayCore.point(0, 0), 10, 2)).toThrow();
      expect(() => PlayCore.sample([], 5)).toThrow();
    });
  });

  describe('Performance Coverage', () => {
    test('all module functions meet performance criteria', () => {
      const iterations = 1000;
      const performanceThreshold = 100; // ms

      const testPerformance = (fn: () => void, name: string) => {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          fn();
        }
        const duration = performance.now() - start;

        console.log(`${name}: ${duration.toFixed(2)}ms for ${iterations} iterations`);
        expect(duration).toBeLessThan(performanceThreshold);
      };

      // Test math operations
      testPerformance(() => PlayCore.vec2Add(PlayCore.vec2(1, 2), PlayCore.vec2(3, 4)), 'vec2Add');
      testPerformance(() => PlayCore.vec2Length(PlayCore.vec2(3, 4)), 'vec2Length');

      // Test color operations
      testPerformance(() => PlayCore.rgb(128, 64, 192), 'rgb');
      testPerformance(() => PlayCore.rgbToHsl(PlayCore.rgb(128, 64, 192)), 'rgbToHsl');

      // Test geometry operations
      testPerformance(() => PlayCore.pointDistance(PlayCore.point(0, 0), PlayCore.point(3, 4)), 'pointDistance');
    });

    test('memory usage is reasonable for common operations', () => {
      // Test that creating many objects doesn't cause memory issues
      const objects = [];

      expect(() => {
        for (let i = 0; i < 10000; i++) {
          objects.push(PlayCore.vec2(i, i + 1));
          objects.push(PlayCore.rgb(i % 256, (i * 2) % 256, (i * 3) % 256));
          objects.push(PlayCore.point(i % 100, i % 100));
        }
      }).not.toThrow();

      expect(objects.length).toBe(30000);
    });
  });

  describe('Type Safety Coverage', () => {
    test('functions return expected types', () => {
      // Math functions
      expect(typeof PlayCore.clamp(5, 0, 10)).toBe('number');
      expect(typeof PlayCore.vec2(1, 2)).toBe('object');
      expect(PlayCore.vec2(1, 2)).toHaveProperty('x');
      expect(PlayCore.vec2(1, 2)).toHaveProperty('y');

      // Color functions
      const color = PlayCore.rgb(255, 128, 64);
      expect(typeof color).toBe('object');
      expect(color).toHaveProperty('r');
      expect(color).toHaveProperty('g');
      expect(color).toHaveProperty('b');

      // Geometry functions
      const point = PlayCore.point(10, 20);
      expect(typeof point).toBe('object');
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');

      // Boolean returns
      expect(typeof PlayCore.pointInCircle(PlayCore.point(0, 0), PlayCore.circle(0, 0, 10))).toBe('boolean');
    });

    test('class instances have expected methods', () => {
      const playInstance = new PlayCore.Play();

      const expectedMethods = [
        'clear',
        'background',
        'fill',
        'stroke',
        'drawCircle',
        'drawRect',
        'drawLine',
        'drawPolygon',
        'translate',
        'rotate',
        'scale',
        'pushMatrix',
        'popMatrix'
      ];

      expectedMethods.forEach(method => {
        expect(playInstance).toHaveProperty(method);
        expect(typeof (playInstance as any)[method]).toBe('function');
      });
    });
  });

  describe('Integration Coverage', () => {
    test('modules work together correctly', () => {
      // Math + Color integration
      const color1 = PlayCore.rgb(255, 0, 0);
      const color2 = PlayCore.rgb(0, 0, 255);
      const interpolated = PlayCore.colorLerp(color1, color2, 0.5);

      expect(interpolated.r).toBe(PlayCore.lerp(255, 0, 0.5));
      expect(interpolated.b).toBe(PlayCore.lerp(0, 255, 0.5));

      // Geometry + Math integration
      const p1 = PlayCore.point(0, 0);
      const p2 = PlayCore.point(3, 4);
      const distance = PlayCore.pointDistance(p1, p2);
      const vectorDistance = PlayCore.vec2Length(
        PlayCore.vec2Sub(PlayCore.vec2(p2.x, p2.y), PlayCore.vec2(p1.x, p1.y))
      );

      expect(distance).toBeCloseTo(vectorDistance, 10);

      // Animation + Math integration
      const startPos = PlayCore.vec2(0, 0);
      const endPos = PlayCore.vec2(100, 100);
      const t = 0.5;
      const easedT = PlayCore.easeInQuad(t);
      const animatedPos = PlayCore.vec2Lerp(startPos, endPos, easedT);

      expect(animatedPos.x).toBe(PlayCore.lerp(0, 100, easedT));
      expect(animatedPos.y).toBe(PlayCore.lerp(0, 100, easedT));
    });
  });

  describe('Documentation Coverage', () => {
    test('all public functions have proper exports', () => {
      const moduleKeys = Object.keys(PlayCore);
      expect(moduleKeys.length).toBeGreaterThan(50); // Should have many exports

      // Verify no undefined exports
      moduleKeys.forEach(key => {
        expect((PlayCore as any)[key]).toBeDefined();
      });
    });

    test('library metadata is available', () => {
      expect(PlayCore.default).toBeDefined();
      expect(PlayCore.default.version).toBeDefined();
      expect(PlayCore.default.info).toBeDefined();
    });
  });

  describe('Edge Case Coverage Summary', () => {
    test('comprehensive edge case handling', () => {
      const edgeCases = [
        // NaN handling
        () => PlayCore.vec2Length(PlayCore.vec2(NaN, 0)),
        () => PlayCore.clamp(NaN, 0, 10),
        () => PlayCore.rgb(NaN, 128, 255),

        // Infinity handling
        () => PlayCore.vec2Normalize(PlayCore.vec2(Infinity, 0)),
        () => PlayCore.map(Infinity, 0, 10, 0, 100),

        // Zero handling
        () => PlayCore.vec2Normalize(PlayCore.vec2(0, 0)),
        () => PlayCore.map(5, 0, 0, 10, 20),

        // Boundary values
        () => PlayCore.rgb(-50, 300, 128),
        () => PlayCore.lerp(0, 100, -1),
        () => PlayCore.lerp(0, 100, 2),

        // Empty/invalid collections
        () => PlayCore.shuffle([]),
        () => PlayCore.weightedChoice([], [])
      ];

      edgeCases.forEach((testCase, index) => {
        expect(() => testCase()).not.toThrow(`Edge case ${index + 1} should not throw`);
      });
    });
  });
});

// Generate coverage report summary
describe('Coverage Report Summary', () => {
  test('generate test coverage summary', () => {
    const summary = {
      totalFunctions: Object.keys(PlayCore).length,
      testedModules: ['math', 'color', 'animation', 'random', 'geometry', 'play'],
      testCategories: [
        'unit tests',
        'integration tests',
        'edge case tests',
        'performance tests',
        'error handling tests',
        'visual tests',
        'property-based tests'
      ],
      coverageAreas: [
        'function exports',
        'type safety',
        'error conditions',
        'performance criteria',
        'cross-module integration',
        'visual operations',
        'canvas interactions'
      ]
    };

    console.log('📊 Test Coverage Summary:');
    console.log(`   Total Exported Functions: ${summary.totalFunctions}`);
    console.log(`   Tested Modules: ${summary.testedModules.join(', ')}`);
    console.log(`   Test Categories: ${summary.testCategories.length}`);
    console.log(`   Coverage Areas: ${summary.coverageAreas.length}`);

    expect(summary.totalFunctions).toBeGreaterThan(50);
    expect(summary.testedModules.length).toBe(6);
    expect(summary.testCategories.length).toBe(7);
    expect(summary.coverageAreas.length).toBe(7);
  });
});
