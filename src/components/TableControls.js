import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Modal, Box, Typography, Checkbox, ListItemText, Button, Divider } from '@mui/material';
import { FiSettings, FiDownload, FiFileText } from "react-icons/fi";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TableControls = ({
  itemsPerPage,
  onItemsPerPageChange,
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  showAllOption = true,
  searchPlaceholder = "Search by name, phone, NIN",
  statusOptions = [
    { value: "", label: "All" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" }
  ],
  activeColumns: initialActiveColumns,
  onColumnsChange,
  onExportPDF,
  onExportCSV,
  tableData = [],
  tableTitle = "Table Data"
}) => {
  const defaultColumns = ["ticket_id", "fullName", "phone_number", "region", "status"];
  
  const [activeColumns, setActiveColumns] = useState(
    initialActiveColumns || defaultColumns
  );
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Update activeColumns when initialActiveColumns prop changes
  useEffect(() => {
    if (initialActiveColumns) {
      setActiveColumns(initialActiveColumns);
    }
  }, [initialActiveColumns]);

  const exportableColumns = [
    { key: "id", label: "#" },
    { key: "ticket_id", label: "Ticket ID" },
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

  const handleColumnsChange = (selectedColumns) => {
    if (selectedColumns.length === 0) {
      setActiveColumns(defaultColumns);
      if (onColumnsChange) {
        onColumnsChange(defaultColumns);
      }
    } else {
      setActiveColumns(selectedColumns);
      if (onColumnsChange) {
        onColumnsChange(selectedColumns);
      }
    }
  };

  const handleSelectAll = () => {
    const allKeys = exportableColumns.map(col => col.key);
    handleColumnsChange(allKeys);
  };

  const handleDeselectAll = () => {
    handleColumnsChange([]);
  };

  const handleColumnToggle = (columnKey) => {
    const newColumns = activeColumns.includes(columnKey)
      ? activeColumns.filter(col => col !== columnKey)
      : [...activeColumns, columnKey];
    handleColumnsChange(newColumns);
  };

  // Export utility functions
  const getColumnValue = (item, columnKey) => {
    if (columnKey.includes('.')) {
      const keys = columnKey.split('.');
      let value = item;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      return value || '';
    }
    
    // Handle fullName specially - construct from individual name fields
    if (columnKey === 'fullName') {
      if (item.first_name && item.first_name.trim() !== "") {
        return `${item.first_name} ${item.middle_name || ""} ${item.last_name || ""}`.trim();
      } else if (typeof item.institution === "string") {
        return item.institution;
      } else if (item.institution && typeof item.institution === "object" && typeof item.institution.name === "string") {
        return item.institution.name;
      } else {
        return "N/A";
      }
    }
    
    // Handle employer field - check both direct field and nested object
    if (columnKey === 'employer') {
      if (item.employer && typeof item.employer === "string") {
        return item.employer;
      } else if (item.employer && typeof item.employer === "object" && item.employer.name) {
        return item.employer.name;
      } else if (item.institution && typeof item.institution === "string") {
        return item.institution;
      } else if (item.institution && typeof item.institution === "object" && item.institution.name) {
        return item.institution.name;
      } else {
        return "N/A";
      }
    }
    
    return item[columnKey] || '';
  };

  const formatValue = (value, columnKey) => {
    if (value === null || value === undefined) return '';
    
    // Format ticket_id to show actual ticket ID
    if (columnKey === 'ticket_id') {
      return value.toString();
    }
    
    // Format IDs as sequential numbers (1, 2, 3...) - only for 'id' column
    if (columnKey === 'id') {
      // Find the index of this item in the tableData array
      const index = tableData.findIndex(item => item.id === value);
      return index !== -1 ? (index + 1).toString() : value.toString();
    }
    
    // Format phone numbers as text to prevent scientific notation
    if (columnKey === 'phone_number') {
      return String(value);
    }
    
    // Format NIDA numbers as text to prevent scientific notation
    if (columnKey === 'nida_number') {
      return String(value);
    }
    
    // Format dates
    if (columnKey.includes('created_at') || columnKey.includes('date_')) {
      if (value) {
        return new Date(value).toLocaleString();
      }
      return '';
    }
    
    // Handle nested name properties (createdBy.name, assignedTo.name, etc.)
    if (columnKey.includes('.name')) {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        if (value.name) return value.name;
        if (value.first_name) {
          return `${value.first_name} ${value.middle_name || ''} ${value.last_name || ''}`.trim();
        }
      }
      return '';
    }
    
    return String(value);
  };

  const exportToCSV = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = selectedColumns.map(col => 
      exportableColumns.find(ec => ec.key === col)?.label || col
    );

    const csvContent = [
      headers.join(','),
      ...tableData.map((item, index) => 
        selectedColumns.map(col => {
          const value = getColumnValue(item, col);
          const formattedValue = formatValue(value, col);
          
          // Add tab prefix to phone numbers and NIDA to force Excel to treat as text
          let finalValue = formattedValue;
          if (col === 'phone_number' || col === 'nida_number') {
            finalValue = `\t${formattedValue}`;
          }
          
          // Escape commas and quotes
          return `"${finalValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = selectedColumns.map(col => 
      exportableColumns.find(ec => ec.key === col)?.label || col
    );

    // Determine orientation based on number of columns
    const isLandscape = selectedColumns.length > 6;
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const pageWidth = isLandscape ? 297 : 210; // A4 dimensions in mm
    const pageHeight = isLandscape ? 210 : 297;

    // Create a hidden div for PDF generation
    const pdfDiv = document.createElement('div');
    pdfDiv.style.position = 'absolute';
    pdfDiv.style.left = '-9999px';
    pdfDiv.style.top = '-9999px';
    pdfDiv.style.width = isLandscape ? '1200px' : '800px';
    pdfDiv.style.backgroundColor = 'white';
    pdfDiv.style.padding = '20px';
    pdfDiv.style.fontFamily = 'Arial, sans-serif';
    pdfDiv.style.fontSize = '11px';

    // Create the table HTML
    const tableHTML = `
      <div style="text-align: center; margin-bottom: 15px; font-size: 16px; font-weight: bold; color: #2c3e50;">
        ${tableTitle}
      </div>
      <table style="border-collapse: collapse; width: 100%; font-size: 10px; margin: 0;">
        <thead>
          <tr>${headers.map(h => 
            `<th style="border: 1px solid #bdc3c7; padding: 5px; text-align: center; font-weight: bold; font-size: 11px; background: linear-gradient(135deg, #3498db, #2980b9); color: white;">${h}</th>`
          ).join('')}</tr>
        </thead>
        <tbody>
          ${tableData.map((item, index) => 
            `<tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
              ${selectedColumns.map(col => {
                const value = getColumnValue(item, col);
                const formattedValue = formatValue(value, col);
                return `<td style="border: 1px solid #bdc3c7; padding: 5px; text-align: left; word-wrap: break-word; max-width: ${isLandscape ? '120px' : '150px'};">${formattedValue}</td>`;
              }).join('')}
            </tr>`
          ).join('')}
        </tbody>
      </table>
    `;

    pdfDiv.innerHTML = tableHTML;
    document.body.appendChild(pdfDiv);

    // Generate PDF from the hidden div with optimized settings
    html2canvas(pdfDiv, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png', 0.8);
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const imgWidth = pageWidth - 30; // Account for margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Add table image to first page
      pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 30); // Account for margins only

      // Add subsequent pages
      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 30);
      }
      
      pdf.save(`${tableTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Clean up the hidden div
      document.body.removeChild(pdfDiv);
    }).catch(error => {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
      document.body.removeChild(pdfDiv);
    });
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF(activeColumns);
    } else {
      exportToPDF(activeColumns);
    }
    setIsColumnModalOpen(false);
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV(activeColumns);
    } else {
      exportToCSV(activeColumns);
    }
    setIsColumnModalOpen(false);
  };

  return (
    <div className="controls" style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      gap: "15px", 
      flexWrap: "wrap",
      marginBottom: "16px",
      padding: "12px 0"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Tooltip title="Columns Settings and Export" arrow>
          <IconButton 
            onClick={() => setIsColumnModalOpen(true)}
            style={{
              padding: "6px",
              height: "36px",
              width: "36px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "white"
            }}
          >
            <FiSettings size={20} />
          </IconButton>
        </Tooltip>
        <label style={{ marginRight: "8px", whiteSpace: "nowrap" }}>
          <strong>Show:</strong>
        </label>
        <select
          className="filter-select"
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "80px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1"
          }}
        >
          {[5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          {showAllOption && <option value="All">All</option>}
        </select>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          className="search-input"
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "200px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1",
            verticalAlign: "middle"
          }}
        />
        
        <select
          className="filter-select"
          value={filterStatus}
          onChange={onFilterStatusChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "120px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1"
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Column Selector Modal */}
      <Modal
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
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
            {exportableColumns.map((column) => (
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
                  checked={activeColumns.includes(column.key)}
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
              Selected: {activeColumns.length} columns
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
                onClick={() => setIsColumnModalOpen(false)}
                size="small"
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default TableControls; 