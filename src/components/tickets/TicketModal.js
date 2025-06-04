import React, { useState } from 'react';
import SearchMember from '../search/SearchMember';

const TicketModal = ({ isOpen, onClose, onSubmit }) => {
    const [ticketData, setTicketData] = useState({
        name: '',
        memberNo: '',
        description: '',
        // Add other ticket fields as needed
    });

    const handleMemberSelect = (selectedMember) => {
        setTicketData(prev => ({
            ...prev,
            name: selectedMember.name,
            memberNo: selectedMember.memberno
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(ticketData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New Ticket</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="search-section">
                        <label>Search Member:</label>
                        <SearchMember 
                            onResultSelect={handleMemberSelect}
                            type="employee" // or "employer" based on your needs
                        />
                    </div>

                    <div className="form-group">
                        <label>Name:</label>
                        <input
                            type="text"
                            value={ticketData.name}
                            readOnly
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Member Number:</label>
                        <input
                            type="text"
                            value={ticketData.memberNo}
                            readOnly
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            value={ticketData.description}
                            onChange={(e) => setTicketData(prev => ({
                                ...prev,
                                description: e.target.value
                            }))}
                            className="form-textarea"
                        />
                    </div>

                    <div className="button-group">
                        <button type="submit" className="submit-button">
                            Create Ticket
                        </button>
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                h2 {
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                .form-input, .form-textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                .form-textarea {
                    min-height: 100px;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }

                .submit-button, .cancel-button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                }

                .submit-button {
                    background-color: #007bff;
                    color: white;
                }

                .cancel-button {
                    background-color: #6c757d;
                    color: white;
                }

                .search-section {
                    margin-bottom: 20px;
                }
            `}</style>
        </div>
    );
};

export default TicketModal; 