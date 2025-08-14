// src/math.ts
var PI = Math.PI;
var TWO_PI = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var QUARTER_PI = Math.PI / 4;
var TAU = TWO_PI;
var E = Math.E;
var PHI = (1 + Math.sqrt(5)) / 2;
var clamp = (value, min, max) => {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.min(Math.max(value, min), max);
};
var lerp = (a, b, t) => {
  if (isNaN(a) || isNaN(b) || isNaN(t))
    return NaN;
  if (t === 0)
    return a;
  if (t === 1)
    return b;
  if (a === Infinity && b === -Infinity)
    return NaN;
  if (a === -Infinity && b === Infinity)
    return NaN;
  if (a === Infinity)
    return Infinity;
  if (b === Infinity)
    return Infinity;
  if (a === -Infinity)
    return -Infinity;
  if (b === -Infinity)
    return -Infinity;
  return a + (b - a) * t;
};
var map = (value, inMin, inMax, outMin, outMax) => {
  if (inMax === inMin)
    return Infinity;
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
};
var normalize = (value, min, max) => {
  if (max === min) {
    if (value === min)
      return NaN;
    return Infinity;
  }
  return (value - min) / (max - min);
};
var smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
var smootherstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
var degrees = (radians) => {
  return radians * 180 / PI;
};
var radians = (degrees2) => {
  return degrees2 * PI / 180;
};
var sign = (x) => {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
};
var fract = (x) => {
  return x - Math.floor(x);
};
var wrap = (value, min, max) => {
  const range = max - min;
  return range === 0 ? min : min + ((value - min) % range + range) % range;
};
var vec2 = (x, y) => ({ x, y });
var vec2Add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
});
var vec2Sub = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y
});
var vec2Mul = (a, scalar) => ({
  x: a.x * scalar === -0 ? 0 : a.x * scalar,
  y: a.y * scalar === -0 ? 0 : a.y * scalar
});
var vec2Div = (a, scalar) => ({
  x: a.x / scalar,
  y: a.y / scalar
});
var vec2Dot = (a, b) => {
  return a.x * b.x + a.y * b.y;
};
var vec2Length = (v) => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};
var vec2LengthSq = (v) => {
  return v.x * v.x + v.y * v.y;
};
var vec2Normalize = (v) => {
  const lengthSq = v.x * v.x + v.y * v.y;
  if (lengthSq === 0)
    return vec2(0, 0);
  if (!isFinite(lengthSq))
    return vec2(NaN, NaN);
  const length = Math.sqrt(lengthSq);
  return {
    x: v.x / length,
    y: v.y / length
  };
};
var vec2Distance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};
var vec2Angle = (v) => {
  return Math.atan2(v.y, v.x);
};
var vec2FromAngle = (angle, length = 1) => ({
  x: Math.cos(angle) * length,
  y: Math.sin(angle) * length
});
var vec2Lerp = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t)
});
var vec2Rotate = (v, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
};
var vec3 = (x, y, z) => ({ x, y, z });
var vec3Add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});
var vec3Sub = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});
var vec3Mul = (a, scalar) => ({
  x: a.x * scalar,
  y: a.y * scalar,
  z: a.z * scalar
});
var vec3Div = (a, scalar) => ({
  x: a.x / scalar,
  y: a.y / scalar,
  z: a.z / scalar
});
var vec3Dot = (a, b) => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};
var vec3Cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});
var vec3Length = (v) => {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};
var vec3LengthSq = (v) => {
  return v.x * v.x + v.y * v.y + v.z * v.z;
};
var vec3Normalize = (v) => {
  const length = vec3Length(v);
  return length > 0 ? vec3Div(v, length) : vec3(0, 0, 0);
};
var vec3Distance = (a, b) => {
  return vec3Length(vec3Sub(a, b));
};
var vec3Lerp = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t)
});
var mat3Identity = () => ({
  elements: [1, 0, 0, 0, 1, 0, 0, 0, 1]
});
var mat3FromValues = (m00, m01, m02, m10, m11, m12, m20, m21, m22) => ({
  elements: [m00, m01, m02, m10, m11, m12, m20, m21, m22]
});
var mat3Multiply = (a, b) => {
  const ae = a.elements;
  const be = b.elements;
  return {
    elements: [
      ae[0] * be[0] + ae[1] * be[3] + ae[2] * be[6],
      ae[0] * be[1] + ae[1] * be[4] + ae[2] * be[7],
      ae[0] * be[2] + ae[1] * be[5] + ae[2] * be[8],
      ae[3] * be[0] + ae[4] * be[3] + ae[5] * be[6],
      ae[3] * be[1] + ae[4] * be[4] + ae[5] * be[7],
      ae[3] * be[2] + ae[4] * be[5] + ae[5] * be[8],
      ae[6] * be[0] + ae[7] * be[3] + ae[8] * be[6],
      ae[6] * be[1] + ae[7] * be[4] + ae[8] * be[7],
      ae[6] * be[2] + ae[7] * be[5] + ae[8] * be[8]
    ]
  };
};
var mat3TransformVec2 = (m, v) => {
  const e = m.elements;
  return {
    x: e[0] * v.x + e[1] * v.y + e[2],
    y: e[3] * v.x + e[4] * v.y + e[5]
  };
};
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var asin = Math.asin;
var acos = Math.acos;
var atan = Math.atan;
var atan2 = Math.atan2;
var sinh = Math.sinh;
var cosh = Math.cosh;
var tanh = Math.tanh;
var abs = Math.abs;
var ceil = Math.ceil;
var floor = Math.floor;
var round = Math.round;
var trunc = Math.trunc;
var sqrt = Math.sqrt;
var pow = Math.pow;
var exp = Math.exp;
var log = Math.log;
var log2 = Math.log2;
var log10 = Math.log10;
var min = Math.min;
var max = Math.max;
// src/color.ts
var rgb = (r, g, b) => ({
  r: clamp(r, 0, 255),
  g: clamp(g, 0, 255),
  b: clamp(b, 0, 255)
});
var rgba = (r, g, b, a) => ({
  r: clamp(r, 0, 255),
  g: clamp(g, 0, 255),
  b: clamp(b, 0, 255),
  a: clamp(a, 0, 1)
});
var hsl = (h, s, l) => ({
  h: (h % 360 + 360) % 360,
  s: clamp(s, 0, 100),
  l: clamp(l, 0, 100)
});
var hsla = (h, s, l, a) => ({
  h: (h % 360 + 360) % 360,
  s: clamp(s, 0, 100),
  l: clamp(l, 0, 100),
  a: clamp(a, 0, 1)
});
var rgbToHsl = (color) => {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max2 = Math.max(r, g, b);
  const min2 = Math.min(r, g, b);
  const delta = max2 - min2;
  let h = 0;
  let s = 0;
  const l = (max2 + min2) / 2;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max2 - min2) : delta / (max2 + min2);
    switch (max2) {
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
    l: l * 100
  };
};
var hslToRgb = (color) => {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;
  const hue2rgb = (p2, q2, t) => {
    if (t < 0)
      t += 1;
    if (t > 1)
      t -= 1;
    if (t < 1 / 6)
      return p2 + (q2 - p2) * 6 * t;
    if (t < 1 / 2)
      return q2;
    if (t < 2 / 3)
      return p2 + (q2 - p2) * (2 / 3 - t) * 6;
    return p2;
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
var rgbToHex = (color) => {
  const toHex = (n) => {
    const hex = Math.round(clamp(n, 0, 255)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};
var hexToRgb = (hex) => {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  if (cleanHex.length === 3) {
    const r2 = bigint >> 8 & 15;
    const g2 = bigint >> 4 & 15;
    const b2 = bigint & 15;
    return rgb(r2 * 17, g2 * 17, b2 * 17);
  }
  const r = bigint >> 16 & 255;
  const g = bigint >> 8 & 255;
  const b = bigint & 255;
  return rgb(r, g, b);
};
var colorLerp = (a, b, t) => ({
  r: lerp(a.r, b.r, t),
  g: lerp(a.g, b.g, t),
  b: lerp(a.b, b.b, t)
});
var colorLerpHsl = (a, b, t) => {
  let h1 = a.h;
  let h2 = b.h;
  const diff = h2 - h1;
  if (diff > 180) {} else if (diff < -180) {
    h2 += 360;
  }
  const h = (lerp(h1, h2, t) % 360 + 360) % 360;
  return {
    h,
    s: lerp(a.s, b.s, t),
    l: lerp(a.l, b.l, t)
  };
};
var brighten = (color, amount) => {
  const hslColor = rgbToHsl(color);
  const newHsl = hsl(hslColor.h, hslColor.s, hslColor.l + amount);
  return hslToRgb(newHsl);
};
var darken = (color, amount) => {
  return brighten(color, -amount);
};
var saturate = (color, amount) => {
  const hslColor = rgbToHsl(color);
  const newHsl = hsl(hslColor.h, hslColor.s + amount, hslColor.l);
  return hslToRgb(newHsl);
};
var desaturate = (color, amount) => {
  return saturate(color, -amount);
};
var hueShift = (color, degrees2) => {
  const hslColor = rgbToHsl(color);
  const newHsl = hsl(hslColor.h + degrees2, hslColor.s, hslColor.l);
  return hslToRgb(newHsl);
};
var grayscale = (color) => {
  const gray = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
  return rgb(gray, gray, gray);
};
var invert = (color) => ({
  r: 255 - color.r,
  g: 255 - color.g,
  b: 255 - color.b
});
var contrast = (color, amount) => {
  const factor = 259 * (amount + 255) / (255 * (259 - amount));
  return rgb(clamp(factor * (color.r - 128) + 128, 0, 255), clamp(factor * (color.g - 128) + 128, 0, 255), clamp(factor * (color.b - 128) + 128, 0, 255));
};
var complementary = (color) => {
  const hslColor = rgbToHsl(color);
  const newHsl = hsl(hslColor.h + 180, hslColor.s, hslColor.l);
  return hslToRgb(newHsl);
};
var triadic = (color) => {
  const hslColor = rgbToHsl(color);
  const color1 = hslToRgb(hsl(hslColor.h + 120, hslColor.s, hslColor.l));
  const color2 = hslToRgb(hsl(hslColor.h + 240, hslColor.s, hslColor.l));
  return [color1, color2];
};
var analogous = (color, angle = 30) => {
  const hslColor = rgbToHsl(color);
  const color1 = hslToRgb(hsl(hslColor.h + angle, hslColor.s, hslColor.l));
  const color2 = hslToRgb(hsl(hslColor.h - angle, hslColor.s, hslColor.l));
  return [color1, color2];
};
var splitComplementary = (color) => {
  const hslColor = rgbToHsl(color);
  const color1 = hslToRgb(hsl(hslColor.h + 150, hslColor.s, hslColor.l));
  const color2 = hslToRgb(hsl(hslColor.h + 210, hslColor.s, hslColor.l));
  return [color1, color2];
};
var tetradic = (color) => {
  const hslColor = rgbToHsl(color);
  const color1 = hslToRgb(hsl(hslColor.h + 90, hslColor.s, hslColor.l));
  const color2 = hslToRgb(hsl(hslColor.h + 180, hslColor.s, hslColor.l));
  const color3 = hslToRgb(hsl(hslColor.h + 270, hslColor.s, hslColor.l));
  return [color1, color2, color3];
};
var colorDistance = (a, b) => {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};
var colorSimilarity = (a, b) => {
  const maxDistance = Math.sqrt(3 * 255 * 255);
  return 1 - colorDistance(a, b) / maxDistance;
};
var colors = {
  white: rgb(255, 255, 255),
  black: rgb(0, 0, 0),
  red: rgb(255, 0, 0),
  green: rgb(0, 255, 0),
  blue: rgb(0, 0, 255),
  yellow: rgb(255, 255, 0),
  cyan: rgb(0, 255, 255),
  magenta: rgb(255, 0, 255),
  gray: rgb(128, 128, 128),
  lightGray: rgb(192, 192, 192),
  darkGray: rgb(64, 64, 64),
  orange: rgb(255, 165, 0),
  purple: rgb(128, 0, 128),
  pink: rgb(255, 192, 203),
  brown: rgb(165, 42, 42),
  transparent: rgba(0, 0, 0, 0)
};
var toCssRgb = (color) => {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
};
var toCssRgba = (color) => {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
};
var toCssHsl = (color) => {
  return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
};
var toCssHsla = (color) => {
  return `hsla(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%, ${color.a})`;
};
// src/animation.ts
var requestAnimationFrame = typeof window !== "undefined" && window.requestAnimationFrame || ((callback) => setTimeout(callback, 16));
var linear = (t) => t;
var easeInQuad = (t) => t * t;
var easeOutQuad = (t) => t * (2 - t);
var easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};
var easeInCubic = (t) => t * t * t;
var easeOutCubic = (t) => {
  return 1 + --t * t * t;
};
var easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t);
};
var easeInQuart = (t) => t * t * t * t;
var easeOutQuart = (t) => {
  return 1 - --t * t * t * t;
};
var easeInOutQuart = (t) => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
};
var easeInQuint = (t) => t * t * t * t * t;
var easeOutQuint = (t) => {
  return 1 + --t * t * t * t * t;
};
var easeInOutQuint = (t) => {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
};
var easeInSine = (t) => {
  return 1 - cos(t * PI / 2);
};
var easeOutSine = (t) => {
  return sin(t * PI / 2);
};
var easeInOutSine = (t) => {
  return 0.5 * (1 - cos(PI * t));
};
var easeInExpo = (t) => {
  return t === 0 ? 0 : pow(2, 10 * (t - 1));
};
var easeOutExpo = (t) => {
  return t === 1 ? 1 : 1 - pow(2, -10 * t);
};
var easeInOutExpo = (t) => {
  if (t === 0)
    return 0;
  if (t === 1)
    return 1;
  return t < 0.5 ? 0.5 * pow(2, 20 * t - 10) : 0.5 * (2 - pow(2, -20 * t + 10));
};
var easeInCirc = (t) => {
  return 1 - sqrt(1 - t * t);
};
var easeOutCirc = (t) => {
  return sqrt(1 - --t * t);
};
var easeInOutCirc = (t) => {
  return t < 0.5 ? 0.5 * (1 - sqrt(1 - 4 * t * t)) : 0.5 * (sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1);
};
var easeInBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
};
var easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
};
var easeInOutBack = (t) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5 ? pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};
var easeInElastic = (t) => {
  const c4 = 2 * PI / 3;
  return t === 0 ? 0 : t === 1 ? 1 : -pow(2, 10 * t - 10) * sin((t * 10 - 10.75) * c4);
};
var easeOutElastic = (t) => {
  const c4 = 2 * PI / 3;
  return t === 0 ? 0 : t === 1 ? 1 : pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1;
};
var easeInOutElastic = (t) => {
  const c5 = 2 * PI / 4.5;
  return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(pow(2, 20 * t - 10) * sin((20 * t - 11.125) * c5)) / 2 : pow(2, -20 * t + 10) * sin((20 * t - 11.125) * c5) / 2 + 1;
};
var easeInBounce = (t) => {
  return 1 - easeOutBounce(1 - t);
};
var easeOutBounce = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};
var easeInOutBounce = (t) => {
  return t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;
};
var easings = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce
};
var createAnimationFrame = (time, deltaTime, frame) => ({
  time,
  deltaTime,
  frame
});

