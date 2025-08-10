import TicketActions from '../../../components/coordinator/TicketActions';

// Inside your table component or data grid
const columns = [
  // ... other columns ...
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    renderCell: (params) => (
      <TicketActions 
        ticket={params.row} 
        onTicketUpdate={(updatedTicket) => {
          // Update your ticket list/state here
          // For example:
          setTickets(tickets.map(ticket => 
            ticket.id === updatedTicket.id ? updatedTicket : ticket
          ));
        }} 
      />
    )
  }
]; 