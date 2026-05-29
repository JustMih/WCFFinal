import React, { useState } from "react";
import { Chip, Typography } from "@mui/material";
import WcfLoader from "../shared/WcfLoader";
import { WORKFLOW_PATHS } from "../../utils/permissions";
import {
  formatRole,
  getCreatorName,
  buildWorkflowSteps,
  getStepLabel,
} from "../../utils/workflowTrailExport";
import "./TicketWorkflowExpandPanel.css";

function getWorkflowRole(ticket) {
  return ticket.current_workflow_role || ticket.workflow_current_role || null;
}

function getPathInfo(ticket) {
  const pathKey = ticket.workflow_path;
  if (!pathKey) return null;
  return WORKFLOW_PATHS[pathKey] || null;
}

function TruncatedText({ text, maxLen = 160 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text || text === "-") return <span className="workflow-step-message">—</span>;
  if (text.length <= maxLen) {
    return <span className="workflow-step-message">{text}</span>;
  }
  return (
    <span className="workflow-step-message">
      {expanded ? text : `${text.slice(0, maxLen)}…`}{" "}
      <button
        type="button"
        className="workflow-show-more"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}

export default function TicketWorkflowExpandPanel({
  ticket,
  assignments = [],
  loading = false,
  error = null,
}) {
  const pathInfo = getPathInfo(ticket);
  const pathKey = ticket.workflow_path;
  const currentStep = ticket.current_workflow_step || 1;
  const totalSteps = pathInfo?.totalSteps || ticket.workflow_total_steps || "—";
  const currentRole = getWorkflowRole(ticket);

  const workflowSteps = buildWorkflowSteps(ticket, assignments);
  const assignmentSteps = workflowSteps.slice(1);

  if (loading) {
    return (
      <div className="ticket-workflow-expand-panel">
        <div className="ticket-workflow-expand-loading">
          <WcfLoader size="sm" message="Loading workflow history…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-workflow-expand-panel">
        <p className="ticket-workflow-expand-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="ticket-workflow-expand-panel">
      <div className="ticket-workflow-expand-header">
        <div className="ticket-workflow-expand-summary">
          {pathKey ? (
            <>
              <Chip
                size="small"
                label={pathInfo?.name || pathKey.replace(/_/g, " ")}
                className="workflow-path-chip"
              />
              <Typography variant="body2" component="span">
                Step {currentStep} of {totalSteps}
                {currentRole ? ` · ${formatRole(currentRole)}` : ""}
              </Typography>
              {ticket.workflow_completed && (
                <Chip size="small" label="Completed" color="success" />
              )}
            </>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No workflow path assigned
            </Typography>
          )}
        </div>
        {ticket.workflow_started_at && (
          <Typography variant="caption" color="textSecondary">
            Started: {new Date(ticket.workflow_started_at).toLocaleString()}
            {ticket.workflow_completed_at &&
              ` · Completed: ${new Date(ticket.workflow_completed_at).toLocaleString()}`}
          </Typography>
        )}
      </div>

      {assignmentSteps.length === 0 && workflowSteps.length <= 1 ? (
        <p className="ticket-workflow-expand-empty">No assignment history for this ticket.</p>
      ) : (
        <ol className="ticket-workflow-timeline">
          {workflowSteps.map((step, idx) => {
            const isCreator = idx === 0;
            const rawAssignment = assignments[idx - 1];
            const stepNum = rawAssignment?.workflow_step;

            return (
              <li key={idx} className="ticket-workflow-timeline-item">
                <div className="ticket-workflow-timeline-marker" aria-hidden />
                <div className="ticket-workflow-timeline-body">
                  <div className="ticket-workflow-timeline-top">
                    <span className="ticket-workflow-timeline-name">{step.person}</span>
                    <span className="ticket-workflow-timeline-role">
                      ({step.role})
                    </span>
                    <span className="ticket-workflow-timeline-date">
                      {step.startedAtFormatted}
                    </span>
                  </div>
                  <div className="ticket-workflow-timeline-meta">
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Held: ${step.duration}`}
                    />
                    {!isCreator && step.action && (
                      <Chip size="small" variant="outlined" label={step.action} />
                    )}
                    {stepNum != null && pathKey && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Step ${stepNum}: ${getStepLabel(pathKey, stepNum)}`}
                      />
                    )}
                    {step.workflowNextRole && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Next: ${step.workflowNextRole}`}
                      />
                    )}
                  </div>
                  {(step.notes || (isCreator && ticket.description)) && (
                    <div className="ticket-workflow-timeline-message">
                      <TruncatedText
                        text={
                          isCreator
                            ? ticket.description
                              ? `Created the ticket. ${ticket.description}`
                              : "Created the ticket"
                            : step.notes
                        }
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="ticket-workflow-expand-hint">
        Time shown is how long the ticket stayed with each person until the next handoff.
        CSV/PDF export includes the full workflow trail when those columns are selected.
      </p>
    </div>
  );
}
