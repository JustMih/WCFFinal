// import React, { useState, useEffect } from "react";
// // import Swal from "sweetalert2";
// import {
//   Alert,
//   Box,
//   Button,
//   Divider,
//   Grid,
//   IconButton,
//   Modal,
//   Snackbar,
//   TextField,
//   Tooltip,
//   Typography
// } from "@mui/material";
// import { FaEye, FaPlus } from "react-icons/fa";
// import { FiSettings } from "react-icons/fi";
// // import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
// import ColumnSelector from "../../../../components/colums-select/ColumnSelector";
// import { baseURL } from "../../../../config";
// import "./crm-agent-dashboard.css";

// export default function AgentCRM() {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     phoneNumber: "",
//     nidaNumber: "",
//     requester: "",        // <== matches updated select
//     institution: "",
//     region: "",
//     district: "",
//     channel: "",          // <== matches updated select
//     category: "",         // can be used elsewhere if needed
//     functionId: "",       // Subject
//     description: "",
//     status: "Open"
//   });
  
  
// const [formErrors, setFormErrors] = useState({});
// const handleSubmit = async (e) => {
//   e.preventDefault();

//   const requiredFields = {
//     firstName: "First Name",
//     lastName: "Last Name",
//     phoneNumber: "Phone Number",
//     nidaNumber: "NIDA Number",
//     requester: "Requester", // ❌ NOT part of formData
//     institution: "Institution",
//     region: "Region",
//     district: "District",
//     channel: "Channel",     // ❌ NOT part of formData
//     category: "Category",
//     functionId: "Subject",
//     description: "Description"
//   };

//     const errors = {};
//   const missing = [];

//   Object.entries(requiredFields).forEach(([key, label]) => {
//     if (!formData[key] || formData[key].toString().trim() === "") {
//       errors[key] = "This field is required";
//       missing.push(`• ${label}`);
//     }
//   });

//   if (missing.length > 0) {
//     setFormErrors(errors); // Show red borders and messages

//     // Open error modal
//     setModal({
//       isOpen: true,
//       type: 'error',
//       message: `Please fill the required fields before submitting.`
//     });

//     // Don't close showModal — keep it open
//     return;
//   }

//   setFormErrors({}); // Clear errors

//   try {
//     const response = await fetch(`${baseURL}/ticket/create-ticket`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${localStorage.getItem("authToken")}`
//       },
//       body: JSON.stringify(formData)
//     });

//     const data = await response.json();

//     if (response.ok) {
//       setModal({
//         isOpen: true,
//         type: 'success',
//         message: `Ticket created successfully: ${data.ticket.ticket_id}`
//       });
//       setShowModal(false); // Close form modal only on success
//     } else {
//       setModal({
//         isOpen: true,
//         type: 'error',
//         message: data.message || 'Ticket creation failed.'
//       });
//     }
//   } catch (error) {
//     console.error("Error creating ticket:", error);
//     setModal({
//       isOpen: true,
//       type: 'error',
//       message: `Network error. Please try again later.`
//     });
//   }
// };


// const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });

// const closeModal = () => {
//   setModal({ isOpen: false, type: '', message: '' });
// };

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
  
//   //   try {
//   //     const response = await fetch(`${baseURL}/ticket/create-ticket`, {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //         Authorization: `Bearer ${localStorage.getItem("authToken")}`
//   //       },
//   //       body: JSON.stringify(formData)
//   //     });
  
//   //     const data = await response.json();
  
//   //     if (response.ok) {
//   //       alert(`Ticket created successfully: ${data.ticket.ticket_id}`);
//   //       setShowModal(false);
//   //     } else {
//   //       alert(data.message || "Failed to create ticket.");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error creating ticket:", error);
//   //     alert("An error occurred. Check network or server.");
//   //   }
//   // };

//   const [ticketStats, setTicketStats] = useState({
//     totalComplaints: 0,
//     pendingRating: 0,
//     ratedMajor: 0,
//     ratedMinor: 0
//   });
//   const [customerTickets, setCustomerTickets] = useState([]);
//   const [userId, setUserId] = useState("");
//   const [search, setSearch] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [columnModalOpen, setColumnModalOpen] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "info"
//   });
//   const [activeColumns, setActiveColumns] = useState([]); // Initialized empty, updated by ColumnSelector
//   const [functionData, setFunctionData] = useState([]);
//   const [selectedFunction, setSelectedFunction] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(5);

