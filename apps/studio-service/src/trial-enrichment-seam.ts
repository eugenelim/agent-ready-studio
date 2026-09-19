/**
 * The Studio-Service half of the enrichment seam.
 *
 * AC-0041 requires this to be **one named module that no non-seam surface
 * imports**, so that removing the seam requires editing no code outside it.
 * That is a structural property, not a stylistic one: the seam is provisional,
 * and the trial Runtime it serves expires by the *Trial Runtime authorization*
 * clause. When it goes, this file goes, and nothing else has to be untangled.
 *
 * The rule the module keeps is therefore about its **importers**, not its
 * imports: it may read from the trial's own modules, but no ordinary Service
 * surface may read from it. Its own test is the one admitted importer, because
 * a module nothing may import could otherwise never be exercised.
 *
 * AC-0042 lives here too: the northbound request carries no field whose value
 * is a local filesystem path. Paths are how a trial's on-disk arrangement would
 * leak into a published surface, and they are the one thing this seam refuses
 * to forward.
 */
import type { CanonicalSourceIdentity } from "./source-identity.js";
import { mintRequestIdentifier, TRIAL_CONTRACT } from "./trial-result.js";

/**
 * The northbound request. Every field is either Studio-minted or part of the
 * canonical identity; there is deliberately no field for a materialization
 * root, a state root, a sweep domain or an inspector path.
 */
export interface NorthboundTrialRequest {
  readonly contract: typeof TRIAL_CONTRACT;
  readonly requestId: string;
  readonly owner: string;
  readonly repository: string;
  readonly requestedRef?: string;
}

/**
 * True when a value looks like a local filesystem path. The test is deliberately
 * broad — an absolute path, a home-relative path, a traversal, or a Windows
 * drive letter — because AC-0042's obligation is that no such value is present
 * at all, and a narrow test would pass a field that a reader would still
 * recognise as a path.
 */
export function looksLikeFilesystemPath(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return (
    value.startsWith("/") ||
    value.startsWith("~") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.includes("\\")
  );
}

/**
 * Builds the northbound request from the canonical identity alone. The
 * identifier is minted here rather than accepted, which is AC-0033 held at the
 * one site that constructs a request.
 */
export function buildNorthboundRequest(
  identity: CanonicalSourceIdentity,
  requestedRef?: string,
): NorthboundTrialRequest {
  const request: NorthboundTrialRequest = {
    contract: TRIAL_CONTRACT,
    requestId: mintRequestIdentifier(),
    owner: identity.owner,
    repository: identity.repository,
    ...(requestedRef === undefined ? {} : { requestedRef }),
  };
  for (const [field, value] of Object.entries(request)) {
    if (looksLikeFilesystemPath(value)) {
      throw new Error(
        `northbound request field ${field} carries a filesystem path`,
      );
    }
  }
  return request;
}
