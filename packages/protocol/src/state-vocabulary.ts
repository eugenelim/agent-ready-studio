/**
 * The product's user-visible state vocabulary and its projection: the spec's
 * *Condition axis*, *Progress and surface states* and *User-visible states*
 * tables in code, plus the derivation that turns one state into everything a
 * surface needs to render it honestly.
 *
 * It lives in the protocol package because **both sides need it and neither may
 * import the other**. `AGENTS.md` forbids renderer production code from
 * importing Studio Service modules, and a second copy in the renderer would let
 * a surface stay honest about a state the service no longer reports -- the
 * drift a single source exists to prevent. The protocol package is already a
 * dependency of both, and shared vocabulary is what it is for.
 *
 * It is pure: data, types and derivation, no I/O and no service state.
 */

export type Attention = "informative" | "caution" | "critical";
export type Attribution = "repository" | "Studio" | "network";

/** The *Condition axis*: eight values, mutually exclusive. */
export const CONDITIONS = [
  "ok",
  "malformed",
  "inspector-unavailable",
  "source-unavailable",
  "source-rate-limited",
  "inspection-stopped",
  "cancelled",
  "incomplete",
] as const;

/** The *Progress and surface states*: four values, carrying no verdict. */
export const PROGRESS_STATES = [
  "unconnected",
  "url-rejected",
  "resolving",
  "inspecting",
] as const;

export type ConditionValue = (typeof CONDITIONS)[number];
export type ProgressState = (typeof PROGRESS_STATES)[number];

/**
 * *User-visible states*: the union of both tables minus `ok`, which is the
 * absence of condition chrome and so has no label to carry.
 */
export type UserVisibleState = Exclude<ConditionValue, "ok"> | ProgressState;

export const USER_VISIBLE_STATES = [
  ...CONDITIONS.filter(
    (condition): condition is Exclude<ConditionValue, "ok"> =>
      condition !== "ok",
  ),
  ...PROGRESS_STATES,
] as UserVisibleState[];

interface StateRow {
  readonly label: string;
  readonly attention: Attention;
  readonly degraded: boolean;
  readonly attribution?: Attribution;
  readonly retryable?: string;
  /** What Studio was looking for when it reached this state. */
  readonly lookedFor?: string;
  /** What it found instead. */
  readonly foundInstead?: string;
}

const STATE_ROWS: Record<UserVisibleState, StateRow> = {
  malformed: {
    label: "Workspace file is malformed",
    attention: "caution",
    degraded: true,
    attribution: "repository",
    retryable: "only if the repository changes",
    lookedFor: "a workspace declaration Studio could read",
    foundInstead: "a workspace file the inspector reported as invalid",
  },
  "inspector-unavailable": {
    label: "Studio cannot inspect",
    attention: "critical",
    degraded: true,
    attribution: "Studio",
    retryable: "yes, once Studio's environment is fixed",
    lookedFor: "the pinned trusted inspector and a conforming interpreter",
    foundInstead: "no usable inspector in Studio's own installation",
  },
  "source-unavailable": {
    label: "Repository unreachable",
    attention: "caution",
    degraded: true,
    attribution: "network",
    retryable: "yes",
    lookedFor: "a reachable repository at the canonical address",
    foundInstead: "no answer from the network",
  },
  "source-rate-limited": {
    label: "Rate limited",
    attention: "caution",
    degraded: true,
    attribution: "network",
    retryable: "yes, after the wait window",
    lookedFor: "a reachable repository at the canonical address",
    foundInstead: "a rate-limiting signal from the transport",
  },
  "inspection-stopped": {
    label: "Inspection stopped",
    attention: "caution",
    degraded: true,
    // Attribution and retryability come from the reason, never from here.
    lookedFor: "a completed inspection",
    foundInstead: "an inspection that ended before it finished",
  },
  cancelled: {
    label: "Cancelled",
    attention: "informative",
    degraded: false,
    retryable: "yes",
  },
  incomplete: {
    label: "Interrupted by restart",
    attention: "caution",
    degraded: true,
    attribution: "Studio",
    retryable: "yes",
    lookedFor: "an inspection that ran to completion",
    foundInstead: "an inspection Studio restarted away from",
  },
  unconnected: {
    label: "No repository connected",
    attention: "informative",
    degraded: false,
  },
  "url-rejected": {
    label: "That URL cannot be used",
    attention: "caution",
    degraded: false,
  },
  resolving: {
    label: "Finding the latest commit",
    attention: "informative",
    degraded: false,
  },
  inspecting: {
    label: "Inspecting <short-sha>",
    attention: "informative",
    degraded: false,
  },
};

/**
 * *Reasons for `inspection-stopped`*, one entry per terminating criterion the
 * table lists. The human reason, attribution and retryability are the table's.
 */
