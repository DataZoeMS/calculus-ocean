import { COURSES, generateProblem } from "./exercises.js";
import { createScratchPad } from "./scratch.js";
import { createGraph, createUnitCircle } from "./helpers.js";

const $ = id => document.getElementById(id);
let problem, solved = false, answered = 0, correct = 0, questionNumber = 0;
let previousSignature = "";

function showError(error) {
  console.error(error);
  const box = $("app-error");
  box.textContent = "Something could not be loaded. Reload this page to try again. If it persists, please report it with the details: " + error.message;
  box.hidden = false;
}
window.addEventListener("error", event => showError(event.error || new Error(event.message)));
window.addEventListener("unhandledrejection", event => showError(event.reason instanceof Error ? event.reason : new Error(String(event.reason))));

function topicOptions() {
  const course = COURSES.find(item => item.id === $("course").value);
  $("topic").replaceChildren(new Option("Mixed practice · all covered topics", "mixed"));
  for (const [id, name] of course.topics) $("topic").append(new Option(name, id));
}

function renderRules(target, rules) {
  target.replaceChildren();
  for (const rule of rules) {
    const name = document.createElement("dt"), statement = document.createElement("dd");
    name.textContent = rule.name; statement.textContent = rule.statement;
    target.append(name, statement);
  }
}

function nextQuestion(moveFocus = false) {
  let next;
  for (let attempts = 0; attempts < 12; attempts++) {
    next = generateProblem($("course").value, $("topic").value);
    const signature = `${next.topic}:${next.expression}:${next.prompt}`;
    if (signature !== previousSignature) { previousSignature = signature; break; }
  }
  problem = next;
  solved = false;
  questionNumber++;
  $("question-topic").textContent = `Calculus ${["I", "II", "III"][Number(problem.course) - 1]} / ${problem.topicName}`;
  $("question-number").textContent = `Dive ${String(questionNumber).padStart(2, "0")}`;
  $("question-heading").textContent = problem.prompt;
  $("question-expression").textContent = problem.expression;
  $("question-note").textContent = problem.note || "Choose one exact answer, then compare your reasoning with the worked steps.";
  $("answers").replaceChildren();
  problem.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.dataset.index = index;
    const letter = document.createElement("span"), copy = document.createElement("span"), formula = document.createElement("span");
    letter.className = "letter"; letter.textContent = "ABCD"[index]; letter.setAttribute("aria-hidden", "true");
    copy.className = "answer-copy"; formula.className = "formula"; formula.textContent = choice.text;
    copy.append(formula); button.append(letter, copy);
    button.setAttribute("aria-label", `Answer ${"ABCD"[index]}: ${choice.text}`);
    button.addEventListener("click", () => answer(index));
    $("answers").append(button);
  });
  $("feedback").replaceChildren();
  $("feedback").removeAttribute("data-state");
  $("solution").hidden = true;
  $("solution").open = false;
  $("solution-rules").replaceChildren();
  $("solution-steps").replaceChildren();
  $("tips").open = false;
  renderRules($("tip-rules"), problem.tips);
  $("reveal").disabled = false;
  $("next").textContent = "Next question →";
  if (moveFocus) $("question-heading").focus({ preventScroll: true });
  const whale = document.querySelector(".whale");
  if (whale.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    whale.animate([{ transform: "translateX(45px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: 600, easing: "ease-out" });
  }
}

function showSolution(selected = null) {
  solved = true;
  $("reveal").disabled = true;
  const buttons = [...$("answers").querySelectorAll("button")];
  for (const [index, button] of buttons.entries()) {
    button.disabled = true;
    if (index === problem.answer || index === selected) {
      const state = document.createElement("span");
      const right = index === problem.answer;
      state.className = "answer-state";
      state.textContent = right ? "✓ Correct answer" : "Your answer";
      button.classList.add(right ? "correct" : "incorrect");
      button.querySelector(".answer-copy").append(state);
      button.setAttribute("aria-label", `${button.getAttribute("aria-label")}. ${state.textContent}`);
    }
  }
  renderRules($("solution-rules"), problem.rules);
  for (const step of problem.steps) {
    const li = document.createElement("li");
    li.textContent = step; $("solution-steps").append(li);
  }
  $("solution").hidden = false;
  $("solution").open = true;
}

function feedback(title, body, state) {
  const heading = document.createElement("strong"), copy = document.createElement("span");
  heading.textContent = title; copy.textContent = body;
  $("feedback").replaceChildren(heading, copy);
  $("feedback").dataset.state = state;
}

function answer(index) {
  if (solved) return;
  answered++;
  const right = index === problem.answer;
  if (right) correct++;
  $("score").replaceChildren(document.createTextNode(`${correct} correct `));
  const span = document.createElement("span"); span.textContent = `/ ${answered} answered`; $("score").append(span);
  showSolution(index);
  feedback(right ? "Nicely reasoned." : "A useful place to learn.", right ? "That’s the correct answer. Follow the worked steps below to check your method." : `${problem.choices[index].reason} The correct answer is ${problem.choices[problem.answer].text}.`, right ? "correct" : "incorrect");
}

function createTimer() {
  let elapsed = 0, startedAt = null, interval = null;
  function render() {
    const seconds = Math.floor((elapsed + (startedAt === null ? 0 : performance.now() - startedAt)) / 1000);
    $("timer").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  $("timer-toggle").addEventListener("click", () => {
    if (startedAt === null) {
      startedAt = performance.now();
      interval = setInterval(render, 250);
      $("timer-toggle").textContent = "Stop timer";
    } else {
      elapsed += performance.now() - startedAt; startedAt = null;
      clearInterval(interval); interval = null;
      $("timer-toggle").textContent = "Start timer";
    }
    render();
  });
  $("timer-reset").addEventListener("click", () => {
    clearInterval(interval); interval = null; elapsed = 0; startedAt = null;
    $("timer-toggle").textContent = "Start timer"; render();
  });
  document.addEventListener("visibilitychange", render);
  render();
}

function themeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("theme-toggle").textContent = dark ? "Light water" : "Dark water";
  $("theme-toggle").setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
}

try {
  if (!["light", "dark"].includes(document.documentElement.dataset.theme)) {
    document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  topicOptions();
  nextQuestion();
  $("course").addEventListener("change", () => { topicOptions(); nextQuestion(); });
  $("topic").addEventListener("change", () => nextQuestion());
  $("next").addEventListener("click", () => nextQuestion(true));
  $("reveal").addEventListener("click", () => {
    if (solved) return;
    showSolution();
    feedback("Study mode · answer revealed", `The answer is ${problem.choices[problem.answer].text}. Read the worked steps, then try a fresh question. This reveal does not count toward your score.`, "study");
  });
  for (const button of document.querySelectorAll("[data-panel]")) {
    button.addEventListener("click", () => {
      const visible = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(visible));
      $(button.dataset.panel).hidden = !visible;
    });
  }
  $("theme-toggle").addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    themeButton();
  });
  themeButton();
  for (const course of COURSES) {
    const heading = document.createElement("h3"), copy = document.createElement("p");
    heading.textContent = course.name;
    copy.textContent = course.topics.map(([, name]) => name).join(" · ");
    $("coverage-list").append(heading, copy);
  }
  createScratchPad();
  createGraph();
  createUnitCircle();
  createTimer();
} catch (error) {
  showError(error);
}
