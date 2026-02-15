import React, { useState } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';

const MACLoginButton = ({ 
  systemName = "MAC System", 
  laravelBaseUrl = "http://127.0.0.1:8000",
  buttonText = "Login to MAC System",
  variant = "contained",
  color = "primary",
  size = "medium",
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMACLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Hardcoded test credentials for now
      const testCredentials = {
        username: "rehema.said",
        password: "TTCL@2026"
      };

      // POST to Laravel /mac-login endpoint
      const response = await fetch(`${laravelBaseUrl}/mac-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          username: testCredentials.username,
          password: testCredentials.password
        }),
        credentials: "include"
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setError(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
        setIsLoading(false);
        return;
      }

      if (response.ok && data.redirect) {
        window.open(data.redirect, "_blank");
      } else {
        setError(data.error || "Failed to authenticate with MAC system");
      }
    } catch (error) {
      setError(error.message || 'Failed to navigate to MAC system');
    }
    setIsLoading(false);
  };

  return (
    <div>
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={handleMACLogin}
        disabled={isLoading}
        className={className}
        startIcon={isLoading ? <CircularProgress size={16} /> : null}
      >
        {isLoading ? 'Connecting to MAC...' : buttonText}
      </Button>
      {error && (
        <Alert severity="error" style={{ marginTop: '8px' }}>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default MACLoginButton; 