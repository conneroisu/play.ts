/**
 * Geometric utilities for 2D graphics and computational geometry.
 *
 * This module provides comprehensive geometric functions for creative coding,
 * including point operations, shape creation, collision detection, and spatial
 * analysis. All functions are optimized for real-time graphics applications
 * and interactive visualizations.
 *
 * @remarks
 * The geometry system follows standard computer graphics conventions:
 * - Coordinate system: Standard Cartesian (x-right, y-up in mathematical contexts)
 * - Angles: Measured in radians, with 0 pointing right (positive x-axis)
 * - Rectangles: Defined by top-left corner (x, y) and dimensions (width, height)
 * - Circles: Defined by center point and radius
 * - All collision detection uses efficient algorithms suitable for real-time applications
 *
 * **Key geometric primitives:**
 * - **Point**: 2D coordinate with x, y components
 * - **Size**: Dimensions with width, height components
 * - **Rectangle**: Axis-aligned bounding box
 * - **Circle**: Center point with radius
 * - **Line**: Two points defining a line segment
 * - **Polygon**: Array of points forming a closed shape
 *
 * @example
 * Basic shape creation and manipulation:
 * ```typescript
 * import { point, rect, circle, pointDistance } from 'play.ts';
 *
 * const center = point(100, 100);
 * const bounds = rect(0, 0, 200, 200);
 * const shape = circle(center.x, center.y, 50);
 *
 * const distance = pointDistance(center, point(150, 150));
 * ```
 *
 * @example
 * Collision detection:
 * ```typescript
 * import { rectIntersects, pointInCircle, circleRectIntersects } from 'play.ts';
 *
 * const playerBounds = rect(player.x, player.y, 32, 32);
 * const enemyBounds = rect(enemy.x, enemy.y, 24, 24);
 *
 * if (rectIntersects(playerBounds, enemyBounds)) {
 *   handleCollision();
 * }
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Computational_geometry | Computational Geometry}
 * @see {@link https://developer.mozilla.org/docs/Games/Techniques/2D_collision_detection | 2D Collision Detection}
 */

import type {
  Circle,
  Point,
  Rectangle,
  Size,
  Vector2,
} from "../types/index.ts";
import {
  abs,
  atan2,
  cos,
  max,
  min,
  PI,
  sin,
  TWO_PI,
  vec2,
  vec2Add,
  vec2Distance,
  vec2Mul,
  vec2Normalize,
  vec2Sub,
} from "./math.ts";

// ============================================================================
// Point Utilities
// ============================================================================

/**
 * Creates a 2D point with x and y coordinates.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Point object with specified coordinates
 *
 * @remarks
 * Points are the fundamental building blocks of 2D geometry, representing
 * positions, vertices, and coordinate locations. This function provides a
 * convenient way to create point objects with type safety.
 *
 * Points are used throughout the geometry system as:
 * - Vertices for polygons and shapes
 * - Centers for circles and transformations
 * - Positions for objects and entities
 * - Control points for curves and paths
 *
 * @example
 * Basic point creation:
 * ```typescript
 * const origin = point(0, 0);
 * const center = point(100, 100);
 * const corner = point(width - 1, height - 1);
 * ```
 *
 * @example
 * Point-based calculations:
 * ```typescript
 * const start = point(10, 20);
 * const end = point(50, 80);
 * const distance = pointDistance(start, end);
 * const midpoint = pointLerp(start, end, 0.5);
 * ```
 *
 * @see {@link pointDistance} for distance calculations
 * @see {@link pointLerp} for interpolation
 * @see {@link Vector2} for vector operations
 */
export const point = (x: number, y: number): Point => ({
  x,
  y,
});

/**
 * Calculates the Euclidean distance between two points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Distance between the points
 *
 * @remarks
 * This function computes the straight-line distance using the Pythagorean theorem:
 * `distance = √((x2-x1)² + (y2-y1)²)`. This is the most common distance
 * metric in 2D graphics and is used for collision detection, proximity checks,
 * and spatial analysis.
 *
 * For performance-critical applications where you only need to compare distances
 * (without knowing the exact value), consider using {@link pointDistanceSq}
 * to avoid the expensive square root operation.
 *
 * @example
 * Distance calculations:
 * ```typescript
 * const player = point(100, 100);
 * const enemy = point(150, 130);
 * const distance = pointDistance(player, enemy);  // ≈ 58.31
 *
 * if (distance < 50) {
 *   console.log('Enemy is nearby!');
 * }
 * ```
 *
 * @example
 * Find nearest object:
 * ```typescript
 * const findNearest = (target: Point, objects: Point[]) => {
 *   return objects.reduce((nearest, obj) => {
 *     const distToObj = pointDistance(target, obj);
 *     const distToNearest = pointDistance(target, nearest);
 *     return distToObj < distToNearest ? obj : nearest;
 *   });
 * };
 * ```
 *
 * @see {@link pointDistanceSq} for squared distance (performance optimization)
 * @see {@link vec2Distance} for the underlying vector calculation
 */
