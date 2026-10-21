import { fraction } from "./math.js";

const T = String.raw;
export const fracTex = (n, d = 1) => {
  const value = typeof n === "object" ? fraction(n.n, n.d) : fraction(n, d);
  return value.d === 1 ? String(value.n) : T`${value.n < 0 ? "-" : ""}\frac{${Math.abs(value.n)}}{${value.d}}`;
};
const pow = (base, exponent) => exponent === 0 ? "1" : exponent === 1 ? base : `${base}^{${exponent}}`;
const term = (a, body) => a === 1 ? body : a === -1 ? `-${body}` : `${a}${body}`;
const rationalTerm = (a, body) => a.n === a.d ? body : a.n === -a.d ? `-${body}` : `${fracTex(a)}${body}`;
const sign = value => value < 0 ? `- ${Math.abs(value)}` : `+ ${value}`;
const vector = values => T`\left\langle ${values.join(", ")}\right\rangle`;
const column = values => T`\begin{pmatrix}${values.join(T`\\`)}\end{pmatrix}`;
const step = (text, ...tex) => ({ text, tex });

export function exactValueTex(text) {
  if (text === "undefined") return T`\text{undefined}`;
  const normalized = text.replaceAll("−", "-");
  const match = normalized.match(/^(-?)(?:(\d*)π|√(\d+)|(\d+))(?:\/(\d+))?$/);
  if (!match) throw new Error(`Unsupported exact helper value: ${text}`);
  const numerator = match[2] !== undefined ? `${match[2]}\\pi` : match[3] ? T`\sqrt{${match[3]}}` : match[4];
  return match[1] + (match[5] ? T`\frac{${numerator}}{${match[5]}}` : numerator);
}

