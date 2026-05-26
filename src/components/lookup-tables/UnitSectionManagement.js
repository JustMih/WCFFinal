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

const UnitSectionManagement = () => {
  const [unitSections, setUnitSections] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnitSection, setEditingUnitSection] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");

  const fetchUnitSections = async () => {
    try {
      const response = await fetch(`${baseURL}/lookup-tables/unit-sections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnitSections(data.data || []);
      } else {
        throw new Error("Failed to fetch unit sections");
      }
    } catch (error) {
      console.error("Error fetching unit sections:", error);
      setSnackbar({
        open: true,
        message: "Error fetching unit sections",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitSections();
  }, []);

  const handleOpenDialog = (unitSection = null) => {
    if (unitSection) {
      setEditingUnitSection(unitSection);
      setFormData({
        name: unitSection.name,
        description: unitSection.description || "",
      });
    } else {
      setEditingUnitSection(null);
      setFormData({ name: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUnitSection(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      const url = editingUnitSection
        ? `${baseURL}/lookup-tables/unit-sections/${editingUnitSection.id}`
        : `${baseURL}/lookup-tables/unit-sections`;

      const method = editingUnitSection ? "PUT" : "POST";

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
        fetchUnitSections();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving unit section:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error saving unit section",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit section?")) {
      return;
    }

    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/unit-sections/${id}`,
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
          message: data.message || "Unit section deleted successfully",
          severity: "success",
        });
        fetchUnitSections();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting unit section:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error deleting unit section",
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
          Unit Section Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add New Unit Section
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
            {unitSections.map((unitSection) => (
              <TableRow key={unitSection.id}>
                <TableCell sx={{ width: "8%" }}>{unitSection.id}</TableCell>
                <TableCell sx={{ width: "25%" }}>{unitSection.name}</TableCell>
                <TableCell sx={{ width: "40%", wordWrap: "break-word" }}>
                  {unitSection.description || "-"}
                </TableCell>
                <TableCell sx={{ width: "15%" }}>
                  {formatDate(unitSection.createdAt)}
                </TableCell>
                <TableCell sx={{ width: "12%" }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(unitSection)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(unitSection.id)}
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
          {editingUnitSection ? "Edit Unit Section" : "Add New Unit Section"}
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
            {editingUnitSection ? "Update" : "Create"}
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

export default UnitSectionManagement;
