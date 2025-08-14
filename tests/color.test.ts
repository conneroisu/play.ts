import { test, expect, describe } from 'bun:test';
import {
  rgb,
  rgba,
  hsl,
  hsla,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  colorLerp,
  colorLerpHsl,
  brighten,
  darken,
  saturate,
  desaturate,
  hueShift,
  grayscale,
  invert,
  contrast,
  complementary,
  triadic,
  analogous,
  splitComplementary,
  tetradic,
  colorDistance,
  colorSimilarity,
  colors,
  toCssRgb,
  toCssRgba,
  toCssHsl,
  toCssHsla
} from '../src/color.ts';

describe('Color utilities', () => {
  describe('Color creation', () => {
    test('rgb creation', () => {
      const color = rgb(255, 128, 64);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
    });

    test('rgb clamping', () => {
      const color = rgb(300, -50, 128);
      expect(color.r).toBe(255);
      expect(color.g).toBe(0);
      expect(color.b).toBe(128);
    });

    test('rgba creation', () => {
      const color = rgba(255, 128, 64, 0.5);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(0.5);
    });

    test('rgba clamping', () => {
      const color = rgba(300, -50, 128, 1.5);
      expect(color.r).toBe(255);
      expect(color.g).toBe(0);
      expect(color.b).toBe(128);
      expect(color.a).toBe(1);
    });

    test('hsl creation', () => {
      const color = hsl(240, 100, 50);
      expect(color.h).toBe(240);
      expect(color.s).toBe(100);
      expect(color.l).toBe(50);
    });

    test('hsl hue wrapping', () => {
      const color = hsl(450, 100, 50);
      expect(color.h).toBe(90); // 450 - 360 = 90

      const color2 = hsl(-90, 100, 50);
      expect(color2.h).toBe(270); // -90 + 360 = 270
    });

    test('hsla creation', () => {
      const color = hsla(240, 100, 50, 0.8);
      expect(color.h).toBe(240);
      expect(color.s).toBe(100);
      expect(color.l).toBe(50);
      expect(color.a).toBe(0.8);
    });
  });

  describe('Color space conversions', () => {
    test('rgbToHsl - red', () => {
      const red = rgb(255, 0, 0);
      const hslRed = rgbToHsl(red);
      expect(hslRed.h).toBeCloseTo(0, 1);
      expect(hslRed.s).toBeCloseTo(100, 1);
      expect(hslRed.l).toBeCloseTo(50, 1);
    });

    test('rgbToHsl - green', () => {
      const green = rgb(0, 255, 0);
      const hslGreen = rgbToHsl(green);
      expect(hslGreen.h).toBeCloseTo(120, 1);
      expect(hslGreen.s).toBeCloseTo(100, 1);
      expect(hslGreen.l).toBeCloseTo(50, 1);
    });

    test('rgbToHsl - blue', () => {
      const blue = rgb(0, 0, 255);
      const hslBlue = rgbToHsl(blue);
      expect(hslBlue.h).toBeCloseTo(240, 1);
      expect(hslBlue.s).toBeCloseTo(100, 1);
      expect(hslBlue.l).toBeCloseTo(50, 1);
    });

    test('rgbToHsl - gray', () => {
      const gray = rgb(128, 128, 128);
      const hslGray = rgbToHsl(gray);
      expect(hslGray.s).toBeCloseTo(0, 1);
      expect(hslGray.l).toBeCloseTo(50, 0); // Use precision 0 for more tolerance
    });

    test('hslToRgb - red', () => {
      const hslRed = hsl(0, 100, 50);
      const rgbRed = hslToRgb(hslRed);
      expect(rgbRed.r).toBeCloseTo(255, 1);
      expect(rgbRed.g).toBeCloseTo(0, 1);
      expect(rgbRed.b).toBeCloseTo(0, 1);
    });

    test('hslToRgb - green', () => {
      const hslGreen = hsl(120, 100, 50);
      const rgbGreen = hslToRgb(hslGreen);
      expect(rgbGreen.r).toBeCloseTo(0, 1);
      expect(rgbGreen.g).toBeCloseTo(255, 1);
      expect(rgbGreen.b).toBeCloseTo(0, 1);
    });

    test('hslToRgb - blue', () => {
      const hslBlue = hsl(240, 100, 50);
      const rgbBlue = hslToRgb(hslBlue);
      expect(rgbBlue.r).toBeCloseTo(0, 1);
      expect(rgbBlue.g).toBeCloseTo(0, 1);
      expect(rgbBlue.b).toBeCloseTo(255, 1);
    });

    test('rgbToHex', () => {
      const red = rgb(255, 0, 0);
      expect(rgbToHex(red)).toBe('#ff0000');

      const green = rgb(0, 255, 0);
      expect(rgbToHex(green)).toBe('#00ff00');

      const blue = rgb(0, 0, 255);
      expect(rgbToHex(blue)).toBe('#0000ff');
    });

    test('hexToRgb', () => {
      const red = hexToRgb('#ff0000');
      expect(red.r).toBe(255);
      expect(red.g).toBe(0);
      expect(red.b).toBe(0);

      const green = hexToRgb('#00ff00');
      expect(green.r).toBe(0);
      expect(green.g).toBe(255);
      expect(green.b).toBe(0);

      const blue = hexToRgb('#0000ff');
      expect(blue.r).toBe(0);
      expect(blue.g).toBe(0);
      expect(blue.b).toBe(255);
    });

    test('hexToRgb - short format', () => {
      const white = hexToRgb('#fff');
      expect(white.r).toBe(255);
      expect(white.g).toBe(255);
      expect(white.b).toBe(255);

      const black = hexToRgb('#000');
      expect(black.r).toBe(0);
      expect(black.g).toBe(0);
      expect(black.b).toBe(0);
    });

    test('round-trip conversion accuracy', () => {
      const original = rgb(127, 63, 191);
      const hslConverted = rgbToHsl(original);
      const backToRgb = hslToRgb(hslConverted);

      expect(backToRgb.r).toBeCloseTo(original.r, 0);
      expect(backToRgb.g).toBeCloseTo(original.g, 0);
      expect(backToRgb.b).toBeCloseTo(original.b, 0);
    });
  });

  describe('Color interpolation', () => {
    test('colorLerp', () => {
      const black = rgb(0, 0, 0);
      const white = rgb(255, 255, 255);
      const gray = colorLerp(black, white, 0.5);

      expect(gray.r).toBeCloseTo(127.5, 1);
      expect(gray.g).toBeCloseTo(127.5, 1);
      expect(gray.b).toBeCloseTo(127.5, 1);
    });

    test('colorLerpHsl', () => {
      const red = hsl(0, 100, 50);
      const blue = hsl(240, 100, 50);
      const purple = colorLerpHsl(red, blue, 0.5);

      expect(purple.h).toBeCloseTo(120, 1);
      expect(purple.s).toBe(100);
      expect(purple.l).toBe(50);
    });

    test('colorLerpHsl - hue wrapping', () => {
      const red = hsl(350, 100, 50);
      const yellow = hsl(60, 100, 50);
      const orange = colorLerpHsl(red, yellow, 0.5);

      // Should interpolate through 0° (red->orange->yellow)
      expect(orange.h).toBeCloseTo(25, 1);
    });
  });

  describe('Color manipulation', () => {
    test('brighten', () => {
      const color = rgb(100, 100, 100);
      const brighter = brighten(color, 20);
      const hslBrighter = rgbToHsl(brighter);
      const hslOriginal = rgbToHsl(color);

      expect(hslBrighter.l).toBeCloseTo(hslOriginal.l + 20, 1);
    });

    test('darken', () => {
      const color = rgb(100, 100, 100);
      const darker = darken(color, 20);
      const hslDarker = rgbToHsl(darker);
      const hslOriginal = rgbToHsl(color);

      expect(hslDarker.l).toBeCloseTo(hslOriginal.l - 20, 1);
    });

    test('saturate', () => {
      const color = rgb(100, 80, 80);
      const saturated = saturate(color, 20);
      const hslSaturated = rgbToHsl(saturated);
      const hslOriginal = rgbToHsl(color);

      expect(hslSaturated.s).toBeCloseTo(hslOriginal.s + 20, 1);
    });

    test('desaturate', () => {
      const color = rgb(255, 100, 100);
      const desaturated = desaturate(color, 20);
      const hslDesaturated = rgbToHsl(desaturated);
      const hslOriginal = rgbToHsl(color);

      expect(hslDesaturated.s).toBeCloseTo(hslOriginal.s - 20, -1);
    });

    test('hueShift', () => {
      const red = rgb(255, 0, 0);
      const shifted = hueShift(red, 120);
      const hslShifted = rgbToHsl(shifted);

      expect(hslShifted.h).toBeCloseTo(120, 1);
    });

    test('grayscale', () => {
      const color = rgb(255, 128, 64);
      const gray = grayscale(color);

      // Should use luminance formula
      const expectedGray = Math.round(0.299 * 255 + 0.587 * 128 + 0.114 * 64);
      expect(gray.r).toBe(expectedGray);
      expect(gray.g).toBe(expectedGray);
      expect(gray.b).toBe(expectedGray);
    });

    test('invert', () => {
      const color = rgb(100, 150, 200);
      const inverted = invert(color);

      expect(inverted.r).toBe(155); // 255 - 100
      expect(inverted.g).toBe(105); // 255 - 150
      expect(inverted.b).toBe(55); // 255 - 200
    });

    test('contrast', () => {
      // Test with a non-middle value to see contrast effect
      const color = rgb(100, 100, 100);
      const highContrast = contrast(color, 50);

      // Should move away from middle gray (darker values become darker)
      expect(highContrast.r).toBeLessThan(100);
      expect(highContrast.g).toBeLessThan(100);
      expect(highContrast.b).toBeLessThan(100);
    });
  });

  describe('Color harmony', () => {
    test('complementary', () => {
      const red = rgb(255, 0, 0);
      const complement = complementary(red);
      const hslComplement = rgbToHsl(complement);

      expect(hslComplement.h).toBeCloseTo(180, 1);
    });

    test('triadic', () => {
      const red = rgb(255, 0, 0);
      const [color1, color2] = triadic(red);
      const hsl1 = rgbToHsl(color1);
      const hsl2 = rgbToHsl(color2);

      expect(hsl1.h).toBeCloseTo(120, 1);
      expect(hsl2.h).toBeCloseTo(240, 1);
    });

    test('analogous', () => {
      const red = rgb(255, 0, 0);
      const [color1, color2] = analogous(red, 30);
      const hsl1 = rgbToHsl(color1);
      const hsl2 = rgbToHsl(color2);

      expect(hsl1.h).toBeCloseTo(30, 0);
      expect(hsl2.h).toBeCloseTo(330, 0);
    });

    test('splitComplementary', () => {
      const red = rgb(255, 0, 0);
      const [color1, color2] = splitComplementary(red);
      const hsl1 = rgbToHsl(color1);
      const hsl2 = rgbToHsl(color2);

      expect(hsl1.h).toBeCloseTo(150, 0);
      expect(hsl2.h).toBeCloseTo(210, 0);
    });

    test('tetradic', () => {
      const red = rgb(255, 0, 0);
      const [color1, color2, color3] = tetradic(red);
      const hsl1 = rgbToHsl(color1);
      const hsl2 = rgbToHsl(color2);
      const hsl3 = rgbToHsl(color3);

      expect(hsl1.h).toBeCloseTo(90, 0);
      expect(hsl2.h).toBeCloseTo(180, 0);
      expect(hsl3.h).toBeCloseTo(270, 0);
    });
  });

  describe('Color distance and similarity', () => {
    test('colorDistance', () => {
      const black = rgb(0, 0, 0);
      const white = rgb(255, 255, 255);
      const distance = colorDistance(black, white);

      // Distance should be sqrt(3 * 255^2)
      const expectedDistance = Math.sqrt(3 * 255 * 255);
      expect(distance).toBeCloseTo(expectedDistance, 1);
    });

    test('colorSimilarity', () => {
      const color1 = rgb(100, 100, 100);
      const color2 = rgb(100, 100, 100);
      const similarity = colorSimilarity(color1, color2);

      expect(similarity).toBe(1); // Identical colors
    });

    test('colorSimilarity - opposite colors', () => {
      const black = rgb(0, 0, 0);
      const white = rgb(255, 255, 255);
      const similarity = colorSimilarity(black, white);

      expect(similarity).toBeCloseTo(0, 1); // Opposite colors
    });
  });

  describe('Predefined colors', () => {
    test('basic colors', () => {
      expect(colors.white).toEqual({ r: 255, g: 255, b: 255 });
      expect(colors.black).toEqual({ r: 0, g: 0, b: 0 });
      expect(colors.red).toEqual({ r: 255, g: 0, b: 0 });
      expect(colors.green).toEqual({ r: 0, g: 255, b: 0 });
      expect(colors.blue).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('transparent color', () => {
      expect(colors.transparent).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });
  });

  describe('CSS color string functions', () => {
    test('toCssRgb', () => {
      const color = rgb(255, 128, 64);
      expect(toCssRgb(color)).toBe('rgb(255, 128, 64)');
    });

    test('toCssRgba', () => {
      const color = rgba(255, 128, 64, 0.5);
      expect(toCssRgba(color)).toBe('rgba(255, 128, 64, 0.5)');
    });

    test('toCssHsl', () => {
      const color = hsl(240, 100, 50);
      expect(toCssHsl(color)).toBe('hsl(240, 100%, 50%)');
    });

    test('toCssHsla', () => {
      const color = hsla(240, 100, 50, 0.8);
      expect(toCssHsla(color)).toBe('hsla(240, 100%, 50%, 0.8)');
    });
  });
});
