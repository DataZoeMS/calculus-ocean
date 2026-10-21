export async function initializeMath() {
  window.MathJax = {
    startup: { typeset: false },
    svg: { fontCache: "none" },
    tex: {
      packages: { "[-]": ["autoload", "require"] },
      formatError: (_jax, error) => { throw new Error(`Formula could not be typeset: ${error.message}`); }
    },
    options: { enableMenu: false }
  };
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("./vendor/mathjax/tex-svg.js", import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error("The local math renderer could not load. Reload the page to retry."));
    document.head.append(script);
  });
  await window.MathJax.startup.promise;
}

export function mathSvg(tex, display = true) {
  if (!window.MathJax?.tex2svg) throw new Error("Math typesetting is not ready.");
  const container = window.MathJax.tex2svg(tex, { display });
  if (container.querySelector('[data-mml-node="merror"]')) throw new Error(`Invalid formula: ${tex}`);
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("Math renderer did not produce a formula.");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

export function renderMath(target, tex, label, display = true) {
  target.replaceChildren();
  target.classList.add("typeset");
  target.setAttribute("role", "math");
  target.setAttribute("aria-label", label);
  target.dataset.tex = tex;
  const source = document.createElement("span");
  source.className = "math-source";
  source.setAttribute("aria-hidden", "true");
  source.textContent = label;
  target.append(source, mathSvg(tex, display));
}

export function renderMathLines(target, formulas, label) {
  target.replaceChildren();
  target.setAttribute("role", "math");
  target.setAttribute("aria-label", label);
  const source = document.createElement("span");
  source.className = "math-source";
  source.setAttribute("aria-hidden", "true");
  source.textContent = label;
  target.append(source);
  formulas.forEach(tex => {
    const line = document.createElement("div");
    line.className = "typeset math-line";
    line.dataset.tex = tex;
    line.setAttribute("aria-hidden", "true");
    line.append(mathSvg(tex));
    target.append(line);
  });
}
