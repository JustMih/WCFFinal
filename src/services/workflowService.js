import { baseURL } from '../config';

// Get workflow status for a ticket
export const getWorkflowStatus = async (ticketId) => {
  try {
    const token = localStorage.getItem('authToken');
    // const response = await fetch(`${baseURL}/reviewer/workflow/${ticketId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to get workflow status');
    }
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    throw error;
  }
};

// Get available users for a specific role
export const getAvailableUsers = async (role) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/reviewer/workflow/users/${role}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to get available users');
    }
  } catch (error) {
    console.error('Error fetching available users:', error);
    throw error;
  }
};

// Assign to attendee
export const assignToAttendee = async (ticketId, attendeeId, justification) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/workflow/${ticketId}/assign-attendee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        attendeeId,
        justification
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Ticket assigned successfully',
        data: data.data
      };
    } else {
      throw new Error(data.message || 'Failed to assign ticket to attendee');
    }
  } catch (error) {
    console.error('Error assigning to attendee:', error);
    throw error;
  }
};

// Attend and close ticket
export const attendAndClose = async (ticketId, resolutionType, resolutionDetails, attachment = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('resolution_type', resolutionType);
    formData.append('resolution_details', resolutionDetails);
    
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await fetch(`${baseURL}/workflow/${ticketId}/attend-and-close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Ticket attended and closed successfully',
        data: data.data
      };
    } else {
      throw new Error(data.message || 'Failed to attend and close ticket');
    }
  } catch (error) {
    console.error('Error attending and closing ticket:', error);
    throw error;
  }
};

// Recommend action
export const recommendAction = async (ticketId, recommendation, justification) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/workflow/${ticketId}/attend-and-recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recommendation,
        evidence_url: justification
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Recommendation submitted successfully',
        data: data.data
      };
    } else {
      throw new Error(data.message || 'Failed to recommend action');
    }
  } catch (error) {
    console.error('Error recommending action:', error);
    throw error;
  }
};

// Upload evidence
export const uploadEvidence = async (ticketId, evidence, description) => {
  try {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('evidence', evidence);
    formData.append('description', description);
    formData.append('userId', localStorage.getItem('userId'));

    const response = await fetch(`${baseURL}/workflow/${ticketId}/upload-evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to upload evidence');
    }
  } catch (error) {
    console.error('Error uploading evidence:', error);
    throw error;
  }
};

// Approve action
export const approveAction = async (ticketId, approval, justification) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/workflow/${ticketId}/approve-and-close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        approval,
        justification,
        userId: localStorage.getItem('userId')
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to approve action');
    }
  } catch (error) {
    console.error('Error approving action:', error);
    throw error;
  }
};

// Reverse action
export const reverseAction = async (ticketId, reason) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/workflow/${ticketId}/reverse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason,
        userId: localStorage.getItem('userId')
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to reverse action');
    }
  } catch (error) {
    console.error('Error reversing action:', error);
    throw error;
  }
};

// Review action
export const reviewAction = async (ticketId, review, comments) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${baseURL}/workflow/${ticketId}/review-and-recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        review,
        comments,
        userId: localStorage.getItem('userId')
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to review action');
    }
  } catch (error) {
    console.error('Error reviewing action:', error);
    throw error;
  }
}; 