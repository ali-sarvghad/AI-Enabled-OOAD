# Prompt regression suite

A small, behaviour-focused safety net for OOAD Studio's **pedagogical
prompts** (`BASE_SYSTEM` and the per-phase `instructions` in `index.html`).
It exists because those prompts are the product — a change that quietly
weakens a pedagogical invariant is a regression even if the app still runs
(see `CLAUDE.md` §2 and §6).

**It judges *behaviours*, not exact wording.** The same run may phrase things
differently each time; what must stay stable is *what the tutor does*: asks
one question, refuses to invent content, declines shortcut requests, cites
sources on knowledge answers, signals readiness only when earned, and so on.

## How it works

- Prompts are **extracted live from `../../index.html`** (the `STAGES`,
  `PHASES`, and `BASE_SYSTEM` definitions), so there is a single source of
  truth and the tests can't drift from the deployed prompts.
- Each scenario in `fixtures.json` supplies a canned (often adversarial)
  student input, an optional prior conversation (`setup`) and current
  diagram (`diagram`) to simulate build-up, and the expected behaviours.
- Two check kinds:
  - **deterministic** — computed in code: `mermaid` block present/absent,
    `[READY_TO_ADVANCE]` present/absent, a `Sources` / `Further reading`
    section present/absent, and a `maxQuestions` cap.
  - **judge** — graded pass/fail by a second model call ("LLM as judge")
    against one plain-English criterion.

## Running

Requires Node 18+ (global `fetch`). No dependencies.

```bash
cd tests/prompt-regression

# 1) Validate wiring without any API calls (assembles every prompt):
node run.mjs --dry

# 2) Grade against a provider (set the matching key):
OOAD_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... node run.mjs
OOAD_PROVIDER=openai    OPENAI_API_KEY=sk-...       node run.mjs
OOAD_PROVIDER=gemini    GEMINI_API_KEY=...          node run.mjs

# Handy flags:
node run.mjs --list                # list scenarios
node run.mjs --filter shortcut     # only ids/phases containing 'shortcut'
OOAD_MODEL=claude-opus-4-8 node run.mjs
```

Exit code is non-zero if any check fails, so this can gate CI later.
See `.env.example` for configuration.

## When to run

Run it whenever you change a tutor prompt (`BASE_SYSTEM` or any phase
`instructions`) or switch default models — exactly the moments a pedagogical
regression can slip in. Because grading uses a model, expect a little
variability run-to-run; a scenario that flips intermittently usually means
the prompt is genuinely borderline on that behaviour. Judge trends, not a
single run.

## Adding scenarios

Add an object to `scenarios` in `fixtures.json`:

```jsonc
{
  "id": "unique-kebab-id",
  "phase": "actors",              // must match a PHASES id in index.html
  "title": "human summary",
  "setup": [                       // optional prior turns (build-up)
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ],
  "diagram": "graph LR\n …",       // optional current diagram source
  "student": "the canned student input",
  "expect": {
    "deterministic": { "mermaid": "none", "maxQuestions": 2, "readyToken": false },
    "judge": [ "A plain-English behaviour the reply must satisfy" ]
  }
}
```

Keep each scenario small and about **one** behaviour. Adversarial inputs
("just do it for me", pasted wholesale answers, off-topic asks) are the most
valuable — they guard the invariants most likely to erode.