export const STOP_REASONS = {
  "remote-ref-charset": {
    reason: "The repository's default branch has an unusable name",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
  "head-mismatch": {
    reason: "The downloaded copy did not match the commit Studio asked for",
    attribution: "network",
    retryable: "yes",
  },
  "request-identifier-mismatch": {
    reason: "Studio could not match the result to its request",
    attribution: "Studio",
    retryable: "yes",
  },
  "result-invalid-studio": {
    reason: "Studio could not read the inspection result",
    attribution: "Studio",
    retryable: "no",
  },
  "result-invalid-repository": {
    reason: "The repository's content could not be read as a result",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
  "result-too-large": {
    reason: "The inspection result was too large to read",
    attribution: "repository",
    retryable: "no",
  },
  "inspector-inside-target": {
    reason: "Studio refused an inspector found inside the repository",
    attribution: "repository",
    retryable: "no",
  },
  "file-count": {
    reason: "The repository has more files than Studio will download",
    attribution: "repository",
    retryable: "no",
  },
  "resolution-timeout": {
    reason: "Finding the latest commit took too long",
    attribution: "network",
    retryable: "yes",
  },
  "inspection-timeout": {
    reason: "Inspecting took too long",
    attribution: "Studio",
    retryable: "yes",
  },
  "parse-failure-studio": {
    reason: "Studio could not read its own inspection output",
    attribution: "Studio",
    retryable: "no",
  },
  "parse-failure-repository-echoed": {
    reason: "The repository's content could not be parsed",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
  "parse-failure-declaration-file": {
    reason: "A declaration file in the repository could not be read",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
} as const satisfies Record<
  string,
  { reason: string; attribution: Attribution; retryable: string }
>;

export type StopReasonKey = keyof typeof STOP_REASONS;

/**
 * AC-0095. A non-Agent-Ready repository is not a fault to fix in the
 * repository from Studio's side, so no repository next action is offered; these
 * are the actions the lead actually has.
 */
export const LEAD_ACTIONS = [
  "Retry the inspection",
  "Connect a different repository",
] as const;

export interface ProjectionInput {
  readonly state: UserVisibleState;
  readonly reason?: StopReasonKey;
  /** What the transport reported, or null when it reported none (AC-0097). */
  readonly waitWindow?: string | null;
  /** A protocol or diagnostic identifier, for the secondary surface only. */
  readonly diagnosticIdentifier?: string;
}

export interface StateProjection {
  readonly state: UserVisibleState;
  readonly label: string;
  readonly attention: Attention;
  readonly degraded: boolean;
  readonly lookedFor?: string;
  readonly foundInstead?: string;
  readonly attribution?: Attribution;
  readonly retryable?: string;
  readonly actions: readonly string[];
  readonly waitWindow?: string;
  /**
   * AC-0099. A protocol identifier never appears as user-visible copy; it
   * appears only here, which the renderer shows on the secondary diagnostic
   * surface. It is a separate field precisely so no copy path can reach it.
   */
  readonly secondaryDiagnostic?: string;
}

/**
 * Projects one state into everything a surface needs to render it honestly.
 *
 * For `inspection-stopped` the reason supplies the human reason, the
 * attribution and the retryability; for every other state they come from the
 * state's own row.
 */
export function project(input: ProjectionInput): StateProjection {
  const row = STATE_ROWS[input.state];
  const stop =
    input.state === "inspection-stopped" && input.reason !== undefined
      ? STOP_REASONS[input.reason]
      : undefined;

  const waitWindow =
    input.state === "source-rate-limited"
      ? (input.waitWindow ?? "Studio was not told how long to wait")
      : undefined;

  return {
    state: input.state,
    label: stop === undefined ? row.label : `${row.label}: ${stop.reason}`,
    attention: row.attention,
    degraded: row.degraded,
    ...(row.lookedFor === undefined ? {} : { lookedFor: row.lookedFor }),
    ...(row.foundInstead === undefined
      ? {}
      : { foundInstead: row.foundInstead }),
    ...((stop?.attribution ?? row.attribution)
      ? { attribution: stop?.attribution ?? row.attribution }
      : {}),
    ...((stop?.retryable ?? row.retryable)
      ? { retryable: stop?.retryable ?? row.retryable }
      : {}),
    actions: [...LEAD_ACTIONS],
    ...(waitWindow === undefined ? {} : { waitWindow }),
    ...(input.diagnosticIdentifier === undefined
      ? {}
      : { secondaryDiagnostic: input.diagnosticIdentifier }),
  };
}

/**
 * AC-0096. A recognised rate-limiting signal yields `source-rate-limited`; its
 * absence yields `source-unavailable`. The distinction is the signal, not the
 * failure, so an unreachable repository is never reported as rate limiting.
 */
export function unreachableCondition(
  rateLimitSignalRecognised: boolean,
): ConditionValue {
  return rateLimitSignalRecognised
    ? "source-rate-limited"
    : "source-unavailable";
}

/**
 * AC-0098. No state offers, suggests or links to a credential as a remedy. The
 * predicate is over the words a surface would show, so it can be run across
 * every projection rather than trusted per state.
 */
const CREDENTIAL_WORDS = [
  "token",
  "credential",
  "password",
  "secret",
  "sign in",
  "log in",
  "authenticate",
  "personal access",
  "api key",
];

export function offersCredential(text: string): boolean {
  const lowered = text.toLowerCase();
  return CREDENTIAL_WORDS.some((word) => lowered.includes(word));
}

/** Every string a projection would put in front of a lead. */
export function userVisibleCopy(projection: StateProjection): string[] {
  return [
    projection.label,
    projection.lookedFor,
    projection.foundInstead,
    projection.retryable,
    projection.waitWindow,
    ...projection.actions,
  ].filter((value): value is string => typeof value === "string");
}

/**
 * The pre-submission refusal reasons AC-0108 requires be distinguishable from
 * one another. Here rather than in the service because the renderer displays
 * them and may not import that package.
 */
export const SOURCE_REJECTION_REASONS = {
  publicGithubOnly: "Studio connects to public github.com repositories only",
  embeddedCredentials:
    "Remove the username or token from the URL — Studio never uses credentials",
  repositoryMainPageOnly:
    "Use the repository's main page URL, not a link to a file or branch",
  invalidOwnerOrRepository:
    "That owner or repository name has characters Studio cannot use",
  invalidRef: "That branch or tag name has characters Studio cannot use",
} as const;
