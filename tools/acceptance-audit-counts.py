#!/usr/bin/env python3
"""Derive every count in an acceptance audit from its own rows.

The audit's headline and each group header are generated here rather than
written by hand, because a hand-written total drifted from its rows in three
consecutive review rounds.

`--check` fails when a count is stale; `tools/governance-gate.mjs` runs it, so
a stale count cannot ship. `--self-test` exercises the parsing below against
inline fixtures, because the parsing is the part that can be wrong while every
count still looks plausible.

`--check` also resolves every `file:line` citation in the Bindings column.
Three consecutive review rounds found citations pointing at a file that had
been deleted or at a line past the end of one, each time after the citations
had been reported recomputed; a hand-maintained line number in a 157-row table
drifts whenever anything above it moves.

Two classes are caught: a citation that cannot resolve at all — a missing file,
or a line past the end of one — and a citation whose **first** line is blank,
a bare doc-block `*`, or nothing but closing brackets. All three are stale by
construction: nobody cites an empty line or a closing brace as the start of
their evidence, so a citation that does has had the code above it move.

A citation that resolves to a plausible but wrong line is **not** caught, and
that limit is measured rather than assumed. Two broader rules were tried
against the real audit and rejected:

- start is a comment or any non-statement line — 58 of 450 starts, most
  legitimate, because rows deliberately cite a doc block or the comment that
  *is* the evidence;
- start is any `*`-continuation line — 14, most legitimate for the same reason.

The rules kept are the ones with no legitimate instance at all: bracket-only
starts (14 found, all stale) and blank or bare-`*` starts (20 found, all stale,
every one landing exactly one line above its target). Matching a cited line
against an identifier named in the row's prose was considered and has no
version with a tolerable false-positive rate. So the residue stays open, and
this says so rather than implying the citations are sound.

It lives in `tools/` rather than beside a skill: the skill trees under
`.claude/skills/` and `.agents/skills/` are pack-managed, and the next pack
upgrade would remove a repository-owned script placed there.

Only headings inside the per-criterion section are rewritten. An earlier
version matched any `### ... — ...` heading, so a prose heading containing an
em dash was silently rewritten to `### <its text> — 0 met`.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

ROW = re.compile(r"^\| (AC-\d{4}) \| (\*\*not met\*\*|met|not verifiable here) \|")
# `path/to/file.ts:12` or `:12-34`, and the `,56` / `,78-90` continuations the
# Bindings column uses to cite several places in one file.
# `file.ts:12`, `:12-34`, and the two continuation forms the Bindings column
# actually uses: `:12,34` and `:12,:34`, the latter repeating the colon.
# An optional anchor follows the lines: `inspector-locator.ts:192#locateTrustedInspector`.
# The anchor group captures `#` and the complete token up to the first of
# AC-0001's fourteen delimiters: whitespace, the `|` cell delimiter, the `;`
# citation separator, a code-span backtick, the `*` emphasis marker, a comma,
# and the brackets `(`, `)`, `[`, `]`, `{`, `}`, `<`, `>`. So
# `#filter=probe and prose` stops at the space, `` `#parseGuardedJson` `` stops
# at the backtick, and `#AC-0136; apps/other.ts` stops at the semicolon.
# Underscore is *not* a delimiter: it is part of the anchor, so
# `#STUDIO_PROBE_LOG` is captured whole.
# A captured value of `"#"` (empty token) and a captured value whose token fails
# the ANCHOR validator are both malformed and reported rather than silently
# treated as valid bare citations.
# Line numbers alone go stale silently -- they keep resolving and keep landing
# inside the file while pointing at unrelated code, which is how this table
# drifted twice. An anchor makes the citation self-checking: the symbol has to
# still be inside the cited span.  Anchors are mandatory for `met` rows;
# non-`met` rows retain the bare form.
CITATION = re.compile(
    r"\b([\w./-]+\.(?:ts|tsx|mjs|py|md|json|toml)):(\d[\d,:-]*)"
    r"(#[^\s|;`*,(){}\[\]<>]*)?"
)
# Validates the token following `#`.  Admits letters, digits, underscore (via
# \w), dot, hyphen, and equals — enough for identifiers, filenames, and
# key=value tokens.  A token that does not match is reported as unreadable.
# A token ending in a dot, hyphen, or equals is a trailing sentence separator
# rather than part of the name, and is refused.
ANCHOR = re.compile(r"^[\w.\-=]+(?<![.\-=])$")
# What a range start looks like once the code above it has moved: a line
# holding only brackets, or holding nothing at all. Both are stale by
# construction -- nobody cites an empty line or a closing brace as the start
# of their evidence. See the module docstring for the rules that were measured
# and rejected as too noisy.
STALE_START = re.compile(r"^\s*(?:[)\]}]+[,;)]*|\*?)\s*$")
# A line spec cut short by its anchor. `file.ts:12#anchor,34` parses as spec
# `12`, because AC-0001 ends the anchor at a comma, so `,34` would reach no
# check at all -- the silently dropped spec part this module exists to end. The
# same intent spelled `file.ts:12,34#anchor` is already refused for anchoring
# more than one span, so both spellings must be reported, not just one.
# No whitespace: `CITATION`'s spec group is `(\d[\d,:-]*)`, so a space can
# never begin a continuation. Admitting one turned `#a, 3 sites redden` into a
# finding and was the only path that could report an empty dropped token.
TRUNCATED_SPEC = re.compile(r"^,:?\d")
# The count suffix, not "anything after the first em dash". A non-greedy
# `(.+?)(?: — .*)?$` truncated a group title that contained the separator
# itself -- `### Version honesty — and path confinement` rendered back as
# `### Version honesty — 8 met`. The ten current titles avoid it by using
# commas, which is luck rather than a guard.
COUNT_SUFFIX = r"(?: — \d+ (?:met|not met|not verifiable here)(?:, [^—]*)?)?"
HEADING = re.compile(rf"^(#{{2,}}) (.+?){COUNT_SUFFIX}$")
HEADLINE = re.compile(r"^\*\*Result: \d+ met, \d+ not met, \d+ not verifiable here\.\*\*")
SECTION = "Per-criterion reconciliation"


def _counts(verdicts: list[str]) -> tuple[int, int, int]:
    return (
        sum(1 for v in verdicts if v == "met"),
        sum(1 for v in verdicts if v == "**not met**"),
        sum(1 for v in verdicts if v == "not verifiable here"),
    )


def _header(name: str, verdicts: list[str]) -> str:
    met, unmet, nvh = _counts(verdicts)
    parts = [f"{met} met"]
    if unmet:
        parts.append(f"{unmet} not met")
    if nvh:
        parts.append(f"{nvh} not verifiable here")
    return f"### {name} — {', '.join(parts)}"


def render(text: str) -> tuple[str, list[str]]:
    """Return the text with counts regenerated, and every verdict counted."""
    lines = text.splitlines()
    out: list[str] = []
    in_section = False
    group_at: int | None = None
    group_name = ""
    verdicts: list[str] = []
    total: list[str] = []

    def close_group() -> None:
        if group_at is not None:
            out[group_at] = _header(group_name, verdicts)

    for line in lines:
        heading = HEADING.match(line)
        if heading is not None:
            level, name = heading.group(1), heading.group(2)
            if level == "##":
                # A new top-level section ends the per-criterion one, so a
                # later prose heading cannot be mistaken for a group.
                close_group()
                group_at, verdicts = None, []
                in_section = name == SECTION
                out.append(line)
                continue
            if level == "###" and in_section:
                close_group()
                group_name, verdicts = name, []
                group_at = len(out)
                out.append(line)
                continue
        row = ROW.match(line)
        # A row outside the per-criterion section is prose quoting a row, not
        # a criterion, and counting it would inflate the headline.
        if row is not None and in_section:
            verdicts.append(row.group(2))
            total.append(row.group(2))
        out.append(line)
    close_group()

    met, unmet, nvh = _counts(total)
    for index, line in enumerate(out):
        if HEADLINE.match(line):
            out[index] = HEADLINE.sub(
                f"**Result: {met} met, {unmet} not met, {nvh} not verifiable here.**",
                line,
            )
    return "\n".join(out) + "\n", total


FIXTURE = """# Audit

