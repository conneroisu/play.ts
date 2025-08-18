/**
 * Color utilities and color space conversions for creative coding.
 *
 * This module provides comprehensive color manipulation functions supporting RGB, HSL,
 * and other color spaces commonly used in creative coding and digital art. All functions
 * are optimized for real-time graphics applications and include robust error handling.
 *
 * @remarks
 * The color system follows web standards and computer graphics conventions:
 * - RGB values are in the range [0, 255] for 8-bit precision
 * - HSL hue values are in degrees [0, 360), saturation and lightness in [0, 100]
 * - Alpha values are normalized to [0, 1] for consistency with web standards
 * - All color operations preserve type safety and handle edge cases gracefully
 *
 * Color spaces supported:
 * - **RGB/RGBA**: Red, Green, Blue with optional Alpha
 * - **HSL/HSLA**: Hue, Saturation, Lightness with optional Alpha
 * - **Hex**: Hexadecimal color codes (#RGB, #RRGGBB)
 * - **CSS**: CSS-compatible color strings
 *
 * @example
 * Basic color creation and conversion:
 * ```typescript
 * import { rgb, hsl, rgbToHsl, hslToRgb } from 'play.ts';
 *
 * const red = rgb(255, 0, 0);
 * const redHsl = rgbToHsl(red);        // { h: 0, s: 100, l: 50 }
 * const backToRgb = hslToRgb(redHsl);  // { r: 255, g: 0, b: 0 }
 * ```
 *
 * @example
 * Color manipulation and harmony:
 * ```typescript
 * import { brighten, complementary, triadic } from 'play.ts';
 *
 * const baseColor = rgb(100, 150, 200);
 * const brighter = brighten(baseColor, 20);     // Increase lightness
 * const complement = complementary(baseColor);   // Opposite on color wheel
 * const [triad1, triad2] = triadic(baseColor);   // Triadic harmony
 * ```
 *
 * @see {@link https://developer.mozilla.org/docs/Web/CSS/color_value | MDN CSS Color}
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV | HSL Color Space}
 * @see {@link https://www.w3.org/TR/css-color-3/ | W3C CSS Color Specification}
 */

import type { HSL, HSLA, RGB, RGBA } from "../types/index.ts";
import { clamp, lerp } from "./math.ts";

// ============================================================================
// Color Creation Functions
// ============================================================================

/**
 * Creates an RGB color object with automatic clamping.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns RGB color object with clamped values
 *
 * @remarks
 * RGB (Red, Green, Blue) is the most common color model in computer graphics.
 * Each channel represents the intensity of that color component, with 0 meaning
 * no contribution and 255 meaning maximum intensity (full 8-bit precision).
 *
 * Values outside the 0-255 range are automatically clamped to valid bounds,
 * ensuring the resulting color is always valid for rendering.
 *
 * @example
 * Basic color creation:
 * ```typescript
 * const red = rgb(255, 0, 0);     // Pure red
 * const green = rgb(0, 255, 0);   // Pure green
 * const blue = rgb(0, 0, 255);    // Pure blue
 * const white = rgb(255, 255, 255); // White
 * const black = rgb(0, 0, 0);     // Black
 * ```
 *
 * @example
 * Automatic clamping:
 * ```typescript
 * const clamped = rgb(300, -50, 128); // Results in rgb(255, 0, 128)
 * const safe = rgb(1.5 * 255, 0.8 * 255, 0.2 * 255); // Scaled values
 * ```
 *
 * @see {@link rgba} for RGB with alpha transparency
 * @see {@link hsl} for HSL color creation
 * @see {@link colors} for predefined color constants
 */
export const rgb = (r: number, g: number, b: number): RGB => ({
	r: clamp(r, 0, 255),
	g: clamp(g, 0, 255),
	b: clamp(b, 0, 255),
});

/**
 * Creates an RGBA color object with automatic clamping.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @param a - Alpha component (0-1, where 0 is transparent and 1 is opaque)
 * @returns RGBA color object with clamped values
 *
 * @remarks
 * RGBA extends RGB by adding an alpha channel for transparency control.
 * The alpha value follows web standards using a normalized range [0, 1]
 * rather than 0-255, providing consistency with CSS and WebGL conventions.
 *
 * Alpha blending follows standard compositing rules:
 * - 0.0 = Fully transparent (invisible)
 * - 0.5 = Semi-transparent (50% opacity)
 * - 1.0 = Fully opaque (completely solid)
 *
 * @example
 * Transparent colors:
 * ```typescript
 * const semiRed = rgba(255, 0, 0, 0.5);      // 50% transparent red
 * const clearWhite = rgba(255, 255, 255, 0); // Invisible white
 * const solidBlue = rgba(0, 0, 255, 1);      // Fully opaque blue
 * ```
 *
 * @example
 * Fade animation:
 * ```typescript
 * const baseColor = rgb(100, 150, 200);
 * const fadeIn = (t: number) => rgba(baseColor.r, baseColor.g, baseColor.b, t);
 * const currentColor = fadeIn(animationProgress); // t from 0 to 1
 * ```
 *
 * @see {@link rgb} for opaque colors
 * @see {@link hsla} for HSL with alpha
 * @see {@link toCssRgba} for CSS string conversion
 */
export const rgba = (r: number, g: number, b: number, a: number): RGBA => ({
	r: clamp(r, 0, 255),
	g: clamp(g, 0, 255),
	b: clamp(b, 0, 255),
	a: clamp(a, 0, 1),
});

