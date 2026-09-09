# Shaping review — round 3

- **Reviewer:** isolated shaping/completeness subagent
- **Target:** pre-repair draft of the Product Development walking-skeleton spec,
  plan, and protocol contract
- **Disposition:** findings repaired; human clean confirmation required because
  the AgentBundle three-round automated-review limit was reached.

## Findings

1. The Review Package omitted the persisted Decision projection required after
   restart.
2. Home groups and proposed/accepted revision roles accepted semantically
   mismatched statuses.
3. Error codes were not bound to their error-data meanings.
4. The approval record used an unsupported retention class and an incomplete
   fingerprint procedure.
5. A stale future native-probe section contradicted the completed probe record.
6. Five criteria combined presentation with independent reload, retry, or
   domain-model behavior.
7. Task mappings assigned stdout, fake-output, and visual criteria to the wrong
   tasks.

## Repair evidence

The current baseline adds decisions to the Review Package; specializes home and
revision-role schemas; binds each error code to a closed data shape; records a
repository-durable ordered SHA-256 manifest; removes the duplicate probe section;
splits AC-39 through AC-44; and corrects task mappings. See
`notes/approval-baseline.sha256` for the exact bytes awaiting human review.
