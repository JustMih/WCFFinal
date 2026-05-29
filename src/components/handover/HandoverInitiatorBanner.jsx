import React, { useCallback, useEffect, useState } from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../config";
import { confirmRevokeHandover } from "../../utils/handoverAlerts";
import "./HandoverInitiatorBanner.css";

const DISMISS_PREFIX = "handoverBannerDismissed:";

function isDismissed(handoverId) {
  return sessionStorage.getItem(`${DISMISS_PREFIX}${handoverId}`) === "1";
}

function formatReturnDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function HandoverInitiatorBanner() {
  const userId = localStorage.getItem("userId") || "";
  const [activeHandover, setActiveHandover] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");

  const fetchInitiatorHandover = useCallback(async () => {
    if (!userId) {
      setActiveHandover(null);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/users/handover/active`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) return;

      const data = await response.json();
      const handovers = Array.isArray(data?.handovers) ? data.handovers : [];
      const mine = handovers.filter(
        (h) =>
          h.status === "active" && String(h.from_user_id) === String(userId)
      );
      const latest = mine[0] || null;
      setActiveHandover(latest);
      setHidden(latest ? isDismissed(latest.id) : false);
      setError("");
    } catch {
      setActiveHandover(null);
    }
  }, [userId]);

  useEffect(() => {
    fetchInitiatorHandover();
    const interval = setInterval(fetchInitiatorHandover, 60000);
    return () => clearInterval(interval);
  }, [fetchInitiatorHandover]);

  const handleHide = () => {
    if (!activeHandover?.id) return;
    sessionStorage.setItem(`${DISMISS_PREFIX}${activeHandover.id}`, "1");
    setHidden(true);
  };

  const handleRevoke = async () => {
    if (!activeHandover?.id || revoking) return;

    const delegateName =
      activeHandover.toUser?.full_name || activeHandover.to_user_id || "";
    const confirmed = await confirmRevokeHandover({ delegateName });
    if (!confirmed) return;

    setRevoking(true);
    setError("");

    try {
      const response = await fetch(
        `${baseURL}/users/handover/${activeHandover.id}/revoke`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to revoke handover");
      }
      setActiveHandover(null);
      await fetchInitiatorHandover();
    } catch (err) {
      setError(err.message || "Failed to revoke handover");
    } finally {
      setRevoking(false);
    }
  };

  if (!activeHandover || hidden) {
    return null;
  }

  const delegateName =
    activeHandover.toUser?.full_name || activeHandover.to_user_id || "delegate";
  const delegateActsAs =
    activeHandover.from_user_role || activeHandover.fromUser?.role || "";

  return (
    <div className="handover-initiator-banner" role="status" aria-live="polite">
      <div className="handover-initiator-banner__card">
        <div className="handover-initiator-banner__icon" aria-hidden="true">
          <SwapHorizIcon fontSize="large" />
        </div>
        <div className="handover-initiator-banner__body">
          <p className="handover-initiator-banner__title">Handover active</p>
          <p className="handover-initiator-banner__subtitle">
            You are in handover mode
          </p>
          <p className="handover-initiator-banner__text">
            Your tickets have been delegated to{" "}
            <strong>{delegateName}</strong>
            {delegateActsAs ? (
              <>
                , who is acting in your capacity as{" "}
                <strong>{delegateActsAs}</strong>
              </>
            ) : null}
            . Ticket actions remain locked on your account until you revoke.
          </p>
          <div className="handover-initiator-banner__meta-row">
            <span className="handover-initiator-banner__meta-label">
              Scheduled return
            </span>
            <span className="handover-initiator-banner__meta-value">
              {formatReturnDate(activeHandover.return_at)}
            </span>
          </div>
          {activeHandover.reason ? (
            <p className="handover-initiator-banner__reason">
              <span className="handover-initiator-banner__meta-label">Reason</span>
              {activeHandover.reason}
            </p>
          ) : null}
          {error ? (
            <p className="handover-initiator-banner__error">{error}</p>
          ) : null}
        </div>
        <div className="handover-initiator-banner__actions">
          <Button
            variant="outlined"
            className="handover-initiator-banner__hide"
            onClick={handleHide}
            disabled={revoking}
          >
            Hide
          </Button>
          <Button
            variant="contained"
            color="error"
            className="handover-initiator-banner__revoke"
            onClick={handleRevoke}
            disabled={revoking}
          >
            {revoking ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Revoke"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function clearHandoverBannerDismissKeys() {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("handoverBannerDismissed:")) {
      sessionStorage.removeItem(key);
    }
  });
}