export const pointDistance = (a: Point, b: Point): number => {
  return vec2Distance(a, b);
};

/**
 * Calculates the squared distance between two points (without square root).
 *
 * @param a - First point
 * @param b - Second point
 * @returns Squared distance between the points
 *
 * @remarks
 * This function computes the squared Euclidean distance: `(x2-x1)² + (y2-y1)²`.
 * It's significantly faster than {@link pointDistance} because it avoids the
 * expensive square root operation, making it ideal for performance-critical
 * applications like collision detection or nearest-neighbor searches.
 *
 * **When to use squared distance:**
 * - Comparing distances (order relationships are preserved)
 * - Checking if distance is within a threshold (compare against threshold²)
 * - Performance-critical loops with many distance calculations
 *
 * @example
 * Efficient distance comparison:
 * ```typescript
 * const player = point(100, 100);
 * const enemy = point(150, 130);
 * const maxRange = 50;
 *
 * // Faster: compare squared distances
 * if (pointDistanceSq(player, enemy) < maxRange * maxRange) {
 *   attack(enemy);
 * }
 * ```
 *
 * @example
 * Performance-optimized nearest neighbor:
 * ```typescript
 * const findNearestFast = (target: Point, objects: Point[]) => {
 *   let nearest = objects[0];
 *   let minDistSq = pointDistanceSq(target, nearest);
 *
 *   for (const obj of objects.slice(1)) {
 *     const distSq = pointDistanceSq(target, obj);
 *     if (distSq < minDistSq) {
 *       minDistSq = distSq;
 *       nearest = obj;
 *     }
 *   }
 *   return nearest;
 * };
 * ```
 *
 * @see {@link pointDistance} for actual distance (with square root)
 * @see {@link vec2LengthSq} for vector magnitude squared
 */
export const pointDistanceSq = (a: Point, b: Point): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

/**
 * Performs linear interpolation between two points.
 *
 * @param a - Starting point (returned when t = 0)
 * @param b - Ending point (returned when t = 1)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated point along the line from a to b
 *
 * @remarks
 * Point interpolation is fundamental for animation, path following, and smooth
 * transitions between positions. The interpolation is performed independently
 * on both x and y coordinates, creating a straight-line path between the points.
 *
 * Values of t outside [0, 1] will extrapolate beyond the line segment,
 * which can be useful for extending paths or predicting movement.
 *
 * @example
 * Basic point interpolation:
 * ```typescript
 * const start = point(0, 0);
 * const end = point(100, 100);
 *
 * const quarter = pointLerp(start, end, 0.25);  // (25, 25)
 * const middle = pointLerp(start, end, 0.5);    // (50, 50)
 * const threeQuarter = pointLerp(start, end, 0.75); // (75, 75)
 * ```
 *
 * @example
 * Animation and movement:
 * ```typescript
 * const animateObject = (startPos: Point, endPos: Point, duration: number) => {
 *   const startTime = Date.now();
 *
 *   const update = () => {
 *     const elapsed = Date.now() - startTime;
 *     const progress = Math.min(elapsed / duration, 1);
 *     const currentPos = pointLerp(startPos, endPos, progress);
 *
 *     drawObject(currentPos);
 *
 *     if (progress < 1) {
 *       requestAnimationFrame(update);
 *     }
 *   };
 *   update();
 * };
 * ```
 *
 * @example
 * Path following:
 * ```typescript
 * const waypoints = [point(0, 0), point(100, 50), point(200, 100)];
 *
 * const followPath = (t: number) => {
 *   const segmentCount = waypoints.length - 1;
 *   const segmentT = t * segmentCount;
 *   const segmentIndex = Math.floor(segmentT);
 *   const localT = segmentT - segmentIndex;
 *
 *   if (segmentIndex >= segmentCount) return waypoints[waypoints.length - 1];
 *
 *   return pointLerp(waypoints[segmentIndex], waypoints[segmentIndex + 1], localT);
 * };
 * ```
 *
 * @see {@link lerp} for the underlying interpolation function
 * @see {@link vec2Lerp} for vector interpolation
 * @see {@link quadraticBezier} and {@link cubicBezier} for curved interpolation
 */
export const pointLerp = (a: Point, b: Point, t: number): Point => {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
};

