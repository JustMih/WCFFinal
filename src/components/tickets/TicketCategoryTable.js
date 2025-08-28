import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { FaEye, FaSearch } from 'react-icons/fa';
import { baseURL } from '../../config';

export default function TicketCategoryTable({ filter }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentType, setCurrentType] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    if (filter) {
      setCurrentCategory(filter.category);
      setCurrentType(filter.type);
      fetchTickets(filter.category, filter.type);
    } else {
      // Extract category and type from the path
      const pathParts = location.pathname.split('/');
      const category = pathParts[2];
      const type = pathParts[3];
      
      setCurrentCategory(category);
      setCurrentType(type);
      fetchTickets(category, type);
    }
  }, [location.pathname, page, search, filter]);

  const fetchTickets = async (category, type) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('role');

      console.log('Auth token:', token ? 'Present' : 'Missing');
      console.log('User ID:', userId);
      console.log('Role:', role);

      if (!category || !type) {
        console.error('Missing category or type:', { category, type });
        throw new Error('Invalid route parameters');
      }

      let url;
          if (role === 'reviewer') {
      url = `${baseURL}/reviewer/tickets/${category}/${type}?page=${page}&search=${search}`;
      } else {
        url = `${baseURL}/ticket/${type}/${userId}?page=${page}&search=${search}`;
      }

      console.log('Fetching tickets from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      if (!data || !Array.isArray(data.tickets)) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid response format');
      }

      setTickets(data.tickets);
      setTotalPages(Math.ceil((data.totalTickets || 0) / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
    const role = localStorage.getItem('role');
    navigate(`/${role}/ticket/${ticketId}`);
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
    console.log('Rendering loading state');
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Please check your connection and try again
        </Typography>
      </Box>
    );
  }

  console.log('Rendering table with tickets:', tickets);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          {currentType.charAt(0).toUpperCase() + currentType.slice(1)} Tickets
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
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No tickets found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
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
              ))
            )}
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