export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function fraction(n, d = 1) {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) {
    throw new RangeError("Fractions need safe integers and a nonzero denominator.");
  }
  const divisor = gcd(n, d) || 1;
  return { n: n / divisor * Math.sign(d), d: Math.abs(d) / divisor };
}

export function fractionText(value) {
  const { n, d } = typeof value === "number" ? fraction(value) : value;
  return d === 1 ? String(n) : `${n}/${d}`;
}

export function fractionValue(value) {
  return typeof value === "number" ? value : value.n / value.d;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function integer(random, low, high) {
  return low + Math.floor(random() * (high - low + 1));
}

export function choose(random, items) {
  return items[integer(random, 0, items.length - 1)];
}

export function shuffle(random, items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const superscripts = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const power = (base, exponent) => exponent === 1 ? base : exponent === 0 ? "1" : base + String(exponent).split("").map(c => superscripts[c]).join("");
export const term = (coefficient, variable) => coefficient === 1 ? variable : coefficient === -1 ? `−${variable}` : `${coefficient}${variable}`;
export const signed = number => number < 0 ? `− ${Math.abs(number)}` : `+ ${number}`;
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const GRAPHS = {
  quadratic: { label: "Quadratic · y = ax²", formula: "y = ax²", f: x => x * x, derivative: x => 2 * x, primitive: x => x ** 3 / 3, valid: () => true },
  cubic: { label: "Cubic · y = ax³", formula: "y = ax³", f: x => x ** 3, derivative: x => 3 * x * x, primitive: x => x ** 4 / 4, valid: () => true },
  sine: { label: "Sine · y = a sin(x)", formula: "y = a sin(x)", f: Math.sin, derivative: Math.cos, primitive: x => -Math.cos(x), valid: () => true },
  cosine: { label: "Cosine · y = a cos(x)", formula: "y = a cos(x)", f: Math.cos, derivative: x => -Math.sin(x), primitive: Math.sin, valid: () => true },
  exponential: { label: "Exponential · y = a exp(x)", formula: "y = a exp(x)", f: Math.exp, derivative: Math.exp, primitive: Math.exp, valid: () => true },
  logarithm: { label: "Logarithm · y = a ln(x)", formula: "y = a ln(x)", f: Math.log, derivative: x => 1 / x, primitive: x => x * Math.log(x) - x, valid: x => x > 0 },
  reciprocal: { label: "Reciprocal · y = a/x", formula: "y = a/x", f: x => 1 / x, derivative: x => -1 / (x * x), primitive: x => Math.log(Math.abs(x)), valid: x => x !== 0 }
};

export function graphPoint(kind, a, x) {
  const graph = GRAPHS[kind];
  if (!graph) throw new RangeError("Unknown graph.");
  if (!Number.isFinite(a) || !Number.isFinite(x) || !graph.valid(x)) return null;
  return { y: a * graph.f(x), slope: a * graph.derivative(x) };
}

export function graphIntegral(kind, a, left, right) {
  const graph = GRAPHS[kind];
  if (!graph) throw new RangeError("Unknown graph.");
  if (![a, left, right].every(Number.isFinite)) return null;
  if (!graph.valid(left) || !graph.valid(right)) return null;
  if (kind === "reciprocal" && Math.min(left, right) <= 0 && Math.max(left, right) >= 0) return null;
  return a * (graph.primitive(right) - graph.primitive(left));
}

const circleValues = {
  0: ["0", "1", "0", "0"],
  30: ["π/6", "√3/2", "1/2", "√3/3"],
  45: ["π/4", "√2/2", "√2/2", "1"],
  60: ["π/3", "1/2", "√3/2", "√3"],
  90: ["π/2", "0", "1", "undefined"],
  120: ["2π/3", "−1/2", "√3/2", "−√3"],
  135: ["3π/4", "−√2/2", "√2/2", "−1"],
  150: ["5π/6", "−√3/2", "1/2", "−√3/3"],
  180: ["π", "−1", "0", "0"],
  210: ["7π/6", "−√3/2", "−1/2", "√3/3"],
  225: ["5π/4", "−√2/2", "−√2/2", "1"],
  240: ["4π/3", "−1/2", "−√3/2", "√3"],
  270: ["3π/2", "0", "−1", "undefined"],
  300: ["5π/3", "1/2", "−√3/2", "−√3"],
  315: ["7π/4", "√2/2", "−√2/2", "−1"],
  330: ["11π/6", "√3/2", "−1/2", "−√3/3"],
  360: ["2π", "1", "0", "0"]
};
export const SPECIAL_ANGLES = Object.keys(circleValues).map(Number);

export function unitCircle(degrees) {
  if (!Number.isFinite(degrees)) throw new RangeError("Angle must be finite.");
  const normalized = ((degrees % 360) + 360) % 360;
  const radians = degrees * Math.PI / 180;
  const x = Math.abs(Math.cos(radians)) < 1e-12 ? 0 : Math.cos(radians);
  const y = Math.abs(Math.sin(radians)) < 1e-12 ? 0 : Math.sin(radians);
  const exact = circleValues[degrees === 360 ? 360 : normalized] || null;
  return { radians, x, y, tangent: x === 0 ? null : y / x, exact };
}

export function pretty(value, places = 3) {
  if (value === null || !Number.isFinite(value)) return "undefined";
  const rounded = Number(value.toFixed(places));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