/**
 * Calculates the angle from point a to point b in radians.
 *
 * @param a - Starting point (origin of the angle)
 * @param b - Target point (direction of the angle)
 * @returns Angle in radians (-π to π)
 *
 * @remarks
 * This function returns the angle of the vector from point a to point b,
 * measured from the positive x-axis. The angle follows standard mathematical
 * convention: 0 radians points right (positive x), π/2 points up (positive y).
 *
 * The result is in the range [-π, π], with:
 * - 0 = pointing right
 * - π/2 = pointing up
 * - π or -π = pointing left
 * - -π/2 = pointing down
 *
 * @example
 * Calculate direction angles:
 * ```typescript
 * const center = point(100, 100);
 * const target = point(150, 80);
 *
 * const angle = pointAngle(center, target);  // Angle to target
 * const degrees = (angle * 180) / Math.PI;   // Convert to degrees
 * ```
 *
 * @example
 * Object rotation and aiming:
 * ```typescript
 * const player = point(playerX, playerY);
 * const mouse = point(mouseX, mouseY);
 *
 * const aimAngle = pointAngle(player, mouse);
 *
 * // Rotate sprite to face mouse
 * sprite.rotation = aimAngle;
 *
 * // Calculate projectile velocity
 * const speed = 300;
 * const velocity = {
 *   x: Math.cos(aimAngle) * speed,
 *   y: Math.sin(aimAngle) * speed
 * };
 * ```
 *
 * @example
 * Angle-based positioning:
 * ```typescript
 * const orbitPoint = (center: Point, radius: number, angle: number): Point => {
 *   return point(
 *     center.x + Math.cos(angle) * radius,
 *     center.y + Math.sin(angle) * radius
 *   );
 * };
 *
 * // Position objects in a circle
 * const objectCount = 8;
 * const objects = Array.from({ length: objectCount }, (_, i) => {
 *   const angle = (i / objectCount) * TWO_PI;
 *   return orbitPoint(center, 100, angle);
 * });
 * ```
 *
 * @see {@link vec2Angle} for vector angle calculation
 * @see {@link atan2} for the underlying trigonometric function
 * @see {@link vec2FromAngle} for creating vectors from angles
 */
export const pointAngle = (a: Point, b: Point): number => {
  return atan2(b.y - a.y, b.x - a.x);
};

// ============================================================================
// Size Utilities
// ============================================================================

/**
 * Creates a size object with width and height dimensions.
 *
 * @param width - Width dimension (should be non-negative)
 * @param height - Height dimension (should be non-negative)
 * @returns Size object with specified dimensions
 *
 * @remarks
 * Size objects represent 2D dimensions and are used throughout the geometry
 * system for defining object bounds, container sizes, and scaling operations.
 * They are commonly used in conjunction with rectangles, UI elements, and
 * canvas operations.
 *
 * By convention, width and height should be non-negative values, though
 * the function doesn't enforce this to allow for specialized use cases
 * involving flipped or inverted coordinate systems.
 *
 * @example
 * Basic size creation:
 * ```typescript
 * const screenSize = size(1920, 1080);    // HD resolution
 * const tileSize = size(32, 32);          // Square tile
 * const buttonSize = size(120, 40);       // UI button
 * ```
 *
 * @example
 * Size-based calculations:
 * ```typescript
 * const canvasSize = size(800, 600);
 * const area = sizeArea(canvasSize);              // 480000
 * const aspectRatio = sizeAspectRatio(canvasSize); // 1.333...
 * const scaled = sizeScale(canvasSize, 0.5);      // 400x300
 * ```
 *
 * @see {@link sizeArea} for area calculations
 * @see {@link sizeScale} for scaling operations
 * @see {@link rect} for creating rectangles with size
 */
export const size = (width: number, height: number): Size => ({
  width,
  height,
});

/**
 * Calculates the area of a size (width × height).
 *
 * @param s - Size object
 * @returns Area in square units
 *
 * @remarks
 * Area calculation is useful for memory allocation, performance optimization,
 * collision detection broad-phase, and comparing relative sizes of objects.
 *
 * @example
 * ```typescript
 * const windowSize = size(1024, 768);
 * const pixels = sizeArea(windowSize);  // 786432 pixels
 *
 * const tileSize = size(64, 64);
 * const tileArea = sizeArea(tileSize);  // 4096 square pixels
 * ```
 *
 * @see {@link sizePerimeter} for perimeter calculations
 */
export const sizeArea = (s: Size): number => {
  return s.width * s.height;
};

/**
 * Calculates the perimeter of a rectangular size.
 *
 * @param s - Size object
 * @returns Perimeter (sum of all sides)
 *
 * @remarks
 * Perimeter calculation assumes the size represents a rectangle.
 * Useful for border calculations, outline drawing, and geometric analysis.
 *
 * @example
 * ```typescript
 * const frameSize = size(100, 80);
 * const borderLength = sizePerimeter(frameSize);  // 360 units
 * ```
 */