class AnimationLoop {
  running = false;
  startTime = 0;
  lastTime = 0;
  frameCount = 0;
  callbacks = [];
  start() {
    if (this.running)
      return;
    this.running = true;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.frameCount = 0;
    this.loop();
  }
  stop() {
    this.running = false;
  }
  onFrame(callback) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
  loop() {
    if (!this.running)
      return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    const totalTime = currentTime - this.startTime;
    const frame = createAnimationFrame(totalTime, deltaTime, this.frameCount);
    this.callbacks.forEach((callback) => callback(frame));
    this.lastTime = currentTime;
    this.frameCount++;
    requestAnimationFrame(() => this.loop());
  }
}

class Tween {
  startValue;
  endValue;
  duration;
  easing;
  onUpdate;
  onComplete;
  startTime = 0;
  running = false;
  constructor(startValue, endValue, duration, easing = linear, onUpdate, onComplete) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }
  start() {
    if (this.running)
      return;
    this.running = true;
    this.startTime = performance.now();
    this.update();
  }
  stop() {
    this.running = false;
  }
  update() {
    if (!this.running)
      return;
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = clamp(elapsed / this.duration, 0, 1);
    const easedProgress = this.easing(progress);
    const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;
    this.onUpdate(currentValue);
    if (progress >= 1) {
      this.running = false;
      this.onComplete?.();
    } else {
      requestAnimationFrame(() => this.update());
    }
  }
}
var tween = (startValue, endValue, duration, easing = linear, onUpdate, onComplete) => {
  const tweenInstance = new Tween(startValue, endValue, duration, easing, onUpdate, onComplete);
  tweenInstance.start();
  return tweenInstance;
};
var delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
var animate = (duration, easing = linear, onUpdate, onComplete) => {
  return tween(0, 1, duration, easing, onUpdate, onComplete);
};

