import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/login-page/Login";
import Dashboard from "./pages/dashboard-page/Dashboard";
import PublicDashboard from "./pages/public-dashboard/PublicDashboard";
import CrmTicketsAssigned from "./pages/crm-pages/crm-tickets/assigned";
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

function App() {
  const role = localStorage.getItem("role");
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
