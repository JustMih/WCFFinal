import React, { useEffect, useState } from "react";
import { FaArrowRight, FaPlus } from "react-icons/fa";
import { FaRegQuestionCircle } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { HiMiniLockClosed, HiMiniLockOpen } from "react-icons/hi2";
import { RxReset } from "react-icons/rx";
import { MdDeleteForever } from "react-icons/md";
import { baseURL } from "../../../config";
import "./callCenterUsers.css";
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

export default function CallCenterUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: "",
    email: "",
    password: "",
    username: "",
    extension: "",
    role: "admin",
    isActive: false,
    report_to: "",
    designation: "",
    unit_section: "",
  });
  const [currentUser, setCurrentUser] = useState(null); // For editing a user
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // Type of action (activate, deactivate, etc.)
  const [userIdForAction, setUserIdForAction] = useState(null); // ID of the user for the action

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
    try {
      // Generate username from full_name
      const generatedUsername = newUserData.full_name
        .toLowerCase()
        .replace(/\s+/g, ".");

      // Prepare user data - set extension to null if role is not agent or attendee
      const userDataToSend = {
        ...newUserData,
        username: generatedUsername,
        extension:
          newUserData.role === "agent" || newUserData.role === "attendee"
            ? newUserData.extension
            : null,
      };

      const response = await fetch(`${baseURL}/users/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(userDataToSend),
      });
      
      if (!response.ok) {
        // Get the error response from the server
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      setShowModal(false);
      setNewUserData({
        full_name: "",
        email: "",
        password: "",
        username: "",
        extension: "",
        role: "admin",
        isActive: false,
        report_to: "",
        designation: "",
        unit_section: "",
      });
      fetchUsers();
      setSnackbarMessage("User added successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error creating user:", error);
      
      const errorMessage = error.message || "Error adding user.";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    try {
      // Generate username from full_name
      const generatedUsername = currentUser.full_name
        .toLowerCase()
        .replace(/\s+/g, ".");

      // Prepare user data - set extension to null if role is not agent or attendee
      const userDataToSend = {
        ...currentUser,
        username: generatedUsername,
        extension:
          currentUser.role === "agent" || currentUser.role === "attendee"
            ? currentUser.extension
            : null,
      };

      const response = await fetch(`${baseURL}/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(userDataToSend),
      });
      
      if (!response.ok) {
        // Get the error response from the server
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
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
          // Get the error response from the server
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${actionType} user`);
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
    setNewUserData({
      full_name: "",
      email: "",
      password: "",
      extension: "",
      role: "admin",
      isActive: false,
      report_to: "",
      designation: "",
      unit_section: "",
    });
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="user-table-container">
      <h2 className="table-title">Users Management</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Search by full name..."
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
              full_name: "",
              email: "",
              password: "",
              extension: "",
              username: "",
              role: "admin",
              isActive: false,
              report_to: "",
              designation: "",
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Tooltip title={user.unit_section || 'No unit section assigned'}>
                  <span>{user.unit_section || 'N/A'}</span>
                </Tooltip>
              </td>
              <td>{user.isActive ? "Active" : "Inactive"}</td>
              <td className="action-buttons">
                <Tooltip title="Edit User">
                  <button
                    className="edit-button"
                    onClick={() => {
                      setCurrentUser(user);
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
      <div
        className="pagination"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
            color: currentPage === 1 ? "#999" : "#333",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          ← Previous
        </button>

        <span
          style={{
            padding: "8px 12px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Page {currentPage} of {Math.ceil(filteredUsers.length / usersPerPage)}
        </span>

        <button
          onClick={() =>
            setCurrentPage(
              Math.min(
                Math.ceil(filteredUsers.length / usersPerPage),
                currentPage + 1
              )
            )
          }
          disabled={
            currentPage === Math.ceil(filteredUsers.length / usersPerPage)
          }
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            backgroundColor:
              currentPage === Math.ceil(filteredUsers.length / usersPerPage)
                ? "#f5f5f5"
                : "#fff",
            color:
              currentPage === Math.ceil(filteredUsers.length / usersPerPage)
                ? "#999"
                : "#333",
            cursor:
              currentPage === Math.ceil(filteredUsers.length / usersPerPage)
                ? "not-allowed"
                : "pointer",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Next →
        </button>
      </div>

      {/* Add and Update User Modal */}
      <Modal open={showModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "12px",
            bgcolor: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            p: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 2,
            pb: 2,
            borderBottom: "2px solid #f0f0f0"
          }}>
            <h2 style={{ 
              margin: 0, 
              color: "#333", 
              fontSize: "20px",
              fontWeight: "600"
            }}>
              {isEditing ? "Edit User" : "Add New User"}
            </h2>
            <button
              onClick={handleCloseModal}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
                padding: "4px",
                borderRadius: "4px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "#333"}
              onMouseLeave={(e) => e.target.style.color = "#666"}
            >
              ×
            </button>
          </Box>
          
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Full Name"
              fullWidth
              size="small"
              name="full_name"
              value={isEditing ? currentUser?.full_name || "" : newUserData.full_name}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            
            <TextField
              label="Email"
              fullWidth
              size="small"
              name="email"
              type="email"
              value={isEditing ? currentUser?.email || "" : newUserData.email}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            
            <TextField
              label="Password"
              fullWidth
              size="small"
              type="password"
              name="password"
              value={isEditing ? currentUser?.password || "" : newUserData.password}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            
            <TextField
              label="Report To"
              fullWidth
              size="small"
              name="report_to"
              value={isEditing ? currentUser?.report_to || "" : newUserData.report_to}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            
            <TextField
              label="Designation"
              fullWidth
              size="small"
              name="designation"
              value={isEditing ? currentUser?.designation || "" : newUserData.designation}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Unit Section</InputLabel>
              <Select
                label="Unit Section"
                name="unit_section"
                value={isEditing ? currentUser?.unit_section || "" : newUserData.unit_section}
                onChange={isEditing ? handleUpdateInputChange : handleInputChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      width: '400px',
                      maxWidth: '400px',
                      overflow: 'hidden'
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  getContentAnchorEl: null,
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    "&:hover": {
                      borderColor: "#1976d2",
                    },
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                  },
                }}
              >
                <MenuItem value="" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>None</MenuItem>
                <MenuItem value="directorate of operations" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Directorate of Operations</MenuItem>
                <MenuItem value="directorate of assessment services" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Directorate of Assessment Services</MenuItem>
                <MenuItem value="directorate of finance, planning and investment" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Directorate of Finance, Planning and Investment</MenuItem>
                <MenuItem value="legal unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Legal Unit</MenuItem>
                <MenuItem value="ict unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>ICT Unit</MenuItem>
                <MenuItem value="actuarial statistics and risk management" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Actuarial Statistics and Risk Management</MenuItem>
                <MenuItem value="public relation unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Public Relation Unit</MenuItem>
                <MenuItem value="procurement management unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Procurement Management Unit</MenuItem>
                <MenuItem value="human resource management and attachment unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Human Resource Management and Attachment Unit</MenuItem>
                <MenuItem value="internal audit unit" sx={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '380px',
                  fontSize: '14px'
                }}>Internal Audit Unit</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                name="role"
                value={isEditing ? currentUser?.role || "admin" : newUserData.role}
                onChange={isEditing ? handleUpdateInputChange : handleInputChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      width: '400px',
                      maxWidth: '400px',
                      overflow: 'hidden'
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  getContentAnchorEl: null,
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    "&:hover": {
                      borderColor: "#1976d2",
                    },
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                  },
                }}
              >
                <MenuItem value="admin" sx={{ fontSize: '14px', maxWidth: '380px' }}>Admin</MenuItem>
                <MenuItem value="supervisor" sx={{ fontSize: '14px', maxWidth: '380px' }}>Supervisor</MenuItem>
                <MenuItem value="agent" sx={{ fontSize: '14px', maxWidth: '380px' }}>Agent</MenuItem>
                <MenuItem value="attendee" sx={{ fontSize: '14px', maxWidth: '380px' }}>Attendee</MenuItem>
                <MenuItem value="coordinator" sx={{ fontSize: '14px', maxWidth: '380px' }}>Reviewer</MenuItem>
                <MenuItem value="head-of-unit" sx={{ fontSize: '14px', maxWidth: '380px' }}>Head of Unit</MenuItem>
                <MenuItem value="manager" sx={{ fontSize: '14px', maxWidth: '380px' }}>Manager</MenuItem>
                <MenuItem value="director" sx={{ fontSize: '14px', maxWidth: '380px' }}>Director</MenuItem>
                <MenuItem value="director-general" sx={{ fontSize: '14px', maxWidth: '380px' }}>Direct General</MenuItem>
                <MenuItem value="focal-person" sx={{ fontSize: '14px', maxWidth: '380px' }}>Focal Person</MenuItem>
              </Select>
            </FormControl>
            
            {/* Extension field - always visible but with conditional logic */}
            <TextField
              label="Extension"
              fullWidth
              size="small"
              name="extension"
              type="number"
              value={isEditing ? currentUser?.extension || "" : newUserData.extension}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
              disabled={
                (isEditing ? currentUser?.role : newUserData.role) !== "agent" && 
                (isEditing ? currentUser?.role : newUserData.role) !== "attendee"
              }
              helperText={
                (isEditing ? currentUser?.role : newUserData.role) !== "agent" && 
                (isEditing ? currentUser?.role : newUserData.role) !== "attendee"
                  ? "Extension is only required for Agent or Attendee roles"
                  : ""
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1976d2",
                  },
                },
                "& .MuiInputBase-root.Mui-disabled": {
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                },
              }}
            />
            
            {/* Checkbox for isActive */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isEditing ? currentUser?.isActive || false : newUserData.isActive}
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
                  sx={{
                    color: "#1976d2",
                    "&.Mui-checked": {
                      color: "#1976d2",
                    },
                  }}
                />
              }
              label="Is Active"
              sx={{ mt: 1 }}
            />
            
            {/* Action Buttons */}
            <Box sx={{ 
              display: "flex", 
              gap: 2, 
              mt: 2,
              pt: 2,
              borderTop: "1px solid #e0e0e0"
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={isEditing ? handleUpdateUser : handleAddUser}
                sx={{
                  flex: 1,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  textTransform: "none",
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.4)",
                  },
                }}
              >
                {isEditing ? "Update User" : "Add User"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseModal}
                sx={{
                  flex: 1,
                  py: 1,
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  textTransform: "none",
                  borderColor: "#666",
                  color: "#666",
                  "&:hover": {
                    borderColor: "#333",
                    color: "#333",
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
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
            width: 400,
            borderRadius: "12px",
            bgcolor: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            p: 4,
            border: "1px solid #e0e0e0",
            textAlign: "center",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <FaRegQuestionCircle 
              style={{ 
                fontSize: 60, 
                color: "#ff6b6b",
                marginBottom: "16px"
              }} 
            />
            <h3 style={{ 
              margin: "0 0 8px 0", 
              color: "#333", 
              fontSize: "20px",
              fontWeight: "600"
            }}>
              Confirm Action
            </h3>
            <p style={{ 
              margin: 0, 
              color: "#666", 
              fontSize: "16px",
              lineHeight: "1.5"
            }}>
              Are you sure you want to {actionType} this user?
            </p>
          </Box>
          
          <Box sx={{ 
            display: "flex", 
            gap: 2,
            justifyContent: "center"
          }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirm}
              sx={{
                px: 3,
                py: 1.5,
                fontSize: "16px",
                fontWeight: "600",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.4)",
                },
              }}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowConfirmModal(false)}
              sx={{
                px: 3,
                py: 1.5,
                fontSize: "16px",
                fontWeight: "600",
                borderRadius: "8px",
                textTransform: "none",
                borderColor: "#666",
                color: "#666",
                "&:hover": {
                  borderColor: "#333",
                  color: "#333",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Cancel
            </Button>
          </Box>
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
}
