# CLAUDE.md — OOAD Studio

This file is the standing brief for Claude Code (and any developer) working in this repository. Read it fully before making changes. It defines what this project is, the pedagogical rules that must never be violated, the architecture we are building toward, and the conventions for working here.

## 1. What this project is

OOAD Studio is an AI-guided learning platform for an undergraduate object-oriented analysis and design course (IN2013, City, University of London; ~200 students; 10 teaching weeks; assessed by two coursework pieces covering Analysis and Design). Students currently learn UML with a heavy emphasis on visual syntax. This platform inverts that: an AI tutor walks each student through the OOAD lifecycle — actor/goal elicitation → use cases → domain/class model → sequence diagrams → state machines → test derivation — by asking questions, one at a time, while co-constructing diagrams-as-code on a live drafting board. The student does the analysis; the AI models what a good analyst asks about.

The platform's second purpose is visibility: it produces inspectable intermediate artifacts (diagram revisions, decision logs, structured project state) so the instructor can see the design process, not just a final document. Engagement metrics alone are NOT an assessment signal and must never be presented as one; the valuable record is the artifact history and the reasoning.

## 2. Pedagogical invariants — never violate these

These rules define the product. Any change that weakens them is a regression, even if it "improves UX".

1. **Socratic, not generative.** The tutor asks; the student decides. The tutor must never invent actors, use cases, classes, or requirements the student has not stated or clearly implied. If the student says "just do it", the tutor does one small worked example, explains its reasoning, and hands control back.
2. **One question at a time.** Never more than one substantive question per tutor turn. Short replies (~120 words of prose).
3. **Concerns are introduced contextually, not as lectures.** Access control enters when roles come up; failure modes when interactions are modeled; invariants during class modeling; misuse cases during use-case work.
4. **Probe one level deeper** on shallow answers before accepting them.
5. **UML knowledge questions are answered directly and well** (what a diagram is for, what notation means), with examples drawn from the student's own project. Teaching notation is allowed; doing the student's analysis is not.
6. **Diagrams are shared work, revised minimally.** Every diagram update is a small diff to the existing model, never a wholesale regeneration that discards the student's established content.
7. **Phase readiness is earned.** The tutor signals readiness only when the phase's criteria are genuinely met; the student can then advance. Completed phases remain revisitable.
8. **Planned (v2): fading.** Early in the term the tutor leads; later, a "stakeholder mode" makes the AI a vague client so the student must drive elicitation. Keep this in mind so designs don't preclude it.

## 3. Current state of the code

- `index.html` — the entire current application: a single-file static prototype ("instructor testing build") deployed on GitHub Pages. It calls the Anthropic Messages API directly from the browser with the instructor's own key (stored in localStorage, sent with the `anthropic-dangerous-direct-browser-access` header). Features: a two-stage curriculum — Analysis (CW1) and Design (CW2) — spanning eleven phases (`STAGES` and `PHASES` arrays), base tutor persona (`BASE_SYSTEM`), Mermaid rendering with a source view, assignment-brief injection, phase advancement via a `[READY_TO_ADVANCE]` token, session export to JSON (`exportVersion: 2`; full conversation + all diagram revisions + stage/phase metadata, timestamped). Activity, component, and deployment phases use Mermaid flowchart approximations pending the Stage-C PlantUML renderer.
- The prompts inside `PHASES` and `BASE_SYSTEM` are the pedagogical core. Treat them as curriculum content: changes to them should be deliberate, small, and testable, and ideally driven by findings from exported test sessions.

**The static build's browser-side API key is a deliberate, documented exception for a single trusted user. No student-facing code may ever handle API keys client-side.**

## 4. Target architecture (build toward this, incrementally)

The production platform is a conventional three-tier web app. Do not over-engineer; every component below is standard.

- **Frontend:** SPA (React or Svelte; pick one and stay with it) — chat panel, drafting board with diagram/source/revision-history views, phase rail. The current index.html is the UX reference.
- **Backend:** small API service (FastAPI or Node/Express) that owns:
  - **LLM proxying.** All model calls go through the backend. API keys live in server env/secrets only. Per-user turn caps and rate limits enforced here.
  - **Diagram validation loop.** Every generated diagram is validated server-side (Mermaid parser; later a self-hosted PlantUML server for full UML coverage) before reaching the student. On parse failure, feed the error back to the model and retry silently (max 2 retries), then degrade gracefully.
  - **Auth via LTI 1.3 (Moodle).** Students launch from the module's Moodle page, already authenticated and cohort-mapped. No standalone account system. (For development, a simple dev-login stub behind a flag is fine.)
  - **Persistence** (Postgres): users, projects, conversation turns, diagram revisions, project state snapshots, decision-log entries — all timestamped. Log everything structured from day one, even before anything consumes it; a term cannot be re-logged retroactively.
