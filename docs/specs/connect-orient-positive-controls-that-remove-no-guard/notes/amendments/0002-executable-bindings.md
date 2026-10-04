# Amendment 0002 — Bind inventory evidence to executable test bodies

## Finding

The first inventory test proved that every named test and assertion token
appeared somewhere in a source file. It did not prove that the token appeared
inside the named test. A test could stop executing its observation while a
helper or another test kept the source-wide string check green. The expected
criterion list was also repeated as a second literal instead of being derived
from `HOSTILE_CASE_BY_CRITERION`.

## Amendment

The runtime AC-0133 through AC-0146 set is derived from
`HOSTILE_CASE_BY_CRITERION`. Each inventory row names unique guarded and
control tests plus observation-evidence tokens. The inventory test extracts
each named test body, requires at least one row token in every body, and
requires every row token to be exercised by at least one of those bodies.

The parent criterion requires the same observation level, not one assertion
function shape. This keeps the existing valid idioms: some guarded/control
pairs share one assertion helper, while pin-omission and direct-operation
controls execute different assertions over the same measured effect.

## Authority and scope

This strengthens AC-0004's executable binding without changing a parent
criterion, task edge, production path or public interface. It was required by
the first implementation quality and adversarial reviews.
