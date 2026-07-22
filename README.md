# OOAD Studio — Research Prototype

An experimental, AI-guided learning environment for object-oriented analysis and design (UML). A Socratic tutor walks a student through the OOAD lifecycle in two stages, mirroring the module's coursework (CW1 Analysis, CW2 Design), co-constructing diagrams-as-code (Mermaid) on a live drafting board, one question at a time. The standard sequence:

- **Analysis (CW1):** Actors & Goals → Use Cases → Activity → Analysis Class (domain model) → Sequence (use-case realization) → State Machine.
- **Design (CW2):** Design Class → Design Sequence → Components → Deployment → Testing.

When an assignment brief is loaded, the phase sequence is **derived from the coursework itself** (see "First run" below): phases the coursework doesn't assess are dropped, catalog extras (e.g. CRC Cards) are pulled in, and custom phases are authored for deliverables outside the catalog.

Each phase opens by explaining *why that diagram exists* and what question it answers, then elicits the model from the student — the tutor never does the analysis for them. (Activity, component, and deployment diagrams have no native Mermaid form and are drawn as flowchart approximations; full UML for them is planned via a server-side PlantUML renderer — see `CLAUDE.md`.)

**This build is the instructor testing tool.** It is a single static page, deployable on GitHub Pages, that calls a chosen AI provider (Anthropic Claude, OpenAI GPT, or Google Gemini) directly from the browser with the instructor's own API key — so the same pedagogy can be trialed and compared across vendors and models. It exists to trial the pedagogy against past coursework briefs before any student-facing platform is built. See `CLAUDE.md` for the full product vision and development roadmap.

## Deploy on GitHub Pages

1. Create a new GitHub repository (public or private — Pages works with both on paid plans; public is simplest).
2. Push these files to the repository root (or upload them via the GitHub web UI):
   - `index.html`
   - `README.md`
   - `CLAUDE.md`
3. In the repository: **Settings → Pages → Build and deployment** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. After a minute, the site is live at `https://<your-username>.github.io/<repo-name>/`.

Any push to `main` redeploys automatically.

## First run

1. Open the deployed page → **☰ Menu → ⚙ Add API key** → **choose your provider** (Anthropic Claude, OpenAI GPT, or Google Gemini). The **☰ Menu** at the top-right holds all the session commands — New session, Open / Save / Save As, diagram image export, Metrics, Assignment brief, a light/dark **theme toggle**, and Settings. (The theme choice is remembered per browser; diagrams re-render to match, while exported diagram images always stay light-on-white for use in documents.)
2. Paste that provider's API key, then click **Load models** — the model list is fetched live from the provider, so you always pick from what your key can actually use. Choose a model and **Save**.
   - Get a key from: Anthropic → https://console.anthropic.com/ · OpenAI → https://platform.openai.com/api-keys · Google (Gemini) → https://aistudio.google.com/apikey. Each provider needs its own credit/quota.
   - A separate key is remembered per provider, so you can switch vendors without re-entering keys. Keys are stored in your browser's localStorage only and are sent only to the provider you select — never to GitHub or anywhere else.
3. Optionally choose **☰ Menu → Assignment brief** to set the intended scope — paste the scenario text, or **upload it as a file** (text, PDF, or an image such as a scanned brief). The tutor grounds its questioning in the brief while still making the "student" do the analysis. **Loading a brief also plans the phases**: the studio reads the coursework (including attached documents) and derives the phase sequence *this* coursework requires — dropping phases it doesn't assess (e.g. Analysis-only courseworks get no Design stage), pulling in catalog extras such as **CRC Cards**, and authoring custom phases (shown with a dashed outline) for deliverables outside the standard set. The plan is saved with the session; with no brief (or no usable plan) the standard eleven-phase sequence applies, and re-saving a changed brief re-plans after confirmation. Once loaded, the **Brief tab** (on the drafting board) shows the whole brief in place: pasted or uploaded text renders as searchable, highlightable prose, and uploaded PDFs and images display right in the tab (PDFs in an embedded viewer — no separate browser tab). Highlights persist and are saved with the session.
4. Attach files in the chat with the **📎 button** — text, PDF, or images. The tutor actually *sees* them (a hand-drawn actor sketch, a PDF spec, a screenshot), so students can bring existing material into the conversation. (Requires a vision/document-capable model — most current flagship models qualify.)
5. Work through the phases as a student would. Use **☰ Menu → Save session** (Ctrl/Cmd+S) at any point to write the run to a JSON file containing the provider, model, full conversation, current diagrams, and every diagram revision with timestamps — useful for comparing runs across briefs, providers, models, or prompt variants. In Chrome/Edge, Save writes back to the same file each time and **Save session as…** (Ctrl/Cmd+Shift+S) picks a new one; in browsers without the File System Access API each save downloads a copy. The file format is the same session JSON, versioned additively (`exportVersion: 4` — v3 added the brief-derived phase plan, v4 the engagement metrics; every earlier field is unchanged), so existing tooling and older exports keep working. (Uploaded images/PDFs are recorded as metadata, not embedded, to keep the files small.)
6. **Resume a saved run** with **☰ Menu → Open session…** (Ctrl/Cmd+O), choosing a session JSON file saved earlier. It restores the transcript, diagrams, brief text, highlights, completed phases, and the phase you left off at, so you can pick a test run back up later — and in Chrome/Edge, Save then writes back to the file you opened. (Because session files store images/PDFs as metadata only, those particular attachments cannot be re-embedded — everything else returns.)

