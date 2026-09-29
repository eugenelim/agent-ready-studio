# Spec: Acceptance audit citation anchors

- **Status:** Shipped
- **Owner:** Agent-Ready Studio maintainers
- **Plan:** [`plan.md`](plan.md)
- **Constrained by:** none
- **Brief:** none
- **Discovery:** none
- **Contract:** none
- **Shape:** service

> **Spec contract:** this document defines what "done" means. The implementing
> PR must match this spec, or update it. Verification must be derivable from it.
>
> **Not every section is contract.** `Boundaries`, `Testing Strategy` and
> `Acceptance Criteria` are what a completion gate reads, and an amendment
> changes them. `Objective`, `Durable Outputs`, `Follow-ons` and `Assumptions`
> are working material.

## Objective

Acceptance-audit authors can bind a code citation to the text that proves its
criterion. The governance gate rejects a binding when its anchor moves outside
the cited span, when an anchored citation cannot be checked independently, or
when a met criterion relies on a bare line number.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Governance rule | Citation parsing and checking are repository controls | `tools/acceptance-audit-counts.py` | Tooling maintainer | Self-test cases with positive and negative controls | Every accepted and refused form has a discriminating self-test |
| Governing acceptance record | The Connect and Orient verdict table is the first consumer of the stricter rule | `docs/specs/connect-and-orient/notes/acceptance-audit.md` | Connect and Orient maintainers | The audit check and drift mutation proof | Every met-row binding is anchored and the audit check is green |
| Verification record | Full-mode work needs stable closeout evidence | `docs/specs/acceptance-audit-citation-anchors/notes/verification-ledger.md` | Work-loop implementer | Gate results, mutation result, and known host limitation | Close-work reconciles every criterion and records any unresolved gap |

## Boundaries

### Always do

- Keep bare citations valid for `not met` and `not verifiable here` rows.
- Add a positive and a negative self-test for every new rejection rule.
- Recompute an edited citation from the subject's current code span rather than
  applying a line-number offset.

### Ask first

- Expanding the anchor requirement beyond `met` rows needs owner approval.
- Changing any other registered backlog obligation needs owner approval.
- Changing a public protocol or a pinned dependency-build decision needs its
  governing approval and runtime evidence.

### Never do

- Do not add a dependency or a new module boundary for this checker change.
- Do not modify `contracts/` or
  `docs/specs/product-development-walking-skeleton/`.
- Do not rewrite a contemporaneous verification-ledger entry; add a forward
  correction with a pointer when one is needed.
- Do not change the `better-sqlite3`, `esbuild`, or `electron` build decisions
  in `pnpm-workspace.yaml`.

## Testing Strategy

- **TDD (AC-0001, AC-0002, AC-0003, AC-0004, AC-0005):** extend
  `_self_test_citations` with paired accepted and refused fixture rows. Each
  negative case names the expected diagnostic so a checker that rejects every
  anchored citation cannot pass.
- **Goal-based check (AC-0006, AC-0007, AC-0008):** run the checker against the
  governing audit; reproduce the frozen c6c45ef ten-line-prefix probe to fix the
  surviving set; then run a span-sized prefix mutation over the eighteen
  post-split citations AC-0006 derives from it. The
  ordinary audit check proves the checked tree resolves; the span-sized mutation
  runs the real checker over the real resolved file, so it catches a miscounted
  occurrence, a wrongly resolved file, or an anchor a hand count missed.
  **Why the mutation is sized per binding, stated once here:** a prefix shifts an
  anchor down by its own length, so a fixed ten-line prefix moves an anchor out
  of its span only when the anchor sits in that span's last ten lines. Most of
  these spans are far longer than ten lines, so a fixed prefix cannot reach
  them. A prefix one line longer than the cited span reaches every file-unique
  anchor, because the anchor's one occurrence moves below the cited range. It
  reaches the single non-unique exception through the extra condition AC-0006
  puts on that anchor.

## Acceptance Criteria

- [x] **AC-0001.** A citation anchor accepts the complete tokens
  <code>AC&#45;0136</code>,
  `package-script.mjs`, `filter=probe`, `escaping-symlink`, `.gitmodules`, and
  `STUDIO_PROBE_LOG`, and leaves the bare `file.ts:12-14` form valid.

  An anchor is built from letters, digits, underscore, dot, hyphen, and equals.
  It ends only at one of the delimiters that legitimately close a citation in
  an acceptance audit's Bindings column: whitespace, the table cell delimiter <code>&#124;</code>, the
  citation separator `;`, the code-span backtick, the emphasis marker `*`, a
  comma, and the brackets `(`, `)`, `[`, `]`, `{`, `}`, `<`, and `>`. Those
  fourteen are the cases that carry self-tests. Any **other** character outside
  the token set — a colon or a quote, say — does not end the anchor: it is read
  as part of it and the anchor is then refused with a diagnostic, because
  silently truncating an anchor at an unexpected character is the fallback this
  criterion exists to prevent.
  **Underscore is part of the anchor and never ends it** — Markdown also treats
  `_` as an emphasis marker, and reading it as a terminator would truncate
  `STUDIO_PROBE_LOG` to `STUDIO`, which the containment check would then pass on
  the wrong text. A citation written inside a code span or a bold run therefore
  carries an anchor like any other.

  An anchor may not end in a dot, hyphen, or equals: a trailing separator is the
  sentence's punctuation rather than part of the name, and is refused with a
  diagnostic instead of being checked as the wrong text.

  Each of the fourteen delimiters carries a self-test showing the anchor ends
  there and the text after it is not read in. The two refusal rules — a
  character outside the token set read into the anchor, and an anchor ending in
  a dot, hyphen, or equals — each carry a paired accepted and refused case, the
  refused half naming its own diagnostic.
