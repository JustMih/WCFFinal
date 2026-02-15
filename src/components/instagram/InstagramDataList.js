import React from 'react';
import InstagramDataItem from './InstagramDataItem';
import './InstagramDataList.css';

const InstagramDataList = ({ 
  data, 
  loading, 
  selectedItems, 
  onItemSelect, 
  onSelectAll, 
  onMarkAsRead, 
  onReply 
}) => {
  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAllChange = (e) => {
    onSelectAll(e.target.checked);
  };

  if (loading && data.length === 0) {
    return (
      <div className="instagram-data-list">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="instagram-data-list">
        <div className="empty-state">
          <p>No Instagram data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instagram-data-list">
      <div className="list-header">
        <div className="select-all">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={handleSelectAllChange}
          />
          <span>Select All</span>
        </div>
        <div className="list-info">
          Showing {data.length} items
        </div>
      </div>

      <div className="data-items">
        {data.map((item) => (
          <InstagramDataItem
            key={`${item.type}-${item.id}`}
            item={item}
            selected={selectedItems.some(selected => selected.id === item.id)}
            onSelect={onItemSelect}
            onMarkAsRead={onMarkAsRead}
            onReply={onReply}
          />
        ))}
      </div>
    </div>
  );
};

export default InstagramDataList;
