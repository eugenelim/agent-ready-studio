// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_TICK_MS, ProgressPulse } from "./ProgressPulse.js";

afterEach(cleanup);

describe("AC-0129 the progress text channel", () => {
  it("updates within the Progress text cadence bounds", () => {
    // The row states both bounds exactly: at least every 2 s, and no more
    // often than every 1 s. A tick outside either end fails the criterion --
    // too slow and the channel stops reading as live under reduced motion,
    // too fast and it becomes the motion the preference asked to remove.
    expect(PROGRESS_TICK_MS).toBeGreaterThanOrEqual(1_000);
    expect(PROGRESS_TICK_MS).toBeLessThanOrEqual(2_000);
  });

  it("restates the elapsed time on each tick", () => {
    vi.useFakeTimers();
    try {
      let clock = 10_000;
      render(<ProgressPulse startedAt={10_000} now={() => clock} />);
      expect(screen.getByText("Running for 0 seconds")).toBeDefined();

      clock = 13_000;
      act(() => vi.advanceTimersByTime(PROGRESS_TICK_MS));
      expect(screen.getByText("Running for 3 seconds")).toBeDefined();

      clock = 14_000;
      act(() => vi.advanceTimersByTime(PROGRESS_TICK_MS));
      expect(screen.getByText("Running for 4 seconds")).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("is not a live region", () => {
    // AC-0129 says so explicitly, and AC-0128 is why: a channel that
    // announced every tick would produce dozens of announcements per
    // transition, drowning the one the transition is allowed.
    render(<ProgressPulse startedAt={Date.now()} />);
    const channel = document.querySelector("[data-progress-text]");
    expect(channel).not.toBeNull();
    expect(channel?.getAttribute("aria-live")).toBeNull();
    expect(channel?.getAttribute("role")).toBeNull();
    expect(document.querySelectorAll("[aria-live]")).toHaveLength(0);
  });

  it("stops ticking when the phase ends", () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<ProgressPulse startedAt={0} />);
      unmount();
      // An interval surviving the phase would keep a dead timer alive and,
      // worse, report a phase that is over as still running.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