**Result: 9 met, 9 not met, 9 not verifiable here.**

## Findings that are not rows

| AC-9999 | met | S | x | a row quoted in prose, outside the section |

### Why AC-0009 stands — the vector is pinned in the child

## Per-criterion reconciliation

### First group

| AC-0001 | met | S | x | y |
| AC-0002 | **not met** | W | x | y |

### Second group

| AC-0003 | not verifiable here | N | x | y |

### Version honesty — and path confinement

| AC-0004 | met | S | x | a title carrying the separator must round-trip |

## Closing
"""

EXPECTED = """# Audit

**Result: 2 met, 1 not met, 1 not verifiable here.**

## Findings that are not rows

| AC-9999 | met | S | x | a row quoted in prose, outside the section |

### Why AC-0009 stands — the vector is pinned in the child

## Per-criterion reconciliation

### First group — 1 met, 1 not met

| AC-0001 | met | S | x | y |
| AC-0002 | **not met** | W | x | y |

### Second group — 0 met, 1 not verifiable here

| AC-0003 | not verifiable here | N | x | y |

### Version honesty — and path confinement — 1 met

| AC-0004 | met | S | x | a title carrying the separator must round-trip |

## Closing
"""


# The shapes the real table is made of, not just the classes the checker
# reports. A fixture of single-citation `met` rows let six one-line edits --
# check only the first citation on a row, skip `**not met**` rows, drop an
# extension, drop either comma split, check only a range's first line --
# each stop examining between 55 and 233 of the real audit's 390 citations
# with the self-test still green. Every row below exists to kill one of those.
#
# Rows AC-0001 through AC-0019 (except AC-0009) use verdict `not verifiable
# here` so they test resolution, bounds, and stale-start checks without
# colliding with the rule that requires an anchor in every `met` row.
# AC-0009 is `**not met**` to prove non-`met` rows are still checked.
# AC-0020 and AC-0021 are `met` with anchors; AC-0021 proves that stale
# anchors in `met` rows are caught.  AC-0022 onward exercise the new rules.
CITATION_FIXTURE = """## Per-criterion reconciliation

