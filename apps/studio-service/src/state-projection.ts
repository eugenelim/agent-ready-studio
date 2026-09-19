/**
 * The state vocabulary and its projection moved to `@agent-ready/protocol` so
 * the renderer can read them without importing this package, which
 * `AGENTS.md:85-88` forbids.
 *
 * This module is kept as a named re-export rather than a wildcard: `export *`
 * also re-exported `ipc` and `validator`, widening this module's surface to
 * the whole protocol package for callers that wanted four tables.
 */
export {
  type Attention,
  type Attribution,
  CONDITIONS,
  type ConditionValue,
  LEAD_ACTIONS,
  offersCredential,
  PROGRESS_STATES,
  type ProgressState,
  type ProjectionInput,
  project,
  STOP_REASONS,
  type StateProjection,
  type StopReasonKey,
  USER_VISIBLE_STATES,
  type UserVisibleState,
  unreachableCondition,
  userVisibleCopy,
} from "@agent-ready/protocol";
