# Aesthetic direction: Agent-Ready Studio desktop workspace

## Surface

**Target surface:** cross-platform

## Audience and jobs

1. **Primary — multidisciplinary reviewer:** When product work needs a
   decision, I want to understand the proposed artifact, evidence, and lineage
   quickly, so that I can approve it or request a useful revision with
   confidence.
2. **Secondary — product-work author:** When I shape or revise an artifact, I
   want the structure and current status to remain obvious, so that I can focus
   on the work instead of the tool.
3. **Secondary — engineering or operational owner:** When I investigate how a
   proposal was produced, I want exact revisions and normalized run details,
   so that I can diagnose it without making those mechanics the main screen.

## Named goals, ranked

1. Decision clarity
2. Calm command
3. Artifact dignity
4. Progressive depth
5. Semantic continuity

## What each goal means

- **Decision clarity** — the required judgment, current state, and next action
  are legible in one scan. It is violated by dashboards, metrics, or decoration
  that compete with the decision.
  - *Persona:* the primary multidisciplinary reviewer.
  - *Precedent:* Linear's task-state clarity and Stripe Checkout's commitment
    hierarchy; leave their growth and transaction-specific visual language.
  - *Standards:* Nielsen visibility of system status and information scent.
  - *Platform conventions:* desktop navigation, familiar controls, and visible
    keyboard focus remain recognizable across operating systems.
- **Calm command** — restrained hierarchy makes consequential work feel under
  control. It is violated by loud gradients, excessive badges, dense chrome,
  or motion without state meaning.
  - *Persona:* reviewers arriving with limited attention and high decision
    responsibility.
  - *Precedent:* Linear's restraint and Notion's content-first workspace; leave
    keyboard-first exclusivity and blank-canvas ambiguity.
  - *Standards:* Nielsen aesthetic and minimalist design; WCAG 2.2 remains the
    non-negotiable floor.
  - *Platform conventions:* content leads while window chrome and navigation
    remain visually secondary.
- **Artifact dignity** — the work reads like a maintained professional artifact,
  not chat output or a generated transcript. It is violated by terminal motifs,
  prompt-first framing, synthetic vanity data, or cramped reading widths.
  - *Persona:* authors and reviewers who need durable work to outlive a session.
  - *Precedent:* Notion's content-as-structure and editorial reading rhythm;
    leave generic block editing and infinite configurability.
  - *Standards:* Bringhurst-informed readable measure and hierarchy, bounded by
    accessible text and contrast requirements.
  - *Platform conventions:* selectable text, semantic headings, standard form
    controls, and predictable scrolling.
- **Progressive depth** — the artifact and decision stay primary while lineage,
  evidence, change summary, and run diagnostics remain one clear interaction
  away. It is violated by hiding critical evidence or showing raw execution
  detail before purpose and proposal.
  - *Persona:* engineering and operational owners as secondary readers.
  - *Precedent:* Retool's layered inspection and Notion's contextual detail;
    leave dashboard density and generalized database construction.
  - *Standards:* progressive disclosure and Hick's Law.
  - *Platform conventions:* tabs and side regions preserve location and expose
    detail without replacing the work surface.
- **Semantic continuity** — an artifact, review, or execution state keeps the
  same visual identity wherever it appears and across light and dark themes.
  It is violated when a completed execution resembles an accepted artifact,
  when status depends on color alone, or when the same state changes hue from
  one pane to another.
  - *Persona:* every user who follows work from inbox to artifact to decision.
  - *Precedent:* professional review tools that keep state vocabulary stable
    across dense lists and focused detail views; leave ornamental status color
    and activity-first framing.
  - *Standards:* WCAG non-color cues and Nielsen consistency and standards.
  - *Platform conventions:* state labels, shapes, and icons remain legible in
    both system themes and at common desktop zoom levels.

## Spatial character

The application is a neutral, pane-based review workspace. Persistent
navigation sits on a quiet secondary surface; the artifact occupies the
brightest and widest reading surface; review controls use a bounded decision
region. Dividers are intentionally more perceptible than decorative card
borders so adjacent panes remain understandable without heavy shadows.

Use a compact control rhythm for queues and metadata, then relax spacing inside
the artifact body. Corners are modestly rounded. Persistent structure is flat
or lightly lifted; shadow is reserved for transient overlays. Monospace appears
only for exact revision identifiers and run diagnostics.

Color is mostly neutral. A small set of stable semantic accents identifies
decision-needed, revision-requested, accepted, running, and failed states.
Proposal state is visually unmistakable from accepted state, and operational
completion never inherits semantic approval styling.

## Dominant goal for arbitration

**Dominant goal:** Decision clarity

Resolved trade-offs:

- When decision clarity and visual restraint conflict, decision clarity wins;
  status and required action remain explicit even when they add visual weight.
- When artifact reading space and diagnostic detail conflict, artifact dignity
  wins; diagnostics move behind Run Details.
- When density and calm command conflict, calm command wins for the first scan;
  secondary detail remains available through progressive disclosure.
- When theme aesthetics and state recognition conflict, semantic continuity
  wins; status meaning remains stable across themes and surfaces.

## Quality floor

All interactive states include useful empty, loading, error, success, partial,
and unavailable treatments. Controls work by keyboard with visible focus,
meaning never relies on color alone, and motion is omitted unless it explains a
state change; reduced-motion preferences are honored.

Hover-only disclosure is permitted only on devices that actually support
hover; touch and keyboard users retain visible access to the same actions.
Theme changes update the interface as one state rather than animating each
surface independently. Narrow windows and long content preserve access to the
decision controls.

## Open questions

- Brand-specific illustration is intentionally deferred. The walking skeleton
  uses a neutral variable sans-serif with system fallbacks and no decorative
  imagery requirement.
