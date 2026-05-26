import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { FaRegQuestionCircle } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { MdDeleteForever } from "react-icons/md";
import { baseURL } from "../../../config";
import "./callCenterIvrActions.css";
import {
  Tooltip,
  TextField,
  Snackbar,
  Alert,
  Modal,
  Box,
  Button,
} from "@mui/material";

export default function CallCenterIvrActions() {
  const [ivrActions, setIvrActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ivrActionPerPage] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ivrActionData, setIvrActionData] = useState({ name: "" });
  const [currentIVRAction, setCurrentIVRAction] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ivrActionIdForAction, setIVRActionIdForAction] = useState(null);

  const fetchIVRActions = async () => {
    try {
      const response = await fetch(`${baseURL}/ivr-actions/`);
      const data = await response.json();
      setIvrActions(data.ivrAction);
    } catch (error) {
      console.error("Failed to fetch IVR actions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIVRActions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIvrActionData({ ...ivrActionData, [name]: value });
  };

const handleAddIVRAction = async () => {
  if (!ivrActionData.name.trim()) {
    setSnackbarMessage("IVR action name is required.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  try {
    const response = await fetch(`${baseURL}/ivr-actions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // ✅ Send ONLY the name
      body: JSON.stringify({ name: ivrActionData.name }),
    });

    if (!response.ok) throw new Error("Failed to create IVR action");

    setShowModal(false);
    setIvrActionData({ name: "" });
    fetchIVRActions();
    setSnackbarMessage("IVR action added successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (error) {
    console.error("Error creating IVR action:", error);
    setSnackbarMessage("Error creating IVR action.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};



  const handleUpdateIVRAction = async () => {
    try {
      const response = await fetch(
        `${baseURL}/ivr-actions/${currentIVRAction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentIVRAction),
        }
      );
      if (!response.ok) throw new Error("Failed to update IVR action");
      setShowModal(false);
      setIsEditing(false);
      fetchIVRActions();
      setSnackbarMessage("IVR action updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Error updating IVR action.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteIVRAction = async () => {
    try {
      const response = await fetch(
        `${baseURL}/ivr-actions/${ivrActionIdForAction}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete IVR action");
      fetchIVRActions();
      setSnackbarMessage("IVR action deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Error deleting IVR action.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleEdit = (ivrAction) => {
    setCurrentIVRAction(ivrAction);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentIVRAction(null);
    setIvrActionData({ name: "" });
  };

  const filteredIVRActions = ivrActions.filter((action) =>
    action.name.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLast = currentPage * ivrActionPerPage;
  const indexOfFirst = indexOfLast - ivrActionPerPage;
  const currentIVRActions = filteredIVRActions.slice(indexOfFirst, indexOfLast);

  return (
    <div className="user-table-container">
      <h2 className="table-title">IVR Actions Management</h2>
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
            setIvrActionData({ name: "" });
          }}
        >
          <FaPlus /> Add Action
        </button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>SN</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentIVRActions.map((action, index) => (
            <tr key={action.id}>
              <td>{index + 1}</td>
              <td>{action.name}</td>
              <td className="action-buttons">
                <Tooltip title="Edit">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(action)}
                  >
                    <AiFillEdit />
                  </button>
                </Tooltip>
                <Tooltip title="Delete">
                  <button
                    className="delete-button"
                    onClick={() => {
                      setIVRActionIdForAction(action.id);
                      setShowConfirmModal(true);
                    }}
                  >
                    <MdDeleteForever />
                  </button>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredIVRActions.length / ivrActionPerPage) },
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
          <h2>{isEditing ? "Edit IVR Action" : "Add IVR Action"}</h2>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            name="name"
            value={isEditing ? currentIVRAction.name : ivrActionData.name}
            onChange={
              isEditing
                ? (e) =>
                    setCurrentIVRAction({
                      ...currentIVRAction,
                      name: e.target.value,
                    })
                : handleInputChange
            }
          />
          <div className="modal-action-button">
            <Button
              variant="contained"
              color="primary"
              onClick={isEditing ? handleUpdateIVRAction : handleAddIVRAction}
            >
              {isEditing ? "Update" : "Add"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseModal}
              sx={{ ml: 2 }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "white",
            p: 4,
            borderRadius: "10px",
            boxShadow: 24,
            textAlign: "center",
          }}
        >
          <FaRegQuestionCircle style={{ fontSize: 40, color: "red" }} />
          <p>Are you sure you want to delete this IVR action?</p>
          <div className="user-modal-action-buttons">
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteIVRAction}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowConfirmModal(false)}
              sx={{ ml: 2 }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
