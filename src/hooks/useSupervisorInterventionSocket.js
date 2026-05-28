import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import { baseURL } from "../config";

const MODE_SEVERITY = {
  listen: "info",
  whisper: "warning",
  barge: "error",
};

const MODE_TITLE = {
  listen: "Supervisor listening",
  whisper: "Supervisor whispering",
  barge: "Supervisor barged in",
};

/**
 * Real-time alert when a supervisor listen / whisper / barge starts on this agent's call.
 */
export function useSupervisorInterventionSocket({ onNotify, enabled = true }) {
  const [intervention, setIntervention] = useState(null);

  const clearIntervention = useCallback(() => setIntervention(null), []);

  useEffect(() => {
    if (!enabled) return undefined;

    const agentExtension = localStorage.getItem("extension");
    const userId = localStorage.getItem("userId");
    if (!agentExtension) return undefined;

    const socketUrl = (baseURL || "").replace(/\/api\/?$/, "") || baseURL;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      if (userId) socket.emit("register", userId);
    });

    socket.on("supervisor_intervention", (payload) => {
      if (!payload) return;
      const mode = payload.mode || "listen";
      if (mode !== "whisper" && mode !== "barge") return;

      const target = String(payload.agent_extension || "");
      if (target !== String(agentExtension)) return;
      const entry = {
        ...payload,
        mode,
        severity: MODE_SEVERITY[mode] || "info",
        title: MODE_TITLE[mode] || "Supervisor on your call",
        message:
          payload.message ||
          `${payload.supervisor_name || "Supervisor"} is on your call.`,
      };

      setIntervention(entry);
      onNotify?.(entry.message, entry.severity, entry);
    });

    return () => {
      socket.off("supervisor_intervention");
      socket.disconnect();
    };
  }, [enabled, onNotify]);

  return { intervention, clearIntervention };
}
