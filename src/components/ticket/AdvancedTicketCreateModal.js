import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { baseURL } from "../../config";

// Styled components for Autocomplete and SuggestionItem
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiInputBase-root": {
    padding: "2px 4px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    "&:hover": {
      borderColor: theme.palette.primary.main
    }
  },
  "& .MuiAutocomplete-listbox": {
    "& li": {
      padding: "8px 16px",
      "&:hover": {
        backgroundColor: "#f5f5f5"
      }
    }
  },
  "& .MuiAutocomplete-loading": {
    padding: "10px",
    textAlign: "center"
  }
}));

const SuggestionItem = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  "& .suggestion-name": {
    fontWeight: 600,
    color: "#2c3e50"
  },
  "& .suggestion-details": {
    fontSize: "0.85rem",
    color: "#7f8c8d"
  },
  "& .highlight": {
    backgroundColor: "#fff3cd",
    padding: "0 2px",
    borderRadius: "2px"
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const highlightMatch = (text, query) => {
  if (!query) return text;
  const safeQuery = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={index} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const defaultFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  phoneNumber: "",
  nidaNumber: "",
  requester: "",
  institution: "",
  region: "",
  district: "",
  channel: "Call",
  category: "",
  inquiry_type: "",
  functionId: "",
  description: "",
  status: "Open",
  requesterName: "",
  requesterPhoneNumber: "",
  requesterEmail: "",
  requesterAddress: "",
  relationshipToEmployee: "",
};

function AdvancedTicketCreateModal({ open, onClose, initialPhoneNumber = "", functionData = [] }) {
  // --- CRM Modal State ---
  const [formData, setFormData] = useState({ ...defaultFormData, phoneNumber: initialPhoneNumber });
  const [formErrors, setFormErrors] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [showModal, setShowModal] = useState(false);
  const [searchType, setSearchType] = useState("employee");
  const [searchBy, setSearchBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [openAuto, setOpenAuto] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [employerDetails, setEmployerDetails] = useState(null);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [institutionSuggestions, setInstitutionSuggestions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [creationTicketsLoading, setCreationTicketsLoading] = useState(false);
  const [creationFoundTickets, setCreationFoundTickets] = useState([]);
  const [creationActiveTicketId, setCreationActiveTicketId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [submitAction, setSubmitAction] = useState("open");
  // --- End CRM Modal State ---

  // --- Handlers from CRM ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "functionId") {
      const selectedFunctionData = functionData.find((item) => item.id === value);
      if (selectedFunctionData) {
        setSelectedFunction(selectedFunctionData.function?.name || "");
        setSelectedSection(selectedFunctionData.function?.section?.name || "");
      } else {
        setSelectedFunction("");
        setSelectedSection("");
      }
    }
    if (name === "phoneNumber") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+") && cleaned.slice(1).includes("+")) {
        cleaned = cleaned.replace(/\+/g, "");
        cleaned = "+" + cleaned;
      }
      if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (!/^\+?\d{0,13}$/.test(cleaned)) {
        setFormErrors((prev) => ({ ...prev, phoneNumber: "Phone number must contain only numbers" }));
      } else {
        setFormErrors((prev) => ({ ...prev, phoneNumber: undefined }));
      }
      return;
    }
    if (name === "nidaNumber") {
      let cleaned = value.replace(/[^\d-]/g, "");
      cleaned = cleaned.replace(/--+/g, "-");
      if (cleaned.length > 20) cleaned = cleaned.slice(0, 20);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      const isValid = /^(\d+(-\d+)*$)/.test(cleaned);
      if (!isValid) {
        setFormErrors((prev) => ({
          ...prev,
          nidaNumber: "Only digits and dashes are allowed. No leading/trailing or repeated dashes.",
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, nidaNumber: undefined }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuggestionSelected = (event, suggestion) => {
    if (!suggestion) {
      setSelectedSuggestion(null);
      setInputValue("");
      return;
    }
    const rawData = suggestion.rawData || suggestion;
    const institutionMatch =
      suggestion.displayName?.match(/—\s*\((.*?)\)/) ||
      suggestion.originalName?.match(/—\s*\((.*?)\)/) ||
      suggestion.name?.match(/—\s*\((.*?)\)/);
    const institutionName = institutionMatch ? institutionMatch[1].trim() : "";
    const selectedWithClaim = {
      ...suggestion,
      hasClaim: Boolean(rawData.claim_number),
      claimId: rawData.claim_number,
      allocated_user: rawData.allocated_user,
      allocated_user_id: rawData.allocated_user_id,
      allocated_user_username: rawData.allocated_user_username
    };
    setSelectedSuggestion(selectedWithClaim);
    setInputValue(suggestion.cleanName || suggestion.name || "");
    setSearchQuery(suggestion.cleanName || suggestion.name || "");
    setOpenAuto(false);
    let updatedFormData = { ...formData };
    if (searchType === "employee") {
      updatedFormData = {
        ...updatedFormData,
        firstName: rawData.firstname || "",
        middleName: rawData.middlename || "",
        lastName: rawData.lastname || "",
        nidaNumber: rawData.nin || "",
        phoneNumber: rawData.phoneNumber || "",
        institution: institutionName
      };
    } else if (searchType === "employer") {
      updatedFormData = {
        ...updatedFormData,
        firstName: "",
        middleName: "",
        lastName: "",
        nidaNumber: rawData.tin || "",
        phoneNumber: rawData.phone || "",
        institution: rawData.name || ""
      };
    }
    updatedFormData = {
      ...updatedFormData,
      requester: updatedFormData.requester || formData.requester,
      region: updatedFormData.region || formData.region,
      district: updatedFormData.district || formData.district,
      channel: updatedFormData.channel || formData.channel,
      category: updatedFormData.category || formData.category,
      inquiry_type: updatedFormData.inquiry_type || formData.inquiry_type || "",
      functionId: updatedFormData.functionId || formData.functionId,
      description: updatedFormData.description || formData.description,
      status: updatedFormData.status || formData.status,
      requesterName: updatedFormData.requesterName || rawData.requesterName || "",
      requesterPhoneNumber: updatedFormData.requesterPhoneNumber || rawData.requesterPhoneNumber || "",
      requesterEmail: updatedFormData.requesterEmail || rawData.requesterEmail || "",
      requesterAddress: updatedFormData.requesterAddress || rawData.requesterAddress || "",
      relationshipToEmployee: updatedFormData.relationshipToEmployee || rawData.relationshipToEmployee || ""
    };
    setFormData(updatedFormData);
    let selectedInstitutionName = "";
    if (searchType === "employee") {
      selectedInstitutionName = rawData.institution || rawData.employerName || updatedFormData.institution || "";
    } else if (searchType === "employer") {
      selectedInstitutionName = rawData.name || updatedFormData.institution || "";
    }
    if (selectedInstitutionName) {
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: selectedInstitutionName,
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setSelectedInstitution(data.results[0]);
          } else {
            setSelectedInstitution(null);
            setModal({
              isOpen: true,
              type: "error",
              message: "Institution not found. Please check the name and try again."
            });
          }
        })
        .catch(() => {
          setSelectedInstitution(null);
          setModal({
            isOpen: true,
            type: "error",
            message: "Institution not found. Please check the name and try again."
          });
        });
    } else {
      setSelectedInstitution(null);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
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
            type: searchType,
            name: query,
            employer_registration_number: ""
          })
        }
      );
      const data = await response.json();
      setSearchSuggestions(data.results || []);
    } catch (error) {
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (event, newValue, reason) => {
    setInputValue(newValue);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (reason === "reset" || reason === "clear") {
      setSearchSuggestions([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 150);
  };

  const handleSubmit = async (e, action = "create") => {
    e.preventDefault();
    const requiredFields = {
      phoneNumber: "Phone Number",
      nidaNumber: "NIDA Number",
      requester: "Requester",
      institution: "Institution",
      region: "Region",
      district: "District",
      channel: "Channel",
      category: "Category",
      ...(formData.category === "Inquiry" && { inquiry_type: "Inquiry Type" }),
      functionId: "Subject",
      description: "Description"
    };
    if (formData.requester === "Representative") {
      requiredFields.requesterName = "Representative Name";
      requiredFields.requesterPhoneNumber = "Representative Phone Number";
      requiredFields.relationshipToEmployee = "Relationship to Employee";
    }
    if (formData.requester === "Employer") {
      requiredFields.nidaNumber = "Employer Registration Number / TIN";
      requiredFields.institution = "Employer Name";
      requiredFields.phoneNumber = "Employer Phone";
    }
    const errors = {};
    const missing = [];
    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        errors[key] = "This field is required";
        missing.push(`• ${label}`);
      }
    });
    if (missing.length > 0) {
      setFormErrors(errors);
      setModal({
        isOpen: true,
        type: "error",
        message: `Please fill the required fields before submitting.`
      });
      return;
    }
    setFormErrors({});
    try {
      // Find the selected subject (FunctionData), parent function, and parent section
      let selectedSubject, parentFunction, parentSection;
      for (const func of functionData) {
        if (func.function && func.function.functionData) {
          selectedSubject = func.function.functionData.find(fd => fd.id === formData.functionId);
          if (selectedSubject) {
            parentFunction = func.function;
            parentSection = func.function.section;
            break;
          }
        }
      }
      // --- Allocated User Logic ---
      let employerAllocatedStaffUsername = "";
      if (selectedSuggestion && selectedSuggestion.claimId && selectedSuggestion.allocated_user_username) {
        employerAllocatedStaffUsername = selectedSuggestion.allocated_user_username;
      } else if (
        (!selectedSuggestion || !selectedSuggestion.claimId) &&
        formData.category === "Inquiry" &&
        selectedInstitution && selectedInstitution.allocated_staff_username
      ) {
        employerAllocatedStaffUsername = selectedInstitution.allocated_staff_username;
      } else {
        employerAllocatedStaffUsername = selectedInstitution?.allocated_staff_username || formData.employerAllocatedStaffUsername || "";
      }
      const ticketData = {
        ...formData,
        subject: selectedSubject ? selectedSubject.name : "",
        sub_section: parentFunction ? parentFunction.name : "",
        section: parentSection ? parentSection.name : "",
        responsible_unit_id: formData.functionId,
        responsible_unit_name: parentSection ? parentSection.name : "",
        status: action === "closed" ? "Closed" : "Open",
        employerAllocatedStaffUsername,
        shouldClose: action === "closed",
        inquiry_type: formData.category === "Inquiry" ? formData.inquiry_type : null,
        // Add claim number for routing decision
        claimId: selectedSuggestion?.claimId || null,
      };
      if (formData.requester === "Employer") {
        ticketData.employerRegistrationNumber = formData.nidaNumber;
        ticketData.employerName = formData.institution;
        ticketData.employerTin = formData.nidaNumber;
        ticketData.employerPhone = formData.phoneNumber;
        ticketData.employerEmail = formData.employerEmail || "";
        ticketData.employerStatus = formData.employerStatus || "";
        ticketData.employerAllocatedStaffId = formData.employerAllocatedStaffId || "";
        ticketData.employerAllocatedStaffName = formData.employerAllocatedStaffName || "";
        ticketData.employerAllocatedStaffUsername = formData.employerAllocatedStaffUsername || "";
      }
      // Map representative fields to backend field names if requester is Representative
      if (formData.requester === "Representative") {
        ticketData.representative_name = formData.requesterName;
        ticketData.representative_phone = formData.requesterPhoneNumber;
        ticketData.representative_email = formData.requesterEmail;
        ticketData.representative_address = formData.requesterAddress;
        ticketData.representative_relationship = formData.relationshipToEmployee;
      }
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });
      const data = await response.json();
      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: data.message || "Ticket created successfully"
        });
        setShowModal(false);
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          phoneNumber: "",
          nidaNumber: "",
          requester: "",
          institution: "",
          region: "",
          district: "",
          channel: "",
          category: "",
          inquiry_type: "",
          functionId: "",
          description: "",
          status: "Open",
          requesterName: "",
          requesterPhoneNumber: "",
          requesterEmail: "",
          requesterAddress: "",
          relationshipToEmployee: ""
        });
      } else {
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Ticket creation failed."
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error. Please try again later.`
      });
    }
  };
  // --- End Handlers ---

  useEffect(() => {
    setFormData((prev) => ({ ...prev, phoneNumber: initialPhoneNumber }));
  }, [initialPhoneNumber, open]);

  // Add phone normalization helper
  function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.trim();
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0')) p = '255' + p.slice(1);
    return p;
  }

  useEffect(() => {
    const phone = formData.phoneNumber?.trim();
    const normalizedPhone = normalizePhone(phone);
    const token = localStorage.getItem("authToken");
    if (normalizedPhone && normalizedPhone.length >= 7 && token) { // basic length check
      setCreationTicketsLoading(true);
      fetch(`${baseURL}/ticket/search-by-phone/${normalizedPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.found && Array.isArray(data.tickets)) {
            setCreationFoundTickets(data.tickets);
          } else {
            setCreationFoundTickets([]);
          }
        })
        .catch(() => setCreationFoundTickets([]))
        .finally(() => setCreationTicketsLoading(false));
    } else {
      setCreationFoundTickets([]);
    }
  }, [formData.phoneNumber]);

  // Add effects for fetching suggestions, ticket history, etc.

  // Add the full JSX structure from the CRM modal here
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: 1050,
          maxWidth: "98vw",
          minHeight: 500,
          maxHeight: "90vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 0
        }}
      >
        <Box
          sx={{
            flex: 2,
            p: 4,
            borderRight: "1px solid #eee",
            overflowY: "auto",
            minWidth: 0,
            maxHeight: "90vh"
          }}
        >
          <div className="modal-form-container">
            <h2 className="modal-title">New Ticket</h2>

            {/* Search Section */}
            <div
              className="search-section"
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px"
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  Search Type:
                </label>
                <select
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setSearchSuggestions([]);
                    setSelectedSuggestion(null);
                    setSearchQuery("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}
                >
                  <option value="employee">Employee</option>
                  <option value="employer">Employer</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  Search By:
                </label>
                <select
                  value={searchBy}
                  onChange={(e) => {
                    setSearchBy(e.target.value);
                    setSearchSuggestions([]);
                    setSelectedSuggestion(null);
                    setSearchQuery("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}
                >
                  <option value="name">Name</option>
                  <option value="wcf_number">WCF Number</option>
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold"
                  }}
                >
                  {searchBy === "name" ? "Enter Name" : "Enter WCF Number"}:
                </label>
                <StyledAutocomplete
                  value={selectedSuggestion}
                  onChange={(event, newValue) => handleSuggestionSelected(event, newValue)}
                  inputValue={inputValue}
                  onInputChange={handleInputChange}
                  options={searchSuggestions}
                  getOptionLabel={(option) => option.displayName || ""}
                  open={openAuto}
                  onOpen={() => setOpenAuto(true)}
                  onClose={() => setOpenAuto(false)}
                  loading={isSearching}
                  loadingText={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px"
                      }}
                    >
                      <CircularProgress size={20} />
                      <span>Searching...</span>
                    </div>
                  }
                  noOptionsText={
                    inputValue.length < 1
                      ? "Start typing to search"
                      : "No matching records found"
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <SuggestionItem>
                        <div className="suggestion-name">
                          <span style={{ color: "#666" }}>
                            {option.numberPrefix}
                          </span>{" "}
                          {highlightMatch(option.cleanName || option.name || option.displayName || '', inputValue)}
                          {option.employerName && (
                            <>
                              {" — ("}
                              <span style={{ color: "#666" }}>
                                {highlightMatch(option.employerName || '', inputValue)}
                              </span>
                              {")"}
                            </>
                          )}
                        </div>
                        <div className="suggestion-details">
                          Member No: {option.memberNo}
                          {option.type && ` • Type: ${option.type}`}
                          {option.status && ` • Status: ${option.status}`}
                        </div>
                      </SuggestionItem>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        searchBy === "name"
                          ? "Start typing name..."
                          : "Enter WCF number..."
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching && (
                              <CircularProgress color="inherit" size={20} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#e0e0e0"
                          },
                          "&:hover fieldset": {
                            borderColor: "#1976d2"
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#1976d2"
                          }
                        }
                      }}
                    />
                  )}
                  filterOptions={(x) => x}
                  freeSolo={false}
                  autoComplete
                  includeInputInList
                  blurOnSelect
                  clearOnBlur={false}
                  selectOnFocus
                  handleHomeEndKeys
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Update the claim status section */}
            {searchType === "employee" && selectedSuggestion && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <Typography
                    variant="subtitle2"
                    style={{ fontWeight: "bold" }}
                  >
                    {selectedSuggestion.claimId ? (
                      <>
                        Claim Number:{" "}
                        <span style={{ color: "#1976d2" }}>
                          {selectedSuggestion.claimId}
                        </span>
                      </>
                    ) : (
                      "No Active Claim"
                    )}
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedSuggestion?.claimId}
                  onClick={async () => {
                    console.log("Clicked claim:", selectedSuggestion.claimId);

                    const response = await fetch(
                      "http://127.0.0.1:8000/magic-login",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Accept: "application/json"
                        }, // important for Laravel session to persist
                        body: JSON.stringify({
                          username: "rehema.said",
                          password: "TTCL@2026"
                        }),
                        credentials: "include" // important for Laravel session to persist
                      }
                    );

                    const data = await response.json();

                    if (data?.redirect) {
                      window.open(data.redirect, "_blank");
                    } else {
                      console.error(data?.error || "Login failed");
                    }
                  }}
                >
                  View Claim
                </Button>
              </div>
            )}

            {/* Existing form fields */}
            {searchType !== "employer" && (
              <div className="modal-form-row">
                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>First Name:</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    style={{
                      height: "32px",
                      fontSize: "0.875rem",
                      padding: "4px 8px",
                      border: formErrors.firstName
                        ? "1px solid red"
                        : "1px solid #ccc"
                    }}
                  />
                  {formErrors.firstName && (
                    <span style={{ color: "red", fontSize: "0.75rem" }}>
                      {formErrors.firstName}
                    </span>
                  )}
                </div>

                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>
                    Middle Name (Optional):
                  </label>
                  <input
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Enter middle name"
                    style={{
                      height: "32px",
                      fontSize: "0.875rem",
                      padding: "4px 8px",
                      border: "1px solid #ccc"
                    }}
                  />
                </div>

                <div className="modal-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.875rem" }}>
                    Last Name
                    {formData.requester === "Employer" ? " (Optional)" : ""}:
                  </label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    style={{
                      height: "32px",
                      fontSize: "0.875rem",
                      padding: "4px 8px",
                      border:
                        formErrors.lastName &&
                        formData.requester !== "Employer"
                          ? "1px solid red"
                          : "1px solid #ccc"
                    }}
                  />
                  {formErrors.lastName &&
                    formData.requester !== "Employer" && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.lastName}
                      </span>
                    )}
                </div>
              </div>
            )}

            {/* Phone & NIDA */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.phoneNumber
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.phoneNumber && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.phoneNumber}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>
                  {formData.requester === "Employer"
                    ? "TIN:"
                    : "National Identification Number:"}
                </label>
                <input
                  name="nidaNumber"
                  value={formData.nidaNumber}
                  onChange={handleChange}
                  placeholder={
                    formData.requester === "Employer"
                      ? "Enter TIN number"
                      : "Enter NIN number"
                  }
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.nidaNumber
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.nidaNumber && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.nidaNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Requester & Institution */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Requester:</label>
                <select
                  name="requester"
                  value={formData.requester}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.requester
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select..</option>
                  <option value="Employee">Employee</option>
                  <option value="Employer">Employer</option>
                  <option value="Pensioners">Pensioners</option>
                  <option value="Stakeholders">Stakeholders</option>
                  <option value="Representative">Representative</option>
                </select>
                {formErrors.requester && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.requester}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Institution:</label>
                <input
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Enter Institution"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.institution
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.institution && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.institution}
                  </span>
                )}
              </div>
            </div>

            {/* New fields for Representative if selected */}
            {formData.requester === "Representative" && (
              <>
                <Typography
                  variant="h6"
                  sx={{ mt: 3, mb: 1, fontWeight: "bold" }}
                >
                  Representative Details
                </Typography>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Name:
                    </label>
                    <input
                      name="requesterName"
                      value={formData.requesterName}
                      onChange={handleChange}
                      placeholder="Enter representative's name"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.requesterName
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.requesterName && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.requesterName}
                      </span>
                    )}
                  </div>
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Phone Number:
                    </label>
                    <input
                      type="tel"
                      name="requesterPhoneNumber"
                      value={formData.requesterPhoneNumber}
                      onChange={handleChange}
                      placeholder="Enter representative's phone number"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.requesterPhoneNumber
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.requesterPhoneNumber && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.requesterPhoneNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Email (Optional):
                    </label>
                    <input
                      type="email"
                      name="requesterEmail"
                      value={formData.requesterEmail}
                      onChange={handleChange}
                      placeholder="Enter representative's email"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Representative Address (Optional):
                    </label>
                    <input
                      name="requesterAddress"
                      value={formData.requesterAddress}
                      onChange={handleChange}
                      placeholder="Enter representative's address"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: "1px solid #ccc"
                      }}
                    />
                  </div>
                </div>

                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>
                      Relationship to Employee/Employee:
                    </label>
                    <input
                      name="relationshipToEmployee"
                      value={formData.relationshipToEmployee}
                      onChange={handleChange}
                      placeholder="e.g., Parent, Spouse, Child"
                      style={{
                        height: "32px",
                        fontSize: "0.875rem",
                        padding: "4px 8px",
                        border: formErrors.relationshipToEmployee
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.relationshipToEmployee && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.relationshipToEmployee}
                      </span>
                    )}
                  </div>
                  <div className="modal-form-group"></div>{" "}
                  {/* Empty for alignment */}
                </div>
              </>
            )}

            {/* Region & District */}
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Region:</label>
                <input
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Enter region"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.region
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.region && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.region}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>District:</label>
                <input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    border: formErrors.district
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                />
                {formErrors.district && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.district}
                  </span>
                )}
              </div>
            </div>

            {/* Category & Channel */}
            <div className="modal-form-row">
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Category:</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.category
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Compliment">Compliment</option>
                </select>
                {formErrors.category && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Channel:</label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.channel
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Channel</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                </select>
                {formErrors.channel && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.channel}
                  </span>
                )}
              </div>
            </div>

            {/* Inquiry Type */}
            {formData.category === "Inquiry" && (
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Inquiry Type:</label>
                <select
                  name="inquiry_type"
                  value={formData.inquiry_type || ""}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.inquiry_type
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Inquiry Type</option>
                  <option value="Claims">Claims</option>
                  <option value="Compliance">Compliance</option>
                </select>
                {formErrors.inquiry_type && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.inquiry_type}
                  </span>
                )}
              </div>
            )}

            {/* Subject, Sub-section, Section */}
            <div className="modal-form-row">
              <div className="modal-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.875rem" }}>Subject:</label>
                <select
                  name="functionId"
                  value={formData.functionId}
                  onChange={handleChange}
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    width: "100%",
                    border: formErrors.functionId
                      ? "1px solid red"
                      : "1px solid #ccc"
                  }}
                >
                  <option value="">Select Subject</option>
                  {functionData.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {formErrors.functionId && (
                  <span style={{ color: "red", fontSize: "0.75rem" }}>
                    {formErrors.functionId}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Sub-section:</label>
                <input
                  value={selectedFunction}
                  readOnly
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>

              <div className="modal-form-group">
                <label style={{ fontSize: "0.875rem" }}>Section:</label>
                <input
                  value={selectedSection || "Unit"}
                  readOnly
                  style={{
                    height: "32px",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    backgroundColor: "#f5f5f5"
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="modal-form-group">
              <label style={{ fontSize: "0.875rem" }}>Description:</label>
              <textarea
                rows="2"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed descriptions.."
                style={{
                  fontSize: "0.875rem",
                  padding: "8px",
                  resize: "vertical",
                  border: formErrors.description
                    ? "1px solid red"
                    : "1px solid #ccc"
                }}
              />
              {formErrors.description && (
                <span style={{ color: "red", fontSize: "0.75rem" }}>
                  {formErrors.description}
                </span>
              )}
            </div>

            {/* Submit */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "1.5rem"
              }}
            >
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={(e) => handleSubmit(e)}
              >
                Submit to Backoffice
              </button>
              <button
                className="close-btn"
                style={{ background: "gray", color: "white" }}
                onClick={(e) => handleSubmit(e, "closed")}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 4,
            overflowY: "auto",
            minWidth: 350,
            maxWidth: 420,
            maxHeight: "90vh"
          }}
        >
          {/* Employer/Institution Details */}
          {selectedInstitution && (
            <div
              style={{
                flex: 1,
                background: "#e3f2fd",
                borderRadius: "8px",
                padding: "16px",
                minWidth: 0,
                marginBottom: 16
              }}
            >
              <h4 style={{ color: "#1976d2", marginBottom: 12 }}>
                Institution Details
              </h4>
              <div>
                <strong>Name:</strong> {selectedInstitution.name}
              </div>
              <div>
                <strong>TIN:</strong> {selectedInstitution.tin}
              </div>
              <div>
                <strong>Phone:</strong> {selectedInstitution.phone}
              </div>
              <div>
                <strong>Email:</strong> {selectedInstitution.email}
              </div>
              <div>
                <strong>Status:</strong> {selectedInstitution.employer_status}
              </div>
              <div>
                <strong>Allocated User Name:</strong>{" "}
                {selectedInstitution.allocated_staff_name}
              </div>
              <div>
                <strong>Allocated Username:</strong>{" "}
                {selectedInstitution.allocated_staff_username}
              </div>
            </div>
          )}
          {/* Ticket history for entered phone number */}
          {formData.phoneNumber && (
            <div
              style={{
                marginTop: 8,
                background: "#f8f9fa",
                borderRadius: 8,
                padding: 0,
                minHeight: 60
              }}
            >
              <h4 style={{ color: "#1976d2", margin: '16px 0 8px 0', paddingLeft: 16 }}>
                Ticket History for {formData.phoneNumber}
              </h4>
              {creationTicketsLoading ? (
                <div style={{ textAlign: "center", padding: 12 }}>
                  <CircularProgress size={22} />
                </div>
              ) : creationFoundTickets.length > 0 ? (
                creationFoundTickets.map((ticket) => (
                  <Box
                    key={ticket.id}
                    onClick={() => setCreationActiveTicketId(ticket.id)}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: creationActiveTicketId === ticket.id ? "#e3f2fd" : "#fff",
                      cursor: "pointer",
                      border: creationActiveTicketId === ticket.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(25,118,210,0.1)',
                        borderColor: '#1976d2'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {ticket.ticket_id}
                      </Typography>
                      <Typography
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '12px',
                          color: 'white',
                          background:
                            ticket.status === 'Closed'
                              ? '#757575'
                              : ticket.status === 'Open'
                              ? '#2e7d32'
                              : '#1976d2',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {ticket.status}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#333', mb: 1 }}>
                        Subject: {ticket.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        Description: {ticket.description}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '0.95em', textAlign: 'center', padding: 16 }}>
                  No previous tickets found for this number.
                </div>
              )}
            </div>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default AdvancedTicketCreateModal;

