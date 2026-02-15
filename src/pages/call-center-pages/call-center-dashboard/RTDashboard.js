import React from 'react'
import RealTimeMonitoringDashboard from './RealTimeMonitoringDashboard';

export default function RTDashboard() {
  const role = localStorage.getItem("role");
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      backgroundColor: '#f5f5f5'
    }}>
      {(role === "super-admin" || role === "admin") && (
        <RealTimeMonitoringDashboard />
      )}
      {role === "agent" && <RealTimeMonitoringDashboard/>}
      {role === "supervisor" && (<RealTimeMonitoringDashboard />)}
    </div>
  );
}
