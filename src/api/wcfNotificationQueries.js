import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
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

function normalizeNotifications(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  // Some endpoints use tickets/Tickets naming
  if (Array.isArray(payload.tickets)) return payload.tickets;
  if (Array.isArray(payload.Tickets)) return payload.Tickets;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export const notificationQueryKeys = {
  feed: (userId) => ["crm-notification-feed", String(userId || "")],
  user: (userId) => ["crm-notifications", String(userId || "")],
  unreadCount: (userId) => ["crm-notifications-unread-count", String(userId || "")],
  ticketHistory: ({ ticketId, userId }) => [
    "crm-ticket-notifications",
    String(ticketId || ""),
    String(userId || ""),
  ],
};

// CRM notifications list used by CRM notifications page (includes ticket payload)
export function useCrmNotificationFeed(userId, options = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.feed(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const payload = await fetchJson(`${baseURL}/ticket/assigned-notified/${userId}`, {
        method: "GET",
      });
      return payload;
    },
    select: (payload) => normalizeNotifications(payload),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

// Raw notifications list used for counts/badges (unread, tagged, etc.)
export function useCrmUserNotifications(userId, options = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.user(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const payload = await fetchJson(`${baseURL}/notifications/user/${userId}`, { method: "GET" });
      return payload;
    },
    select: (payload) => normalizeNotifications(payload),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCrmUnreadNotificationCount(userId, options = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const payload = await fetchJson(`${baseURL}/notifications/unread-count/${userId}`, {
        method: "GET",
      });
      return payload;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCrmTicketNotificationHistory({ ticketId, userId }, options = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.ticketHistory({ ticketId, userId }),
    enabled: Boolean(ticketId) && Boolean(userId),
    queryFn: async () => {
      const payload = await fetchJson(
        `${baseURL}/notifications/ticket/${ticketId}/user/${userId}`,
        { method: "GET" }
      );
      return payload;
    },
    select: (payload) => ({
      notifications: normalizeNotifications(payload).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    }),
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useMarkNotificationRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId) => {
      const payload = await fetchJson(`${baseURL}/notifications/read/${notificationId}`, {
        method: "PATCH",
      });
      return payload;
    },
    onSuccess: (_data, notificationId) => {
      // optimistic cache updates
      queryClient.setQueryData(notificationQueryKeys.feed(userId), (old) => {
        const list = Array.isArray(old) ? old : normalizeNotifications(old);
        return list.map((n) => (String(n.id) === String(notificationId) ? { ...n, status: "read" } : n));
      });
      queryClient.setQueryData(notificationQueryKeys.user(userId), (old) => {
        const list = Array.isArray(old) ? old : normalizeNotifications(old);
        return list.map((n) => (String(n.id) === String(notificationId) ? { ...n, status: "read" } : n));
      });

      // ensure counts are correct
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount(userId) });
    },
  });
}

export function useMarkManyNotificationsRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationIds = []) => {
      const ids = Array.isArray(notificationIds) ? notificationIds : [];
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`${baseURL}/notifications/read/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
          })
        )
      );
      const okCount = results.filter((r) => r.ok).length;
      return { okCount, total: ids.length };
    },
    onSuccess: (_data, notificationIds) => {
      const ids = new Set((notificationIds || []).map((x) => String(x)));
      const markList = (list) =>
        list.map((n) => (ids.has(String(n.id)) ? { ...n, status: "read" } : n));

      queryClient.setQueryData(notificationQueryKeys.feed(userId), (old) => {
        const list = Array.isArray(old) ? old : normalizeNotifications(old);
        return markList(list);
      });
      queryClient.setQueryData(notificationQueryKeys.user(userId), (old) => {
        const list = Array.isArray(old) ? old : normalizeNotifications(old);
        return markList(list);
      });

      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount(userId) });
    },
  });
}

