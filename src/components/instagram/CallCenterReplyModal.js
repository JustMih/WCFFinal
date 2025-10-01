import React, { useState, useEffect, useRef } from 'react';
import './CallCenterReplyModal.css';

const CallCenterReplyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  item, 
  loading = false, 
  error = null 
}) => {
  const [replyText, setReplyText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef(null);

  // Auto-focus the textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReplyText(item?.reply || '');
      setShowSuccess(false);
    } else {
      setReplyText('');
      setShowSuccess(false);
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onSubmit(replyText.trim());
      // Show success message
      setShowSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="call-center-reply-modal-overlay" onClick={handleClose}>
      <div className="call-center-reply-modal" onClick={(e) => e.stopPropagation()}>
        <div className="call-center-modal-header">
          <h3 className="call-center-modal-title">
            {item?.replied ? 'Edit Reply' : 'Reply to '}
            {item?.type === 'comment' ? 'Comment' : 'Message'}
          </h3>
          <button 
            className="call-center-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="call-center-modal-content">
          {/* Chat-like reply interface */}
          <div className="chat-container">
            <div className="chat-messages">
              {/* Original message on the left */}
              <div className="message-bubble message-left">
                <div className="message-sender">@{item?.sender}</div>
                <div className="message-content">{item?.text || 'No text content'}</div>
                <div className="message-time">
                  {item?.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </div>
              </div>

              {/* Reply preview on the right */}
              {replyText.trim() && (
                <div className="message-bubble message-right">
                  <div className="message-sender">You</div>
                  <div className="message-content">{replyText}</div>
                  <div className="message-time">Now</div>
                </div>
              )}
            </div>

            {/* Reply form */}
            <form onSubmit={handleSubmit} className="reply-form">
              <div className="form-group">
                <textarea
                  ref={textareaRef}
                  id="reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={3}
                  disabled={loading}
                  required
                />
              </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {showSuccess && (
              <div className="success-message">
                ✅ Reply sent successfully!
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
                  disabled={loading || !replyText.trim()}
                >
                  {loading ? 'Submitting...' : (item?.replied ? 'Update Reply' : 'Send Reply')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallCenterReplyModal;
