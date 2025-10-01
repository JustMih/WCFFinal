import React from 'react';
import './InstagramStats.css';

const InstagramStats = ({ stats }) => {
  if (!stats) return null;

  const { comments, messages, total } = stats;

  return (
    <div className="instagram-stats">
      <div className="stats-header">
        <h3>Instagram Statistics</h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card comments">
          <div className="stat-header">
            <h4>Comments</h4>
            <span className="stat-icon">💬</span>
          </div>
          <div className="stat-numbers">
            <div className="stat-item">
              <span className="label">Total:</span>
              <span className="value">{comments.total}</span>
            </div>
            <div className="stat-item">
              <span className="label">Unread:</span>
              <span className="value unread">{comments.unread}</span>
            </div>
            <div className="stat-item">
              <span className="label">Read:</span>
              <span className="value read">{comments.read}</span>
            </div>
            <div className="stat-item">
              <span className="label">Replied:</span>
              <span className="value replied">{comments.replied}</span>
            </div>
          </div>
        </div>

        <div className="stat-card messages">
          <div className="stat-header">
            <h4>Messages</h4>
            <span className="stat-icon">📨</span>
          </div>
          <div className="stat-numbers">
            <div className="stat-item">
              <span className="label">Total:</span>
              <span className="value">{messages.total}</span>
            </div>
            <div className="stat-item">
              <span className="label">Unread:</span>
              <span className="value unread">{messages.unread}</span>
            </div>
            <div className="stat-item">
              <span className="label">Read:</span>
              <span className="value read">{messages.read}</span>
            </div>
            <div className="stat-item">
              <span className="label">Replied:</span>
              <span className="value replied">{messages.replied}</span>
            </div>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-header">
            <h4>Total</h4>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-numbers">
            <div className="stat-item">
              <span className="label">Total:</span>
              <span className="value">{total.total}</span>
            </div>
            <div className="stat-item">
              <span className="label">Unread:</span>
              <span className="value unread">{total.unread}</span>
            </div>
            <div className="stat-item">
              <span className="label">Read:</span>
              <span className="value read">{total.read}</span>
            </div>
            <div className="stat-item">
              <span className="label">Replied:</span>
              <span className="value replied">{total.replied}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramStats;
