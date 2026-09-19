import { useEffect, useRef, useState } from "react";

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
  now,
}: Readonly<{ startedAt: number; now?: () => number }>) {
  // Held in a ref so the effect does not depend on the callback's identity. A
  // default arrow in the parameter list is a fresh function every render, and
  // with it in the dependency array any parent re-render inside the tick
  // window tore the interval down and started a fresh full delay -- starving
  // the channel that exists to stay perceptibly live for up to 150 seconds.
  const clock = useRef(now ?? Date.now);
  clock.current = now ?? Date.now;

  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((clock.current() - startedAt) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((clock.current() - startedAt) / 1000)));
    }, PROGRESS_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <p className="inspection-progress__pulse" data-progress-text="elapsed">
      {`Running for ${elapsed} second${elapsed === 1 ? "" : "s"}`}
    </p>
  );
}
