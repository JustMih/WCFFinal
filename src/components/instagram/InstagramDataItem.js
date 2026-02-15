import React from 'react';
import './InstagramDataItem.css';

const InstagramDataItem = ({ 
  item, 
  selected, 
  onSelect, 
  onMarkAsRead, 
  onReply 
}) => {
  const handleSelect = (e) => {
    onSelect(item, e.target.checked);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(item);
  };

  const handleReply = () => {
    onReply(item);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadges = () => {
    const badges = [];
    
    if (item.unread) {
      badges.push(<span key="unread" className="badge unread">Unread</span>);
    }
    
    if (item.read) {
      badges.push(<span key="read" className="badge read">Read</span>);
    }
    
    if (item.replied) {
      badges.push(<span key="replied" className="badge replied">Replied</span>);
    }
    
    return badges;
  };

  const getItemIcon = () => {
    return item.type === 'comment' ? '💬' : '📨';
  };

  const getItemTitle = () => {
    if (item.type === 'comment') {
      return `Comment from @${item.from_username || 'Unknown'}`;
    } else {
      return `Message from @${item.sender_username || 'Unknown'}`;
    }
  };

  return (
    <div className={`instagram-data-item ${selected ? 'selected' : ''} ${item.unread ? 'unread' : ''}`}>
      <div className="item-header">
        <div className="item-select">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
          />
        </div>
        
        <div className="item-info">
          <div className="item-title">
            <span className="item-icon">{getItemIcon()}</span>
            <span className="item-type">{item.type === 'comment' ? 'Comment' : 'Message'}</span>
            <span className="item-id">#{item.id}</span>
          </div>
          
          <div className="item-meta">
            <span className="item-from">{getItemTitle()}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
        </div>
        
        <div className="item-status">
          {getStatusBadges()}
        </div>
      </div>

      <div className="item-content">
        <div className="item-text">
          {item.text || 'No text content'}
        </div>
        
        {item.reply && (
          <div className="item-reply">
            <div className="reply-header">
              <strong>Reply:</strong>
              <span className="reply-meta">
                by {item.replied_by} on {formatDate(item.replied_at)}
              </span>
            </div>
            <div className="reply-text">{item.reply}</div>
          </div>
        )}
      </div>

      <div className="item-actions">
        {item.unread && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={handleMarkAsRead}
          >
            Mark as Read
          </button>
        )}
        
        <button 
          className="btn btn-sm btn-secondary"
          onClick={handleReply}
        >
          {item.replied ? 'View Reply' : 'Reply'}
        </button>
      </div>
    </div>
  );
};

export default InstagramDataItem;
