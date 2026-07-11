#!/usr/bin/env node
/* OOAD Studio — prompt regression runner (CLAUDE.md §6).
 *
 * Feeds canned student inputs through the REAL BASE_SYSTEM + phase prompts
 * (extracted from ../../index.html, so there is one source of truth) and
 * judges the tutor's BEHAVIOUR — not exact wording.
 *
 * Two kinds of check per scenario:
 *   - deterministic: computed in code (mermaid block present? readiness
 *     token? Sources section? number of questions?)
 *   - judge: graded pass/fail by a second model call ("LLM as judge")
 *
 * Usage:
 *   OOAD_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... node run.mjs
 *   OOAD_PROVIDER=openai    OPENAI_API_KEY=sk-...       node run.mjs
 *   OOAD_PROVIDER=gemini    GEMINI_API_KEY=...          node run.mjs
 *   node run.mjs --dry                 # assemble + validate, no API calls
 *   node run.mjs --filter shortcut     # only scenarios whose id contains 'shortcut'
 *   node run.mjs --list                # list scenarios and exit
 *   OOAD_MODEL=claude-sonnet-5 node run.mjs   # override the model
 *
 * Exit code is non-zero if any check fails (so it can gate CI later).
 * Requires Node 18+ (global fetch). No dependencies.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(__dirname, "..", "..", "index.html");
const FIXTURES = join(__dirname, "fixtures.json");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(name + "="));
  if (hit) return hit.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1];
  return dflt;
};

const DRY = has("--dry");
const LIST = has("--list");
const FILTER = opt("--filter", "");
const PROVIDER = opt("--provider", process.env.OOAD_PROVIDER || "anthropic");
const DEFAULT_MODEL = { anthropic: "claude-sonnet-5", openai: "gpt-4o", gemini: "gemini-1.5-pro" };
const MODEL = opt("--model", process.env.OOAD_MODEL || DEFAULT_MODEL[PROVIDER]);
const KEY_ENV = { anthropic: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", gemini: "GEMINI_API_KEY" };
const KEY = process.env[KEY_ENV[PROVIDER]] || "";

/* ---------- extract prompts from index.html (single source of truth) ---------- */

function extractCurriculum() {
  const html = readFileSync(INDEX_HTML, "utf8");
  const start = html.indexOf("const STAGES = [");
  const end = html.indexOf("/* ---------------- State & persistence");
  if (start < 0 || end < 0 || end < start) throw new Error("Could not locate STAGES/PHASES/BASE_SYSTEM in index.html");
  const slice = html.slice(start, end);
  // The slice is pure data (STAGES, PHASES, a comment, BASE_SYSTEM) with no DOM use.
  const fn = new Function(slice + "\nreturn { STAGES, PHASES, BASE_SYSTEM };");
  return fn();
}

// Mirror index.html's systemPrompt() exactly (minus the optional brief).
function buildSystemPrompt({ STAGES, PHASES, BASE_SYSTEM }, phaseId, currentDiagram) {
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase) throw new Error("Unknown phase id: " + phaseId);
  const stage = STAGES.find((s) => s.id === phase.stage);
  let sp = BASE_SYSTEM;
  sp += "\n\n---- CURRENT STAGE ----\n" + stage.label + " (" + stage.cw + ") — " + stage.blurb +
    "\n\n---- CURRENT PHASE ----\n" + phase.instructions +
    "\nMermaid dialect for this phase: " + phase.dialect +
    "\n\n---- CURRENT DIAGRAM SOURCE (revise minimally; keep all established content) ----\n" +
    (currentDiagram ? currentDiagram : "(none yet)");
  return sp;
}

/* ---------- provider adapters (chat only; text in/out) ---------- */

async function providerError(r) {
  const e = await r.json().catch(() => ({}));
  return new Error((e.error && (e.error.message || e.error.status)) || "HTTP " + r.status);
}

const CHAT = {
  async anthropic(system, messages) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1600, system, messages })
    });
    if (!r.ok) throw await providerError(r);
    const d = await r.json();
    return d.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  },
  async openai(system, messages) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: system }, ...messages], max_completion_tokens: 1600 })
    });
    if (!r.ok) throw await providerError(r);
    const d = await r.json();
    return d.choices[0].message.content || "";
  },
  async gemini(system, messages) {
    const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent?key=" + encodeURIComponent(KEY), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 1600 } })
    });
    if (!r.ok) throw await providerError(r);
    const d = await r.json();
    const c = d.candidates && d.candidates[0];
    if (!c || !c.content) throw new Error("No response (finish: " + (c && c.finishReason) + ")");
    return (c.content.parts || []).map((p) => p.text || "").join("");
  }
};

/* ---------- deterministic checks ---------- */