class Spring {
  value;
  target;
  velocity = 0;
  stiffness;
  damping;
  mass;
  onUpdate;
  running = false;
  constructor(initialValue, stiffness = 0.1, damping = 0.8, mass = 1, onUpdate) {
    this.value = initialValue;
    this.target = initialValue;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.onUpdate = onUpdate;
  }
  setTarget(target) {
    this.target = target;
    if (!this.running) {
      this.start();
    }
  }
  setValue(value) {
    this.value = value;
    this.velocity = 0;
    this.onUpdate(this.value);
  }
  start() {
    if (this.running)
      return;
    this.running = true;
    this.update();
  }
  stop() {
    this.running = false;
  }
  update() {
    if (!this.running)
      return;
    const force = -this.stiffness * (this.value - this.target);
    const acceleration = force / this.mass;
    this.velocity += acceleration;
    this.velocity *= this.damping;
    this.value += this.velocity;
    this.onUpdate(this.value);
    if (Math.abs(this.value - this.target) < 0.001 && Math.abs(this.velocity) < 0.001) {
      this.value = this.target;
      this.velocity = 0;
      this.onUpdate(this.value);
      this.running = false;
    } else {
      requestAnimationFrame(() => this.update());
    }
  }
}
var spring = (initialValue, stiffness = 0.1, damping = 0.8, mass = 1, onUpdate) => {
  return new Spring(initialValue, stiffness, damping, mass, onUpdate);
};
// src/random.ts
class SeededRandom {
  seed_;
  constructor(seed = Date.now()) {
    this.seed_ = seed;
  }
  next() {
    this.seed_ = (this.seed_ * 1664525 + 1013904223) % 4294967296;
    return this.seed_ / 4294967296;
  }
  seed(value) {
    this.seed_ = value;
  }
  int(min2, max2) {
    return floor(this.next() * (max2 - min2 + 1)) + min2;
  }
  float(min2, max2) {
    return this.next() * (max2 - min2) + min2;
  }
  bool() {
    return this.next() > 0.5;
  }
  choice(array) {
    if (array.length === 0) {
      throw new Error("Cannot choose from empty array");
    }
    return array[this.int(0, array.length - 1)];
  }
  sign() {
    return this.bool() ? 1 : -1;
  }
  angle() {
    return this.float(0, Math.PI * 2);
  }
  inCircle() {
    const angle = this.angle();
    const radius = Math.sqrt(this.next());
    return vec2(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  onCircle() {
    const angle = this.angle();
    return vec2(Math.cos(angle), Math.sin(angle));
  }
  gaussian(mean = 0, standardDeviation = 1) {
    if (this.hasNextGaussian) {
      this.hasNextGaussian = false;
      return this.nextGaussian * standardDeviation + mean;
    }
    const u = this.next();
    const v = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const z1 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
    this.nextGaussian = z1;
    this.hasNextGaussian = true;
    return z0 * standardDeviation + mean;
  }
  hasNextGaussian = false;
  nextGaussian = 0;
}

class SimpleNoise {
  hash(x) {
    x = (x >> 16 ^ x) * 73244475;
    x = (x >> 16 ^ x) * 73244475;
    x = x >> 16 ^ x;
    return x / 4294967296;
  }
  hash2(x, y) {
    return this.hash(x + y * 57);
  }
  hash3(x, y, z) {
    return this.hash(x + y * 57 + z * 113);
  }
  interpolate(a, b, t) {
    return a + t * t * (3 - 2 * t) * (b - a);
  }
  noise1D(x) {
    const i = floor(x);
    const f = x - i;
    const a = this.hash(i);
    const b = this.hash(i + 1);
    return this.interpolate(a, b, f);
  }
  noise2D(x, y) {
    const i = floor(x);
    const j = floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = this.hash2(i, j);
    const b = this.hash2(i + 1, j);
    const c = this.hash2(i, j + 1);
    const d = this.hash2(i + 1, j + 1);
    const i1 = this.interpolate(a, b, fx);
    const i2 = this.interpolate(c, d, fx);
    return this.interpolate(i1, i2, fy);
  }
  noise3D(x, y, z) {
    const i = floor(x);
    const j = floor(y);
    const k = floor(z);
    const fx = x - i;
    const fy = y - j;
    const fz = z - k;
    const a = this.hash3(i, j, k);
    const b = this.hash3(i + 1, j, k);
    const c = this.hash3(i, j + 1, k);
    const d = this.hash3(i + 1, j + 1, k);
    const e = this.hash3(i, j, k + 1);
    const f = this.hash3(i + 1, j, k + 1);
    const g = this.hash3(i, j + 1, k + 1);
    const h = this.hash3(i + 1, j + 1, k + 1);
    const i1 = this.interpolate(a, b, fx);
    const i2 = this.interpolate(c, d, fx);
    const i3 = this.interpolate(e, f, fx);
    const i4 = this.interpolate(g, h, fx);
    const j1 = this.interpolate(i1, i2, fy);
    const j2 = this.interpolate(i3, i4, fy);
    return this.interpolate(j1, j2, fz);
  }
}

class FractalNoise {
  noise;
  octaves;
  persistence;
  lacunarity;
  constructor(baseNoise = new SimpleNoise, octaves = 4, persistence = 0.5, lacunarity = 2) {
    this.noise = baseNoise;
    this.octaves = octaves;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
  }
  noise1D(x) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0;i < this.octaves; i++) {
      value += this.noise.noise1D(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }
    return value / maxValue;
  }
  noise2D(x, y) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0;i < this.octaves; i++) {
      value += this.noise.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }
    return value / maxValue;
  }
  noise3D(x, y, z) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0;i < this.octaves; i++) {
      value += this.noise.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }
    return value / maxValue;
  }
}

