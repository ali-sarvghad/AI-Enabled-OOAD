# OOAD Studio — Research Prototype

An experimental, AI-guided learning environment for object-oriented analysis and design (UML). A Socratic tutor walks a student through six phases — Actors & Goals → Use Cases → Class Diagram → Sequence → States → Testing — co-constructing diagrams-as-code (Mermaid) on a live drafting board, one question at a time.

**This build is the instructor testing tool.** It is a single static page, deployable on GitHub Pages, that calls the Anthropic API directly from the browser with the instructor's own API key. It exists to trial the pedagogy against past coursework briefs before any student-facing platform is built. See `CLAUDE.md` for the full product vision and development roadmap.

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

1. Get an Anthropic API key from https://console.anthropic.com/ (Settings → API keys) and add credit to the account.
2. Open the deployed page → **⚙ Add API key** → paste the key → Save.
   The key is stored in your browser's localStorage only. It is sent only to `api.anthropic.com`, never to GitHub or anywhere else.
3. Optionally click **Assignment brief** and paste a past coursework scenario (e.g., a CW1 brief). The tutor grounds its questioning in the brief while still making the "student" do the analysis.
4. Work through the phases as a student would. Use **Export session** at any point to download a JSON file containing the full conversation, the current diagrams, and every diagram revision with timestamps — useful for comparing runs across briefs, models, or prompt variants.

## Testing workflow suggestion

For each past assignment: load the brief → play a *strong* student → export; reset (the brief persists) → play a *weak or lazy* student (short answers, "just do it for me") → export. Comparing the two transcripts against the same brief is the fastest way to find where the tutor's prompts need tightening. The prompts live in `index.html` in the `PHASES` array and `BASE_SYSTEM` constant — edit, push, redeploy, re-run.

## Security notes — read before sharing the URL

- **Never commit an API key to this repository.** The key belongs in the browser's settings panel only.
- The deployed page is safe to be public *because it contains no key* — anyone visiting it would need their own key to use it.
- **Do not give this build to students.** A browser-held key pattern is acceptable for one trusted user only. The student-facing platform (see `CLAUDE.md`) proxies all model calls through a backend, where keys, rate limits, and logging live.
- If a key is ever exposed, revoke it immediately in the Anthropic console.

## Cost expectations

A full six-phase run is typically 30–80 model calls. With the default model (Sonnet), expect roughly the cost of a coffee per several full runs; the cheaper Haiku option in Settings is fine for quick prompt-iteration loops, and Opus is available when you want to see the ceiling.
