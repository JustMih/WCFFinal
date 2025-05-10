import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { baseURL } from '../../../config';

const CRMCoordinatorTickets = () => {
  const { status } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/coordinator/tickets?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="coordinator-tickets">
      <h2>Coordinator Tickets - {status}</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>{ticket.id}</td>
              <td>{`${ticket.first_name} ${ticket.last_name}`}</td>
              <td>{ticket.phone_number}</td>
              <td>{ticket.category}</td>
              <td>{ticket.status}</td>
              <td>{new Date(ticket.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CRMCoordinatorTickets; 