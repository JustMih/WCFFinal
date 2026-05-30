/** Shared pause activity config for agent dashboard and online agents table */

export const PAUSE_DURATIONS_MIN = {
  breakfast: 15,
  lunch: 45,
  shortCall: 10,
  followUp: 15,
  attendingMeeting: 30,
  emergency: 20,
};

export const mapActivityToTimerKey = (activity) => {
  switch ((activity || "").toLowerCase()) {
    case "breakfast":
      return "breakfast";
    case "lunch":
      return "lunch";
    case "short call":
      return "shortCall";
    case "follow-up of customer inquiries":
      return "followUp";
    case "attending meeting":
      return "attendingMeeting";
    case "emergency":
      return "emergency";
    default:
      return null;
  }
};

export const getTimeIntervalsSeconds = (userDefinedTimes = {}) => ({
  breakfast: PAUSE_DURATIONS_MIN.breakfast * 60,
  lunch: PAUSE_DURATIONS_MIN.lunch * 60,
  shortCall: PAUSE_DURATIONS_MIN.shortCall * 60,
  followUp: PAUSE_DURATIONS_MIN.followUp * 60,
  attendingMeeting:
    (userDefinedTimes.attendingMeeting || PAUSE_DURATIONS_MIN.attendingMeeting) *
    60,
  emergency:
    (userDefinedTimes.emergency || PAUSE_DURATIONS_MIN.emergency) * 60,
});

export const getPauseLimitSeconds = (activity, userDefinedTimes = {}) => {
  const key = mapActivityToTimerKey(activity);
  if (!key) return 0;
  const intervals = getTimeIntervalsSeconds(userDefinedTimes);
  return intervals[key] || 0;
};

export const formatRemainingTime = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(mins)}:${pad(secs)}`;
};

export const formatPauseDuration = (seconds) => {
  const totalMins = Math.round(seconds / 60);
  if (totalMins < 60) return `${totalMins} min`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
};

/** CSS slug for status badge, e.g. "attending meeting" -> "attending-meeting" */
export const activityToBadgeClass = (activity) => {
  if (!activity) return "pause";
  const key = mapActivityToTimerKey(activity);
  const map = {
    breakfast: "breakfast",
    lunch: "lunch",
    shortCall: "short-call",
    followUp: "follow-up",
    attendingMeeting: "attending-meeting",
    emergency: "emergency",
  };
  return map[key] || "pause";
};

export const formatActivityLabel = (activity) => {
  if (!activity) return "Pause";
  return activity
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** Remaining seconds from pause_started_at ISO string */
export const getRemainingSecondsFromStart = (
  activity,
  pauseStartedAt,
  userDefinedTimes = {},
  allowedSecondsOverride = null
) => {
  if (!pauseStartedAt || !activity) return 0;
  const limit =
    allowedSecondsOverride != null
      ? allowedSecondsOverride
      : getPauseLimitSeconds(activity, userDefinedTimes);
  if (!limit) return 0;
  const started = new Date(pauseStartedAt).getTime();
  if (Number.isNaN(started)) return limit;
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, limit - elapsed);
};

export const getExceededSecondsFromStart = (
  activity,
  pauseStartedAt,
  userDefinedTimes = {},
  allowedSecondsOverride = null
) => {
  if (!pauseStartedAt || !activity) return 0;
  const limit =
    allowedSecondsOverride != null
      ? allowedSecondsOverride
      : getPauseLimitSeconds(activity, userDefinedTimes);
  if (!limit) return 0;
  const started = new Date(pauseStartedAt).getTime();
  if (Number.isNaN(started)) return 0;
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, elapsed - limit);
};

export const formatExceededTime = (seconds) => formatRemainingTime(seconds);

export const getPauseLiveMetrics = (
  activity,
  pauseStartedAt,
  userDefinedTimes = {},
  allowedSecondsOverride = null
) => {
  const allowed =
    allowedSecondsOverride != null
      ? allowedSecondsOverride
      : getPauseLimitSeconds(activity, userDefinedTimes);
  const remaining = getRemainingSecondsFromStart(
    activity,
    pauseStartedAt,
    userDefinedTimes,
    allowed
  );
  const exceeded = getExceededSecondsFromStart(
    activity,
    pauseStartedAt,
    userDefinedTimes,
    allowed
  );
  return {
    pause_allowed_seconds: allowed,
    remaining_seconds: remaining,
    exceeded_seconds: exceeded,
    is_exceeded: exceeded > 0,
  };
};

export const formatSecondsAsDuration = (seconds) => {
  if (seconds == null) return "—";
  return formatPauseDuration(seconds);
};

export const PAUSE_MENU_ITEMS = [
  {
    activity: "ready",
    label: "Ready",
    durationSeconds: null,
  },
  {
    activity: "breakfast",
    label: "Breakfast",
    timerKey: "breakfast",
  },
  {
    activity: "lunch",
    label: "Lunch",
    timerKey: "lunch",
  },
  {
    activity: "attending meeting",
    label: "Attending Meeting",
    timerKey: "attendingMeeting",
  },
  {
    activity: "short call",
    label: "Short Call",
    timerKey: "shortCall",
  },
  {
    activity: "emergency",
    label: "Emergency",
    timerKey: "emergency",
  },
  {
    activity: "follow-up of customer inquiries",
    label: "Follow-up of customer inquiries",
    timerKey: "followUp",
  },
];
