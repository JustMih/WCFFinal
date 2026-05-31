import { useCallback, useEffect, useState } from "react";
import { baseURL } from "../config";

function findInitiatorHandover(handovers, userId) {
  if (!userId || !Array.isArray(handovers)) return null;
  return (
    handovers.find(
      (h) =>
        h.status === "active" && String(h.from_user_id) === String(userId)
    ) || null
  );
}

export function useInitiatorHandoverLock() {
  const userId = localStorage.getItem("userId") || "";
  const [locked, setLocked] = useState(false);
  const [activeHandover, setActiveHandover] = useState(null);
  const [checking, setChecking] = useState(true);

  const fetchLockState = useCallback(async () => {
    if (!userId) {
      setLocked(false);
      setActiveHandover(null);
      setChecking(false);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLocked(false);
        setActiveHandover(null);
        setChecking(false);
        return;
      }

      const response = await fetch(`${baseURL}/users/handover/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setLocked(false);
        setActiveHandover(null);
        setChecking(false);
        return;
      }

      const data = await response.json();
      const handovers = Array.isArray(data?.handovers) ? data.handovers : [];
      const mine = findInitiatorHandover(handovers, userId);
      setActiveHandover(mine);
      setLocked(Boolean(mine));
    } catch {
      setLocked(false);
      setActiveHandover(null);
    } finally {
      setChecking(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLockState();
    const interval = setInterval(fetchLockState, 60000);
    return () => clearInterval(interval);
  }, [fetchLockState]);

  const refreshAfterRevoke = useCallback(async () => {
    setLocked(false);
    setActiveHandover(null);
    await fetchLockState();
  }, [fetchLockState]);

  return {
    locked,
    activeHandover,
    checking,
    refreshAfterRevoke,
    fetchLockState,
  };
}
