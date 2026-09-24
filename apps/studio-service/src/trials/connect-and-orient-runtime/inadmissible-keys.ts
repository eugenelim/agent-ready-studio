/**
 * The trial module's view of the parse guards.
 *
 * The guards themselves now live in `@agent-ready/protocol`, because one of
 * the sites AC-0056 and AC-0057 bind is `validator.ts` inside that package,
 * which cannot import from `apps/`. This module re-exports them so every
 * existing importer here is unchanged, and keeps the one function that cannot
 * move: `parseGuardedToml`, whose `smol-toml` dependency belongs to this
 * application rather than to the protocol contract.
 */
import { parse as parseToml } from "smol-toml";

// Exactly the surface this path carried before the guards moved, so no
// existing import breaks. `GuardedParseError` and its refusal type are new
// names that never lived here, so a caller that wants them imports them from
// the protocol package rather than through a second home.
export {
  documentNestingDepth,
  INADMISSIBLE_PARSE_KEYS,
  type InadmissibleParseKey,
  isInadmissibleKey,
  jsonTextNestingDepth,
  PARSE_NESTING_DEPTH_BOUND,
  parseGuardedJson,
  withoutInadmissibleKeys,
} from "@agent-ready/protocol";

import { withoutInadmissibleKeys } from "@agent-ready/protocol";

/**
 * Parses TOML and returns the guarded document. `smol-toml` exposes no
 * reviver, so the guard is a rebuild rather than a parse hook; the
 * intermediate object is never handed to a caller.
 */
export function parseGuardedToml(text: string): unknown {
  return withoutInadmissibleKeys(parseToml(text));
}
