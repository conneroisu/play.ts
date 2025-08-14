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
import type { Point, Size, Rectangle, Circle, Vector2 } from '../types/index.ts';
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
export declare const point: (x: number, y: number) => Point;
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
export declare const pointDistance: (a: Point, b: Point) => number;
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
export declare const pointDistanceSq: (a: Point, b: Point) => number;
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
export declare const pointLerp: (a: Point, b: Point, t: number) => Point;
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
export declare const pointAngle: (a: Point, b: Point) => number;
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
export declare const size: (width: number, height: number) => Size;
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
export declare const sizeArea: (s: Size) => number;
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
export declare const sizePerimeter: (s: Size) => number;
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
export declare const sizeAspectRatio: (s: Size) => number;
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
export declare const sizeScale: (s: Size, factor: number) => Size;
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
export declare const sizeFit: (s: Size, container: Size) => Size;
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
export declare const sizeFill: (s: Size, container: Size) => Size;
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
export declare const rect: (x: number, y: number, width: number, height: number) => Rectangle;
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
export declare const rectFromPoints: (p1: Point, p2: Point) => Rectangle;
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
export declare const rectFromCenter: (center: Point, size: Size) => Rectangle;
export declare const rectCenter: (r: Rectangle) => Point;
export declare const rectTopLeft: (r: Rectangle) => Point;
export declare const rectTopRight: (r: Rectangle) => Point;
export declare const rectBottomLeft: (r: Rectangle) => Point;
export declare const rectBottomRight: (r: Rectangle) => Point;
export declare const rectArea: (r: Rectangle) => number;
export declare const rectPerimeter: (r: Rectangle) => number;
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
export declare const rectExpand: (r: Rectangle, amount: number) => Rectangle;
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
export declare const rectScale: (r: Rectangle, factor: number) => Rectangle;
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
export declare const rectUnion: (a: Rectangle, b: Rectangle) => Rectangle;
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
export declare const rectIntersection: (a: Rectangle, b: Rectangle) => Rectangle | null;
export declare const circle: (x: number, y: number, radius: number) => Circle;
export declare const circleFromPoints: (p1: Point, p2: Point, p3: Point) => Circle;
export declare const circleCenter: (c: Circle) => Point;
export declare const circleArea: (c: Circle) => number;
export declare const circleCircumference: (c: Circle) => number;
export declare const circlePointAt: (c: Circle, angle: number) => Point;
export declare const circleExpandToPoint: (c: Circle, p: Point) => Circle;
export declare const pointInRect: (p: Point, r: Rectangle) => boolean;
export declare const pointInCircle: (p: Point, c: Circle) => boolean;
export declare const rectIntersects: (a: Rectangle, b: Rectangle) => boolean;
export declare const circleIntersects: (a: Circle, b: Circle) => boolean;
export declare const circleRectIntersects: (c: Circle, r: Rectangle) => boolean;
export interface Line {
    readonly start: Point;
    readonly end: Point;
}
export declare const line: (start: Point, end: Point) => Line;
export declare const lineLength: (l: Line) => number;
export declare const lineAngle: (l: Line) => number;
export declare const linePointAt: (l: Line, t: number) => Point;
export declare const lineNormal: (l: Line) => Vector2;
export declare const lineDirection: (l: Line) => Vector2;
export declare const lineDistanceToPoint: (l: Line, p: Point) => number;
export declare const lineIntersection: (l1: Line, l2: Line) => Point | null;
export type Polygon = Point[];
export declare const polygon: (...points: Point[]) => Polygon;
export declare const polygonArea: (poly: Polygon) => number;
export declare const polygonCentroid: (poly: Polygon) => Point;
export declare const polygonPerimeter: (poly: Polygon) => number;
export declare const pointInPolygon: (p: Point, poly: Polygon) => boolean;
export declare const polygonBoundingBox: (poly: Polygon) => Rectangle;
export declare const regularPolygon: (center: Point, radius: number, sides: number, rotation?: number) => Polygon;
export declare const quadraticBezier: (t: number, p0: Point, p1: Point, p2: Point) => Point;
export declare const cubicBezier: (t: number, p0: Point, p1: Point, p2: Point, p3: Point) => Point;
export declare const gridPoints: (bounds: Rectangle, cellSize: number) => Point[];
export declare const hexGrid: (center: Point, radius: number, rings: number) => Point[];
export declare const triangle: (p1: Point, p2: Point, p3: Point) => Polygon;
export declare const square: (center: Point, size: number) => Polygon;
export declare const pentagon: (center: Point, radius: number) => Polygon;
export declare const hexagon: (center: Point, radius: number) => Polygon;
export declare const octagon: (center: Point, radius: number) => Polygon;
export declare const star: (center: Point, outerRadius: number, innerRadius: number, points: number) => Polygon;
//# sourceMappingURL=geometry.d.ts.map