//   // Fetch userId and tickets on mount
//   useEffect(() => {
//     const id = localStorage.getItem("userId");
//     setUserId(id);
//     fetchCustomerTickets();
//   }, []);

//   // Fetch function data for subject selection
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(`${baseURL}/section/functions-data`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("authToken")}`
//           }
//         });
//         const json = await res.json();
//         setFunctionData(json.data || []);
//       } catch (err) {
//         console.error("Fetch error:", err);
//       }
//     };
//     fetchData();
//   }, []);

//   const fetchCustomerTickets = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       const response = await fetch(`${baseURL}/ticket/all-customer-tickets`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json"
//         }
//       });
//       const result = await response.json();
//       if (response.ok && Array.isArray(result.tickets)) {
//         setCustomerTickets(result.tickets);
//         updateTicketStats(result.tickets);
//       }
//     } catch (error) {
//       console.error("Error fetching tickets:", error);
//     }
//   };

//   const updateTicketStats = (tickets) => {
//     setTicketStats({
//       totalComplaints: tickets.length,
//       pendingRating: tickets.filter((t) => !t.complaintType).length,
//       ratedMajor: tickets.filter((t) => t.complaintType === "Major").length,
//       ratedMinor: tickets.filter((t) => t.complaintType === "Minor").length
//     });
//   };

//   //  Form Input Change Handler on submit
//   const handleChange = async (e) => {
//     const { name, value } = e.target;

//     // Always update the form
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     // Perform custom actions based on input name of function data
//     if (name === "functionId") {
//       try {
//         const token = localStorage.getItem("authToken");
//         const response = await fetch(
//           `${baseURL}/section/functions-data/${value}`,
//           {
//             headers: { Authorization: `Bearer ${token}` }
//           }
//         );
//         if (response.ok) {
//           const result = await response.json();
//           setSelectedFunction(result.data.function || "");
//           setSelectedSection(result.data.section || "");
//         } else {
//           setSelectedFunction("");
//           setSelectedSection("");
//         }
//       } catch (err) {
//         console.error("Fetch error:", err);
//       }
//     }
//   };

//   //  Submit Handler for ticket submission
//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   //   try {
//   //     const token = localStorage.getItem("authToken");
//   //     const response = await fetch(`${baseURL}/tickets`, {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //         Authorization: `Bearer ${token}`
//   //       },
//   //       body: JSON.stringify(formData)
//   //     });
//   //     const result = await response.json();
//   //     if (response.ok) {
//   //       setSnackbar({
//   //         open: true,
//   //         message: "Ticket created successfully!",
//   //         severity: "success"
//   //       });
//   //       setFormData({
//   //         firstName: "",
//   //         lastName: "",
//   //         phoneNumber: "",
//   //         nidaNumber: "",
//   //         region: "",
//   //         district: "",
//   //         title: "",
//   //         description: "",
//   //         complaintType: "",
//   //         status: "Open",
//   //         functionId: ""
//   //       });
//   //       fetchCustomerTickets();
//   //     } else {
//   //       setSnackbar({
//   //         open: true,
//   //         message: result.message || "Failed to create ticket",
//   //         severity: "error"
//   //       });
//   //     }
//   //   } catch (error) {
//   //     setSnackbar({
//   //       open: true,
//   //       message: "Error creating ticket: " + error.message,
//   //       severity: "error"
//   //     });
//   //   }
//   // };

//   const filteredTickets = customerTickets.filter((t) => {
//     const s = search.trim().toLowerCase();
//     return (
//       (!s ||
//         t.phone_number?.toLowerCase().includes(s) ||
//         t.nida_number?.toLowerCase().includes(s) ||
//         t.firstName?.toLowerCase().includes(s) ||
//         t.lastName?.toLowerCase().includes(s)) &&
//       (!filterStatus || t.status === filterStatus)
//     );
//   });

//   const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
//   const paginatedTickets = filteredTickets.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handleSnackbarClose = () => {
//     setSnackbar({ ...snackbar, open: false });
//   };

//   const openDetailsModal = (ticket) => {
//     setSelectedTicket(ticket);
//     setShowDetailsModal(true);
//   };

//   const renderTableHeader = () => (
//     <tr>
//       {activeColumns.includes("id") && <th>#</th>}
//       {activeColumns.includes("fullName") && <th>Full Name</th>}
//       {activeColumns.includes("phone_number") && <th>Phone</th>}
//       {activeColumns.includes("status") && <th>Status</th>}
//       {activeColumns.includes("subject") && <th>Subject</th>}
//       {activeColumns.includes("category") && <th>Category</th>}
//       {activeColumns.includes("assigned_to_role") && <th>Assigned Role</th>}
//       {activeColumns.includes("created_at") && <th>Created At</th>}
//       <th>Actions</th>
//     </tr>
//   );

//   const renderTableRow = (ticket, index) => (
//     <tr key={ticket.id}>
//       {activeColumns.includes("id") && (
//         <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
//       )}
//       {activeColumns.includes("fullName") && (
//         <td>{`${ticket.first_name || ""} ${ticket.middle_name || ""} ${
//           ticket.last_name || ""
//         }`}</td>
//       )}
//       {activeColumns.includes("phone_number") && <td>{ticket.phone_number}</td>}
//       {activeColumns.includes("status") && <td>{ticket.status}</td>}
//       {activeColumns.includes("description") && <td>{ticket.description}</td>}
//       {activeColumns.includes("subject") && <td>{ticket.functionData?.name}</td>}
//       {activeColumns.includes("Section") && <td>{ticket.functionData?.parentFunction?.section?.name}</td>}
//       {activeColumns.includes("Sub-section") && <td>{ticket.functionData?.parentFunction?.name}</td>}  
//       {activeColumns.includes("category") && <td>{ticket.category}</td>}
//       {activeColumns.includes("assigned_to_role") && (
//         <td>{ticket.assigned_to_role}</td>
//       )}
//       {activeColumns.includes("created_at") && (
//         <td>
//           {new Date(ticket.created_at).toLocaleString("en-GB", {
//             day: "2-digit",
//             month: "short",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true
//           })}
//         </td>
//       )}
//       <td>
//         <button
//           className="view-ticket-details-btn"
//           title="View"
//           onClick={() => openDetailsModal(ticket)}
//         >
//           <FaEye />
//         </button>
//       </td>
//     </tr>
//   );

//   const [tickets, setTicket] = useState([]);
//   const [ticketsPerPage] = useState(5);

//   const indexOfLastTicket = currentPage * ticketsPerPage;
//   const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
//   const currentUsers = filteredTickets.slice(
//     indexOfFirstTicket,
//     indexOfLastTicket
//   );

//   return (
//     <div className="user-table-container">
//       {/* Ticket List */}
//       <div className="ticket-table-container">
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center"
//           }}
//         >
//           <h2>Tickets</h2>
//           <Tooltip title="Columns Settings and Export" arrow>
//             <IconButton onClick={() => setColumnModalOpen(true)}>
//               <FiSettings size={20} />
//             </IconButton>
//           </Tooltip>
//         </div>
        
//         <div
//           className="controls"
//           // style={{ display: "flex", justifyContent: "space-between", alignItems: "center"
//           //  }}
//         >
//           <div>
//             <label style={{ marginRight: "8px" }}>
//               <strong>Show:</strong>
//             </label>
//             <select
//               className="filter-select"
//               value={itemsPerPage}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 itemsPerPage(
//                   value === "All" ? tickets.length : parseInt(value)
//                 );
//                 setCurrentPage(1);
//               }}
//             >
//               {[5, 10, 25, 50, 100].map((n) => (
//                 <option key={n} value={n}>
//                   {n}
//                 </option>
//               ))}
//               <option value="All">All</option>
//             </select>
//           </div>
//           <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
//             <input
//               className="search-input"
//               type="text"
//               placeholder="Search by phone or NIDA"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//             <select
//               className="filter-select"
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//             >
//               <option value="">All</option>
//               <option value="Open">Open</option>
//               <option value="Closed">Closed</option>
//             </select>
//           </div>
//         </div>
//         <div className="controls">
//           <input
//             type="text"
//             placeholder="Search by name..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="search-input"
//           />
//           <button
//             className="add-user-button"
//             onClick={() => setShowModal(true)}
//           >
//             <FaPlus /> New Ticket
//           </button>
//         </div>

//         <table className="user-table">
//           <thead>{renderTableHeader()}</thead>
//           <tbody>
//             {paginatedTickets.length > 0 ? (
//               paginatedTickets.map((ticket, i) => renderTableRow(ticket, i))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={activeColumns.length + 1}
//                   style={{ textAlign: "center", color: "red" }}
//                 >
//                   No complaints found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>

//         {/* Pagination */}
//         <div className="pagination">
//           {Array.from(
//             { length: Math.ceil(filteredTickets.length / ticketsPerPage) },
//             (_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={currentPage === i + 1 ? "active" : ""}
//               >
//                 {i + 1}
//               </button>
//             )
//           )}
//         </div>
//       </div>
//       {/*End of pagination  */}

//       {/* Ticket Creation Modal */}
//       <Modal open={showModal} onClose={() => setShowModal(false)}>
//   <Box
//     sx={{
//       position: "absolute",
//       top: "50%",
//       left: "50%",
//       transform: "translate(-50%, -50%)",
//       width: { xs: "90%", sm: 600 },
//       maxHeight: "90vh",
//       overflowY: "auto",
//       bgcolor: "background.paper",
//       boxShadow: 24,
//       borderRadius: 3,
//       p: 4
//     }}
//   >
//     <button
//       onClick={() => setShowModal(false)}
//       style={{
//         position: "absolute",
//         top: 6,
//         right: 12,
//         background: "transparent",
//         border: "none",
//         fontSize: "1.25rem",
//         cursor: "pointer"
//       }}
//       aria-label="Close"
//     >
//       ×
//     </button>

//     <div className="modal-form-container">
//       <h2 className="modal-title">New Ticket</h2>

//       {/* First Row */}
//       <div className="modal-form-row">
//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>First Name:</label>
//           <input
//             name="firstName"
//             value={formData.firstName}
//             onChange={handleChange}
//             placeholder="Enter first name"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.firstName ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.firstName && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.firstName}</span>
//           )}
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Last Name:</label>
//           <input
//             name="lastName"
//             value={formData.lastName}
//             onChange={handleChange}
//             placeholder="Enter last name"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.lastName ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.lastName && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.lastName}</span>
//           )}
//         </div>
//       </div>

//       {/* Phone & NIDA */}
//       <div className="modal-form-row">
//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Phone Number:</label>
//           <input
//             type="tel"
//             name="phoneNumber"
//             value={formData.phoneNumber}
//             onChange={handleChange}
//             placeholder="Enter phone number"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.phoneNumber ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.phoneNumber && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.phoneNumber}</span>
//           )}
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>National Identification Number:</label>
//           <input
//             name="nidaNumber"
//             value={formData.nidaNumber}
//             onChange={handleChange}
//             placeholder="Enter NIN number"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.nidaNumber ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.nidaNumber && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.nidaNumber}</span>
//           )}
//         </div>
//       </div>

//       {/* Requester & Institution */}
//       <div className="modal-form-row">
//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Requester:</label>
//           <select
//             name="requester"
//             value={formData.requester}
//             onChange={handleChange}
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               width: "100%",
//               border: formErrors.requester ? "1px solid red" : "1px solid #ccc"
//             }}
//           >
//             <option value="">Select..</option>
//             <option value="Employer">Employer</option>
//             <option value="Employee">Employee</option>
//           </select>
//           {formErrors.category && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.category}</span>
//           )}
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Institution:</label>
//           <input
//             name="institution"
//             value={formData.institution}
//             onChange={handleChange}
//             placeholder="Enter Institution"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.institution ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.institution && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.institution}</span>
//           )}
//         </div>
//       </div>

//       {/* Region & District */}
//       <div className="modal-form-row">
//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Region:</label>
//           <input
//             name="region"
//             value={formData.region}
//             onChange={handleChange}
//             placeholder="Enter region"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.region ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.region && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.region}</span>
//           )}
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>District:</label>
//           <input
//             name="district"
//             value={formData.district}
//             onChange={handleChange}
//             placeholder="Enter district"
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               border: formErrors.district ? "1px solid red" : "1px solid #ccc"
//             }}
//           />
//           {formErrors.district && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.district}</span>
//           )}
//         </div>
//       </div>

//       {/* Category & Channel */}
//       <div className="modal-form-row">
//         <div className="modal-form-group" style={{ flex: 1 }}>
//           <label style={{ fontSize: "0.875rem" }}>Category:</label>
//           <select
//             name="category"
//             value={formData.category}
//             onChange={handleChange}
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               width: "100%",
//               border: formErrors.category ? "1px solid red" : "1px solid #ccc"
//             }}
//           >
//             <option value="">Select Category</option>
//             <option value="Inquiry">Inquiry</option>
//             <option value="Complaint">Complaint</option>
//             <option value="Suggestion">Suggestion</option>
//             <option value="Compliment">Compliment</option>
//           </select>
//           {formErrors.category && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.category}</span>
//           )}
//         </div>

//         <div className="modal-form-group" style={{ flex: 1 }}>
//           <label style={{ fontSize: "0.875rem" }}>Channel:</label>
//           <select
//             name="channel"
//             value={formData.requester}
//   onChange={handleChange}
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               width: "100%",
//               border: formErrors.channel ? "1px solid red" : "1px solid #ccc"
//             }}
//           >
//             <option value="">Select Channel</option>
//             <option value="Call">Call</option>
//             <option value="Email">Email</option>
//           </select>
//           {formErrors.functionId && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.functionId}</span>
//           )}
//         </div>
//       </div>

//       {/* Subject, Sub-section, Section */}
//       <div className="modal-form-row">
//         <div className="modal-form-group" style={{ flex: 1 }}>
//           <label style={{ fontSize: "0.875rem" }}>Subject:</label>
//           <select
//             name="functionId"
//             value={formData.functionId}
//             onChange={handleChange}
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               width: "100%",
//               border: formErrors.functionId ? "1px solid red" : "1px solid #ccc"
//             }}
//           >
//             <option value="">Select Subject</option>
//             {functionData.map((item) => (
//               <option key={item.id} value={item.id}>{item.name}</option>
//             ))}
//           </select>
//           {formErrors.functionId && (
//             <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.functionId}</span>
//           )}
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Sub-section:</label>
//           <input
//             value={selectedFunction}
//             readOnly
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               backgroundColor: "#f5f5f5"
//             }}
//           />
//         </div>

//         <div className="modal-form-group">
//           <label style={{ fontSize: "0.875rem" }}>Section:</label>
//           <input
//             value={selectedSection}
//             readOnly
//             style={{
//               height: "32px",
//               fontSize: "0.875rem",
//               padding: "4px 8px",
//               backgroundColor: "#f5f5f5"
//             }}
//           />
//         </div>
//       </div>

//       {/* Description */}
//       <div className="modal-form-group">
//         <label style={{ fontSize: "0.875rem" }}>Description:</label>
//         <textarea
//           rows="2"
//           name="description"
//           value={formData.description}
//           onChange={handleChange}
//           placeholder="Detailed descriptions.."
//           style={{
//             fontSize: "0.875rem",
//             padding: "8px",
//             resize: "vertical",
//             border: formErrors.description ? "1px solid red" : "1px solid #ccc"
//           }}
//         />
//         {formErrors.description && (
//           <span style={{ color: "red", fontSize: "0.75rem" }}>{formErrors.description}</span>
//         )}
//       </div>

//       {/* Submit */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "flex-end",
//           gap: "10px",
//           marginTop: "1.5rem"
//         }}
//       >
//         <button
//           className="cancel-btn"
//           onClick={() => setShowModal(false)}
//         >
//           Cancel
//         </button>
//         <button className="submit-btn" onClick={handleSubmit}>
//           Submit Ticket
//         </button>
//       </div>
//     </div>
//   </Box>
// </Modal>

//       {/* <Modal open={showModal} onClose={() => setShowModal(false)}>
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             width: { xs: "90%", sm: 600 },
//             maxHeight: "90vh",
//             overflowY: "auto",
//             bgcolor: "background.paper",
//             boxShadow: 24,
//             borderRadius: 3,
//             p: 4
//           }}
//         >
//           <button
//             onClick={() => setShowModal(false)}
//             style={{
//               position: "absolute",
//               top: 6,
//               right: 12,
//               background: "transparent",
//               border: "none",
//               fontSize: "1.25rem",
//               cursor: "pointer"
//             }}
//             aria-label="Close"
//           >
//             ×
//           </button>
//           <div className="modal-form-container">
//             <h2 className="modal-title">New Ticket</h2>
//             <div className="modal-form-row">
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>First Name:</label>
//                 <input
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   required
//                   placeholder="Enter first name"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Last Name:</label>
//                 <input
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleChange}
//                   required
//                   placeholder="Enter last name"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="modal-form-row">
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Phone Number:</label>
//                 <input
//                   type="tel"
//                   name="phoneNumber"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   required
//                   placeholder="Enter phone number"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>National Identification Number:</label>
//                 <input
//                   name="nidaNumber"
//                   value={formData.nidaNumber}
//                   onChange={handleChange}
//                   placeholder="Enter NIN number"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="modal-form-row">
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Requester:</label>
//                 <select
//                   name="category"
//                   onChange={handleChange}
//                   required
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     width: "100%"
//                   }}
//                 >
//                   <option value="">Select..</option>
//                   <option value="Employer">Employer</option>
//                   <option value="Employee">Employee</option>
//                 </select>
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Institution:</label>
//                 <input
//                   name="institution"
//                   value={formData.institution}
//                   onChange={handleChange}
//                   required
//                   placeholder="Enter Institution"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="modal-form-row">
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Region:</label>
//                 <input
//                   name="region"
//                   value={formData.region}
//                   onChange={handleChange}
//                   required
//                   placeholder="Enter region"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>District:</label>
//                 <input
//                   name="district"
//                   value={formData.district}
//                   onChange={handleChange}
//                   placeholder="Enter district"
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px"
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="modal-form-row">
//               <div className="modal-form-group" style={{ flex: 1 }}>
//                 <label style={{ fontSize: "0.875rem" }}>Category:</label>
//                 <select
//                   name="category"
//                   onChange={handleChange}
//                   required
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     width: "100%"
//                   }}
//                 >
//                   <option value="">Select Category</option>
//                   <option value="Inquiry">Inquiry</option>
//                   <option value="Complaint">Complaint</option>
//                   <option value="Suggestion">Suggestion</option>
//                   <option value="Compliment">Compliment</option>
//                 </select>
//               </div>
//               <div className="modal-form-group" style={{ flex: 1 }}>
//                 <label style={{ fontSize: "0.875rem" }}>Channel:</label>
//                 <select
//                   name="functionId"
//                   value={formData.functionId}
//                   onChange={handleChange}
//                   required
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     width: "100%"
//                   }}
//                 >
//                   <option value="">Select Channel</option>
//                   <option value="Call">Call</option>
//                   <option value="Email">Email</option>
//                 </select>
//               </div>
//             </div>
//             <div className="modal-form-row">
//               <div className="modal-form-group" style={{ flex: 1 }}>
//                 <label style={{ fontSize: "0.875rem" }}>Subject:</label>
//                 <select
//                   name="functionId"
//                   value={formData.functionId}
//                   onChange={handleChange}
//                   required
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     width: "100%"
//                   }}
//                 >
//                   <option value="">Select Subject</option>
//                   {functionData.map((item) => (
//                     <option key={item.id} value={item.id}>
//                       {item.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Sub-section:</label>
//                 <input
//                   value={selectedFunction}
//                   readOnly
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     backgroundColor: "#f5f5f5"
//                   }}
//                 />
//               </div>
//               <div className="modal-form-group">
//                 <label style={{ fontSize: "0.875rem" }}>Section:</label>
//                 <input
//                   value={selectedSection}
//                   readOnly
//                   style={{
//                     height: "32px",
//                     fontSize: "0.875rem",
//                     padding: "4px 8px",
//                     backgroundColor: "#f5f5f5"
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="modal-form-group">
//               <label style={{ fontSize: "0.875rem" }}>Description:</label>
//               <textarea
//                 rows="2"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 placeholder="Detailed descriptions.."
//                 required
//                 style={{
//                   fontSize: "0.875rem",
//                   padding: "8px",
//                   resize: "vertical"
//                 }}
//               />
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: "10px",
//                 marginTop: "1.5rem"
//               }}
//             >
//               <button
//                 className="cancel-btn"
//                 onClick={() => setShowModal(false)}
//               >
//                 Cancel
//               </button>
//               <button className="submit-btn" onClick={handleSubmit}>
//                 Submit Ticket
//               </button>
//             </div>
//           </div>
//         </Box>
//       </Modal> */}

