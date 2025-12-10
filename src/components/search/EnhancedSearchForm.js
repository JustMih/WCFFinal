import React, { useState, useEffect, useRef } from 'react';
import { CircularProgress } from '@mui/material';

const EnhancedSearchForm = ({ 
  onEmployerSelect, 
  onEmployeeSelect, 
  onReset,
  selectedEmployer,
  searchStep,
  setSearchStep,
  onSearchTypeChange, // Add this prop to pass searchType to parent
  onUserNotFound, // Add this prop to handle user not found scenarios
  searchType: parentSearchType // Add this prop to sync with parent
}) => {
  const [searchType, setSearchType] = useState(parentSearchType || ""); // "employer" or "employee"
  const [employerSearchQuery, setEmployerSearchQuery] = useState("");
  const [employerSearchResults, setEmployerSearchResults] = useState([]);
  const [isEmployerSearching, setIsEmployerSearching] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [isEmployeeSearching, setIsEmployeeSearching] = useState(false);
  
  // Add refs for timeout management
  const employerSearchTimeoutRef = useRef(null);
  const employeeSearchTimeoutRef = useRef(null);
  
  // Add state for tracking no results
  const [employerNoResults, setEmployerNoResults] = useState(false);
  const [employeeNoResults, setEmployeeNoResults] = useState(false);

  // Sync searchType with parent
  useEffect(() => {
    setSearchType(parentSearchType || "");
  }, [parentSearchType]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (employerSearchTimeoutRef.current) {
        clearTimeout(employerSearchTimeoutRef.current);
      }
      if (employeeSearchTimeoutRef.current) {
        clearTimeout(employeeSearchTimeoutRef.current);
      }
    };
  }, []);

  const handleEmployerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setEmployerSearchResults([]);
      return;
    }

    setIsEmployerSearching(true);
    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            type: "employer",
            name: searchQuery.trim(),
            employer_registration_number: ""
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.results?.length > 0) {
        setEmployerSearchResults(data.results);
        setEmployerNoResults(false);
      } else {
        setEmployerSearchResults([]);
        setEmployerNoResults(true);
        // Call onUserNotFound when no employer results found
        if (onUserNotFound) {
          onUserNotFound(searchQuery, "employer");
        }
      }
    } catch (error) {
      console.error("Error searching for employers:", error);
      setEmployerSearchResults([]);
      // Call onUserNotFound on error as well
      if (onUserNotFound) {
        onUserNotFound(searchQuery, "employer");
      }
    } finally {
      setIsEmployerSearching(false);
    }
  };

  const handleEmployerSelection = (employer) => {
    onEmployerSelect(employer);
    setEmployerSearchQuery(employer.name || "");
    setEmployerSearchResults([]);
    
    // If search type is employee, go to employee search step
    // If search type is employer, stay in employer step (employer details will be filled)
    if (searchType === "employee") {
      setSearchStep("employee");
    }
  };

  const handleEmployeeSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === "" || !selectedEmployer) {
      setEmployeeSearchResults([]);
      return;
    }

    setIsEmployeeSearching(true);
    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            type: "employee",
            employer: selectedEmployer.name || "",
            name: searchQuery.trim(),
            employer_registration_number: ""
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.results?.length > 0) {
        setEmployeeSearchResults(data.results);
        setEmployeeNoResults(false);
      } else {
        setEmployeeSearchResults([]);
        setEmployeeNoResults(true);
        // Call onUserNotFound when no employee results found
        if (onUserNotFound) {
          onUserNotFound(searchQuery, "employee");
        }
      }
    } catch (error) {
      console.error("Error searching for employees:", error);
      setEmployeeSearchResults([]);
      // Call onUserNotFound on error as well
      if (onUserNotFound) {
        onUserNotFound(searchQuery, "employee");
      }
    } finally {
      setIsEmployeeSearching(false);
    }
  };

  const handleEmployeeSelection = (employee) => {
    onEmployeeSelect(employee);
    const employeeData = employee.employee || employee;
    const fullName = employeeData.name || "";
    const nameWithoutEmployer = fullName.split("—")[0].trim();
    setEmployeeSearchQuery(nameWithoutEmployer);
    setEmployeeSearchResults([]);
    setSearchStep("employer"); // Reset to employer search for next search
  };

  const resetSearch = () => {
    // Clear timeouts
    if (employerSearchTimeoutRef.current) {
      clearTimeout(employerSearchTimeoutRef.current);
    }
    if (employeeSearchTimeoutRef.current) {
      clearTimeout(employeeSearchTimeoutRef.current);
    }
    
    setSearchType("");
    if (onSearchTypeChange) {
      onSearchTypeChange("");
    }
    setEmployerSearchQuery("");
    setEmployerSearchResults([]);
    setEmployerNoResults(false);
    setEmployeeSearchQuery("");
    setEmployeeSearchResults([]);
    setEmployeeNoResults(false);
    setSearchStep("");
    onReset();
  };

  return (
    <div style={{ 
      width: "100%", 
      maxWidth: "100%", 
      boxSizing: "border-box",
      overflow: "hidden",
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px"
    }}>
      {/* Step 0: Search Type Selection */}
      {!searchType && (
        <div style={{ marginBottom: "15px" }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#1976d2" }}>
            Step 0: Select Search Type
          </h4>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold"
            }}
          >
            What do you want to search for?
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setSearchType("employer");
                if (onSearchTypeChange) {
                  onSearchTypeChange("employer");
                }
                setSearchStep("employer");
              }}
              style={{
                flex: 1,
                padding: "4px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              Search for Employer
            </button>
            <button
              onClick={() => {
                setSearchType("employee");
                if (onSearchTypeChange) {
                  onSearchTypeChange("employee");
                }
                setSearchStep("employer");
              }}
              style={{
                flex: 1,
                padding: "4px",
                backgroundColor: "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              Search for Employee
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Employer Search */}
      {searchType && searchStep === "employer" && (
        <div style={{ marginBottom: "15px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "15px" 
          }}>
            <h4 style={{ margin: 0, color: "#1976d2" }}>
              {searchType === "employer" ? "Step 1: Search Employer" : "Step 1: Search Employer (for Employee)"}
            </h4>
            <button
              onClick={resetSearch}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Reset Search
            </button>
          </div>

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold"
            }}
          >
            Search for Employer/Institution:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={employerSearchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setEmployerSearchQuery(query);
                
                // Clear previous timeout
                if (employerSearchTimeoutRef.current) {
                  clearTimeout(employerSearchTimeoutRef.current);
                }
                
                if (query.trim()) {
                  // Set a timeout to search after user stops typing
                  employerSearchTimeoutRef.current = setTimeout(() => {
                    handleEmployerSearch(query);
                  }, 1000); // Wait 1 second after user stops typing
                } else {
                  setEmployerSearchResults([]);
                }
              }}
              placeholder="Search for employer/institution..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px",
                boxSizing: "border-box",
                maxWidth: "100%"
              }}
            />
            {isEmployerSearching && (
              <div style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)"
              }}>
                <CircularProgress size={16} />
              </div>
            )}
          </div>

          {/* Employer Search Results */}
          {employerSearchResults.length > 0 && (
            <div style={{
              marginTop: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "white"
            }}>
              {employerSearchResults.map((employer, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer"
                  }}
                >
                  <div 
                    onClick={() => handleEmployerSelection(employer)}
                    style={{
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                      {employer.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                      TIN: {employer.tin || "N/A"}
                      {employer.phone && ` • Phone: ${employer.phone}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* No Results Found Message for Employer */}
          {employerNoResults && !isEmployerSearching && employerSearchQuery.trim() && (
            <div style={{
              marginTop: "8px",
              padding: "10px 12px",
              border: "1px solid #ffcdd2",
              borderRadius: "4px",
              backgroundColor: "#ffebee",
              color: "#c62828",
              fontSize: "14px",
              textAlign: "center"
            }}>
              No employer found with the name "{employerSearchQuery}". 
              Would you like to register a new employer?
            </div>
          )}
        </div>
      )}

      {/* Step 2: Employee Search (only if search type is employee) */}
      {searchType === "employee" && searchStep === "employee" && selectedEmployer && (
        <div style={{ marginBottom: "15px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "15px" 
          }}>
            <h4 style={{ margin: 0, color: "#1976d2" }}>
              Step 2: Search Employee
            </h4>
            <button
              onClick={resetSearch}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Reset Search
            </button>
          </div>

          <div style={{ 
            backgroundColor: "#e3f2fd", 
            padding: "10px", 
            borderRadius: "4px", 
            marginBottom: "10px" 
          }}>
            <div style={{ fontSize: "12px", color: "#1976d2", fontWeight: "bold" }}>
              Selected Employer: {selectedEmployer.name}
            </div>
          </div>

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold"
            }}
          >
            Search for Employee:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={employeeSearchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setEmployeeSearchQuery(query);
                
                // Clear previous timeout
                if (employeeSearchTimeoutRef.current) {
                  clearTimeout(employeeSearchTimeoutRef.current);
                }
                
                if (query.trim()) {
                  // Set a timeout to search after user stops typing
                  employeeSearchTimeoutRef.current = setTimeout(() => {
                    handleEmployeeSearch(query);
                  }, 1000); // Wait 1 second after user stops typing
                } else {
                  setEmployeeSearchResults([]);
                }
              }}
              placeholder="Enter employee name..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px",
                boxSizing: "border-box",
                maxWidth: "100%"
              }}
            />
            {isEmployeeSearching && (
              <div style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)"
              }}>
                <CircularProgress size={16} />
              </div>
            )}
          </div>

          {/* Employee Search Results */}
          {employeeSearchResults.length > 0 && (
            <div style={{
              marginTop: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "white"
            }}>
              {employeeSearchResults.map((result, index) => {
                const employee = result.employee || result;
                const fullName = employee.name || "";
                const nameWithoutEmployer = fullName.split("—")[0].trim();
                
                return (
                  <div
                    key={index}
                    onClick={() => handleEmployeeSelection(result)}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                      {nameWithoutEmployer}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                      Employee ID: {employee.employee_id || "N/A"}
                      {employee.nin && ` • NIN: ${employee.nin}`}
                      {employee.employee_phone && ` • Phone: ${employee.employee_phone}`}
                    </div>
                    {employee.claim_number && (
                      <div style={{ fontSize: "12px", color: "#1976d2", marginTop: "2px" }}>
                        Claim: {employee.claim_number}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* No Results Found Message for Employee */}
          {employeeNoResults && !isEmployeeSearching && employeeSearchQuery.trim() && (
            <div style={{
              marginTop: "8px",
              padding: "10px 12px",
              border: "1px solid #ffcdd2",
              borderRadius: "4px",
              backgroundColor: "#ffebee",
              color: "#c62828",
              fontSize: "14px",
              textAlign: "center"
            }}>
              No employee found with the name "{employeeSearchQuery}" at {selectedEmployer?.name || "the selected employer"}. 
              Would you like to register a new employee?
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchForm; 