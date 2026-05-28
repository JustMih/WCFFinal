import { WORKFLOW_PATHS } from "./permissions";

const ROLE_LABELS = {
  agent: "Agent",
  reviewer: "Reviewer",
  coordinator: "Coordinator",
  "head-of-unit": "Head of Unit",
  director: "Director",
  manager: "Manager",
  attendee: "Attendee",
  "director-general": "Director General",
  Creator: "Creator",
};

export function formatRole(role) {
  if (!role) return "N/A";
  return (
    ROLE_LABELS[role] ||
    String(role).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getCreatorName(ticket) {
  if (ticket.creator_name) return ticket.creator_name;
  if (ticket.requester_name) return ticket.requester_name;
  if (ticket.full_name) return ticket.full_name;
  if (ticket.first_name && ticket.last_name) {
    return `${ticket.first_name} ${ticket.last_name}`.trim();
  }
  return ticket.requester || "Creator";
}

export function getStepLabel(pathKey, stepIndex) {
  const path = WORKFLOW_PATHS[pathKey];
  if (!path || !stepIndex) return `Step ${stepIndex}`;
  const role = path.steps[stepIndex - 1];
  return role ? formatRole(role) : `Step ${stepIndex}`;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeStepDurationMs(stepStart, stepEnd) {
  const start = parseDate(stepStart);
  const end = parseDate(stepEnd);
  if (!start || !end) return 0;
  return Math.max(0, end.getTime() - start.getTime());
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return "0 minutes";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }
  return parts.join(", ");
}

function getTicketEndDate(ticket) {
  return (
    parseDate(ticket.workflow_completed_at) ||
    parseDate(ticket.date_of_resolution) ||
    parseDate(ticket.resolved_at) ||
    (ticket.status === "Closed" ? parseDate(ticket.updated_at) : null) ||
    new Date()
  );
}

function truncateNotes(text, maxLen = 120) {
  if (!text) return "";
  const s = String(text).trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

/**
 * Build ordered workflow steps with inter-step durations (not cumulative API aging).
 */
export function buildWorkflowSteps(ticket, assignments = []) {
  const sorted = [...(assignments || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const ticketStart =
    parseDate(ticket.created_at) ||
    parseDate(ticket.request_registered_date) ||
    new Date();

  const ticketEnd = getTicketEndDate(ticket);
  const pathKey = ticket.workflow_path;

  const rawSteps = [
    {
      person: getCreatorName(ticket),
      role: "Creator",
      action: "Created",
      startedAt: ticketStart,
      notes: ticket.description || "",
      workflowStep: null,
    },
    ...sorted.map((a) => ({
      person: a.assigned_to_name || a.assigned_to_id || "Unknown",
      role:
        a.assigned_to_role ||
        a.workflow_current_role ||
        a.assignedTo?.role ||
        "N/A",
      action: a.action || "Assigned",
      startedAt: parseDate(a.created_at),
      notes: a.reason || "",
      workflowStep: a.workflow_step,
      workflowNextRole: a.workflow_next_role,
    })),
  ];

  return rawSteps.map((step, idx) => {
    const nextStart =
      idx < rawSteps.length - 1
        ? rawSteps[idx + 1].startedAt
        : ticketEnd;

    const durationMs = computeStepDurationMs(step.startedAt, nextStart);

    let notes = truncateNotes(step.notes);
    if (idx > 0 && step.workflowStep != null && pathKey) {
      const stepLabel = getStepLabel(pathKey, step.workflowStep);
      notes = notes ? `${stepLabel} — ${notes}` : stepLabel;
    }

    return {
      stepNumber: idx + 1,
      person: step.person,
      role: formatRole(step.role),
      action: step.action,
      startedAt: step.startedAt,
      startedAtFormatted: step.startedAt
        ? step.startedAt.toLocaleString()
        : "—",
      durationMs,
      duration: formatDuration(durationMs),
      notes,
      workflowStep: step.workflowStep,
      workflowNextRole: step.workflowNextRole
        ? formatRole(step.workflowNextRole)
        : null,
    };
  });
}

export function formatWorkflowTrailForExport(steps) {
  if (!steps || steps.length === 0) {
    return "(no workflow history)";
  }

  return steps
    .map(
      (s) =>
        `${s.stepNumber}. ${s.role} | ${s.person} | ${s.duration} | ${s.startedAtFormatted} | ${s.action}${s.notes ? ` — ${s.notes}` : ""}`
    )
    .join("\n");
}

export function formatWorkflowTrailPlain(steps) {
  if (!steps || steps.length === 0) return "(no workflow history)";
  return steps
    .map(
      (s) =>
        `${s.stepNumber}. ${s.role} (${s.person}): ${s.duration}`
    )
    .join("; ");
}

export function computeTotalTicketDuration(ticket, steps) {
  if (!steps || steps.length === 0) {
    const start = parseDate(ticket.created_at);
    const end = getTicketEndDate(ticket);
    if (!start) return "—";
    return formatDuration(computeStepDurationMs(start, end));
  }

  const totalMs = steps.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  return formatDuration(totalMs);
}

export function enrichTicketWithWorkflow(ticket, assignments, historyUnavailable = false) {
  if (historyUnavailable) {
    return {
      ...ticket,
      _workflowTrail: "(assignment history unavailable)",
      _workflowTotalDuration: "—",
    };
  }

  const steps = buildWorkflowSteps(ticket, assignments || []);
  return {
    ...ticket,
    _workflowTrail: formatWorkflowTrailForExport(steps),
    _workflowTotalDuration: computeTotalTicketDuration(ticket, steps),
    _workflowSteps: steps,
  };
}

export async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}
