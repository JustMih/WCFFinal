import { useQuery, useQueryClient } from "@tanstack/react-query";
import { baseURL } from "../config";

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  // Try to parse JSON even on error, to surface backend message
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
    // mirror existing behavior: force relogin if token invalid
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.message) ||
      `HTTP error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Normalize list responses: backend sometimes returns {tickets}, {data}, or raw array
function normalizeTicketListResponse(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tickets)) return payload.tickets;
  // Some endpoints (e.g. overdue) return assignments instead of tickets
  if (Array.isArray(payload.assignments)) return payload.assignments;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  return [];
}

function normalizeAssignmentsResponse(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.assignments)) return payload.assignments;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export const ticketQueryKeys = {
  list: ({ type, userId, filters }) => ["tickets", type, String(userId || ""), filters || {}],
  assignments: (ticketId) => ["ticket-assignments", String(ticketId)],
};

function ticketListUrl({ type, userId }) {
  if (!userId && ["assigned", "open", "overdue", "closed", "carried-forward", "all"].includes(type)) {
    throw new Error("userId is required for this ticket list");
  }

  switch (type) {
    case "assigned":
      return `${baseURL}/ticket/assigned/${userId}`;
    case "open":
      return `${baseURL}/ticket/open/${userId}`;
    case "overdue":
      return `${baseURL}/ticket/overdue/${userId}`;
    case "closed":
      return `${baseURL}/ticket/closed/${userId}`;
    case "carried-forward":
      return `${baseURL}/ticket/carried-forward/${userId}`;
    case "all":
      return `${baseURL}/ticket/all/${userId}`;
    case "in-progress-assignments":
      return `${baseURL}/ticket/assignments/in-progress`;
    default:
      throw new Error(`Unknown ticket list type: ${type}`);
  }
}

export function useWcfTicketList(
  { type, userId, filters = {}, enabled = true } = {},
  options = {}
) {
  return useQuery({
    queryKey: ticketQueryKeys.list({ type, userId, filters }),
    enabled: Boolean(type) && enabled && (type === "in-progress-assignments" || Boolean(userId)),
    queryFn: async () => {
      const payload = await fetchJson(ticketListUrl({ type, userId }), { method: "GET" });
      return payload;
    },
    select: (payload) => {
      // in-progress is assignments, others are tickets
      return type === "in-progress-assignments"
        ? normalizeAssignmentsResponse(payload)
        : normalizeTicketListResponse(payload);
    },
    // Keep UI feeling "live" without manual refresh; still low frequency.
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useTicketAssignments(ticketId, options = {}) {
  return useQuery({
    queryKey: ticketQueryKeys.assignments(ticketId),
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const payload = await fetchJson(`${baseURL}/ticket/${ticketId}/assignments`, { method: "GET" });
      return payload;
    },
    select: (payload) => normalizeAssignmentsResponse(payload),
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

// Small helper for imperative invalidation (used by mutation handlers)
export function useInvalidateTickets() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["ticket-assignments"] });
  };
}

