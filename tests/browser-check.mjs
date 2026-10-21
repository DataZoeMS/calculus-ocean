import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { STAMPS } from "../scratch.js";

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { webkit, devices } = await import(modulePath ? pathToFileURL(join(modulePath, "index.mjs")).href : "playwright");
const files = new Set(["index.html", "styles.css", "app.js", "math.js", "helpers.js", "scratch.js", "exercises.js", "math-content.js", "math-render.js", "vendor/mathjax/tex-svg.js"]);
const mime = { html: "text/html", js: "text/javascript", css: "text/css" };
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname.replace(/^\/calculus-ocean\//, "");
  const file = path === "" ? "index.html" : path;
  if (!files.has(file)) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(join(process.cwd(), file));
    response.writeHead(200, { "Content-Type": mime[file.split(".").pop()] + "; charset=utf-8" }).end(content);
  } catch (error) {
    console.error(error); response.writeHead(500).end("Read failed");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/calculus-ocean/`;
const output = process.env.BROWSER_ARTIFACTS ? resolve(process.env.BROWSER_ARTIFACTS) : null;
if (output) await mkdir(output, { recursive: true });
let browser;
const failures = [];
async function assertStampFits(page) {
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").last().evaluate(node => {
    const bounds = node.getBBox(), matrix = node.getCTM();
    const viewport = node.ownerSVGElement;
    const inverse = viewport.getCTM().inverse();
    const corners = [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y + bounds.height]].map(([x, y]) => {
      const point = viewport.createSVGPoint(); point.x = x; point.y = y;
      return point.matrixTransform(matrix).matrixTransform(inverse);
    });
    return corners[0].x >= 15 && corners[0].y >= 15 && corners[1].x <= 945 && corners[1].y <= 785;
  }), true, "entire stamp stays within the enlarged drawing space");
}
try {
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: "light", reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  context.on("request", request => {
    if (!request.url().startsWith(url)) failures.push(`Unexpected external request: ${request.url()}`);
  });
  await page.goto(url);
  await page.locator(".answer").first().waitFor();
  assert.equal(await page.locator("#app-error").isVisible(), false);
  assert.equal(await page.locator(".answer").count(), 4);
  assert.equal(await page.locator("#question-expression").getAttribute("role"), "math");
  assert.ok((await page.locator("#question-expression").getAttribute("aria-label")).length > 0);
  assert.equal(await page.locator("#question-expression > svg").count(), 1);
  assert.equal(await page.locator(".answer .formula > svg").count(), 4);
  const typesetCoverage = await page.evaluate(async () => {
    const { COURSES, generateProblem } = await import("./exercises.js");
    const { seededRandom, SPECIAL_ANGLES, unitCircle } = await import("./math.js");
    const { problemMath, RULE_MATH, STAMP_TEX, exactValueTex } = await import("./math-content.js");
    const { mathSvg } = await import("./math-render.js");
    const families = new Set(), formulas = new Set();
    for (const course of COURSES) for (const [topic] of course.topics) {
      for (let seed = 1; seed <= 24; seed++) {
        const problem = generateProblem(course.id, topic, seededRandom(seed * 719));
        families.add(problem.family);
        const content = problemMath(problem);
        for (const tex of [content.expression, ...content.choices, ...content.worked.flatMap(step => step.tex)]) formulas.add(tex);
      }
    }
    for (const rule of Object.values(RULE_MATH)) for (const tex of rule.tex) formulas.add(tex);
    for (const tex of Object.values(STAMP_TEX)) formulas.add(tex);
    for (const angle of SPECIAL_ANGLES) for (const value of unitCircle(angle).exact) formulas.add(exactValueTex(value));
    for (const tex of formulas) {
      const svg = mathSvg(tex);
      if (!svg.querySelector("path") || svg.querySelector("use, [data-mml-node='merror']")) throw new Error(`Not a self-contained valid formula: ${tex}`);
    }
    return { families: families.size, formulas: formulas.size };
  });
  assert.equal(typesetCoverage.families, 25);
  assert.ok(typesetCoverage.formulas > 1000);
  assert.equal(await page.locator(".whale").evaluate(el => getComputedStyle(el).animationName), "none");
  assert.equal(await page.locator("#timer").textContent(), "00:00");
  await page.waitForTimeout(1100);
  assert.equal(await page.locator("#timer").textContent(), "00:00");
  await page.locator("#timer-toggle").click();
  await page.waitForFunction(() => document.getElementById("timer").textContent !== "00:00");
  assert.notEqual(await page.locator("#timer").textContent(), "00:00");
  await page.locator("#timer-toggle").click();
  const stopped = await page.locator("#timer").textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator("#timer").textContent(), stopped);
  await page.locator("#timer-reset").click();
  assert.equal(await page.locator("#timer").textContent(), "00:00");
  assert.equal(await page.locator("#timer-toggle").textContent(), "Start timer");

  // Verify every visible course/topic can render, accept one answer, and reveal worked steps.
  const courses = await page.locator("#course option").evaluateAll(items => items.map(item => item.value));
  let renderedTopics = 0;
  for (const course of courses) {
    await page.locator("#course").selectOption(course);
    const topics = await page.locator("#topic option").evaluateAll(items => items.map(item => item.value).filter(value => value !== "mixed"));
    for (const topic of topics) {
      await page.locator("#topic").selectOption(topic);
      assert.equal(await page.locator(".answer").count(), 4);
      assert.equal(await page.locator("#tips").getAttribute("open"), null);
      const beforeTips = await page.locator("#score").textContent();
      const beforeQuestion = await page.locator("#question-expression").textContent();
      const beforeChoices = await page.locator("#answers").innerHTML();
      await page.locator("#tips summary").click();
      assert.ok(await page.locator("#tip-rules dt").count() > 0);
      assert.equal(await page.locator("#score").textContent(), beforeTips);
      assert.equal(await page.locator("#question-expression").textContent(), beforeQuestion);
      assert.equal(await page.locator("#answers").innerHTML(), beforeChoices);
      assert.equal(await page.locator("#solution").isVisible(), false);
      assert.equal(await page.locator("#solution-steps li").count(), 0);
      if (topic === "power-rule") {
        assert.match(await page.locator("#tip-rules").textContent(), /Power, sum & constant-multiple rules/);
        assert.doesNotMatch(await page.locator("#tip-rules").textContent(), /chain|product|quotient/i);
      }
      await page.locator("#tips summary").click();
      await page.locator(".answer").first().click();
      assert.equal(await page.locator("#solution").getAttribute("open"), "");
      assert.ok(await page.locator("#solution-steps li").count() >= 3);
      assert.ok(await page.locator("#solution-rules dt").count() >= 1);
      assert.ok(await page.locator("#solution-rules .typeset svg").count() >= 1);
      assert.ok(await page.locator("#solution-steps .typeset svg").count() >= 1);
      assert.equal(await page.locator("#solution-rules dt").count(), await page.locator("#solution-rules dd").count());
      assert.ok((await page.locator("#solution-rules").textContent()).length > 40);
      assert.equal(await page.locator(".answer:disabled").count(), 4);
      assert.equal(await page.locator(".answer.correct").count(), 1);
      assert.ok((await page.locator("#feedback").textContent()).length > 30);
      renderedTopics++;
    }
  }
  assert.equal(renderedTopics, 21);
  await page.locator("#course").selectOption("1");
  await page.locator("#topic").selectOption("limits");
  // Use explicit answer text, rather than hoping a random selection exercises both feedback branches.
  let expression = await page.locator("#question-expression").textContent();
  let correctText = String(2 * Number(expression.match(/x − (\d+)\)/)[1]));
  let answerTexts = await page.locator(".answer .formula").allTextContents();
  await page.locator(".answer").nth(answerTexts.indexOf(correctText)).click();
  assert.match(await page.locator("#feedback").textContent(), /Nicely reasoned/);
  await page.locator("#next").click();
  expression = await page.locator("#question-expression").textContent();
  correctText = String(2 * Number(expression.match(/x − (\d+)\)/)[1]));
  answerTexts = await page.locator(".answer .formula").allTextContents();
  await page.locator(".answer").nth(answerTexts.findIndex(text => text !== correctText)).click();
  assert.match(await page.locator("#feedback").textContent(), /A useful place to learn/);
  await page.locator("#next").click();
  const scoreBeforeReveal = await page.locator("#score").textContent();
  await page.locator("#reveal").click();
  assert.equal(await page.locator("#score").textContent(), scoreBeforeReveal);
  assert.match(await page.locator("#feedback").textContent(), /Study mode/);
  assert.match(await page.locator("#solution-rules").textContent(), /Difference of squares/);
  await page.locator("#topic").selectOption("derivatives");
  assert.equal(await page.locator("#solution-rules dt").count(), 0);
  await page.locator("#reveal").click();
  const derivativeRules = await page.locator("#solution-rules").textContent();
  assert.match(derivativeRules, /Power, sum & constant-multiple rules/);
  assert.match(derivativeRules, /Chain rule/);
  assert.doesNotMatch(derivativeRules, /Difference of squares/);
  if (output) await page.locator("#solution").screenshot({ path: join(output, "solution-rules.png") });
  await page.locator("#next").click();
  assert.equal(await page.locator("#question-heading").evaluate(el => document.activeElement === el), true);
  assert.equal(await page.locator("#solution").isVisible(), false);
  assert.equal(await page.locator("#solution-rules dt").count(), 0);
  assert.equal(await page.locator(".answer:not(:disabled)").count(), 4);

  const pad = page.locator("#scratch-pad");
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  assert.ok(box.height >= box.width * 0.82, "default pad is at least one-third taller than the former 8:5 pad");
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 24 });
  await page.mouse.up();
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 1);
  const drawing = await page.locator("#scratch-ink-layer").innerHTML();
  const question = await page.locator("#question-expression").textContent();
  await page.locator("#scratch-expand").click();
  const expandedBox = await pad.boundingBox();
  assert.ok(expandedBox.width > box.width * 1.7, "expanded pad uses the full workspace width");
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  assert.equal(await page.locator("#question-expression").textContent(), question);
  await page.locator("#scratch-expand").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  assert.ok(Math.abs((await pad.boundingBox()).width - box.width) < 1);
  await pad.scrollIntoViewIfNeeded();
  const lowerPad = await pad.boundingBox();
  await page.mouse.move(lowerPad.x + lowerPad.width * 0.2, lowerPad.y + lowerPad.height * 0.85);
  await page.mouse.down();
  await page.mouse.move(lowerPad.x + lowerPad.width * 0.6, lowerPad.y + lowerPad.height * 0.9, { steps: 8 });
  await page.mouse.up();
  const lowerStroke = await page.locator("#scratch-ink-layer > .scratch-mark").last().getAttribute("d");
  assert.ok(Number(lowerStroke.match(/^M[\d.]+ ([\d.]+)/)[1]) > 670, "the new lower drawing area receives correctly mapped strokes");
  await page.locator("#undo").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  await page.locator("#tips summary").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  await page.locator('[data-panel="graph-panel"]').click();
  await page.locator('[data-panel="circle-panel"]').click();
  await page.locator('[data-panel="scratch-panel"]').click();
  await page.locator('[data-panel="scratch-panel"]').click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  assert.equal(await page.locator("#question-expression").textContent(), question);
  await page.locator("#course").selectOption("1");
  await page.locator("#topic").selectOption("derivatives");
  await page.locator("#next").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  await page.locator("#scratch-guide").selectOption("circle");
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  assert.equal(await page.locator("#scratch-guide-layer circle").count(), 1);
  await page.locator("#clear").click();
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 0);
  await page.locator("#undo").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  for (const [kind, symbol] of [["integral", "∫"], ["double", "∫∫"], ["triple", "∫∫∫"], ["gradient", "∇"], ["infinity", "∞"], ["theta", "θ"], ["theta", "θ"], ["vector", "→"]]) {
    await page.locator(kind === "theta" ? "#eraser" : "#pen").click();
    await page.locator("#stamp-kind").selectOption(kind);
    assert.equal(await page.locator("#stamp").getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#pen").getAttribute("aria-pressed"), "false");
    assert.equal(await page.locator("#eraser").getAttribute("aria-pressed"), "false");
    assert.match(await page.locator("#scratch-status").textContent(), /Tap the pad to place/);
    assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
    await pad.click({ position: { x: 50, y: 50 } });
    assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").getAttribute("aria-label"), symbol);
    assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 1);
    assert.equal(await page.locator("#pen").getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#stamp-kind").inputValue(), "");
    await page.locator("#undo").click();
    assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), drawing);
  }
  await page.locator("#stamp").click();
  await pad.click({ position: { x: 50, y: 50 } });
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").count(), 1);
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").getAttribute("aria-label"), "→", "button repeats last stamp");
  await page.locator("#undo").click();
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").count(), 0);
  await page.locator("#eraser").click();
  await pad.click({ position: { x: box.width * 0.45, y: box.height * 0.475 } });
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 0);
  await page.locator("#undo").click();
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 1);
  await pad.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 2);
  await page.locator("#stamp-kind").selectOption("theta");
  await pad.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").count(), 1);
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").getAttribute("aria-label"), "θ");
  assert.equal(await page.locator("#pen").getAttribute("aria-pressed"), "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#scratch-ink-layer > .scratch-mark").count(), 2);

  for (const [kind, stamp] of Object.entries(STAMPS).filter(([id]) => id.startsWith("rule-"))) {
    const beforeStamp = await page.locator("#scratch-ink-layer").innerHTML();
    await page.locator("#stamp-kind").selectOption(kind);
    const padSize = await pad.boundingBox();
    await pad.click({ position: { x: padSize.width - 4, y: padSize.height - 4 } });
    assert.equal(await page.locator("#scratch-ink-layer > .scratch-stamp").last().getAttribute("aria-label"), stamp.lines.join(". "));
    assert.ok(await page.locator("#scratch-ink-layer > .scratch-stamp").last().locator("svg path").count() > 0);
    await assertStampFits(page);
    await page.locator("#eraser").click();
    await pad.scrollIntoViewIfNeeded();
    const erasePoint = await page.locator("#scratch-ink-layer > .scratch-stamp").last().evaluate(text => {
      const bounds = text.getBBox(), point = text.ownerSVGElement.createSVGPoint();
      point.x = bounds.x + bounds.width - 3; point.y = bounds.y + bounds.height / 2;
      const screen = point.matrixTransform(text.getScreenCTM());
      return { x: screen.x, y: screen.y, width: bounds.width * text.getScreenCTM().a };
    });
    assert.ok(erasePoint.width > 100, "formula is a readable multi-line stamp");
    await page.mouse.click(erasePoint.x, erasePoint.y);
    assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), beforeStamp, "eraser reaches the far side of a wide rule stamp");
    await page.locator("#undo").click();
    await assertStampFits(page);
    await page.locator("#undo").click();
    assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), beforeStamp);
  }
  await page.locator("#pen").click();
  await page.locator("#topic").selectOption("power-rule");
  await page.locator("#tips summary").click();
  await page.locator("#stamp-kind").selectOption("rule-chain");
  await pad.click({ position: { x: 20, y: 20 } });
  await assertStampFits(page);
  const withRules = await page.locator("#scratch-ink-layer").innerHTML();
  await page.locator("#scratch-expand").click();
  await assertStampFits(page);
  await page.locator("#scratch-expand").click();
  assert.equal(await page.locator("#scratch-ink-layer").innerHTML(), withRules, "formula stamps survive expanding and restoring the pad");
  if (output) await page.locator("#scratch-panel").screenshot({ path: join(output, "larger-pad-rule-stamp.png") });

  await page.locator("#graph-kind").selectOption("quadratic");
  await page.locator("#graph-a").fill("2");
  await page.locator("#graph-x").fill("2");
  assert.match(await page.locator("#graph-tangent-readout").textContent(), /f\(2\) ≈ 8; slope f′\(2\) ≈ 8/);
  await page.locator("#area-enabled").check();
  assert.match(await page.locator("#graph-area-readout").textContent(), /5\.333/);
  assert.ok((await page.locator("#graph-area").getAttribute("d")).length > 50);
  await page.locator("#graph-kind").selectOption("reciprocal");
  await page.locator("#graph-left").fill("-1");
  await page.locator("#graph-right").fill("1");
  assert.match(await page.locator("#graph-area-readout").textContent(), /No finite integral/);
  assert.equal(await page.locator("#graph-area").getAttribute("d"), "");
  await page.locator("#graph-x").fill("0");
  assert.match(await page.locator("#graph-tangent-readout").textContent(), /undefined/);
  const reciprocalPath = await page.locator("#graph-line").getAttribute("d");
  assert.equal((reciprocalPath.match(/M/g) || []).length, 2);
  await page.locator("#graph-kind").selectOption("logarithm");
  await page.locator("#graph-x").fill("-1");
  assert.match(await page.locator("#graph-tangent-readout").textContent(), /undefined/);
  await page.locator("#graph-left").fill("");
  assert.match(await page.locator("#graph-area-readout").textContent(), /Enter both bounds/);
  await page.locator("#graph-kind").selectOption("sine");
  await page.locator("#graph-a").fill("1");
  await page.locator("#graph-x").fill("1");
  await page.locator("#graph-left").fill("0");
  await page.locator("#graph-right").fill("3");
  await page.locator("#circle-special").selectOption("90");
  assert.match(await page.locator("#circle-readout").textContent(), /π\/2/);
  assert.match(await page.locator("#circle-readout").textContent(), /undefined/);
  await page.locator("#circle-angle").fill("225");
  assert.match(await page.locator("#circle-readout").textContent(), /−√2\/2/);
  await page.locator("#circle-angle").fill("37");
  assert.match(await page.locator("#circle-readout").textContent(), /≈/);
  await page.locator("#circle-special").selectOption("45");
  await page.locator("#theme-toggle").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator("#theme-toggle").click();
  await page.locator("#course").selectOption("2");
  await page.locator("#topic").selectOption("substitution");
  await page.locator("#reveal").click();
  assert.ok(await page.locator("#question-expression [data-mml-node='msup']").count() > 0);
  assert.ok(await page.locator("#answers [data-mml-node='mfrac']").count() > 0);
  if (output) {
    await page.locator(".practice").screenshot({ path: join(output, "typeset-practice.png") });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(output, "desktop-light.png"), fullPage: true });
  }
  assert.equal(await page.locator("#app-error").isVisible(), false);
  await context.close();

  const ipad = await browser.newContext({ ...devices["iPad (gen 7)"], colorScheme: "dark", reducedMotion: "reduce" });
  const tablet = await ipad.newPage();
  tablet.on("pageerror", error => failures.push(error.message));
  await tablet.goto(url);
  await tablet.locator(".answer").first().waitFor();
  assert.equal(await tablet.locator("html").getAttribute("data-theme"), "dark");
  await tablet.locator("#scratch-pad").scrollIntoViewIfNeeded();
  const tabletPad = await tablet.locator("#scratch-pad").boundingBox();
  await tablet.touchscreen.tap(tabletPad.x + 50, tabletPad.y + 50);
  assert.equal(await tablet.locator("#scratch-ink-layer > .scratch-mark").count(), 1, "real WebKit touch tap should draw");
  await tablet.locator("#stamp-kind").selectOption("gradient");
  assert.equal(await tablet.locator("#stamp").getAttribute("aria-pressed"), "true");
  await tablet.locator("#scratch-pad").tap({ position: { x: 100, y: 50 } });
  assert.equal(await tablet.locator("#scratch-ink-layer > .scratch-stamp").getAttribute("aria-label"), "∇", "touch placement follows stamp selection without a mode-button tap");
  assert.equal(await tablet.locator("#pen").getAttribute("aria-pressed"), "true");
  await tablet.locator("#undo").tap();
  assert.equal(await tablet.locator("#scratch-ink-layer > .scratch-stamp").count(), 0);
  const touchRules = await tablet.evaluate(() => {
    const pad = document.getElementById("scratch-pad");
    const insideStart = new TouchEvent("touchstart", { bubbles: true, cancelable: true });
    const insideMove = new TouchEvent("touchmove", { bubbles: true, cancelable: true });
    const outside = new TouchEvent("touchmove", { bubbles: true, cancelable: true });
    pad.dispatchEvent(insideStart); pad.dispatchEvent(insideMove); document.querySelector(".intro").dispatchEvent(outside);
    return { start: insideStart.defaultPrevented, move: insideMove.defaultPrevented, outside: outside.defaultPrevented, touchAction: getComputedStyle(pad).touchAction, childPointerEvents: getComputedStyle(document.getElementById("scratch-svg")).pointerEvents, bodyOverflow: getComputedStyle(document.body).overflow };
  });
  assert.deepEqual(touchRules, { start: true, move: true, outside: false, touchAction: "none", childPointerEvents: "none", bodyOverflow: "visible" });
  await tablet.locator("#scratch-pad").scrollIntoViewIfNeeded();
  const dragPad = await tablet.locator("#scratch-pad").boundingBox();
  await tablet.mouse.move(dragPad.x + 70, dragPad.y + 80);
  await tablet.mouse.down();
  await tablet.mouse.move(dragPad.x + dragPad.width + 35, dragPad.y + 100, { steps: 12 });
  await tablet.mouse.move(dragPad.x + 130, dragPad.y + 120, { steps: 12 });
  await tablet.mouse.up();
  assert.equal(await tablet.locator("#scratch-ink-layer > .scratch-mark").count(), 2, "pointer capture should preserve a stroke across the boundary");
  await tablet.locator("#stamp-kind").selectOption("rule-chain");
  await tablet.locator("#scratch-pad").tap({ position: { x: 5, y: 5 } });
  await assertStampFits(tablet);
  assert.match(await tablet.locator("#scratch-ink-layer > .scratch-stamp").getAttribute("aria-label"), /Chain rule/);
  const beforeRotation = await tablet.locator("#scratch-ink-layer").innerHTML();
  await tablet.setViewportSize({ width: 1080, height: 810 });
  assert.equal(await tablet.locator("#scratch-ink-layer").innerHTML(), beforeRotation);
  assert.ok(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await tablet.locator('[data-panel="graph-panel"]').tap();
  await tablet.locator('[data-panel="circle-panel"]').tap();
  await tablet.locator("#circle-special").selectOption("270");
  assert.match(await tablet.locator("#circle-readout").textContent(), /undefined/);
  await tablet.evaluate(() => window.scrollTo(0, 0));
  if (output) await tablet.screenshot({ path: join(output, "ipad-dark-landscape.png"), fullPage: true });
  for (const width of [360, 390, 768, 820]) {
    await tablet.setViewportSize({ width, height: 1000 });
    await tablet.locator("#course").selectOption("3");
    await tablet.locator("#topic").selectOption("curl");
    await tablet.locator("#tips summary").tap();
    assert.equal(await tablet.locator("#solution").isVisible(), false);
    await assertStampFits(tablet);
    await tablet.locator("#reveal").tap();
    assert.match(await tablet.locator("#solution-rules").textContent(), /Curl definition/);
    assert.ok(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no horizontal overflow at ${width}px`);
    const undersized = await tablet.locator("button, select, input").evaluateAll(elements => elements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.type !== "checkbox" && rect.height < 43.5;
    }).map(el => el.id || el.outerHTML));
    assert.deepEqual(undersized, [], `44px control height at ${width}px`);
  }
  await tablet.setViewportSize({ width: 390, height: 844 });
  await tablet.locator("#theme-toggle").tap();
  await tablet.locator("#course").selectOption("2");
  await tablet.locator("#topic").selectOption("improper");
  await tablet.locator("#tips summary").tap();
  await tablet.locator("#reveal").tap();
  assert.ok(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  if (output) await tablet.locator(".practice").screenshot({ path: join(output, "mobile-typeset-practice.png") });
  await tablet.evaluate(() => window.scrollTo(0, 0));
  if (output) await tablet.screenshot({ path: join(output, "mobile-light.png"), fullPage: true });
  assert.equal(await tablet.locator("#app-error").isVisible(), false);
  await tablet.setViewportSize({ width: 360, height: 1000 });
  const undersizedMath = [];
  for (const course of courses) {
    await tablet.locator("#course").selectOption(course);
    const topics = await tablet.locator("#topic option").evaluateAll(items => items.map(item => item.value).filter(value => value !== "mixed"));
    for (const topic of topics) {
      await tablet.locator("#topic").selectOption(topic);
      await tablet.locator("#tips summary").tap();
      await tablet.locator("#reveal").tap();
      undersizedMath.push(...await tablet.locator("#practice .typeset > svg").evaluateAll(nodes => nodes.filter(node => {
        const width = node.getBoundingClientRect().width;
        return width > 0 && width / node.viewBox.baseVal.width * 1000 < 14;
      }).map(node => node.parentElement.dataset.tex)));
      assert.ok(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no formula overflow for ${topic}`);
    }
  }
  assert.deepEqual([...new Set(undersizedMath)], [], "formulas must remain readable, not merely shrink until they fit");
  await ipad.close();
  const failedLoad = await browser.newContext();
  await failedLoad.route("**/vendor/mathjax/tex-svg.js", route => route.abort("failed"));
  const errorPage = await failedLoad.newPage();
  await errorPage.goto(url);
  await errorPage.locator("#app-error").waitFor();
  assert.match(await errorPage.locator("#app-error").textContent(), /local math renderer could not load/);
  assert.equal(await errorPage.locator(".answer").count(), 0, "failed math startup cannot look like a working question");
  await failedLoad.close();
  assert.deepEqual(failures, []);
  console.log(`PASS: ${typesetCoverage.formulas} self-contained SVG formulas across ${typesetCoverage.families} families; no external math/font requests; explicit failed-load error; 21 topics, spoiler-free tips, enlarged/expanded pad, edge-safe typeset stamps, worked rules/steps, answer feedback, timer, graph domains, circle, scratch/undo/keyboard, WebKit iPad touch, capture, rotation, themes, 360–1440px layouts. Local test server: ${url} (stopped on exit).`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
