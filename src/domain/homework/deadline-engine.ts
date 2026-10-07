/**
 * Deadline Management Domain Engine
 *
 * Implements strict vs grace-period deadlines, live countdown calculations,
 * and automated submission locking for quizzes, tests, and homework assignments.
 */

export interface DeadlineStatus {
  isExpired: boolean;
  isUrgent: boolean;
  badgeColor: "green" | "amber" | "red";
  displayText: string;
  detailedCountdown: string;
  canSubmit: boolean;
  submissionWarning?: string;
}

/**
 * Calculates deadline status, urgency, and live countdown badges
 */
export function calculateDeadlineStatus(
  dueAt: string | Date,
  isStrictDeadline: boolean = true,
  currentTime: Date = new Date()
): DeadlineStatus {
  const target = typeof dueAt === "string" ? new Date(dueAt).getTime() : dueAt.getTime();
  const now = currentTime.getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return {
      isExpired: true,
      isUrgent: false,
      badgeColor: "red",
      displayText: isStrictDeadline ? "🔒 Closed (Deadline Expired)" : "⚠️ Past Due (Late Submission)",
      detailedCountdown: "00h 00m 00s remaining",
      canSubmit: !isStrictDeadline,
      submissionWarning: isStrictDeadline
        ? "Submissions are closed. The deadline for this assessment has expired."
        : "The deadline has passed. Your submission will be recorded with a LATE tag.",
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 1) {
    return {
      isExpired: false,
      isUrgent: false,
      badgeColor: "green",
      displayText: `⏳ Closes in ${days} days ${hours}h`,
      detailedCountdown: `${days}d ${hours}h ${minutes}m remaining`,
      canSubmit: true,
    };
  }

  if (days === 1 || hours >= 4) {
    return {
      isExpired: false,
      isUrgent: false,
      badgeColor: "amber",
      displayText: `⏳ Due in ${days > 0 ? "1d " : ""}${hours} hours`,
      detailedCountdown: `${days > 0 ? "1d " : ""}${hours}h ${minutes}m remaining`,
      canSubmit: true,
    };
  }

  // Under 4 hours is urgent
  return {
    isExpired: false,
    isUrgent: true,
    badgeColor: "red",
    displayText: `🚨 Urgent: ${hours}h ${minutes}m left!`,
    detailedCountdown: `${hours}h ${minutes}m remaining before auto-lock`,
    canSubmit: true,
  };
}