export const sizePerimeter = (s: Size): number => {
  return 2 * (s.width + s.height);
};

/**
 * Calculates the aspect ratio of a size (width ÷ height).
 *
 * @param s - Size object
 * @returns Aspect ratio as a decimal number
 *
 * @remarks
 * Aspect ratio is crucial for maintaining proportions during scaling,
 * responsive design, and image/video processing. Common aspect ratios:
 * - 1.0 = Square (1:1)
 * - 1.333... = 4:3 (traditional TV/monitor)
 * - 1.777... = 16:9 (widescreen)
 * - 2.0 = 2:1 (cinema)
 *
 * @example
 * Aspect ratio analysis:
 * ```typescript
 * const hdSize = size(1920, 1080);
 * const ratio = sizeAspectRatio(hdSize);  // 1.777... (16:9)
 *
 * if (ratio > 1) {
 *   console.log('Landscape orientation');
 * } else if (ratio < 1) {
 *   console.log('Portrait orientation');
 * } else {
 *   console.log('Square');
 * }
 * ```
 *
 * @see {@link sizeFit} and {@link sizeFill} for aspect-ratio-aware scaling
 */
export const sizeAspectRatio = (s: Size): number => {
  return s.width / s.height;
};

/**
 * Scales a size by a uniform factor.
 *
 * @param s - Size object to scale
 * @param factor - Scaling factor (1.0 = no change, 2.0 = double size, 0.5 = half size)
 * @returns New size object with scaled dimensions
 *
 * @remarks
 * Uniform scaling maintains the aspect ratio of the original size.
 * This is the most common scaling operation and is used for zoom effects,
 * resolution changes, and proportional resizing.
 *
 * @example
 * Scaling operations:
 * ```typescript
 * const originalSize = size(100, 80);
 * const doubled = sizeScale(originalSize, 2.0);    // 200x160
 * const halved = sizeScale(originalSize, 0.5);     // 50x40
 * const tiny = sizeScale(originalSize, 0.1);       // 10x8
 * ```
 *
 * @example
 * Responsive scaling:
 * ```typescript
 * const baseSize = size(400, 300);
 * const screenWidth = 800;
 * const targetWidth = 200;
 * const scaleFactor = targetWidth / baseSize.width;
 * const scaledSize = sizeScale(baseSize, scaleFactor);
 * ```
 *
 * @see {@link sizeFit} for container-constrained scaling
 * @see {@link sizeFill} for container-filling scaling
 */
export const sizeScale = (s: Size, factor: number): Size => ({
  width: s.width * factor,
  height: s.height * factor,
});

/**
 * Scales a size to fit inside a container while maintaining aspect ratio.
 *
 * @param s - Size object to fit
 * @param container - Container size that must contain the result
 * @returns New size that fits entirely within the container
 *
 * @remarks
 * This function implements "contain" scaling behavior, where the entire
 * content is visible within the container. The result will touch at least
 * one edge of the container, with possible empty space on the other sides
 * if aspect ratios don't match.
 *
 * This is equivalent to CSS `object-fit: contain` or `background-size: contain`.
 *
 * @example
 * Image fitting:
 * ```typescript
 * const imageSize = size(800, 600);     // 4:3 image
 * const containerSize = size(400, 400); // Square container
 *
 * const fittedSize = sizeFit(imageSize, containerSize);
 * // Result: { width: 400, height: 300 } - fits width, empty space top/bottom
 * ```
 *
 * @example
 * Responsive UI scaling:
 * ```typescript
 * const uiSize = size(1200, 800);       // UI design size
 * const screenSize = size(1024, 768);   // Actual screen
 *
 * const scaledUI = sizeFit(uiSize, screenSize);
 * // Scales UI to fit on screen without cropping
 * ```
 *
 * @see {@link sizeFill} for filling the container (may crop)
 * @see {@link sizeScale} for uniform scaling
 * @see {@link sizeAspectRatio} for aspect ratio calculations
 */
export const sizeFit = (s: Size, container: Size): Size => {
  const scale = min(container.width / s.width, container.height / s.height);
  return sizeScale(s, scale);
};

/**
 * Scales a size to fill a container while maintaining aspect ratio.
 *
 * @param s - Size object to scale
 * @param container - Container size to fill completely
 * @returns New size that completely fills the container
 *
 * @remarks
 * This function implements "cover" scaling behavior, where the content
 * completely fills the container. The result will touch all edges of the
 * container, with possible cropping if aspect ratios don't match.
 *
 * This is equivalent to CSS `object-fit: cover` or `background-size: cover`.
 *
 * @example
 * Background image scaling:
 * ```typescript
 * const imageSize = size(800, 600);     // 4:3 image
 * const containerSize = size(400, 400); // Square container
 *
 * const filledSize = sizeFill(imageSize, containerSize);
 * // Result: { width: 533, height: 400 } - fills height, crops width
 * ```
 *
 * @example
 * Full-screen scaling:
 * ```typescript
 * const contentSize = size(1024, 768);
 * const screenSize = size(1920, 1080);
 *
 * const fullscreenSize = sizeFill(contentSize, screenSize);
 * // Scales content to fill entire screen
 * ```
 *
 * @see {@link sizeFit} for fitting within container (no cropping)
 * @see {@link sizeScale} for uniform scaling
 * @see {@link sizeAspectRatio} for aspect ratio calculations
 */
