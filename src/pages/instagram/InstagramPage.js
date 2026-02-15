import React from 'react';
import InstagramManagement from '../../components/instagram/InstagramManagement';
import './InstagramPage.css';

const InstagramPage = () => {
  return (
    <div className="instagram-page">
      <div className="page-header">
        <h1>Instagram Management</h1>
        <p>Manage Instagram comments and messages with reply tracking</p>
      </div>
      
      <InstagramManagement />
    </div>
  );
};

export default InstagramPage;
