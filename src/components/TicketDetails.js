import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { baseURL } from "../config";

// Helper fetchers
const fetchTicketDetails = async (ticketId) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${baseURL}/ticket/${ticketId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch ticket details');
  return res.json();
};
const fetchAssignments = async (ticketId) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch assignment history');
  return res.json();
};
const fetchAssignedOfficers = async (ticketId) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${baseURL}/ticket/${ticketId}/assigned-officers`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch assigned officers');
  return res.json();
};

const TicketDetails = ({ ticketId, onClose }) => {
  const {
    data: ticketData,
    isLoading: isTicketLoading,
    error: ticketError,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchTicketDetails(ticketId),
    enabled: !!ticketId,
  });

  const {
    data: assignments,
    isLoading: isAssignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ['assignments', ticketId],
    queryFn: () => fetchAssignments(ticketId),
    enabled: !!ticketId,
  });

  const {
    data: officers,
    isLoading: isOfficersLoading,
    error: officersError,
  } = useQuery({
    queryKey: ['officers', ticketId],
    queryFn: () => fetchAssignedOfficers(ticketId),
    enabled: !!ticketId,
  });

  if (!ticketId) return <div>No ticket selected.</div>;
  if (isTicketLoading || isAssignmentsLoading || isOfficersLoading) return <div>Loading...</div>;
  if (ticketError || assignmentsError || officersError) {
    return (
      <div style={{ color: 'red' }}>
        Error loading details.<br />
        {ticketError && <div>Ticket: {ticketError.message}</div>}
        {assignmentsError && <div>Assignments: {assignmentsError.message}</div>}
        {officersError && <div>Officers: {officersError.message}</div>}
      </div>
    );
  }

  const ticket = ticketData?.ticket || {};

  return (
    <div className="ticket-details-container" style={{ display: 'flex', gap: 32 }}>
      {/* Left column: Ticket info */}
      <div style={{ flex: 1, minWidth: 300 }}>
        <h2>Ticket Details</h2>
        <div><strong>ID:</strong> {ticket.ticket_id}</div>
        <div><strong>Subject:</strong> {ticket.subject}</div>
        <div><strong>Status:</strong> {ticket.status}</div>
        <div><strong>Category:</strong> {ticket.category}</div>
        <div><strong>Requester:</strong> {ticket.requester}</div>
        <div><strong>Institution:</strong> {ticket.institution}</div>
        <div><strong>Phone:</strong> {ticket.phone_number}</div>
        <div><strong>Description:</strong> {ticket.description}</div>
        <div><strong>Created At:</strong> {ticket.created_at && new Date(ticket.created_at).toLocaleString()}</div>
        <div><strong>Assigned To:</strong> {ticket.assigned_to}</div>
        {/* Add more fields as needed */}
        {onClose && (
          <button onClick={onClose} style={{ marginTop: 16 }}>Close</button>
        )}
      </div>
      {/* Right column: Assignment history and officers */}
      <div style={{ flex: 1, minWidth: 300 }}>
        <h3>Assignment History</h3>
        {assignments && assignments.length > 0 ? (
          <ul style={{ paddingLeft: 16 }}>
            {assignments.map((a, idx) => (
              <li key={a.id || idx}>
                <div><strong>Action:</strong> {a.action}</div>
                <div><strong>Assigned To:</strong> {a.assigned_to_id} ({a.assigned_to_role})</div>
                <div><strong>By:</strong> {a.assigned_by_id}</div>
                <div><strong>Reason:</strong> {a.reason}</div>
                <div><strong>Date:</strong> {a.created_at && new Date(a.created_at).toLocaleString()}</div>
                <hr />
              </li>
            ))}
          </ul>
        ) : <div>No assignment history.</div>}
        <h3>Assigned Officers</h3>
        {officers && officers.length > 0 ? (
          <ul style={{ paddingLeft: 16 }}>
            {officers.map((o, idx) => (
              <li key={o.id || idx}>
                <div><strong>Officer:</strong> {o.officer_id}</div>
                <div><strong>Assigned At:</strong> {o.assigned_at && new Date(o.assigned_at).toLocaleString()}</div>
                <hr />
              </li>
            ))}
          </ul>
        ) : <div>No assigned officers.</div>}
      </div>
    </div>
  );
};

TicketDetails.propTypes = {
  ticketId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func,
};

export default TicketDetails; 