export const RULE_MATH = {
  "Difference of squares & limit laws": {
    tex: [T`x^2-a^2=(x-a)(x+a)`, T`\frac{x^2-a^2}{x-a}=x+a\quad(x\ne a)`],
    text: "Factor before cancelling. Functions that agree near a point, except possibly at that point, have the same limit there."
  },
  "Continuity at a point": {
    tex: [T`\lim_{x\to a}f(x)=f(a)`],
    text: "Continuity requires the finite limit to equal the function value. Polynomials are continuous; fill a removable hole with the limiting value."
  },
  "Power, sum & constant-multiple rules": {
    tex: [T`\frac{d}{dx}(ax^n)=anx^{n-1}`, T`(f+g)'=f'+g',\qquad \frac{d}{dx}c=0`],
    text: "For integer powers of at least one, multiply by the exponent and lower it by one. Keep constant multipliers, differentiate sums term by term, and differentiate constants to zero."
  },
  "Chain rule": {
    tex: [T`\frac{d}{dx}f(g(x))=f'(g(x))\,g'(x)`],
    text: "For differentiable functions, take the outer derivative at the inner function, then multiply by the inner derivative."
  },
  "Fermat’s theorem & the second-derivative test": {
    tex: [T`f'(c)=0`, T`f''(c)>0\ \Longrightarrow\ \text{local minimum}`],
    text: "At a differentiable interior extremum, the first derivative is zero. The second-derivative test applies to a twice continuously differentiable function. Check the whole domain before concluding the minimum is absolute."
  },
  "Power rule for integration": {
    tex: [T`\int x^n\,dx=\frac{x^{n+1}}{n+1}+C`, T`n\ne-1`],
    text: "Work on an interval where the power is defined. Increase the exponent, divide by the new exponent, and include the arbitrary constant for a general antiderivative."
  },
  "Fundamental Theorem of Calculus": {
    tex: [T`\int_a^b f(x)\,dx=F(b)-F(a)`, T`F'=f`],
    text: "For an integrand continuous on the closed interval, evaluate an antiderivative at the upper endpoint and subtract its value at the lower endpoint."
  },
  "Derivative of sine": {
    tex: [T`\frac{d}{dx}\sin x=\cos x`],
    text: "Angles must be in radians. Use the chain rule for a composed sine; differentiate first, then evaluate at the requested point."
  },
  "Exponential derivative & antiderivative": {
    tex: [T`\frac{d}{dx}e^x=e^x`, T`\int e^x\,dx=e^x+C`],
    text: "The natural exponential is its own derivative. For a composed exponential, also use the chain rule. Keep constant multipliers."
  },
  "Substitution rule (reverse chain rule)": {
    tex: [T`u=g(x),\qquad du=g'(x)\,dx`, T`\int f(g(x))\,g'(x)\,dx=\int f(u)\,du`],
    text: "For a continuous outer function and a continuously differentiable inner function, replace the inner expression and its differential together. Substitute back after integrating."
  },
  "Integration by parts (reverse product rule)": {
    tex: [T`\int u\,dv=uv-\int v\,du`],
    text: "For continuously differentiable functions, choose a factor to differentiate and one to integrate so the remaining integral is simpler. Include the constant in the final general antiderivative."
  },
  "Improper integral as a limit & the p-integral test": {
    tex: [T`\int_a^\infty f(x)\,dx=\lim_{R\to\infty}\int_a^R f(x)\,dx`, T`\int_a^\infty x^{-p}\,dx\ \text{converges iff }p>1\quad(a>0)`],
    text: "Evaluate at finite bounds first, then take the limit. An integrand approaching zero alone does not guarantee convergence."
  },
  "Logarithmic antiderivative": {
    tex: [T`\int \frac{1}{x}\,dx=\ln|x|+C`],
    text: "Use an interval excluding zero. For an improper integral, evaluate the antiderivative at finite bounds before examining the endpoint limit."
  },
  "Infinite geometric series formula": {
    tex: [T`\sum_{n=0}^{\infty}ar^n=\frac{a}{1-r}`, T`|r|<1`],
    text: "The first term is at index zero. Preserve the sign of the common ratio, and check that its magnitude is less than one."
  },
  "Ratio test & radius of convergence": {
    tex: [T`L=\lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|`, T`L<1:\ \text{absolute convergence}`, T`L>1:\ \text{divergence}`],
    text: "For eventually nonzero terms, form the ratio limit and solve the resulting inequality around the center. A limit of one is inconclusive; endpoints need separate checks."
  },
  "Parametric derivative rule": {
    tex: [T`\frac{dy}{dx}=\frac{dy/dt}{dx/dt}`, T`\frac{dx}{dt}\ne0`],
    text: "Differentiate both coordinates with respect to the parameter before dividing. The horizontal rate must be nonzero at the chosen parameter value."
  },
  "Polar area formula": {
    tex: [T`A=\frac12\int_\alpha^\beta r(\theta)^2\,d\theta`],
    text: "For a continuous nonnegative radius tracing the region once, integrate the squared radius over the angular interval. Angles must be in radians."
  },
  "Dot-product formula": {
    tex: [T`\mathbf a\cdot\mathbf b=a_1b_1+a_2b_2+a_3b_3`],
    text: "Multiply matching coordinates and add. The result is a scalar."
  },
  "Cross-product formula & right-hand rule": {
    tex: [T`\mathbf a\times\mathbf b=${column(["a_2b_3-a_3b_2", "a_3b_1-a_1b_3", "a_1b_2-a_2b_1"])}`],
    text: "Keep the order and the middle-component sign. The result is perpendicular to both vectors; reversing their order negates the cross product."
  },
  "Partial differentiation": {
    tex: [T`\frac{\partial f}{\partial x},\qquad\frac{\partial f}{\partial y}`],
    text: "Differentiate with respect to the requested variable while holding the other independent variables constant. Apply ordinary derivative rules."
  },
  "Gradient formula for directional derivatives": {
    tex: [T`D_{\mathbf u}f=\nabla f\cdot\mathbf u`, T`\mathbf u=\frac{\mathbf v}{\|\mathbf v\|}`, T`\nabla f=\left\langle\frac{\partial f}{\partial x},\frac{\partial f}{\partial y}\right\rangle`],
    text: "For a differentiable scalar function, take the gradient's dot product with a unit direction. Normalize the given nonzero vector first."
  },
  "Fubini’s theorem": {
    tex: [T`\iint_{[a,b]\times[c,d]}f\,dA`, T`=\int_a^b\left(\int_c^d f(x,y)\,dy\right)dx`],
    text: "A continuous function on a closed rectangle or box can be integrated one variable at a time. Follow the differentials and apply each variable's bounds while holding the others constant."
  },
  "Mass from a density function": {
    tex: [T`m=\iiint_E\rho(x,y,z)\,dV`],
    text: "Integrate the nonnegative density over the whole solid. A varying density cannot be treated as a constant."
  },
  "Divergence definition": {
    tex: [T`\nabla\cdot\mathbf F=\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}+\frac{\partial R}{\partial z}`],
    text: "For a differentiable vector field with components P, Q, and R, pair each component with its matching coordinate. Divergence is a scalar."
  },
  "Curl definition": {
    tex: [T`\nabla\times\mathbf F=${column([T`\frac{\partial R}{\partial y}-\frac{\partial Q}{\partial z}`, T`\frac{\partial P}{\partial z}-\frac{\partial R}{\partial x}`, T`\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}`])}`],
    text: "For a differentiable vector field with components P, Q, and R, take these cross partials in the indicated order. Curl is a vector."
  }
};

