import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import "./ColumnSelector.css"

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
  { key: "date_of_resolution", label: "Resolution Date" },
  { key: "date_of_feedback", label: "Feedback Date" },
  { key: "date_of_review_resolution", label: "Review Date" },
  { key: "resolution_details", label: "Resolution Details" },
  { key: "aging_days", label: "Aging (Days)" },
  { key: "createdBy.name", label: "Created By" },
  { key: "assignedTo.name", label: "Assigned To" },
  { key: "attendedBy.name", label: "Attended By" },
  { key: "ratedBy.name", label: "Rated By" },
  { key: "functionData.name", label: "Function   " },
];

const defaultColumns = ["id", "fullName", "phone_number", "status"];

export default function ColumnSelector({ open, onClose, data, onColumnsChange }) {
  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredData, setFilteredData] = useState(data);

  // Update parent whenever selectedColumns changes
  useEffect(() => {
    onColumnsChange(selectedColumns);
  }, [selectedColumns, onColumnsChange]);

  // Filter data based on date range whenever data, startDate, or endDate changes
  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((ticket) => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    setFilteredData(filtered);
  }, [data, startDate, endDate]);

  const toggleSelectAll = () => {
    const optionalKeys = exportableColumns.map((col) => col.key);
    setSelectedColumns(selectedColumns.length === optionalKeys.length ? [] : optionalKeys);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd-MMM-yyyy hh:mm a");
  };

  const exportToCSV = () => {
    const csvData = filteredData.map((ticket, index) => {
      const row = {};

      selectedColumns.forEach((col) => {
        let value;

        if (col === "created_at") {
          value = formatDate(ticket.created_at);
        } else if (col === "createdBy.name") {
          value = ticket.createdBy?.name || "N/A";
        } else if (col === "assignedTo.name") {
          value = ticket.assignedTo?.name || "N/A";
        } else if (col === "attendedBy.name") {
          value = ticket.attendedBy?.name || "N/A";
        } else if (col === "ratedBy.name") {
          value = ticket.ratedBy?.name || "N/A";
        } else if (col === "functionData.name") {
          value = ticket.functionData?.name || "N/A";
        } else if (col === "id") {
          value = index + 1;
        } else if (col === "fullName") {
          value = `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim();
        } else {
          value = ticket[col] || "N/A";
        }

        if (["nida_number", "phone_number"].includes(col)) {
          value = `="${value}"`;
        }

        const label = exportableColumns.find((c) => c.key === col)?.label || col;
        row[label] = value;
      });

      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tickets-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: selectedColumns.length > 5 ? "landscape" : "portrait",
    });

    doc.text("Tickets Report", 14, 10);

    if (startDate && endDate) {
      doc.setFontSize(10);
      doc.text(
        `Filtered: ${formatDate(startDate)} to ${formatDate(endDate)}`,
        14,
        20
      );
    }

    const headers = [selectedColumns.map((col) => exportableColumns.find((c) => c.key === col)?.label || col)];

    const dataRows = filteredData.map((ticket, index) =>
      selectedColumns.map((col) => {
        if (col === "createdBy.name") return ticket.createdBy?.name || "N/A";
        if (col === "assignedTo.name") return ticket.assignedTo?.name || "N/A";
        if (col === "attendedBy.name") return ticket.attendedBy?.name || "N/A";
        if (col === "ratedBy.name") return ticket.ratedBy?.name || "N/A";
        if (col === "functionData.name") return ticket.functionData?.name || "N/A";
        if (col === "id") return index + 1;
        if (col === "fullName") return `${ticket.first_name || ""} ${ticket.middle_name || ""} ${ticket.last_name || ""}`.trim();
        if (col === "created_at") return formatDate(ticket.created_at);
        return ticket[col] || "N/A";
      })
    );

    autoTable(doc, {
      startY: startDate && endDate ? 25 : 15,
      head: headers,
      body: dataRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save("tickets-report.pdf");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Column Selection & Export
        </Typography>

        {/* Date and Time Filter Section */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <DateTimePicker
              label="Start Date & Time"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{ width: { xs: "70%", sm: "150px" } }}
                />
              )}
            />
            <DateTimePicker
              label="End Date & Time"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{ width: { xs: "70%", sm: "150px" } }}
                />
              )}
              minDateTime={startDate} // Prevent selecting an end date before start date
            />
          </Box>
        </LocalizationProvider>

        {/* Column Selection Section */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Select Columns to Export
        </Typography>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
            justifyContent: "center",
          }}
        >
          {exportableColumns.map((col) => {
            const isSelected = selectedColumns.includes(col.key);
            return (
              <div
                key={col.key}
                onClick={() =>
                  setSelectedColumns((prev) =>
                    prev.includes(col.key)
                      ? prev.filter((k) => k !== col.key)
                      : [...prev, col.key]
                  )
                }
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "#1976d2" : "#e0e0e0",
                  color: isSelected ? "#fff" : "#333",
                  fontWeight: 500,
                  fontSize: "13px",
                  minWidth: "100px",
                  textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                }}
              >
                {col.label}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" size="small" onClick={toggleSelectAll}>
            {selectedColumns.length === exportableColumns.length ? "Deselect All" : "Select All"}
          </Button>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" color="primary" size="small" onClick={exportToPDF}>
              Export PDF
            </Button>
            <Button variant="outlined" color="primary" size="small" onClick={exportToCSV}>
              Export CSV
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}