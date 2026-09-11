# Headful session checklist

The scope owner offered to launch the real Electron application, which this
environment cannot do. The spec's Testing Strategy names headful inspection as the
**preferred** evidence for AC-26 and AC-35 through AC-38; the headless capture in
`notes/visual/` is the fallback it permits, and it is already in place and passing.
So nothing here is blocking — this session upgrades evidence rather than producing
it for the first time.

Everything below was run by the controller up to the exact point a display is
required.

## Launch

```bash
cd <the spec-1 worktree>      # NOT the parent directory that contains it
pnpm install
pnpm dev
```

**The parent directory is a different checkout.** It has its own `package.json`
whose only script is a placeholder `test`, so `pnpm dev` there fails with
`Command "dev" not found`. This slice is uncommitted work in the worktree; run
every command from inside it. `ls` should show `apps/`, `packages/` and
`pnpm-workspace.yaml`.

`pnpm dev` builds the service bundle and the desktop bundles, then starts Electron
against the production build.

It deliberately does **not** run the Vite dev server. The dev server injects an
inline `<script type="module">` for React Refresh, and the shipped CSP is
`script-src 'self'` with no `'unsafe-inline'`, so Chromium blocks it and nothing
mounts — a blank window. The choice was between relaxing the policy in dev, which
would mean proving one CSP and running another, or losing hot reload. Hot reload
lost. Dev and production are now the same path, and it is the path every test and
the retained evidence already cover.

If you would rather look at the production build than the dev server:

```bash
pnpm build
pnpm visual-evidence     # re-captures notes/visual/ headlessly, exits 0 or 1
```

## Reaching something worth looking at

The window opens on **Home** with an empty workspace list. Four steps:

1. Type a workspace name, press **Create workspace**
2. **Seed demo workspace** — creates the "Build Agent-Ready Studio" Initiative and
   its Input Packet. A banner says what it did and what to do next.
3. **Run transformation** — runs `strategy.frame-product-intent` and opens a
   review. The banner says the Product Intent is waiting for a decision.
4. **Open review** on the card that appears under *Needs your decision*

Both setup actions live on **Home only**. They act on Home's content, so they are
not shown on the eight blueprint module surfaces.

You are now in the Work Item Studio. That is the surface the five criteria below
are about.

Note: **Run transformation** only appears in the same session that seeded, because
protocol v1 has no method that lists artifacts and the renderer only learns the
Input Packet revision ID from the seed response. If you restart before running it,
seed again. This is recorded as a follow-on, not a bug to report.

## The five criteria, as questions

**AC-26 — decision clarity.** Without clicking the *Run details* tab, can you see
both the artifact content and what decision is being asked of you? If you have to
open Run details to understand the ask, that fails.

**AC-35 — proposal and accepted labels without colour.** The **Proposal** badge
carries a diamond glyph beside its text. Switch your system appearance between
light and dark. Are Proposal and Accepted still tellable apart, and would they be
if you could not see colour at all? Approve the review to see an Accepted label.

**AC-36 — keyboard focus and accessible names.** Tab through the whole window. Is
the focused control always visibly indicated, including inside the decision panel
and the editor? Any control you land on that gives no visual indication is a
finding. A screen reader pass is welcome but not required — the automated
enumeration already asserts every control has a non-empty accessible name.

**AC-37 — 200% zoom and 1024px width.** Resize the window to about 1024px wide,
then zoom to 200%. Are *Approve and advance* and *Request revision* still reachable
by scrolling in one direction only? Any need to scroll both horizontally and
vertically to reach a decision control fails.

**AC-38 — reduced motion and non-hover input.** Turn on macOS *Reduce motion*
(System Settings → Accessibility → Display). Is every action still present, and is
every state change still understandable from text rather than from movement? Also
try reaching every action without hovering — keyboard only.

## What happens to what you observe

Whatever you report is written into `notes/verification-ledger.md` as evidence with
its date. Anything you do not get to stays an open gap. The offer does not
pre-close any criterion, and a criterion you find failing reopens it regardless of
what the automated assertions say — the rendered result is the authority for these
five.