### Working with the drafting board

- **Collapse either panel.** Use the **⟨ / ⟩** buttons in each panel's header to collapse the conversation or the drafting board down to a thin rail so the other fills the width; click the rail to bring it back. Handy for reading a large diagram or focusing on the dialogue.
- **Zoom and pan the diagram.** In the Diagram view, use the **＋ / − / ⟳** controls (bottom-right), the mouse wheel to zoom, and drag to pan. Zoom persists as the tutor revises the diagram within a phase and resets when you move to a new phase.
- **Ask "What is this?" about any diagram element.** Click the **?** button (above the zoom controls), then hover the diagram — the element under the cursor lights up — and click the one you're curious about: a class, an association, a multiplicity, a message, a guard… The tutor explains what that notation is as a UML concept and then what it captures in *this* project's diagram, with the usual Sources and Further-reading links. One answer per click; press **Esc** to leave the mode without asking.
- **Session metrics.** **☰ Menu → 📊 Metrics** shows how the session is being used: total *active* time (idle gaps over 3 minutes and hidden-tab time excluded), a per-phase breakdown (time, student turns, diagram revisions, completion status) with time bars, and counters for student messages, tutor replies, "What is this?" asks, and attached files. Metrics are saved in the session file, so a student resuming a saved session continues their prior totals; New session starts a fresh clock. The numbers are engagement *context*, not an assessment signal — the dialog says so, and the meaningful record remains the artifact history and conversation.
- **Export the diagram as an image.** **☰ Menu → Export diagram as PNG** downloads the current phase's diagram rasterized at 2× on a white background (ready for slides and documents); **Export diagram as SVG** downloads it as a lossless, scalable vector file. Both are re-rendered with SVG-native text labels so they open correctly in Word, Inkscape, and other viewers.

## Testing workflow suggestion

For each past assignment: load the brief → play a *strong* student → export; reset (the brief persists) → play a *weak or lazy* student (short answers, "just do it for me") → export. Comparing the two transcripts against the same brief is the fastest way to find where the tutor's prompts need tightening. The prompts live in `index.html`: the two-stage curriculum in the `STAGES` and `PHASES` arrays (each phase's `instructions` string is its prompt), and the tutor persona in the `BASE_SYSTEM` constant — edit, push, redeploy, re-run.

### Prompt regression suite

`tests/prompt-regression/` holds an automated, behaviour-focused check on those prompts — canned (often adversarial) student inputs graded against expected tutor *behaviours* (asks one question, declines "just do it for me", cites sources on knowledge answers, signals readiness only when earned…). It reads the prompts straight from `index.html`, so it never drifts. Run `node run.mjs --dry` to validate wiring with no API calls, or set a provider key and run it for real. Run it whenever you change a prompt or default model. See `tests/prompt-regression/README.md`.

## Security notes — read before sharing the URL

- **Never commit an API key to this repository.** The key belongs in the browser's settings panel only.
- The deployed page is safe to be public *because it contains no key* — anyone visiting it would need their own key to use it.
- **Do not give this build to students.** A browser-held key pattern is acceptable for one trusted user only. The student-facing platform (see `CLAUDE.md`) proxies all model calls through a backend, where keys, rate limits, and logging live.
- If a key is ever exposed, revoke it immediately in that provider's console (Anthropic / OpenAI / Google AI Studio).
- The three providers' browser endpoints all permit direct key-based calls (Anthropic via an explicit browser-access header, OpenAI and Gemini via CORS). This is fine for one trusted instructor; it is exactly the pattern the production backend removes.

## Cost expectations

A full two-stage run (eleven phases) is typically 40–120 model calls. Costs depend on the provider and model you pick; a flagship chat model (Claude Sonnet, GPT-4o, or Gemini Pro) is roughly the cost of a coffee per several full runs, while the lighter models (Haiku, GPT-4o-mini, Gemini Flash) are much cheaper and fine for quick prompt-iteration loops. Load models per provider to see everything your key can use.
