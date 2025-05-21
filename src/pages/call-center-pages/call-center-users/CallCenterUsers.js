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
  const [usersPerPage] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    extension: "",
    role: "admin",
    isActive: false,
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
      const response = await fetch(`${baseURL}/users/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        throw new Error("Failed to create user");
      }
      setShowModal(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        extension: "",
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
    try {
      const response = await fetch(`${baseURL}/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(currentUser),
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
    setNewUserData({
      name: "",
      email: "",
      password: "",
      extension: "",
      role: "admin",
      isActive: false,
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
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
          placeholder="Search by name..."
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
              extension: "",
              role: "admin",
              isActive: false,
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
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
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="agent">Agent</MenuItem>
              <MenuItem value="attendee">Attendee</MenuItem>
              <MenuItem value="coordinator">Coordinator</MenuItem>
              <MenuItem value="head-of-unit">Head of Unit</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="director-general">Direct General</MenuItem>
              <MenuItem value="focal-person">Focal Person</MenuItem>
            </Select>
          </FormControl>
          {/* add extension if role is agent */}
          {(newUserData.role === "agent" ||
            (currentUser && currentUser.role === "agent")) && (
            <TextField
              label="Extension"
              fullWidth
              margin="normal"
              name="extension"
              value={isEditing ? currentUser.extension : newUserData.extension}
              onChange={isEditing ? handleUpdateInputChange : handleInputChange}
            />
          )}
          {/* Checkbox for isActive */}
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
}
