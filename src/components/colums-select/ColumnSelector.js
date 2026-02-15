import React, { useState } from 'react';
import { Modal, Box, Typography, Checkbox, ListItemText, Button, Divider } from '@mui/material';
import { FiSettings, FiDownload, FiFileText } from "react-icons/fi";

const ColumnSelector = ({
  open,
  onClose,
  columns,
  selectedColumns,
  onColumnsChange,
  onExportPDF,
  onExportCSV,
  tableData = [],
  tableTitle = "Table Data"
}) => {
  const handleSelectAll = () => {
    const allKeys = columns.map(col => col.key);
    onColumnsChange(allKeys);
  };

  const handleDeselectAll = () => {
    onColumnsChange([]);
  };

  const handleColumnToggle = (columnKey) => {
    const newColumns = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(col => col !== columnKey)
      : [...selectedColumns, columnKey];
    onColumnsChange(newColumns);
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF(selectedColumns);
    }
    onClose();
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV(selectedColumns);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="column-selector-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          maxHeight: "80vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          overflowY: "auto"
        }}
      >
        <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: "bold" }}>
          Columns Settings and Export
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
            sx={{ fontSize: "12px" }}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDeselectAll}
            sx={{ fontSize: "12px" }}
          >
            Deselect All
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 3 }}>
          {columns.map((column) => (
            <Box
              key={column.key}
              sx={{
                display: "flex",
                alignItems: "center",
                py: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "#f5f5f5" }
              }}
              onClick={() => handleColumnToggle(column.key)}
            >
              <Checkbox
                checked={selectedColumns.includes(column.key)}
                size="small"
              />
              <ListItemText
                primary={column.label}
                primaryTypographyProps={{ fontSize: "14px" }}
              />
            </Box>
          ))}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Selected: {selectedColumns.length} columns
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FiFileText />}
              onClick={handleExportPDF}
              size="small"
              sx={{ fontSize: "12px" }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<FiDownload />}
              onClick={handleExportCSV}
              size="small"
              sx={{ fontSize: "12px" }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              size="small"
            >
              Close
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ColumnSelector; 