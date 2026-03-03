import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { baseURL } from "../../config";

// Helper function to format dates consistently
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "N/A";
  }
};

const DesignationManagement = () => {
  const [designations, setDesignations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");

  const fetchDesignations = async () => {
    try {
      const response = await fetch(`${baseURL}/lookup-tables/designations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDesignations(data.data || []);
      } else {
        throw new Error("Failed to fetch designations");
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
      setSnackbar({
        open: true,
        message: "Error fetching designations",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleOpenDialog = (designation = null) => {
    if (designation) {
      setEditingDesignation(designation);
      setFormData({
        name: designation.name,
        description: designation.description || "",
      });
    } else {
      setEditingDesignation(null);
      setFormData({ name: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDesignation(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      const url = editingDesignation
        ? `${baseURL}/lookup-tables/designations/${editingDesignation.id}`
        : `${baseURL}/lookup-tables/designations`;

      const method = editingDesignation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message || "Operation successful",
          severity: "success",
        });
        handleCloseDialog();
        fetchDesignations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving designation:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error saving designation",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this designation?")) {
      return;
    }

    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/designations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message || "Designation deleted successfully",
          severity: "success",
        });
        fetchDesignations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting designation:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error deleting designation",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Designation Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add New Designation
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        <Table sx={{ width: "100%", minWidth: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "8%" }}>ID</TableCell>
              <TableCell sx={{ width: "25%" }}>Name</TableCell>
              <TableCell sx={{ width: "40%" }}>Description</TableCell>
              <TableCell sx={{ width: "15%" }}>Created At</TableCell>
              <TableCell sx={{ width: "12%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {designations.map((designation) => (
              <TableRow key={designation.id}>
                <TableCell sx={{ width: "8%" }}>{designation.id}</TableCell>
                <TableCell sx={{ width: "25%" }}>{designation.name}</TableCell>
                <TableCell sx={{ width: "40%", wordWrap: "break-word" }}>
                  {designation.description || "-"}
                </TableCell>
                <TableCell sx={{ width: "15%" }}>
                  {formatDate(designation.createdAt)}
                </TableCell>
                <TableCell sx={{ width: "12%" }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(designation)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(designation.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDesignation ? "Edit Designation" : "Add New Designation"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDesignation ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DesignationManagement;
