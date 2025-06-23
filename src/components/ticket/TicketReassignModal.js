import React, { useState, useEffect } from "react";

export default function TicketReassignModal({ ticket, open, onClose, onSuccess, token, fetchAttendeesUrl = "/api/admin/attendee" }) {
  const [attendees, setAttendees] = useState([]);
  const [selectedAttendee, setSelectedAttendee] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ticket) return;
    // Fetch all attendees (or eligible users)
    fetch(fetchAttendeesUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // Filter by section/unit and exclude current assignee if possible
        let filtered = data;
        if (ticket.section) {
          filtered = filtered.filter(a => a.unit_section === ticket.section);
        }
        if (ticket.assigned_to_id) {
          filtered = filtered.filter(a => a.id !== ticket.assigned_to_id);
        }
        setAttendees(filtered);
      })
      .catch(() => setAttendees([]));
  }, [ticket, open, token, fetchAttendeesUrl]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const attendee = attendees.find(a => a.id === selectedAttendee);
    if (!attendee) {
      setError("Please select a user.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/focal-person-tickets/${ticket.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          assigned_to_id: attendee.id,
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          nida_number: attendee.nida_number,
          phone_number: attendee.phone_number,
          employer_id: attendee.employer_id,
          assigned_to_role: attendee.role,
          notes: "",
          reassignment_reason: reason
        })
      });
      if (!res.ok) throw new Error("Failed to reassign ticket");
      setLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      setError(err.message || "Failed to reassign ticket");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Reassign Ticket</h2>
        <label>User:</label>
        <select value={selectedAttendee} onChange={e => setSelectedAttendee(e.target.value)}>
          <option value="">Select User</option>
          {attendees.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.username})</option>
          ))}
        </select>
        <label>Reason for reassignment:</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for reassignment" />
        {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={handleSubmit} disabled={!selectedAttendee || !reason || loading}>Reassign</button>
          <button onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
} 