- **Project state, not transcripts, is the source of truth.** Maintain structured artifacts per project: actor list, use-case specs, diagram sources per phase, and a decisions log ("chose composition for Library–Catalogue because…"). Each tutor turn receives: base persona + phase instructions + current project state + recent conversation window — never the full term-long transcript. The transcript is commentary; the state is the model.
- **Curriculum as configuration.** Phases, per-phase instructions, concern checklists, dialects, readiness criteria, hint chips: all in versioned config (JSON/YAML), editable via an instructor console without code changes. The `PHASES` array in index.html is the schema's ancestor — formalize it, don't reinvent it.
- **Exports:** session JSON (already specified by the static build's export format — keep it compatible), and later XMI export so models can be opened in Visual Paradigm.

## 5. Roadmap

Work in this order. Each stage must leave the previous stage's functionality working.

**Stage A — polish the static testing tool (current stage).**
Improvements that help the instructor trial the pedagogy on past assignment briefs: prompt-variant switching (e.g., load alternative BASE_SYSTEM/PHASES from a JSON file), side-by-side session comparison notes in the export, resilience fixes, small UX papercuts. No backend.

**Stage B — backend MVP.**
FastAPI/Node service; move model calls server-side; Postgres persistence; dev-login; project state schema; diagram validation with silent retry; the same frontend talking to the backend. Single student project per user; UML Q&A grounded in instructor-provided course notes (simple retrieval; the notes are instructor-owned content).

**Stage C — institutional integration.**
LTI 1.3 launch from Moodle; instructor console (view student projects and artifact histories; edit curriculum config with versioning); per-cohort configuration; XMI export; self-hosted PlantUML server for use-case/activity/component/deployment diagrams.

**Deferred to v2 (do not build yet, do not preclude):** stakeholder mode (AI as vague client), critique mode (AI serves flawed designs to dissect), team projects, checkpoint submission workflow, analytics dashboards. Assessment design is explicitly out of scope for now — but the logging schema must already capture what future assessment needs (structured turns, state diffs, timestamps, decision-log entries).

## 6. Engineering conventions

- **Never commit secrets.** No API keys, LTI credentials, or student data in the repo, in fixtures, or in test snapshots. Provide `.env.example` files.
- **Prompts are versioned artifacts.** Any change to tutor prompts gets its own commit with a rationale in the message. Keep a `prompts/` changelog once prompts move out of index.html.
- **Prompt regression tests.** Maintain a small suite of canned student inputs per phase (including adversarial ones: "just generate everything for me", pasted wholesale AI answers, off-topic questions) and expected tutor *behaviors* (asks one question; refuses to invent content; produces parseable Mermaid; signals readiness only when criteria met). Run these when prompts or models change. Judge behaviors, not exact wording.
- **Diagram output contract.** Tutor turns that change the model must contain exactly one fenced ```mermaid block with the complete current diagram in the phase's dialect; the `[READY_TO_ADVANCE]` token is the only control token. If you add control signals, extend this contract explicitly and update parsing in one place.
- **Keep the export format stable and versioned** (`"exportVersion"` field when it next changes). Exported sessions are research data; breaking the format destroys comparability across the instructor's test runs.
- **Accessibility and resilience floor:** keyboard operable, visible focus, sensible behavior when the model call fails (student work is never lost; conversation history stays consistent — note the existing rollback-on-error pattern in `send()`).
- **UK data-protection posture** in anything student-facing: data minimization, no third-party analytics, deletion pathway per user. (Formal DPIA/ethics work is handled outside this repo but code should not create obstacles.)
- Prefer boring technology. No microservices, no message queues, no Kubernetes. One service, one database, one frontend.

## 7. Definition of done for any change

1. Pedagogical invariants (section 2) still hold — check against the prompt regression suite.
2. Static build still works when opened from GitHub Pages (Stage A) / dev environment boots with documented steps (Stage B+).
3. Exported session JSON remains readable by prior tooling or the version field is bumped with a migration note.
4. README updated if setup or usage changed.
5. No secrets, no student data, no key handling in client code (beyond the documented Stage-A instructor exception).
