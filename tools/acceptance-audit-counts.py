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
CITATION = re.compile(r"\b([\w./-]+\.(?:ts|tsx|mjs|py|md|json|toml)):(\d[\d,:-]*)")
# What a range start looks like once the code above it has moved: a line
# holding only brackets, or holding nothing at all. Both are stale by
# construction -- nobody cites an empty line or a closing brace as the start
# of their evidence. See the module docstring for the rules that were measured
# and rejected as too noisy.
STALE_START = re.compile(r"^\s*(?:[)\]}]+[,;)]*|\*?)\s*$")
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
CITATION_FIXTURE = """## Per-criterion reconciliation

### Group

| AC-0001 | met | S | apps/real.ts:1-3 | a citation that resolves |
| AC-0002 | met | S | apps/gone.ts:2 | a file that is not there |
| AC-0003 | met | S | apps/real.ts:99 | a line past the end |
| AC-0004 | met | S | apps/real.ts:3-4 | a start on a closing bracket |
| AC-0005 | met | S | apps/real.ts:4-5 | a start on a blank line |
| AC-0006 | met | S | real.ts:1 | the suffix shorthand resolves |
| AC-0007 | met | S | real.ts:98 | the shorthand is checked, not skipped |
| AC-0008 | met | S | apps/real.ts:1; apps/real.ts:97 | a second citation on one row |
| AC-0009 | **not met** | W | apps/real.ts:96 | a not-met row is checked too |
| AC-0010 | met | S | apps/widget.tsx:95 | a .tsx citation |
| AC-0011 | met | S | apps/build.mjs:94 | a .mjs citation |
| AC-0012 | met | S | apps/notes.md:93 | a .md citation |
| AC-0013 | met | S | apps/real.ts:1,92 | a comma continuation |
| AC-0014 | met | S | apps/real.ts:1-91 | a range whose end is past the end |
| AC-0015 | met | S | apps/real.ts:12- | a spec the parser cannot read |
| AC-0016 | met | S | apps/real.ts:0 | a zero line number |
| AC-0017 | met | S | apps/real.ts:1,3 | a continuation whose own start is stale |
| AC-0018 | met | S | apps/real.ts:1,:90 | a colon-repeating continuation |
| AC-0019 | met | S | apps/real.ts:89, and prose after it | a trailing separator is not a defect |
"""

CITATION_SOURCE = "const a = {\n  b: 1,\n};\n\nconst c = 2;\n"
# One line each, so every out-of-bounds number above is out of bounds.
OTHER_SOURCES = {"widget.tsx": "x\n", "build.mjs": "x\n", "notes.md": "x\n"}


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
        (root / "apps" / "real.ts").write_text(CITATION_SOURCE)
        for name, body in OTHER_SOURCES.items():
            (root / "apps" / name).write_text(body)
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
        ):
            if needle not in blob:
                failures.append(f"citation check missed {label}: {found}")
        # `apps/real.ts:1-3` and the `real.ts:1` shorthand are sound and must
        # not be flagged; without this the checks above pass for a rule that
        # flags everything.
        if "real.ts:1 starts" in blob:
            failures.append(f"citation check flagged a sound citation: {found}")
        # The count is load-bearing, not decoration: AC-0017's continuation
        # start is the only thing a `_citation_starts` that stops splitting on
        # commas would drop, and its message is indistinguishable from
        # AC-0004's. Without the count that mutation survives.
        # AC-0019's trailing comma must contribute no problem of its own.
        if any("is not a line number" in f and "real.ts:89" in f for f in found):
            failures.append(f"a trailing separator was reported as a defect: {found}")
        if len(found) != 17:
            failures.append(
                f"citation check reported {len(found)} problems, expected 17: {found}"
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

    Three classes are reported: an unresolvable file, a line past the end of
    one, and a range whose first line is blank, a bare `*`, or brackets only.
    The module docstring holds the reasoning, including the two broader rules
    that were measured and rejected, and the residue that stays open.
    """
    problems: list[str] = []
    by_name = _index_repository(repo_root)
    lengths: dict[str, int | None] = {}
    for index, line in enumerate(path.read_text().splitlines(), start=1):
        if not line.startswith("| AC-"):
            continue
        for name, spec in CITATION.findall(line):
            if name not in lengths:
                lengths[name] = _resolve_length(name, repo_root, by_name)
            length = lengths[name]
            if length is None:
                continue
            if length < 0:
                problems.append(f"{path}:{index}: {name} resolves to no file")
                continue
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
    return problems


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
    # file this checker cannot pick. Not a finding -- the row is readable and
    # the ambiguity is the table's convention, not a broken reference.
    return None if matches else -1


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
