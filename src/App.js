import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/login-page/Login";
import Dashboard from "./pages/dashboard-page/Dashboard";
import PublicDashboard from "./pages/public-dashboard/PublicDashboard";
import CrmTicketsAssigned from "./pages/crm-pages/crm-tickets-status/assigned";
import { clearDomainCredentials } from "./utils/credentials";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function clearSessionAndRedirect() {
  const role = localStorage.getItem("role");
  const isAgent = role === "agent";
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("unit_section");
  localStorage.removeItem("tokenExpiration");
  localStorage.removeItem("userId");
  localStorage.removeItem("extension");
  localStorage.removeItem("sipPassword");
  localStorage.removeItem("agentStatus");
  localStorage.removeItem("activeSystem");
  clearDomainCredentials();
  sessionStorage.setItem(
    "logoutMessage",
    isAgent
      ? "Session ended (daily logout at 2 PM)."
      : "Session ended (24 hour session limit)."
  );
  window.location.href = "/login";
}

function App() {
  const role = localStorage.getItem("role");

  // Global check: if token expired (e.g. daily 2 PM for agents, 24h for others), clear session and redirect
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("authToken");
      const expiresAtRaw = localStorage.getItem("tokenExpiration");
      if (!token) return;
      if (!expiresAtRaw) {
        console.warn("[Session] tokenExpiration missing in localStorage – set on next login.");
        return;
      }
      const now = Date.now();
      const expiry = Number(expiresAtRaw);
      if (Number.isNaN(expiry)) {
        console.warn("[Session] tokenExpiration invalid:", expiresAtRaw);
        return;
      }
      if (now >= expiry) {
        console.log("[Session] Token expired at", new Date(expiry).toLocaleString(), "– redirecting to login.");
        clearSessionAndRedirect();
      }
    };
    checkTokenExpiration();
    const intervalMs = 5000;
    const intervalId = setInterval(checkTokenExpiration, intervalMs);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkTokenExpiration();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Routes>
          {/* Public routes - must be defined before catch-all */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public-dashboard" element={<PublicDashboard />} />
          <Route path="/crm-tickets" element={<CrmTicketsAssigned />} />

          {/* Authenticated routes - Dashboard handles all nested routes */}
          {role && <Route path="/*" element={<Dashboard />} />}
        </Routes>
      </div>
    </QueryClientProvider>
  );
}

function MainApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default MainApp;