/**
 * Creates an HSL color object with automatic wrapping and clamping.
 *
 * @param h - Hue in degrees (0-360, wraps around)
 * @param s - Saturation percentage (0-100)
 * @param l - Lightness percentage (0-100)
 * @returns HSL color object with normalized values
 *
 * @remarks
 * HSL (Hue, Saturation, Lightness) is often more intuitive than RGB for color
 * manipulation, especially for creating color harmonies, adjusting brightness,
 * or working with color wheels. It separates color information from intensity.
 *
 * **Hue** represents the color position on the color wheel:
 * - 0° = Red, 60° = Yellow, 120° = Green, 180° = Cyan, 240° = Blue, 300° = Magenta
 * - Values outside 0-360 automatically wrap (e.g., 390° becomes 30°)
 *
 * **Saturation** controls color intensity:
 * - 0% = Grayscale (no color), 100% = Full color intensity
 *
 * **Lightness** controls brightness:
 * - 0% = Black, 50% = Normal color, 100% = White
 *
 * @example
 * Primary and secondary colors:
 * ```typescript
 * const red = hsl(0, 100, 50);      // Pure red
 * const yellow = hsl(60, 100, 50);  // Pure yellow
 * const green = hsl(120, 100, 50);  // Pure green
 * const cyan = hsl(180, 100, 50);   // Pure cyan
 * const blue = hsl(240, 100, 50);   // Pure blue
 * const magenta = hsl(300, 100, 50); // Pure magenta
 * ```
 *
 * @example
 * Color variations:
 * ```typescript
 * const baseHue = 240; // Blue
 * const vibrant = hsl(baseHue, 100, 50);  // Bright blue
 * const pastel = hsl(baseHue, 30, 80);    // Light blue
 * const dark = hsl(baseHue, 80, 20);      // Dark blue
 * const gray = hsl(baseHue, 0, 50);       // Gray (no saturation)
 * ```
 *
 * @see {@link hsla} for HSL with alpha transparency
 * @see {@link hslToRgb} for RGB conversion
 * @see {@link hueShift} for hue manipulation
 */
export const hsl = (h: number, s: number, l: number): HSL => ({
	h: ((h % 360) + 360) % 360, // Wrap hue to 0-360
	s: clamp(s, 0, 100),
	l: clamp(l, 0, 100),
});

/**
 * Creates an HSLA color object with automatic wrapping and clamping.
 *
 * @param h - Hue in degrees (0-360, wraps around)
 * @param s - Saturation percentage (0-100)
 * @param l - Lightness percentage (0-100)
 * @param a - Alpha component (0-1, where 0 is transparent and 1 is opaque)
 * @returns HSLA color object with normalized values
 *
 * @remarks
 * HSLA combines the intuitive color manipulation of HSL with alpha transparency.
 * This is particularly useful for creating transparent color overlays, gradients,
 * and fade effects while maintaining easy color relationships.
 *
 * The alpha channel follows the same conventions as RGBA, using normalized
 * values [0, 1] for consistency with web standards and GPU operations.
 *
 * @example
 * Transparent color variations:
 * ```typescript
 * const semiBlue = hsla(240, 100, 50, 0.5);    // 50% transparent blue
 * const fadeRed = hsla(0, 80, 60, 0.3);        // 30% opacity red
 * const glowGreen = hsla(120, 100, 70, 0.8);   // Bright green with transparency
 * ```
 *
 * @example
 * Color animation with transparency:
 * ```typescript
 * const animateColor = (time: number) => {
 *   const hue = (time * 60) % 360;  // Cycle through hues
 *   const alpha = (Math.sin(time) + 1) / 2;  // Pulse transparency
 *   return hsla(hue, 80, 60, alpha);
 * };
 * ```
 *
 * @see {@link hsl} for opaque HSL colors
 * @see {@link rgba} for RGB with alpha
 * @see {@link toCssHsla} for CSS string conversion
 */
export const hsla = (h: number, s: number, l: number, a: number): HSLA => ({
	h: ((h % 360) + 360) % 360,
	s: clamp(s, 0, 100),
	l: clamp(l, 0, 100),
	a: clamp(a, 0, 1),
});

// ============================================================================
// Color Space Conversions
// ============================================================================

/**
 * Converts an RGB color to HSL color space.
 *
 * @param color - RGB color object to convert
 * @returns HSL color object with equivalent color
 *
 * @remarks
 * This conversion is essential for color manipulation operations that are more
 * intuitive in HSL space, such as adjusting brightness, saturation, or creating
 * color harmonies. The conversion preserves the visual appearance while changing
 * the mathematical representation.
 *
 * The algorithm implements the standard RGB-to-HSL transformation used in
 * computer graphics, handling edge cases like grayscale colors (zero saturation)
 * and ensuring proper hue calculation across all color regions.
 *
 * @example
 * Convert primary colors:
 * ```typescript
 * const redRgb = rgb(255, 0, 0);
 * const redHsl = rgbToHsl(redRgb);  // { h: 0, s: 100, l: 50 }
 *
 * const grayRgb = rgb(128, 128, 128);
 * const grayHsl = rgbToHsl(grayRgb); // { h: 0, s: 0, l: 50 }
 * ```
 *
 * @example
 * Color analysis workflow:
 * ```typescript
 * const userColor = rgb(180, 120, 200);
 * const hslColor = rgbToHsl(userColor);
 *
 * console.log(`Hue: ${hslColor.h}°`);        // Color family
 * console.log(`Saturation: ${hslColor.s}%`);  // Color intensity
 * console.log(`Lightness: ${hslColor.l}%`);   // Brightness level
 * ```
 *
 * @see {@link hslToRgb} for the inverse conversion
 * @see {@link hsl} for creating HSL colors directly
 * @see {@link hueShift} for hue-based manipulation
 */
