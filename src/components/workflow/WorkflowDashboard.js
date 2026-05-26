import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../config';
import WorkflowStatusIndicator from './WorkflowStatusIndicator';
import WorkflowActionModal from './WorkflowActionModal';

const WorkflowDashboard = ({ userRole }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkflowTickets();
  }, []);

  const fetchWorkflowTickets = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${baseURL}/ticket/workflow-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        setTickets(response.data.data || []);
      } else {
        setTickets(response.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching workflow tickets:', error);
      if (error.response) {
        // Server responded with error status
        setError(error.response.data?.message || `Failed to fetch workflow tickets: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        setError('Network error: Unable to connect to server. Please check your connection.');
      } else {
        // Something else happened
        setError(error.message || 'Failed to fetch workflow tickets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionComplete = (result) => {
    // Refresh tickets after action
    fetchWorkflowTickets();
    // Show success message
    alert(result.message);
  };

  const openActionModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedTicket(null);
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(ticket => {
        switch (filter) {
          case 'in-progress':
            return ticket.status === 'In Progress';
          case 'pending':
            return ticket.status === 'Pending Review' || ticket.status === 'Pending Approval';
          case 'completed':
            return ticket.workflow_completed;
          case 'reversed':
            return ticket.status === 'Reversed';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Review':
        return 'bg-orange-100 text-orange-800';
      case 'Pending Approval':
        return 'bg-purple-100 text-purple-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'Reversed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (complaintType) => {
    switch (complaintType) {
      case 'Major':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchWorkflowTickets}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredTickets = getFilteredTickets();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Workflow Dashboard</h1>
          <div className="text-sm text-gray-600">
            {filteredTickets.length} of {tickets.length} tickets
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tickets</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending Review/Approval</option>
            <option value="completed">Completed</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6">
        {tickets.length === 0 && !isLoading && !error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-2">No workflow tickets found</p>
            <p className="text-gray-400 text-sm">Tickets with workflow paths will appear here</p>
          </div>
        ) : filteredTickets.length === 0 && tickets.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No tickets found matching your criteria</p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Ticket Info */}
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ticket.ticket_id}
                      </h3>
                      <p className="text-gray-600">{ticket.subject}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      {ticket.complaint_type && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.complaint_type)}`}>
                          {ticket.complaint_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Requester:</span>
                      <p className="text-gray-600">
                        {ticket.first_name} {ticket.middle_name} {ticket.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span>
                      <p className="text-gray-600">{ticket.phone_number}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Institution:</span>
                      <p className="text-gray-600">{ticket.institution || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-600">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Workflow Status */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Workflow Status</h4>
                    <WorkflowStatusIndicator ticket={ticket} />
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="lg:w-80 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => openActionModal(ticket)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Take Action
                      </button>
                      <button
                        onClick={() => window.open(`/ticket/${ticket.id}`, '_blank')}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Assignment</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Assigned To:</span>
                        <p className="text-gray-600">
                          {ticket.assigned_to_role || 'Unassigned'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Unit:</span>
                        <p className="text-gray-600">
                          {ticket.responsible_unit_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Workflow Action Modal */}
      {showActionModal && selectedTicket && (
        <WorkflowActionModal
          isOpen={showActionModal}
          onClose={closeActionModal}
          ticket={selectedTicket}
          onActionComplete={handleActionComplete}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default WorkflowDashboard; 