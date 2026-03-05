import React, { useState, useEffect } from 'react';
import { instagramApi } from '../../api/instagramApi';
import InstagramStats from './InstagramStats';
import InstagramDataList from './InstagramDataList';
import ReplyModal from './ReplyModal';
import './InstagramManagement.css';

const InstagramManagement = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all', // all, comments, messages
    status: 'all', // all, unread, read, replied
    limit: 50
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [replyModal, setReplyModal] = useState({ show: false, item: null });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await instagramApi.getAllData(filters);
      setData(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Instagram data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await instagramApi.getStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchData();
    fetchStats();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle marking items as read
  const handleMarkAsRead = async (item) => {
    try {
      if (item.type === 'comment') {
        await instagramApi.markCommentAsRead(item.id);
      } else {
        await instagramApi.markMessageAsRead(item.id);
      }
      
      // Update local state
      setData(prev => prev.map(d => 
        d.id === item.id ? { ...d, read: true, unread: false } : d
      ));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Handle replying to items
  const handleReply = (item) => {
    console.log('Opening reply modal for item:', item);
    console.log('Item type:', item.type);
    console.log('Item ID:', item.id);
    setReplyModal({ show: true, item });
    console.log('Reply modal state set to show: true');
  };

  // Handle reply submission
  const handleReplySubmit = async (replyText) => {
    try {
      const { item } = replyModal;
      if (item.type === 'comment') {
        await instagramApi.replyToComment(item.id, replyText);
      } else {
        await instagramApi.replyToMessage(item.id, replyText);
      }
      
      // Update local state
      setData(prev => prev.map(d => 
        d.id === item.id ? { 
          ...d, 
          replied: true, 
          reply: replyText,
          read: true, 
          unread: false 
        } : d
      ));
      
      // Close modal and refresh stats
      setReplyModal({ show: false, item: null });
      fetchStats();
    } catch (err) {
      console.error('Error submitting reply:', err);
      throw err;
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const commentIds = selectedItems.filter(item => item.type === 'comment').map(item => item.id);
      const messageIds = selectedItems.filter(item => item.type === 'message').map(item => item.id);
      
      if (commentIds.length > 0) {
        await instagramApi.markMultipleAsRead(commentIds, 'comments');
      }
      if (messageIds.length > 0) {
        await instagramApi.markMultipleAsRead(messageIds, 'messages');
      }
      
      // Update local state
      setData(prev => prev.map(d => 
        selectedItems.some(item => item.id === d.id) 
          ? { ...d, read: true, unread: false }
          : d
      ));
      
      setSelectedItems([]);
      fetchStats();
    } catch (err) {
      console.error('Error bulk marking as read:', err);
    }
  };

  // Handle item selection
  const handleItemSelect = (item, selected) => {
    if (selected) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  // Handle select all
  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedItems([...data]);
    } else {
      setSelectedItems([]);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="instagram-management">
        <div className="loading">Loading Instagram data...</div>
      </div>
    );
  }

  return (
    <div className="instagram-management">
      <div className="instagram-header">
        <h1>Instagram Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {stats && <InstagramStats stats={stats} />}

      <div className="instagram-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange({ type: e.target.value })}
          >
            <option value="all">All</option>
            <option value="comments">Comments</option>
            <option value="messages">Messages</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange({ status: e.target.value })}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Limit:</label>
          <select 
            value={filters.limit} 
            onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedItems.length} items selected</span>
          <button 
            className="btn btn-secondary"
            onClick={handleBulkMarkAsRead}
          >
            Mark as Read
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <InstagramDataList
        data={data}
        loading={loading}
        selectedItems={selectedItems}
        onItemSelect={handleItemSelect}
        onSelectAll={handleSelectAll}
        onMarkAsRead={handleMarkAsRead}
        onReply={handleReply}
      />

      {replyModal.show && (
        <ReplyModal
          item={replyModal.item}
          onSubmit={handleReplySubmit}
          onClose={() => setReplyModal({ show: false, item: null })}
        />
      )}
      
      {/* Debug info */}
      {replyModal.show && (
        <div style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          background: 'blue',
          color: 'white',
          padding: '10px',
          zIndex: 10001,
          borderRadius: '5px'
        }}>
          Modal State: {replyModal.show ? 'OPEN' : 'CLOSED'}
        </div>
      )}
      
      {/* Debug indicator */}
      {replyModal.show && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'red',
          color: 'white',
          padding: '10px',
          zIndex: 10001,
          borderRadius: '5px'
        }}>
          Reply Modal is Open
        </div>
      )}
    </div>
  );
};

export default InstagramManagement;
