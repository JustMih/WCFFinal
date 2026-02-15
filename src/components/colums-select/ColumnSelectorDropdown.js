import React, { useState, useEffect } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  Typography,
  Button,
  Divider
} from "@mui/material";
import { FiSettings } from "react-icons/fi";

const exportableColumns = [
  { key: "id", label: "#" },
  { key: "fullName", label: "Full Name" },
  { key: "phone_number", label: "Phone" },
  { key: "nida_number", label: "NIDA" },
  { key: "employer", label: "Employer" },
  { key: "region", label: "Region" },
  { key: "district", label: "District" },
  { key: "subject", label: "Subject" },
  { key: "category", label: "Category" },
  { key: "section", label: "Section" },
  { key: "sub_section", label: "Sub-section" },
  { key: "channel", label: "Channel" },
  { key: "description", label: "Description" },
  { key: "complaint_type", label: "Complaint Type" },
  { key: "converted_to", label: "Converted To" },
  { key: "assigned_to_role", label: "Assigned Role" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created At" },
  { key: "date_of_resolution", label: "Date of Resolution" },
  { key: "date_of_feedback", label: "Date of Feedback" },
  { key: "date_of_review_resolution", label: "Review Date" },
  { key: "resolution_details", label: "Resolution Details" },
  { key: "aging_days", label: "Aging (Days)" },
  { key: "createdBy.name", label: "Created By" },
  { key: "assignedTo.name", label: "Assigned To" },
  { key: "attendedBy.name", label: "Attended By" },
  { key: "ratedBy.name", label: "Rated By" },
  { key: "functionData.name", label: "Function Name" }
];

const defaultColumns = ["id", "fullName", "phone_number", "status"];

export default function ColumnSelectorDropdown({ 
  selectedColumns = defaultColumns, 
  onColumnsChange,
  size = "small"
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (event) => {
    const value = event.target.value;
    onColumnsChange(value);
  };

  const handleSelectAll = () => {
    const allKeys = exportableColumns.map(col => col.key);
    onColumnsChange(allKeys);
  };

  const handleDeselectAll = () => {
    onColumnsChange([]);
  };

  const getSelectedLabels = () => {
    return selectedColumns.map(key => 
      exportableColumns.find(col => col.key === key)?.label || key
    );
  };

  const renderValue = (selected) => {
    if (selected.length === 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FiSettings size={16} />
          <Typography variant="body2" color="text.secondary">
            Select Columns
          </Typography>
        </Box>
      );
    }

    if (selected.length <= 2) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {getSelectedLabels().map((label, index) => (
            <Chip
              key={index}
              label={label}
              size="small"
              sx={{ height: "20px", fontSize: "11px" }}
            />
          ))}
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={`${selected.length} columns`}
          size="small"
          sx={{ height: "20px", fontSize: "11px" }}
        />
      </Box>
    );
  };

  return (
    <FormControl size={size} sx={{ minWidth: 200 }}>
      <Select
        multiple
        value={selectedColumns}
        onChange={handleChange}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderValue={renderValue}
        displayEmpty
        sx={{
          "& .MuiSelect-select": {
            padding: "6px 12px",
            minHeight: "32px !important"
          }
        }}
      >
        <MenuItem sx={{ py: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Select Columns
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                sx={{ fontSize: "11px", minWidth: "auto", p: "2px 6px" }}
              >
                All
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeselectAll();
                }}
                sx={{ fontSize: "11px", minWidth: "auto", p: "2px 6px" }}
              >
                None
              </Button>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        {exportableColumns.map((column) => (
          <MenuItem key={column.key} value={column.key} dense>
            <Checkbox
              checked={selectedColumns.indexOf(column.key) > -1}
              size="small"
            />
            <ListItemText 
              primary={column.label}
              primaryTypographyProps={{ fontSize: "13px" }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
} 