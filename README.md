# OOAD Studio — Research Prototype

An experimental, AI-guided learning environment for object-oriented analysis and design (UML). A Socratic tutor walks a student through the OOAD lifecycle in two stages, mirroring the module's coursework (CW1 Analysis, CW2 Design), co-constructing diagrams-as-code (Mermaid) on a live drafting board, one question at a time:

- **Analysis (CW1):** Actors & Goals → Use Cases → Activity → Analysis Class (domain model) → Sequence (use-case realization) → State Machine.
- **Design (CW2):** Design Class → Design Sequence → Components → Deployment → Testing.

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

1. Open the deployed page → **☰ Menu → ⚙ Add API key** → **choose your provider** (Anthropic Claude, OpenAI GPT, or Google Gemini). The **☰ Menu** at the top-right holds all the session commands — New session, Import session, Export session, Assignment brief, and Settings.
2. Paste that provider's API key, then click **Load models** — the model list is fetched live from the provider, so you always pick from what your key can actually use. Choose a model and **Save**.
   - Get a key from: Anthropic → https://console.anthropic.com/ · OpenAI → https://platform.openai.com/api-keys · Google (Gemini) → https://aistudio.google.com/apikey. Each provider needs its own credit/quota.
   - A separate key is remembered per provider, so you can switch vendors without re-entering keys. Keys are stored in your browser's localStorage only and are sent only to the provider you select — never to GitHub or anywhere else.
3. Optionally choose **☰ Menu → Assignment brief** to set the intended scope — paste the scenario text, or **upload it as a file** (text, PDF, or an image such as a scanned brief). The tutor grounds its questioning in the brief while still making the "student" do the analysis. Once loaded, the **Brief tab** (on the drafting board) lets the student read, **search**, and **highlight** the brief while they work; highlights persist and are saved in the export.
4. Attach files in the chat with the **📎 button** — text, PDF, or images. The tutor actually *sees* them (a hand-drawn actor sketch, a PDF spec, a screenshot), so students can bring existing material into the conversation. (Requires a vision/document-capable model — most current flagship models qualify.)
5. Work through the phases as a student would. Use **☰ Menu → Export session** at any point to download a JSON file containing the provider, model, full conversation, current diagrams, and every diagram revision with timestamps — useful for comparing runs across briefs, providers, models, or prompt variants. (Uploaded images/PDFs are recorded as metadata, not embedded, to keep exports small.)
6. **Resume a saved run** with **☰ Menu → Import session**, choosing a JSON file exported earlier. It restores the transcript, diagrams, brief text, highlights, completed phases, and the phase you left off at, so you can pick a test run back up later. (Because exports store images/PDFs as metadata only, those particular attachments cannot be re-embedded — everything else returns.)

### Working with the drafting board

- **Collapse either panel.** Use the **⟨ / ⟩** buttons in each panel's header to collapse the conversation or the drafting board down to a thin rail so the other fills the width; click the rail to bring it back. Handy for reading a large diagram or focusing on the dialogue.
- **Zoom and pan the diagram.** In the Diagram view, use the **＋ / − / ⟳** controls (bottom-right), the mouse wheel to zoom, and drag to pan. Zoom persists as the tutor revises the diagram within a phase and resets when you move to a new phase.

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
