import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Autocomplete,
} from "@mui/material";
import { baseURL } from "../../config";

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

export default function TicketCreateModal({ open, onClose, initialPhoneNumber = "", functionData = [] }) {
  const [formData, setFormData] = useState({ ...defaultFormData, phoneNumber: initialPhoneNumber });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submitAction, setSubmitAction] = useState("open");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [customerTickets, setCustomerTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");

  // --- Search section state ---
  const [searchType, setSearchType] = useState("employee");
  const [searchBy, setSearchBy] = useState("name");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [openAuto, setOpenAuto] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef(null);

  // --- Debounced search logic ---
  const debouncedSearch = useCallback(
    async (searchText) => {
      if (!searchText || searchText.length < 1) {
        setSearchSuggestions([]);
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
              Accept: "application/json",
            },
            mode: "cors",
            body: JSON.stringify({
              type: searchType,
              name: searchText,
              employer_registration_number: searchBy === "wcf_number" ? searchText : "",
            }),
          }
        );
        const result = await response.json();
        const data = result?.results || [];
        const suggestions = data.map((result) => {
          const numberPrefix = result.memberno ? result.memberno : "";
          const originalName = result.name || result.fullname || result.displayName || "";
          const cleanName = originalName.replace(/\s+/g, " ").trim();
          let employerName = "";
          let phoneNumber = "";
          const employerMatch = originalName.match(/—\s*\((.*?)\)/);
          if (employerMatch) {
            const employerInfo = employerMatch[1].trim();
            const phoneMatch = employerInfo.match(/(\d{10,})/);
            if (phoneMatch) {
              phoneNumber = phoneMatch[0];
              employerName = employerInfo.replace(phoneMatch[0], "").trim();
            } else {
              employerName = employerInfo;
            }
          }
          if (!phoneNumber && result.phone) {
            phoneNumber = result.phone;
          }
          return {
            id: result.memberno,
            numberPrefix,
            originalName,
            displayName: `${numberPrefix} ${cleanName}${
              employerName ? ` — (${employerName}${phoneNumber ? ` - ${phoneNumber}` : ""})` : ""
            }`,
            cleanName,
            employerName,
            phoneNumber,
            memberNo: result.memberno,
            status: result.status,
            rawData: result,
          };
        });
        setSearchSuggestions(suggestions);
        setOpenAuto(true);
      } catch (error) {
        setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchType, searchBy]
  );

  // --- Handlers for autocomplete ---
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
    };
    setSelectedSuggestion(selectedWithClaim);
    setInputValue(suggestion.cleanName || suggestion.name || "");
    setSearchQuery(suggestion.cleanName || suggestion.name || "");
    setOpenAuto(false);
    // Prefill form fields
    let updatedFormData = { ...formData };
    if (searchType === "employee") {
      updatedFormData = {
        ...updatedFormData,
        firstName: rawData.firstname || "",
        middleName: rawData.middlename || "",
        lastName: rawData.lastname || "",
        nidaNumber: rawData.nin || "",
        phoneNumber: rawData.phoneNumber || "",
        institution: institutionName,
      };
    } else if (searchType === "employer") {
      updatedFormData = {
        ...updatedFormData,
        firstName: "",
        middleName: "",
        lastName: "",
        nidaNumber: rawData.tin || "",
        phoneNumber: rawData.phone || "",
        institution: rawData.name || "",
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
      relationshipToEmployee: updatedFormData.relationshipToEmployee || rawData.relationshipToEmployee || "",
    };
    setFormData(updatedFormData);
    setSnackbar({ open: true, message: "User information loaded successfully", severity: "success" });
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
      debouncedSearch(newValue);
    }, 150);
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: "#fff3cd", borderRadius: 2 }}>{part}</span>
      ) : (
        part
      )
    );
  };

  // Update search input when query changes
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, phoneNumber: initialPhoneNumber }));
  }, [initialPhoneNumber, open]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});
    // Validate required fields
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
      description: "Description",
    };
    if (formData.requester === "Representative") {
      requiredFields.requesterName = "Representative Name";
      requiredFields.requesterPhoneNumber = "Representative Phone Number";
      requiredFields.relationshipToEmployee = "Relationship to Employee";
    }
    const errors = {};
    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!formData[key] || formData[key].trim() === "") {
        errors[key] = `${label} is required`;
      }
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }
    // Prepare payload
    const payload = { 
      ...formData, 
      status: submitAction === "closed" ? "Closed" : "Open",
      // Add claim number for routing decision
      claimId: selectedSuggestion?.claimId || null,
      // Add subject field using the selected function name
      subject: selectedFunction || "",
    };
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ open: true, message: data.message || "Ticket created successfully", severity: "success" });
        setFormData({ ...defaultFormData, phoneNumber: initialPhoneNumber });
        onClose && onClose();
      } else {
        setSnackbar({ open: true, message: data.message || "Ticket creation failed.", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Network error. Please try again later.", severity: "error" });
    }
    setLoading(false);
  };

  // Fetch existing tickets for the phone number
  useEffect(() => {
    const fetchCustomerTickets = async () => {
      if (!formData.phoneNumber) {
        setCustomerTickets([]);
        return;
      }
      setLoadingTickets(true);
      setTicketError("");
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${baseURL}/ticket/all-customer-tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && Array.isArray(result.tickets)) {
          // Filter tickets by phone number
          const filtered = result.tickets.filter(t => t.phone_number === formData.phoneNumber);
          setCustomerTickets(filtered);
        } else {
          setCustomerTickets([]);
        }
      } catch (error) {
        setTicketError("Failed to load existing tickets.");
        setCustomerTickets([]);
      }
      setLoadingTickets(false);
    };
    fetchCustomerTickets();
  }, [formData.phoneNumber, open]);

  return (
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose && onClose();
      }}
      disableEscapeKeyDown
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 3,
          p: 4,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          New Ticket
        </Typography>
        {/* --- Search Section --- */}
        <div style={{ marginBottom: 20, padding: 15, background: "#f5f5f5", borderRadius: 8 }}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Search Type:</label>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchSuggestions([]);
                setSelectedSuggestion(null);
                setSearchQuery("");
              }}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
            >
              <option value="employee">Employee</option>
              <option value="employer">Employer</option>
            </select>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Search By:</label>
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value);
                setSearchSuggestions([]);
                setSelectedSuggestion(null);
                setSearchQuery("");
              }}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
            >
              <option value="name">Name</option>
              <option value="wcf_number">WCF Number</option>
            </select>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>{searchBy === "name" ? "Enter Name" : "Enter WCF Number"}:</label>
            <Autocomplete
              value={selectedSuggestion}
              onChange={handleSuggestionSelected}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              options={searchSuggestions}
              getOptionLabel={(option) => option.displayName || ""}
              open={openAuto}
              onOpen={() => setOpenAuto(true)}
              onClose={() => setOpenAuto(false)}
              loading={isSearching}
              loadingText={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><CircularProgress size={20} /><span>Searching...</span></div>}
              noOptionsText={inputValue.length < 1 ? "Start typing to search" : "No matching records found"}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#2c3e50" }}>
                      <span style={{ color: "#666" }}>{option.numberPrefix}</span> {highlightMatch(option.cleanName, inputValue)}
                      {option.employerName && (
                        <>
                          {" — ("}
                          <span style={{ color: "#666" }}>{highlightMatch(option.employerName, inputValue)}</span>
                          {")"}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>
                      Member No: {option.memberNo}
                      {option.type && ` • Type: ${option.type}`}
                      {option.status && ` • Status: ${option.status}`}
                    </div>
                  </div>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={searchBy === "name" ? "Start typing name..." : "Enter WCF number..."}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                      "&:hover fieldset": { borderColor: "#1976d2" },
                      "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                    },
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
        {/* Claim status display */}
        {selectedSuggestion && selectedSuggestion.claimId && (
          <div style={{ marginTop: 10, padding: 10, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
              Claim Number: <span style={{ color: "#1976d2" }}>{selectedSuggestion.claimId}</span>
            </Typography>
          </div>
        )}
        {/* --- End Search Section --- */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
            />
            <TextField
              label="Middle Name"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.phoneNumber}
              helperText={formErrors.phoneNumber}
            />
            <TextField
              label="NIDA Number"
              name="nidaNumber"
              value={formData.nidaNumber}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.nidaNumber}
              helperText={formErrors.nidaNumber}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <FormControl fullWidth error={!!formErrors.requester}>
              <InputLabel>Requester</InputLabel>
              <Select
                name="requester"
                value={formData.requester}
                onChange={handleChange}
                label="Requester"
              >
                <MenuItem value="">Select..</MenuItem>
                <MenuItem value="Employee">Employee</MenuItem>
                <MenuItem value="Employer">Employer</MenuItem>
                <MenuItem value="Pensioners">Pensioners</MenuItem>
                <MenuItem value="Stakeholders">Stakeholders</MenuItem>
                <MenuItem value="Representative">Representative</MenuItem>
              </Select>
              {formErrors.requester && <Typography color="error" variant="caption">{formErrors.requester}</Typography>}
            </FormControl>
            <TextField
              label="Institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.institution}
              helperText={formErrors.institution}
            />
          </div>
          {formData.requester === "Representative" && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Representative Details
              </Typography>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <TextField
                  label="Representative Name"
                  name="requesterName"
                  value={formData.requesterName}
                  onChange={handleChange}
                  fullWidth
                  error={!!formErrors.requesterName}
                  helperText={formErrors.requesterName}
                />
                <TextField
                  label="Representative Phone Number"
                  name="requesterPhoneNumber"
                  value={formData.requesterPhoneNumber}
                  onChange={handleChange}
                  fullWidth
                  error={!!formErrors.requesterPhoneNumber}
                  helperText={formErrors.requesterPhoneNumber}
                />
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <TextField
                  label="Representative Email (Optional)"
                  name="requesterEmail"
                  value={formData.requesterEmail}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Representative Address (Optional)"
                  name="requesterAddress"
                  value={formData.requesterAddress}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Relationship to Employee"
                  name="relationshipToEmployee"
                  value={formData.relationshipToEmployee}
                  onChange={handleChange}
                  fullWidth
                  error={!!formErrors.relationshipToEmployee}
                  helperText={formErrors.relationshipToEmployee}
                />
              </div>
            </>
          )}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <TextField
              label="Region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.region}
              helperText={formErrors.region}
            />
            <TextField
              label="District"
              name="district"
              value={formData.district}
              onChange={handleChange}
              fullWidth
              error={!!formErrors.district}
              helperText={formErrors.district}
            />
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <FormControl fullWidth error={!!formErrors.category}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="">Select Category</MenuItem>
                <MenuItem value="Inquiry">Inquiry</MenuItem>
                <MenuItem value="Complaint">Complaint</MenuItem>
                <MenuItem value="Suggestion">Suggestion</MenuItem>
                <MenuItem value="Compliment">Compliment</MenuItem>
              </Select>
              {formErrors.category && <Typography color="error" variant="caption">{formErrors.category}</Typography>}
            </FormControl>
            <FormControl fullWidth error={!!formErrors.channel}>
              <InputLabel>Channel</InputLabel>
              <Select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                label="Channel"
              >
                <MenuItem value="">Select Channel</MenuItem>
                <MenuItem value="Call">Call</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
              </Select>
              {formErrors.channel && <Typography color="error" variant="caption">{formErrors.channel}</Typography>}
            </FormControl>
          </div>
          {formData.category === "Inquiry" && (
            <FormControl fullWidth error={!!formErrors.inquiry_type} sx={{ mb: 2 }}>
              <InputLabel>Inquiry Type</InputLabel>
              <Select
                name="inquiry_type"
                value={formData.inquiry_type}
                onChange={handleChange}
                label="Inquiry Type"
              >
                <MenuItem value="">Select Inquiry Type</MenuItem>
                <MenuItem value="Claims">Claims</MenuItem>
                <MenuItem value="Compliance">Compliance</MenuItem>
              </Select>
              {formErrors.inquiry_type && <Typography color="error" variant="caption">{formErrors.inquiry_type}</Typography>}
            </FormControl>
          )}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <FormControl fullWidth error={!!formErrors.functionId}>
              <InputLabel>Subject</InputLabel>
              <Select
                name="functionId"
                value={formData.functionId}
                onChange={handleChange}
                label="Subject"
              >
                <MenuItem value="">Select Subject</MenuItem>
                {functionData.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.functionId && <Typography color="error" variant="caption">{formErrors.functionId}</Typography>}
            </FormControl>
            <TextField
              label="Sub-section"
              value={selectedFunction}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Section"
              value={selectedSection || "Unit"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </div>
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
            error={!!formErrors.description}
            helperText={formErrors.description}
            sx={{ mb: 2 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <Button onClick={onClose} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={() => setSubmitAction("open")}
            >
              {loading ? <CircularProgress size={20} /> : "Submit to Backoffice"}
            </Button>
            <Button
              variant="contained"
              style={{ background: "gray", color: "white" }}
              disabled={loading}
              onClick={(e) => {
                setSubmitAction("closed");
                handleSubmit(e);
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Close Ticket"}
            </Button>
          </div>
        </form>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        {/* Existing Tickets Section */}
        {loadingTickets ? (
          <div style={{ marginBottom: 16 }}>Loading existing tickets...</div>
        ) : customerTickets.length > 0 ? (
          <div style={{ marginBottom: 16, background: '#fff3cd', padding: 12, borderRadius: 8 }}>
            <strong>Existing Tickets for this Number:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {customerTickets.map(ticket => (
                <li key={ticket.id} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>#{ticket.ticket_id}</span> - {ticket.status} - {ticket.category} - {ticket.description?.slice(0, 40)}
                </li>
              ))}
            </ul>
            <div style={{ color: '#b26a00', marginTop: 6 }}>
              Please review existing tickets before creating a new one.
            </div>
          </div>
        ) : null}
      </Box>
    </Modal>
  );
} 