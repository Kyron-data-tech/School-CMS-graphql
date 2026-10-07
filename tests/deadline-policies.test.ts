import { describe, it, expect } from "vitest";
import { calculateDeadlineStatus } from "@/domain/homework/deadline-engine";

describe("Deadline & Submission Policy Domain Engine Unit Tests", () => {
  const baseTime = new Date("2026-10-01T12:00:00Z");

  it("calculates active deadline correctly when more than 1 day remains", () => {
    const due = new Date("2026-10-04T12:00:00Z"); // 3 days later
    const status = calculateDeadlineStatus(due, true, baseTime);

    expect(status.isExpired).toBe(false);
    expect(status.canSubmit).toBe(true);
    expect(status.badgeColor).toBe("green");
    expect(status.displayText).toContain("3 days");
  });

  it("calculates moderate deadline between 4 and 24 hours correctly", () => {
    const due = new Date("2026-10-01T20:00:00Z"); // 8 hours later
    const status = calculateDeadlineStatus(due, true, baseTime);

    expect(status.isExpired).toBe(false);
    expect(status.isUrgent).toBe(false);
    expect(status.badgeColor).toBe("amber");
    expect(status.displayText).toContain("8 hours");
  });

  it("identifies urgent deadlines when under 4 hours remain", () => {
    const due = new Date("2026-10-01T14:30:00Z"); // 2.5 hours later
    const status = calculateDeadlineStatus(due, true, baseTime);

    expect(status.isExpired).toBe(false);
    expect(status.isUrgent).toBe(true);
    expect(status.badgeColor).toBe("red");
    expect(status.displayText).toContain("Urgent");
  });

  it("blocks submissions when strict deadline has expired", () => {
    const due = new Date("2026-10-01T10:00:00Z"); // 2 hours in the past
    const status = calculateDeadlineStatus(due, true, baseTime);

    expect(status.isExpired).toBe(true);
    expect(status.canSubmit).toBe(false);
    expect(status.displayText).toContain("Closed");
    expect(status.submissionWarning).toContain("Submissions are closed");
  });

  it("permits late submission with warning when soft deadline is active", () => {
    const due = new Date("2026-10-01T10:00:00Z"); // past due
    const status = calculateDeadlineStatus(due, false, baseTime);

    expect(status.isExpired).toBe(true);
    expect(status.canSubmit).toBe(true);
    expect(status.submissionWarning).toContain("LATE tag");
  });
});
