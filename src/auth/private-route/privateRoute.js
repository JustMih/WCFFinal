import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/login" replace />; // Redirect to login page if no token
  }

  return Component; // Render the protected component if the token exists
};

export default PrivateRoute;
