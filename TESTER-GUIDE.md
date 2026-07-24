# OOAD Studio — A Guide for Testers

Thanks for helping trial this. **OOAD Studio** is an experimental, AI-guided
learning environment for object-oriented analysis and design (UML). You'll test
it by playing the part of a student: you describe a system, and an AI *tutor*
walks you through modelling it — asking questions, one at a time, while the two
of you build the diagrams together on a live drafting board.

The thing under test is really the **pedagogy** — *how* the AI teaches — not just
whether the software runs. So as you use it, keep asking: *is this how a good
analyst would question a student?* The most useful notes you can send back are
the moments where it does that well, and the moments where it slips.

This guide has four parts:

1. [What the platform does](#1-what-the-platform-does)
2. [The framework the AI works within — what it does and doesn't do](#2-the-framework-the-ai-works-within)
3. [Good to know (limitations & context)](#3-good-to-know)
4. [How to use it, step by step](#4-how-to-use-it)

For deployment, security, and cost details, see [`README.md`](./README.md).

---

## 1. What the platform does

- **Guides you through the OOAD lifecycle in two stages**, mirroring the
  module's coursework — **Analysis (CW1)** then **Design (CW2)** — one phase at a
  time. The standard sequence is:
  - *Analysis:* Actors & Goals → Use Cases → Activity → Analysis Class (domain
    model) → Sequence (use-case realization) → State Machine.
  - *Design:* Design Class → Design Sequence → Components → Deployment → Testing.
- **Builds the model with you on a live drafting board.** Diagrams are written
  as code and drawn as you talk. Every update is a *small edit* to what you've
  already established — it doesn't throw your work away and start over. The board
  renders two kinds of artifact: **diagrams** (Mermaid — class, sequence, state,
  etc.) and **tables** (Markdown — CRC cards, requirements shells, data
  dictionaries).
- **Adapts to an assignment brief.** Paste or upload a coursework brief and the
  tutor (a) grounds its questions in it, and (b) **plans the phase sequence** the
  coursework actually needs — dropping phases it doesn't assess and adding ones
  it does.
- **Lets you shape the phases yourself.** Each stage has a **＋** to add a phase
  for any artifact you name (e.g. *CRC cards*, a *Volere requirements shell*);
  drag phases to reorder; remove ones you added.
- **Answers UML questions on demand**, with cited sources and further-reading
  links, using *your* project as the worked example.
- **Explains any diagram element** — the **"What is this?"** tool lets you click
  a class, arrow, or multiplicity and ask what it means, conceptually and in your
  project.
- **Captures the session** — autosave in the browser, save/open as a JSON file,
  export diagrams as images, and a metrics view. Exported sessions include the
  full conversation and every diagram revision, so runs can be compared.
- **Works with your choice of AI provider** — Anthropic Claude, OpenAI GPT, or
  Google Gemini — using your own API key.

---

## 2. The framework the AI works within

This is the important part. The tutor operates under a fixed set of teaching
rules. Understanding them tells you what "correct" behaviour looks like — and
therefore what a **bug in the pedagogy** looks like.

### ✅ The tutor is designed to…

- **Ask one question at a time**, and keep its replies short. You lead the
  thinking; it guides.
- **Make *you* do the analysis.** You propose the actors, classes, and
  decisions; the tutor questions and refines them.
- **Open each phase by explaining *why*** that diagram exists and what question
  it answers — before asking anything.
- **Build the diagram from what you actually say**, and change it minimally,
  keeping everything you've established.
- **Probe one level deeper** when you give a shallow answer, before accepting it.
- **Raise professional concerns *in context*, as questions** — access control
  when roles come up, failure modes when you model interactions, invariants
  during class modelling, misuse cases during use cases — never as a lecture.
- **Answer genuine UML knowledge questions directly and well**, with a short
  **Sources** section and 2–3 **Further reading** links, illustrated with your
  own project.
- **Signal a phase is ready to advance only when its criteria are truly met** —
  then let you advance, and let you revisit earlier phases anytime.

### 🚫 The tutor is designed *not* to…

- **Invent content you didn't give it.** It won't make up actors, use cases,
  classes, or requirements you haven't stated or clearly implied.
- **Do the assignment for you.** Ask it to *"just draw the whole diagram"* or
  *"do it all for me"* and it will gently decline, explain the learning goal, and
  steer back to the next question. (It may show *one small* worked example — but
  only after you've already done substantial work in that phase, never as a way
  to hand you an artifact you didn't build.)
- **Ask several questions at once, or lecture** you with walls of text.
- **Regenerate a diagram from scratch** and discard what you built.
- **Signal readiness early just to be encouraging.**
- **Grade or assess you.** The metrics view is engagement *context* only — it is
  deliberately *not* a mark, and shouldn't be read as one.
- **Fabricate links or sources.**

### 🧪 How to test the framework — try to break it

Some deliberately awkward things to try, and what *should* happen:

| You do… | The tutor should… |
|---|---|
| "Just generate the complete use-case diagram for me." | Decline warmly, explain why, ask the next real question. |
| Paste a big wholesale AI-written answer as if it's yours. | Not simply accept it — probe it, make you justify it. |
| Give lazy one-word answers. | Dig one level deeper rather than move on. |
| Ask to skip ahead / jump to Design. | Keep you on the current phase until it's genuinely ready. |
| Ask a real UML question ("what's an «include»?"). | Answer directly, with Sources + Further reading. |
| Go off-topic. | Gently redirect to the modelling task. |

If any of these go the *wrong* way, that's exactly the kind of finding worth
reporting.

---

## 3. Good to know

A few honest points about what this build is and isn't:

- **It's an instructor testing tool, not the student platform.** You use your own
  API key, which is stored **only in your browser** and sent only to the provider
  you pick. Please don't hand this build to students, and don't share a link that
  has your key in it (the key never travels in the URL — but the point stands:
  the key is yours).
- **There's no backend yet.** Every AI call goes straight from your browser to
  the provider. One visible consequence: occasionally the tutor may produce a
  diagram that doesn't render — you'll see a small note, and you can ask it to fix
  the diagram or hand-edit it in the **Source** tab. In the production platform
  this is validated and silently retried server-side, so students won't see it.
- **Some diagrams are approximations.** Use-case, activity, component, and
  deployment diagrams are drawn with a close Mermaid stand-in; full UML for those
  is planned via a server-side renderer later. Class, sequence, and state
  diagrams, and the table artifacts, are native.
- **Your data stays local.** Work is autosaved in your browser and to any file
  you save; there's no third-party analytics.
- **It uses real API credit.** A full two-stage run is roughly tens of model
  calls, so make sure your provider account has quota. Lighter models are much
  cheaper and fine for quick trials.

---

## 4. How to use it

**1. Open the link** your colleague sent you (the deployed page).

**2. Add your API key.** Top-right **☰ Menu → ⚙ Settings** → pick a provider →
paste your key → **Load models** → choose a model → **Save**. Get a key from:
- Anthropic — <https://console.anthropic.com/>
- OpenAI — <https://platform.openai.com/api-keys>
- Google (Gemini) — <https://aistudio.google.com/apikey>

**3. (Optional but recommended) Load an assignment brief.** **☰ Menu →
Assignment brief** → paste the scenario text or upload it (text, PDF, or an
image). The tutor will ground its questions in the brief and plan the phases the
coursework needs. You can also read, search, and highlight the brief in the
**Brief** tab on the board.

**4. Start the conversation.** In a sentence or two, tell the tutor what your
system should do and for whom. Then simply answer its questions — it will take it
from there, one step at a time. (No brief? Just start describing a system; a
library, a booking app, and an online shop all work well.)

**5. Watch the board build as you talk.** On the right:
- **Diagram / Source / Brief** tabs switch the board view. The **Source** tab is
  editable if you want to tweak the artifact by hand.
- **Hint chips** under the chat suggest questions you can ask.
- **Zoom / pan** with the on-board controls, the mouse wheel, or by dragging.
- **"What is this?"** (the **?** button) lets you click any diagram element and
  ask what it means.
- Attach files to the chat with **📎** — the tutor can actually see a sketch,
  PDF, or screenshot (needs a vision-capable model).

**6. Shape the phases if you like.** Use the **＋** at the end of a stage to add a
phase for any artifact you name, **drag** pills to reorder them, and **×** to
remove ones you added.

**7. Advance when you've earned it.** When a phase's goals are met, a
**"Ready to advance"** prompt appears. You can also click any earlier phase's pill
to revisit it.

**8. Save and review your run.** **Ctrl/Cmd+S** (or **☰ Menu → Save session**)
writes the whole run — conversation, diagrams, revisions — to a JSON file;
**Ctrl/Cmd+O** reopens one. Export a diagram image or open **📊 Metrics** from the
menu. Your work also autosaves in the browser between visits.

### What to send back

The most useful feedback names specific moments. When something feels off, jot
down:

- **Where the tutor broke a rule** from section 2 (invented content, asked two
  questions at once, caved to "do it for me", lectured, signalled readiness too
  early…).
- **Where a diagram was wrong or didn't render.**
- **Where the questioning was genuinely good** — the questions that made you
  think. These matter as much as the failures.
- Which **provider and model** you used, and (if you can) **the exported session
  JSON** for the run — it captures everything needed to reproduce what you saw.

Thank you — this is exactly the kind of trial that makes the tutor better.