const stripMermaid = (t) => t.replace(/```mermaid[\s\S]*?```/g, "");
const mermaidCount = (t) => (t.match(/```mermaid/g) || []).length;
const hasReady = (t) => /\[READY_TO_ADVANCE\]/.test(t);
const questionCount = (t) => (stripMermaid(t).match(/\?/g) || []).length;
const hasSection = (t, name) => new RegExp("(^|\\n)\\s*(\\*\\*|#{1,4}\\s*)?" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t);

function deterministicChecks(det, reply) {
  const results = [];
  if (!det) return results;
  const add = (name, pass, detail) => results.push({ kind: "det", name, pass, detail });
  if (det.mermaid === "none") add("no mermaid block", mermaidCount(reply) === 0, mermaidCount(reply) + " found");
  if (det.mermaid === "one") add("exactly one mermaid block", mermaidCount(reply) === 1, mermaidCount(reply) + " found");
  if (det.readyToken === false) add("no [READY_TO_ADVANCE]", !hasReady(reply));
  if (det.readyToken === true) add("has [READY_TO_ADVANCE]", hasReady(reply));
  if (typeof det.maxQuestions === "number") add("<=" + det.maxQuestions + " question(s)", questionCount(reply) <= det.maxQuestions, questionCount(reply) + " '?'");
  if (det.sourcesSection === true) add("has Sources section", hasSection(reply, "Sources"));
  if (det.sourcesSection === false) add("no Sources section", !hasSection(reply, "Sources"));
  if (det.furtherReading === true) add("has Further reading", hasSection(reply, "Further reading"));
  if (typeof det.minLinks === "number") {
    const links = (reply.match(/https?:\/\//g) || []).length;
    add(">=" + det.minLinks + " clickable link(s)", links >= det.minLinks, links + " URL(s)");
  }
  return results;
}

/* ---------- judge (LLM-as-judge) ---------- */

const JUDGE_SYSTEM =
  "You are grading an AI tutor's single reply against ONE behavioural criterion. " +
  "Judge only the criterion, not style or wording. Be strict but fair. " +
  'Respond with ONLY a JSON object: {"pass": true|false, "reason": "<one short sentence>"}.';

async function judge(reply, criterion) {
  const user = "CRITERION:\n" + criterion + "\n\nTUTOR REPLY:\n\"\"\"\n" + reply + "\n\"\"\"";
  const raw = await CHAT[PROVIDER](JUDGE_SYSTEM, [{ role: "user", content: user }]);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { pass: false, reason: "judge did not return JSON: " + raw.slice(0, 80) };
  try { const o = JSON.parse(m[0]); return { pass: !!o.pass, reason: o.reason || "" }; }
  catch { return { pass: false, reason: "judge JSON parse error" }; }
}

/* ---------- runner ---------- */

const C = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", dim: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const mark = (p) => (p ? C.g + "PASS" + C.x : C.r + "FAIL" + C.x);

async function main() {
  const curriculum = extractCurriculum();
  const fixtures = JSON.parse(readFileSync(FIXTURES, "utf8"));
  let scenarios = fixtures.scenarios;
  if (FILTER) scenarios = scenarios.filter((s) => s.id.includes(FILTER) || s.phase.includes(FILTER));

  console.log(`${C.b}OOAD Studio — prompt regression${C.x}`);
  console.log(`${C.dim}provider=${PROVIDER} model=${MODEL} scenarios=${scenarios.length}${DRY ? " (DRY RUN)" : ""}${C.x}\n`);

  if (LIST) { scenarios.forEach((s) => console.log(`  ${s.id}  ${C.dim}[${s.phase}] ${s.title}${C.x}`)); return; }

  // Validate wiring in dry mode: assemble prompts, confirm fixtures resolve.
  if (DRY) {
    let ok = true;
    for (const s of scenarios) {
      try {
        const sp = buildSystemPrompt(curriculum, s.phase, s.diagram);
        const nJudge = (s.expect.judge || []).length;
        const nDet = Object.keys(s.expect.deterministic || {}).length;
        console.log(`  ${C.g}✓${C.x} ${s.id} ${C.dim}(system prompt ${sp.length} chars · ${nDet} det + ${nJudge} judge checks)${C.x}`);
      } catch (e) { ok = false; console.log(`  ${C.r}✗${C.x} ${s.id}: ${e.message}`); }
    }
    console.log(`\n${C.dim}Dry run only — set ${KEY_ENV[PROVIDER]} and drop --dry to grade against the model.${C.x}`);
    process.exit(ok ? 0 : 1);
  }

  if (!KEY) { console.error(`${C.r}Missing ${KEY_ENV[PROVIDER]} in env.${C.x} Set it, or use --dry.`); process.exit(2); }

  let totalChecks = 0, failedChecks = 0, erroredScenarios = 0;

  for (const s of scenarios) {
    const system = buildSystemPrompt(curriculum, s.phase, s.diagram);
    const messages = [...(s.setup || []), { role: "user", content: s.student }];
    console.log(`${C.b}▶ ${s.id}${C.x} ${C.dim}[${s.phase}] ${s.title}${C.x}`);
    let reply;
    try { reply = await CHAT[PROVIDER](system, messages); }
    catch (e) { erroredScenarios++; console.log(`  ${C.r}ERROR calling model:${C.x} ${e.message}\n`); continue; }

    const det = deterministicChecks(s.expect.deterministic, reply);
    const judged = [];
    for (const crit of s.expect.judge || []) judged.push({ kind: "judge", name: crit, ...(await judge(reply, crit)) });

    for (const c of [...det, ...judged]) {
      totalChecks++;
      if (!c.pass) failedChecks++;
      const detail = c.detail ? ` ${C.dim}(${c.detail})${C.x}` : "";
      const reason = c.reason ? ` ${C.dim}— ${c.reason}${C.x}` : "";
      console.log(`  ${mark(c.pass)} ${c.kind === "det" ? "" : C.dim + "judge: " + C.x}${c.name}${detail}${reason}`);
    }
    console.log(`  ${C.dim}reply: ${reply.replace(/\s+/g, " ").slice(0, 100)}…${C.x}\n`);
  }

  console.log(`${C.b}Summary:${C.x} ${totalChecks - failedChecks}/${totalChecks} checks passed` +
    (erroredScenarios ? `, ${C.r}${erroredScenarios} scenario(s) errored${C.x}` : ""));
  process.exit(failedChecks === 0 && erroredScenarios === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
