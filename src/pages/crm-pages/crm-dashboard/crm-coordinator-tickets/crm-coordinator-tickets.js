import TicketDetailsModal from '../../../components/TicketDetailsModal';

const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedTicket, setSelectedTicket] = useState(null);
const [assignmentHistory, setAssignmentHistory] = useState([]);

const openModal = async (ticket) => {
  setSelectedTicket(ticket);
  setIsModalOpen(true);
  // Fetch assignment history for the ticket
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setAssignmentHistory(Array.isArray(data) ? data : []);
  } catch (err) {
    setAssignmentHistory([]);
  }
};

<TicketDetailsModal
  open={isModalOpen}
  onClose={() => { setIsModalOpen(false); setSelectedTicket(null); setAssignmentHistory([]); }}
  selectedTicket={selectedTicket}
  assignmentHistory={assignmentHistory}
  handleConvertOrForward={handleConvertOrForward}
  handleCategoryChange={(ticketId, value) => setConvertCategory((prev) => ({ ...prev, [ticketId]: value }))}
  handleUnitChange={(ticketId, value) => setForwardUnit((prev) => ({ ...prev, [ticketId]: value }))}
  categories={categories}
  units={units}
  convertCategory={convertCategory}
  forwardUnit={forwardUnit}
  refreshTickets={fetchTickets}
  setSnackbar={setSnackbar}
/> 