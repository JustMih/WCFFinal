import React, { useState, useEffect } from 'react';
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
  openEarlyNewTab = true, // when not 'same-tab', open a tab immediately then redirect it after fetch
  searchType = 'claim', // 'claim' | 'employer'
  isEmployerSearch = false, // New prop to indicate if this is an employer search
  employerData = null // New prop to pass employer data directly
}) => {
  // Debug logging to see if component is being rendered
  console.log('🔍 ClaimRedirectButton rendered with props:', {
    notificationReportId,
    buttonText,
    isEmployerSearch,
    employerData,
    hasEmployerData: !!employerData
  });

  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);
  const [hasMadeApiCall, setHasMadeApiCall] = useState(false);

  // Auto-trigger API call for employer searches
  useEffect(() => {
    if (isEmployerSearch && !responseData && !hasMadeApiCall && employerData) {
      // Set the response data immediately for display
      setResponseData({
        type: "EMPLOYER",
        results: [employerData]
      });
      // Mark that we've made the API call to prevent loops
      setHasMadeApiCall(true);
    }
  }, [isEmployerSearch, notificationReportId, employerData, hasMadeApiCall]);

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
      // If no notification report ID, we can still show profile buttons
      // Just set response data if we have employer data
      if (employerData) {
        setResponseData({
          type: "EMPLOYER",
          results: [employerData]
        });
      }
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

      // Store response data for conditional rendering
      setResponseData(response.data);

      // Debug logging to see response structure
      console.log('🔍 Response data:', response.data);
      console.log('🔍 Response type:', response.data?.type);
      console.log('🔍 Results array:', response.data?.results);
      console.log('🔍 Search type:', searchType);
      console.log('🔍 Is employer search:', isEmployerSearch);
      console.log('🔍 Response data keys:', Object.keys(response.data || {}));

      // Check for registration_number in the results array
      let registrationNumber = null;
      let employerName = null;
      
      if (response.data?.results && response.data.results.length > 0) {
        // Check if this is an employee response
        if (response.data.type === "EMPLOYEE" && response.data.results[0].employee) {
          const employee = response.data.results[0].employee;
          employerName = employee.employer_name;
          console.log('🔍 Found employee data with employer:', employerName);
          
          // For employee searches, we need to make a separate call to get employer registration number
          if (employerName) {
            try {
              const employerSearchResponse = await axios.post(
                "https://demomspapi.wcf.go.tz/api/v1/search/details",
                {
                  type: "employer",
                  name: employerName,
                  employer_registration_number: ""
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                  }
                }
              );
              
              if (employerSearchResponse.data?.results && employerSearchResponse.data.results.length > 0) {
                registrationNumber = employerSearchResponse.data.results[0].registration_number;
                console.log('🔍 Found employer registration_number:', registrationNumber);
              }
            } catch (error) {
              console.log('❌ Error fetching employer registration number:', error);
            }
          }
        } else {
          // Direct employer response
          registrationNumber = response.data.results[0].registration_number;
          employerName = response.data.results[0].name;
          console.log('🔍 Found registration_number:', registrationNumber);
          console.log('🔍 First result object:', response.data.results[0]);
        }
      } else {
        console.log('❌ No results array found or results array is empty');
      }

      // For employer searches, make a second call with registration_number as employer_id
      if (isEmployerSearch && registrationNumber) {
        console.log('✅ Making second API call with registration_number:', registrationNumber);
        const profileRequestData = {
          notification_report_id: idToSend,
          employer_id: parseInt(registrationNumber, 10), // Convert to number
        };

        console.log('🔍 Profile request data:', profileRequestData);

        const profileResponse = await axios.post(`${baseURL}/auth/login_redirect`, profileRequestData, {
          headers: requestHeaders,
        });

        console.log('🔍 Profile response:', profileResponse.data);

        if (profileResponse.data.success && profileResponse.data.success.url) {
          const rawUrl = profileResponse.data.success.url;
          const url = ensureAbsoluteUrl(rawUrl);
          setProfileUrl(url);
          console.log('✅ Profile URL set:', url);
        }
      }

      // For employee/claim searches, make a second call if registration_number is found
      if (!isEmployerSearch && registrationNumber) {
        console.log('✅ Making second API call with registration_number:', registrationNumber);
        const profileRequestData = {
          notification_report_id: idToSend,
          employer_id: registrationNumber, // Pass registration_number as employer_id
        };

        const profileResponse = await axios.post(`${baseURL}/auth/login_redirect`, profileRequestData, {
          headers: requestHeaders,
        });

        if (profileResponse.data.success && profileResponse.data.success.url) {
          const rawUrl = profileResponse.data.success.url;
          const url = ensureAbsoluteUrl(rawUrl);
          setProfileUrl(url);
          console.log('✅ Profile URL set:', url);
        }
      }

      // For employee/claim searches, open the claim URL
      if (!isEmployerSearch && response.data.success && response.data.success.url) {
        const rawUrl = response.data.success.url;
        const url = ensureAbsoluteUrl(rawUrl);

        // Open in new tab since iframe embedding is blocked by MAC server
        window.open(url, '_blank', 'noopener,noreferrer');
        if (onSuccess) onSuccess(response.data.success);
      } else if (isEmployerSearch) {
        // For employer searches, just store the data for profile button
        if (onSuccess) onSuccess(response.data);
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

  const handleViewProfile = async (registrationNumber) => {
    // If no registration number provided but we have response data with employer info, try to get it
    if (!registrationNumber && responseData?.type === "EMPLOYEE" && responseData?.results?.[0]?.employee?.employer_name) {
      const employerName = responseData.results[0].employee.employer_name;
      
      // Try to get the registration number by searching for the employer
      try {
        const employerSearchResponse = await axios.post(
          "https://demomspapi.wcf.go.tz/api/v1/search/details",
          {
            type: "employer",
            name: employerName,
            employer_registration_number: ""
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            }
          }
        );
        
        if (employerSearchResponse.data?.results && employerSearchResponse.data.results.length > 0) {
          registrationNumber = employerSearchResponse.data.results[0].registration_number;
          console.log('🔍 Found employer registration_number for profile:', registrationNumber);
        }
      } catch (error) {
        console.log('❌ Error fetching employer registration number for profile:', error);
      }
    }
    
    // If still no registration number but we have employerData with name, try to get it
    if (!registrationNumber && employerData && employerData.name && !employerData.registration_number) {
      try {
        const employerSearchResponse = await axios.post(
          "https://demomspapi.wcf.go.tz/api/v1/search/details",
          {
            type: "employer",
            name: employerData.name,
            employer_registration_number: ""
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            }
          }
        );
        
        if (employerSearchResponse.data?.results && employerSearchResponse.data.results.length > 0) {
          registrationNumber = employerSearchResponse.data.results[0].registration_number;
          console.log('🔍 Found employer registration_number from employerData:', registrationNumber);
        }
      } catch (error) {
        console.log('❌ Error fetching employer registration number from employerData:', error);
      }
    }

    if (profileUrl) {
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    } else if (registrationNumber) {
      // Make API call to backend to get profile URL
      try {
        const tokenFromLocal = localStorage.getItem('token');
        const tokenFromSession = sessionStorage.getItem('token');
        const authTokenFromLocal = localStorage.getItem('authToken');
        const authTokenFromSession = sessionStorage.getItem('authToken');
        const token = tokenFromLocal || tokenFromSession || authTokenFromLocal || authTokenFromSession;
        
        if (!token) {
          alert('No authentication token found. Please login first.');
          return;
        }

        const requestData = {
          notification_report_id: notificationReportId || '',
          employer_id: parseInt(registrationNumber, 10),
        };

        const requestHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        };

        console.log('🔍 Profile button clicked - making API call with:', requestData);

        const response = await axios.post(`${baseURL}/auth/login_redirect`, requestData, {
          headers: requestHeaders,
        });

        if (response.data.success && response.data.success.url) {
          const rawUrl = response.data.success.url;
          const url = ensureAbsoluteUrl(rawUrl);
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          // Fallback: construct URL manually if API call fails
          const macHost = 'https://demomac.wcf.go.tz/';
          const profileUrl = `${macHost}employer/profile/${registrationNumber}`;
          window.open(profileUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        console.error('💥 Profile redirect error occurred:', error);
        // Fallback: construct URL manually if API call fails
        const macHost = 'https://demomac.wcf.go.tz/';
        const profileUrl = `${macHost}employer/profile/${registrationNumber}`;
        window.open(profileUrl, '_blank', 'noopener,noreferrer');
      }
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
    minHeight: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: style?.whiteSpace || "nowrap", // Allow style prop to override whiteSpace
    ...style
  };

  const profileButtonStyle = {
    ...defaultStyle,
    backgroundColor: "#28a745", // Green color for profile button
    marginLeft: "8px",
    ...style // Apply custom style prop to override defaults
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-start'
  };

  // Check if we have results with registration numbers or employer names
  const hasResults = responseData?.results && responseData.results.length > 0;
  const resultsWithRegistration = hasResults ? responseData.results.filter(result => {
    if (responseData.type === "EMPLOYEE" && result.employee) {
      return result.employee.employer_name; // For employee searches, check if employer name exists
    } else {
      return result.registration_number; // For employer searches, check if registration number exists
    }
  }) : [];
  
  // Determine if we should show the profile button
  const showProfileButton = responseData?.results?.some(result => result.registration_number) || 
                           (employerData && employerData.registration_number);

  return (
    <div style={containerStyle}>
      {/* Show claim button only for employee/claim searches and when we have a valid notificationReportId */}
      {!isEmployerSearch && notificationReportId && (
        <button
          onClick={handleClaimRedirect}
          disabled={isLoading}
          className={className}
          style={defaultStyle}
        >
          {isLoading ? 'Loading...' : buttonText}
        </button>
      )}
      
      {/* Show profile buttons for each employer with registration number */}
      {resultsWithRegistration.map((result, index) => {
        let employerName = '';
        let registrationNumber = null;
        
        if (responseData?.type === "EMPLOYEE" && result.employee) {
          // Employee search result
          employerName = result.employee.employer_name;
          registrationNumber = result.employee.employer_registration_number; // This might not exist
        } else {
          // Employer search result
          employerName = result.name;
          registrationNumber = result.registration_number;
        }
        
        //          return (
        //    <button
        //      key={`profile-${index}-${employerName}`}
        //      onClick={() => handleViewProfile(registrationNumber)}
        //      className={className}
        //      style={profileButtonStyle}
        //    >
        //      {isEmployerSearch ? `View Profile - ${employerName}` : `View ${employerName} Profile`}
        //    </button>
        //  );
      })}
      
             {/* Show profile button for employerData if no resultsWithRegistration */}
       {employerData && employerData.registration_number && resultsWithRegistration.length === 0 && (
         <button
           onClick={() => handleViewProfile(employerData.registration_number)}
           className={className}
           style={profileButtonStyle}
         >
           View Employer Profile
         </button>
       )}
      
             {/* Show profile button for employee searches when we have employer data from the API call */}
       {!isEmployerSearch && responseData?.type === "EMPLOYEE" && responseData?.results?.[0]?.employee?.employer_name && (
         <button
           onClick={() => handleViewProfile(null)} // Will use the registration number from the API call
           className={className}
           style={profileButtonStyle}
         >
           {`View ${responseData.results[0].employee.employer_name} Profile`}
         </button>
       )}
      
             {/* Show profile button for employerData if no resultsWithRegistration but we have employer name */}
       {employerData && employerData.name && !employerData.registration_number && resultsWithRegistration.length === 0 && (
         <button
           onClick={() => handleViewProfile(null)} // Will search for registration number using employer name
           className={className}
           style={profileButtonStyle}
         >
           {`View ${employerData.name} Profile`}
         </button>
       )}
       
       {/* Show profile button for employerData even when there's no claim but we have employer data */}
       {/* {employerData && employerData.registration_number && !notificationReportId && !responseData && (
         <button
           onClick={() => handleViewProfile(employerData.registration_number)}
           className={className}
           style={profileButtonStyle}
         >
           {isEmployerSearch ? `View Profile - ${employerData.name}` : `View ${employerData.name} Profile`}
         </button>
       )} */}
       
       {/* Show profile button for employerData when there's no claim but we have employer data (alternative condition) */}
       {/* {employerData && employerData.registration_number && !notificationReportId && (
         <button
           onClick={() => handleViewProfile(employerData.registration_number)}
           className={className}
           style={profileButtonStyle}
         >
           {isEmployerSearch ? `View Profile - ${employerData.name}` : `View ${employerData.name} Profile`}
         </button>
       )} */}
    </div>
  );
};

export default ClaimRedirectButton; 