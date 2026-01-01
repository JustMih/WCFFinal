import React, { useEffect, useState } from "react";
import "./users.css"; // External CSS file for styling
import { FaArrowRight, FaPlus } from "react-icons/fa";
import { FaRegQuestionCircle } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { HiMiniLockClosed, HiMiniLockOpen } from "react-icons/hi2";
import { RxReset } from "react-icons/rx";
import { MdDeleteForever } from "react-icons/md";
import { baseURL } from "../../config";
import {
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
} from "@mui/material";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    isActive: false,
    unit_section: "",
    sub_section: "",
  });
  const [currentUser, setCurrentUser] = useState(null); // For editing a user
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // Type of action (activate, deactivate, etc.)
  const [userIdForAction, setUserIdForAction] = useState(null); // ID of the user for the action
  
  // States for sections and functions (for focal-person)
  const [sectionsList, setSectionsList] = useState([]); // Directorates and units
  const [functionsList, setFunctionsList] = useState([]); // Functions (sub-sections)
  const [selectedSection, setSelectedSection] = useState(""); // Selected section (directorate/unit)

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch sections and functions when modal opens and role is focal-person
  useEffect(() => {
    const fetchSectionsAndFunctions = async () => {
      if (showModal && (newUserData.role === "focal-person" || (currentUser && currentUser.role === "focal-person"))) {
        try {
          const token = localStorage.getItem("authToken");
          
          // Fetch directorates and units
          const sectionsResponse = await fetch(`${baseURL}/section/units-data`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (sectionsResponse.ok) {
            const sectionsData = await sectionsResponse.json();
            setSectionsList(sectionsData.data || []);
          }
          
          // Fetch functions (sub-sections)
          const functionsResponse = await fetch(`${baseURL}/section/functions-data`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (functionsResponse.ok) {
            const functionsData = await functionsResponse.json();
            setFunctionsList(functionsData.data || []);
          }
        } catch (error) {
          console.error("Error fetching sections and functions:", error);
        }
      }
    };
    
    fetchSectionsAndFunctions();
  }, [showModal, newUserData.role, currentUser]);

  // When editing and selectedSection is set, ensure sub_section is preserved
  useEffect(() => {
    if (isEditing && currentUser && selectedSection && currentUser.role === "focal-person") {
      // If selectedSection is set and matches user's unit_section, preserve sub_section
      // The sub_section value is already set in currentUser, so it will display automatically
      // This effect ensures the dropdown is ready when selectedSection changes
    }
  }, [isEditing, currentUser, selectedSection]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value,
    });
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({
      ...currentUser,
      [name]: value,
    });
  };

  const handleAddUser = async () => {
    // Validate that focal-person must have sub_section if it's for a directorate
    // For units, sub-section is not required
    if (newUserData.role === "focal-person") {
      const unitSection = (newUserData.unit_section || selectedSection || "").toLowerCase();
      const isDirectorate = unitSection.includes("directorate");
      
      // Only require sub_section if it's a directorate
      if (isDirectorate && (!newUserData.sub_section || newUserData.sub_section.trim() === "")) {
        setSnackbarMessage("Focal person for directorate must have a sub-section (function)");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
    }

    try {
      const response = await fetch(`${baseURL}/users/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          ...newUserData,
          full_name: newUserData.name, // Backend expects full_name
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create user");
      }
      setShowModal(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "admin",
        isActive: false,
      });
      fetchUsers();
      setSnackbarMessage("User added successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error adding user.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    // Validate that focal-person must have sub_section if it's for a directorate
    // For units, sub-section is not required
    const roleToCheck = currentUser.role || (currentUser && currentUser.role);
    const unitSectionToCheck = currentUser.unit_section || selectedSection || "";
    const subSectionToCheck = currentUser.sub_section || "";
    
    if (roleToCheck === "focal-person") {
      const unitSection = (unitSectionToCheck || "").toLowerCase();
      const isDirectorate = unitSection.includes("directorate");
      
      // Only require sub_section if it's a directorate
      if (isDirectorate && (!subSectionToCheck || subSectionToCheck.trim() === "")) {
        setSnackbarMessage("Focal person for directorate must have a sub-section (function)");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
    }

    try {
      // Prepare user data without password if it's empty or unchanged
      const userDataToSend = {
        ...currentUser,
        full_name: currentUser.name, // Backend expects full_name
      };
      
      // Only include password if it has been changed (not empty)
      if (!currentUser.password || currentUser.password.trim() === "") {
        delete userDataToSend.password;
      }
      
      const response = await fetch(`${baseURL}/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(userDataToSend),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      setShowModal(false);
      setIsEditing(false);
      fetchUsers();
      setSnackbarMessage("User updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error updating user.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleConfirmAction = (action, userId) => {
    setActionType(action);
    setUserIdForAction(userId);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (actionType && userIdForAction) {
      try {
        let response;
        if (actionType === "activate") {
          response = await fetch(
            `${baseURL}/users/${userIdForAction}/activate`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
        } else if (actionType === "de-activate") {
          response = await fetch(
            `${baseURL}/users/${userIdForAction}/deactivate`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
        } else if (actionType === "reset-password") {
          response = await fetch(
            `${baseURL}/users/${userIdForAction}/reset-password`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
        } else if (actionType === "delete") {
          response = await fetch(`${baseURL}/users/${userIdForAction}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
        }

        if (!response.ok) {
          throw new Error(`Failed to ${actionType} user`);
        }

        fetchUsers(); // Reload the users after action
        setSnackbarMessage(`User ${actionType}d successfully!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } catch (error) {
        setError(error.message);
        setSnackbarMessage(`Error ${actionType} user.`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setShowConfirmModal(false); // Close the confirmation modal
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentUser(null);
    setSelectedSection("");
    setNewUserData({
      name: "",
      email: "",
      password: "",
      role: "admin",
      isActive: false,
      unit_section: "",
      sub_section: "",
    });
  };

  // Enhanced search: search by name, email, role, unit_section, sub_section, designation, report_to
  const filteredUsers = users.filter((user) => {
    if (!search.trim()) return true;
    
    const searchLower = search.toLowerCase();
    const name = (user.name || user.full_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (user.role || "").toLowerCase();
    const unitSection = (user.unit_section || "").toLowerCase();
    const subSection = (user.sub_section || "").toLowerCase();
    const designation = (user.designation || "").toLowerCase();
    const reportTo = (user.report_to || "").toLowerCase();
    
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      role.includes(searchLower) ||
      unitSection.includes(searchLower) ||
      subSection.includes(searchLower) ||
      designation.includes(searchLower) ||
      reportTo.includes(searchLower)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="user-table-container">
      <h2 className="table-title">Users Management</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name, email, role, section, sub-section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button
          className="add-user-button"
          onClick={() => {
            setShowModal(true);
            setIsEditing(false);
            setNewUserData({
              name: "",
              email: "",
              password: "",
              role: "admin",
              isActive: false,
              unit_section: "",
            });
          }}
        >
          <FaPlus /> Add User
        </button>
      </div>
      <table className="user-table">
        <thead>
          <tr>
            <th>Sn</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Unit Section</th>
            <th>Sub-Section</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.name || user.full_name || "N/A"}</td>
              <td>{user.email || "N/A"}</td>
              <td>{user.role || "N/A"}</td>
              <td>{user.unit_section || "N/A"}</td>
              <td>{user.sub_section || "N/A"}</td>
              <td>{user.isActive ? "Active" : "Inactive"}</td>
              <td className="action-buttons">
                <Tooltip title="Edit User">
                  <button
                    className="edit-button"
                    onClick={async () => {
                      setCurrentUser(user);
                      
                      // Fetch sections and functions if role is focal-person
                      if (user.role === "focal-person") {
                        try {
                          const token = localStorage.getItem("authToken");
                          
                          // Fetch directorates and units
                          const sectionsResponse = await fetch(`${baseURL}/section/units-data`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          if (sectionsResponse.ok) {
                            const sectionsData = await sectionsResponse.json();
                            const fetchedSections = sectionsData.data || [];
                            setSectionsList(fetchedSections);
                            
                            // Set selectedSection if user has unit_section that matches a section
                            // This ensures sub_section dropdown displays correctly
                            if (user.unit_section) {
                              // Try exact match first
                              let matchingSection = fetchedSections.find(s => 
                                s.name.toLowerCase() === user.unit_section.toLowerCase()
                              );
                              
                              // If no exact match, try partial match
                              if (!matchingSection) {
                                matchingSection = fetchedSections.find(s => 
                                  user.unit_section.includes(s.name) || s.name.includes(user.unit_section)
                                );
                              }
                              
                              if (matchingSection) {
                                setSelectedSection(matchingSection.name);
                              } else {
                                // If no match found, still set to user's unit_section to preserve it
                                setSelectedSection(user.unit_section);
                              }
                            } else {
                              setSelectedSection("");
                            }
                          }
                          
                          // Fetch functions (sub-sections)
                          const functionsResponse = await fetch(`${baseURL}/section/functions-data`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          if (functionsResponse.ok) {
                            const functionsData = await functionsResponse.json();
                            setFunctionsList(functionsData.data || []);
                          }
                        } catch (error) {
                          console.error("Error fetching sections and functions:", error);
                        }
                      } else {
                        // For non-focal-person roles, ensure unit_section is preserved
                        setSelectedSection("");
                      }
                      
                      setShowModal(true);
                      setIsEditing(true);
                    }}
                  >
                    <AiFillEdit />
                  </button>
                </Tooltip>
                <Tooltip title="Activate User">
                  <button
                    className="activated-button"
                    onClick={() => handleConfirmAction("activate", user.id)}
                  >
                    <HiMiniLockOpen />
                  </button>
                </Tooltip>

                <Tooltip title="Deactivate User">
                  <button
                    className="deactivated-button"
                    onClick={() => handleConfirmAction("de-activate", user.id)}
                  >
                    <HiMiniLockClosed />
                  </button>
                </Tooltip>

                <Tooltip title="Reset User Password">
                  <button
                    className="reset-button"
                    onClick={() =>
                      handleConfirmAction("reset-password", user.id)
                    }
                  >
                    <RxReset />
                  </button>
                </Tooltip>

                <Tooltip title="Delete User">
                  <button
                    className="delete-button"
                    onClick={() => handleConfirmAction("delete", user.id)}
                  >
                    <MdDeleteForever />
                  </button>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredUsers.length / usersPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          )
        )}
      </div>

      {/* Add and Update User Modal */}
      <Modal open={showModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            borderRadius: "10px",
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
          }}
        >
          <h2>{isEditing ? "Edit User" : "Add User"}</h2>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            name="name"
            value={isEditing ? currentUser.name : newUserData.name}
            onChange={isEditing ? handleUpdateInputChange : handleInputChange}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            name="email"
            value={isEditing ? currentUser.email : newUserData.email}
            onChange={isEditing ? handleUpdateInputChange : handleInputChange}
          />
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            name="password"
            value={isEditing ? currentUser.password : newUserData.password}
            onChange={isEditing ? handleUpdateInputChange : handleInputChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              name="role"
              value={isEditing ? currentUser.role : newUserData.role}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    width: 'auto',
                    overflow: 'auto'
                  }
                }
              }}
            >
              <MenuItem value="super-admin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="agent">Agent</MenuItem>
              <MenuItem value="attendee">Attendee</MenuItem>
              <MenuItem value="reviewer">Reviewer</MenuItem>
              <MenuItem value="focal-person">Focal Person</MenuItem>
              <MenuItem value="claim-focal-person">Claim Focal Person</MenuItem>
              <MenuItem value="compliance-focal-person">Compliance Focal Person</MenuItem>
              <MenuItem value="head-of-unit">Head of Unit</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="director-general">Director General</MenuItem>
            </Select>
          </FormControl>
          {/* Section and Sub-Section dropdowns for focal-person */}
          {(isEditing ? currentUser.role : newUserData.role) === "focal-person" ? (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Section (Directorate/Unit)</InputLabel>
                <Select
                  label="Section (Directorate/Unit)"
                  name="section"
                  value={selectedSection}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setSelectedSection(selectedValue);
                    // Auto-fill unit_section from selected section and clear sub_section when section changes
                    if (isEditing) {
                      setCurrentUser({ 
                        ...currentUser, 
                        unit_section: selectedValue || "", 
                        sub_section: "" 
                      });
                    } else {
                      setNewUserData({ 
                        ...newUserData, 
                        unit_section: selectedValue || "", 
                        sub_section: "" 
                      });
                    }
                  }}
                >
                  <MenuItem value="">Select Section</MenuItem>
                  {sectionsList.map((section) => (
                    <MenuItem key={section.id || section.name} value={section.name}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedSection && (() => {
                // Check if selectedSection is a directorate
                // First check if it contains "directorate" in the name
                if (selectedSection.toLowerCase().includes("directorate")) {
                  return true;
                }
                // If not, check if it's in sectionsList and not a unit
                // Units typically have "Unit" in their name or are functions from the "Units" section
                const sectionInList = sectionsList.find(s => s.name === selectedSection);
                if (sectionInList) {
                  // If it's not a unit (doesn't have section_id pointing to Units), it's likely a directorate
                  // Check if it's not a unit by checking if name doesn't contain "unit"
                  return !selectedSection.toLowerCase().includes("unit");
                }
                // If selectedSection is set but not in sectionsList, assume it's a directorate if it doesn't contain "unit"
                // This handles cases where unit_section was set directly without matching sectionsList
                return !selectedSection.toLowerCase().includes("unit");
              })() && functionsList.length > 0 && (
                <>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Sub-Section (Function)</InputLabel>
                    <Select
                      label="Sub-Section (Function)"
                      name="sub_section"
                      value={isEditing ? (currentUser.sub_section || "") : (newUserData.sub_section || "")}
                      onChange={isEditing ? handleUpdateInputChange : handleInputChange}
                      required
                    >
                      <MenuItem value="">Select Sub-Section</MenuItem>
                      {(() => {
                        // Filter functions by selected section and remove duplicates by function name
                        const filtered = functionsList.filter((func) => {
                          const funcSection = func.function?.section?.name || func.section?.name || func.section_name || "";
                          return funcSection === selectedSection;
                        });
                        
                        // Get unique function names to avoid duplicates
                        const uniqueFunctions = new Map();
                        filtered.forEach((func) => {
                          const functionName = func.function?.name || func.name || func.function_name || "";
                          const functionId = func.function?.id || func.function_id || func.id;
                          if (functionName && !uniqueFunctions.has(functionName)) {
                            uniqueFunctions.set(functionName, { functionName, functionId, func });
                          }
                        });
                        
                        return Array.from(uniqueFunctions.values()).map((item, index) => (
                          <MenuItem key={item.functionId || item.func.id || index} value={item.functionName}>
                            {item.functionName}
                          </MenuItem>
                        ));
                      })()}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Unit Section"
                    fullWidth
                    margin="normal"
                    name="unit_section"
                    value={isEditing ? (currentUser.unit_section || selectedSection) : (newUserData.unit_section || selectedSection)}
                    onChange={isEditing ? handleUpdateInputChange : handleInputChange}
                    helperText="Auto-filled from selected section"
                    disabled
                  />
                </>
              )}
              {selectedSection && !selectedSection.toLowerCase().includes("directorate") && (
                <TextField
                  label="Unit Section"
                  fullWidth
                  margin="normal"
                  name="unit_section"
                  value={isEditing ? (currentUser.unit_section || "") : (newUserData.unit_section || "")}
                  onChange={isEditing ? handleUpdateInputChange : handleInputChange}
                  helperText="Optional for units"
                />
              )}
            </>
          ) : (
            <TextField
              label="Unit Section"
              fullWidth
              margin="normal"
              name="unit_section"
              value={isEditing ? (currentUser.unit_section || "") : (newUserData.unit_section || "")}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              helperText="Optional"
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  isEditing ? currentUser.isActive : newUserData.isActive
                }
                onChange={(e) =>
                  isEditing
                    ? setCurrentUser({
                        ...currentUser,
                        isActive: e.target.checked,
                      })
                    : setNewUserData({
                        ...newUserData,
                        isActive: e.target.checked,
                      })
                }
              />
            }
            label="Is Active"
          />
          <div className="modal-action-button">
            <Button
              variant="contained"
              color="primary"
              onClick={isEditing ? handleUpdateUser : handleAddUser}
            >
              {isEditing ? "Update User" : "Add User"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Activate, De-Activate, Delete and Reset Password */}
      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "auto",
            borderRadius: "10px",
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
          }}
        >
          <FaRegQuestionCircle style={{ fontSize: 50, color: "red" }} />
          <p>Are you sure you want to {actionType} this user?</p>
          <div className="user-modal-action-buttons">
            <Button variant="contained" color="primary" onClick={handleConfirm}>
              Confirm
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Users;