export const STAMP_TEX = {
  integral: T`\int`, double: T`\iint`, triple: T`\iiint`, gradient: T`\nabla`, infinity: T`\infty`, theta: T`\theta`, vector: T`\longrightarrow`,
  "rule-power": T`\begin{gathered}\text{Power rule}\\[4pt]\frac{d}{dx}(ax^n)=anx^{n-1}\\[4pt]n\ge1\text{ integer};\ a\text{ constant}\end{gathered}`,
  "rule-chain": T`\begin{gathered}\text{Chain rule}\\[4pt]\frac{d}{dx}f(g(x))=f'(g(x))\,g'(x)\\[4pt]f,g\text{ differentiable}\end{gathered}`,
  "rule-product": T`\begin{gathered}\text{Product rule}\\[4pt](uv)'=u'v+uv'\\[4pt]u,v\text{ differentiable}\end{gathered}`,
  "rule-quotient": T`\begin{gathered}\text{Quotient rule}\\[4pt]\left(\frac{u}{v}\right)'=\frac{u'v-uv'}{v^2}\\[4pt]u,v\text{ differentiable};\ v\ne0\end{gathered}`,
  "rule-integral": T`\begin{gathered}\text{Integral power rule}\\[4pt]\int x^n\,dx=\frac{x^{n+1}}{n+1}+C\\[4pt]n\ne-1;\ \text{on a valid interval}\end{gathered}`,
  "rule-parts": T`\begin{gathered}\text{Integration by parts}\\[4pt]\int u\,dv=uv-\int v\,du\\[4pt]u,v\text{ continuously differentiable}\end{gathered}`,
  "rule-ftc": T`\begin{gathered}\text{Fundamental Theorem}\\\text{of Calculus}\\[4pt]\int_a^b f(x)\,dx=F(b)-F(a)\\[4pt]f\text{ continuous on }[a,b];\ F'=f\end{gathered}`
};

