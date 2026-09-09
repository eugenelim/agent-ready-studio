# Design system direction

This taxonomy translates the ranked goals in
[aesthetic-direction.md](aesthetic-direction.md) into roles. Concrete CSS
values are implementation choices checked against these roles and the WCAG 2.2
quality floor.

## Organizing ratio

Use one close modular ratio for both spacing and type. A close ratio supports
Calm command: hierarchy is clear without dramatic jumps. Each scale exposes
symbolic steps `-2`, `-1`, `base`, `+1`, `+2`, and `+3`; consumers use semantic
aliases rather than scale positions directly.

## Token taxonomy

- **Surface:** canvas, navigation, artifact, raised, inset, interactive, and
  decision-emphasis roles. A workspace may use several adjacent panes, so
  navigation, reading, and review surfaces receive separate semantic roles
  instead of relying on ad hoc shades.
- **Content:** primary, secondary, muted, inverse, link, positive, warning,
  critical, and focus roles.
- **Border:** subtle, default, split-divider, split-divider-strong, status, and
  focus roles. Split dividers must remain perceivable against artifact surfaces
  at rest, not only while dragging or hovering.
- **Spacing:** inline-tight, inline, control, cluster, section, region, and
  reading roles derived from the shared scale.
- **Type:** label, metadata, body, artifact-body, section-title, page-title, and
  display roles derived from the shared scale.
- **Shape:** control, panel, card, and pill roles.
- **Elevation:** flat, raised, overlay, and focus roles. Elevation does not
  replace borders or labels as the only state signal.
- **Motion:** instant, state-change, and progress roles. Reduced-motion maps
  every non-instant role to an information-preserving instant transition.

Semantic tokens serialize using the W3C Design Tokens group/token shape. CSS
custom properties are the first renderer projection.

The renderer maps semantic roles such as `surface.artifact`,
`content.secondary`, `status.decisionNeeded`, and `border.splitDivider` to CSS
variables. Components consume those roles; they do not select raw palette
values. Light and dark themes preserve each role's meaning, including status
identity, rather than mechanically inverting colors.

## Product state vocabulary

Operational and semantic states use separate token families so activity never
looks like approval:

- **Artifact state:** draft, proposed, accepted, rejected, and superseded.
- **Review state:** decision-needed, revision-requested, and resolved.
- **Execution state:** queued, running, completed, and failed.
- **Attention state:** informative, caution, and critical.

Each state combines a label, icon or shape, and color. Status hues remain
recognizable across themes. Proposal and acceptance use deliberately different
visual treatments; a completed execution does not borrow the accepted-state
treatment.

## Typography and density

Use a neutral variable sans-serif for interface and artifact reading, with a
system fallback stack. Reserve monospace for revision identifiers, protocol
details, timestamps that benefit from tabular alignment, and diagnostic run
data. The default density is compact enough for a review queue but gives the
artifact center column a generous reading measure and section rhythm.

Controls share a small set of height, radius, and padding variants. Rounded
forms communicate grouping without making every region look like a floating
card. Prefer borders and subtle surface shifts for persistent structure; use
shadow mainly for transient overlays.

## Contrast budget

The strongest contrast belongs to the artifact title, proposal-versus-accepted
status, and the required decision. Navigation and diagnostic metadata use less
contrast while remaining readable. Color always has a text or shape companion.

## Atomic composition

The first slice defines reusable Button, StatusBadge, Panel, EmptyState, Field,
Tabs, and RevisionLink patterns only when used by at least two real surfaces.
Review Inbox and Work Item Studio compose those patterns and do not introduce
one-off visual values.

Primitives follow accessible headless interaction contracts and expose a small
variant API. A class-composition helper may join semantic utility classes, but
component state remains explicit in typed props. Host-known renderer and editor
identifiers choose compositions; arbitrary extension code cannot inject new
privileged UI.

## Interaction and theme rules

- Hover-revealed actions remain visible on devices without hover capability.
- Keyboard focus is always visible and is never represented by color alone.
- Theme changes disable decorative transitions during the variable swap so
  surfaces change as one coherent state.
- Reduced-motion preferences remove spatial or decorative movement while
  preserving progress and completion information.
- Pane resizing, narrow windows, long artifact titles, and long reviewer
  comments must not force decision controls off-screen.
- Diagnostic run details use an inset, secondary surface and never compete with
  the proposed artifact or required decision.
