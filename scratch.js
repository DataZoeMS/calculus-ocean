const NS = "http://www.w3.org/2000/svg";
const WIDTH = 960, HEIGHT = 720;
const stamps = { integral: "∫", double: "∫∫", triple: "∫∫∫", gradient: "∇", infinity: "∞", theta: "θ", vector: "→" };
const clamp = (value, max) => Math.max(0, Math.min(max, value));

function svgNode(name, attributes = {}, text) {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

export function distanceToSegment(point, start, end) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const along = length ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)) : 0;
  return Math.hypot(point.x - start.x - along * dx, point.y - start.y - along * dy);
}

export function segmentDistance(a, b, c, d) {
  const ab = { x: b.x - a.x, y: b.y - a.y }, cd = { x: d.x - c.x, y: d.y - c.y };
  const denominator = ab.x * cd.y - ab.y * cd.x;
  if (denominator !== 0) {
    const ac = { x: c.x - a.x, y: c.y - a.y };
    const t = (ac.x * cd.y - ac.y * cd.x) / denominator;
    const u = (ac.x * ab.y - ac.y * ab.x) / denominator;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(distanceToSegment(a, c, d), distanceToSegment(b, c, d), distanceToSegment(c, a, b), distanceToSegment(d, a, b));
}

export function createScratchPad() {
  const $ = id => document.getElementById(id);
  const surface = $("scratch-pad"), inkLayer = $("scratch-ink-layer"), guideLayer = $("scratch-guide-layer");
  let marks = [], history = [], active = null, mode = "pen", cursor = { x: WIDTH / 2, y: HEIGHT / 2 }, keyboardStroke = null, selectedStamp = "integral";

  const status = text => { $("scratch-status").textContent = text; };
  const remember = before => { history.push(before); if (history.length > 60) history.shift(); };
  function updateButtons() {
    $("undo").disabled = history.length === 0;
    $("clear").disabled = marks.length === 0;
    surface.classList.toggle("has-marks", marks.length > 0 || Boolean(active));
  }
  function render() {
    inkLayer.replaceChildren();
    for (const mark of marks) {
      if (mark.type === "stamp") {
        inkLayer.append(svgNode("text", { x: mark.x, y: mark.y, class: `scratch-stamp stamp-${mark.ink}` }, mark.text));
      } else {
        const d = mark.points.map((point, i) => `${i ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
        inkLayer.append(svgNode("path", { d: mark.points.length === 1 ? `${d} l0.1 0` : d, class: `scratch-mark ink-${mark.ink}`, "stroke-width": mark.width }));
      }
    }
    updateButtons();
  }
  function setMode(next) {
    mode = next;
    for (const id of ["pen", "eraser", "stamp"]) $(id).setAttribute("aria-pressed", String(mode === id));
    $("stamp-kind").value = mode === "stamp" ? selectedStamp : "";
    status(mode === "stamp" ? `Tap the pad to place ${stamps[selectedStamp]}` : `${mode === "pen" ? "Pen" : "Whole-stroke eraser"} selected`);
  }
  function guide() {
    const kind = $("scratch-guide").value;
    guideLayer.replaceChildren();
    if (kind === "grid" || kind === "axes") guideLayer.append(svgNode("rect", { x: 0, y: -60, width: WIDTH, height: HEIGHT, fill: "url(#scratch-grid)" }));
    if (kind === "axes" || kind === "circle") {
      guideLayer.append(svgNode("path", { d: "M30 300 H930 M480 25 V575 M916 292 L930 300 L916 308 M472 39 L480 25 L488 39", class: "scratch-axis" }));
      guideLayer.append(svgNode("text", { x: 910, y: 335, class: "scratch-label" }, "x"), svgNode("text", { x: 497, y: 47, class: "scratch-label" }, "y"));
    }
    if (kind === "circle") {
      guideLayer.append(svgNode("circle", { cx: 480, cy: 300, r: 220, class: "scratch-guide-circle" }));
      for (const [x, y, text] of [[711, 326, "1"], [226, 326, "−1"], [493, 83, "1"], [493, 546, "−1"]]) guideLayer.append(svgNode("text", { x, y, class: "scratch-label" }, text));
    }
    if (kind === "vectors") {
      guideLayer.append(svgNode("path", { d: "M470 355 L185 530 M470 355 L810 425 M470 355 V55 M189 514 L185 530 L202 534 M793 413 L810 425 L790 433 M462 70 L470 55 L478 70", class: "scratch-axis" }));
      for (const [x, y, text] of [[167, 558, "x"], [826, 435, "y"], [490, 69, "z"]]) guideLayer.append(svgNode("text", { x, y, class: "scratch-label" }, text));
    }
    status(`${$("scratch-guide").selectedOptions[0].text} guide · drawings unchanged`);
  }
  function position(event) {
    const rect = surface.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width * WIDTH, WIDTH), y: clamp((event.clientY - rect.top) / rect.height * HEIGHT, HEIGHT) };
  }
  function makeStroke(point) {
    return { type: "stroke", points: [point], ink: $("ink").value, width: Number($("pen-width").value) };
  }
  function addStamp(point) {
    remember([...marks]);
    marks = [...marks, { type: "stamp", ...point, text: stamps[selectedStamp], ink: $("ink").value }];
    render();
    setMode("pen");
    status("Stamp placed · Pen selected · Undo available");
  }
  function erase(point, previous = point) {
    const rect = surface.getBoundingClientRect();
    const radius = 14 * 960 / rect.width;
    marks = marks.filter(mark => {
      if (mark.type === "stamp") return distanceToSegment(mark, previous, point) > radius + 24;
      return !mark.points.some((p, i) => {
        if (distanceToSegment(p, previous, point) <= radius + mark.width / 2) return true;
        return i > 0 && segmentDistance(previous, point, mark.points[i - 1], p) <= radius + mark.width / 2;
      });
    });
    render();
  }
  function finish(cancelled = false) {
    if (!active) return;
    const current = active;
    active = null;
    if (cancelled) marks = current.before;
    else if (mode === "pen" || marks.length !== current.before.length) remember(current.before);
    if (surface.hasPointerCapture(current.pointerId)) surface.releasePointerCapture(current.pointerId);
    render();
    status(cancelled ? "Gesture cancelled · previous work kept" : `${marks.length} mark${marks.length === 1 ? "" : "s"} · Undo available`);
  }
  function endKeyboard(cancelled = false) {
    if (!keyboardStroke) return;
    if (cancelled) marks = keyboardStroke.before;
    else remember(keyboardStroke.before);
    keyboardStroke = null;
    render();
    status(cancelled ? "Keyboard line cancelled" : "Keyboard line finished");
  }

  // Keep prevention local: Safari must not turn a stroke into a page pan, but the rest of the page can scroll.
  surface.addEventListener("touchstart", event => event.preventDefault(), { passive: false });
  surface.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
  surface.addEventListener("contextmenu", event => event.preventDefault());
  surface.addEventListener("pointerdown", event => {
    if (active || event.button !== 0) return;
    event.preventDefault();
    endKeyboard();
    surface.focus({ preventScroll: true });
    const point = position(event);
    if (mode === "stamp") { addStamp(point); return; }
    active = { pointerId: event.pointerId, before: [...marks], last: point };
    surface.setPointerCapture(event.pointerId);
    if (mode === "pen") marks = [...marks, makeStroke(point)];
    else erase(point);
    render();
  });
  surface.addEventListener("pointermove", event => {
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() || [];
    for (const item of events.length ? events : [event]) {
      const point = position(item);
      if (mode === "pen") marks[marks.length - 1].points.push(point);
      else erase(point, active.last);
      active.last = point;
    }
    render();
  });
  surface.addEventListener("pointerup", event => {
    if (active?.pointerId !== event.pointerId) return;
    const point = position(event);
    if (mode === "pen") marks[marks.length - 1].points.push(point);
    else erase(point, active.last);
    finish();
  });
  surface.addEventListener("pointercancel", event => { if (active?.pointerId === event.pointerId) finish(true); });
  surface.addEventListener("lostpointercapture", event => { if (active?.pointerId === event.pointerId) finish(); });
  for (const id of ["pen", "eraser", "stamp"]) $(id).addEventListener("click", () => { finish(); endKeyboard(); setMode(id); });
  $("stamp-kind").addEventListener("change", () => {
    finish(); endKeyboard();
    selectedStamp = $("stamp-kind").value;
    setMode("stamp");
  });
  $("scratch-guide").addEventListener("change", guide);
  $("undo").addEventListener("click", () => {
    finish(); endKeyboard();
    if (history.length) marks = history.pop();
    render(); status("Last action undone");
  });
  $("clear").addEventListener("click", () => {
    finish(); endKeyboard();
    if (marks.length) { remember([...marks]); marks = []; }
    render(); status("Pad cleared · Undo restores it");
  });
  function renderCursor() {
    $("scratch-cursor").setAttribute("transform", `translate(${cursor.x - WIDTH / 2} ${cursor.y - HEIGHT / 2})`);
  }
  surface.addEventListener("focus", () => { $("scratch-cursor").hidden = false; $("scratch-cursor").removeAttribute("hidden"); renderCursor(); });
  surface.addEventListener("blur", () => { $("scratch-cursor").setAttribute("hidden", ""); endKeyboard(); });
  surface.addEventListener("keydown", event => {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta && ![" ", "Enter", "Escape"].includes(event.key)) return;
    event.preventDefault();
    if (active) return;
    if (delta) {
      const step = event.shiftKey ? 50 : 10;
      cursor = { x: clamp(cursor.x + delta[0] * step, WIDTH), y: clamp(cursor.y + delta[1] * step, HEIGHT) };
      if (keyboardStroke) { marks[marks.length - 1].points.push({ ...cursor }); render(); }
      renderCursor();
    } else if (event.key === " " && !event.repeat) {
      if (keyboardStroke) endKeyboard();
      else {
        setMode("pen");
        keyboardStroke = { before: [...marks] };
        marks = [...marks, makeStroke({ ...cursor })];
        render(); status("Keyboard line started · arrows draw; Space finishes");
      }
    } else if (event.key === "Enter" && !event.repeat) {
      endKeyboard(); addStamp(cursor);
    } else if (event.key === "Escape") {
      endKeyboard(true); setMode("pen");
    }
  });
  guide();
  render();
}
