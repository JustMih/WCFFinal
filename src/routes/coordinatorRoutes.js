import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CoordinatorDashboard from "../pages/crm-pages/crm-coordinator-dashboard/crm-coordinator-dashboard";
import CoordinatorTickets from "../pages/crm-pages/crm-coordinator-tickets/crm-coordinator-tickets";
import CoordinatorAssignedTickets from "../pages/crm-pages/crm-coordinator-tickets/coordinator-assigned-tickets";

const coordinatorRoutes = [
  {
    path: "/coordinator/dashboard",
    element: <CoordinatorDashboard />
  },
  {
    path: "/coordinator/:status/:userId",
    element: <CoordinatorTickets />
  },
  {
    path: "/coordinator/ticket/:id",
    element: <CoordinatorTickets />
  },
  {
    path: "/coordinator/assigned/:userId",
    element: <CoordinatorAssignedTickets />
  }
];

export default coordinatorRoutes; 