export const sizeFill = (s: Size, container: Size): Size => {
  const scale = max(container.width / s.width, container.height / s.height);
  return sizeScale(s, scale);
};

// ============================================================================
// Rectangle Utilities
// ============================================================================

/**
 * Creates a rectangle with specified position and dimensions.
 *
 * @param x - X coordinate of the top-left corner
 * @param y - Y coordinate of the top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns Rectangle object
 *
 * @remarks
 * Rectangles use the standard computer graphics convention where (x, y)
 * represents the top-left corner. Width and height extend rightward and
 * downward respectively. Negative dimensions are allowed for specialized
 * use cases but may cause unexpected behavior in some utility functions.
 *
 * @example
 * Basic rectangle creation:
 * ```typescript
 * const screen = rect(0, 0, 1920, 1080);     // Full HD screen
 * const button = rect(100, 50, 120, 30);     // UI button
 * const tile = rect(x * 32, y * 32, 32, 32); // Grid tile
 * ```
 *
 * @see {@link rectFromPoints} for creation from corner points
 * @see {@link rectFromCenter} for center-based creation
 * @see {@link size} for dimension objects
 */
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
): Rectangle => ({
  x,
  y,
  width,
  height,
});

/**
 * Creates a rectangle from two corner points.
 *
 * @param p1 - First corner point
 * @param p2 - Opposite corner point
 * @returns Rectangle spanning between the points
 *
 * @remarks
 * This function automatically determines the correct top-left corner and
 * dimensions regardless of which corners are provided. It's useful for
 * creating rectangles from user input (like drag selection) or when you
 * have two opposite corners but don't know their relative positions.
 *
 * @example
 * Selection rectangle from mouse drag:
 * ```typescript
 * const startDrag = point(100, 150);
 * const endDrag = point(80, 120);   // User dragged up and left
 * const selection = rectFromPoints(startDrag, endDrag); // (80, 120, 20, 30)
 * ```
 *
 * @example
 * Bounding box from coordinates:
 * ```typescript
 * const topRight = point(200, 50);
 * const bottomLeft = point(100, 150);
 * const bounds = rectFromPoints(topRight, bottomLeft);
 * ```
 *
 * @see {@link rect} for direct creation
 * @see {@link rectFromCenter} for center-based creation
 * @see {@link polygonBoundingBox} for polygon bounds
 */
export const rectFromPoints = (p1: Point, p2: Point): Rectangle => {
  const x = min(p1.x, p2.x);
  const y = min(p1.y, p2.y);
  const width = abs(p2.x - p1.x);
  const height = abs(p2.y - p1.y);
  return rect(x, y, width, height);
};

/**
 * Creates a rectangle centered at a specific point.
 *
 * @param center - Center point of the rectangle
 * @param size - Dimensions of the rectangle
 * @returns Rectangle centered at the specified point
 *
 * @remarks
 * This is often more intuitive than specifying top-left coordinates,
 * especially for UI elements, sprites, or any objects that should be
 * positioned by their center rather than their corner.
 *
 * @example
 * Center-aligned UI elements:
 * ```typescript
 * const screenCenter = point(400, 300);
 * const dialogSize = size(200, 150);
 * const dialog = rectFromCenter(screenCenter, dialogSize);
 * ```
 *
 * @example
 * Sprite positioning:
 * ```typescript
 * const playerPos = point(player.x, player.y);
 * const spriteSize = size(32, 48);
 * const spriteBounds = rectFromCenter(playerPos, spriteSize);
 * ```
 *
 * @see {@link rect} for corner-based creation
 * @see {@link rectCenter} to get the center of an existing rectangle
 * @see {@link size} for dimension objects
 */
export const rectFromCenter = (center: Point, size: Size): Rectangle => {
  return rect(
    center.x - size.width / 2,
    center.y - size.height / 2,
    size.width,
    size.height,
  );
};

export const rectCenter = (r: Rectangle): Point => {
  return point(r.x + r.width / 2, r.y + r.height / 2);
};

export const rectTopLeft = (r: Rectangle): Point => {
  return point(r.x, r.y);
};

