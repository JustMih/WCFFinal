import React, { useState } from 'react';
import axios from 'axios';
import { baseURL } from '../../config';

const ClaimRedirectButton = ({ 
  // Preferred explicit prop
  notificationReportId,
  // Backward-compat fallback
  claimNumber, 
  employerId = '', 
  buttonText = 'View Claim in MAC',
  className = '',
  onSuccess,
  onError,
  style = {},
  openMode = 'modal', // 'same-tab' | 'new-tab' | 'modal'
  openEarlyNewTab = true // when not 'same-tab', open a tab immediately then redirect it after fetch
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const ensureAbsoluteUrl = (url) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const macHost = 'https://demomac.wcf.go.tz/';
    if (url.startsWith('/')) return macHost.replace(/\/$/, '') + url;
    return macHost + url;
  };

  const handleClaimRedirect = async () => {
    const idToSend = notificationReportId ?? claimNumber;
    if (!idToSend) {
      alert('Missing notification report ID');
      return;
    }

    setIsLoading(true);

    try {
      const tokenFromLocal = localStorage.getItem('token');
      const tokenFromSession = sessionStorage.getItem('token');
      const authTokenFromLocal = localStorage.getItem('authToken');
      const authTokenFromSession = sessionStorage.getItem('authToken');
      const token = tokenFromLocal || tokenFromSession || authTokenFromLocal || authTokenFromSession;
      if (!token) {
        alert('No authentication token found. Please login first.');
        throw new Error('No authentication token found. Please login first.');
      }

      const requestData = {
        notification_report_id: idToSend,
        employer_id: employerId,
      };

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const response = await axios.post(`${baseURL}/auth/login_redirect`, requestData, {
        headers: requestHeaders,
      });

      if (response.data.success && response.data.success.url) {
        const rawUrl = response.data.success.url;
        const url = ensureAbsoluteUrl(rawUrl);

        // Open in new tab since iframe embedding is blocked by MAC server
        window.open(url, '_blank', 'noopener,noreferrer');
        if (onSuccess) onSuccess(response.data.success);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('💥 Claim redirect error occurred:', error);
      if (onError) onError(error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const defaultStyle = {
    padding: "8px 16px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: isLoading ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    opacity: isLoading ? 0.7 : 1,
    ...style
  };

  return (
    <button
      onClick={handleClaimRedirect}
      disabled={isLoading}
      className={className}
      style={defaultStyle}
    >
      {isLoading ? 'Loading...' : buttonText}
    </button>
  );
};

export default ClaimRedirectButton; 