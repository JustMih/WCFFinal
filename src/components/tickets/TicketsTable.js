import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Chip,
  Pagination,
  TextField,
  InputAdornment
} from '@mui/material';
import { FaEye, FaSearch } from 'react-icons/fa';
import { baseURL } from '../../config';

export default function TicketsTable() {
  const { category, type } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, [category, type, page, search]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      const response = await fetch(
        `${baseURL}/reviewer/tickets/${category}/${type}?page=${page}&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.tickets);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
            navigate(`/reviewer/ticket/${ticketId}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'in progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'complaint':
        return 'error';
      case 'inquiry':
        return 'info';
      case 'suggestion':
        return 'warning';
      case 'complement':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading tickets...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          {type.charAt(0).toUpperCase() + type.slice(1)} Tickets
        </Typography>
        <TextField
          size="small"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch />
              </InputAdornment>
            )
          }}
          sx={{ '& .MuiOutlinedInput-root': { height: '36px' } }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">ID</TableCell>
              <TableCell padding="checkbox">Name</TableCell>
              <TableCell padding="checkbox">Phone</TableCell>
              <TableCell padding="checkbox">Category</TableCell>
              <TableCell padding="checkbox">Status</TableCell>
              <TableCell padding="checkbox">Created At</TableCell>
              <TableCell padding="checkbox">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} hover>
                <TableCell padding="checkbox">{ticket.id}</TableCell>
                <TableCell padding="checkbox">
                  {`${ticket.firstName || ''} ${ticket.middleName || ''} ${ticket.lastName || ''}`}
                </TableCell>
                <TableCell padding="checkbox">{ticket.phone_number || 'N/A'}</TableCell>
                <TableCell padding="checkbox">
                  <Chip
                    label={ticket.category || 'N/A'}
                    color={getCategoryColor(ticket.category)}
                    size="small"
                    sx={{ height: '24px' }}
                  />
                </TableCell>
                <TableCell padding="checkbox">
                  <Chip
                    label={ticket.status || 'N/A'}
                    color={getStatusColor(ticket.status)}
                    size="small"
                    sx={{ height: '24px' }}
                  />
                </TableCell>
                <TableCell padding="checkbox">
                  {new Date(ticket.createdAt).toLocaleString()}
                </TableCell>
                <TableCell padding="checkbox">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewTicket(ticket.id)}
                      sx={{ padding: '4px' }}
                    >
                      <FaEye fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          size="small"
        />
      </Box>
    </Box>
  );
} 