//       {/* Ticket Details Modal */}
//       <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             width: { xs: "90%", sm: 500 },
//             maxHeight: "80vh",
//             overflowY: "auto",
//             bgcolor: "background.paper",
//             boxShadow: 24,
//             borderRadius: 2,
//             p: 3
//           }}
//         >
//           {selectedTicket && (
//             <>
//               <Typography
//                 variant="h5"
//                 sx={{ fontWeight: "bold", color: "#1976d2" }}
//               >
//                 Tickets Details
//               </Typography>
//               <Divider sx={{ mb: 2 }} />
//               <Grid container spacing={2}>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Name:</strong>{" "}
//                     {`${selectedTicket.first_name || "N/A"} ${
//                       selectedTicket.middle_name || " "
//                     } ${selectedTicket.last_name || "N/A"}`}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Phone:</strong>{" "}
//                     {selectedTicket.phone_number || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>NIN:</strong> {selectedTicket.nida_number || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Employer:</strong>{" "}
//                     {selectedTicket.employer || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Region:</strong> {selectedTicket.region || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>District:</strong>{" "}
//                     {selectedTicket.district || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Category:</strong> {selectedTicket.category || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Subject:</strong>{" "}
//                     {selectedTicket.functionData?.name || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Section:</strong>{" "}
//                     {selectedTicket.functionData?.parentFunction?.section?.name || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Sub-section:</strong>{" "}
//                     {selectedTicket.functionData?.parentFunction?.name || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Channel:</strong> {selectedTicket.channel || "N/A"}
//                   </Typography>
//                 </Grid>
//                 {/* <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Complaint Type:</strong>{" "}
//                     {selectedTicket.complaintType || "Unrated"}
//                   </Typography>
//                 </Grid> */}
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Rated:</strong>{" "}
//                     <span
//                       style={{
//                         color:
//                           selectedTicket.complaint_type === "Major"
//                             ? "red"
//                             : selectedTicket.complaint_type === "Minor"
//                             ? "orange"
//                             : "inherit"
//                       }}
//                     >
//                       {selectedTicket.complaint_type || "Unrated"}
//                     </span>
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Status:</strong>{" "}
//                     <span
//                       style={{
//                         color:
//                           selectedTicket.status === "Open"
//                             ? "green"
//                             : selectedTicket.status === "Closed"
//                             ? "gray"
//                             : "blue"
//                       }}
//                     >
//                       {selectedTicket.status || "N/A"}
//                     </span>
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Assigned To:</strong>{" "}
//                     {selectedTicket.assigned_to_id || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Assigned Role:</strong>{" "}
//                     {selectedTicket.assigned_to_role || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Created By:</strong>{" "}
//                     {selectedTicket?.createdBy?.name || "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Typography>
//                     <strong>Created At:</strong>{" "}
//                     {selectedTicket.created_at
//                       ? new Date(selectedTicket.created_at).toLocaleString(
//                           "en-US",
//                           {
//                             month: "numeric",
//                             day: "numeric",
//                             year: "numeric",
//                             hour: "numeric",
//                             minute: "2-digit",
//                             hour12: true
//                           }
//                         )
//                       : "N/A"}
//                   </Typography>
//                 </Grid>
//                 <Grid item xs={12}>
//                   <Typography>
//                     <strong>Description:</strong>{" "}
//                     {selectedTicket.description || "N/A"}
//                   </Typography>
//                 </Grid>
//               </Grid>
//               <Box sx={{ mt: 3, textAlign: "right" }}>
//                 <Button
//                   variant="contained"
//                   color="primary"
//                   onClick={() => setShowDetailsModal(false)}
//                 >
//                   Close
//                 </Button>
//               </Box>
//             </>
//           )}
//         </Box>
//       </Modal>

