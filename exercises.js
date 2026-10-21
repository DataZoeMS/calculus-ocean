import { fraction as F, fractionText as ft, fractionValue as fv, integer, choose, shuffle, power as p, term as t, signed, dot, cross } from "./math.js";

export const COURSES = [
  { id: "1", name: "Calculus I", subtitle: "Change & accumulation", topics: [
    ["limits", "Limits & continuity"], ["power-rule", "Power rule only"], ["derivatives", "Power & chain rules"], ["applications", "Optimization"],
    ["definite", "Definite integrals"], ["antiderivatives", "Antiderivatives"], ["transcendental", "Trig & exponential rates"]
  ] },
  { id: "2", name: "Calculus II", subtitle: "Techniques & infinite sums", topics: [
    ["substitution", "Substitution"], ["parts", "Integration by parts"], ["improper", "Improper integrals"],
    ["series", "Geometric series"], ["power-series", "Power-series radius"], ["parametric", "Parametric slopes"], ["polar", "Polar area"]
  ] },
  { id: "3", name: "Calculus III", subtitle: "Space & multivariable change", topics: [
    ["vectors", "Dot & cross products"], ["partials", "Partial derivatives"], ["directional", "Directional derivatives"],
    ["double", "Double integrals"], ["triple", "Triple integrals"], ["divergence", "Divergence"], ["curl", "Curl"]
  ] }
];

