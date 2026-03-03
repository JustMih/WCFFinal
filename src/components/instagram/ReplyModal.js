import React, { useState, useEffect, useRef } from 'react';
import './ReplyModal.css';

const ReplyModal = ({ item, onSubmit, onClose }) => {
  const [reply, setReply] = useState(item.reply || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  console.log('ReplyModal rendered with item:', item);
  console.log('ReplyModal show state:', item ? 'Item provided' : 'No item');

  // Auto-focus the textarea when modal opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      setError('Reply text is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(reply.trim());
    } catch (err) {
      setError('Failed to submit reply');
      console.error('Reply submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="reply-modal-overlay" onClick={handleClose}>
      <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {item.replied ? 'View/Edit Reply' : 'Reply to '}
            {item.type === 'comment' ? 'Comment' : 'Message'}
          </h3>
          <button 
            className="close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="original-content">
            <div className="content-header">
              <strong>Original {item.type === 'comment' ? 'Comment' : 'Message'}:</strong>
              <span className="content-meta">
                from @{item.type === 'comment' ? item.from_username : item.sender_username} 
                on {formatDate(item.created_at)}
              </span>
            </div>
            <div className="content-text">
              {item.text || 'No text content'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="reply-form">
            <div className="form-group">
              <label htmlFor="reply">
                {item.replied ? 'Edit Reply:' : 'Your Reply:'}
              </label>
              <textarea
                ref={textareaRef}
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply here..."
                rows={4}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !reply.trim()}
              >
                {loading ? 'Submitting...' : (item.replied ? 'Update Reply' : 'Send Reply')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
