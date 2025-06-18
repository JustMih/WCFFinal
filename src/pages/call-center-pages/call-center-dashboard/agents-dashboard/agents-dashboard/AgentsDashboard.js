import React, { useEffect } from 'react';

// Debug missed calls count
useEffect(() => {
  console.log("🔢 Current missed calls count:", missedCalls.length);
  console.log("📋 Current missed calls:", missedCalls);
}, [missedCalls]);

return ( 