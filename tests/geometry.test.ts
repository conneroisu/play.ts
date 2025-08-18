import { describe, expect, test } from "bun:test";
import {
  circle,
  circleArea,
  circleCenter,
  circleCircumference,
  circleExpandToPoint,
  circleFromPoints,
  circleIntersects,
  circlePointAt,
  circleRectIntersects,
  cubicBezier,
  gridPoints,
  hexagon,
  hexGrid,
  line,
  lineAngle,
  lineDirection,
  lineDistanceToPoint,
  lineIntersection,
  lineLength,
  lineNormal,
  linePointAt,
  octagon,
  pentagon,
  point,
  pointAngle,
  pointDistance,
  pointDistanceSq,
  pointInCircle,
  pointInPolygon,
  pointInRect,
  pointLerp,
  polygon,
  polygonArea,
  polygonBoundingBox,
  polygonCentroid,
  polygonPerimeter,
  quadraticBezier,
  rect,
  rectArea,
  rectBottomLeft,
  rectBottomRight,
  rectCenter,
  rectExpand,
  rectFromCenter,
  rectFromPoints,
  rectIntersection,
  rectIntersects,
  rectPerimeter,
  rectScale,
  rectTopLeft,
  rectTopRight,
  rectUnion,
  regularPolygon,
  size,
  sizeArea,
  sizeAspectRatio,
  sizeFill,
  sizeFit,
  sizePerimeter,
  sizeScale,
  square,
  star,
  triangle,
} from "../src/geometry.ts";
import { PI, TWO_PI } from "../src/math.ts";

