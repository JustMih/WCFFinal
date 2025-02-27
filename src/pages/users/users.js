import React, { useEffect, useState } from "react";
import "./users.css"; // External CSS file for styling
import { FaArrowRight, FaPlus } from "react-icons/fa";
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
  });
  const [currentUser, setCurrentUser] = useState(null); // For editing a user
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

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

  const handleActivateUser = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/users/${userId}/activate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to activate user");
      }
      fetchUsers();
      setSnackbarMessage("User Activated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error Activated user.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/users/${userId}/deactivate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to deactivate user");
      }
      fetchUsers();
      setSnackbarMessage("User De-activated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error De-activated user.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await fetch(
        `${baseURL}/users/${userId}/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to reset password");
      }
      fetchUsers();
      setSnackbarMessage("User Reset Password successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error Reset Password user.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      fetchUsers();
    } catch (error) {
      setError(error.message);
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
                    onClick={() => handleActivateUser(user.id)}
                  >
                    <HiMiniLockOpen />
                  </button>
                </Tooltip>
                <Tooltip title="Deactivate User">
                  <button
                    className="deactivated-button"
                    onClick={() => handleDeactivateUser(user.id)}
                  >
                    <HiMiniLockClosed />
                  </button>
                </Tooltip>
                <Tooltip title="Reset User Password">
                  <button
                    className="reset-button"
                    onClick={() => handleResetPassword(user.id)}
                  >
                    <RxReset />
                  </button>
                </Tooltip>
                <Tooltip title="Delete User">
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteUser(user.id)}
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

      {/* Add User Modal */}
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
            </Select>
          </FormControl>
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
