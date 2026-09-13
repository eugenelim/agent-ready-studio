# ADR-0007: Runtime contract placement: Separate versioned package and schemas

- **Status:** Accepted
- **Date:** 2026-09-12
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Related:** RFC-0001, ADR-0004, ADR-0005, ADR-0006,
  `docs/architecture/reference.md`

## Context

RFC-0001 proposes that a Workspace Runtime, if one is established, is driven by
the Studio Service through a northbound Studio Runtime Protocol. Where that
contract's versioning boundary sits is an input to the runtime specification
rather than an output of it: otherwise whichever package happens to be open
when the first runtime specification is written answers it implicitly.

Three placements are plausible. `packages/protocol` already carries the
client-to-service contract that ADR-0004 governs, paired with a versioned
public JSON schema. `packages/execution-sdk` already carries executor
contracts, packets, and normalized events. A third, new package is the only
option that costs something up front.

The runtime itself does not exist, and RFC-0001's D1 — whether execution
authority earns a durable process boundary — remains gated on Connect and
Orient having been delivered.

## Decision

> If the durable Workspace Runtime boundary is established, its northbound
> Studio Runtime contract lives in `packages/runtime-protocol`, with
> language-neutral schemas under `contracts/jsonschema/runtime`.

Caveats that travel with this decision:

- **Neither location is created by this record.** Creation waits for a real
  runtime specification that defines an actual contract.
- **This was accepted ahead of its evidence.** A separately versioned package
  earns its cost only if a second, independently released runtime deployment
  exists, and no work currently in view can demonstrate that. The maintainers
  accepted it so later work inherits one answer rather than inventing several,
  not because the cost is proven.
- **It lapses with D1.** A contract placement for a runtime that will not exist
  decides nothing. If RFC-0001's Stage 2 gate withdraws D1, this decision
  lapses with it and needs a superseding or amending record.
- **Contract wire types must not import application implementation packages.**
  `packages/runtime-protocol` defines its own wire types.
- **Consumers map wire types to domain types at their own boundaries.** The
  mapping layer belongs to the consumer, not to the contract.

## Decision drivers

Two were decisive. RFC-0001 recommends this placement "on two criteria only":

- **Independent protocol evolution** — a runtime change must not force a
  client-visible protocol version bump. Avoiding client-visible Studio protocol
  churn is this driver's practical form, not a separate one.
- **Clean dependency direction** — both sides depend on the contract; neither
  depends on the other.

Three more were evaluated and did not discriminate between the options, and so
carry no weight for the choice. They are recorded because they describe what
the contract must still support:

- **Local and cloud runtime compatibility** — one semantic contract a
  deployment negotiates a version against. Negotiable under either a separate
  package or a namespaced one.
- **Explicit schema ownership** — a named root a non-TypeScript consumer can
  read.
- **Conformance testing** — a contract suite not mixed with executor or client
  fixtures.

## Consequences

**Positive:**

- The runtime contract can move on its own cadence, which is what makes
  "replaceable runtime" a property rather than a claim.
- A non-TypeScript runtime can exist against the published schemas without
  re-deriving the contract.
- The runtime specification inherits a settled placement instead of reopening
  it, and this record is the visible place to contest it.

**Negative:**

- Once implemented this costs one package, one schema root, and one mapping
  layer, none of which carries weight until a second runtime deployment
  exists. If a cloud runtime never ships, keeping runtime methods inside
  `packages/protocol` would have been the cheaper correct answer.
- Avoiding duplicate domain types is not free here. Because the contract may
  not import `packages/domain`, duplication is answered by an explicit rule and
  a consumer-side mapping layer rather than by an import.
- The decision is recorded while its premise is unverified, so a reader must
  carry the caveat rather than read it as settled cost-benefit.
- Nothing is created now, so there is nothing to conform to and nothing to
  check until the runtime specification exists.

**Revisit if:** RFC-0001's Stage 2 gate withdraws D1, or the runtime
specification shows no independently evolving runtime deployment will exist —
in which case the cheaper placement should supersede this record rather than be
adopted silently.

## Confirmation

- **Mode:** none
- **Signal:** not applicable yet — nothing is created by this record, so there
  is no artifact to check. Conformance becomes checkable at the runtime
  specification, which owns the fixtures.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- **Put the contract in `packages/execution-sdk`.** Rejected against the clean
  dependency-direction driver: that package describes what an executor is, an
  in-process library concern, while the runtime contract describes how two
  processes negotiate across a trust boundary. Bundling them makes the Studio
  Service depend on executor contracts to talk to a runtime, re-coupling the
  authorities ADR-0005 separates, and forces the executor SDK's version to move
  whenever the wire contract does.
- **Put runtime methods in `packages/protocol` under a namespace.** Rejected
  against the independent-evolution driver: a namespace is a naming convention,
  not a versioning boundary. Two independently evolving contracts behind one
  version number means a runtime change bumps the client-visible protocol
  version. This is the strongest rejected option, and the one that would have
  been cheaper had the premise failed.
- **Defer placement until the runtime specification.** Rejected against the
  independent-evolution driver by way of ordering: placement is an input to
  that specification. Deferring means the first specification decides it
  implicitly, and the implicit answer is whichever package is already open.
- **Use implementation types directly as the wire contract.** Rejected against
  the clean dependency-direction driver: it makes the wire format a projection
  of internal shapes, so an internal refactor becomes a protocol change.

## References

- [RFC-0001](../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
  D3, Accepted 2026-09-11 — §Runtime contract placement, §Options considered
  (D3), §Risks.
