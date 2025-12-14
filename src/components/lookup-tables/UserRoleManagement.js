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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Person,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { baseURL } from "../../config";

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleOrder, setRoleOrder] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");

  const fetchUsersWithRoles = async () => {
    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/users-with-roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        throw new Error("Failed to fetch users with roles");
      }
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      setSnackbar({
        open: true,
        message: "Error fetching users with roles",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${baseURL}/lookup-tables/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      } else {
        throw new Error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
    fetchRoles();
  }, []);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      const userRoles = user.roles ? user.roles.map((role) => role.id) : [];
      setSelectedRoles(userRoles);
      setRoleOrder(userRoles);
    } else {
      setSelectedUser(null);
      setSelectedRoles([]);
      setRoleOrder([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedRoles([]);
    setRoleOrder([]);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/users/${selectedUser.id}/roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roleIds: roleOrder }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message || "Roles assigned successfully",
          severity: "success",
        });
        handleCloseDialog();
        fetchUsersWithRoles();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error assigning roles:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error assigning roles",
        severity: "error",
      });
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    try {
      const response = await fetch(
        `${baseURL}/lookup-tables/users/${userId}/roles/${roleId}`,
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
          message: data.message || "Role removed successfully",
          severity: "success",
        });
        fetchUsersWithRoles();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Remove failed");
      }
    } catch (error) {
      console.error("Error removing role:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error removing role",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const moveRoleUp = (index) => {
    if (index > 0) {
      const newOrder = [...roleOrder];
      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
      setRoleOrder(newOrder);
    }
  };

  const moveRoleDown = (index) => {
    if (index < roleOrder.length - 1) {
      const newOrder = [...roleOrder];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      setRoleOrder(newOrder);
    }
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
          User Role Management
        </Typography>
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
              <TableCell sx={{ width: "12%" }}>User ID</TableCell>
              <TableCell sx={{ width: "20%" }}>Full Name</TableCell>
              <TableCell sx={{ width: "25%" }}>Email</TableCell>
              <TableCell sx={{ width: "15%" }}>Primary Role</TableCell>
              <TableCell sx={{ width: "20%" }}>All Roles</TableCell>
              <TableCell sx={{ width: "8%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell sx={{ width: "12%" }}>{user.id}</TableCell>
                <TableCell sx={{ width: "20%" }}>{user.full_name}</TableCell>
                <TableCell sx={{ width: "25%" }}>{user.email}</TableCell>
                <TableCell sx={{ width: "15%" }}>
                  <Chip
                    label={user.role || "No primary role"}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: "20%" }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Chip
                          key={role.id}
                          label={role.name}
                          size="small"
                          color={
                            role.name === user.role ? "primary" : "default"
                          }
                          variant={
                            role.name === user.role ? "filled" : "outlined"
                          }
                          onDelete={() => handleRemoveRole(user.id, role.id)}
                          deleteIcon={<Delete />}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ width: "8%" }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Edit />
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
          {selectedUser
            ? `Manage Roles for ${selectedUser.full_name}`
            : "Manage User Roles"}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                User: {selectedUser.full_name} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Note: The first role in the list will be set as the user's
                primary role in the system.
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Roles</InputLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => {
                    setSelectedRoles(e.target.value);
                    setRoleOrder(e.target.value);
                  }}
                  input={<OutlinedInput label="Select Roles" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const role = roles.find((r) => r.id === value);
                        return role ? (
                          <Chip key={value} label={role.name} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {roleOrder.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Role Order (First role will be primary):
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {roleOrder.map((roleId, index) => {
                      const role = roles.find((r) => r.id === roleId);
                      return role ? (
                        <Box
                          key={roleId}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1,
                            border: "1px solid #ddd",
                            borderRadius: 1,
                            backgroundColor:
                              index === 0 ? "#e3f2fd" : "transparent",
                          }}
                        >
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {index + 1}. {role.name}
                            {index === 0 && (
                              <Chip
                                label="Primary"
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => moveRoleUp(index)}
                            disabled={index === 0}
                          >
                            <KeyboardArrowUp />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => moveRoleDown(index)}
                            disabled={index === roleOrder.length - 1}
                          >
                            <KeyboardArrowDown />
                          </IconButton>
                        </Box>
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!selectedUser}
          >
            Update Roles
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

export default UserRoleManagement;
