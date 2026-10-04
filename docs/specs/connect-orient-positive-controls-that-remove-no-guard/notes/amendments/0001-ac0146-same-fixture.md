# Amendment 0001 — AC-0146 uses the registered fixture

## Finding

The initial plan classified AC-0146's product-path storage proof as already
sound. A complete row trace found that the guarded refusal and its two sink
mutations used the literal `credential-proof-value`, while the registered
`credential-sink` hostile fixture planted `repository-token`. The proof had a
real product path and real sink mutations, but it did not satisfy AC-0147's
same-fixture conjunct.

## Amendment

T2 also owns `source-inspection-storage.test.ts`. Its AC-0146 case materializes
the registered `credential-sink` fixture, reads the planted value, and uses
that same value as the submitted URL credential and in both guard-removed sink
mutations. The existing refusal, returned-diagnostic, standard-error, live
storage and reopened-storage observations remain unchanged.

## Authority and scope

AC-0147 already requires the same fixture for every AC-0133 through AC-0146
control, so this amendment corrects the implementation plan to match the
approved acceptance contract. It changes no parent criterion, production
behavior, public interface, dependency or task edge.
