# Calculus Ocean

**[Open Calculus Ocean](https://datazoems.github.io/calculus-ocean/)** — a calm,
touch-friendly practice space for Calculus I, II, and III. An illustrated whale,
four readable answer cards, worked solutions, and a persistent-in-session scratch
pad keep the spirit of Whale Math, with tools for more advanced study.

No accounts, backend, analytics, external fonts, runtime dependencies, or build
step. All runtime assets are local to this repository.

## Practice coverage

This is a **representative essentials collection, not an exhaustive syllabus**.
Each question is generated from a tested mathematical template with varying
parameters. Choose a specific focus or mixed practice within a course.

| Course | Focus | Actual exercise family |
| --- | --- | --- |
| I | Limits & continuity | Removable holes in `(x² − a²)/(x − a)`; limits and continuous extensions |
| I | Power & chain rules | Symbolic first derivatives of powers of linear functions |
| I | Optimization | Absolute-minimum locations for upward-opening quadratics |
| I | Definite integrals | Power functions over `[0, b]` using the Fundamental Theorem of Calculus |
| I | Antiderivatives | General power-rule antiderivatives, including `+ C` |
| I | Trig & exponential rates | Chain-rule derivatives of scaled sine and exponential functions at zero |
| II | Substitution | `2x(x² + a)ⁿ` antiderivatives |
| II | Integration by parts | Antiderivatives of `ax exp(x)` |
| II | Improper integrals | Convergent inverse powers on `[a, ∞)` and divergent `1/x` |
| II | Geometric series | Infinite sums with positive or negative ratios of magnitude less than one |
| II | Power-series radius | Ratio-test radii for shifted series with denominator `nRⁿ` |
| II | Parametric slopes | `dy/dx` for `x = at²`, `y = bt³` at positive parameter values |
| II | Polar area | Circular sectors with exact areas expressed as multiples of π |
| III | Dot & cross products | Scalar dot products and ordered 3D cross products |
| III | Partial derivatives | First partials of `ax²y + bxy²` at specified points |
| III | Directional derivatives | Quadratic fields with explicitly normalized direction vectors |
| III | Double integrals | `cxy` over rectangles |
| III | Triple integrals | Box mass with density proportional to height |
| III | Divergence | Divergence of separable quadratic vector fields at specified points |
| III | Curl | Curl of cyclic linear vector fields |

Questions have one unambiguous correct choice. Rational answers are reduced;
practice answers are exact, with no decimal-rounding guessing. Polar options
explicitly include π. General-antiderivative prompts distinguish a single
antiderivative from the full family with `+ C`. Domain assumptions and radians
are stated where relevant. Distractors explain common rule, sign, endpoint,
normalization, and arithmetic errors.

No arbitrary symbolic algebra, general limit engine, full convergence-test
suite, partial fractions, arbitrary integration regions, surface integrals, or
Stokes/divergence theorem exercises are claimed.

## Using the site

- Choose a course and topic, select an answer, then inspect the worked solution.
  Every solution includes **Theorems & rules used** with the relevant names,
  formulas, and applicability conditions before the step-by-step working.
  Answers lock after one selection. **Study the solution** reveals the answer
  without increasing the answered/correct totals. **Next question** also lets
  you skip without a penalty.
- The **Start / Stop / Reset timer** is entirely manual. Reset stops it and
  returns it to zero; answering and changing courses do not affect it.
- Toggle any combination of **Scratch pad**, **Graph lab**, and **Unit circle**.
  Toggles, new questions, course/topic changes, and theme changes preserve the
  current drawing and helper settings.
- Light/dark mode follows the device on first load. The theme button overrides
  it for the visit. `?scoutTheme=light` or `?scoutTheme=dark` can choose the initial
  theme explicitly. Reduced-motion preferences are respected.

### Scratch pad

Draw with a finger, Apple Pencil, or mouse on the fixed HTML drawing surface.
The surface uses `touch-action: none`, **local**, non-passive `touchstart` and
`touchmove` prevention, pointer capture, and non-interactive SVG children.
There is no document-wide scroll lock: scroll normally outside the pad.

Choose ocean, graphite, or coral ink and three pen widths. The eraser removes
whole strokes/stamps rather than cutting pixels. **Undo** retains the last
60 drawing actions; **Clear** is undoable. Grid, x–y axes, unit-circle, 3D-axis,
and blank guides can be changed without touching the ink. The 3D guide is a
flat projection for sketches, not a 3D rendering engine.

Select an integral, double/triple integral, gradient, infinity, theta, or vector
stamp: **Place stamp activates automatically**, so tap a location next without
pressing another button. Placement returns to the pen and resets the picker,
allowing the same symbol to be picked again. The **Place stamp** button and
keyboard Enter repeat the last chosen symbol (initially ∫).

Keyboard controls when the pad is focused:

| Key | Action |
| --- | --- |
| Arrow keys | Move the drawing cursor |
| Shift + arrow | Move farther |
| Space | Start or finish a line; arrows draw while a line is active |
| Enter | Place the selected stamp at the cursor |
| Escape | Cancel the current keyboard line and return to pen mode |

Drawing geometry uses a fixed-aspect-ratio SVG coordinate space so rotating or
resizing does not discard marks. Browser/system-cancelled gestures restore the
previous work. Pencil pressure and advanced palm rejection are not implemented.

### Graph lab

Seven explicit presets: `ax²`, `ax³`, `a sin(x)`, `a cos(x)`, `a exp(x)`,
`a ln(x)`, and `a/x`. Adjust the scale and tangent location. Optional shading
shows the **signed definite integral**, including sign reversal for reversed
bounds, using each preset's analytic antiderivative.

The fixed viewport is `−5 ≤ x, y ≤ 5`; curves are sampled and clipped, and
readouts are rounded to three decimals. The tangent can be outside the visible
window. `ln(x)` requires positive x, and `1/x` excludes zero. Bounds touching
or crossing excluded domain points are rejected rather than presenting a
misleading finite integral. In particular, this helper does not calculate
improper integrals even when one converges (such as `ln(x)` starting at zero).
Trig functions use radians. Graphs are independent explorations, **not
automatically matched to the current exercise**. No expression input or `eval`
is used.

### Unit circle

A 0–360° slider, special-angle selector, radius, counterclockwise angle arc,
and coordinate projections connect angles to sine, cosine, and tangent.
Special angles have exact radical/π values; other angles use `≈` readouts
rounded to three decimals. Tangent is explicitly undefined at 90° and 270°.

## Accessibility and privacy

Native buttons, selects, disclosure controls, keyboard support, visible focus,
44px-or-larger controls, selectable mathematical text, descriptive SVG labels,
and live answer feedback are included. Formula notation uses Unicode symbols,
superscripts, and explicit integral bounds rather than relying on an external
math renderer. Actual screen-reader pronunciation of math varies by platform.
Touch and narrow layouts are supported without disabling browser zoom.

Practice history, drawings, timer state, theme changes, and helper settings
remain **only in the current page's memory**. Reloading or closing the tab
starts fresh; there is no cross-device sync or saved progress. The site sends
no application data, but GitHub Pages receives ordinary hosting requests.

## Run locally

Use Node 20+ for tests. Any static HTTP server can serve the app. For example,
from the repository root with Python installed:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8766/`. ES modules require HTTP rather than
double-clicking `index.html` with a `file:` URL. There is no install/build
requirement to run the site.

## Validation

```powershell
npm test
```

The dependency-free Node suite checks 1,000 seeded instances of every topic
(20,000 instances), choice uniqueness and mathematical equivalence, course
boundaries, mixed-topic reachability, and every generator branch. Independent
finite differences, Simpson quadrature, finite series sums, and vector
identities verify the generated answers. Helper tests cover all graph
derivatives/integrals, domain exclusions, reversed/equal bounds, exact
unit-circle labels, undefined tangents, and eraser geometry.
Every generated problem is also checked for named solution rules and conditions,
including the different rules used by the alternate problem families.

Optional browser regression checks use an **existing Playwright installation**
with its WebKit browser. No browser dependencies are needed by the deployed app.
Point the runner at the Playwright package directory when it is not installed
on Node's normal module search path:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\path\to\playwright-browsers'
$env:BROWSER_ARTIFACTS = 'C:\path\to\optional-screenshots'
npm run test:browser
```

The runner starts a temporary loopback server on an available port, serves the
app under `/calculus-ocean/` to exercise Pages-relative URLs, and closes the
server/browser in `finally`. It covers all 20 topic UIs, correct/incorrect and
study feedback, answer locking, timer semantics, helper preservation, drawing,
stamping, erasing, undo/clear, keyboard drawing, graph/circle interaction,
domain messaging, light/dark/reduced motion, and 360–1440px layouts.
It verifies rule display on answers and study reveals, automatic stamp selection
from pen/eraser modes, repeat selection, and placement with touch and keyboard.

WebKit iPad emulation includes actual touch taps, local touch-event prevention,
pointer-captured drags outside and back into the pad, and viewport rotation.
This is **not physical-iPad/Apple-Pencil testing**.

## Architecture and hosting

- `index.html`, `styles.css`: responsive ocean UI and Clawpilot theme tokens.
- `exercises.js`: course catalog, parameterized generators, worked steps,
  exact choices and distractor explanations.
- `math.js`: rational arithmetic, seeded randomness, graph and unit-circle math.
- `app.js`: question flow, score, manual timer, panel toggles, and theme.
- `scratch.js`, `helpers.js`: isolated scratch, graph, and unit-circle behavior.
- `tests/`: math and optional WebKit browser regressions.

GitHub Pages serves the repository root from `main`. Commit the static files;
there is no bundler, deployment secret, or generated asset step.
