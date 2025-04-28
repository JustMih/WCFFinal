import React from "react";

export default function TicketTable({ tickets, activeColumns, renderTableRow }) {
  return (
    <table className="user-table">
      <thead>
        <tr>
          {activeColumns.includes("id") && <th>#</th>}
          {activeColumns.includes("fullName") && <th>Full Name</th>}
          {activeColumns.includes("phone_number") && <th>Phone</th>}
          {activeColumns.includes("nida_number") && <th>NIDA</th>}
          {activeColumns.includes("status") && <th>Status</th>}
          {activeColumns.includes("subject") && <th>Subject</th>}
          {activeColumns.includes("section") && <th>Section</th>}
          {activeColumns.includes("sub_section") && <th>Sub-section</th>}
          {activeColumns.includes("category") && <th>Category</th>}
          {activeColumns.includes("assigned_to_role") && <th>Assigned Role</th>}
          {activeColumns.includes("created_at") && <th>Created At</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => renderTableRow(ticket, index))
        ) : (
          <tr>
            <td colSpan={activeColumns.length + 1} style={{ textAlign: "center", color: "red" }}>
              No tickets found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