export const rectTopRight = (r: Rectangle): Point => {
  return point(r.x + r.width, r.y);
};

export const rectBottomLeft = (r: Rectangle): Point => {
  return point(r.x, r.y + r.height);
};

export const rectBottomRight = (r: Rectangle): Point => {
  return point(r.x + r.width, r.y + r.height);
};

export const rectArea = (r: Rectangle): number => {
  return r.width * r.height;
};

export const rectPerimeter = (r: Rectangle): number => {
  return 2 * (r.width + r.height);
};

/**
 * Expands or contracts a rectangle by a specified amount on all sides.
 *
 * @param r - Rectangle to expand
 * @param amount - Amount to expand (positive) or contract (negative)
 * @returns Expanded or contracted rectangle
 *
 * @remarks
 * The expansion is applied symmetrically to all sides, moving each edge
 * outward by the specified amount. Negative values contract the rectangle.
 * The center point remains unchanged during the operation.
 *
 * This is commonly used for collision detection margins, UI padding,
 * selection tolerances, and visual effects.
 *
 * @example
 * Collision margin:
 * ```typescript
 * const objectBounds = rect(100, 100, 50, 30);
 * const collisionArea = rectExpand(objectBounds, 5); // Add 5px margin
 * ```
 *
 * @example
 * UI padding and borders:
 * ```typescript
 * const contentArea = rect(10, 10, 200, 100);
 * const paddedArea = rectExpand(contentArea, 10);  // Add 10px padding
 * const innerArea = rectExpand(contentArea, -5);   // Subtract 5px border
 * ```
 *
 * @see {@link rectScale} for proportional scaling
 * @see {@link rectCenter} for center calculations
 */
export const rectExpand = (r: Rectangle, amount: number): Rectangle => {
  return rect(
    r.x - amount,
    r.y - amount,
    r.width + 2 * amount,
    r.height + 2 * amount,
  );
};

/**
 * Scales a rectangle around its center point.
 *
 * @param r - Rectangle to scale
 * @param factor - Scale factor (1.0 = no change, 2.0 = double size, 0.5 = half size)
 * @returns Scaled rectangle with same center
 *
 * @remarks
 * Unlike {@link rectExpand}, scaling multiplies the dimensions rather than
 * adding to them. The rectangle's center point remains fixed while its
 * size changes proportionally. This maintains aspect ratios and provides
 * uniform scaling behavior.
 *
 * @example
 * Zoom and resize effects:
 * ```typescript
 * const originalRect = rect(100, 100, 50, 30);
 * const doubled = rectScale(originalRect, 2.0);   // 100x60, same center
 * const halved = rectScale(originalRect, 0.5);    // 25x15, same center
 * ```
 *
 * @example
 * Animation scaling:
 * ```typescript
 * const baseSize = rect(200, 150, 100, 80);
 * const animationScale = 1 + 0.1 * Math.sin(time); // Pulse effect
 * const scaledRect = rectScale(baseSize, animationScale);
 * ```
 *
 * @see {@link rectExpand} for uniform expansion
 * @see {@link rectCenter} for center point calculation
 * @see {@link sizeScale} for size-only scaling
 */
export const rectScale = (r: Rectangle, factor: number): Rectangle => {
  const center = rectCenter(r);
  const newWidth = r.width * factor;
  const newHeight = r.height * factor;
  return rect(
    center.x - newWidth / 2,
    center.y - newHeight / 2,
    newWidth,
    newHeight,
  );
};

/**
 * Creates the smallest rectangle that contains both input rectangles.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns Union rectangle containing both inputs
 *
 * @remarks
 * The union operation finds the bounding box that encompasses both rectangles.
 * This is useful for combining collision areas, calculating total bounds,
 * and creating containing regions for multiple objects.
 *
 * The result is always at least as large as the larger input rectangle.
 *
 * @example
 * Combine object bounds:
 * ```typescript
 * const player = rect(100, 100, 32, 48);
 * const weapon = rect(120, 90, 16, 8);
 * const totalBounds = rectUnion(player, weapon); // Combined collision area
 * ```
 *
 * @example
 * UI layout calculations:
 * ```typescript
 * const button1 = rect(10, 10, 80, 30);
 * const button2 = rect(100, 20, 60, 30);
 * const containerBounds = rectUnion(button1, button2); // Minimum container size
 * ```
 *
 * @see {@link rectIntersection} for overlapping area
 * @see {@link rectIntersects} for overlap testing
 * @see {@link polygonBoundingBox} for polygon bounds
 */
export const rectUnion = (a: Rectangle, b: Rectangle): Rectangle => {
  const x = min(a.x, b.x);
  const y = min(a.y, b.y);
  const right = max(a.x + a.width, b.x + b.width);
  const bottom = max(a.y + a.height, b.y + b.height);
  return rect(x, y, right - x, bottom - y);
};

