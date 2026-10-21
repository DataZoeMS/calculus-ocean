import { GRAPHS, SPECIAL_ANGLES, graphPoint, graphIntegral, unitCircle, pretty } from "./math.js";
import { exactValueTex } from "./math-content.js";
import { renderMath } from "./math-render.js";

const NS = "http://www.w3.org/2000/svg";
const $ = id => document.getElementById(id);
const set = (id, name, value) => $(id).setAttribute(name, String(value));
const sx = x => 40 + (x + 5) * 42;
const sy = y => 320 - (Math.max(-10000, Math.min(10000, y)) + 5) * 30;
const pair = (x, y) => `${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`;
const GRAPH_TEX = { quadratic: "ax^2", cubic: "ax^3", sine: "a\\sin x", cosine: "a\\cos x", exponential: "ae^x", logarithm: "a\\ln x", reciprocal: "\\frac{a}{x}" };

function readoutText(target, text) {
  target.replaceChildren(document.createTextNode(text));
  target.removeAttribute("role");
  target.removeAttribute("aria-label");
  delete target.dataset.tex;
}

function makeSvg(name, attributes, text) {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

export function createGraph() {
  for (const [id, graph] of Object.entries(GRAPHS)) $("graph-kind").append(new Option(graph.label, id));
  const grid = $("graph-grid");
  for (let i = -5; i <= 5; i++) {
    grid.append(makeSvg("path", { d: `M${pair(i, -5)} L${pair(i, 5)} M${pair(-5, i)} L${pair(5, i)}`, class: i === 0 ? "graph-axis" : "graph-grid-line" }));
    if (i !== 0) {
      grid.append(makeSvg("text", { x: sx(i), y: 338, class: "axis-label", "text-anchor": "middle" }, String(i)));
      grid.append(makeSvg("text", { x: 27, y: sy(i) + 4, class: "axis-label", "text-anchor": "end" }, String(i)));
    }
  }
  grid.append(makeSvg("text", { x: 468, y: 180, class: "axis-label" }, "x"), makeSvg("text", { x: 257, y: 17, class: "axis-label" }, "y"));
  function update() {
    const kind = $("graph-kind").value, a = Number($("graph-a").value), x = Number($("graph-x").value);
    $("graph-a-value").textContent = pretty(a);
    $("graph-x-value").textContent = pretty(x);
    $("graph-a").setAttribute("aria-valuetext", String(a));
    $("graph-x").setAttribute("aria-valuetext", String(x));
    renderMath($("graph-formula"), `y=${GRAPH_TEX[kind]},\\qquad a=${pretty(a)}`, `${GRAPHS[kind].formula}; a = ${pretty(a)}`);
    let d = "", connected = false, previousX = null;
    for (let i = 0; i <= 600; i++) {
      const px = -5 + i / 60, point = graphPoint(kind, a, px);
      if (!point || !Number.isFinite(point.y)) { connected = false; previousX = null; continue; }
      if (kind === "reciprocal" && previousX !== null && previousX < 0 && px > 0) connected = false;
      d += `${connected ? "L" : "M"}${pair(px, point.y)} `;
      connected = true; previousX = px;
    }
    set("graph-line", "d", d);
    const point = graphPoint(kind, a, x);
    const showTangent = $("tangent-enabled").checked;
    if (point) {
      set("graph-tangent", "d", showTangent ? `M${pair(-5, point.y + point.slope * (-5 - x))} L${pair(5, point.y + point.slope * (5 - x))}` : "");
      set("graph-point", "cx", sx(x)); set("graph-point", "cy", sy(point.y));
      $("graph-point").style.display = showTangent ? "" : "none";
      renderMath($("graph-tangent-readout"), String.raw`\begin{aligned}f(${pretty(x)})&\approx${pretty(point.y)}\\f'(${pretty(x)})&\approx${pretty(point.slope)}\end{aligned}`, `f(${pretty(x)}) ≈ ${pretty(point.y)}; slope f′(${pretty(x)}) ≈ ${pretty(point.slope)}.`);
    } else {
      set("graph-tangent", "d", ""); $("graph-point").style.display = "none";
      readoutText($("graph-tangent-readout"), "The function and tangent are undefined at this x. Choose a point inside the function’s domain.");
    }
    const leftInput = $("graph-left"), rightInput = $("graph-right");
    const left = leftInput.valueAsNumber, right = rightInput.valueAsNumber;
    const inWindow = Number.isFinite(left) && Number.isFinite(right) && left >= -5 && left <= 5 && right >= -5 && right <= 5;
    const area = inWindow ? graphIntegral(kind, a, left, right) : null;
    const showArea = $("area-enabled").checked;
    let areaPath = "";
    if (area !== null && showArea) {
      areaPath = `M${pair(left, 0)} `;
      for (let i = 0; i <= 240; i++) {
        const px = left + (right - left) * i / 240;
        areaPath += `L${pair(px, graphPoint(kind, a, px).y)} `;
      }
      areaPath += `L${pair(right, 0)} Z`;
    }
    set("graph-area", "d", areaPath);
    const areaLabel = !inWindow
      ? "Enter both bounds between −5 and 5."
      : area === null
        ? "No finite integral is shown: this interval touches or crosses an excluded point. ln(x) requires positive bounds; 1/x must stay on one side of 0."
        : `∫ from ${pretty(left)} to ${pretty(right)} of f(x) dx ≈ ${pretty(area)}${right < left ? " (reversed bounds change the sign)" : ""}.`;
    if (area !== null) renderMath($("graph-area-readout"), String.raw`\int_{${pretty(left)}}^{${pretty(right)}}f(x)\,dx\approx${pretty(area)}`, areaLabel);
    else readoutText($("graph-area-readout"), areaLabel);
    $("graph-title").textContent = `${GRAPHS[kind].formula}, a = ${pretty(a)}`;
    $("graph-description").textContent = `Window: x and y from −5 to 5. ${$("graph-tangent-readout").textContent} ${$("graph-area-readout").textContent}`;
  }
  for (const id of ["graph-kind", "graph-a", "graph-x", "tangent-enabled", "area-enabled", "graph-left", "graph-right"]) $(id).addEventListener("input", update);
  update();
}

export function createUnitCircle() {
  for (const degrees of SPECIAL_ANGLES) {
    const exact = unitCircle(degrees).exact;
    $("circle-special").append(new Option(`${degrees}° · ${exact[0]}`, String(degrees)));
  }
  function update() {
    const degrees = Number($("circle-angle").value), result = unitCircle(degrees);
    const px = 200 + 132 * result.x, py = 170 - 132 * result.y;
    set("circle-radius", "d", `M200 170 L${px} ${py}`);
    set("circle-projection", "d", `M${px} 170 L${px} ${py} L200 ${py}`);
    set("circle-point", "cx", px); set("circle-point", "cy", py);
    const arcPoints = [];
    for (let step = 0; step <= Math.max(1, degrees); step++) {
      const theta = degrees * Math.PI / 180 * step / Math.max(1, degrees);
      arcPoints.push(`${step ? "L" : "M"}${200 + 32 * Math.cos(theta)} ${170 - 32 * Math.sin(theta)}`);
    }
    set("circle-arc", "d", degrees ? arcPoints.join(" ") : "");
    $("circle-angle-value").textContent = `${degrees}°`;
    $("circle-angle").setAttribute("aria-valuetext", `${degrees} degrees`);
    $("circle-special").value = result.exact ? String(degrees) : "";
    const equal = result.exact ? "=" : "≈";
    const values = [
      ["θ in radians", `${equal} ${result.exact?.[0] ?? pretty(result.radians)}`],
      ["x = cos θ", `${equal} ${result.exact?.[1] ?? pretty(result.x)}`],
      ["y = sin θ", `${equal} ${result.exact?.[2] ?? pretty(result.y)}`],
      ["tan θ", result.tangent === null ? "undefined" : `${equal} ${result.exact?.[3] ?? pretty(result.tangent)}`]
    ];
    $("circle-readout").replaceChildren();
    for (const [exactIndex, [label, value]] of values.entries()) {
      const row = document.createElement("div"), caption = document.createElement("span"), formula = document.createElement("div");
      caption.className = "readout-label";
      caption.textContent = label;
      const raw = result.exact?.[exactIndex] ?? [result.radians, result.x, result.y, result.tangent][exactIndex];
      const tex = raw === "undefined" || raw === null ? "\\text{undefined}" : `${result.exact ? "=" : "\\approx"}${result.exact ? exactValueTex(raw) : pretty(raw)}`;
      renderMath(formula, tex, value);
      row.append(caption, formula);
      $("circle-readout").append(row);
    }
    $("circle-title").textContent = `Unit circle at ${degrees} degrees`;
    $("circle-description").textContent = values.map(([label, value]) => `${label} ${value}`).join(". ");
  }
  $("circle-angle").addEventListener("input", update);
  $("circle-special").addEventListener("change", () => {
    if ($("circle-special").value === "") return;
    $("circle-angle").value = $("circle-special").value; update();
  });
  update();
}