- [x] **AC-0002.** An anchored citation containing more than one line-spec part
  is rejected, while separate single-part anchored citations are each checked
  against their own span.
- [x] **AC-0003.** A single-part anchored citation passes when its complete
  anchor occurs in the cited span and fails when that anchor is absent.
- [x] **AC-0004.** An anchored citation that does not resolve to exactly one
  repository file is rejected, while an otherwise identical path-qualified
  citation is checked against the resolved file.
- [x] **AC-0005.** Every citation in a `met` row is anchored; a bare citation in
  that row is rejected, while bare citations remain valid in the other two
  verdict classes.
- [x] **AC-0006.** The frozen c6c45ef ten-line-prefix probe left sixteen
  anchored bindings green. Two of those cite more than one span, so splitting
  them yields **eighteen single-part citations**, and those eighteen are what
  this criterion and AC-0007 bind. Each uses a replacement anchor whose text
  occurs exactly once in its resolved file, counted the way the checker
  matches — as a plain substring of the file's text, not as a whole token. One
  cited span contains no file-unique token; that is the single permitted
  exception, and the verification ledger names it with its span, its
  subject-bearing anchor, and that anchor's occurrence count. Because that
  anchor is not file-unique, it carries one further condition: it must not occur
  anywhere in the span-length block that begins one prefix-length above the
  span's first line. That block is exactly what AC-0007's mutation puts inside
  the cited range, and a file-unique anchor satisfies the condition already.
- [x] **AC-0007.** After its replacement anchor is applied, each of the
  eighteen citations AC-0006 covers — the exception included — is reported
  stale by this mutation: prepend to the citation's resolved file one line more
  than its cited span is long, each of them the text `// mutation`, then run the
  checker. Prepending shifts the file down, so the cited range then holds the
  span-length block that began one prefix-length above the span — the block
  AC-0006's extra condition keeps the exception's anchor out of.

  Reported stale means the checker's anchor-containment diagnostic, the one
  reading `no longer contains <anchor> — the citation moved off its anchor`.
  The blank-or-bracket start-line diagnostic does not satisfy this criterion:
  it fires ahead of the containment check and would pass without the anchor
  ever being tested.
- [x] **AC-0008.** The governing Connect and Orient acceptance audit passes the
  citation checker with every `met` binding anchored, every anchored binding
  single-part, and every anchored file reference uniquely resolvable.

## Follow-ons

- Requiring anchors on verdicts other than `met` remains with the Agent-Ready
  Studio maintainers under the registered backlog process.

## Assumptions

- Technical, verified at c6c45ef: the audit contains 404 citations across 157
  rows; 44 are anchored and 360 are bare. The current verdict derivation is 95
  met, 58 not met, and 4 not verifiable here.
- Technical, verified by the ten-line-prefix probe at c6c45ef and reproduced on
  2026-09-28: sixteen anchored bindings remain green under that probe because a
  common token still occurs somewhere in the cited span. For three of them the
  subject itself left the span; for the other thirteen the span is long enough
  that a ten-line shift keeps the subject inside it. Testing Strategy states why
  the proof mutation is sized to the span.
- Technical, verified in `tools/governance-gate.mjs`: governance runs the
  citation self-test before checking each acceptance audit.
- Technical, verified against the tree at `f78522b`: the resolver still skips a
  bare ambiguous shorthand, which the two non-`met` verdict classes allow. The
  anchored ambiguous instance — the `index.test.ts` binding for Connect and
  Orient criterion 0043 — is no longer skipped: T1 made it a reported refusal,
  `does not resolve to exactly one file`, and it is one of the 239 findings the
  base audit produces.
- Product, owner-confirmed: anchored form is mandatory for every citation in a
  `met` row; the remaining verdict classes retain the bare form.
- Product, owner-confirmed: anchored multi-part form is refused and authors use
  a separate anchored citation for each span.
- Process, owner-confirmed: this is a service-shaped tooling slice governed by
  the repository's full work-loop and the boundaries above.