/**
 * Finds the overlapping area between two rectangles.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns Intersection rectangle, or null if no overlap exists
 *
 * @remarks
 * The intersection operation finds the rectangular region where both input
 * rectangles overlap. If the rectangles don't overlap, the function returns
 * null. This is useful for collision detection, clipping regions, and
 * spatial optimization.
 *
 * @example
 * Collision area calculation:
 * ```typescript
 * const player = rect(100, 100, 32, 48);
 * const enemy = rect(110, 120, 24, 32);
 * const overlap = rectIntersection(player, enemy);
 * if (overlap) {
 *   console.log('Collision detected!', overlap);
 * }
 * ```
 *
 * @example
 * Viewport clipping:
 * ```typescript
 * const objectBounds = rect(sprite.x, sprite.y, sprite.width, sprite.height);
 * const viewport = rect(camera.x, camera.y, screen.width, screen.height);
 * const visibleArea = rectIntersection(objectBounds, viewport);
 * if (visibleArea) {
 *   renderSprite(sprite, visibleArea);
 * }
 * ```
 *
 * @see {@link rectUnion} for combining rectangles
 * @see {@link rectIntersects} for simple overlap testing
 * @see {@link pointInRect} for point containment
 */
export const rectIntersection = (
  a: Rectangle,
  b: Rectangle,
): Rectangle | null => {
  const x = max(a.x, b.x);
  const y = max(a.y, b.y);
  const right = min(a.x + a.width, b.x + b.width);
  const bottom = min(a.y + a.height, b.y + b.height);

  if (x >= right || y >= bottom) {
    return null;
  }

  return rect(x, y, right - x, bottom - y);
};

// Circle utilities
export const circle = (x: number, y: number, radius: number): Circle => ({
  x,
  y,
  radius,
});

export const circleFromPoints = (p1: Point, p2: Point, p3: Point): Circle => {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (abs(d) < 1e-10) {
    // Points are collinear
    return circle(0, 0, 0);
  }

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;

  const radius = pointDistance(point(ux, uy), p1);
  return circle(ux, uy, radius);
};

export const circleCenter = (c: Circle): Point => {
  return point(c.x, c.y);
};

export const circleArea = (c: Circle): number => {
  return PI * c.radius * c.radius;
};

export const circleCircumference = (c: Circle): number => {
  return TWO_PI * c.radius;
};

export const circlePointAt = (c: Circle, angle: number): Point => {
  return point(c.x + c.radius * cos(angle), c.y + c.radius * sin(angle));
};

export const circleExpandToPoint = (c: Circle, p: Point): Circle => {
  const distance = pointDistance(circleCenter(c), p);
  return circle(c.x, c.y, max(c.radius, distance));
};

// Collision detection
export const pointInRect = (p: Point, r: Rectangle): boolean => {
  return (
    p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
  );
};

export const pointInCircle = (p: Point, c: Circle): boolean => {
  return pointDistanceSq(p, circleCenter(c)) <= c.radius * c.radius;
};

export const rectIntersects = (a: Rectangle, b: Rectangle): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

export const circleIntersects = (a: Circle, b: Circle): boolean => {
  const distance = pointDistance(circleCenter(a), circleCenter(b));
  return distance <= a.radius + b.radius;
};

export const circleRectIntersects = (c: Circle, r: Rectangle): boolean => {
  const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
  const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));

  const distance = pointDistance(circleCenter(c), point(closestX, closestY));
  return distance <= c.radius;
};

// Line utilities
export interface Line {
  readonly start: Point;
  readonly end: Point;
}

export const line = (start: Point, end: Point): Line => ({
  start,
  end,
});

export const lineLength = (l: Line): number => {
  return pointDistance(l.start, l.end);
};

export const lineAngle = (l: Line): number => {
  return pointAngle(l.start, l.end);
};

export const linePointAt = (l: Line, t: number): Point => {
  return pointLerp(l.start, l.end, t);
};

export const lineNormal = (l: Line): Vector2 => {
  const direction = vec2Sub(l.end, l.start);
  const normal = vec2(-direction.y, direction.x);
  return vec2Normalize(normal);
};

export const lineDirection = (l: Line): Vector2 => {
  return vec2Normalize(vec2Sub(l.end, l.start));
};

export const lineDistanceToPoint = (l: Line, p: Point): number => {
  const A = vec2Sub(l.end, l.start);
  const B = vec2Sub(p, l.start);
  const dot = A.x * B.x + A.y * B.y;
  const lenSq = A.x * A.x + A.y * A.y;

  if (lenSq === 0) {
    return pointDistance(l.start, p);
  }

  const t = Math.max(0, Math.min(1, dot / lenSq));
  const projection = vec2Add(l.start, vec2Mul(A, t));
  return pointDistance(projection, p);
};

