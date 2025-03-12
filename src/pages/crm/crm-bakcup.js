import React, { useState, useEffect } from 'react';
import './crm.css';
import { baseURL } from "../../config";

export default function Crm() {
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        phoneNumber: '',
        institution: '',
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Open'
    });

    const [ticketStats, setTicketStats] = useState({
        todaysTickets: 0,
        closedTickets: 0,
        statusCounts: {
            open: 0,
            assigned: 0,
            closed: 0,
            carriedForward: 0,
            total: 0
        }
    });

    const [modal, setModal] = useState({
        isOpen: false,
        type: '',
        message: ''
    });

    useEffect(() => {
        fetchTicketStats();
    }, []);

    const fetchTicketStats = async () => {
        try {
            const response = await fetch('http://localhost:5010/api/ticket/create-ticket');
            const data = await response.json();
            setTicketStats(data);
        } catch (error) {
            console.error('Error fetching ticket stats:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${baseURL}/ticket/create-ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setModal({
                    isOpen: true,
                    type: 'success',
                    message: 'Ticket submitted successfully!'
                });
                setFormData({
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    phoneNumber: '',
                    institution: '',
                    title: '',
                    description: '',
                    priority: 'Medium',
                    status: 'Open'
                });
                fetchTicketStats();
            } else {
                setModal({
                    isOpen: true,
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setModal({
                isOpen: true,
                type: 'error',
                message: 'Error submitting ticket: ' + error.message
            });
        }
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    return (
        <div>
            <h2 className="title">CRM</h2>
            <div className="crm-container">
                <div className="ticket-form-section">
                    <h2>Create New Ticket</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name:</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="middleName">Middle Name:</label>
                                <input
                                    type="text"
                                    id="middleName"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    placeholder="Enter middle name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name:</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number:</label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="institution">Institution:</label>
                                <input
                                    type="text"
                                    id="institution"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter institution name"
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="title">Title:</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter ticket title"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="description">Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                placeholder="Describe the issue"
                                rows="4"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="priority">Priority:</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="status">Status:</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="submit-button">
                            Submit Ticket
                        </button>
                    </form>
                </div>

                <div className="ticket-stats-section">
                    <h2>Ticket Statistics</h2>
                    <div className="stats-summary">
                        <div className="stat-box">
                            <h3>Today's Tickets</h3>
                            <p>{ticketStats.todaysTickets}</p>
                        </div>
                        <div className="stat-box">
                            <h3>Closed Tickets</h3>
                            <p>{ticketStats.closedTickets}%</p>
                        </div>
                    </div>

                    <div className="stats-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Open Tickets</td>
                                    <td>{ticketStats.statusCounts.open}</td>
                                </tr>
                                <tr>
                                    <td>Assigned Tickets</td>
                                    <td>{ticketStats.statusCounts.assigned}</td>
                                </tr>
                                <tr>
                                    <td>Closed Tickets</td>
                                    <td>{ticketStats.statusCounts.closed}</td>
                                </tr>
                                {/* <tr>
                  <td>Carried Forward</td>
                  <td>{ticketStats.statusCounts.carriedForward}</td>
                </tr> */}
                                <tr>
                                    <td>Total Tickets</td>
                                    <td>{ticketStats.statusCounts.total}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modal.isOpen && (
                <div className="modal-overlay">
                    <div className={`modal-content ${modal.type}`}>
                        <h3>{modal.type === 'success' ? 'Success' : 'Error'}</h3>
                        <p>{modal.message}</p>
                        <button onClick={closeModal} className="modal-close-button">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}