export const rgbToHsl = (color: RGB): HSL => {
	const r = color.r / 255;
	const g = color.g / 255;
	const b = color.b / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (delta !== 0) {
		s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / delta + 2) / 6;
				break;
			case b:
				h = ((r - g) / delta + 4) / 6;
				break;
		}
	}

	return {
		h: h * 360,
		s: s * 100,
		l: l * 100,
	};
};

/**
 * Converts an HSL color to RGB color space.
 *
 * @param color - HSL color object to convert
 * @returns RGB color object with equivalent color
 *
 * @remarks
 * This conversion enables the use of intuitive HSL color creation and manipulation
 * while maintaining compatibility with RGB-based rendering systems. The algorithm
 * implements the standard HSL-to-RGB transformation with proper handling of
 * grayscale colors and accurate color reproduction.
 *
 * The conversion process uses the mathematical relationship between HSL and RGB
 * to preserve visual color appearance while changing the representation format.
 * Special attention is given to hue calculations and proper channel scaling.
 *
 * @example
 * Convert HSL to RGB for rendering:
 * ```typescript
 * const blueHsl = hsl(240, 100, 50);
 * const blueRgb = hslToRgb(blueHsl);  // { r: 0, g: 0, b: 255 }
 *
 * const pastelHsl = hsl(60, 40, 80);
 * const pastelRgb = hslToRgb(pastelHsl); // Light yellow
 * ```
 *
 * @example
 * Color harmony generation:
 * ```typescript
 * const baseHue = 180; // Cyan
 * const colors = [
 *   hslToRgb(hsl(baseHue, 80, 50)),      // Base color
 *   hslToRgb(hsl(baseHue + 60, 80, 50)), // Analogous
 *   hslToRgb(hsl(baseHue + 180, 80, 50)) // Complementary
 * ];
 * ```
 *
 * @see {@link rgbToHsl} for the inverse conversion
 * @see {@link rgb} for creating RGB colors directly
 * @see {@link toCssRgb} for CSS string output
 */
export const hslToRgb = (color: HSL): RGB => {
	const h = color.h / 360;
	const s = color.s / 100;
	const l = color.l / 100;

	const hue2rgb = (p: number, q: number, t: number): number => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	if (s === 0) {
		const gray = Math.round(l * 255);
		return rgb(gray, gray, gray);
	}

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	const r = hue2rgb(p, q, h + 1 / 3);
	const g = hue2rgb(p, q, h);
	const b = hue2rgb(p, q, h - 1 / 3);

	return rgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
};

/**
 * Converts an RGB color to a hexadecimal color string.
 *
 * @param color - RGB color object to convert
 * @returns Hexadecimal color string in format #RRGGBB
 *
 * @remarks
 * Hexadecimal color notation is widely used in web development, CSS, and design tools.
 * Each color channel is represented as a two-digit hexadecimal number (00-FF),
 * providing the same 0-255 range as RGB but in a compact string format.
 *
 * The output format follows web standards with a leading # symbol and always
 * uses 6 characters (padded with leading zeros if necessary) for consistency.
 *
 * @example
 * Convert primary colors:
 * ```typescript
 * rgbToHex(rgb(255, 0, 0));     // Returns "#ff0000" (red)
 * rgbToHex(rgb(0, 255, 0));     // Returns "#00ff00" (green)
 * rgbToHex(rgb(0, 0, 255));     // Returns "#0000ff" (blue)
 * rgbToHex(rgb(255, 255, 255)); // Returns "#ffffff" (white)
 * ```
 *
 * @example
 * Use with CSS styling:
 * ```typescript
 * const themeColor = rgb(64, 128, 192);
 * const hexColor = rgbToHex(themeColor);  // "#4080c0"
 * element.style.backgroundColor = hexColor;
 * ```
 *
 * @see {@link hexToRgb} for the inverse conversion
 * @see {@link toCssRgb} for CSS rgb() format
 * @see {@link colors} for predefined hex values
 */