export const lineIntersection = (l1: Line, l2: Line): Point | null => {
  const x1 = l1.start.x;
  const y1 = l1.start.y;
  const x2 = l1.end.x;
  const y2 = l1.end.y;
  const x3 = l2.start.x;
  const y3 = l2.start.y;
  const x4 = l2.end.x;
  const y4 = l2.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return point(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  return null;
};

// Polygon utilities
export type Polygon = Point[];

export const polygon = (...points: Point[]): Polygon => {
  if (points.length < 3)
    throw new Error("Polygon must have at least 3 vertices");
  return points;
};

export const polygonArea = (poly: Polygon): number => {
  let area = 0;
  const n = poly.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }

  return abs(area) / 2;
};

export const polygonCentroid = (poly: Polygon): Point => {
  let x = 0;
  let y = 0;
  const n = poly.length;

  for (let i = 0; i < n; i++) {
    x += poly[i].x;
    y += poly[i].y;
  }

  return point(x / n, y / n);
};

export const polygonPerimeter = (poly: Polygon): number => {
  let perimeter = 0;
  const n = poly.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += pointDistance(poly[i], poly[j]);
  }

  return perimeter;
};

export const pointInPolygon = (p: Point, poly: Polygon): boolean => {
  let inside = false;
  const n = poly.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    if (
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
};

export const polygonBoundingBox = (poly: Polygon): Rectangle => {
  if (poly.length === 0) {
    return rect(0, 0, 0, 0);
  }

  let minX = poly[0].x;
  let minY = poly[0].y;
  let maxX = poly[0].x;
  let maxY = poly[0].y;

  for (let i = 1; i < poly.length; i++) {
    minX = min(minX, poly[i].x);
    minY = min(minY, poly[i].y);
    maxX = max(maxX, poly[i].x);
    maxY = max(maxY, poly[i].y);
  }

  return rect(minX, minY, maxX - minX, maxY - minY);
};

// Regular polygon generation
export const regularPolygon = (
  center: Point,
  radius: number,
  sides: number,
  rotation: number = 0,
): Polygon => {
  if (sides < 3) throw new Error("Regular polygon must have at least 3 sides");

  const points: Point[] = [];
  const angleStep = TWO_PI / sides;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep + rotation;
    points.push(
      point(center.x + radius * cos(angle), center.y + radius * sin(angle)),
    );
  }

  return points;
};

// Bezier curve utilities
export const quadraticBezier = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
): Point => {
  const u = 1 - t;
  return point(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  );
};

export const cubicBezier = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point => {
  const u = 1 - t;
  return point(
    u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  );
};

// Grid utilities
export const gridPoints = (bounds: Rectangle, cellSize: number): Point[] => {
  const points: Point[] = [];
  const cols = Math.floor(bounds.width / cellSize);
  const rows = Math.floor(bounds.height / cellSize);

  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      points.push(point(bounds.x + col * cellSize, bounds.y + row * cellSize));
    }
  }

  return points;
};

export const hexGrid = (
  center: Point,
  radius: number,
  rings: number,
): Point[] => {
  const points: Point[] = [center];

  for (let ring = 1; ring <= rings; ring++) {
    for (let side = 0; side < 6; side++) {
      for (let i = 0; i < ring; i++) {
        const angle = ((side * 60 + (i * 60) / ring) * PI) / 180;
        const distance = ring * radius;
        points.push(
          point(
            center.x + distance * cos(angle),
            center.y + distance * sin(angle),
          ),
        );
      }
    }
  }

  return points;
};

// Utility functions for common shapes
export const triangle = (p1: Point, p2: Point, p3: Point): Polygon => [
  p1,
  p2,
  p3,
];

export const square = (center: Point, size: number): Polygon => {
  const half = size / 2;
  return [
    point(center.x - half, center.y - half),
    point(center.x + half, center.y - half),
    point(center.x + half, center.y + half),
    point(center.x - half, center.y + half),
  ];
};

export const pentagon = (center: Point, radius: number): Polygon => {
  return regularPolygon(center, radius, 5);
};

export const hexagon = (center: Point, radius: number): Polygon => {
  return regularPolygon(center, radius, 6);
};

export const octagon = (center: Point, radius: number): Polygon => {
  return regularPolygon(center, radius, 8);
};

export const star = (
  center: Point,
  outerRadius: number,
  innerRadius: number,
  points: number,
): Polygon => {
  const vertices: Point[] = [];
  const angleStep = TWO_PI / (points * 2);

  for (let i = 0; i < points * 2; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push(
      point(center.x + radius * cos(angle), center.y + radius * sin(angle)),
    );
  }

  return vertices;
};