const RULES = {
  factoring: {
    name: "Difference of squares & limit laws",
    statement: "x² − a² = (x − a)(x + a). For x ≠ a, cancel x − a. Functions that agree near a, except possibly at a, have the same limit there."
  },
  continuity: {
    name: "Continuity at a point",
    statement: "A function is continuous at a when its finite limit as x → a equals its value at a. Polynomials are continuous, so their limits can be found by substitution. Fill a removable hole with that limit."
  },
  derivative: {
    name: "Power, sum & constant-multiple rules",
    statement: "For an integer n ≥ 1, d(xⁿ)/dx = nxⁿ⁻¹. Differentiate sums term by term and keep constant multipliers. The derivative of a constant is 0."
  },
  chain: {
    name: "Chain rule",
    statement: "For differentiable f and g, d[f(g(x))]/dx = f′(g(x)) · g′(x). Multiply the outer derivative by the inner derivative."
  },
  minimum: {
    name: "Fermat’s theorem & the second-derivative test",
    tip: "At a differentiable interior extremum, f′ = 0. Find candidate points, then examine f″ and the function’s behavior over its full domain to decide whether a minimum is local or absolute.",
    statement: "At an interior local extremum where f is differentiable, f′ = 0. If f′(c) = 0 and f″(c) > 0 for a twice continuously differentiable function, c is a local minimum. Here the quadratic opens upward everywhere, so its vertex is the unique absolute minimum."
  },
  integral: {
    name: "Power rule for integration",
    statement: "∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C for n ≠ −1, on an interval where the power is defined. Keep constant multipliers. C represents the full family of antiderivatives."
  },
  fundamental: {
    name: "Fundamental Theorem of Calculus",
    statement: "If f is continuous on [a, b] and F′ = f, then ∫ from a to b of f(x) dx = F(b) − F(a). Subtract the lower endpoint from the upper endpoint."
  },
  sine: {
    name: "Derivative of sine",
    tip: "d[sin(x)]/dx = cos(x) for angles in radians. For sin(g(x)), multiply by g′(x). Differentiate first, then evaluate at the requested point.",
    statement: "d[sin(x)]/dx = cos(x) when x is in radians; cos(0) = 1. For sin(g(x)), also apply the chain rule."
  },
  exponential: {
    name: "Exponential derivative & antiderivative",
    tip: "d[exp(x)]/dx = exp(x) and ∫ exp(x) dx = exp(x) + C. For a composed exponential, use the chain rule. Keep any constant multiplier.",
    statement: "d[exp(x)]/dx = exp(x), ∫ exp(x) dx = exp(x) + C, and exp(0) = 1. Here exp(x) means eˣ."
  },
  substitution: {
    name: "Substitution rule (reverse chain rule)",
    statement: "For continuous f and continuously differentiable g, set u = g(x), so du = g′(x) dx. Then ∫ f(g(x))g′(x) dx = ∫ f(u) du. Substitute g(x) back after integrating."
  },
  parts: {
    name: "Integration by parts (reverse product rule)",
    statement: "For continuously differentiable u and v, ∫ u dv = uv − ∫ v du. Choose u and dv so that the remaining integral is simpler; include + C for the general antiderivative."
  },
  improper: {
    name: "Improper integral as a limit & the p-integral test",
    statement: "For a > 0, ∫ from a to ∞ of x⁻ᵖ dx means the limit of the integral from a to R as R → ∞. It converges exactly when p > 1. A finite limit, not merely an integrand tending to zero, is required."
  },
  logarithm: {
    name: "Logarithmic antiderivative",
    tip: "∫ (1/x) dx = ln|x| + C on an interval excluding 0. Evaluate at finite bounds first, then examine the upper-endpoint limit to decide convergence.",
    statement: "∫ (1/x) dx = ln|x| + C on any interval excluding 0. For positive x this is ln(x) + C, and ln(R) grows without bound as R → ∞."
  },
  geometric: {
    name: "Infinite geometric series formula",
    statement: "For |r| < 1, Σ from n = 0 to ∞ of arⁿ = a/(1 − r). The n = 0 term is a; preserve the sign of r."
  },
  ratio: {
    name: "Ratio test & radius of convergence",
    tip: "For eventually nonzero terms, form L = lim |aₙ₊₁/aₙ|. L < 1 gives absolute convergence; L > 1 gives divergence; L = 1 is inconclusive. Solve the inequality in |x − c| to identify the radius. Endpoints need separate checks.",
    statement: "For eventually nonzero terms, let L = lim |aₙ₊₁/aₙ|. L < 1 gives absolute convergence; L > 1 gives divergence; L = 1 is inconclusive. Solve for |x − c| < R to find the radius, and check endpoints separately. At x = c in this exercise, every term is 0, so convergence is immediate."
  },
  parametric: {
    name: "Parametric derivative rule",
    statement: "For differentiable x(t) and y(t), dy/dx = (dy/dt)/(dx/dt) wherever dx/dt ≠ 0. Differentiate both coordinates with respect to t before dividing."
  },
  polar: {
    name: "Polar area formula",
    statement: "For a continuous nonnegative radius r(θ) tracing the region once over α ≤ θ ≤ β, area = (1/2) ∫ from α to β of [r(θ)]² dθ. Angles must be in radians."
  },
  dot: {
    name: "Dot-product formula",
    statement: "a · b = a₁b₁ + a₂b₂ + a₃b₃. Multiply matching coordinates and add; the result is a scalar."
  },
  cross: {
    name: "Cross-product formula & right-hand rule",
    statement: "a × b = ⟨a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁⟩. The result is perpendicular to both vectors. Order matters: b × a = −(a × b)."
  },
  partial: {
    name: "Partial differentiation",
    statement: "Differentiate with respect to the requested variable while holding all other independent variables constant. Apply the usual one-variable derivative rules."
  },
  directional: {
    name: "Gradient formula for directional derivatives",
    statement: "For differentiable f, Dᵤf = ∇f · u, where ∇f = ⟨∂f/∂x, ∂f/∂y⟩ and u is a unit vector. For a nonzero direction v, first set u = v/|v|."
  },
  fubini: {
    name: "Fubini’s theorem",
    tip: "For a continuous integrand on a closed rectangle or box, integrate one variable at a time, holding the others constant. Follow the order of the differentials and apply the matching bounds at each stage.",
    statement: "A continuous function on a closed rectangle or box can be integrated one variable at a time in either order (or any order in 3D). Hold the other variables constant during each integration. The polynomial integrands here meet this condition."
  },
  mass: {
    name: "Mass from a density function",
    statement: "For an integrable nonnegative density ρ over a solid E, mass = ∭ over E of ρ dV. Integrate the varying density rather than treating it as constant."
  },
  divergence: {
    name: "Divergence definition",
    statement: "For a differentiable vector field F = ⟨P, Q, R⟩, ∇ · F = ∂P/∂x + ∂Q/∂y + ∂R/∂z. Divergence is a scalar; pair each component with its matching coordinate."
  },
  curl: {
    name: "Curl definition",
    statement: "For a differentiable vector field F = ⟨P, Q, R⟩, ∇ × F = ⟨∂R/∂y − ∂Q/∂z, ∂P/∂z − ∂R/∂x, ∂Q/∂x − ∂P/∂y⟩. Curl is a vector; keep the cross-product order and signs."
  }
};

const SOLUTION_RULES = {
  difference: [RULES.factoring, RULES.continuity],
  continuity: [RULES.factoring, RULES.continuity],
  power: [RULES.derivative],
  chain: [RULES.derivative, RULES.chain],
  minimum: [RULES.derivative, RULES.minimum],
  "power-integral": [RULES.integral, RULES.fundamental],
  antiderivative: [RULES.integral],
  sine: [RULES.sine, RULES.chain, RULES.derivative],
  exponential: [RULES.exponential, RULES.chain, RULES.derivative],
  substitution: [RULES.substitution, RULES.integral],
  parts: [RULES.parts, RULES.exponential],
  "improper-diverges": [RULES.improper, RULES.logarithm, RULES.fundamental],
  "improper-converges": [RULES.improper, RULES.integral, RULES.fundamental],
  geometric: [RULES.geometric],
  radius: [RULES.ratio],
  parametric: [RULES.parametric, RULES.derivative],
  polar: [RULES.polar, RULES.fundamental],
  dot: [RULES.dot],
  cross: [RULES.cross],
  partial: [RULES.partial, RULES.derivative],
  directional: [RULES.directional, RULES.partial, RULES.derivative],
  double: [RULES.fubini, RULES.integral, RULES.fundamental],
  triple: [RULES.mass, RULES.fubini, RULES.integral, RULES.fundamental],
  divergence: [RULES.divergence, RULES.partial, RULES.derivative],
  curl: [RULES.curl, RULES.partial, RULES.derivative]
};

