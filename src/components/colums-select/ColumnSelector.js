import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const exportableColumns = [
  { key: "id", label: "#" }, // Row number, not UUID
  { key: "fullName", label: "Full Name" }, // composed from first_name, middle_name, last_name
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
  { key: "functionData.name", label: "Function Name" } // if functionData has a name
];


const defaultColumns = ["id", "fullName", "phone_number", "status"];

export default function ColumnSelector({ open, onClose, data, onColumnsChange }) {
  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);

  // Update parent whenever selectedColumns changes
  useEffect(() => {
    onColumnsChange(selectedColumns);
  }, [selectedColumns, onColumnsChange]);

  const toggleSelectAll = () => {
    const optionalKeys = exportableColumns.map((col) => col.key);
    setSelectedColumns(selectedColumns.length === optionalKeys.length ? [] : optionalKeys);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
  
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };
  

  const exportToCSV = () => {
    // Use only the filtered tickets (data prop)
    const csvData = data.map((ticket, index) => {
      const row = {};
      selectedColumns.forEach((col) => {
        let value;
        if (col === "created_at" || col === "createdAt") {
          value = formatDate(ticket.created_at || ticket.createdAt);
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
          value = `${ticket.first_name || ticket.firstName || ""} ${ticket.middle_name || ticket.middleName || ""} ${ticket.last_name || ticket.lastName || ""}`.trim();
        } else {
          value = ticket[col] || "N/A";
        }
        // Wrap long numbers as text for Excel
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
    // Use only the filtered tickets (data prop)
    const doc = new jsPDF({
      orientation: selectedColumns.length > 5 ? "landscape" : "portrait",
    });
    doc.text("Tickets Report", 40, 30);
    const headers = [selectedColumns.map((col) => exportableColumns.find((c) => c.key === col)?.label || col)];
    const dataRows = data.map((ticket, index) =>
      selectedColumns.map((col) => {
        if (col === "createdBy.name") return ticket.createdBy?.name || "N/A";
        if (col === "assignedTo.name") return ticket.assignedTo?.name || "N/A";
        if (col === "attendedBy.name") return ticket.attendedBy?.name || "N/A";
        if (col === "ratedBy.name") return ticket.ratedBy?.name || "N/A";
        if (col === "functionData.name") return ticket.functionData?.name || "N/A";
        if (col === "id") return index + 1;
        if (col === "fullName") return `${ticket.first_name || ticket.firstName || ""} ${ticket.middle_name || ticket.middleName || ""} ${ticket.last_name || ticket.lastName || ""}`.trim();
        if (col === "created_at" || col === "createdAt") return formatDate(ticket.created_at || ticket.createdAt);
        return ticket[col] || "N/A";
      })
    );
    autoTable(doc, {
      startY: 40,
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
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Column Selection & Export
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
                    prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key]
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
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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