import React, { useState } from 'react';
import axios from 'axios';
import { baseURL } from '../../config';

const ClaimRedirectButton = ({ 
  claimNumber, 
  employerId = '', 
  buttonText = 'View Claim in MAC',
  className = '',
  onSuccess,
  onError,
  style = {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [macUrl, setMacUrl] = useState('');

  const handleClaimRedirect = async () => {
    if (!claimNumber) {
      alert('No claim number provided');
      return;
    }

    setIsLoading(true);

    try {
      // Get the JWT token from multiple possible storage locations
      const tokenFromLocal = localStorage.getItem('token');
      const tokenFromSession = sessionStorage.getItem('token');
      const authTokenFromLocal = localStorage.getItem('authToken');
      const authTokenFromSession = sessionStorage.getItem('authToken');
      
      // Try different token keys that might be used
      const token = tokenFromLocal || tokenFromSession || authTokenFromLocal || authTokenFromSession;
      
      if (!token) {
        alert('No authentication token found. Please login first.');
        throw new Error('No authentication token found. Please login first.');
      }

      // Prepare request data
      const requestData = {
        notification_report_id: claimNumber,
        employer_id: employerId,
      };

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      console.log('🔵 ClaimRedirectButton clicked!');
      console.log('📋 Request data:', requestData);

      // Call the login redirect API
      const response = await axios.post(`${baseURL}/auth/login_redirect`, requestData, {
        headers: requestHeaders,
      });

      console.log('📥 API Response:', response.data);

      if (response.data.success && response.data.success.url) {
        console.log('✅ Success! MAC URL:', response.data.success.url);
        
        // Set the MAC URL and show modal
        setMacUrl(response.data.success.url);
        setShowModal(true);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(response.data.success);
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('💥 Claim redirect error occurred:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
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
    <>
      <button
        onClick={handleClaimRedirect}
        disabled={isLoading}
        className={className}
        style={defaultStyle}
      >
        {isLoading ? 'Loading...' : buttonText}
      </button>

      {/* MAC Application Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '70%',
            height: 'auto',
            maxWidth: '800px',
            maxHeight: '90vh',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h3 style={{ margin: 0, color: '#1976d2' }}>MAC Application</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Content - Info message instead of iframe */}
            <div style={{ 
              flex: 1, 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              textAlign: 'center',
              overflow: 'auto'
            }}>
              <div style={{ width: '100%', marginBottom: '20px' }}>
                <h4 style={{ 
                  color: '#1976d2', 
                  margin: '0 0 15px 0', 
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  🚀 MAC Application Ready
                </h4>
                
                <p style={{ 
                  color: '#555', 
                  marginBottom: '20px', 
                  lineHeight: '1.5',
                  fontSize: '14px'
                }}>
                  Your claim details are ready to be viewed in the MAC application. 
                  Click the button below to access your claim information.
                </p>
                
                {/* Claim Details */}
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  marginBottom: '20px',
                  textAlign: 'left',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h5 style={{ 
                    color: '#1976d2', 
                    margin: '0 0 12px 0', 
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📋 Claim Information
                  </h5>
                  <div style={{ color: '#333', fontSize: '14px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span style={{ fontWeight: '600', color: '#555' }}>Claim Number:</span>
                      <span style={{ 
                        fontWeight: '500', 
                        color: '#1976d2',
                        backgroundColor: '#e3f2fd',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        {claimNumber}
                      </span>
                    </div>
                    {employerId && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 0'
                      }}>
                        <span style={{ fontWeight: '600', color: '#555' }}>Employer ID:</span>
                        <span style={{ 
                          fontWeight: '500', 
                          color: '#1976d2',
                          backgroundColor: '#e3f2fd',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}>
                          {employerId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#fff3cd', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <small style={{ color: '#856404', fontSize: '13px' }}>
                      <strong>Security Note:</strong> The MAC application will open in a new browser tab for security reasons.
                    </small>
                  </div>
                </div>
              </div>
              
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
                <button
                  onClick={() => {
                    window.open(macUrl, '_blank');
                    setShowModal(false);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 3px 8px rgba(40, 167, 69, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '180px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 3px 8px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  🚀 Open MAC Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClaimRedirectButton; 