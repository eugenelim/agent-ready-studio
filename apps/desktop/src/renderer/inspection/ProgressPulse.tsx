import { useEffect, useState } from "react";

/**
 * The progress text channel AC-0129 requires.
 *
 * Under a reduced-motion preference the state-change motion is omitted, which
 * would leave `resolving` and `inspecting` looking frozen for up to 150
 * seconds. This channel is what keeps them perceptibly live without motion: it
 * restates how long the phase has been running, updating inside the
 * *Progress text cadence* bounds.
 *
 * It is deliberately **not** a live region. AC-0128 allows exactly one polite
 * announcement per transition, and a channel that announced every tick would
 * produce dozens per transition -- turning the one useful announcement into
 * noise. A sighted reader sees it change; a screen-reader user hears the
 * transition once and can read this on demand.
 */
export const PROGRESS_TICK_MS = 1_500;

export function ProgressPulse({
  startedAt,
  now = () => Date.now(),
}: Readonly<{ startedAt: number; now?: () => number }>) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((now() - startedAt) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((now() - startedAt) / 1000)));
    }, PROGRESS_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, now]);

  return (
    <p className="inspection-progress__pulse" data-progress-text="elapsed">
      {`Running for ${elapsed} second${elapsed === 1 ? "" : "s"}`}
    </p>
  );
}
