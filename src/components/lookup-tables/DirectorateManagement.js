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

const DirectorateManagement = () => {
  const [directorates, setDirectorates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDirectorate, setEditingDirectorate] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");

  const fetchDirectorates = async () => {
    try {
      const response = await fetch(`${baseURL}/lookup-tables/directorates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDirectorates(data.data || []);
      } else {
        throw new Error("Failed to fetch directorates");
      }
    } catch (error) {
      console.error("Error fetching directorates:", error);
      setSnackbar({
        open: true,
        message: "Error fetching directorates",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectorates();
  }, []);

  const handleOpenDialog = (directorate = null) => {
    if (directorate) {
      setEditingDirectorate(directorate);
      setFormData({
        name: directorate.name,
        description: directorate.description || "",
      });
    } else {
      setEditingDirectorate(null);
      setFormData({ name: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDirectorate(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      const url = editingDirectorate
        ? `${baseURL}/lookup-tables/directorates/${editingDirectorate.id}`
        : `${baseURL}/lookup-tables/directorates`;

      const method = editingDirectorate ? "PUT" : "POST";

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
        fetchDirectorates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving directorate:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error saving directorate",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this directorate?")) {
      return;
    }

    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/directorates/${id}`,
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
          message: data.message || "Directorate deleted successfully",
          severity: "success",
        });
        fetchDirectorates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting directorate:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error deleting directorate",
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
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Directorates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add New Directorate
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {directorates.map((directorate) => (
              <TableRow key={directorate.id}>
                <TableCell>{directorate.id}</TableCell>
                <TableCell>{directorate.name}</TableCell>
                <TableCell>{directorate.description || "N/A"}</TableCell>
                <TableCell>{formatDate(directorate.createdAt)}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(directorate)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(directorate.id)}
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
          {editingDirectorate ? "Edit Directorate" : "Add New Directorate"}
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
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDirectorate ? "Update" : "Create"}
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

export default DirectorateManagement;