function numeric(correct, wrong) {
  const answer = typeof correct === "number" ? F(correct) : correct;
  const key = ft(answer);
  const choices = [{ text: key, value: answer, correct: true, reason: "That matches the worked solution." }];
  const seen = new Set([key]);
  const candidates = [...wrong];
  for (let i = 1; i <= 6; i++) {
    candidates.push([F(answer.n + i * answer.d, answer.d), "Recheck the arithmetic after applying the calculus rule."]);
    candidates.push([F(answer.n - i * answer.d, answer.d), "Recheck the arithmetic after applying the calculus rule."]);
  }
  for (const [value, reason] of candidates) {
    const normalized = typeof value === "number" ? F(value) : F(value.n, value.d);
    const text = ft(normalized);
    if (!seen.has(text)) {
      choices.push({ text, value: normalized, correct: false, reason });
      seen.add(text);
    }
    if (choices.length === 4) return choices;
  }
  throw new Error("Not enough distinct numeric choices.");
}

function symbolic(correct, wrong) {
  const choices = [{ ...correct, correct: true, reason: "That matches the worked solution." }, ...wrong.map(choice => ({ ...choice, correct: false }))];
  if (choices.length !== 4 || new Set(choices.map(choice => choice.text)).size !== 4) throw new Error("Symbolic choices must be distinct.");
  return choices;
}

