import test from "node:test";
import assert from "node:assert/strict";
import { COURSES, generateProblem, answerValue } from "../exercises.js";
import { fraction, fractionText, fractionValue, seededRandom, GRAPHS, graphPoint, graphIntegral, SPECIAL_ANGLES, unitCircle, pretty, dot } from "../math.js";
import { distanceToSegment, segmentDistance, segmentHitsRect, STAMPS } from "../scratch.js";
import { problemMath, RULE_MATH, STAMP_TEX, fracTex, exactValueTex } from "../math-content.js";

function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} should equal ${expected}`);
}
const derivative = (f, x) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
function integrate(f, left, right, n = 400) {
  const h = (right - left) / n;
  let sum = f(left) + f(right);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(left + i * h);
  return sum * h / 3;
}

function checkMath(problem) {
  const formatted = problemMath(problem);
  assert.equal(new Set(formatted.choices).size, 4, "typeset choices must also remain distinct");
  assert.equal(formatted.worked.length, problem.steps.length);
  for (const tex of [formatted.expression, ...formatted.choices, ...formatted.worked.flatMap(step => step.tex)]) {
    assert.equal(typeof tex, "string");
    assert.doesNotMatch(tex, /undefined|NaN/);
    assert.ok(tex.length > 0);
  }
  for (const rule of [...problem.rules, ...problem.tips]) {
    assert.ok(RULE_MATH[rule.name]?.tex.length, `Missing formatted reference: ${rule.name}`);
  }
  const v = problem.parameters, answer = answerValue(problem);
  const { a, b, c, n, x, y, z } = v;
  switch (problem.family) {
    case "power":
      for (const at of [-1.2, 0.5, 2]) close(answer.coefficient * at ** answer.exponent, derivative(x => a * x ** n, at));
      assert.equal(answer.coefficient, a * n); assert.equal(answer.exponent, n - 1);
      break;
    case "difference":
    case "continuity":
      close(answer, ((a + 0.001) ** 2 - a ** 2) / 0.001, 0.001);
      assert.equal(answer, 2 * a);
      break;
    case "chain":
      for (const at of [-0.31, 0.25, 1.1]) close(answer.coefficient * (a * at + b) ** answer.exponent, derivative(t => (a * t + b) ** n, at));
      assert.equal(answer.exponent, n - 1); assert.equal(answer.coefficient, a * n);
      break;
    case "minimum":
      close(derivative(t => a * t * t - 2 * a * v.h * t + c, answer), 0);
      for (const delta of [-10, -1, 1, 10]) assert.ok(a * (answer + delta) ** 2 - 2 * a * v.h * (answer + delta) + c > a * answer ** 2 - 2 * a * v.h * answer + c);
      break;
    case "power-integral": close(answer, integrate(x => a * x ** n, 0, b)); break;
    case "antiderivative":
      assert.equal(answer.constant, true);
      for (const at of [-1.2, 0.3, 2]) close(derivative(x => fractionValue(answer.coefficient) * x ** answer.exponent, at), a * at ** n);
      break;
    case "sine": close(answer, derivative(x => a * Math.sin(b * x), 0)); break;
    case "exponential": close(answer, derivative(x => a * Math.exp(b * x), 0)); break;
    case "substitution":
      for (const at of [-1.2, 0.3, 2]) close(derivative(x => fractionValue(answer.coefficient) * (x * x + a) ** answer.exponent, at), 2 * at * (at * at + a) ** n);
      break;
    case "parts":
      for (const at of [-1.2, 0.3, 2]) close(derivative(x => (answer.linear * x + answer.constant) * Math.exp(x), at), a * at * Math.exp(at));
      break;
    case "improper-diverges": assert.equal(answer.divergent, true); assert.match(problem.steps.join(" "), /ln\(R\)/); break;
    case "improper-converges": {
      // x = 1/u maps the infinite tail to a finite polynomial integral.
      close(answer, integrate(u => u ** (v.exponent - 2), 0, 1 / v.lower)); break;
    }
    case "geometric": {
      let sum = 0;
      for (let n = 0; n < 150; n++) sum += a * (v.sign / v.denominator) ** n;
      close(answer, sum); break;
    }
    case "radius": {
      const ratioInside = (answer * 0.99 / v.radius) * (10000 / 10001);
      const ratioOutside = (answer * 1.01 / v.radius) * (10000 / 10001);
      assert.ok(ratioInside < 1 && ratioOutside > 1); assert.equal(answer, v.radius); break;
    }
    case "parametric": close(answer, derivative(t => b * t ** 3, v.at) / derivative(t => a * t ** 2, v.at)); break;
    case "polar": close(answer * Math.PI, integrate(() => v.radius ** 2 / 2, 0, Math.PI / v.divisor)); break;
    case "dot": assert.equal(answer, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]); break;
    case "cross":
      assert.deepEqual(answer, [a[1] * b[2] - b[1] * a[2], b[0] * a[2] - a[0] * b[2], a[0] * b[1] - b[0] * a[1]]);
      assert.equal(dot(a, answer), 0); assert.equal(dot(b, answer), 0); break;
    case "partial":
      close(answer, v.variable === "x" ? derivative(t => a * t * t * y + b * t * y * y, x) : derivative(t => a * x * x * t + b * x * t * t, y));
      break;
    case "directional": {
      const length = Math.hypot(...v.v);
      close(answer, derivative(t => a * (x + t * v.v[0] / length) ** 2 + b * (y + t * v.v[1] / length) ** 2, 0)); break;
    }
    case "double": close(answer, integrate(x => integrate(y => c * x * y, 0, b, 8), 0, a, 8)); break;
    case "triple": close(answer, a * b * integrate(z => v.k * z, 0, c, 8)); break;
    case "divergence": close(answer, derivative(t => a * t * t, x) + derivative(t => b * t * t, y) + derivative(t => c * t * t, z)); break;
    case "curl": assert.deepEqual(answer, [c, a, b]); break;
    default: assert.fail(`Untested family ${problem.family}`);
  }
}

test("Typeset fractions, radicals, signs and constant-of-integration choices retain exact meaning", () => {
  assert.equal(fracTex(0, 5), "0");
  assert.equal(fracTex(-6, 8), "-\\frac{3}{4}");
  assert.equal(fracTex(6, -3), "-2");
  assert.equal(exactValueTex("−√3/3"), "-\\frac{\\sqrt{3}}{3}");
  assert.equal(exactValueTex("11π/6"), "\\frac{11\\pi}{6}");
  assert.equal(exactValueTex("undefined"), "\\text{undefined}");
  assert.throws(() => exactValueTex("\\input{remote}"), /Unsupported exact/);
  for (const angle of SPECIAL_ANGLES) for (const value of unitCircle(angle).exact) assert.ok(exactValueTex(value));
  assert.deepEqual(Object.keys(STAMP_TEX).sort(), Object.keys(STAMPS).sort());
  for (let seed = 1; seed <= 100; seed++) {
    const problem = generateProblem("1", "antiderivatives", seededRandom(seed));
    const content = problemMath(problem);
    problem.choices.forEach((choice, index) => assert.equal(content.choices[index].endsWith("+C"), choice.model.constant));
    for (const topic of ["power-rule", "limits", "definite"]) {
      const example = generateProblem("1", topic, seededRandom(seed));
      const math = problemMath(example);
      example.choices.forEach((choice, index) => {
        if (choice.value) assert.equal(math.choices[index], fracTex(choice.value));
      });
    }
  }
});

function symbolicEquivalent(choice, correct, problem) {
  const model = choice.model, answer = correct.model;
  if (!model) return false;
  if (Array.isArray(model)) return JSON.stringify(model) === JSON.stringify(answer);
  if (problem.family === "antiderivative") return model.constant === true && model.exponent === answer.exponent && fractionValue(model.coefficient) === fractionValue(answer.coefficient);
  if (["power", "chain", "substitution"].includes(problem.family)) return model.exponent === answer.exponent && (typeof model.coefficient === "number" ? model.coefficient : fractionValue(model.coefficient)) === (typeof answer.coefficient === "number" ? answer.coefficient : fractionValue(answer.coefficient));
  if (problem.family === "parts") return model.linear === answer.linear && model.constant === answer.constant;
  return model.divergent === answer.divergent;
}

for (const course of COURSES) {
  for (const [topic, label] of course.topics) {
    test(`${course.name}: ${label} — 1,000 deterministic instances`, () => {
      const expressions = new Set();
      for (let seed = 0; seed < 1000; seed++) {
        const problem = generateProblem(course.id, topic, seededRandom(seed));
        assert.equal(problem.course, course.id); assert.equal(problem.topic, topic);
        assert.equal(problem.choices.length, 4);
        assert.equal(new Set(problem.choices.map(c => c.text)).size, 4, `duplicate label seed ${seed}`);
        assert.equal(problem.choices.filter(c => c.correct).length, 1);
        assert.ok(problem.choices[problem.answer].correct);
        assert.ok(problem.steps.length >= 3);
        assert.ok(problem.rules.length > 0);
        assert.equal(new Set(problem.rules.map(rule => rule.name)).size, problem.rules.length);
        assert.ok(problem.rules.every(rule => rule.name.length > 5 && rule.statement.length > 40));
        assert.ok(problem.choices.every(c => c.reason?.length > 10));
        assert.doesNotMatch(JSON.stringify(problem), /NaN|Infinity/);
        const checkFinite = value => {
          if (typeof value === "number") assert.ok(Number.isFinite(value));
          else if (value && typeof value === "object") Object.values(value).forEach(checkFinite);
        };
        checkFinite(problem);
        const correct = problem.choices[problem.answer];
        for (const choice of problem.choices.filter(c => !c.correct)) {
          if (correct.value) assert.notEqual(fractionValue(choice.value), fractionValue(correct.value), `equivalent distractor seed ${seed}`);
          else assert.equal(symbolicEquivalent(choice, correct, problem), false, `equivalent symbolic distractor seed ${seed}`);
        }
        expressions.add(problem.expression);
        checkMath(problem);
      }
      assert.ok(expressions.size >= 5, `${label} needs varied instances`);
    });
  }
}

test("All branches and all mixed-course topics are reachable; invalid selections fail explicitly", () => {
  const families = new Set();
  for (const course of COURSES) {
    const topics = new Set();
    for (let seed = 0; seed < 5000; seed++) {
      const problem = generateProblem(course.id, "mixed", seededRandom(seed));
      topics.add(problem.topic); families.add(problem.family);
    }
    assert.deepEqual([...topics].sort(), course.topics.map(([id]) => id).sort());
  }
  for (const family of ["difference", "continuity", "sine", "exponential", "improper-converges", "improper-diverges", "dot", "cross"]) assert.ok(families.has(family));
  assert.throws(() => generateProblem("4", "mixed"), RangeError);
  assert.throws(() => generateProblem("1", "curl"), RangeError);
  assert.throws(() => generateProblem("1", "nonexistent"), RangeError);
});

test("Every exercise family names its applicable rule, with important conditions retained", () => {
  const expected = {
    difference: "Difference of squares & limit laws",
    continuity: "Continuity at a point",
    power: "Power, sum & constant-multiple rules",
    chain: "Chain rule",
    minimum: "Fermat’s theorem & the second-derivative test",
    "power-integral": "Fundamental Theorem of Calculus",
    antiderivative: "Power rule for integration",
    sine: "Derivative of sine",
    exponential: "Exponential derivative & antiderivative",
    substitution: "Substitution rule (reverse chain rule)",
    parts: "Integration by parts (reverse product rule)",
    "improper-diverges": "Logarithmic antiderivative",
    "improper-converges": "Improper integral as a limit & the p-integral test",
    geometric: "Infinite geometric series formula",
    radius: "Ratio test & radius of convergence",
    parametric: "Parametric derivative rule",
    polar: "Polar area formula",
    dot: "Dot-product formula",
    cross: "Cross-product formula & right-hand rule",
    partial: "Partial differentiation",
    directional: "Gradient formula for directional derivatives",
    double: "Fubini’s theorem",
    triple: "Mass from a density function",
    divergence: "Divergence definition",
    curl: "Curl definition"
  };
  const seen = new Set(), statements = new Map();
  for (const course of COURSES) for (const [topic] of course.topics) for (let seed = 0; seed < 100; seed++) {
    const problem = generateProblem(course.id, topic, seededRandom(seed));
    assert.ok(problem.rules.some(rule => rule.name === expected[problem.family]), `Wrong rules for ${problem.family}`);
    seen.add(problem.family);
    for (const rule of problem.rules) statements.set(rule.name, rule.statement);
    if (problem.family === "sine") assert.ok(!problem.rules.some(rule => rule.name.includes("Exponential")));
    if (problem.family === "exponential") assert.ok(!problem.rules.some(rule => rule.name.includes("sine")));
  }
  assert.deepEqual([...seen].sort(), Object.keys(expected).sort());
  assert.match(statements.get(expected.antiderivative), /n ≠ −1/);
  assert.match(statements.get(expected.antiderivative), /\+ C/);
  assert.match(statements.get(expected["power-integral"]), /continuous on \[a, b\]/);
  assert.match(statements.get(expected.minimum), /local minimum.*quadratic.*absolute minimum/);
  assert.match(statements.get(expected.geometric), /\|r\| < 1/);
  assert.match(statements.get(expected.radius), /L = 1 is inconclusive/);
  assert.match(statements.get(expected.radius), /endpoints separately/);
  assert.match(statements.get(expected.parametric), /dx\/dt ≠ 0/);
  assert.match(statements.get(expected.directional), /unit vector.*nonzero direction/);
  assert.match(statements.get(expected["improper-converges"]), /a > 0.*p > 1/);
  assert.match(statements.get(expected.polar), /tracing the region once.*radians/);
  assert.match(statements.get(expected.double), /continuous function.*rectangle or box/);
});

test("Power-rule-only practice covers all 126 monomials without composite functions", () => {
  for (const sign of [-1, 1]) for (let coefficient = 1; coefficient <= 9; coefficient++) for (let exponent = 2; exponent <= 8; exponent++) {
    const draws = [sign < 0 ? 0 : 0.75, (coefficient - 0.5) / 9, (exponent - 1.5) / 7];
    let index = 0;
    const problem = generateProblem("1", "power-rule", () => draws[index++] ?? 0.5);
    assert.deepEqual(problem.parameters, { a: sign * coefficient, n: exponent });
    assert.equal(problem.family, "power");
    assert.equal(problem.rules.length, 1);
    assert.doesNotMatch(problem.rules[0].name, /chain|product|quotient/i);
    assert.match(problem.expression, /^f\(x\) = [−-]?\d*x[²³⁴⁵⁶⁷⁸]$/);
    assert.equal(new Set(problem.choices.map(choice => JSON.stringify(choice.model))).size, 4);
    checkMath(problem);
  }
});

test("Tips are general rule references, invariant across parameter values and without worked steps", () => {
  const byFamily = new Map();
  for (const course of COURSES) for (const [topic] of course.topics) for (let seed = 0; seed < 100; seed++) {
    const problem = generateProblem(course.id, topic, seededRandom(seed));
    assert.ok(problem.tips.length > 0);
    for (const tip of problem.tips) {
      assert.deepEqual(Object.keys(tip).sort(), ["name", "statement"]);
      assert.ok(problem.rules.some(rule => rule.name === tip.name));
      assert.ok(tip.statement.length > 40);
      assert.ok(!problem.steps.includes(tip.statement));
      assert.doesNotMatch(tip.statement, /the answer is|therefore|this exercise|here the quadratic|ln\(R\) grows/i);
    }
    if (byFamily.has(problem.family)) assert.deepEqual(problem.tips, byFamily.get(problem.family));
    else byFamily.set(problem.family, problem.tips);
  }
  assert.equal(byFamily.size, 25);
  assert.match(byFamily.get("power")[0].statement, /nxⁿ⁻¹/);
  assert.match(byFamily.get("chain").map(tip => tip.statement).join(" "), /g′\(x\)/);
});

test("Common-rule stamps contain general formulas and their conditions", () => {
  for (const stamp of Object.values(STAMPS)) assert.ok(stamp.label && stamp.lines.every(line => line.length > 0));
  assert.match(STAMPS["rule-chain"].lines.join(" "), /f′\(g\(x\)\) · g′\(x\).*differentiable/);
  assert.match(STAMPS["rule-power"].lines.join(" "), /an xⁿ⁻¹.*n ≥ 1/);
  assert.match(STAMPS["rule-product"].lines.join(" "), /u′v \+ uv′/);
  assert.match(STAMPS["rule-quotient"].lines.join(" "), /u′v − uv′.*v ≠ 0/);
  assert.match(STAMPS["rule-integral"].lines.join(" "), /\+ C.*n ≠ −1/);
  assert.match(STAMPS["rule-parts"].lines.join(" "), /uv − ∫ v du/);
  assert.match(STAMPS["rule-ftc"].lines.join(" "), /F\(b\) − F\(a\).*continuous/);
  const box = { x: 10, y: 20, width: 400, height: 100 };
  assert.equal(segmentHitsRect({ x: 0, y: 60 }, { x: 500, y: 60 }, box, 0), true);
  assert.equal(segmentHitsRect({ x: 410, y: 80 }, { x: 410, y: 80 }, box, 0), true);
  assert.equal(segmentHitsRect({ x: 15, y: 18 }, { x: 15, y: 18 }, box, 3), true);
  assert.equal(segmentHitsRect({ x: 0, y: 0 }, { x: 500, y: 0 }, box, 3), false);
});

test("Cross-product distractors are distinct over the entire 3,072-input parameter space", () => {
  for (let ax = 1; ax <= 4; ax++) for (let ay = 1; ay <= 4; ay++) for (let az = 1; az <= 4; az++) {
    for (let bx = -3; bx <= -1; bx++) for (let by = 1; by <= 4; by++) for (let bz = 1; bz <= 4; bz++) {
      const draws = [(ax - 0.5) / 4, (ay - 0.5) / 4, (az - 0.5) / 4, (bx + 3.5) / 3, (by - 0.5) / 4, (bz - 0.5) / 4, 0.75];
      let index = 0;
      const problem = generateProblem("3", "vectors", () => draws[index++] ?? 0.5);
      assert.equal(problem.family, "cross");
      assert.deepEqual(problem.parameters, { a: [ax, ay, az], b: [bx, by, bz] });
      assert.equal(new Set(problem.choices.map(choice => JSON.stringify(choice.model))).size, 4);
      checkMath(problem);
    }
  }
});

test("Fractions normalize signs and zeros and reject invalid arithmetic", () => {
  assert.deepEqual(fraction(6, -8), { n: -3, d: 4 });
  assert.equal(fractionText(fraction(0, -8)), "0");
  assert.equal(fractionText(fraction(-6, -3)), "2");
  assert.throws(() => fraction(1, 0), RangeError);
  assert.throws(() => fraction(0.5, 3), RangeError);
  assert.equal(pretty(-0.00001), "0");
  assert.equal(pretty(null), "undefined");
});

test("Every graph's derivative and signed integral agree with independent finite methods", () => {
  for (const kind of Object.keys(GRAPHS)) {
    for (const a of [-3, -0.25, 0, 0.25, 3]) {
      for (const x of [0.4, 1.3, 2.1]) {
        const point = graphPoint(kind, a, x);
        close(point.slope, derivative(t => graphPoint(kind, a, t).y, x));
      }
      const expected = integrate(x => graphPoint(kind, a, x).y, 0.5, 2.4);
      close(graphIntegral(kind, a, 0.5, 2.4), expected);
      close(graphIntegral(kind, a, 2.4, 0.5), -expected);
      close(graphIntegral(kind, a, 1, 1), 0);
    }
  }
  assert.equal(graphPoint("logarithm", 1, 0), null);
  assert.equal(graphPoint("logarithm", 1, -1), null);
  assert.equal(graphPoint("reciprocal", 1, 0), null);
  for (const bounds of [[-1, 1], [1, -1], [0, 2], [-2, 0]]) assert.equal(graphIntegral("reciprocal", 1, ...bounds), null);
  assert.equal(graphIntegral("logarithm", 1, 0, 1), null);
  close(graphIntegral("reciprocal", 1, -2, -1), -Math.log(2));
  assert.equal(graphIntegral("sine", 1, NaN, 1), null);
  assert.equal(graphPoint("sine", NaN, 1), null);
  assert.throws(() => graphPoint("arbitrary expression", 1, 1), RangeError);
});

function exactNumber(text) {
  const parts = text.replaceAll("−", "-").split("/");
  const parse = token => {
    if (token.includes("√")) return (token.startsWith("-") ? -1 : 1) * Math.sqrt(Number(token.replace("-", "").replace("√", "")));
    if (token.includes("π")) return (token.replace("π", "") === "" ? 1 : Number(token.replace("π", ""))) * Math.PI;
    return Number(token);
  };
  return parse(parts[0]) / (parts.length > 1 ? parse(parts[1]) : 1);
}

test("Unit-circle exact labels and quadrants are correct at every special angle", () => {
  for (const angle of SPECIAL_ANGLES) {
    const result = unitCircle(angle);
    close(exactNumber(result.exact[0]), result.radians);
    close(exactNumber(result.exact[1]), result.x);
    close(exactNumber(result.exact[2]), result.y);
    close(result.x ** 2 + result.y ** 2, 1);
    if (angle === 90 || angle === 270) { assert.equal(result.tangent, null); assert.equal(result.exact[3], "undefined"); }
    else close(exactNumber(result.exact[3]), result.tangent);
  }
  assert.equal(unitCircle(37).exact, null);
  close(unitCircle(-90).y, -1);
  close(unitCircle(450).y, 1);
  assert.throws(() => unitCircle(NaN), RangeError);
});

test("Scratch eraser geometry handles segments, endpoints, and single-point marks", () => {
  close(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3);
  close(distanceToSegment({ x: 12, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 2);
  close(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
  close(segmentDistance({ x: 0, y: 5 }, { x: 10, y: 5 }, { x: 5, y: 0 }, { x: 5, y: 10 }), 0);
  close(segmentDistance({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 3 }, { x: 10, y: 3 }), 3);
  close(segmentDistance({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 0 }), 0);
});
