# Changelog

Document notable user-visible changes to this project here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project may follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
when that matches its release model.

> Maintenance: add a `## [<artifact>][<version>] — YYYY-MM-DD` section in the
> same change that bumps a released artifact's version. Keep released entries
> newest-first and write them for users rather than contributors.

<!-- Example entry (replace with your first real version):

## [pack-name][version] — YYYY-MM-DD

### Added / Changed / Fixed

- Describe the user-visible change.

-->

## [studio-desktop][unreleased] — 2026-09-19

### Added

- **Connect a public GitHub repository and see whether it is agent-ready.**
  A single-field connect form takes a repository URL — no token, password or
  credential field exists — and Studio finds the latest commit, inspects that
  commit, and shows the verdict with the exact commit it inspected.
- Progress is separated into finding the commit and inspecting it, each
  cancellable, so a wait of up to 150 seconds says which phase is running.
- Every outcome states what Studio looked for, what it found instead, whose
  side of the boundary the gap is on, and whether retrying can change the
  answer. A result Studio could not confirm the version of says so alongside
  the verdict rather than instead of it.
- An inspection family joins the design system's state vocabulary, kept at
  least 20 units of CIE ΔE2000 from every artifact, review, execution and
  attention hue in both themes, so an inspection result never reads as an
  approval or an alarm.