//       {/* Column Selector Modal */}
//       <ColumnSelector
//         open={columnModalOpen}
//         onClose={() => setColumnModalOpen(false)}
//         data={customerTickets}
//         onColumnsChange={setActiveColumns} // Receive selected columns from ColumnSelector
//       />

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={handleSnackbarClose}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>

//       {modal.isOpen && (
//   <div className="modal-overlay">
//     <div className={`modal-content ${modal.type}`}>
//       <h3>{modal.type === 'success' ? 'Success' : 'Error'}</h3>
//       <p>{modal.message}</p>
//       <button onClick={closeModal} className="modal-close-button">
//         Close
//       </button>
//     </div>
//   </div>
// )}

//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import {
  MdOutlineSupportAgent,
  MdCloudQueue,
  MdOutlinePhoneInTalk,
  MdOutlineEmail,
  MdAutoAwesomeMotion,
  MdDisabledVisible,
} from "react-icons/md";
import { FaUsersLine } from "react-icons/fa6";
import { GrLineChart } from "react-icons/gr";
// import "./CRMDashboard.css";
import "./crm-agent-dashboard.css";
import { baseURL } from "../../../../config";

const Crm = () => {
  const [agentData, setAgentData] = useState({
    agentActivity: {
      "Open Tickets": 0,
      "In Progress": 0,
      "Closed Tickets": 0,
      "Overdue": 0,
      "Total": 0,
    },
    ticketQueue: {
      "New Tickets": 0,
      "Assigned": 0,
      "In/Hour": 0,
      "Resolved/Hour": 0,
      "Total": 0,
    },
    ticketWait: {
      "Longest Wait": "00:00",
      "Avg Wait": "00:00",
      "Max Wait": "00:00",
      "Pending": 0,
      "Total": 0,
    },
    unresolvedTickets: {
      "Last Hour": 0,
      "Avg Delay": "00:00",
      "Max Delay": "00:00",
      "SLA Breaches": 0,
      "Total": 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!userId || !token) {
      setError("Please log in to view the dashboard.");
      setLoading(false);
      return;
    }

    fetchDashboardData(userId, token);
  }, [userId, token]);

  const fetchDashboardData = async (userId, token) => {
    try {
      const response = await fetch(`${baseURL}/ticket/count/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const stats = data.ticketStats;

      console.log("Fetched ticketStats:", stats);

      setAgentData({
        agentActivity: {
          "Open Tickets": stats.open || 0,
          "In Progress": stats.inProgress || 0,
          "Closed Tickets": stats.closed || 0,
          "Overdue": stats.overdue || 0,
          "Total": stats.total || 0,
        },
        ticketQueue: {
          "New Tickets": stats.newTickets || 0,
          "Assigned": stats.assigned || 0,
          "In/Hour": stats.inHour || 0,
          "Resolved/Hour": stats.resolvedHour || 0,
          "Total": stats.total || 0,
        },
        ticketWait: {
          "Longest Wait": stats.longestWait || "00:00",
          "Avg Wait": stats.avgWait || "00:00",
          "Max Wait": stats.maxWait || "00:00",
          "Pending": stats.pending || 0,
          "Total": stats.total || 0,
        },
        unresolvedTickets: {
          "Last Hour": stats.lastHour || 0,
          "Avg Delay": stats.avgDelay || "00:00",
          "Max Delay": stats.maxDelay || "00:00",
          "SLA Breaches": stats.slaBreaches || 0,
          "Total": stats.overdue || 0,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, data, color, icon }) => (
    <div className="card">
      <div className="card-header">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="card-body" style={{ backgroundColor: color }}>
        <div className="card-data">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="data-item">
              <h4>{key}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="title">Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h3 className="title">Error: {error}</h3>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="title">CRM Dashboard</h3>
      <div className="crm-dashboard">
        <div className="crm-cards-container">
          <Card
            title="Team Activity"
            data={agentData.agentActivity}
            color={role === "agent" ? "#BCE8BE" : "#ffe599"}
            icon={<FaUsersLine fontSize={32} />}
          />
          <Card
            title="Agent Performance"
            data={agentData.ticketQueue}
            color={role === "agent" ? "#D6E4C7" : "#97c5f0"}
            icon={<GrLineChart fontSize={32} />}
          />
        </div>
        <div className="crm-cards-container">
          <Card
            title="Overdue Metrics"
            data={agentData.ticketWait}
            color={role === "agent" ? "#C2E2E5" : "#b6d7a8"}
            icon={<MdDisabledVisible fontSize={32} />}
          />
          <Card
            title="Resolution Metrics"
            data={agentData.unresolvedTickets}
            color="#E1D5D5"
            icon={<MdAutoAwesomeMotion fontSize={32} />}
          />
        </div>
      </div>
    </div>
  );
};

export default Crm;
