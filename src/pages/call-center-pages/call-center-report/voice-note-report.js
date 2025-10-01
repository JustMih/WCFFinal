import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";
import {
  Snackbar,
  Alert,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function VoiceNoteReport() {
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playedFilter, setPlayedFilter] = useState("all");
  const [disposition, setDisposition] = useState("all");

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = "";
      if (activeTab === 0) {
        // Voice Note Report
        endpoint = `${baseURL}/reports/voice-note-report/${startDate}/${endDate}`;
      } else {
        // CDR Report
        endpoint = `${baseURL}/reports/cdr-report/${startDate}/${endDate}/${disposition}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${activeTab === 0 ? "voice note" : "CDR"} reports`
        );
      }
      const data = await response.json();
      setReports(data);
    } catch (error) {
      setError(error.message);
      setSnackbarMessage("Error loading reports.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Remove automatic fetch on mount since no default dates
  // useEffect(() => {
  //   fetchReports();
  //   // eslint-disable-next-line
  // }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Filter by search and filters based on active tab
  const filteredReports = reports.filter((report) => {
    const matchesSearch = (report.clid || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    if (activeTab === 0) {
      // Voice Note Report filtering
      const matchesPlayedFilter =
        playedFilter === "all" ||
        (playedFilter === "played" && report.is_played) ||
        (playedFilter === "not_played" && !report.is_played);
      return matchesSearch && matchesPlayedFilter;
    } else {
      // CDR Report filtering - disposition is already filtered by API
      return matchesSearch;
    }
  });

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // PDF Export Function
  const handleExportPDF = () => {
    const doc = new jsPDF();

    if (activeTab === 0) {
      // Voice Note Report PDF
      doc.text("Voice Note Report", 14, 14);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
      if (playedFilter !== "all") {
        doc.text(
          `Played Status: ${
            playedFilter === "played" ? "Played" : "Not Played"
          }`,
          14,
          26
        );
      }

      autoTable(doc, {
        startY: 32,
        head: [
          [
            "Sn",
            "Phone",
            "Date",
            "Played",
            "Assigned Agent",
            "Duration (s)",
            "Transcription",
          ],
        ],
        body: filteredReports.map((report, idx) => [
          idx + 1,
          report.clid || "-",
          report.created_at
            ? new Date(report.created_at).toLocaleString()
            : "-",
          report.is_played ? "Yes" : "No",
          report.assigned_agent_id || "-",
          report.duration_seconds || "-",
          report.transcription || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
      });
      doc.save(
        `voice_note_report_${startDate}_to_${endDate}_${playedFilter}.pdf`
      );
    } else {
      // CDR Report PDF
      doc.text("CDR Report", 14, 14);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
      if (disposition !== "all") {
        doc.text(`Disposition: ${disposition}`, 14, 26);
      }

      autoTable(doc, {
        startY: 32,
        head: [
          [
            "Sn",
            "Caller ID",
            "Source",
            "Destination",
            "Start Time",
            "Duration (s)",
            "Billed (s)",
            "Disposition",
            "Recording File",
          ],
        ],
        body: filteredReports.map((report, idx) => [
          idx + 1,
          report.clid || "-",
          report.src || "-",
          report.dst || "-",
          report.cdrstarttime
            ? new Date(report.cdrstarttime).toLocaleString()
            : "-",
          report.duration || "-",
          report.billsec || "-",
          report.disposition || "-",
          report.recordingfile || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
      });
      doc.save(`cdr_report_${startDate}_to_${endDate}_${disposition}.pdf`);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setReports([]);
    setCurrentPage(1);
    setSearch("");
  };

  return (
    <div className="user-table-container">
      <h2 className="table-title">Call Center Reports</h2>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Voice Note Report" />
          <Tab label="CDR Report" />
        </Tabs>
      </Box>

      <div className="controls" style={{ gap: 8 }}>
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          size="small"
        />
        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          size="small"
        />
        {activeTab === 0 ? (
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>Played Status</InputLabel>
            <Select
              value={playedFilter}
              label="Played Status"
              onChange={(e) => setPlayedFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="played">Played</MenuItem>
              <MenuItem value="not_played">Not Played</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>Disposition</InputLabel>
            <Select
              value={disposition}
              label="Disposition"
              onChange={(e) => setDisposition(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="ANSWERED">Answered</MenuItem>
              <MenuItem value="NO ANSWER">No Answer</MenuItem>
              <MenuItem value="BUSY">Busy</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (!startDate || !endDate) {
              setSnackbarMessage("Please select both start and end dates.");
              setSnackbarSeverity("warning");
              setSnackbarOpen(true);
              return;
            }
            setCurrentPage(1);
            fetchReports();
          }}
          disabled={!startDate || !endDate}
        >
          Load Report
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleExportPDF}
          disabled={filteredReports.length === 0}
        >
          Export PDF
        </Button>
        <input
          type="text"
          placeholder={
            activeTab === 0
              ? "Search by phone..."
              : "Search by caller ID or destination..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ marginLeft: 8 }}
        />
      </div>
      {activeTab === 0 ? (
        // Voice Note Report Table
        <table className="user-table">
          <thead>
            <tr>
              <th>Sn</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Audio</th>
              <th>Played</th>
              <th>Assigned Agent</th>
              <th>Duration (s)</th>
              <th>Transcription</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading...</td>
              </tr>
            ) : currentReports.length === 0 ? (
              <tr>
                <td colSpan={8}>No records found.</td>
              </tr>
            ) : (
              currentReports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>{indexOfFirstReport + index + 1}</td>
                  <td>{report.clid}</td>
                  <td>
                    {report.created_at
                      ? new Date(report.created_at).toLocaleString()
                      : ""}
                  </td>
                  <td>
                    {report.recording_path ? (
                      <audio
                        controls
                        src={`${baseURL}${report.recording_path}`}
                        style={{ maxWidth: 120 }}
                      />
                    ) : (
                      "No file"
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: report.is_played
                          ? "#4caf50"
                          : "#ff9800",
                        color: "white",
                      }}
                    >
                      {report.is_played ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>{report.assigned_agent_id || "-"}</td>
                  <td>{report.duration_seconds || "-"}</td>
                  <td>{report.transcription || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        // CDR Report Table
        <table className="user-table">
          <thead>
            <tr>
              <th>Sn</th>
              <th>Caller ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Start Time</th>
              <th>Duration (s)</th>
              <th>Billed (s)</th>
              <th>Disposition</th>
              <th>Recording File</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>Loading...</td>
              </tr>
            ) : currentReports.length === 0 ? (
              <tr>
                <td colSpan={9}>No records found.</td>
              </tr>
            ) : (
              currentReports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>{indexOfFirstReport + index + 1}</td>
                  <td>{report.clid || "-"}</td>
                  <td>{report.src || "-"}</td>
                  <td>{report.dst || "-"}</td>
                  <td>
                    {report.cdrstarttime
                      ? new Date(report.cdrstarttime).toLocaleString()
                      : "-"}
                  </td>
                  <td>{report.duration || "-"}</td>
                  <td>{report.billsec || "-"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          report.disposition === "ANSWERED"
                            ? "#4caf50"
                            : report.disposition === "NO ANSWER"
                            ? "#ff9800"
                            : report.disposition === "BUSY"
                            ? "#f44336"
                            : "#9e9e9e",
                        color: "white",
                      }}
                    >
                      {report.disposition || "-"}
                    </span>
                  </td>
                  <td>{report.recordingfile || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {/* Pagination */}
      <div
        className="pagination"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
            color: currentPage === 1 ? "#999" : "#333",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          ← Previous
        </button>

        <span
          style={{
            padding: "8px 12px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Page {currentPage} of{" "}
          {Math.ceil(filteredReports.length / reportsPerPage)}
        </span>

        <button
          onClick={() =>
            setCurrentPage(
              Math.min(
                Math.ceil(filteredReports.length / reportsPerPage),
                currentPage + 1
              )
            )
          }
          disabled={
            currentPage === Math.ceil(filteredReports.length / reportsPerPage)
          }
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            backgroundColor:
              currentPage === Math.ceil(filteredReports.length / reportsPerPage)
                ? "#f5f5f5"
                : "#fff",
            color:
              currentPage === Math.ceil(filteredReports.length / reportsPerPage)
                ? "#999"
                : "#333",
            cursor:
              currentPage === Math.ceil(filteredReports.length / reportsPerPage)
                ? "not-allowed"
                : "pointer",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Next →
        </button>
      </div>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