const generators = {
  "power-rule"(random) {
    const a = choose(random, [-1, 1]) * integer(random, 1, 9), n = integer(random, 2, 8);
    const candidate = (coefficient, exponent, reason) => ({ text: t(coefficient, p("x", exponent)), model: { coefficient, exponent }, reason });
    return {
      family: "power", parameters: { a, n }, prompt: "Find f′(x) using the power rule.",
      expression: `f(x) = ${t(a, p("x", n))}`,
      note: "A single power of x with a constant coefficient. No chain, product, or quotient rule needed.",
      choices: symbolic(candidate(a * n, n - 1), [
        candidate(a, n - 1, "Multiply the coefficient by the original exponent as well as lowering the exponent."),
        candidate(a * n, n, "After multiplying by the exponent, subtract one from that exponent."),
        candidate(-a * n, n - 1, "Keep the sign of the constant coefficient when applying the power rule.")
      ]),
      steps: [`Use d(axⁿ)/dx = an xⁿ⁻¹, with a = ${a} and n = ${n}.`, `Multiply the coefficient: ${a} · ${n} = ${a * n}. Reduce the exponent: ${n} − 1 = ${n - 1}.`, `Therefore f′(x) = ${t(a * n, p("x", n - 1))}.`]
    };
  },
  limits(random) {
    const a = integer(random, 1, 8);
    const variant = choose(random, ["difference", "continuity"]);
    return {
      family: variant, parameters: { a },
      prompt: variant === "difference" ? "Evaluate the limit." : "What value should f(a) have to make this function continuous at a?",
      expression: variant === "difference" ? `lim as x → ${a} of (x² − ${a * a})/(x − ${a})` : `f(x) = (x² − ${a * a})/(x − ${a}), x ≠ ${a};  a = ${a}`,
      note: "The expression is undefined at the missing point; the limit can still exist.",
      choices: numeric(2 * a, [[a, "After cancellation, x + a still has two terms."], [0, "A zero numerator and denominator do not imply a zero limit."], [a * a, "Factor the difference of squares before substituting."], [3 * a, "Substitute into x + a, not into a different polynomial."]]),
      steps: [`Factor x² − ${a * a} = (x − ${a})(x + ${a}).`, `For x ≠ ${a}, cancel x − ${a}; the expression becomes x + ${a}.`, `As x → ${a}, x + ${a} → ${2 * a}.${variant === "continuity" ? ` Set f(${a}) = ${2 * a} to fill the hole.` : ""}`]
    };
  },
  derivatives(random) {
    const a = integer(random, 2, 5), b = integer(random, 1, 5), n = integer(random, 2, 5);
    const inner = `(${a}x + ${b})`;
    const candidate = (coefficient, exponent, reason) => ({ text: t(coefficient, p(inner, exponent)), model: { coefficient, exponent }, reason });
    return {
      family: "chain", parameters: { a, b, n }, prompt: "Find f′(x).", expression: `f(x) = ${p(inner, n)}`,
      note: "Differentiate the outer power and the inner linear function.",
      choices: symbolic(candidate(a * n, n - 1), [
        candidate(n, n - 1, "The chain rule also multiplies by the inner derivative a."),
        candidate(a * n, n, "The power rule reduces the exponent by one."),
        candidate(a * n, n + 1, "Differentiating lowers the exponent; it does not increase it.")
      ]),
      steps: [`Let u = ${a}x + ${b}; then du/dx = ${a}.`, `d(u${p("", n)})/dx = ${n}${p("u", n - 1)} · du/dx.`, `f′(x) = ${t(a * n, p(inner, n - 1))}.`]
    };
  },
  applications(random) {
    const a = integer(random, 1, 4), h = integer(random, 1, 6), c = integer(random, 1, 9);
    return {
      family: "minimum", parameters: { a, h, c }, prompt: "At which x does f attain its absolute minimum over all real numbers?",
      expression: `f(x) = ${t(a, "x²")} − ${2 * a * h}x + ${c}`,
      choices: numeric(h, [[-h, "Solve 2ax − 2ah = 0 with the correct sign."], [2 * h, "Divide the linear coefficient by 2a, not a."], [c, "The constant shifts the height, not the minimizing x."], [0, "The derivative is not zero at x = 0."]]),
      steps: [`f′(x) = ${2 * a}x − ${2 * a * h}.`, `Set f′(x) = 0: x = ${2 * a * h}/${2 * a} = ${h}.`, `f″(x) = ${2 * a} > 0, and the quadratic opens upward. This critical point is the unique absolute minimum.`]
    };
  },
  definite(random) {
    const a = integer(random, 1, 5), n = integer(random, 1, 4), b = integer(random, 1, 3);
    const answer = F(a * b ** (n + 1), n + 1);
    return {
      family: "power-integral", parameters: { a, n, b }, prompt: "Evaluate the definite integral.",
      expression: `∫ from 0 to ${b} of ${t(a, p("x", n))} dx`,
      choices: numeric(answer, [[a * b ** n, "This is the integrand at the upper limit, not the accumulated integral."], [a * b ** (n + 1), "Divide by the new exponent when integrating."], [F(a * b ** (n + 1), n), "The new exponent is n + 1, not n."]]),
      steps: [`An antiderivative is (${ft(F(a, n + 1))})${p("x", n + 1)}.`, `By the Fundamental Theorem of Calculus, evaluate F(${b}) − F(0).`, `The integral equals (${a}/${n + 1}) · ${p(String(b), n + 1)} = ${ft(answer)}.`]
    };
  },
  antiderivatives(random) {
    const a = integer(random, 2, 6), n = integer(random, 2, 5);
    const candidate = (coefficient, exponent, constant, reason) => ({ text: `(${ft(coefficient)})${p("x", exponent)}${constant ? " + C" : ""}`, model: { coefficient, exponent, constant }, reason });
    return {
      family: "antiderivative", parameters: { a, n }, prompt: "Find the general antiderivative over the real numbers.",
      expression: `∫ ${t(a, p("x", n))} dx`,
      note: "C denotes an arbitrary real constant.",
      choices: symbolic(candidate(F(a, n + 1), n + 1, true), [
        candidate(F(a * n), n - 1, true, "That is differentiation; integration increases the exponent."),
        candidate(F(a, n + 1), n + 1, false, "This is one antiderivative, not the general family. Include + C."),
        candidate(F(a), n + 1, true, "Divide by the new exponent to undo differentiation.")
      ]),
      steps: [`Use ∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C for n ≠ −1.`, `Increase ${n} to ${n + 1}, and divide the coefficient by ${n + 1}.`, `The general answer is (${ft(F(a, n + 1))})${p("x", n + 1)} + C. Differentiating recovers ${t(a, p("x", n))}.`]
    };
  },
  transcendental(random) {
    const a = integer(random, 2, 6), b = integer(random, 2, 5);
    const variant = choose(random, ["sine", "exponential"]);
    return {
      family: variant, parameters: { a, b }, prompt: "Find the instantaneous rate f′(0).",
      expression: variant === "sine" ? `f(x) = ${a} sin(${b}x)` : `f(x) = ${a} exp(${b}x)`,
      note: "Angles are in radians. exp(u) means e raised to the power u.",
      choices: numeric(a * b, [[a, "Multiply by the derivative of the inner function bx."], [0, variant === "sine" ? "Differentiate sine into cosine before substituting." : "exp(0) = 1, not 0."], [-a * b, "The derivative here has a positive sign."], [b, "Keep the original constant multiplier a."]]),
      steps: [variant === "sine" ? `f′(x) = ${a * b} cos(${b}x) by the chain rule.` : `f′(x) = ${a * b} exp(${b}x) by the chain rule.`, variant === "sine" ? "cos(0) = 1." : "exp(0) = 1.", `Thus f′(0) = ${a * b}.`]
    };
  },
  substitution(random) {
    const a = integer(random, 1, 4), n = integer(random, 2, 4);
    const inner = `(x² + ${a})`;
    const candidate = (coefficient, exponent, reason) => ({ text: `(${ft(coefficient)})${p(inner, exponent)} + C`, model: { coefficient, exponent }, reason });
    return {
      family: "substitution", parameters: { a, n }, prompt: "Find the general antiderivative.", expression: `∫ 2x${p(inner, n)} dx`,
      note: "C is any real constant; the formula is valid for all real x.",
      choices: symbolic(candidate(F(1, n + 1), n + 1), [
        candidate(F(1, 2 * (n + 1)), n + 1, "The factor 2x dx is already exactly du; do not divide by two again."),
        candidate(F(1), n + 1, "The power rule requires division by the new exponent."),
        candidate(F(1, n), n, "Integrating uⁿ increases its exponent.")
      ]),
      steps: [`Set u = x² + ${a}; du = 2x dx.`, `The integral becomes ∫ ${p("u", n)} du = ${p("u", n + 1)}/${n + 1} + C.`, `Substitute back: (1/${n + 1})${p(inner, n + 1)} + C.`]
    };
  },
  parts(random) {
    const a = integer(random, 2, 6);
    const candidate = (linear, constant, reason) => ({ text: `(${t(linear, "x")} ${signed(constant)}) exp(x) + C`, model: { linear, constant }, reason });
    return {
      family: "parts", parameters: { a }, prompt: "Find the general antiderivative.", expression: `∫ ${a}x exp(x) dx`,
      note: "exp(x) = eˣ, and C is an arbitrary real constant.",
      choices: symbolic(candidate(a, -a), [
        candidate(a, a, "Integration by parts subtracts ∫ v du."),
        candidate(a, 0, "Differentiating x exp(x) produces an extra exp(x) term."),
        candidate(1, -1, "Do not lose the constant multiplier.")
      ]),
      steps: [`Choose u = ${a}x and dv = exp(x) dx. Then du = ${a} dx and v = exp(x).`, `Use ∫ u dv = uv − ∫ v du.`, `The answer is ${a}x exp(x) − ${a} exp(x) + C = (${a}x − ${a}) exp(x) + C.`]
    };
  },
  improper(random) {
    const exponent = integer(random, 2, 5), lower = integer(random, 1, 3);
    const converges = choose(random, [true, false]);
    if (!converges) {
      return {
        family: "improper-diverges", parameters: { lower },
        prompt: "Does the improper integral converge? If so, to what value?", expression: `∫ from ${lower} to ∞ of 1/x dx`,
        note: "A shrinking integrand alone does not guarantee finite area.",
        choices: symbolic({ text: "Diverges to +∞", model: { divergent: true } }, [
          { text: "Converges to 0", reason: "The limit of the integrand is not the value of the integral." },
          { text: `Converges to ${ft(F(1, lower))}`, reason: "The p-integral rule for p > 1 cannot be applied at p = 1." },
          { text: `Converges to ${lower + 1}`, reason: "Use an upper-limit limit, not a finite endpoint substitution." }
        ]),
        steps: [`Replace ∞ by R: ∫ from ${lower} to R of 1/x dx = ln(R) − ln(${lower}).`, "As R → ∞, ln(R) grows without bound.", "Therefore the improper integral diverges to +∞."]
      };
    }
    const answer = F(1, (exponent - 1) * lower ** (exponent - 1));
    return {
      family: "improper-converges", parameters: { exponent, lower }, prompt: "Evaluate the convergent improper integral.",
      expression: `∫ from ${lower} to ∞ of 1/${p("x", exponent)} dx`,
      choices: numeric(answer, [[0, "The antiderivative at infinity tends to zero, but subtract the lower endpoint too."], [F(-answer.n, answer.d), "Upper minus lower gives a positive integral here."], [F(1, exponent * lower ** exponent), "Integrating a negative power changes the exponent by +1, not −1."]]),
      steps: [`Here p = ${exponent} > 1, so this p-integral converges.`, `An antiderivative is −1/((${exponent - 1})${p("x", exponent - 1)}).`, `Its limit at ∞ is 0. Subtract its value at ${lower}: 0 − (−${ft(answer)}) = ${ft(answer)}.`]
    };
  },
  series(random) {
    const a = integer(random, 1, 6), denominator = integer(random, 2, 5), sign = choose(random, [-1, 1]);
    const ratio = F(sign, denominator), answer = F(a * denominator, denominator - sign);
    return {
      family: "geometric", parameters: { a, denominator, sign }, prompt: "Find the sum of the infinite geometric series.",
      expression: `Σ from n = 0 to ∞ of ${a}(${ft(ratio)})ⁿ`,
      note: "The first term is at n = 0.",
      choices: numeric(answer, [[F(a * sign, denominator - sign), "Starting at n = 1 would omit the n = 0 term."], [F(a * denominator, denominator + sign), "The denominator is 1 − r; preserve the sign of r."], [a, "The first term alone is not the whole series."], [a * denominator, "Use a/(1 − r), not a divided by |r|."]]),
      steps: [`The first term is a = ${a}; the common ratio is r = ${ft(ratio)}.`, `Since |r| = 1/${denominator} < 1, the geometric series converges.`, `Its sum is a/(1 − r) = ${a}/(1 − (${ft(ratio)})) = ${ft(answer)}.`]
    };
  },
  "power-series"(random) {
    const radius = integer(random, 2, 7), center = integer(random, 1, 5);
    return {
      family: "radius", parameters: { radius, center }, prompt: "What is the radius of convergence R?",
      expression: `Σ from n = 1 to ∞ of (x − ${center})ⁿ/(n · ${radius}ⁿ)`,
      note: "Only the radius is requested; this is not a claim about endpoint convergence.",
      choices: numeric(radius, [[F(1, radius), "Solve |x − c|/R < 1 for |x − c|."], [center, "The center and the radius are different quantities."], [radius * radius, "The ratio test cancels all but one factor of the base."], [radius + center, "c + R is an endpoint, not the radius."]]),
      steps: [`For consecutive absolute terms, the ratio tends to |x − ${center}|/${radius} because n/(n + 1) → 1.`, `The ratio test gives convergence when |x − ${center}| < ${radius}.`, `Therefore the radius is R = ${radius}; endpoint behavior requires a separate test.`]
    };
  },
  parametric(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), at = integer(random, 1, 3);
    const answer = F(3 * b * at, 2 * a);
    return {
      family: "parametric", parameters: { a, b, at }, prompt: `Find dy/dx at t = ${at}.`,
      expression: `x(t) = ${t(a, "t²")},   y(t) = ${t(b, "t³")}`,
      note: "The chosen t is positive, so dx/dt ≠ 0.",
      choices: numeric(answer, [[F(2 * a, 3 * b * at), "dy/dx = (dy/dt)/(dx/dt), not its reciprocal."], [3 * b * at * at, "This is dy/dt; divide by dx/dt as well."], [F(b * at, a), "The coordinate ratio y/x is not the slope."], [-3 * b * at, "Differentiate both parameter functions and divide."]]),
      steps: [`dx/dt = ${2 * a}t, and dy/dt = ${3 * b}t².`, `dy/dx = (${3 * b}t²)/(${2 * a}t) = (${ft(F(3 * b, 2 * a))})t for t ≠ 0.`, `At t = ${at}, the slope is ${ft(answer)}.`]
    };
  },
  polar(random) {
    const radius = integer(random, 1, 6), divisor = choose(random, [2, 3, 4, 6]);
    const answer = F(radius * radius, 2 * divisor);
    const choices = numeric(answer, [[F(radius * radius, divisor), "The polar area formula has a factor of 1/2."], [F(radius, 2 * divisor), "Square r in the polar area formula."], [F(radius * radius, 4 * divisor), "Do not halve the angular interval again."], [F(radius * radius, 3 * divisor), "Use one half of the integral of r²."]]);
    return {
      family: "polar", parameters: { radius, divisor }, prompt: "Find the area swept by this polar curve over the given interval.",
      expression: `r = ${radius},   0 ≤ θ ≤ π/${divisor}`,
      note: "Each answer is a coefficient times π; angles are radians.",
      choices: choices.map(choice => ({ ...choice, text: `(${choice.text})π` })),
      steps: ["For a nonnegative polar radius, area = (1/2) ∫ r² dθ.", `Here r² = ${radius * radius} and the angular width is π/${divisor}.`, `Area = (1/2) · ${radius * radius} · π/${divisor} = (${ft(answer)})π.`]
    };
  },
  vectors(random) {
    const a = [integer(random, 1, 4), integer(random, 1, 4), integer(random, 1, 4)];
    const b = [integer(random, -3, -1), integer(random, 1, 4), integer(random, 1, 4)];
    const variant = choose(random, ["dot", "cross"]);
    if (variant === "cross") {
      const answer = cross(a, b);
      const label = vector => `⟨${vector.join(", ")}⟩`;
      return {
        family: "cross", parameters: { a, b }, prompt: "Find a × b (in this order).", expression: `a = ${label(a)},   b = ${label(b)}`,
        choices: symbolic({ text: label(answer), model: answer }, [
          { text: label(answer.map(v => -v)), model: answer.map(v => -v), reason: "Reversing the order gives b × a = −(a × b)." },
          { text: label([a[0] * b[0], a[1] * b[1], a[2] * b[2]]), model: [a[0] * b[0], a[1] * b[1], a[2] * b[2]], reason: "The cross product is not componentwise multiplication." },
          { text: label([answer[0], -answer[1], answer[2]]), model: [answer[0], -answer[1], answer[2]], reason: "The middle component is a₃b₁ − a₁b₃; check its sign." }
        ]),
        steps: ["a × b = ⟨a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁⟩.", `Substitute: ⟨${a[1]}·${b[2]} − ${a[2]}·${b[1]}, ${a[2]}·(${b[0]}) − ${a[0]}·${b[2]}, ${a[0]}·${b[1]} − ${a[1]}·(${b[0]})⟩.`, `The result is ${label(answer)}, perpendicular to both a and b.`]
      };
    }
    const answer = dot(a, b);
    return {
      family: "dot", parameters: { a, b }, prompt: "Find the scalar dot product a · b.", expression: `a = ⟨${a.join(", ")}⟩,   b = ⟨${b.join(", ")}⟩`,
      choices: numeric(answer, [[-answer, "Keep the signs of each component product."], [a[0] * b[0] + a[1] * b[1], "Include all three coordinate products."], [a[0] * b[0], "Add the other two coordinate products too."], [answer + a[2] * b[2], "Count each coordinate product exactly once."]]),
      steps: ["The dot product is a₁b₁ + a₂b₂ + a₃b₃.", `Compute ${a[0]}·(${b[0]}) + ${a[1]}·${b[1]} + ${a[2]}·${b[2]} = ${answer}.`, "The result is a scalar, unlike the cross product."]
    };
  },
  partials(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), x = integer(random, 1, 3), y = integer(random, 1, 3);
    const variable = choose(random, ["x", "y"]);
    const answer = variable === "x" ? 2 * a * x * y + b * y * y : a * x * x + 2 * b * x * y;
    const other = variable === "x" ? a * x * x + 2 * b * x * y : 2 * a * x * y + b * y * y;
    return {
      family: "partial", parameters: { a, b, x, y, variable },
      prompt: `Evaluate ∂f/∂${variable} at (${x}, ${y}).`, expression: `f(x, y) = ${t(a, "x²y")} + ${t(b, "xy²")}`,
      choices: numeric(answer, [[other, "Differentiate with respect to the requested variable, holding the other fixed."], [a * x * x * y + b * x * y * y, "This is the function value, not a partial derivative."], [variable === "x" ? 2 * a * x * y : 2 * b * x * y, "Both terms depend on the requested variable."], [-answer, "There is no negative sign in this derivative."]]),
      steps: [`Hold ${variable === "x" ? "y" : "x"} constant.`, variable === "x" ? `∂f/∂x = ${t(2 * a, "xy")} + ${t(b, "y²")}.` : `∂f/∂y = ${t(a, "x²")} + ${t(2 * b, "xy")}.`, `Substitute x = ${x}, y = ${y}: the result is ${answer}.`]
    };
  },
  directional(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), x = integer(random, 1, 3), y = integer(random, 1, 3);
    const v = choose(random, [[3, 4], [4, 3], [-3, 4], [3, -4]]);
    const numerator = 2 * a * x * v[0] + 2 * b * y * v[1];
    return {
      family: "directional", parameters: { a, b, x, y, v }, prompt: `Find the directional derivative at (${x}, ${y}) in the direction of v.`,
      expression: `f(x, y) = ${t(a, "x²")} + ${t(b, "y²")},   v = ⟨${v.join(", ")}⟩`,
      note: "A direction vector must be normalized to a unit vector.",
      choices: numeric(F(numerator, 5), [[numerator, "Normalize v first; its length is 5."], [F(numerator, 25), "Divide by the length, not the squared length."], [F(-numerator, 5), "That reverses the direction."], [2 * a * x + 2 * b * y, "Use the dot product with the specified unit direction."]]),
      steps: [`∇f = ⟨${2 * a}x, ${2 * b}y⟩, so ∇f(${x}, ${y}) = ⟨${2 * a * x}, ${2 * b * y}⟩.`, `|v| = 5, hence u = ⟨${v[0]}/5, ${v[1]}/5⟩.`, `Dᵤf = ∇f · u = (${2 * a * x}·(${v[0]}) + ${2 * b * y}·(${v[1]}))/5 = ${ft(F(numerator, 5))}.`]
    };
  },
  double(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), c = integer(random, 1, 5);
    return {
      family: "double", parameters: { a, b, c }, prompt: "Evaluate the double integral over this rectangle.",
      expression: `∫ from x = 0 to ${a} ∫ from y = 0 to ${b} of ${t(c, "xy")} dy dx`,
      choices: numeric(F(c * a * a * b * b, 4), [[c * a * b, "Integrate both variables; do not just substitute upper limits."], [F(c * a * a * b * b, 2), "Each power-one integration contributes a factor of 1/2."], [c * a * a * b * b, "Divide by both new exponents."]]),
      steps: [`First integrate in y, holding x fixed: ∫ ${c}xy dy = (${c}/2)xy².`, `At y = ${b} and 0 this gives (${ft(F(c * b * b, 2))})x.`, `Integrate in x from 0 to ${a}: ${c} · ${a}² · ${b}² / 4 = ${ft(F(c * a * a * b * b, 4))}.`]
    };
  },
  triple(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), c = integer(random, 1, 4), k = integer(random, 1, 4);
    const answer = F(k * a * b * c * c, 2);
    return {
      family: "triple", parameters: { a, b, c, k }, prompt: "Find the mass of this box with density ρ(x, y, z).",
      expression: `ρ = ${t(k, "z")};  0 ≤ x ≤ ${a},  0 ≤ y ≤ ${b},  0 ≤ z ≤ ${c}`,
      note: "Use mass = ∭ ρ dV. Coordinates and density use consistent units.",
      choices: numeric(answer, [[k * a * b * c, "The density varies with z; integrate it rather than assuming a constant."], [k * a * b * c * c, "Integrating z contributes a factor of 1/2."], [F(k * c * c, 2), "Also integrate over the x and y widths."], [F(k * a * b * c * c, 3), "The antiderivative of z is z²/2, not z²/3."]]),
      steps: [`Integrate ρ in z: ∫ from 0 to ${c} of ${k}z dz = ${ft(F(k * c * c, 2))}.`, `The x and y integrals supply widths ${a} and ${b}.`, `Mass = ${a} · ${b} · ${ft(F(k * c * c, 2))} = ${ft(answer)}.`]
    };
  },
  divergence(random) {
    const a = integer(random, 1, 4), b = integer(random, 1, 4), c = integer(random, 1, 4), x = integer(random, 1, 3), y = integer(random, 1, 3), z = integer(random, 1, 3);
    const answer = 2 * (a * x + b * y + c * z);
    return {
      family: "divergence", parameters: { a, b, c, x, y, z }, prompt: `Find ∇ · F at (${x}, ${y}, ${z}).`,
      expression: `F = ⟨${t(a, "x²")}, ${t(b, "y²")}, ${t(c, "z²")}⟩`,
      choices: numeric(answer, [[answer / 2, "Each squared coordinate differentiates to twice that coordinate."], [0, "This field has zero curl, but generally nonzero divergence."], [a * x * x + b * y * y + c * z * z, "Divergence sums partial derivatives, not field components."]]),
      steps: ["For F = ⟨P, Q, R⟩, divergence is ∂P/∂x + ∂Q/∂y + ∂R/∂z.", `∇ · F = ${2 * a}x + ${2 * b}y + ${2 * c}z.`, `At (${x}, ${y}, ${z}), this scalar is ${answer}.`]
    };
  },
  curl(random) {
    const a = integer(random, 1, 5), b = integer(random, 1, 5), c = integer(random, 1, 5);
    const label = vector => `⟨${vector.join(", ")}⟩`;
    const answer = [c, a, b];
    return {
      family: "curl", parameters: { a, b, c }, prompt: "Find the curl ∇ × F.",
      expression: `F(x, y, z) = ⟨${t(a, "z")}, ${t(b, "x")}, ${t(c, "y")}⟩`,
      choices: symbolic({ text: label(answer), model: answer }, [
        { text: label(answer.map(v => -v)), model: answer.map(v => -v), reason: "That reverses the cross-product orientation." },
        { text: "⟨0, 0, 0⟩", model: [0, 0, 0], reason: "Divergence is zero here, but the cross partials defining curl are not." },
        { text: label([2 * c, 2 * a, 2 * b]), model: [2 * c, 2 * a, 2 * b], reason: "These are linear terms; no factor of two appears on differentiation." }
      ]),
      steps: ["Curl F = ⟨∂R/∂y − ∂Q/∂z, ∂P/∂z − ∂R/∂x, ∂Q/∂x − ∂P/∂y⟩.", `For this field the components are ⟨${c} − 0, ${a} − 0, ${b} − 0⟩.`, `Thus ∇ × F = ⟨${c}, ${a}, ${b}⟩, a constant vector.`]
    };
  }
};

export function generateProblem(courseId, topicId, random = Math.random) {
  const course = COURSES.find(item => item.id === String(courseId));
  if (!course) throw new RangeError("Unknown course.");
  const topic = topicId === "mixed" ? choose(random, course.topics)[0] : topicId;
  const definition = course.topics.find(([id]) => id === topic);
  if (!definition || !generators[topic]) throw new RangeError("Topic does not belong to this course.");
  const problem = generators[topic](random);
  const rules = SOLUTION_RULES[problem.family];
  if (!rules?.length) throw new Error(`Missing solution rules for ${problem.family}.`);
  problem.choices = shuffle(random, problem.choices);
  const tips = rules.map(rule => ({ name: rule.name, statement: rule.tip || rule.statement }));
  return { ...problem, rules, tips, course: course.id, topic, topicName: definition[1], answer: problem.choices.findIndex(choice => choice.correct) };
}

export function answerValue(problem) {
  const choice = problem.choices[problem.answer];
  return choice.value ? fv(choice.value) : choice.model;
}
