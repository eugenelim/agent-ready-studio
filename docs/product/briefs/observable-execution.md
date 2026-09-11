# Delivery brief: Observable execution

- **Status:** Draft
- **Slug:** `observable-execution`
- **Received:** 2026-09-10
- **Owner:** Agent-Ready Studio maintainers
- **Source:** Amendment 0004 to the Product Development walking skeleton

## Outcome

A person can see that work is in flight, and can tell a run that is still going
from one that died. Today they cannot: the walking skeleton's execution is a
single atomic transaction, so a transformation either commits with its proposal,
review and events, or it writes nothing at all. There is no state between those
two, and a process killed mid-run leaves no trace.

That is the right shape for a deterministic in-process call and the wrong one for
anything slower. It is why amendment 0004 removed Home's Running group from
AC-14: the group existed, could never be populated, and the projection branch
that fed it was unreachable code.

## What this would take

- Commit the execution row as `running` before the work starts, then complete or
  fail it in a second transaction, so the in-flight state is durable.
- Reconcile with AC-22, which requires normalized events to persist in the same
  transaction as the semantic state they describe. Splitting the execution
  lifecycle across two transactions needs that criterion re-read, not ignored.
- Decide what a `running` row means after a restart. A row left running by a
  killed process is indistinguishable from one that is genuinely in flight
  unless something records liveness.
- Restore Home's Running group and the `home.get` contract shape amendment 0004
  narrowed: the `running` array, and the Home item's `execution` kind and
  `running` / `failed` statuses.

## Why it is not in the walking skeleton

The skeleton's only executor is a deterministic fake that returns immediately.
Making execution observable would add a state machine no criterion in that slice
needs, in service of a delay that does not exist yet. It becomes real work when
execution becomes slow — an agent executor, a remote runner, or anything a person
would wait on.