### Group

| AC-0001 | not verifiable here | S | apps/real.ts:1-3 | a citation that resolves |
| AC-0002 | not verifiable here | S | apps/gone.ts:2 | a file that is not there |
| AC-0003 | not verifiable here | S | apps/real.ts:99 | a line past the end |
| AC-0004 | not verifiable here | S | apps/real.ts:3-4 | a start on a closing bracket |
| AC-0005 | not verifiable here | S | apps/real.ts:4-5 | a start on a blank line |
| AC-0006 | not verifiable here | S | real.ts:1 | the suffix shorthand resolves |
| AC-0007 | not verifiable here | S | real.ts:98 | the shorthand is checked, not skipped |
| AC-0008 | not verifiable here | S | apps/real.ts:1; apps/real.ts:97 | a second citation on one row |
| AC-0009 | **not met** | W | apps/real.ts:96 | a not-met row is checked too |
| AC-0010 | not verifiable here | S | apps/widget.tsx:95 | a .tsx citation |
| AC-0011 | not verifiable here | S | apps/build.mjs:94 | a .mjs citation |
| AC-0012 | not verifiable here | S | apps/notes.md:93 | a .md citation |
| AC-0013 | not verifiable here | S | apps/real.ts:1,92 | a comma continuation |
| AC-0014 | not verifiable here | S | apps/real.ts:1-91 | a range whose end is past the end |
| AC-0015 | not verifiable here | S | apps/real.ts:12- | a spec the parser cannot read |
| AC-0016 | not verifiable here | S | apps/real.ts:0 | a zero line number |
| AC-0017 | not verifiable here | S | apps/real.ts:1,3 | a continuation whose own start is stale |
| AC-0018 | not verifiable here | S | apps/real.ts:1,:90 | a colon-repeating continuation |
| AC-0019 | not verifiable here | S | apps/real.ts:89, and prose after it | a trailing separator is not a defect |
| AC-0020 | met | S | apps/real.ts:1-3#b | an anchor still inside its span |
| AC-0021 | met | S | apps/real.ts:5#b | an anchor the code moved away from |
| AC-0022 | met | S | apps/tokens.ts:1#AC-0136 | punctuation anchor: hyphenated ID |
| AC-0023 | met | S | apps/tokens.ts:1#package-script.mjs | punctuation anchor: dot and hyphen |
| AC-0024 | met | S | apps/tokens.ts:2#filter=probe | punctuation anchor: equals |
| AC-0025 | met | S | apps/tokens.ts:3#escaping-symlink | punctuation anchor: hyphen |
| AC-0026 | met | S | apps/tokens.ts:3#.gitmodules | punctuation anchor: leading dot |
| AC-0027 | met | S | apps/tokens.ts:2#filter=probe and then prose follows | anchor stops at prose |
| AC-0028 | met | S | apps/real.ts:1# | empty anchor token is malformed |
| AC-0029 | met | S | apps/real.ts:1#$bad | invalid anchor token is malformed |
| AC-0030 | met | S | apps/real.ts:1,5#b | anchored multi-part citation |
| AC-0031 | met | S | apps/tokens.ts:1#AC-0136; apps/tokens.ts:4#tail | two separate anchored citations each checked |
| AC-0032 | met | S | apps/tokens.ts:1#AC-0136; apps/tokens.ts:4#filter=probe | second citation is stale |
| AC-0033 | met | S | dup.ts:1#alpha | anchored ambiguous shorthand |
| AC-0034 | met | S | apps/dup.ts:1#alpha | path-qualified resolves, anchor is correct |
| AC-0035 | met | S | apps/dup.ts:1#beta | wrong anchor in resolved file |
| AC-0036 | not verifiable here | S | dup.ts:1 | bare ambiguous shorthand keeps tolerance |
| AC-0037 | met | S | apps/real.ts:1 | bare citation in met row |
| AC-0038 | **not met** | W | apps/real.ts:1 | bare citation in not-met row is valid |
| AC-0039 | not verifiable here | S | apps/real.ts:1 | bare citation in nvh row is valid |
| AC-0040 | met | S | `apps/real.ts:2#b` | anchor inside a code span |
| AC-0041 | met | S | *apps/real.ts:1#a* | anchor inside emphasis |
| AC-0042 | met | S | apps/tokens.ts:4#tail,5 | anchor stops at comma, dropped span reported |
| AC-0043 | met | S | apps/real.ts:5#c(note) | anchor stops at open paren |
| AC-0044 | met | S | (apps/real.ts:5#c) | anchor stops at close paren |
| AC-0045 | met | S | apps/real.ts:5#c[note] | anchor stops at open bracket |
| AC-0046 | met | S | [apps/real.ts:5#c] | anchor stops at close bracket |
| AC-0047 | met | S | apps/real.ts:5#c{note} | anchor stops at open brace |
| AC-0048 | met | S | {apps/real.ts:5#c} | anchor stops at close brace |
| AC-0049 | met | S | apps/real.ts:5#c<tag> | anchor stops at less-than |
| AC-0050 | met | S | <apps/real.ts:5#c> | anchor stops at greater-than |
| AC-0051 | met | S | apps/real.ts:1#foo. | trailing-separator dot is refused |
| AC-0057 | met | S | apps/real.ts:88#bad. | a refused anchor still gets its bounds checked |
| AC-0058 | met | S | apps/real.ts:1#a, 3 sites redden | comma then prose is not a dropped span |
| AC-0055 | met | S | apps/real.ts:1#foo- | trailing-separator hyphen is refused |
| AC-0056 | met | S | apps/real.ts:1#foo= | trailing-separator equals is refused |
| AC-0052 | met | S | apps/pipe.ts:1#pipeAnchor| anchor abutting the cell delimiter |
| AC-0053 | met | S | apps/under.ts:1#STUDIO_PROBE_LOG | underscore is part of the anchor |
| AC-0054 | met | S | apps/under.ts:1#opts._internal | truncating at underscore leaves a refused trailing dot |
"""

CITATION_SOURCE = "const a = {\n  b: 1,\n};\n\nconst c = 2;\n"
TOKENS_SOURCE = (
    "// AC-0136 covers package-script.mjs\n"
    'const probe = "filter=probe";\n'
    "// escaping-symlink and .gitmodules\n"
    "const tail = 1;\n"
)
PIPE_SOURCE = "const pipeAnchor = 1;\n"
# `opts._internal` is the discriminating token: truncated at `_` it becomes
# `opts.`, which `ANCHOR` refuses for its trailing separator. A plain
# containment guard cannot catch a truncation, because a prefix of a contained
# anchor is still contained.
UNDER_SOURCE = "const flag = opts._internal ?? STUDIO_PROBE_LOG;\n"
# One line each, so every out-of-bounds number above is out of bounds.
OTHER_SOURCES = {
    "widget.tsx": "x\n",
    "build.mjs": "x\n",
    "notes.md": "x\n",
    "tokens.ts": TOKENS_SOURCE,
}


def _self_test_citations() -> list[str]:
    """Exercise the citation path, which `render` does not touch.

    The governance gate rests on this half of the script, and it can regress
    while every count still looks plausible -- which is the failure the
    self-test exists for.
    """
    import tempfile

    failures: list[str] = []
    with tempfile.TemporaryDirectory() as raw:
        root = pathlib.Path(raw)
        (root / "apps").mkdir()
        (root / "packages").mkdir()
        (root / "apps" / "real.ts").write_text(CITATION_SOURCE)
        for name, body in OTHER_SOURCES.items():
            (root / "apps" / name).write_text(body)
        (root / "apps" / "pipe.ts").write_text(PIPE_SOURCE)
        (root / "apps" / "under.ts").write_text(UNDER_SOURCE)
        (root / "apps" / "dup.ts").write_text("const alpha = 1;\n")
        (root / "packages" / "dup.ts").write_text("const beta = 2;\n")
        audit = root / "audit.md"
        audit.write_text(CITATION_FIXTURE)
        found = check_citations(audit, root)
        blob = "\n".join(found)
        for label, needle in (
            # The exact message, not just the file name: reporting an absent
            # file as "past end of file (-1 lines)" also mentions the name.
            ("an unresolvable file", "apps/gone.ts resolves to no file"),
            ("a line past end of file", "apps/real.ts:99 is past end of file"),
            ("a bracket-only start", "real.ts:3 starts"),
            ("a blank start", "real.ts:4 starts"),
            # Through the suffix shorthand, so a resolver that stops
            # resolving shorthands drops this rather than staying green.
            ("a shorthand citation", "real.ts:98 is past end of file"),
            # Shapes, not classes: each of these dies if the checker stops
            # examining the shape rather than the class.
            ("a row's second citation", "apps/real.ts:97 is past end of file"),
            ("a **not met** row", "apps/real.ts:96 is past end of file"),
            ("a .tsx citation", "apps/widget.tsx:95 is past end of file"),
            ("a .mjs citation", "apps/build.mjs:94 is past end of file"),
            ("a .md citation", "apps/notes.md:93 is past end of file"),
            ("a comma continuation", "apps/real.ts:92 is past end of file"),
            ("a range's end", "apps/real.ts:91 is past end of file"),
            ("an unreadable line spec", "apps/real.ts:12- is not a line"),
            ("a zero line number", "apps/real.ts:0 is not a line"),
            ("a colon-repeating continuation", "apps/real.ts:90 is past end"),
            ("a citation before a trailing separator", "apps/real.ts:89 is past end"),
            # The anchor check, which is the whole point of the `#symbol`
            # suffix: a citation that still resolves and is still in bounds,
            # and no longer points at its subject.
            ("a citation that moved off its anchor", "apps/real.ts:5 no longer contains b"),
            # New rules: malformed anchor tokens are reported, not silently
            # dropped or treated as valid bare citations.
            ("malformed empty anchor", "real.ts:1# is not a readable anchor"),
            ("malformed bad token anchor", "real.ts:1#$bad is not a readable anchor"),
            # Anchored multi-part citations are refused before containment.
            ("anchored multi-part refused", "anchors more than one span"),
            # Each citation in a row is checked against its own span.
            ("per-citation span check on second citation", "tokens.ts:4 no longer contains filter=probe"),
            # Anchored ambiguous shorthand is refused; bare keeps its tolerance.
            ("ambiguous anchored resolution refused", "does not resolve to exactly one file"),
            # Anchor containment check reads the resolved file.
            ("wrong anchor in resolved file", "no longer contains beta"),
            # Bare citation in a met row is refused.
            ("bare citation in met row refused", "is not anchored"),
            # AC-0051, AC-0055, AC-0056: each character the trailing-separator
            # rule refuses needs its own needle. The count cannot discriminate:
            # an anchor wrongly admitted is then containment-checked and fails
            # anyway, so the number of findings is the same either way and only
            # the message differs.
            ("trailing hyphen refused", "real.ts:1#foo- is not a readable anchor"),
            ("trailing equals refused", "real.ts:1#foo= is not a readable anchor"),
            # AC-0057: a refused anchor must not suppress the bounds check.
            ("bounds still checked on a refused anchor",
             "apps/real.ts:88 is past end of file"),
            # AC-0051: anchor ending in a trailing separator is refused.
            ("trailing-separator anchor refused", "real.ts:1#foo. is not a readable anchor"),
        ):
            if needle not in blob:
                failures.append(f"citation check missed {label}: {found}")
        # `apps/real.ts:1-3` and the `real.ts:1` shorthand are sound and must
        # not be flagged; without this the checks above pass for a rule that
        # flags everything.
        if "real.ts:1 starts" in blob:
            failures.append(f"citation check flagged a sound citation: {found}")
        # And the anchor check discriminates. Without this, a check that
        # reports every anchored citation satisfies the needle above.
        if any("1-3 no longer contains" in f for f in found):
            failures.append(f"a sound anchor was reported stale: {found}")
        # The count is load-bearing, not decoration: AC-0017's continuation
        # start is the only thing a `_citation_starts` that stops splitting on
        # commas would drop, and its message is indistinguishable from
        # AC-0004's. Without the count that mutation survives.
        # AC-0019's trailing comma must contribute no problem of its own.
        if any("is not a line number" in f and "real.ts:89" in f for f in found):
            failures.append(f"a trailing separator was reported as a defect: {found}")
        # Punctuation anchors (AC-0022–AC-0026) must not be reported stale.
        if any("tokens.ts:1 no longer" in f or "tokens.ts:3 no longer" in f for f in found):
            failures.append(f"punctuation anchor falsely flagged stale: {found}")
        # Anchor stops before following prose (AC-0027): no finding for tokens.ts:2.
        if any("tokens.ts:2" in f for f in found):
            failures.append(f"anchor stop-at-prose: tokens.ts:2 was reported: {found}")
        # apps/dup.ts:1#alpha is sound (AC-0034): not reported stale.
        if any("no longer contains alpha" in f for f in found):
            failures.append(f"sound apps/dup.ts:1#alpha anchor reported stale: {found}")
        # Fixture row AC-0040 cites `apps/real.ts:2#b` inside backticks; no
        # other guard cites real.ts:2, so this red is attributable to that row.
        if any("real.ts:2" in problem for problem in found):
            failures.append(f"code-span anchor: real.ts:2 was reported: {found}")
        # Delimiter rows AC-0041 and AC-0043–AC-0050 are sound: they must draw
        # no finding at all. Narrowing the stop class widens the captured token
        # past the delimiter, `ANCHOR` refuses it, and these fire -- which the
        # earlier containment-only form could not do, because a delimiter
        # regression never reaches the containment check.
        for row, label in (("real.ts:1#a", "star"), ("real.ts:5#c", "bracket/angle"),
                           ("pipe.ts:1#pipeAnchor", "cell-delimiter"),
                           ("under.ts:1#STUDIO_PROBE_LOG", "underscore-in-anchor"),
                           ("under.ts:1#opts._internal", "underscore-truncation")):
            if any(row in f for f in found):
                failures.append(f"{label} delimiter row was reported: {found}")
        # AC-0042: the comma ends the anchor, and the span it cuts off is
        # reported rather than dropped. Asserting the finding, not its absence.
        if not any("leaves ',5' outside the citation" in f for f in found):
            failures.append(f"comma-truncated span was not reported: {found}")
        # AC-0058 is the paired positive: a comma followed by prose is the
        # table's formatting, not a dropped span, which AC-0019 already
        # establishes for the bare form. It also pins the diagnostic against
        # ever naming an empty token.
        if any("real.ts:1#a leaves" in f for f in found):
            failures.append(f"comma-then-prose reported as a dropped span: {found}")
        if any("leaves '' outside the citation" in f for f in found):
            failures.append(f"a dropped-span finding named an empty token: {found}")
        # The bare citation rule fires exactly once — for the met row (AC-0037).
        # AC-0038 (**not met**) and AC-0039 (not verifiable here) must not fire it.
        not_anchored_count = sum(1 for f in found if "is not anchored" in f)
        if not_anchored_count != 1:
            failures.append(
                f"expected 1 'is not anchored' finding, got {not_anchored_count}: {found}"
            )
        # The count is load-bearing: see the comment above about AC-0017/AC-0019.
        # Composition, read off the rows: 25 findings come from the rows that
        # predate the anchor grammar, and 6 from the nineteen rows added for it
        # (AC-0040 through AC-0058) -- 25 + 6 = 31. Five of those nineteen draw
        # a finding: AC-0042 for the comma-truncated span, AC-0051, AC-0055 and
        # AC-0056 for each character the trailing-separator rule refuses, and
        # AC-0057, which draws two because a refused anchor still gets its
        # bounds checked. The other fourteen are accepted forms whose whole job
        # is to draw none.
        if len(found) != 31:
            failures.append(
                f"citation check reported {len(found)} problems, expected 31: {found}"
            )
    return failures


def self_test() -> int:
    rendered, total = render(FIXTURE)
    failures = []
    if rendered != EXPECTED:
        failures.append(f"rendered output differs:\n{rendered}")
    if len(total) != 4:
        failures.append(f"counted {len(total)} rows, expected 4")
    # Idempotent: a second pass over generated output changes nothing.
    if render(rendered)[0] != rendered:
        failures.append("second pass changed the output")
    failures.extend(_self_test_citations())
    for failure in failures:
        print(f"acceptance-audit-counts self-test: {failure}")
    if failures:
        return 1
    print("acceptance-audit-counts: self-test passed")
    return 0


def _cited_lines(spec: str) -> tuple[list[int], list[str]]:
    """Line numbers a spec names, and the parts that could not be read.

    An unreadable part is **returned rather than skipped**. `CITATION`'s spec
    group accepts `12-` and `12-a`, and silently dropping those turned the
    bounds check off for that citation with no signal -- the same
    silent-non-checking this script exists to end. A zero is unreadable for
    the same reason: no file has a line 0, so it can only be a typo, and
    `0 > length` is false so nothing else would catch it.
    """
    numbers: list[int] = []
    unreadable: list[str] = []
    for part in _spec_parts(spec):
        bounds = part.split("-")
        if bounds and all(b.isdigit() for b in bounds) and all(
            int(b) > 0 for b in bounds
        ):
            numbers.extend(int(b) for b in bounds)
        else:
            unreadable.append(part)
    return numbers, unreadable


# Where this table's shorthand citations can live. The Bindings column cites
# `preload/index.ts` and `git-driver.ts` rather than full paths, so a resolver
# has to search the way a reader does.
SEARCH_ROOTS = ("apps", "packages", "contracts", "tools", "docs")
SKIP_DIRS = {"node_modules", "dist", ".git", "out", "build"}


def _index_repository(repo_root: pathlib.Path) -> dict[str, list[pathlib.Path]]:
    by_name: dict[str, list[pathlib.Path]] = {}
    for root in SEARCH_ROOTS:
        base = repo_root / root
        if not base.is_dir():
            continue
        for found in base.rglob("*"):
            if not found.is_file():
                continue
            if any(part in SKIP_DIRS for part in found.parts):
                continue
            by_name.setdefault(found.name, []).append(found)
    return by_name


def check_citations(path: pathlib.Path, repo_root: pathlib.Path) -> list[str]:
    """Every cited file must resolve, and every cited line must be inside it.

    Six classes are reported:

    1. An unresolvable file (missing, or an ambiguous shorthand when the
       citation carries an anchor — bare ambiguous shorthands are tolerated).
    2. A line past the end of the resolved file.
    3. A range whose first line is blank, a bare `*`, or brackets only.
    4. An anchored citation whose anchor no longer appears in the cited span.
    5. A malformed anchor token (`#` with an empty or non-`ANCHOR` token).
    6. A line spec cut short by its anchor (`file.ts:12#anchor,34`), whose
       dropped continuation would otherwise reach no check. This is the second
       spelling of the refusal in the policy rules below; the parsed spec here
       has one part, with the remainder sitting outside the match.

    Additionally, two policy rules are enforced per row verdict:

    - Every citation in a `met` row must carry an anchor (`#token`).
    - An anchored citation whose line spec has more than one part is refused;
      each span must be cited separately.

    The module docstring holds the reasoning, including the two broader rules
    that were measured and rejected, and the residue that stays open.
    """
    problems: list[str] = []
    by_name = _index_repository(repo_root)
    lengths: dict[str, int | None] = {}

    def _bounds_and_stale(name: str, spec: str, index: int, length: int) -> None:
        numbers, unreadable = _cited_lines(spec)
        for part in unreadable:
            problems.append(
                f"{path}:{index}: {name}:{part} is not a line number"
            )
        for number in numbers:
            if number > length:
                problems.append(
                    f"{path}:{index}: {name}:{number} is past end of file"
                    f" ({length} lines)"
                )
        for number in _citation_starts(spec):
            text = _line_text(name, number, repo_root, by_name)
            if text is not None and STALE_START.match(text):
                problems.append(
                    f"{path}:{index}: {name}:{number} starts on a blank or"
                    f" bracket-only line ({text.strip()!r}) — the code"
                    f" above it moved"
                )

    for index, line in enumerate(path.read_text().splitlines(), start=1):
        if not line.startswith("| AC-"):
            continue
        row = ROW.match(line)
        verdict = row.group(2) if row else None
        for m in CITATION.finditer(line):
            name, spec, anchor_raw = m.group(1), m.group(2), m.group(3)

            # Rule: validate anchor token when the delimiter is present.
            if anchor_raw is not None:
                anchor_token = anchor_raw[1:]  # strip the leading '#'
                if not anchor_token or not ANCHOR.match(anchor_token):
                    problems.append(
                        f"{path}:{index}: {name}:{spec}#{anchor_token}"
                        f" is not a readable anchor"
                    )
                    # Bounds and stale-start need no anchor, so a refused
                    # anchor must not suppress them -- otherwise a citation
                    # that is both unreadable and drifted takes two CI rounds
                    # to repair. Matches the multi-part branch below.
                    if name not in lengths:
                        lengths[name] = _resolve_length(name, repo_root, by_name)
                    refused_length = lengths[name]
                    if refused_length is not None and refused_length >= 0:
                        _bounds_and_stale(name, spec, index, refused_length)
                    continue  # do not treat a malformed anchor as bare
                anchor: str | None = anchor_token
                trailing = line[m.end():]
                if TRUNCATED_SPEC.match(trailing):
                    dropped = trailing.split(" ")[0].rstrip(";,")
                    problems.append(
                        f"{path}:{index}: {name}:{spec}#{anchor_token} leaves"
                        f" '{dropped}' outside the citation — an anchored"
                        f" citation names exactly one span"
                    )
            else:
                anchor = None

            # Rule: every citation in a `met` row must be anchored.
            if verdict == "met" and anchor is None:
                problems.append(
                    f"{path}:{index}: {name}:{spec} is not anchored"
                )
                # fall through — bounds and stale checks still apply

            # Resolve the cited file.
            if name not in lengths:
                lengths[name] = _resolve_length(name, repo_root, by_name)
            length = lengths[name]

            if length is None:
                # Ambiguous shorthand: if anchored, the citation cannot be
                # checked independently and is refused.  A bare shorthand
                # retains the established tolerance and is silently skipped.
                if anchor is not None:
                    problems.append(
                        f"{path}:{index}: {name} does not resolve to exactly one file"
                    )
                continue

            if length < 0:
                problems.append(f"{path}:{index}: {name} resolves to no file")
                continue

            # Rule: an anchored citation must name exactly one span.  One
            # anchor cannot identify several disjoint spans, and separate
            # citations reuse the existing checker without a new grammar.
            if anchor is not None and len(_spec_parts(spec)) > 1:
                problems.append(
                    f"{path}:{index}: {name}:{spec}#{anchor}"
                    f" anchors more than one span"
                )
                _bounds_and_stale(name, spec, index, length)
                continue  # skip containment check for multi-part anchored form

            _bounds_and_stale(name, spec, index, length)
            if anchor and not _anchor_in_span(
                name, spec, anchor, repo_root, by_name
            ):
                problems.append(
                    f"{path}:{index}: {name}:{spec} no longer contains"
                    f" {anchor} — the citation moved off its anchor"
                )
    return problems


def _anchor_in_span(
    name: str,
    spec: str,
    anchor: str,
    repo_root: pathlib.Path,
    by_name: dict[str, list[pathlib.Path]],
) -> bool:
    """Whether the anchor text appears anywhere in the cited lines.

    Substring, not an identifier parse. The anchors this table carries are
    function, type, and constant names, and a Python-side parse of TypeScript
    would be a second thing to keep correct for no gain -- a name that appears
    in the span at all is enough to say the citation still points at its
    subject. The cost is that a name also appearing in a comment satisfies it;
    that is a false pass, and the check's job is to catch a citation that
    drifted off its subject entirely.
    """
    for part in _spec_parts(spec):
        bounds = part.split("-")
        if not (bounds and all(b.isdigit() and int(b) > 0 for b in bounds)):
            continue
        for number in range(int(bounds[0]), int(bounds[-1]) + 1):
            text = _line_text(name, number, repo_root, by_name)
            if text is not None and anchor in text:
                return True
    return False


def _spec_parts(spec: str) -> list[str]:
    """The readable parts of a line spec, in order.

    Two things are normalized rather than reported. A continuation may repeat
    the colon -- `:85-101,:138-160` -- so a leading colon is stripped. A spec
    may end in a comma where prose follows it in the cell, which leaves an
    empty part: that is the table's formatting, not an unreadable line, and
    reporting it would flag five sound rows. A part that is non-empty and
    still unreadable is the real defect and is returned to the caller.
    """
    return [
        stripped
        for part in spec.split(",")
        if (stripped := part.lstrip(":").strip()) != ""
    ]


def _citation_starts(spec: str) -> list[int]:
    starts: list[int] = []
    for part in _spec_parts(spec):
        first = part.split("-")[0]
        if first.isdigit() and int(first) > 0:
            starts.append(int(first))
    return starts


def _line_text(
    name: str,
    number: int,
    repo_root: pathlib.Path,
    by_name: dict[str, list[pathlib.Path]],
) -> str | None:
    literal = repo_root / name
    if not literal.is_file():
        suffix = f"/{name}"
        matches = [
            candidate
            for candidate in by_name.get(pathlib.PurePath(name).name, [])
            if str(candidate).endswith(suffix)
        ]
        if len(matches) != 1:
            return None
        literal = matches[0]
    lines = literal.read_text().splitlines()
    return lines[number - 1] if 1 <= number <= len(lines) else None


def _resolve_length(
    name: str,
    repo_root: pathlib.Path,
    by_name: dict[str, list[pathlib.Path]],
) -> int | None:
    literal = repo_root / name
    if literal.is_file():
        return len(literal.read_text().splitlines())
    # A shorthand: match on the path suffix, which is how the column is read.
    suffix = f"/{name}"
    matches = [
        candidate
        for candidate in by_name.get(pathlib.PurePath(name).name, [])
        if str(candidate).endswith(suffix)
    ]
    if len(matches) == 1:
        return len(matches[0].read_text().splitlines())
    # Ambiguous shorthand: several files share the suffix, so the row names a
    # file this checker cannot pick.  A bare citation is tolerated — the row
    # is readable and the ambiguity is the table's convention, not a broken
    # reference.  An anchored citation is refused because the anchor cannot be
    # checked without knowing which file is meant (handled in check_citations).
    return None if matches else -1


# **How a citation that resolves to the wrong line is caught, and why two
# earlier attempts at it were unsound.** Both are recorded so neither is
# re-proposed.
#
# The first asked whether the *row* had been edited when a cited file changed.
# That reads as a reasonable proxy and is not one: it goes vacuous exactly when
# the audit is heavily edited, which is every round that moves criteria. Its
# negative control settled it — inserting a line at the top of a cited file
# produced no finding at all.
#
# The second compared each citation against a `difflib` map from the file at
# `HEAD` to the file now, reporting a citation whose line had moved. That is
# sound only while the citations are still expressed in `HEAD` terms. The
# moment any of them is corrected it holds a *current* line number, and mapping
# a current number through a base-to-current map produces a number about
# nothing. It reported 244 drifted citations on a tree whose citations had just
# been remapped correctly — every one an artifact of the check.
#
# Both attempts failed for one reason: the table did not record what a citation
# was *for*. A line number is a claim about current content, and neither check
# knew what content was meant.
#
# **That is what the `#anchor` suffix now supplies**, and
# `connect-orient-audit-citations-record-no-verifiable-anchor` closed with it.
# A citation written `inspector-locator.ts:192#locateTrustedInspector` fails
# the gate when the symbol is no longer inside the cited span, so the row
# states its own subject and the check can read it. `_anchor_in_span` above is
# that check.
#
# **Its limit is worth knowing before trusting it.** The anchor is matched as a
# substring of the span's text, so it catches a citation that drifted off its
# subject and not one that landed on a different mention of the same name.
#
# Anchors are mandatory for every citation in a `met` row.  Non-`met` rows
# (`**not met**` and `not verifiable here`) retain the bare form — a bare
# citation is still checked for the three properties that need no knowledge of
# intent: that it resolves, that it lands inside the file, and that it does not
# start on a blank or bracket-only line.  A bare `return;` passes all three,
# which is why the anchor is the stronger form and is required where the
# criterion is claimed satisfied.


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=pathlib.Path, nargs="?")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        return self_test()
    if args.path is None:
        parser.error("a path is required unless --self-test is given")

    original = args.path.read_text()
    rendered, total = render(original)
    met, unmet, nvh = _counts(total)
    summary = (
        f"{args.path}: {len(total)} rows, {met} met, {unmet} not met, "
        f"{nvh} not verifiable here"
    )
    if args.check:
        failed = False
        if rendered != original:
            print(f"{summary} — counts are stale; rerun without --check")
            failed = True
        problems = check_citations(args.path, pathlib.Path.cwd())
        for problem in problems:
            print(problem)
        if problems:
            print(f"{len(problems)} citation(s) do not resolve")
            failed = True
        if failed:
            return 1
        print(f"{summary}; every citation resolves")
        return 0
    args.path.write_text(rendered)
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