function choiceTex(problem, choice) {
  if (choice.value) {
    const value = fracTex(choice.value);
    if (problem.family === "polar") return rationalTerm(choice.value, T`\pi`);
    if (problem.family === "improper-diverges") return T`\text{Converges to }${value}`;
    return value;
  }
  const m = choice.model, { a, b } = problem.parameters;
  if (Array.isArray(m)) return vector(m);
  switch (problem.family) {
    case "power": return term(m.coefficient, pow("x", m.exponent));
    case "chain": return term(m.coefficient, pow(T`\left(${a}x+${b}\right)`, m.exponent));
    case "antiderivative": return `${rationalTerm(m.coefficient, pow("x", m.exponent))}${m.constant ? "+C" : ""}`;
    case "substitution": return `${rationalTerm(m.coefficient, pow(T`\left(x^2+${a}\right)`, m.exponent))}+C`;
    case "parts": return T`\left(${term(m.linear, "x")} ${sign(m.constant)}\right)e^x+C`;
    case "improper-diverges":
      if (m?.divergent) return T`\text{Diverges to }+\infty`;
      break;
  }
  throw new Error(`Missing exact answer typesetting for ${problem.family}.`);
}

export function problemMath(problem) {
  const v = problem.parameters, { a, b, c, n, x, y, z, h } = v;
  const answer = problem.choices.find(choice => choice.correct);
  const answerTex = choiceTex(problem, answer);
  let expression, worked;
  switch (problem.family) {
    case "power":
      expression = `f(x)=${term(a, pow("x", n))}`;
      worked = [step("Apply the power rule, keeping the constant multiplier.", T`\frac{d}{dx}(ax^n)=anx^{n-1}`), step("Multiply the coefficient and lower the exponent.", `${a}\\cdot${n}=${a * n}`, `${n}-1=${n - 1}`), step("Write the derivative.", `f'(x)=${answerTex}`)];
      break;
    case "difference":
    case "continuity":
      expression = problem.family === "difference"
        ? T`\lim_{x\to${a}}\frac{x^2-${a * a}}{x-${a}}`
        : T`\begin{gathered}f(x)=\frac{x^2-${a * a}}{x-${a}}\\x\ne${a},\qquad a=${a}\end{gathered}`;
      worked = [step("Factor the difference of squares.", `x^2-${a * a}=(x-${a})(x+${a})`), step("Cancel away from the missing point.", T`\frac{(x-${a})(x+${a})}{x-${a}}=x+${a}\quad(x\ne${a})`), step(problem.family === "continuity" ? "The limit gives the value needed to fill the hole." : "Now evaluate the polynomial limit.", T`\lim_{x\to${a}}(x+${a})=${2 * a}`, ...(problem.family === "continuity" ? [`f(${a})=${2 * a}`] : []))];
      break;
    case "chain":
      expression = `f(x)=(${a}x+${b})^{${n}}`;
      worked = [step("Name the inner function and differentiate it.", T`u=${a}x+${b},\qquad\frac{du}{dx}=${a}`), step("Differentiate the outer power and multiply by the inner derivative.", T`\frac{d}{dx}u^{${n}}=${n}u^{${n - 1}}\frac{du}{dx}`), step("Substitute back and simplify.", `f'(x)=${answerTex}`)];
      break;
    case "minimum":
      expression = `f(x)=${term(a, "x^2")}-${2 * a * h}x+${c}`;
      worked = [step("Differentiate the quadratic.", `f'(x)=${2 * a}x-${2 * a * h}`), step("Set the derivative to zero and solve.", T`\begin{aligned}${2 * a}x-${2 * a * h}&=0\\x&=${fracTex(2 * a * h, 2 * a)}\end{aligned}`), step("The quadratic opens upward, so this critical point is the unique absolute minimum.", `f''(x)=${2 * a}>0`, `x_{\\min}=${h}`)];
      break;
    case "power-integral":
      expression = T`\int_0^{${b}}${term(a, pow("x", n))}\,dx`;
      worked = [step("Find a power-rule antiderivative.", `F(x)=${fracTex(a, n + 1)}x^{${n + 1}}`), step("Apply the Fundamental Theorem of Calculus.", T`\int_0^{${b}}${term(a, pow("x", n))}\,dx=F(${b})-F(0)`), step("Evaluate the endpoints and simplify.", T`\begin{aligned}F(${b})-F(0)&=${fracTex(a, n + 1)}\cdot${b}^{${n + 1}}-0\\&=${answerTex}\end{aligned}`)];
      break;
    case "antiderivative":
      expression = T`\int ${term(a, pow("x", n))}\,dx`;
      worked = [step("Use the power rule for integration.", T`\int x^n\,dx=\frac{x^{n+1}}{n+1}+C\quad(n\ne-1)`), step("Increase the exponent and divide the coefficient by it.", `${n}+1=${n + 1}`, T`\frac{${a}}{${n + 1}}=${fracTex(a, n + 1)}`), step("Include the arbitrary constant.", T`\int ${term(a, pow("x", n))}\,dx=${answerTex}`)];
      break;
    case "sine":
    case "exponential": {
      const sine = problem.family === "sine";
      expression = sine ? T`f(x)=${a}\sin(${b}x)` : `f(x)=${a}e^{${b}x}`;
      worked = [step("Apply the chain rule.", sine ? T`f'(x)=${a * b}\cos(${b}x)` : `f'(x)=${a * b}e^{${b}x}`), step("Evaluate the remaining function at zero.", sine ? T`\cos 0=1` : "e^0=1"), step("Multiply by the constant rate factor.", `f'(0)=${a * b}\\cdot1=${answerTex}`)];
      break;
    }
    case "substitution":
      expression = T`\int 2x(x^2+${a})^{${n}}\,dx`;
      worked = [step("Substitute the inner expression and its differential.", T`u=x^2+${a},\qquad du=2x\,dx`), step("Integrate the resulting power of the new variable.", T`\int u^{${n}}\,du=\frac{u^{${n + 1}}}{${n + 1}}+C`), step("Substitute back.", answerTex)];
      break;
    case "parts":
      expression = T`\int ${a}xe^x\,dx`;
      worked = [step("Choose the factors for integration by parts.", T`\begin{aligned}u&=${a}x&dv&=e^x\,dx\\du&=${a}\,dx&v&=e^x\end{aligned}`), step("Subtract the remaining integral.", T`\int ${a}xe^x\,dx=${a}xe^x-${a}\int e^x\,dx`), step("Integrate and factor.", T`\begin{aligned}&${a}xe^x-${a}e^x+C\\&=${answerTex}\end{aligned}`)];
      break;
    case "improper-diverges":
      expression = T`\int_{${v.lower}}^\infty\frac{1}{x}\,dx`;
      worked = [step("Replace infinity with a finite upper bound.", T`\int_{${v.lower}}^R\frac{1}{x}\,dx=\ln R-\ln ${v.lower}`), step("Take the limit of the endpoint expression.", T`\lim_{R\to\infty}(\ln R-\ln ${v.lower})=+\infty`), step("There is no finite integral; it diverges.", T`\int_{${v.lower}}^\infty\frac{1}{x}\,dx=+\infty`)];
      break;
    case "improper-converges":
      expression = T`\int_{${v.lower}}^\infty\frac{1}{x^{${v.exponent}}}\,dx`;
      worked = [step("The p-integral test guarantees convergence.", `p=${v.exponent}>1`), step("Find an antiderivative of the inverse power.", T`F(x)=-\frac{1}{${term(v.exponent - 1, pow("x", v.exponent - 1))}}`), step("Take the upper limit and subtract the lower endpoint.", T`\begin{aligned}\lim_{R\to\infty}F(R)-F(${v.lower})&=0-\left(-${answerTex}\right)\\&=${answerTex}\end{aligned}`)];
      break;
    case "geometric": {
      const r = fracTex(v.sign, v.denominator);
      expression = T`\sum_{n=0}^{\infty}${a}\left(${r}\right)^n`;
      worked = [step("Identify the first term and the common ratio.", `a=${a},\\qquad r=${r}`), step("Check the geometric-series convergence condition.", T`|r|=\frac{1}{${v.denominator}}<1`), step("Apply the infinite-sum formula.", T`\begin{aligned}S&=\frac{a}{1-r}\\&=\frac{${a}}{1-\left(${r}\right)}\\&=${answerTex}\end{aligned}`)];
      break;
    }
    case "radius":
      expression = T`\sum_{n=1}^{\infty}\frac{(x-${v.center})^n}{n\,${v.radius}^n}`;
      worked = [step("Take the absolute ratio limit away from the center. At the center all terms are zero.", T`\begin{aligned}L&=\lim_{n\to\infty}\frac{|x-${v.center}|}{${v.radius}}\frac{n}{n+1}\\&=\frac{|x-${v.center}|}{${v.radius}}\end{aligned}`), step("Solve the ratio-test inequality.", T`\frac{|x-${v.center}|}{${v.radius}}<1\ \Longleftrightarrow\ |x-${v.center}|<${v.radius}`), step("Read off the radius. Endpoints require separate tests.", `R=${answerTex}`)];
      break;
    case "parametric":
      expression = T`\begin{aligned}x(t)&=${term(a, "t^2")}\\y(t)&=${term(b, "t^3")}\end{aligned}`;
      worked = [step("Differentiate both coordinate functions.", T`\frac{dx}{dt}=${2 * a}t,\qquad\frac{dy}{dt}=${3 * b}t^2`), step("Divide the vertical rate by the nonzero horizontal rate.", T`\begin{aligned}\frac{dy}{dx}&=\frac{${3 * b}t^2}{${2 * a}t}\\&=${fracTex(3 * b, 2 * a)}t\quad(t\ne0)\end{aligned}`), step("Evaluate at the requested parameter.", T`\left.\frac{dy}{dx}\right|_{t=${v.at}}=${answerTex}`)];
      break;
    case "polar":
      expression = T`r=${v.radius},\qquad0\le\theta\le\frac{\pi}{${v.divisor}}`;
      worked = [step("Use the polar area formula.", T`A=\frac12\int_\alpha^\beta r^2\,d\theta`), step("Insert the constant radius and angular interval.", T`A=\frac12\int_0^{\pi/${v.divisor}}${v.radius * v.radius}\,d\theta`), step("Evaluate the constant integral.", T`\begin{aligned}A&=\frac12\cdot${v.radius * v.radius}\cdot\frac{\pi}{${v.divisor}}\\&=${answerTex}\end{aligned}`)];
      break;
    case "dot":
    case "cross":
      expression = T`\begin{aligned}\mathbf a&=${vector(a)}\\\mathbf b&=${vector(b)}\end{aligned}`;
      worked = problem.family === "dot"
        ? [step("Multiply corresponding coordinates.", T`\mathbf a\cdot\mathbf b=a_1b_1+a_2b_2+a_3b_3`), step("Add the three signed products.", `${a[0]}\\cdot(${b[0]})+${a[1]}\\cdot${b[1]}+${a[2]}\\cdot${b[2]}`), step("The result is a scalar.", T`\mathbf a\cdot\mathbf b=${answerTex}`)]
        : [step("Use the ordered cross-product formula.", RULE_MATH["Cross-product formula & right-hand rule"].tex[0]), step("Evaluate each component, keeping the middle sign.", column([`${a[1]}\\cdot${b[2]}-${a[2]}\\cdot${b[1]}`, `${a[2]}\\cdot(${b[0]})-${a[0]}\\cdot${b[2]}`, `${a[0]}\\cdot${b[1]}-${a[1]}\\cdot(${b[0]})`])), step("The resulting vector is perpendicular to both input vectors.", T`\mathbf a\times\mathbf b=${answerTex}`)];
      break;
    case "partial":
      expression = `f(x,y)=${term(a, "x^2y")}+${term(b, "xy^2")}`;
      worked = [step(`Hold ${v.variable === "x" ? "y" : "x"} constant while differentiating.`), step("Apply the power rule to each term.", v.variable === "x" ? T`\frac{\partial f}{\partial x}=${term(2 * a, "xy")}+${term(b, "y^2")}` : T`\frac{\partial f}{\partial y}=${term(a, "x^2")}+${term(2 * b, "xy")}`), step("Evaluate at the given point.", T`\frac{\partial f}{\partial ${v.variable}}(${x},${y})=${answerTex}`)];
      break;
    case "directional":
      expression = T`\begin{gathered}f(x,y)=${term(a, "x^2")}+${term(b, "y^2")}\\\mathbf v=${vector(v.v)}\end{gathered}`;
      worked = [step("Evaluate the gradient at the point.", T`\begin{aligned}\nabla f&=${vector([`${2 * a}x`, `${2 * b}y`])}\\\nabla f(${x},${y})&=${vector([2 * a * x, 2 * b * y])}\end{aligned}`), step("Normalize the direction vector.", T`\|\mathbf v\|=5,\quad\mathbf u=${vector(v.v.map(value => fracTex(value, 5)))}`), step("Take the dot product with the unit direction.", T`\begin{aligned}D_{\mathbf u}f&=\frac{${2 * a * x}(${v.v[0]})+${2 * b * y}(${v.v[1]})}{5}\\&=${answerTex}\end{aligned}`)];
      break;
    case "double":
      expression = T`\int_0^{${a}}\int_0^{${b}}${term(c, "xy")}\,dy\,dx`;
      worked = [step("Integrate with respect to y, treating x as constant.", T`\int ${c}xy\,dy=${fracTex(c, 2)}xy^2`), step("Apply the inner bounds.", T`\left[${fracTex(c, 2)}xy^2\right]_{y=0}^{y=${b}}=${fracTex(c * b * b, 2)}x`), step("Integrate over the x interval.", T`\int_0^{${a}}${fracTex(c * b * b, 2)}x\,dx=${answerTex}`)];
      break;
    case "triple":
      expression = T`\begin{gathered}\rho(x,y,z)=${term(v.k, "z")}\\0\le x\le${a},\quad0\le y\le${b}\\0\le z\le${c}\end{gathered}`;
      worked = [step("Integrate the density over the height.", T`\int_0^{${c}}${v.k}z\,dz=${fracTex(v.k * c * c, 2)}`), step("Integrate across the two remaining widths.", T`\int_0^{${a}}\int_0^{${b}}${fracTex(v.k * c * c, 2)}\,dy\,dx`), step("Multiply to obtain the mass.", T`m=${a}\cdot${b}\cdot${fracTex(v.k * c * c, 2)}=${answerTex}`)];
      break;
    case "divergence":
      expression = T`\mathbf F=${vector([term(a, "x^2"), term(b, "y^2"), term(c, "z^2")])}`;
      worked = [step("Use the divergence definition.", RULE_MATH["Divergence definition"].tex[0]), step("Differentiate the matching components.", T`\nabla\cdot\mathbf F=${2 * a}x+${2 * b}y+${2 * c}z`), step("Evaluate at the specified point.", T`(\nabla\cdot\mathbf F)(${x},${y},${z})=${answerTex}`)];
      break;
    case "curl":
      expression = T`\mathbf F(x,y,z)=${vector([term(a, "z"), term(b, "x"), term(c, "y")])}`;
      worked = [step("Use the curl definition.", RULE_MATH["Curl definition"].tex[0]), step("Evaluate the cross partials.", T`\nabla\times\mathbf F=${column([`${c}-0`, `${a}-0`, `${b}-0`])}`), step("The result is a constant vector.", T`\nabla\times\mathbf F=${answerTex}`)];
      break;
    default: throw new Error(`Missing question typesetting for ${problem.family}.`);
  }
  return { expression, worked, choices: problem.choices.map(choice => choiceTex(problem, choice)) };
}