describe("Geometry utilities", () => {
  describe("Point operations", () => {
    test("point creation", () => {
      const p = point(3, 4);
      expect(p.x).toBe(3);
      expect(p.y).toBe(4);
    });

    test("pointDistance", () => {
      const p1 = point(0, 0);
      const p2 = point(3, 4);
      expect(pointDistance(p1, p2)).toBe(5); // 3-4-5 triangle
    });

    test("pointDistanceSq", () => {
      const p1 = point(0, 0);
      const p2 = point(3, 4);
      expect(pointDistanceSq(p1, p2)).toBe(25);
    });

    test("pointLerp", () => {
      const p1 = point(0, 0);
      const p2 = point(10, 20);
      const lerped = pointLerp(p1, p2, 0.5);
      expect(lerped.x).toBe(5);
      expect(lerped.y).toBe(10);
    });

    test("pointAngle", () => {
      const p1 = point(0, 0);
      const p2 = point(1, 0);
      expect(pointAngle(p1, p2)).toBe(0);

      const p3 = point(0, 1);
      expect(pointAngle(p1, p3)).toBeCloseTo(PI / 2, 5);
    });
  });

  describe("Size operations", () => {
    test("size creation", () => {
      const s = size(10, 20);
      expect(s.width).toBe(10);
      expect(s.height).toBe(20);
    });

    test("sizeArea", () => {
      const s = size(10, 20);
      expect(sizeArea(s)).toBe(200);
    });

    test("sizePerimeter", () => {
      const s = size(10, 20);
      expect(sizePerimeter(s)).toBe(60); // 2 * (10 + 20)
    });

    test("sizeAspectRatio", () => {
      const s = size(16, 9);
      expect(sizeAspectRatio(s)).toBeCloseTo(16 / 9, 5);
    });

    test("sizeScale", () => {
      const s = size(10, 20);
      const scaled = sizeScale(s, 2);
      expect(scaled.width).toBe(20);
      expect(scaled.height).toBe(40);
    });

    test("sizeFit", () => {
      const s = size(100, 50);
      const container = size(60, 60);
      const fitted = sizeFit(s, container);

      // Should scale down to fit within container
      expect(fitted.width).toBe(60);
      expect(fitted.height).toBe(30);
    });

    test("sizeFill", () => {
      const s = size(100, 50);
      const container = size(60, 60);
      const filled = sizeFill(s, container);

      // Should scale up to fill container
      expect(filled.width).toBe(120);
      expect(filled.height).toBe(60);
    });
  });

  describe("Rectangle operations", () => {
    test("rect creation", () => {
      const r = rect(10, 20, 30, 40);
      expect(r.x).toBe(10);
      expect(r.y).toBe(20);
      expect(r.width).toBe(30);
      expect(r.height).toBe(40);
    });

    test("rectFromPoints", () => {
      const p1 = point(10, 20);
      const p2 = point(40, 60);
      const r = rectFromPoints(p1, p2);
      expect(r.x).toBe(10);
      expect(r.y).toBe(20);
      expect(r.width).toBe(30);
      expect(r.height).toBe(40);
    });

    test("rectFromCenter", () => {
      const center = point(25, 35);
      const s = size(20, 30);
      const r = rectFromCenter(center, s);
      expect(r.x).toBe(15);
      expect(r.y).toBe(20);
      expect(r.width).toBe(20);
      expect(r.height).toBe(30);
    });

    test("rectCenter", () => {
      const r = rect(10, 20, 30, 40);
      const center = rectCenter(r);
      expect(center.x).toBe(25);
      expect(center.y).toBe(40);
    });

    test("rectangle corners", () => {
      const r = rect(10, 20, 30, 40);

      const topLeft = rectTopLeft(r);
      expect(topLeft.x).toBe(10);
      expect(topLeft.y).toBe(20);

      const topRight = rectTopRight(r);
      expect(topRight.x).toBe(40);
      expect(topRight.y).toBe(20);

      const bottomLeft = rectBottomLeft(r);
      expect(bottomLeft.x).toBe(10);
      expect(bottomLeft.y).toBe(60);

      const bottomRight = rectBottomRight(r);
      expect(bottomRight.x).toBe(40);
      expect(bottomRight.y).toBe(60);
    });

    test("rectArea", () => {
      const r = rect(10, 20, 30, 40);
      expect(rectArea(r)).toBe(1200);
    });

    test("rectPerimeter", () => {
      const r = rect(10, 20, 30, 40);
      expect(rectPerimeter(r)).toBe(140); // 2 * (30 + 40)
    });

    test("rectExpand", () => {
      const r = rect(10, 20, 30, 40);
      const expanded = rectExpand(r, 5);
      expect(expanded.x).toBe(5);
      expect(expanded.y).toBe(15);
      expect(expanded.width).toBe(40);
      expect(expanded.height).toBe(50);
    });

    test("rectScale", () => {
      const r = rect(10, 10, 20, 20);
      const scaled = rectScale(r, 2);
      expect(scaled.x).toBe(0);
      expect(scaled.y).toBe(0);
      expect(scaled.width).toBe(40);
      expect(scaled.height).toBe(40);
    });

    test("rectUnion", () => {
      const r1 = rect(0, 0, 10, 10);
      const r2 = rect(5, 5, 10, 10);
      const union = rectUnion(r1, r2);
      expect(union.x).toBe(0);
      expect(union.y).toBe(0);
      expect(union.width).toBe(15);
      expect(union.height).toBe(15);
    });

    test("rectIntersection", () => {
      const r1 = rect(0, 0, 10, 10);
      const r2 = rect(5, 5, 10, 10);
      const intersection = rectIntersection(r1, r2);
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBe(5);
      expect(intersection!.y).toBe(5);
      expect(intersection!.width).toBe(5);
      expect(intersection!.height).toBe(5);
    });

    test("rectIntersection - no overlap", () => {
      const r1 = rect(0, 0, 5, 5);
      const r2 = rect(10, 10, 5, 5);
      const intersection = rectIntersection(r1, r2);
      expect(intersection).toBeNull();
    });
  });

  describe("Circle operations", () => {
    test("circle creation", () => {
      const c = circle(10, 20, 15);
      expect(c.x).toBe(10);
      expect(c.y).toBe(20);
      expect(c.radius).toBe(15);
    });

    test("circleFromPoints", () => {
      const p1 = point(0, 0);
      const p2 = point(2, 0);
      const p3 = point(1, 1);
      const c = circleFromPoints(p1, p2, p3);

      // Should create a circle that passes through all three points
      expect(pointDistance(circleCenter(c), p1)).toBeCloseTo(c.radius, 3);
      expect(pointDistance(circleCenter(c), p2)).toBeCloseTo(c.radius, 3);
      expect(pointDistance(circleCenter(c), p3)).toBeCloseTo(c.radius, 3);
    });

    test("circleCenter", () => {
      const c = circle(10, 20, 15);
      const center = circleCenter(c);
      expect(center.x).toBe(10);
      expect(center.y).toBe(20);
    });

    test("circleArea", () => {
      const c = circle(0, 0, 5);
      expect(circleArea(c)).toBeCloseTo(PI * 25, 5);
    });

    test("circleCircumference", () => {
      const c = circle(0, 0, 5);
      expect(circleCircumference(c)).toBeCloseTo(TWO_PI * 5, 5);
    });

    test("circlePointAt", () => {
      const c = circle(0, 0, 5);
      const p = circlePointAt(c, 0);
      expect(p.x).toBeCloseTo(5, 5);
      expect(p.y).toBeCloseTo(0, 5);

      const p2 = circlePointAt(c, PI / 2);
      expect(p2.x).toBeCloseTo(0, 5);
      expect(p2.y).toBeCloseTo(5, 5);
    });

    test("circleExpandToPoint", () => {
      const c = circle(0, 0, 3);
      const p = point(4, 0);
      const expanded = circleExpandToPoint(c, p);
      expect(expanded.radius).toBe(4);
    });
  });

  describe("Collision detection", () => {
    test("pointInRect", () => {
      const r = rect(10, 10, 20, 20);
      expect(pointInRect(point(15, 15), r)).toBe(true);
      expect(pointInRect(point(5, 5), r)).toBe(false);
      expect(pointInRect(point(35, 35), r)).toBe(false);
      expect(pointInRect(point(10, 10), r)).toBe(true); // Edge case
    });

    test("pointInCircle", () => {
      const c = circle(0, 0, 5);
      expect(pointInCircle(point(3, 4), c)).toBe(true); // 3-4-5 triangle
      expect(pointInCircle(point(6, 0), c)).toBe(false);
      expect(pointInCircle(point(5, 0), c)).toBe(true); // Edge case
    });

    test("rectIntersects", () => {
      const r1 = rect(0, 0, 10, 10);
      const r2 = rect(5, 5, 10, 10);
      expect(rectIntersects(r1, r2)).toBe(true);

      const r3 = rect(15, 15, 10, 10);
      expect(rectIntersects(r1, r3)).toBe(false);
    });

    test("circleIntersects", () => {
      const c1 = circle(0, 0, 5);
      const c2 = circle(8, 0, 5);
      expect(circleIntersects(c1, c2)).toBe(true);

      const c3 = circle(15, 0, 5);
      expect(circleIntersects(c1, c3)).toBe(false);
    });

    test("circleRectIntersects", () => {
      const c = circle(0, 0, 5);
      const r1 = rect(-2, -2, 4, 4);
      expect(circleRectIntersects(c, r1)).toBe(true);

      const r2 = rect(10, 10, 4, 4);
      expect(circleRectIntersects(c, r2)).toBe(false);
    });
  });

  describe("Line operations", () => {
    test("line creation", () => {
      const p1 = point(0, 0);
      const p2 = point(3, 4);
      const l = line(p1, p2);
      expect(l.start).toBe(p1);
      expect(l.end).toBe(p2);
    });

    test("lineLength", () => {
      const l = line(point(0, 0), point(3, 4));
      expect(lineLength(l)).toBe(5);
    });

    test("lineAngle", () => {
      const l = line(point(0, 0), point(1, 0));
      expect(lineAngle(l)).toBe(0);

      const l2 = line(point(0, 0), point(0, 1));
      expect(lineAngle(l2)).toBeCloseTo(PI / 2, 5);
    });

    test("linePointAt", () => {
      const l = line(point(0, 0), point(10, 20));
      const p = linePointAt(l, 0.5);
      expect(p.x).toBe(5);
      expect(p.y).toBe(10);
    });

    test("lineNormal", () => {
      const l = line(point(0, 0), point(1, 0));
      const normal = lineNormal(l);
      expect(normal.x).toBeCloseTo(0, 5);
      expect(normal.y).toBeCloseTo(1, 5);
    });

    test("lineDirection", () => {
      const l = line(point(0, 0), point(3, 4));
      const direction = lineDirection(l);
      expect(direction.x).toBeCloseTo(0.6, 5);
      expect(direction.y).toBeCloseTo(0.8, 5);
    });

    test("lineDistanceToPoint", () => {
      const l = line(point(0, 0), point(10, 0));
      const p = point(5, 3);
      expect(lineDistanceToPoint(l, p)).toBe(3);
    });

    test("lineIntersection", () => {
      const l1 = line(point(0, 0), point(10, 10));
      const l2 = line(point(0, 10), point(10, 0));
      const intersection = lineIntersection(l1, l2);
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(5, 5);
      expect(intersection!.y).toBeCloseTo(5, 5);
    });

    test("lineIntersection - parallel lines", () => {
      const l1 = line(point(0, 0), point(10, 0));
      const l2 = line(point(0, 5), point(10, 5));
      const intersection = lineIntersection(l1, l2);
      expect(intersection).toBeNull();
    });
  });

  describe("Polygon operations", () => {
    test("polygon creation", () => {
      const p1 = point(0, 0);
      const p2 = point(1, 0);
      const p3 = point(0.5, 1);
      const poly = polygon(p1, p2, p3);
      expect(poly.length).toBe(3);
      expect(poly[0]).toBe(p1);
      expect(poly[1]).toBe(p2);
      expect(poly[2]).toBe(p3);
    });

    test("polygonArea", () => {
      // Unit square
      const square = polygon(
        point(0, 0),
        point(1, 0),
        point(1, 1),
        point(0, 1),
      );
      expect(polygonArea(square)).toBe(1);
    });

    test("polygonCentroid", () => {
      const square = polygon(
        point(0, 0),
        point(2, 0),
        point(2, 2),
        point(0, 2),
      );
      const centroid = polygonCentroid(square);
      expect(centroid.x).toBe(1);
      expect(centroid.y).toBe(1);
    });

    test("polygonPerimeter", () => {
      const square = polygon(
        point(0, 0),
        point(1, 0),
        point(1, 1),
        point(0, 1),
      );
      expect(polygonPerimeter(square)).toBe(4);
    });

    test("pointInPolygon", () => {
      const square = polygon(
        point(0, 0),
        point(2, 0),
        point(2, 2),
        point(0, 2),
      );
      expect(pointInPolygon(point(1, 1), square)).toBe(true);
      expect(pointInPolygon(point(3, 3), square)).toBe(false);
    });

    test("polygonBoundingBox", () => {
      const poly = polygon(point(1, 2), point(5, 3), point(3, 7));
      const bbox = polygonBoundingBox(poly);
      expect(bbox.x).toBe(1);
      expect(bbox.y).toBe(2);
      expect(bbox.width).toBe(4);
      expect(bbox.height).toBe(5);
    });

    test("regularPolygon", () => {
      const center = point(0, 0);
      const radius = 5;
      const sides = 6;
      const hexagon = regularPolygon(center, radius, sides);

      expect(hexagon.length).toBe(6);

      // All points should be at the same distance from center
      for (const vertex of hexagon) {
        const distance = pointDistance(center, vertex);
        expect(distance).toBeCloseTo(radius, 5);
      }
    });
  });

  describe("Bezier curves", () => {
    test("quadraticBezier", () => {
      const p0 = point(0, 0);
      const p1 = point(1, 2);
      const p2 = point(2, 0);

      const start = quadraticBezier(0, p0, p1, p2);
      expect(start.x).toBe(0);
      expect(start.y).toBe(0);

      const end = quadraticBezier(1, p0, p1, p2);
      expect(end.x).toBe(2);
      expect(end.y).toBe(0);

      const mid = quadraticBezier(0.5, p0, p1, p2);
      expect(mid.x).toBe(1);
      expect(mid.y).toBe(1);
    });

    test("cubicBezier", () => {
      const p0 = point(0, 0);
      const p1 = point(1, 1);
      const p2 = point(2, 1);
      const p3 = point(3, 0);

      const start = cubicBezier(0, p0, p1, p2, p3);
      expect(start.x).toBe(0);
      expect(start.y).toBe(0);

      const end = cubicBezier(1, p0, p1, p2, p3);
      expect(end.x).toBe(3);
      expect(end.y).toBe(0);
    });
  });

  describe("Grid utilities", () => {
    test("gridPoints", () => {
      const bounds = rect(0, 0, 20, 20);
      const cellSize = 10;
      const points = gridPoints(bounds, cellSize);

      expect(points.length).toBe(9); // 3x3 grid
      expect(points[0]).toEqual(point(0, 0));
      expect(points[4]).toEqual(point(10, 10));
      expect(points[8]).toEqual(point(20, 20));
    });

    test("hexGrid", () => {
      const center = point(0, 0);
      const radius = 10;
      const rings = 1;
      const points = hexGrid(center, radius, rings);

      expect(points.length).toBe(7); // 1 center + 6 surrounding
      expect(points[0]).toBe(center);
    });
  });

  describe("Shape helpers", () => {
    test("triangle", () => {
      const p1 = point(0, 0);
      const p2 = point(1, 0);
      const p3 = point(0.5, 1);
      const tri = triangle(p1, p2, p3);

      expect(tri.length).toBe(3);
      expect(tri[0]).toBe(p1);
      expect(tri[1]).toBe(p2);
      expect(tri[2]).toBe(p3);
    });

    test("square", () => {
      const center = point(0, 0);
      const size = 10;
      const sq = square(center, size);

      expect(sq.length).toBe(4);

      // Check that it's actually a square
      const side1 = pointDistance(sq[0], sq[1]);
      const side2 = pointDistance(sq[1], sq[2]);
      expect(side1).toBeCloseTo(side2, 5);
      expect(side1).toBeCloseTo(size, 5);
    });

    test("pentagon", () => {
      const center = point(0, 0);
      const radius = 5;
      const pent = pentagon(center, radius);

      expect(pent.length).toBe(5);

      // All vertices should be at the same distance from center
      for (const vertex of pent) {
        const distance = pointDistance(center, vertex);
        expect(distance).toBeCloseTo(radius, 5);
      }
    });

    test("hexagon", () => {
      const center = point(0, 0);
      const radius = 5;
      const hex = hexagon(center, radius);

      expect(hex.length).toBe(6);

      // All vertices should be at the same distance from center
      for (const vertex of hex) {
        const distance = pointDistance(center, vertex);
        expect(distance).toBeCloseTo(radius, 5);
      }
    });

    test("octagon", () => {
      const center = point(0, 0);
      const radius = 5;
      const oct = octagon(center, radius);

      expect(oct.length).toBe(8);

      // All vertices should be at the same distance from center
      for (const vertex of oct) {
        const distance = pointDistance(center, vertex);
        expect(distance).toBeCloseTo(radius, 5);
      }
    });

    test("star", () => {
      const center = point(0, 0);
      const outerRadius = 10;
      const innerRadius = 5;
      const points = 5;
      const starShape = star(center, outerRadius, innerRadius, points);

      expect(starShape.length).toBe(10); // 5 points * 2 (outer + inner)

      // Check alternating radii
      for (let i = 0; i < starShape.length; i++) {
        const distance = pointDistance(center, starShape[i]);
        const expectedRadius = i % 2 === 0 ? outerRadius : innerRadius;
        expect(distance).toBeCloseTo(expectedRadius, 5);
      }
    });
  });
});
