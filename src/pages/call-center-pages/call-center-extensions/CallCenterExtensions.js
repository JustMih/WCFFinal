import React, { useEffect, useState } from "react";
import "./callCenterExtensions.css"; // External CSS file for styling
import { FaPlus } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { MdDeleteForever } from "react-icons/md";
import { HiMiniLockClosed, HiMiniLockOpen } from "react-icons/hi2";
import { baseURL } from "../../../config";
import {
  Tooltip,
  TextField,
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const CallCenterExtensions = () => {
  const [usersWithExtensions, setUsersWithExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newExtension, setNewExtension] = useState({
    userId: "",
    id_alias: "",
    aors: "",
    auth: "",
    isActive: false,
  });
  const [currentExtension, setCurrentExtension] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    fetchUsersWithExtensions();
  }, []);

  // Fetch users and filter those with non-null extension
  const fetchUsersWithExtensions = async () => {
    try {
      const response = await fetch(`${baseURL}/users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      // Filter users with non-null extension
      const filtered = Array.isArray(data)
        ? data.filter((user) => user.extension)
        : [];
        console.log("extension", filtered);
      setUsersWithExtensions(filtered);
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setNewExtension({
      userId: "",
      id_alias: "",
      aors: "",
      auth: "",
      isActive: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditing) {
      setCurrentExtension({ ...currentExtension, [name]: value });
    } else {
      setNewExtension({ ...newExtension, [name]: value });
    }
  };

  const handleUserSelect = (e) => {
    const selectedUserId = e.target.value;
    if (isEditing) {
      setCurrentExtension({ ...currentExtension, userId: selectedUserId });
    } else {
      setNewExtension({ ...newExtension, userId: selectedUserId });
    }
  };

  const handleAddExtension = async () => {
    try {
      const requestBody = {
        userId: newExtension.userId,
        id_alias: newExtension.id_alias,
        transport: "transport-udp",
        aors: newExtension.id_alias, // Assign id_alias to aors
        auth: newExtension.id_alias, // Assign id_alias to auth
        context: "default",
        disallow: "all",
        allow: "ulaw,alaw",
        dtmf_mode: "rfc4733",
        callerid: newExtension.id_alias,
        direct_media: "no",
        force_rport: "yes",
        rewrite_contact: "no",
        isActive: newExtension.isActive,
      };

      const response = await fetch(`${baseURL}/extensions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to add extension");

      const data = await response.json();
      setUsersWithExtensions([...usersWithExtensions, data.extension]);
      handleCloseModal();
      fetchUsersWithExtensions(); // Refresh users with extensions list
      showSnackbar("Extension added successfully!", "success");
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to add extension", "error");
    }
  };

  const handleUpdateExtension = async () => {
    try {
      const requestBody = {
        userId: currentExtension.userId,
        id_alias: currentExtension.id_alias,
        transport: "transport-udp",
        aors: currentExtension.id_alias, // Assign id_alias to aors
        auth: currentExtension.id_alias, // Assign id_alias to auth
        context: "default",
        disallow: "all",
        allow: "ulaw,alaw",
        dtmf_mode: "rfc4733",
        callerid: currentExtension.id_alias,
        direct_media: "no",
        force_rport: "yes",
        rewrite_contact: "no",
        isActive: currentExtension.isActive,
      };

      const response = await fetch(
        `${baseURL}/extensions/${currentExtension.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) throw new Error("Failed to update extension");

      const data = await response.json();
      setUsersWithExtensions(
        usersWithExtensions.map((user) =>
          user.id === currentExtension.id ? data.extension : user
        )
      );
      handleCloseModal();
      fetchUsersWithExtensions(); // Refresh users with extensions list
      showSnackbar("Extension updated successfully!", "success");
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to update extension", "error");
    }
  };

  const handleDeleteExtension = async (id) => {
    if (!window.confirm("Are you sure you want to delete this extension?"))
      return;

    try {
      const response = await fetch(`${baseURL}/extensions/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete extension");

      setUsersWithExtensions(usersWithExtensions.filter((user) => user.id !== id));
      showSnackbar("Extension deleted successfully!", "success");
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to delete extension", "error");
    }
  };

  const handleActivateExtension = async (id) => {
    try {
      const response = await fetch(`${baseURL}/extensions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isActive: true }), // Activate extension
      });

      if (!response.ok) throw new Error("Failed to activate extension");

      setUsersWithExtensions(
        usersWithExtensions.map((user) =>
          user.id === id ? { ...user, isActive: true } : user
        )
      );
      showSnackbar("Extension Activated!", "success");
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to activate extension", "error");
    }
  };

  const handleDeactivateExtension = async (id) => {
    try {
      const response = await fetch(`${baseURL}/extensions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isActive: false }), // Deactivate extension
      });

      if (!response.ok) throw new Error("Failed to deactivate extension");

      setUsersWithExtensions(
        usersWithExtensions.map((user) =>
          user.id === id ? { ...user, isActive: false } : user
        )
      );
      showSnackbar("Extension Deactivated!", "warning");
    } catch (error) {
      console.error("Error:", error);
      showSnackbar("Failed to deactivate extension", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <div className="call-center-extension-table-container">
      <h2 className="call-center-extension-table-title">
        Call Center Extensions
      </h2>
      <div className="call-center-extension-controls">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by Agent Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="call-center-extension-search-input"
        />

        {/* <button
          className="call-center-extension-add-extension-button"
          onClick={() => {
            setShowModal(true);
            setIsEditing(false);
          }}
        >
          <FaPlus /> Add Extension
        </button> */}
      </div>

      {/* Extension Table */}
      <TableContainer component={Paper}>
        <Table className="call-center-extension-table">
          <TableHead>
            <TableRow>
              <TableCell>Extension Number</TableCell>
              <TableCell>Agent Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              {/* <TableCell>Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {usersWithExtensions
              .filter((user) =>
                user.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.extension}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  {/* <TableCell className="call-center-extension-action-buttons">
                    <Tooltip title="Edit Extension">
                      <button
                        className="call-center-extension-edit-button"
                        onClick={() => {
                          setCurrentExtension(user);
                          setShowModal(true);
                          setIsEditing(true);
                        }}
                      >
                        <AiFillEdit />
                      </button>
                    </Tooltip>
                    <Tooltip title={"Activate"}>
                      <button
                        className="call-center-extension-activated-button"
                        onClick={() => handleActivateExtension(user.id)}
                      >
                        <HiMiniLockOpen color="white" />
                      </button>
                    </Tooltip>
                    <Tooltip title={"De-Activate"}>
                      <button
                        className="call-center-extension-deactivated-button"
                        onClick={() => handleDeactivateExtension(user.id)}
                      >
                        <HiMiniLockClosed color="white" />
                      </button>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <button
                        className="call-center-extension-delete-button"
                        onClick={() => handleDeleteExtension(user.id)}
                      >
                        <MdDeleteForever color="white" />
                      </button>
                    </Tooltip>
                  </TableCell> */}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Update Modal */}
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
          <h2>{isEditing ? "Edit Extension" : "Add Extension"}</h2>
          <FormControl fullWidth margin="normal">
            <InputLabel>User</InputLabel>
            <Select
              value={isEditing ? currentExtension.userId : newExtension.userId}
              onChange={handleUserSelect}
            >
              {usersWithExtensions.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Extension Number"
            fullWidth
            margin="normal"
            name="id_alias"
            value={
              isEditing ? currentExtension.id_alias : newExtension.id_alias
            }
            onChange={handleInputChange}
          />
          <div className="call-center-extension-modal-action-button">
            <Button
              variant="contained"
              color="primary"
              onClick={isEditing ? handleUpdateExtension : handleAddExtension}
            >
              {isEditing ? "Update Extension" : "Add Extension"}
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

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000} // Hide after 3 seconds
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CallCenterExtensions;