export const rgbToHex = (color: RGB): string => {
	const toHex = (n: number): string => {
		const hex = Math.round(clamp(n, 0, 255)).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};

/**
 * Converts a hexadecimal color string to RGB color object.
 *
 * @param hex - Hexadecimal color string (#RGB or #RRGGBB format)
 * @returns RGB color object with equivalent color
 *
 * @remarks
 * This function accepts both 3-character (#RGB) and 6-character (#RRGGBB)
 * hexadecimal color formats, automatically expanding short format to full
 * precision. The leading # symbol is optional but recommended for clarity.
 *
 * **Supported formats:**
 * - `#RGB` - Short format (each digit doubled: #F0A → #FF00AA)
 * - `#RRGGBB` - Full format (direct conversion)
 * - `RGB` or `RRGGBB` - Without # prefix (automatically handled)
 *
 * @example
 * Parse different hex formats:
 * ```typescript
 * hexToRgb("#ff0000");  // { r: 255, g: 0, b: 0 } (red)
 * hexToRgb("#f00");     // { r: 255, g: 0, b: 0 } (red, short)
 * hexToRgb("4080c0");   // { r: 64, g: 128, b: 192 } (no #)
 * hexToRgb("#abc");     // { r: 170, g: 187, b: 204 } (expanded)
 * ```
 *
 * @example
 * Parse colors from external sources:
 * ```typescript
 * const cssColor = "#336699";
 * const designColor = hexToRgb(cssColor);
 * const brighterColor = brighten(designColor, 20);
 * ```
 *
 * @see {@link rgbToHex} for the inverse conversion
 * @see {@link rgb} for direct RGB creation
 * @see {@link colors} for predefined color constants
 */
export const hexToRgb = (hex: string): RGB => {
	const cleanHex = hex.replace("#", "");
	const bigint = parseInt(cleanHex, 16);

	if (cleanHex.length === 3) {
		const r = (bigint >> 8) & 15;
		const g = (bigint >> 4) & 15;
		const b = bigint & 15;
		return rgb(r * 17, g * 17, b * 17);
	}

	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;

	return rgb(r, g, b);
};

// ============================================================================
// Color Manipulation and Interpolation
// ============================================================================

/**
 * Performs linear interpolation between two RGB colors.
 *
 * @param a - Starting RGB color (returned when t = 0)
 * @param b - Ending RGB color (returned when t = 1)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated RGB color
 *
 * @remarks
 * Color interpolation in RGB space provides direct channel-wise blending,
 * which is computationally efficient but may not always produce the most
 * visually pleasing results for large color differences. For more perceptually
 * uniform color transitions, consider using {@link colorLerpHsl}.
 *
 * The interpolation is performed independently on each color channel,
 * ensuring that intermediate colors remain valid RGB values.
 *
 * @example
 * Basic color blending:
 * ```typescript
 * const red = rgb(255, 0, 0);
 * const blue = rgb(0, 0, 255);
 * const purple = colorLerp(red, blue, 0.5);  // Mid-point blend
 * ```
 *
 * @example
 * Gradient generation:
 * ```typescript
 * const startColor = rgb(255, 100, 50);
 * const endColor = rgb(50, 200, 255);
 * const gradientSteps = 10;
 *
 * const gradient = Array.from({ length: gradientSteps }, (_, i) => {
 *   const t = i / (gradientSteps - 1);
 *   return colorLerp(startColor, endColor, t);
 * });
 * ```
 *
 * @see {@link colorLerpHsl} for HSL-based interpolation
 * @see {@link lerp} for the underlying interpolation function
 * @see {@link Tween} for animated color transitions
 */
export const colorLerp = (a: RGB, b: RGB, t: number): RGB => ({
	r: lerp(a.r, b.r, t),
	g: lerp(a.g, b.g, t),
	b: lerp(a.b, b.b, t),
});

/**
 * Performs linear interpolation between two HSL colors with intelligent hue handling.
 *
 * @param a - Starting HSL color (returned when t = 0)
 * @param b - Ending HSL color (returned when t = 1)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated HSL color
 *
 * @remarks
 * HSL interpolation often produces more visually pleasing color transitions
 * than RGB interpolation, especially for colors with different hues. This
 * function includes intelligent hue interpolation that considers the circular
 * nature of the color wheel to choose the shortest path when appropriate.
 *
 * **Hue interpolation logic:**
 * - For hue differences > 180°: Uses longer path for dramatic color shifts
 * - For hue differences < -180°: Adjusts for shortest path across 0° boundary
 * - Otherwise: Direct linear interpolation
 *
 * This approach provides predictable results while respecting the user's
 * intention for color transitions.
 *
 * @example
 * Smooth color wheel transitions:
 * ```typescript
 * const orange = hsl(30, 100, 50);   // Orange
 * const blue = hsl(240, 100, 50);    // Blue
 * const midway = colorLerpHsl(orange, blue, 0.5);  // Green-ish
 * ```
 *
 * @example
 * Color animation with natural progressions:
 * ```typescript
 * const sunset = hsl(15, 80, 60);    // Warm orange
 * const twilight = hsl(250, 60, 30); // Deep purple
 *
 * const animateColor = (progress: number) => {
 *   return colorLerpHsl(sunset, twilight, progress);
 * };
 * ```
 *
 * @see {@link colorLerp} for RGB-based interpolation
 * @see {@link hsl} for creating HSL colors
 * @see {@link rgbToHsl} and {@link hslToRgb} for color space conversion
 */
export const colorLerpHsl = (a: HSL, b: HSL, t: number): HSL => {
	const h1 = a.h;
	let h2 = b.h;

	// Check if we're crossing the 0°/360° boundary
	const diff = h2 - h1;

	// Only use shortest path when the difference suggests crossing boundary
	if (diff > 180) {
		// Going the long way, use direct interpolation
		// 0° to 240° should give 120° at t=0.5
	} else if (diff < -180) {
		// Crossing 0° boundary, adjust for shortest path
		h2 += 360;
	}

	const h = ((lerp(h1, h2, t) % 360) + 360) % 360;

	return {
		h,
		s: lerp(a.s, b.s, t),
		l: lerp(a.l, b.l, t),
	};
};

/**
 * Increases the lightness of an RGB color by a specified amount.
 *
 * @param color - RGB color to brighten
 * @param amount - Amount to increase lightness (0-100 scale)
 * @returns Brightened RGB color
 *
 * @remarks
 * This function converts the RGB color to HSL, adjusts the lightness component,
 * and converts back to RGB. This preserves the hue and saturation while making
 * the color lighter, which is more intuitive than adjusting RGB channels directly.
 *
 * The amount is added to the current lightness value (0-100 scale).
 * Values are automatically clamped to valid ranges, so excessive amounts
 * will result in white (maximum lightness).
 *
 * @example
 * Brighten existing colors:
 * ```typescript
 * const darkBlue = rgb(0, 0, 100);
 * const lightBlue = brighten(darkBlue, 30);  // Lighter shade
 *
 * const baseColor = rgb(128, 64, 192);
 * const highlight = brighten(baseColor, 20); // Highlight version
 * ```
 *
 * @example
 * UI state variations:
 * ```typescript
 * const buttonColor = rgb(60, 120, 180);
 * const hoverColor = brighten(buttonColor, 15);   // Hover state
 * const activeColor = brighten(buttonColor, 25);  // Active state
 * ```
 *
 * @see {@link darken} for the opposite operation
 * @see {@link saturate} and {@link desaturate} for saturation control
 * @see {@link hsl} for direct HSL color creation
 */
export const brighten = (color: RGB, amount: number): RGB => {
	const hslColor = rgbToHsl(color);
	const newHsl = hsl(hslColor.h, hslColor.s, hslColor.l + amount);
	return hslToRgb(newHsl);
};

/**
 * Decreases the lightness of an RGB color by a specified amount.
 *
 * @param color - RGB color to darken
 * @param amount - Amount to decrease lightness (0-100 scale)
 * @returns Darkened RGB color
 *
 * @remarks
 * This is a convenience function that calls {@link brighten} with a negative
 * amount. It provides a more intuitive API for darkening operations while
 * maintaining the same HSL-based lightness adjustment behavior.
 *
 * @example
 * Create darker color variants:
 * ```typescript
 * const baseColor = rgb(200, 150, 100);
 * const shadow = darken(baseColor, 30);      // Darker for shadows
 * const border = darken(baseColor, 15);      // Subtle border color
 * ```
 *
 * @see {@link brighten} for the opposite operation
 * @see {@link saturate} and {@link desaturate} for saturation control
 */
export const darken = (color: RGB, amount: number): RGB => {
	return brighten(color, -amount);
};

/**
 * Increases the saturation of an RGB color by a specified amount.
 *
 * @param color - RGB color to saturate
 * @param amount - Amount to increase saturation (0-100 scale)
 * @returns More saturated RGB color
 *
 * @remarks
 * Saturation controls the intensity or purity of a color. Higher saturation
 * makes colors more vivid and vibrant, while lower saturation moves colors
 * toward grayscale. This function preserves hue and lightness while adjusting
 * color intensity.
 *
 * The operation is performed in HSL color space for more intuitive results
 * compared to RGB channel manipulation.
 *
 * @example
 * Enhance color intensity:
 * ```typescript
 * const mutedColor = rgb(120, 100, 140);     // Somewhat muted purple
 * const vibrant = saturate(mutedColor, 40);  // More vivid purple
 *
 * const pastelBlue = rgb(150, 180, 200);
 * const richBlue = saturate(pastelBlue, 60); // Deeper, richer blue
 * ```
 *
 * @example
 * UI emphasis and highlighting:
 * ```typescript
 * const normalText = rgb(100, 100, 120);
 * const emphasized = saturate(normalText, 50); // More prominent
 * const accent = saturate(normalText, 80);     // High emphasis
 * ```
 *
 * @see {@link desaturate} for the opposite operation
 * @see {@link brighten} and {@link darken} for lightness control
 * @see {@link grayscale} for complete desaturation
 */
export const saturate = (color: RGB, amount: number): RGB => {
	const hslColor = rgbToHsl(color);
	const newHsl = hsl(hslColor.h, hslColor.s + amount, hslColor.l);
	return hslToRgb(newHsl);
};

/**
 * Decreases the saturation of an RGB color by a specified amount.
 *
 * @param color - RGB color to desaturate
 * @param amount - Amount to decrease saturation (0-100 scale)
 * @returns Less saturated RGB color
 *
 * @remarks
 * Desaturation moves colors toward grayscale by reducing color intensity
 * while preserving hue and lightness. This is useful for creating muted
 * color palettes, subtle backgrounds, or disabled UI states.
 *
 * This is a convenience function that calls {@link saturate} with a negative
 * amount, providing a more intuitive API for desaturation operations.
 *
 * @example
 * Create muted color variants:
 * ```typescript
 * const brightRed = rgb(255, 0, 0);
 * const mutedRed = desaturate(brightRed, 50);    // Less intense red
 * const subtleRed = desaturate(brightRed, 80);   // Very muted red
 * ```
 *
 * @example
 * UI state management:
 * ```typescript
 * const activeColor = rgb(0, 150, 255);
 * const inactiveColor = desaturate(activeColor, 60); // Disabled state
 * const hoverColor = desaturate(activeColor, 20);    // Subtle hover
 * ```
 *
 * @see {@link saturate} for the opposite operation
 * @see {@link grayscale} for complete desaturation
 */
export const desaturate = (color: RGB, amount: number): RGB => {
	return saturate(color, -amount);
};

/**
 * Shifts the hue of an RGB color by a specified number of degrees.
 *
 * @param color - RGB color to shift
 * @param degrees - Degrees to shift hue (positive = clockwise, negative = counter-clockwise)
 * @returns Color with shifted hue
 *
 * @remarks
 * Hue shifting rotates the color around the color wheel while preserving
 * saturation and lightness. This is perfect for creating color variations,
 * rainbow effects, and color harmonies. The hue wraps around at 360°.
 *
 * Common hue shift values:
 * - 60° = Move to adjacent primary/secondary color
 * - 120° = Move to triadic harmony color
 * - 180° = Move to complementary color
 *
 * @example
 * Create color variations:
 * ```typescript
 * const baseColor = rgb(255, 100, 100);      // Reddish
 * const orangeShift = hueShift(baseColor, 30); // More orange
 * const blueShift = hueShift(baseColor, 180);  // Complementary blue
 * ```
 *
 * @example
 * Rainbow animation:
 * ```typescript
 * const rainbow = (time: number) => {
 *   const baseColor = rgb(255, 100, 150);
 *   return hueShift(baseColor, time * 60); // Rotate through hues
 * };
 * ```
 *
 * @see {@link complementary} for 180° hue shift
 * @see {@link triadic} for 120° shifts
 * @see {@link analogous} for small hue variations
 */
export const hueShift = (color: RGB, degrees: number): RGB => {
	const hslColor = rgbToHsl(color);
	const newHsl = hsl(hslColor.h + degrees, hslColor.s, hslColor.l);
	return hslToRgb(newHsl);
};

/**
 * Converts an RGB color to grayscale using luminance weighting.
 *
 * @param color - RGB color to convert
 * @returns Grayscale RGB color
 *
 * @remarks
 * This function uses the ITU-R BT.601 luma coefficients (0.299, 0.587, 0.114)
 * which weight the RGB channels according to human visual perception. Green
 * contributes most to perceived brightness, followed by red, then blue.
 *
 * This produces more visually accurate grayscale conversion than simple
 * averaging or single-channel extraction.
 *
 * @example
 * Convert to grayscale:
 * ```typescript
 * const colorPhoto = rgb(180, 120, 200);
 * const bwPhoto = grayscale(colorPhoto);     // Perceptually correct gray
 *
 * const redPixel = rgb(255, 0, 0);
 * const grayRed = grayscale(redPixel);       // Darker gray (red is dim)
 *
 * const greenPixel = rgb(0, 255, 0);
 * const grayGreen = grayscale(greenPixel);   // Brighter gray (green is bright)
 * ```
 *
 * @example
 * Image processing:
 * ```typescript
 * const processImage = (imageData: ImageData) => {
 *   for (let i = 0; i < imageData.data.length; i += 4) {
 *     const color = rgb(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
 *     const gray = grayscale(color);
 *     imageData.data[i] = gray.r;
 *     imageData.data[i+1] = gray.g;
 *     imageData.data[i+2] = gray.b;
 *   }
 * };
 * ```
 *
 * @see {@link desaturate} for partial desaturation
 * @see {@link colorDistance} for color similarity
 */
export const grayscale = (color: RGB): RGB => {
	const gray = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
	return rgb(gray, gray, gray);
};

/**
 * Inverts an RGB color by subtracting each channel from 255.
 *
 * @param color - RGB color to invert
 * @returns Inverted RGB color
 *
 * @remarks
 * Color inversion creates the "negative" of a color by flipping each channel
 * value. This is commonly used for creating high contrast effects, selection
 * highlights, and accessibility features. White becomes black, red becomes cyan, etc.
 *
 * @example
 * Basic color inversion:
 * ```typescript
 * invert(rgb(255, 255, 255)); // Black (0, 0, 0)
 * invert(rgb(0, 0, 0));       // White (255, 255, 255)
 * invert(rgb(255, 0, 0));     // Cyan (0, 255, 255)
 * invert(rgb(128, 64, 192));  // (127, 191, 63)
 * ```
 *
 * @example
 * UI contrast and accessibility:
 * ```typescript
 * const backgroundColor = rgb(240, 240, 240);
 * const contrastText = invert(backgroundColor); // Dark text on light bg
 *
 * const selectionColor = rgb(100, 150, 200);
 * const highlightColor = invert(selectionColor); // High contrast selection
 * ```
 *
 * @see {@link complementary} for color wheel opposite
 * @see {@link contrast} for contrast adjustment
 */
export const invert = (color: RGB): RGB => ({
	r: 255 - color.r,
	g: 255 - color.g,
	b: 255 - color.b,
});

/**
 * Adjusts the contrast of an RGB color.
 *
 * @param color - RGB color to adjust
 * @param amount - Contrast adjustment (-255 to 255, where 0 = no change)
 * @returns Color with adjusted contrast
 *
 * @remarks
 * Contrast adjustment increases or decreases the difference between a color
 * and middle gray (128, 128, 128). Positive values increase contrast (making
 * lights lighter and darks darker), while negative values decrease contrast
 * (moving all colors toward middle gray).
 *
 * The algorithm applies the standard contrast formula used in image processing:
 * `newValue = factor * (oldValue - 128) + 128`
 *
 * @example
 * Contrast adjustments:
 * ```typescript
 * const baseColor = rgb(180, 120, 200);
 * const highContrast = contrast(baseColor, 50);   // More dramatic
 * const lowContrast = contrast(baseColor, -50);   // More muted
 * const extremeContrast = contrast(baseColor, 100); // Very dramatic
 * ```
 *
 * @example
 * Image enhancement:
 * ```typescript
 * const enhanceImage = (imageData: ImageData, contrastLevel: number) => {
 *   for (let i = 0; i < imageData.data.length; i += 4) {
 *     const color = rgb(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
 *     const enhanced = contrast(color, contrastLevel);
 *     imageData.data[i] = enhanced.r;
 *     imageData.data[i+1] = enhanced.g;
 *     imageData.data[i+2] = enhanced.b;
 *   }
 * };
 * ```
 *
 * @see {@link brighten} and {@link darken} for lightness adjustment
 * @see {@link saturate} and {@link desaturate} for saturation adjustment
 */
export const contrast = (color: RGB, amount: number): RGB => {
	const factor = (259 * (amount + 255)) / (255 * (259 - amount));
	return rgb(
		clamp(factor * (color.r - 128) + 128, 0, 255),
		clamp(factor * (color.g - 128) + 128, 0, 255),
		clamp(factor * (color.b - 128) + 128, 0, 255),
	);
};

// ============================================================================
// Color Harmony Functions
// ============================================================================

/**
 * Finds the complementary color (opposite on the color wheel).
 *
 * @param color - Base RGB color
 * @returns Complementary RGB color
 *
 * @remarks
 * Complementary colors are located 180° apart on the color wheel and create
 * maximum visual contrast while remaining harmonious. They are fundamental
 * in color theory and are widely used in design for creating vibrant,
 * attention-grabbing color schemes.
 *
 * @example
 * Create complementary pairs:
 * ```typescript
 * const red = rgb(255, 0, 0);
 * const cyan = complementary(red);      // Opposite of red
 *
 * const orange = rgb(255, 165, 0);
 * const blue = complementary(orange);   // Opposite of orange
 * ```
 *
 * @example
 * UI accent colors:
 * ```typescript
 * const primaryColor = rgb(100, 150, 200);
 * const accentColor = complementary(primaryColor); // High contrast accent
 * ```
 *
 * @see {@link triadic} for three-color harmony
 * @see {@link analogous} for adjacent harmonies
 * @see {@link hueShift} for custom hue rotations
 */
export const complementary = (color: RGB): RGB => {
	const hslColor = rgbToHsl(color);
	const newHsl = hsl(hslColor.h + 180, hslColor.s, hslColor.l);
	return hslToRgb(newHsl);
};

/**
 * Creates a triadic color harmony (three colors evenly spaced on the color wheel).
 *
 * @param color - Base RGB color
 * @returns Array of two additional colors forming a triadic harmony
 *
 * @remarks
 * Triadic color schemes use three colors that are evenly spaced around the
 * color wheel (120° apart). This creates a vibrant, balanced palette while
 * maintaining color harmony. Triadic schemes are particularly effective for
 * creating energetic, playful designs.
 *
 * @example
 * Create triadic palette:
 * ```typescript
 * const baseColor = rgb(255, 0, 0);        // Red
 * const [green, blue] = triadic(baseColor); // Green and blue variants
 * const palette = [baseColor, green, blue]; // Complete triadic scheme
 * ```
 *
 * @example
 * Game UI color scheme:
 * ```typescript
 * const playerColor = rgb(200, 100, 50);
 * const [enemyColor, neutralColor] = triadic(playerColor);
 * // Use for different game elements with natural harmony
 * ```
 *
 * @see {@link complementary} for two-color harmony
 * @see {@link analogous} for subtle harmonies
 * @see {@link tetradic} for four-color harmony
 */
export const triadic = (
	color: RGB,
): [
	RGB,
	RGB,
] => {
	const hslColor = rgbToHsl(color);
	const color1 = hslToRgb(hsl(hslColor.h + 120, hslColor.s, hslColor.l));
	const color2 = hslToRgb(hsl(hslColor.h + 240, hslColor.s, hslColor.l));
	return [
		color1,
		color2,
	];
};

/**
 * Creates an analogous color harmony (adjacent colors on the color wheel).
 *
 * @param color - Base RGB color
 * @param angle - Degrees of separation (default 30°)
 * @returns Array of two adjacent colors
 *
 * @remarks
 * Analogous colors are located next to each other on the color wheel,
 * creating gentle, comfortable color schemes. They work well together
 * because they share common undertones and create natural progressions.
 * Perfect for creating serene, cohesive designs.
 *
 * @example
 * Subtle color variations:
 * ```typescript
 * const sunset = rgb(255, 150, 100);        // Orange
 * const [warm1, warm2] = analogous(sunset);   // Adjacent warm colors
 * const palette = [warm2, sunset, warm1];     // Smooth gradient
 * ```
 *
 * @example
 * Nature-inspired palette:
 * ```typescript
 * const forestGreen = rgb(50, 150, 75);
 * const [yellow, blue] = analogous(forestGreen, 45); // Wider spread
 * // Creates yellow-green, green, blue-green harmony
 * ```
 *
 * @see {@link complementary} for maximum contrast
 * @see {@link triadic} for balanced three-color schemes
 * @see {@link hueShift} for custom angle shifts
 */
export const analogous = (
	color: RGB,
	angle: number = 30,
): [
	RGB,
	RGB,
] => {
	const hslColor = rgbToHsl(color);
	const color1 = hslToRgb(hsl(hslColor.h + angle, hslColor.s, hslColor.l));
	const color2 = hslToRgb(hsl(hslColor.h - angle, hslColor.s, hslColor.l));
	return [
		color1,
		color2,
	];
};

export const splitComplementary = (
	color: RGB,
): [
	RGB,
	RGB,
] => {
	const hslColor = rgbToHsl(color);
	const color1 = hslToRgb(hsl(hslColor.h + 150, hslColor.s, hslColor.l));
	const color2 = hslToRgb(hsl(hslColor.h + 210, hslColor.s, hslColor.l));
	return [
		color1,
		color2,
	];
};

export const tetradic = (
	color: RGB,
): [
	RGB,
	RGB,
	RGB,
] => {
	const hslColor = rgbToHsl(color);
	const color1 = hslToRgb(hsl(hslColor.h + 90, hslColor.s, hslColor.l));
	const color2 = hslToRgb(hsl(hslColor.h + 180, hslColor.s, hslColor.l));
	const color3 = hslToRgb(hsl(hslColor.h + 270, hslColor.s, hslColor.l));
	return [
		color1,
		color2,
		color3,
	];
};

// ============================================================================
// Color Analysis and Utilities
// ============================================================================

/**
 * Calculates the Euclidean distance between two RGB colors.
 *
 * @param a - First RGB color
 * @param b - Second RGB color
 * @returns Distance value (0 = identical, ~441 = maximum difference)
 *
 * @remarks
 * Color distance provides a mathematical measure of how different two colors
 * appear. It uses simple Euclidean distance in RGB space, treating each
 * color as a 3D point. While not perceptually perfect, it's fast and
 * useful for color matching, clustering, and similarity detection.
 *
 * Maximum possible distance is √(255² + 255² + 255²) ≈ 441.67
 *
 * @example
 * Color similarity detection:
 * ```typescript
 * const color1 = rgb(100, 150, 200);
 * const color2 = rgb(105, 155, 195);
 * const distance = colorDistance(color1, color2); // Small value = similar
 *
 * if (distance < 20) {
 *   console.log('Colors are very similar');
 * }
 * ```
 *
 * @example
 * Color palette optimization:
 * ```typescript
 * const findSimilarColors = (target: RGB, palette: RGB[], threshold: number) => {
 *   return palette.filter(color => colorDistance(target, color) < threshold);
 * };
 * ```
 *
 * @see {@link colorSimilarity} for normalized similarity (0-1)
 */
export const colorDistance = (a: RGB, b: RGB): number => {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Calculates the similarity between two RGB colors as a normalized value.
 *
 * @param a - First RGB color
 * @param b - Second RGB color
 * @returns Similarity value (1 = identical, 0 = maximum difference)
 *
 * @remarks
 * Color similarity provides an intuitive 0-1 scale where 1 means identical
 * colors and 0 means maximally different colors. This is more user-friendly
 * than raw distance values and useful for similarity thresholds, matching
 * algorithms, and user interfaces.
 *
 * @example
 * Similarity threshold testing:
 * ```typescript
 * const targetColor = rgb(100, 150, 200);
 * const candidateColor = rgb(110, 140, 190);
 * const similarity = colorSimilarity(targetColor, candidateColor);
 *
 * if (similarity > 0.9) {
 *   console.log('Colors are nearly identical');
 * } else if (similarity > 0.7) {
 *   console.log('Colors are similar');
 * }
 * ```
 *
 * @example
 * Color matching for image processing:
 * ```typescript
 * const matchColor = (target: RGB, candidates: RGB[]): RGB => {
 *   return candidates.reduce((best, candidate) => {
 *     const currentSimilarity = colorSimilarity(target, candidate);
 *     const bestSimilarity = colorSimilarity(target, best);
 *     return currentSimilarity > bestSimilarity ? candidate : best;
 *   });
 * };
 * ```
 *
 * @see {@link colorDistance} for raw distance values
 */
export const colorSimilarity = (a: RGB, b: RGB): number => {
	const maxDistance = Math.sqrt(3 * 255 * 255);
	return 1 - colorDistance(a, b) / maxDistance;
};

// Predefined colors
export const colors = {
	// Web colors
	white: rgb(255, 255, 255),
	black: rgb(0, 0, 0),
	red: rgb(255, 0, 0),
	green: rgb(0, 255, 0),
	blue: rgb(0, 0, 255),
	yellow: rgb(255, 255, 0),
	cyan: rgb(0, 255, 255),
	magenta: rgb(255, 0, 255),

	// Grays
	gray: rgb(128, 128, 128),
	lightGray: rgb(192, 192, 192),
	darkGray: rgb(64, 64, 64),

	// Common colors
	orange: rgb(255, 165, 0),
	purple: rgb(128, 0, 128),
	pink: rgb(255, 192, 203),
	brown: rgb(165, 42, 42),

	// Transparent
	transparent: rgba(0, 0, 0, 0),
} as const;

// CSS color string functions
export const toCssRgb = (color: RGB): string => {
	return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
};

export const toCssRgba = (color: RGBA): string => {
	return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
};

export const toCssHsl = (color: HSL): string => {
	return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
};

export const toCssHsla = (color: HSLA): string => {
	return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${color.a})`;
};
