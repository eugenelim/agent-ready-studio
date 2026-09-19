import { project } from "@agent-ready/protocol";
import { forwardRef } from "react";
import { StateBadge } from "./StateBadge.js";

/**
 * The Connect repository action and its single-field form.
 *
 * AC-0106 is a shape obligation, not a copy one: the form carries one field,
 * and there is no credential, token or password input to omit because none is
 * declared. The submitted string is the only thing that reaches the service.
 */
export const ConnectRepositoryForm = forwardRef<
  HTMLInputElement,
  Readonly<{
    url: string;
    onUrlChange: (url: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    /** In flight, so the form is disabled and cancel is the way out. */
    busy: boolean;
    /** The refusal to show, or null when the last submission was not refused. */
    rejection: string | null;
    cancelRef: React.Ref<HTMLButtonElement>;
  }>
>(function ConnectRepositoryForm(
  { url, onUrlChange, onSubmit, onCancel, busy, rejection, cancelRef },
  urlRef,
) {
  const rejectionId = "connect-url-rejection";
  const busyId = "connect-in-flight";

  return (
    <form
      className="connect-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      // AC-0127: the surface's own heading, so focus order follows reading
      // order rather than the order the elements happened to be written in.
      aria-labelledby="connect-heading"
    >
      <h2 id="connect-heading">Connect repository</h2>

      <label className="connect-form__label" htmlFor="connect-url">
        Public GitHub repository URL
      </label>
      <input
        id="connect-url"
        ref={urlRef}
        className="connect-form__input"
        type="text"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        disabled={busy}
        // AC-0109: the refusal is programmatically associated with the field
        // and the field is marked invalid, so the reason is not merely nearby.
        aria-invalid={rejection !== null}
        aria-describedby={
          [rejection !== null ? rejectionId : null, busy ? busyId : null]
            .filter((id): id is string => id !== null)
            .join(" ") || undefined
        }
      />

      {rejection !== null && (
        // AC-0110: the echoed input arrives as a string and is rendered as a
        // text child. React escapes it; nothing here sets markup, and the
        // reason the service produced is the only text shown.
        <p
          className="connect-form__rejection"
          id={rejectionId}
          data-state="url-rejected"
        >
          {rejection}
        </p>
      )}

      {busy && (
        <p className="connect-form__busy" id={busyId}>
          An inspection is running, so the form is disabled. Use Cancel
          inspection to stop it.
        </p>
      )}

      <div className="connect-form__actions">
        <button type="submit" disabled={busy}>
          Connect repository
        </button>
        <button
          type="button"
          ref={cancelRef}
          onClick={onCancel}
          disabled={!busy}
        >
          Cancel inspection
        </button>
      </div>
    </form>
  );
});

/**
 * AC-0107. Before anything is connected the surface says what connecting will
 * do, rather than showing an empty frame the lead has to interpret.
 */
export function UnconnectedNotice() {
  return (
    <section
      className="inspection-unconnected"
      aria-labelledby="unconnected-heading"
    >
      <h2 id="unconnected-heading">Before you connect</h2>
      <StateBadge state="unconnected" resolvedSha={null} emphasis="primary" />
      <p>
        Connecting a public GitHub repository asks Studio to find its latest
        commit and inspect that commit for an agent-ready workspace. Studio
        reads the repository; it never writes to it.
      </p>
      <p className="inspection-unconnected__actions">
        {project({ state: "unconnected" }).actions.join(" ")}
      </p>
    </section>
  );
}
