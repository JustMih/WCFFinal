import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReviewerDashboard from "../pages/crm-pages/crm-reviewer-dashboard/crm-reviewer-dashboard";
import ReviewerTickets from "../pages/crm-pages/crm-reviewer-tickets/crm-reviewer-tickets";
import ReviewerAssignedTickets from "../pages/crm-pages/crm-reviewer-tickets/reviewer-assigned-tickets";

const reviewerRoutes = [
  {
    path: "/reviewer/dashboard",
    element: <ReviewerDashboard />
  },
  {
    path: "/reviewer/:status/:userId",
    element: <ReviewerTickets />
  },
  {
    path: "/reviewer/ticket/:id",
    element: <ReviewerTickets />
  },
  {
    path: "/reviewer/assigned/:userId",
    element: <ReviewerAssignedTickets />
  }
];

export default reviewerRoutes; 