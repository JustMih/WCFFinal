import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Stack,
} from "@mui/material";
import { FiPhoneCall, FiPhoneIncoming, FiPhoneOff } from "react-icons/fi";
import { MdCallMissed } from "react-icons/md";
import { baseURL } from "../../config";
import "./CallHistoryCard.css";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`call-tabpanel-${index}`}
      aria-labelledby={`call-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CallHistoryCard({ onCallBack }) {
  const [activeTab, setActiveTab] = useState(0);
  const [receivedCalls, setReceivedCalls] = useState([]);
  const [lostCalls, setLostCalls] = useState([]);
  const [droppedCalls, setDroppedCalls] = useState([]);
  const [loading, setLoading] = useState({
    received: false,
    lost: false,
    dropped: false,
  });
  const [totals, setTotals] = useState({
    received: 0,
    lost: 0,
    dropped: 0,
  });
  const [pagination, setPagination] = useState({
    received: { page: 1, limit: 5 },
    lost: { page: 1, limit: 5 },
    dropped: { page: 1, limit: 5 },
  });

  const fetchReceivedCalls = async (page = 1, limit = 5) => {
    if (loading.received) return;
    setLoading((prev) => ({ ...prev, received: true }));
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(
        `${baseURL}/calls/received-calls?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      setReceivedCalls(data.calls || []);
      setTotals((prev) => ({ ...prev, received: data.total || 0 }));
      setPagination((prev) => ({
        ...prev,
        received: { page, limit },
      }));
    } catch (error) {
      console.error("Error fetching received calls:", error);
    } finally {
      setLoading((prev) => ({ ...prev, received: false }));
    }
  };

  const fetchLostCalls = async (page = 1, limit = 5) => {
    if (loading.lost) return;
    setLoading((prev) => ({ ...prev, lost: true }));
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(
        `${baseURL}/calls/lost-calls?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      setLostCalls(data.calls || []);
      setTotals((prev) => ({ ...prev, lost: data.total || 0 }));
      setPagination((prev) => ({
        ...prev,
        lost: { page, limit },
      }));
    } catch (error) {
      console.error("Error fetching lost calls:", error);
    } finally {
      setLoading((prev) => ({ ...prev, lost: false }));
    }
  };

  const fetchDroppedCalls = async (page = 1, limit = 5) => {
    if (loading.dropped) return;
    setLoading((prev) => ({ ...prev, dropped: true }));
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(
        `${baseURL}/calls/dropped-calls?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      setDroppedCalls(data.calls || []);
      setTotals((prev) => ({ ...prev, dropped: data.total || 0 }));
      setPagination((prev) => ({
        ...prev,
        dropped: { page, limit },
      }));
    } catch (error) {
      console.error("Error fetching dropped calls:", error);
    } finally {
      setLoading((prev) => ({ ...prev, dropped: false }));
    }
  };

  useEffect(() => {
    fetchReceivedCalls(1, 5);
    fetchLostCalls(1, 5);
    fetchDroppedCalls(1, 5);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Fetch data when switching tabs if not already loaded
    if (newValue === 0 && receivedCalls.length === 0) {
      fetchReceivedCalls(1, 5);
    } else if (newValue === 1 && lostCalls.length === 0) {
      fetchLostCalls(1, 5);
    } else if (newValue === 2 && droppedCalls.length === 0) {
      fetchDroppedCalls(1, 5);
    }
  };

  const handlePageChange = (event, newPage, callType) => {
    if (callType === "received") {
      fetchReceivedCalls(newPage, pagination.received.limit);
    } else if (callType === "lost") {
      fetchLostCalls(newPage, pagination.lost.limit);
    } else if (callType === "dropped") {
      fetchDroppedCalls(newPage, pagination.dropped.limit);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const extractPhoneNumber = (clid) => {
    if (!clid) return "-";
    // Extract phone number from CLID format like "Name" <number> or just number
    const match = clid.match(/<(\d+)>/) || clid.match(/(\d+)/);
    return match ? match[1] : clid;
  };

  const handleCallback = async (caller, callTime) => {
    const phoneNumber = extractPhoneNumber(caller);
    if (onCallBack && phoneNumber) {
      try {
        // Update the call status in the database from NO ANSWER to ANSWERED
        const response = await fetch(
          `${baseURL}/calls/lost-calls/mark-answered`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              caller: caller,
              call_time: callTime,
            }),
          }
        );

        if (response.ok) {
          // Remove the call from lost calls list using caller and call_time as unique identifier
          const updatedLostCalls = lostCalls.filter(
            (call) => !(call.caller === caller && call.call_time === callTime)
          );
          setLostCalls(updatedLostCalls);

          // Update total count
          setTotals((prev) => ({
            ...prev,
            lost: Math.max(0, prev.lost - 1),
          }));

          // If current page becomes empty and not on first page, go to previous page
          if (updatedLostCalls.length === 0 && pagination.lost.page > 1) {
            const newPage = pagination.lost.page - 1;
            setPagination((prev) => ({
              ...prev,
              lost: { ...prev.lost, page: newPage },
            }));
            fetchLostCalls(newPage, pagination.lost.limit);
          } else if (updatedLostCalls.length === 0) {
            // If page is empty, refetch current page to get next set of calls
            fetchLostCalls(pagination.lost.page, pagination.lost.limit);
          }

          // Trigger the callback
          onCallBack(phoneNumber);
        } else {
          console.error("Failed to mark call as answered");
          // Still trigger callback even if update fails
          onCallBack(phoneNumber);
        }
      } catch (error) {
        console.error("Error marking call as answered:", error);
        // Still trigger callback even if update fails
        onCallBack(phoneNumber);
      }
    }
  };

  const renderTable = (
    calls,
    isLoading,
    showCallback = false,
    callType = "received",
    total = 0,
    currentPage = 1,
    limit = 5
  ) => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (calls.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            No calls found
          </Typography>
        </Box>
      );
    }

    const totalPages = Math.ceil(total / limit);

    return (
      <Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Caller</TableCell>
                <TableCell>Call Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                {showCallback && <TableCell>Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {calls.map((call, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {extractPhoneNumber(call.caller)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(call.call_time)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDuration(call.duration)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={call.disposition || "Unknown"}
                      size="small"
                      color={
                        call.disposition === "ANSWERED"
                          ? "success"
                          : call.disposition === "NO ANSWER"
                          ? "error"
                          : "default"
                      }
                    />
                  </TableCell>
                  {showCallback && (
                    <TableCell>
                      <Tooltip title="Call back">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleCallback(call.caller, call.call_time)
                          }
                        >
                          <FiPhoneCall />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, page) =>
                handlePageChange(event, page, callType)
              }
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <div className="call-history-card">
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="call history tabs"
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <FiPhoneIncoming />
                <span>Received ({totals.received})</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <MdCallMissed />
                <span>Lost ({totals.lost})</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <FiPhoneOff />
                <span>Dropped ({totals.dropped})</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {renderTable(
          receivedCalls,
          loading.received,
          false,
          "received",
          totals.received,
          pagination.received.page,
          pagination.received.limit
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderTable(
          lostCalls,
          loading.lost,
          true,
          "lost",
          totals.lost,
          pagination.lost.page,
          pagination.lost.limit
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderTable(
          droppedCalls,
          loading.dropped,
          false,
          "dropped",
          totals.dropped,
          pagination.dropped.page,
          pagination.dropped.limit
        )}
      </TabPanel>
    </div>
  );
}