class PerlinNoise {
  permutation;
  p;
  constructor(seed) {
    this.permutation = [];
    for (let i = 0;i < 256; i++) {
      this.permutation[i] = i;
    }
    if (seed !== undefined) {
      const random = new SeededRandom(seed);
      for (let i = 255;i > 0; i--) {
        const j = random.int(0, i);
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
    } else {
      for (let i = 255;i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
    }
    this.p = [];
    for (let i = 0;i < 512; i++) {
      this.p[i] = this.permutation[i & 255];
    }
  }
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  noise1D(x) {
    return this.noise3D(x, 0, 0);
  }
  noise2D(x, y) {
    return this.noise3D(x, y, 0);
  }
  noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;
    return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
  }
  lerp(t, a, b) {
    return a + t * (b - a);
  }
}
var random = new SeededRandom;
var noise = new PerlinNoise;
var fractalNoise = new FractalNoise;
var randomInt = (min2, max2) => {
  return random.int(min2, max2);
};
var randomFloat = (min2, max2) => {
  return random.float(min2, max2);
};
var randomBool = () => {
  return random.bool();
};
var randomChoice = (array) => {
  return random.choice(array);
};
var randomSign = () => {
  return random.sign();
};
var randomAngle = () => {
  return random.angle();
};
var randomInCircle = () => {
  return random.inCircle();
};
var randomOnCircle = () => {
  return random.onCircle();
};
var randomGaussian = (mean = 0, standardDeviation = 1) => {
  return random.gaussian(mean, standardDeviation);
};
var setSeed = (seed) => {
  random.seed(seed);
};
var weightedChoice = (choices, weights) => {
  if (choices.length !== weights.length) {
    throw new Error("Choices and weights arrays must have the same length");
  }
  if (choices.length === 0) {
    throw new Error("Cannot choose from empty array");
  }
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;
  let currentWeight = 0;
  for (let i = 0;i < choices.length; i++) {
    currentWeight += weights[i];
    if (randomValue <= currentWeight) {
      return choices[i];
    }
  }
  return choices[choices.length - 1];
};
var shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1;i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
var randomColor = () => {
  return {
    r: randomInt(0, 255),
    g: randomInt(0, 255),
    b: randomInt(0, 255)
  };
};
var randomColorHSL = (hueMin = 0, hueMax = 360, saturationMin = 0, saturationMax = 100, lightnessMin = 0, lightnessMax = 100) => {
  return {
    h: randomFloat(hueMin, hueMax),
    s: randomFloat(saturationMin, saturationMax),
    l: randomFloat(lightnessMin, lightnessMax)
  };
};
var randomDistribution = (count, min2, max2) => {
  const values = [];
  for (let i = 0;i < count; i++) {
    values.push(randomFloat(min2, max2));
  }
  return values;
};
var randomWalk = (steps, stepSize = 1, dimensions = 2) => {
  const walk = [];
  const position = new Array(dimensions).fill(0);
  walk.push([...position]);
  for (let i = 0;i < steps; i++) {
    for (let d = 0;d < dimensions; d++) {
      position[d] += (Math.random() - 0.5) * stepSize * 2;
    }
    walk.push([...position]);
  }
  return walk;
};
var sample = (array, count) => {
  if (array.length === 0)
    throw new Error("Cannot sample from empty array");
  if (count <= 0)
    return [];
  if (count >= array.length)
    return [...array];
  const result = [];
  const used = new Set;
  while (result.length < count) {
    const index = randomInt(0, array.length - 1);
    if (!used.has(index)) {
      used.add(index);
      result.push(array[index]);
    }
  }
  return result;
};
var sampleWeighted = (array, weights, count) => {
  const result = [];
  for (let i = 0;i < count; i++) {
    result.push(weightedChoice(array, weights));
  }
  return result;
};
// src/geometry.ts
var point = (x, y) => ({ x, y });
var pointDistance = (a, b) => {
  return vec2Distance(a, b);
};
var pointDistanceSq = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
var pointLerp = (a, b, t) => {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
};
var pointAngle = (a, b) => {
  return atan2(b.y - a.y, b.x - a.x);
};
var size = (width, height) => ({ width, height });
var sizeArea = (s) => {
  return s.width * s.height;
};
var sizePerimeter = (s) => {
  return 2 * (s.width + s.height);
};
var sizeAspectRatio = (s) => {
  return s.width / s.height;
};
var sizeScale = (s, factor) => ({
  width: s.width * factor,
  height: s.height * factor
});
var sizeFit = (s, container) => {
  const scale = min(container.width / s.width, container.height / s.height);
  return sizeScale(s, scale);
};
var sizeFill = (s, container) => {
  const scale = max(container.width / s.width, container.height / s.height);
  return sizeScale(s, scale);
};
var rect = (x, y, width, height) => ({
  x,
  y,
  width,
  height
});
var rectFromPoints = (p1, p2) => {
  const x = min(p1.x, p2.x);
  const y = min(p1.y, p2.y);
  const width = abs(p2.x - p1.x);
  const height = abs(p2.y - p1.y);
  return rect(x, y, width, height);
};
var rectFromCenter = (center, size2) => {
  return rect(center.x - size2.width / 2, center.y - size2.height / 2, size2.width, size2.height);
};
var rectCenter = (r) => {
  return point(r.x + r.width / 2, r.y + r.height / 2);
};
var rectTopLeft = (r) => {
  return point(r.x, r.y);
};
var rectTopRight = (r) => {
  return point(r.x + r.width, r.y);
};
var rectBottomLeft = (r) => {
  return point(r.x, r.y + r.height);
};
var rectBottomRight = (r) => {
  return point(r.x + r.width, r.y + r.height);
};
var rectArea = (r) => {
  return r.width * r.height;
};
var rectPerimeter = (r) => {
  return 2 * (r.width + r.height);
};
var rectExpand = (r, amount) => {
  return rect(r.x - amount, r.y - amount, r.width + 2 * amount, r.height + 2 * amount);
};
var rectScale = (r, factor) => {
  const center = rectCenter(r);
  const newWidth = r.width * factor;
  const newHeight = r.height * factor;
  return rect(center.x - newWidth / 2, center.y - newHeight / 2, newWidth, newHeight);
};
var rectUnion = (a, b) => {
  const x = min(a.x, b.x);
  const y = min(a.y, b.y);
  const right = max(a.x + a.width, b.x + b.width);
  const bottom = max(a.y + a.height, b.y + b.height);
  return rect(x, y, right - x, bottom - y);
};
var rectIntersection = (a, b) => {
  const x = max(a.x, b.x);
  const y = max(a.y, b.y);
  const right = min(a.x + a.width, b.x + b.width);
  const bottom = min(a.y + a.height, b.y + b.height);
  if (x >= right || y >= bottom) {
    return null;
  }
  return rect(x, y, right - x, bottom - y);
};
var circle = (x, y, radius) => ({
  x,
  y,
  radius
});
var circleFromPoints = (p1, p2, p3) => {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (abs(d) < 0.0000000001) {
    return circle(0, 0, 0);
  }
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const radius = pointDistance(point(ux, uy), p1);
  return circle(ux, uy, radius);
};
var circleCenter = (c) => {
  return point(c.x, c.y);
};
var circleArea = (c) => {
  return PI * c.radius * c.radius;
};
var circleCircumference = (c) => {
  return TWO_PI * c.radius;
};
var circlePointAt = (c, angle) => {
  return point(c.x + c.radius * cos(angle), c.y + c.radius * sin(angle));
};
var circleExpandToPoint = (c, p) => {
  const distance = pointDistance(circleCenter(c), p);
  return circle(c.x, c.y, max(c.radius, distance));
};
var pointInRect = (p, r) => {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
};
var pointInCircle = (p, c) => {
  return pointDistanceSq(p, circleCenter(c)) <= c.radius * c.radius;
};
var rectIntersects = (a, b) => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};
var circleIntersects = (a, b) => {
  const distance = pointDistance(circleCenter(a), circleCenter(b));
  return distance <= a.radius + b.radius;
};
var circleRectIntersects = (c, r) => {
  const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
  const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));
  const distance = pointDistance(circleCenter(c), point(closestX, closestY));
  return distance <= c.radius;
};
var line = (start, end) => ({ start, end });
var lineLength = (l) => {
  return pointDistance(l.start, l.end);
};
var lineAngle = (l) => {
  return pointAngle(l.start, l.end);
};
var linePointAt = (l, t) => {
  return pointLerp(l.start, l.end, t);
};
var lineNormal = (l) => {
  const direction = vec2Sub(l.end, l.start);
  const normal = vec2(-direction.y, direction.x);
  return vec2Normalize(normal);
};
var lineDirection = (l) => {
  return vec2Normalize(vec2Sub(l.end, l.start));
};
var lineDistanceToPoint = (l, p) => {
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
var lineIntersection = (l1, l2) => {
  const x1 = l1.start.x;
  const y1 = l1.start.y;
  const x2 = l1.end.x;
  const y2 = l1.end.y;
  const x3 = l2.start.x;
  const y3 = l2.start.y;
  const x4 = l2.end.x;
  const y4 = l2.end.y;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (abs(denom) < 0.0000000001) {
    return null;
  }
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return point(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }
  return null;
};
var polygon = (...points) => {
  if (points.length < 3)
    throw new Error("Polygon must have at least 3 vertices");
  return points;
};
var polygonArea = (poly) => {
  let area = 0;
  const n = poly.length;
  for (let i = 0;i < n; i++) {
    const j = (i + 1) % n;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return abs(area) / 2;
};
var polygonCentroid = (poly) => {
  let x = 0;
  let y = 0;
  const n = poly.length;
  for (let i = 0;i < n; i++) {
    x += poly[i].x;
    y += poly[i].y;
  }
  return point(x / n, y / n);
};
var polygonPerimeter = (poly) => {
  let perimeter = 0;
  const n = poly.length;
  for (let i = 0;i < n; i++) {
    const j = (i + 1) % n;
    perimeter += pointDistance(poly[i], poly[j]);
  }
  return perimeter;
};
var pointInPolygon = (p, poly) => {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1;i < n; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > p.y !== yj > p.y && p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};
var polygonBoundingBox = (poly) => {
  if (poly.length === 0) {
    return rect(0, 0, 0, 0);
  }
  let minX = poly[0].x;
  let minY = poly[0].y;
  let maxX = poly[0].x;
  let maxY = poly[0].y;
  for (let i = 1;i < poly.length; i++) {
    minX = min(minX, poly[i].x);
    minY = min(minY, poly[i].y);
    maxX = max(maxX, poly[i].x);
    maxY = max(maxY, poly[i].y);
  }
  return rect(minX, minY, maxX - minX, maxY - minY);
};
var regularPolygon = (center, radius, sides, rotation = 0) => {
  if (sides < 3)
    throw new Error("Regular polygon must have at least 3 sides");
  const points = [];
  const angleStep = TWO_PI / sides;
  for (let i = 0;i < sides; i++) {
    const angle = i * angleStep + rotation;
    points.push(point(center.x + radius * cos(angle), center.y + radius * sin(angle)));
  }
  return points;
};
var quadraticBezier = (t, p0, p1, p2) => {
  const u = 1 - t;
  return point(u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y);
};
var cubicBezier = (t, p0, p1, p2, p3) => {
  const u = 1 - t;
  return point(u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y);
};
var gridPoints = (bounds, cellSize) => {
  const points = [];
  const cols = Math.floor(bounds.width / cellSize);
  const rows = Math.floor(bounds.height / cellSize);
  for (let row = 0;row <= rows; row++) {
    for (let col = 0;col <= cols; col++) {
      points.push(point(bounds.x + col * cellSize, bounds.y + row * cellSize));
    }
  }
  return points;
};
var hexGrid = (center, radius, rings) => {
  const points = [center];
  for (let ring = 1;ring <= rings; ring++) {
    for (let side = 0;side < 6; side++) {
      for (let i = 0;i < ring; i++) {
        const angle = (side * 60 + i * 60 / ring) * PI / 180;
        const distance = ring * radius;
        points.push(point(center.x + distance * cos(angle), center.y + distance * sin(angle)));
      }
    }
  }
  return points;
};
var triangle = (p1, p2, p3) => [p1, p2, p3];
var square = (center, size2) => {
  const half = size2 / 2;
  return [
    point(center.x - half, center.y - half),
    point(center.x + half, center.y - half),
    point(center.x + half, center.y + half),
    point(center.x - half, center.y + half)
  ];
};
var pentagon = (center, radius) => {
  return regularPolygon(center, radius, 5);
};
var hexagon = (center, radius) => {
  return regularPolygon(center, radius, 6);
};
var octagon = (center, radius) => {
  return regularPolygon(center, radius, 8);
};
var star = (center, outerRadius, innerRadius, points) => {
  const vertices = [];
  const angleStep = TWO_PI / (points * 2);
  for (let i = 0;i < points * 2; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push(point(center.x + radius * cos(angle), center.y + radius * sin(angle)));
  }
  return vertices;
};
// src/physics.ts
var gravity = (mass = 1, strength = 9.81) => vec2(0, mass * strength);
var friction = (velocity, coefficient = 0.1) => vec2Mul(velocity, -coefficient);
var drag = (velocity, coefficient = 0.01) => {
  const speed = vec2Length(velocity);
  return vec2Mul(vec2Normalize(velocity), -coefficient * speed * speed);
};
var attraction = (pos1, pos2, mass1 = 1, mass2 = 1, strength = 1) => {
  const direction = vec2Sub(pos2, pos1);
  const distance = vec2Length(direction);
  if (distance === 0)
    return vec2(0, 0);
  const force = strength * mass1 * mass2 / (distance * distance);
  return vec2Mul(vec2Normalize(direction), force);
};
var repulsion = (pos1, pos2, mass1 = 1, mass2 = 1, strength = 1) => {
  const attr = attraction(pos1, pos2, mass1, mass2, strength);
  return vec2Mul(attr, -1);
};
var springForce = (pos1, pos2, restLength, stiffness = 0.1, damping = 0.99) => {
  const direction = vec2Sub(pos2, pos1);
  const distance = vec2Length(direction);
  const displacement = distance - restLength;
  if (distance === 0)
    return vec2(0, 0);
  const force = displacement * stiffness;
  return vec2Mul(vec2Normalize(direction), force * damping);
};

class Particle {
  position;
  velocity;
  acceleration;
  mass;
  lifetime;
  maxLifetime;
  isDead;
  constructor(x = 0, y = 0, vx = 0, vy = 0, mass = 1, lifetime = Infinity) {
    this.position = vec2(x, y);
    this.velocity = vec2(vx, vy);
    this.acceleration = vec2(0, 0);
    this.mass = mass;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.isDead = false;
  }
  addForce(force) {
    const accel = vec2Mul(force, 1 / this.mass);
    this.acceleration = vec2Add(this.acceleration, accel);
  }
  update(deltaTime = 1) {
    this.velocity = vec2Add(this.velocity, vec2Mul(this.acceleration, deltaTime));
    this.position = vec2Add(this.position, vec2Mul(this.velocity, deltaTime));
    this.acceleration = vec2(0, 0);
    if (this.lifetime !== Infinity) {
      this.lifetime -= deltaTime;
      if (this.lifetime <= 0) {
        this.isDead = true;
      }
    }
  }
  distanceTo(other) {
    return vec2Distance(this.position, other.position);
  }
  attractTo(other, strength = 1) {
    const force = attraction(this.position, other.position, this.mass, other.mass, strength);
    this.addForce(force);
  }
  repelFrom(other, strength = 1) {
    const force = repulsion(this.position, other.position, this.mass, other.mass, strength);
    this.addForce(force);
  }
  applySpring(anchor, restLength = 0, stiffness = 0.1) {
    const force = springForce(this.position, anchor, restLength, stiffness);
    this.addForce(force);
  }
  getAge() {
    return this.maxLifetime - this.lifetime;
  }
  getAgeRatio() {
    if (this.maxLifetime === Infinity)
      return 0;
    return this.getAge() / this.maxLifetime;
  }
}

class ParticleSystem {
  particles;
  forces;
  constructor() {
    this.particles = [];
    this.forces = [];
  }
  addParticle(particle) {
    this.particles.push(particle);
  }
  addForce(force) {
    this.forces.push(force);
  }
  update(deltaTime = 1) {
    for (let i = 0;i < this.particles.length; i++) {
      const particle = this.particles[i];
      for (const force of this.forces) {
        particle.addForce(force(particle, i, this.particles));
      }
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter((p) => !p.isDead);
  }
  getParticles() {
    return this.particles;
  }
  getAliveCount() {
    return this.particles.length;
  }
  clear() {
    this.particles = [];
  }
}

class VerletParticle {
  position;
  oldPosition;
  acceleration;
  mass;
  pinned;
  constructor(x = 0, y = 0, mass = 1) {
    this.position = vec2(x, y);
    this.oldPosition = vec2(x, y);
    this.acceleration = vec2(0, 0);
    this.mass = mass;
    this.pinned = false;
  }
  addForce(force) {
    const accel = vec2Mul(force, 1 / this.mass);
    this.acceleration = vec2Add(this.acceleration, accel);
  }
  update(deltaTime = 1) {
    if (this.pinned)
      return;
    const velocity = vec2Sub(this.position, this.oldPosition);
    this.oldPosition = { ...this.position };
    const deltaTimeSquared = deltaTime * deltaTime;
    const accelStep = vec2Mul(this.acceleration, deltaTimeSquared);
    this.position = vec2Add(vec2Add(this.position, velocity), accelStep);
    this.acceleration = vec2(0, 0);
  }
  pin() {
    this.pinned = true;
  }
  unpin() {
    this.pinned = false;
  }
}

class VerletConstraint {
  p1;
  p2;
  restLength;
  stiffness;
  constructor(p1, p2, stiffness = 1) {
    this.p1 = p1;
    this.p2 = p2;
    this.restLength = vec2Distance(p1.position, p2.position);
    this.stiffness = stiffness;
  }
  update() {
    const delta = vec2Sub(this.p2.position, this.p1.position);
    const distance = vec2Length(delta);
    if (distance === 0)
      return;
    const difference = (this.restLength - distance) / distance;
    const translate = vec2Mul(delta, difference * 0.5 * this.stiffness);
    if (!this.p1.pinned) {
      this.p1.position = vec2Sub(this.p1.position, translate);
    }
    if (!this.p2.pinned) {
      this.p2.position = vec2Add(this.p2.position, translate);
    }
  }
}

class Cloth {
  particles;
  constraints;
  width;
  height;
  constructor(width, height, resolution = 10, stiffness = 1) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.constraints = [];
    const cols = Math.floor(width / resolution);
    const rows = Math.floor(height / resolution);
    for (let y = 0;y <= rows; y++) {
      this.particles[y] = [];
      for (let x = 0;x <= cols; x++) {
        const px = x / cols * width;
        const py = y / rows * height;
        this.particles[y][x] = new VerletParticle(px, py);
      }
    }
    for (let y = 0;y <= rows; y++) {
      for (let x = 0;x <= cols; x++) {
        const particle = this.particles[y][x];
        if (x < cols) {
          this.constraints.push(new VerletConstraint(particle, this.particles[y][x + 1], stiffness));
        }
        if (y < rows) {
          this.constraints.push(new VerletConstraint(particle, this.particles[y + 1][x], stiffness));
        }
      }
    }
  }
  update() {
    for (const row of this.particles) {
      for (const particle of row) {
        particle.update();
      }
    }
    for (let i = 0;i < 3; i++) {
      for (const constraint of this.constraints) {
        constraint.update();
      }
    }
  }
  pinCorners() {
    const rows = this.particles.length - 1;
    const cols = this.particles[0].length - 1;
    this.particles[0][0].pin();
    this.particles[0][cols].pin();
  }
  addWind(force) {
    for (const row of this.particles) {
      for (const particle of row) {
        particle.addForce(force);
      }
    }
  }
  addGravity(strength = 0.1) {
    for (const row of this.particles) {
      for (const particle of row) {
        particle.addForce(vec2(0, strength));
      }
    }
  }
}
var createOrbit = (center, radius, speed, angle = 0) => {
  const x = center.x + Math.cos(angle) * radius;
  const y = center.y + Math.sin(angle) * radius;
  const vx = -Math.sin(angle) * speed;
  const vy = Math.cos(angle) * speed;
  return {
    position: vec2(x, y),
    velocity: vec2(vx, vy)
  };
};
var createExplosion = (center, count, minSpeed = 1, maxSpeed = 5, lifetime = 100) => {
  const particles = [];
  for (let i = 0;i < count; i++) {
    const angle = i / count * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    particles.push(new Particle(center.x, center.y, vx, vy, 1, lifetime + Math.random() * lifetime * 0.5));
  }
  return particles;
};
// src/fractals.ts
class LSystem {
  axiom;
  rules;
  current;
  generation;
  constructor(axiom, rules = []) {
    this.axiom = axiom;
    this.rules = new Map;
    this.current = axiom;
    this.generation = 0;
    for (const rule of rules) {
      this.rules.set(rule.symbol, rule.replacement);
    }
  }
  addRule(symbol, replacement) {
    this.rules.set(symbol, replacement);
  }
  iterate(generations = 1) {
    for (let i = 0;i < generations; i++) {
      let next = "";
      for (const symbol of this.current) {
        next += this.rules.get(symbol) || symbol;
      }
      this.current = next;
      this.generation++;
    }
    return this.current;
  }
  reset() {
    this.current = this.axiom;
    this.generation = 0;
  }
  getString() {
    return this.current;
  }
  getGeneration() {
    return this.generation;
  }
}

class Turtle {
  position;
  angle;
  stack;
  path;
  penDown;
  constructor(x = 0, y = 0, angle = 0) {
    this.position = vec2(x, y);
    this.angle = angle;
    this.stack = [];
    this.path = [];
    this.penDown = true;
  }
  forward(distance) {
    const newPosition = vec2Add(this.position, vec2(Math.cos(this.angle) * distance, Math.sin(this.angle) * distance));
    if (this.penDown) {
      this.path.push({ ...this.position });
      this.path.push({ ...newPosition });
    }
    this.position = newPosition;
  }
  turn(angle) {
    this.angle += angle;
  }
  turnLeft(angle) {
    this.turn(-angle);
  }
  turnRight(angle) {
    this.turn(angle);
  }
  push() {
    this.stack.push({
      position: { ...this.position },
      angle: this.angle
    });
  }
  pop() {
    const state = this.stack.pop();
    if (state) {
      this.position = state.position;
      this.angle = state.angle;
    }
  }
  penUp() {
    this.penDown = false;
  }
  penDownFn() {
    this.penDown = true;
  }
  getPath() {
    return this.path;
  }
  reset(x = 0, y = 0, angle = 0) {
    this.position = vec2(x, y);
    this.angle = angle;
    this.stack = [];
    this.path = [];
    this.penDown = true;
  }
}
var lSystems = {
  koch: new LSystem("F", [
    { symbol: "F", replacement: "F+F-F-F+F" }
  ]),
  sierpinski: new LSystem("F-G-G", [
    { symbol: "F", replacement: "F-G+F+G-F" },
    { symbol: "G", replacement: "GG" }
  ]),
  dragon: new LSystem("FX", [
    { symbol: "X", replacement: "X+YF+" },
    { symbol: "Y", replacement: "-FX-Y" }
  ]),
  plant: new LSystem("X", [
    { symbol: "X", replacement: "F+[[X]-X]-F[-FX]+X" },
    { symbol: "F", replacement: "FF" }
  ]),
  tree: new LSystem("F", [
    { symbol: "F", replacement: "F[+F]F[-F]F" }
  ]),
  cantor: new LSystem("F", [
    { symbol: "F", replacement: "F F" },
    { symbol: " ", replacement: "   " }
  ])
};

class LSystemInterpreter {
  commands;
  defaultAngle;
  defaultDistance;
  constructor(angle = 60, distance = 10) {
    this.commands = new Map;
    this.defaultAngle = radians(angle);
    this.defaultDistance = distance;
    this.addCommand("F", (turtle) => turtle.forward(this.defaultDistance));
    this.addCommand("G", (turtle) => turtle.forward(this.defaultDistance));
    this.addCommand("+", (turtle) => turtle.turnLeft(this.defaultAngle));
    this.addCommand("-", (turtle) => turtle.turnRight(this.defaultAngle));
    this.addCommand("[", (turtle) => turtle.push());
    this.addCommand("]", (turtle) => turtle.pop());
  }
  addCommand(symbol, action) {
    this.commands.set(symbol, action);
  }
  interpret(lSystem, turtle) {
    for (const symbol of lSystem) {
      const command = this.commands.get(symbol);
      if (command) {
        command(turtle);
      }
    }
    return turtle.getPath();
  }
  draw(lSystem, generations, turtle) {
    lSystem.iterate(generations);
    return this.interpret(lSystem.getString(), turtle);
  }
}
var mandelbrot = (c, maxIterations = 100) => {
  let z = { real: 0, imag: 0 };
  let iterations = 0;
  while (iterations < maxIterations) {
    const zReal = z.real * z.real - z.imag * z.imag + c.real;
    const zImag = 2 * z.real * z.imag + c.imag;
    z.real = zReal;
    z.imag = zImag;
    if (z.real * z.real + z.imag * z.imag > 4) {
      break;
    }
    iterations++;
  }
  return iterations;
};
var mandelbrotSet = (width, height, xMin = -2.5, xMax = 1.5, yMin = -2, yMax = 2, maxIterations = 100) => {
  const result = [];
  for (let y = 0;y < height; y++) {
    result[y] = [];
    for (let x = 0;x < width; x++) {
      const real = xMin + x / width * (xMax - xMin);
      const imag = yMin + y / height * (yMax - yMin);
      result[y][x] = mandelbrot({ real, imag }, maxIterations);
    }
  }
  return result;
};
var julia = (z, c, maxIterations = 100) => {
  let iterations = 0;
  while (iterations < maxIterations) {
    const zReal = z.real * z.real - z.imag * z.imag + c.real;
    const zImag = 2 * z.real * z.imag + c.imag;
    z.real = zReal;
    z.imag = zImag;
    if (z.real * z.real + z.imag * z.imag > 4) {
      break;
    }
    iterations++;
  }
  return iterations;
};
var juliaSet = (width, height, c, xMin = -2, xMax = 2, yMin = -2, yMax = 2, maxIterations = 100) => {
  const result = [];
  for (let y = 0;y < height; y++) {
    result[y] = [];
    for (let x = 0;x < width; x++) {
      const real = xMin + x / width * (xMax - xMin);
      const imag = yMin + y / height * (yMax - yMin);
      result[y][x] = julia({ real, imag }, c, maxIterations);
    }
  }
  return result;
};
var sierpinskiTriangle = (points, iterations, startPoint) => {
  if (points.length < 3)
    throw new Error("Need at least 3 vertices");
  const result = [];
  let current = startPoint || {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  };
  for (let i = 0;i < iterations; i++) {
    const target = points[Math.floor(Math.random() * points.length)];
    current = {
      x: (current.x + target.x) / 2,
      y: (current.y + target.y) / 2
    };
    result.push({ ...current });
  }
  return result;
};
var barnsleyFern = (iterations) => {
  const result = [];
  let x = 0, y = 0;
  for (let i = 0;i < iterations; i++) {
    const r = Math.random();
    let newX, newY;
    if (r < 0.01) {
      newX = 0;
      newY = 0.16 * y;
    } else if (r < 0.86) {
      newX = 0.85 * x + 0.04 * y;
      newY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      newX = 0.2 * x - 0.26 * y;
      newY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      newX = -0.15 * x + 0.28 * y;
      newY = 0.26 * x + 0.24 * y + 0.44;
    }
    x = newX;
    y = newY;
    result.push({ x, y });
  }
  return result;
};
var kochSnowflake = (start, end, depth) => {
  if (depth === 0) {
    return [start, end];
  }
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const p1 = start;
  const p2 = {
    x: start.x + dx / 3,
    y: start.y + dy / 3
  };
  const p4 = {
    x: start.x + 2 * dx / 3,
    y: start.y + 2 * dy / 3
  };
  const p5 = end;
  const cx = (p2.x + p4.x) / 2;
  const cy = (p2.y + p4.y) / 2;
  const angle = Math.atan2(dy, dx) - Math.PI / 2;
  const height = Math.sqrt(dx * dx + dy * dy) / (2 * Math.sqrt(3));
  const p3 = {
    x: cx + Math.cos(angle) * height,
    y: cy + Math.sin(angle) * height
  };
  return [
    ...kochSnowflake(p1, p2, depth - 1).slice(0, -1),
    ...kochSnowflake(p2, p3, depth - 1).slice(0, -1),
    ...kochSnowflake(p3, p4, depth - 1).slice(0, -1),
    ...kochSnowflake(p4, p5, depth - 1)
  ];
};
var createKochSnowflake = (center, radius, depth) => {
  const vertices = [
    {
      x: center.x + radius * Math.cos(0),
      y: center.y + radius * Math.sin(0)
    },
    {
      x: center.x + radius * Math.cos(2 * Math.PI / 3),
      y: center.y + radius * Math.sin(2 * Math.PI / 3)
    },
    {
      x: center.x + radius * Math.cos(4 * Math.PI / 3),
      y: center.y + radius * Math.sin(4 * Math.PI / 3)
    }
  ];
  return [
    ...kochSnowflake(vertices[0], vertices[1], depth).slice(0, -1),
    ...kochSnowflake(vertices[1], vertices[2], depth).slice(0, -1),
    ...kochSnowflake(vertices[2], vertices[0], depth)
  ];
};
var fractalTree = (start, angle, length, depth, branchAngle = Math.PI / 6, lengthRatio = 0.7) => {
  const end = {
    x: start.x + Math.cos(angle) * length,
    y: start.y + Math.sin(angle) * length
  };
  const branches = [[start, end]];
  if (depth > 0) {
    const leftBranches = fractalTree(end, angle - branchAngle, length * lengthRatio, depth - 1, branchAngle, lengthRatio);
    const rightBranches = fractalTree(end, angle + branchAngle, length * lengthRatio, depth - 1, branchAngle, lengthRatio);
    branches.push(...leftBranches, ...rightBranches);
  }
  return branches;
};
// src/index.ts
class Play {
  static instance;
  animationLoop;
  canvas;
  context;
  constructor() {
    this.animationLoop = new AnimationLoop;
  }
  get width() {
    return this.canvas?.width ?? 0;
  }
  get height() {
    return this.canvas?.height ?? 0;
  }
  static getInstance() {
    if (!Play.instance) {
      Play.instance = new Play;
    }
    return Play.instance;
  }
  setCanvas(canvas) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    this.context = ctx ?? undefined;
  }
  getCanvas() {
    return this.canvas;
  }
  getContext() {
    return this.context;
  }
  start(callback) {
    return this.animationLoop.onFrame(callback);
  }
  play() {
    this.animationLoop.start();
  }
  pause() {
    this.animationLoop.stop();
  }
  clear(color2) {
    if (!this.context || !this.canvas)
      return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (color2) {
      const prevFillStyle = this.context.fillStyle;
      this.context.fillStyle = this.convertColor(color2);
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = prevFillStyle;
    }
  }
  background(color2) {
    this.clear(color2);
  }
  setStroke(color2, width = 1) {
    if (!this.context)
      return;
    this.context.strokeStyle = this.convertColor(color2);
    this.context.lineWidth = width;
  }
  fill(color2) {
    if (!this.context)
      return;
    this.context.fillStyle = this.convertColor(color2);
  }
  convertColor(color2) {
    if (typeof color2 === "string")
      return color2;
    if (color2 && typeof color2.r === "number" && typeof color2.g === "number" && typeof color2.b === "number") {
      if (typeof color2.a === "number") {
        return toCssRgba(color2);
      }
      return toCssRgb(color2);
    }
    if (color2 && typeof color2.h === "number" && typeof color2.s === "number" && typeof color2.l === "number") {
      if (typeof color2.a === "number") {
        return toCssHsla(color2);
      }
      return toCssHsl(color2);
    }
    return "#000000";
  }
  noStroke() {
    if (!this.context)
      return;
    this.context.strokeStyle = "transparent";
  }
  noFill() {
    if (!this.context)
      return;
    this.context.fillStyle = "transparent";
  }
  drawCircle(x, y, radius, filled = true) {
    if (!this.context)
      return;
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, TWO_PI);
    if (filled) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }
  drawRect(x, y, width, height, filled = true) {
    if (!this.context)
      return;
    if (filled) {
      this.context.fillRect(x, y, width, height);
    } else {
      this.context.strokeRect(x, y, width, height);
    }
  }
  drawLine(x1, y1, x2, y2) {
    if (!this.context)
      return;
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }
  drawPolygon(points, filled = true) {
    if (!this.context || points.length < 3)
      return;
    this.context.beginPath();
    this.context.moveTo(points[0].x, points[0].y);
    for (let i = 1;i < points.length; i++) {
      this.context.lineTo(points[i].x, points[i].y);
    }
    this.context.closePath();
    if (filled) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }
  drawText(text, x, y, font) {
    if (!this.context)
      return;
    if (font) {
      this.context.font = font;
    }
    this.context.fillText(text, x, y);
  }
  translate(x, y) {
    if (!this.context)
      return;
    this.context.translate(x, y);
  }
  rotate(angle) {
    if (!this.context)
      return;
    this.context.rotate(angle);
  }
  scale(x, y = x) {
    if (!this.context)
      return;
    this.context.scale(x, y);
  }
  pushMatrix() {
    if (!this.context)
      return;
    this.context.save();
  }
  popMatrix() {
    if (!this.context)
      return;
    this.context.restore();
  }
  rect(x, y, width, height) {
    this.drawRect(x, y, width, height, true);
  }
  circle(x, y, radius) {
    this.drawCircle(x, y, radius, true);
  }
  line(x1, y1, x2, y2) {
    this.drawLine(x1, y1, x2, y2);
  }
  polygon(points) {
    this.drawPolygon(points, true);
  }
  text(text, x, y, options) {
    if (!this.context)
      return;
    let font = "";
    if (options?.weight) {
      font += options.weight + " ";
    }
    if (options?.size) {
      font += options.size + "px ";
    }
    if (options?.family) {
      font += options.family;
    } else {
      font += "Arial, sans-serif";
    }
    this.context.font = font.trim();
    if (options?.align) {
      this.context.textAlign = options.align;
    }
    this.context.fillText(text, x, y);
  }
  strokeWeight(weight) {
    if (!this.context)
      return;
    this.context.lineWidth = weight;
  }
  beginPath() {
    if (!this.context)
      return;
    this.context.beginPath();
  }
  moveTo(x, y) {
    if (!this.context)
      return;
    this.context.moveTo(x, y);
  }
  lineTo(x, y) {
    if (!this.context)
      return;
    this.context.lineTo(x, y);
  }
  stroke() {
    if (!this.context)
      return;
    this.context.stroke();
  }
}
var play = Play.getInstance();
var setup = (canvas) => {
  play.setCanvas(canvas);
  return play;
};
var version = "1.0.0";
var info = {
  name: "play.ts",
  version,
  description: "A TypeScript library for creative coding",
  author: "play.ts team",
  license: "MIT",
  modules: {
    math: "Mathematical utilities including vectors, matrices, and interpolation",
    color: "Color manipulation and conversion utilities",
    animation: "Easing functions and animation utilities",
    random: "Random number generation and noise functions",
    geometry: "Geometric shapes and collision detection",
    physics: "Physics simulation with forces, particles, and constraints",
    fractals: "Fractal generation, L-Systems, and procedural patterns"
  }
};
var src_default = {
  math: {
    clamp,
    lerp,
    map,
    normalize,
    vec2,
    vec2Add,
    vec2Sub,
    vec2Mul,
    vec2Div,
    vec2Length,
    vec2Normalize,
    vec2Distance,
    vec2Angle,
    vec2FromAngle,
    vec2Lerp,
    vec2Rotate,
    vec3,
    vec3Add,
    vec3Sub,
    vec3Mul,
    vec3Div,
    vec3Length,
    vec3Normalize,
    vec3Distance,
    vec3Lerp,
    vec3Cross,
    vec3Dot,
    PI,
    TWO_PI,
    HALF_PI,
    TAU,
    degrees,
    radians
  },
  color: {
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
    complementary,
    triadic,
    analogous,
    colors,
    toCssRgb,
    toCssRgba,
    toCssHsl,
    toCssHsla
  },
  animation: {
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInSine,
    easeOutSine,
    easeInOutSine,
    easeInExpo,
    easeOutExpo,
    easeInOutExpo,
    easeInCirc,
    easeOutCirc,
    easeInOutCirc,
    easeInBack,
    easeOutBack,
    easeInOutBack,
    easeInElastic,
    easeOutElastic,
    easeInOutElastic,
    easeInBounce,
    easeOutBounce,
    easeInOutBounce,
    easings,
    AnimationLoop,
    Tween,
    tween,
    animate,
    Spring,
    spring,
    delay
  },
  random: {
    SeededRandom,
    SimpleNoise,
    FractalNoise,
    PerlinNoise,
    random,
    noise,
    fractalNoise,
    randomInt,
    randomFloat,
    randomBool,
    randomChoice,
    randomSign,
    randomAngle,
    randomInCircle,
    randomOnCircle,
    randomGaussian,
    setSeed,
    weightedChoice,
    shuffle,
    randomColor,
    randomColorHSL,
    randomDistribution,
    randomWalk,
    sample,
    sampleWeighted
  },
  geometry: {
    point,
    pointDistance,
    pointDistanceSq,
    pointLerp,
    pointAngle,
    size,
    sizeArea,
    sizePerimeter,
    sizeAspectRatio,
    sizeScale,
    sizeFit,
    sizeFill,
    rect,
    rectFromPoints,
    rectFromCenter,
    rectCenter,
    rectArea,
    rectPerimeter,
    rectExpand,
    rectScale,
    rectUnion,
    rectIntersection,
    circle,
    circleCenter,
    circleArea,
    circleCircumference,
    circlePointAt,
    pointInRect,
    pointInCircle,
    rectIntersects,
    circleIntersects,
    circleRectIntersects,
    line,
    lineLength,
    lineAngle,
    linePointAt,
    lineNormal,
    lineDirection,
    lineDistanceToPoint,
    lineIntersection,
    polygon,
    polygonArea,
    polygonCentroid,
    polygonPerimeter,
    pointInPolygon,
    polygonBoundingBox,
    regularPolygon,
    quadraticBezier,
    cubicBezier,
    gridPoints,
    hexGrid,
    triangle,
    square,
    pentagon,
    hexagon,
    octagon,
    star
  },
  physics: {
    Particle,
    ParticleSystem,
    VerletParticle,
    VerletConstraint,
    Cloth,
    gravity,
    friction,
    drag,
    attraction,
    repulsion,
    springForce,
    createOrbit,
    createExplosion
  },
  fractals: {
    LSystem,
    Turtle,
    LSystemInterpreter,
    lSystems,
    mandelbrot,
    mandelbrotSet,
    julia,
    juliaSet,
    sierpinskiTriangle,
    barnsleyFern,
    kochSnowflake,
    createKochSnowflake,
    fractalTree
  },
  Play,
  play,
  setup,
  version,
  info
};
export {
  wrap,
  weightedChoice,
  version,
  vec3Sub,
  vec3Normalize,
  vec3Mul,
  vec3Lerp,
  vec3LengthSq,
  vec3Length,
  vec3Dot,
  vec3Div,
  vec3Distance,
  vec3Cross,
  vec3Add,
  vec3,
  vec2Sub,
  vec2Rotate,
  vec2Normalize,
  vec2Mul,
  vec2Lerp,
  vec2LengthSq,
  vec2Length,
  vec2FromAngle,
  vec2Dot,
  vec2Div,
  vec2Distance,
  vec2Angle,
  vec2Add,
  vec2,
  tween,
  trunc,
  triangle,
  triadic,
  toCssRgba,
  toCssRgb,
  toCssHsla,
  toCssHsl,
  tetradic,
  tanh,
  tan,
  star,
  square,
  sqrt,
  springForce,
  spring,
  splitComplementary,
  smoothstep,
  smootherstep,
  sizeScale,
  sizePerimeter,
  sizeFit,
  sizeFill,
  sizeAspectRatio,
  sizeArea,
  size,
  sinh,
  sin,
  sign,
  sierpinskiTriangle,
  shuffle,
  setup,
  setSeed,
  saturate,
  sampleWeighted,
  sample,
  round,
  rgba,
  rgbToHsl,
  rgbToHex,
  rgb,
  repulsion,
  regularPolygon,
  rectUnion,
  rectTopRight,
  rectTopLeft,
  rectScale,
  rectPerimeter,
  rectIntersects,
  rectIntersection,
  rectFromPoints,
  rectFromCenter,
  rectExpand,
  rectCenter,
  rectBottomRight,
  rectBottomLeft,
  rectArea,
  rect,
  randomWalk,
  randomSign,
  randomOnCircle,
  randomInt,
  randomInCircle,
  randomGaussian,
  randomFloat,
  randomDistribution,
  randomColorHSL,
  randomColor,
  randomChoice,
  randomBool,
  randomAngle,
  random,
  radians,
  quadraticBezier,
  pow,
  polygonPerimeter,
  polygonCentroid,
  polygonBoundingBox,
  polygonArea,
  polygon,
  pointLerp,
  pointInRect,
  pointInPolygon,
  pointInCircle,
  pointDistanceSq,
  pointDistance,
  pointAngle,
  point,
  play,
  pentagon,
  octagon,
  normalize,
  noise,
  min,
  max,
  mat3TransformVec2,
  mat3Multiply,
  mat3Identity,
  mat3FromValues,
  map,
  mandelbrotSet,
  mandelbrot,
  log2,
  log10,
  log,
  linear,
  linePointAt,
  lineNormal,
  lineLength,
  lineIntersection,
  lineDistanceToPoint,
  lineDirection,
  lineAngle,
  line,
  lerp,
  lSystems,
  kochSnowflake,
  juliaSet,
  julia,
  invert,
  info,
  hueShift,
  hsla,
  hslToRgb,
  hsl,
  hexagon,
  hexToRgb,
  hexGrid,
  gridPoints,
  grayscale,
  gravity,
  friction,
  fractalTree,
  fractalNoise,
  fract,
  floor,
  exp,
  easings,
  easeOutSine,
  easeOutQuint,
  easeOutQuart,
  easeOutQuad,
  easeOutExpo,
  easeOutElastic,
  easeOutCubic,
  easeOutCirc,
  easeOutBounce,
  easeOutBack,
  easeInSine,
  easeInQuint,
  easeInQuart,
  easeInQuad,
  easeInOutSine,
  easeInOutQuint,
  easeInOutQuart,
  easeInOutQuad,
  easeInOutExpo,
  easeInOutElastic,
  easeInOutCubic,
  easeInOutCirc,
  easeInOutBounce,
  easeInOutBack,
  easeInExpo,
  easeInElastic,
  easeInCubic,
  easeInCirc,
  easeInBounce,
  easeInBack,
  drag,
  desaturate,
  delay,
  degrees,
  src_default as default,
  darken,
  cubicBezier,
  createOrbit,
  createKochSnowflake,
  createExplosion,
  createAnimationFrame,
  cosh,
  cos,
  contrast,
  complementary,
  colors,
  colorSimilarity,
  colorLerpHsl,
  colorLerp,
  colorDistance,
  clamp,
  circleRectIntersects,
  circlePointAt,
  circleIntersects,
  circleFromPoints,
  circleExpandToPoint,
  circleCircumference,
  circleCenter,
  circleArea,
  circle,
  ceil,
  brighten,
  barnsleyFern,
  attraction,
  atan2,
  atan,
  asin,
  animate,
  analogous,
  acos,
  abs,
  VerletParticle,
  VerletConstraint,
  Tween,
  Turtle,
  TWO_PI,
  TAU,
  Spring,
  SimpleNoise,
  SeededRandom,
  QUARTER_PI,
  Play,
  PerlinNoise,
  ParticleSystem,
  Particle,
  PI,
  PHI,
  LSystemInterpreter,
  LSystem,
  HALF_PI,
  FractalNoise,
  E,
  Cloth,
  AnimationLoop
};
