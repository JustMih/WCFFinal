import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../config';

const WorkflowActionModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onActionComplete,
  userRole 
}) => {
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [workflowInfo, setWorkflowInfo] = useState(null);

  useEffect(() => {
    if (isOpen && ticket) {
      fetchWorkflowDetails();
    }
  }, [isOpen, ticket]);

  const fetchWorkflowDetails = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${baseURL}/workflow/ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkflowInfo(response.data.data.workflow);
    } catch (error) {
      console.error('Error fetching workflow details:', error);
    }
  };

  const handleAction = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    // Check file size before submitting (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (attachment && attachment.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of 10MB. Your file is ${(attachment.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // If attachment exists, use FormData; otherwise use JSON
      if (attachment) {
        const formData = new FormData();
        formData.append(
          action === 'recommend' ? 'recommendation_notes' : 
          action === 'reverse' ? 'reversal_reason' : 
          action === 'close' ? 'closure_notes' : 'notes',
          notes
        );

        // Add evidence URL for recommend action if it's a major complaint
        if (action === 'recommend' && ticket.complaint_type === 'Major') {
          formData.append('evidence_url', evidenceUrl);
        }

        // Add attachment
        formData.append('attachment', attachment);

        const response = await axios.post(
          `${baseURL}/workflow/ticket/${ticket.id}/${action}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000, // 60 seconds timeout for file uploads
            onUploadProgress: (progressEvent) => {
              // Optional: You can add progress indicator here
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          }
        );

        if (response.data.success) {
          onActionComplete(response.data);
          onClose();
        }
      } else {
        // No attachment - use JSON payload
        const payload = {
          [action === 'recommend' ? 'recommendation_notes' : 
           action === 'reverse' ? 'reversal_reason' : 
           action === 'close' ? 'closure_notes' : 'notes']: notes
        };

        // Add evidence URL for recommend action if it's a major complaint
        if (action === 'recommend' && ticket.complaint_type === 'Major') {
          payload.evidence_url = evidenceUrl;
        }

        const response = await axios.post(
          `${baseURL}/workflow/ticket/${ticket.id}/${action}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000 // 30 seconds timeout for regular requests
          }
        );

        if (response.data.success) {
          onActionComplete(response.data);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error processing action:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('NetworkError')) {
        setError('Network error: Please check your internet connection and try again. If the file is large, it may take longer to upload.');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('Request timeout: The file may be too large or the server is taking too long to respond. Please try again with a smaller file or check your connection.');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('File too large')) {
        setError('File too large: Maximum file size is 10MB. Please upload a smaller file.');
      } else {
        setError(error.response?.data?.message || error.message || 'An error occurred while processing your action');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableActions = () => {
    if (!workflowInfo || !userRole) return [];

    const actions = [];
    
    // Check if user can attend
    if (['head-of-unit', 'supervisor', 'attendee'].includes(userRole)) {
      actions.push({ value: 'attend', label: 'Attend to Ticket', icon: '📋' });
    }

    // Check if user can recommend
    if (['head-of-unit', 'supervisor', 'attendee'].includes(userRole)) {
      actions.push({ value: 'recommend', label: 'Recommend to Next Step', icon: '➡️' });
    }

    // Check if user can reverse
    if (['head-of-unit', 'supervisor', 'director-general'].includes(userRole)) {
      actions.push({ value: 'reverse', label: 'Reverse to Previous Step', icon: '⬅️' });
    }

    // Check if user can close
    if (['head-of-unit', 'director-general'].includes(userRole)) {
      actions.push({ value: 'close', label: 'Close Ticket', icon: '✅' });
    }

    return actions;
  };

  const getActionDescription = () => {
    switch (action) {
      case 'attend':
        return 'Mark this ticket as in progress and start working on it.';
      case 'recommend':
        return 'Submit your recommendation and move the ticket to the next step in the workflow.';
      case 'reverse':
        return 'Send this ticket back to the previous step in the workflow.';
      case 'close':
        return 'Finalize and close this ticket. This action cannot be undone.';
      default:
        return 'Select an action to perform on this ticket.';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Workflow Actions - {ticket?.ticket_id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Workflow Progress */}
        {workflowInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Workflow Progress</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-blue-600 mb-1">
                  <span>Step {workflowInfo.currentStep} of {workflowInfo.totalSteps}</span>
                  <span>{workflowInfo.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${workflowInfo.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <p><strong>Current Role:</strong> {workflowInfo.currentRole}</p>
              <p><strong>Next Role:</strong> {workflowInfo.nextRole || 'Final Step'}</p>
              <p><strong>Path:</strong> {workflowInfo.path}</p>
            </div>
          </div>
        )}

        {/* Action Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Action
          </label>
          <div className="grid grid-cols-2 gap-3">
            {getAvailableActions().map((actionOption) => (
              <button
                key={actionOption.value}
                onClick={() => setAction(actionOption.value)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  action === actionOption.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-lg mb-1">{actionOption.icon}</div>
                <div className="font-medium">{actionOption.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Description */}
        {action && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{getActionDescription()}</p>
          </div>
        )}

        {/* Notes Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {action === 'recommend' ? 'Recommendation Notes' :
             action === 'reverse' ? 'Reversal Reason' :
             action === 'close' ? 'Closure Notes' : 'Notes'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter your ${action === 'recommend' ? 'recommendation' : 
                         action === 'reverse' ? 'reversal reason' : 
                         action === 'close' ? 'closure notes' : 'notes'}...`}
          />
        </div>

        {/* Evidence Upload for Major Complaints */}
        {action === 'recommend' && ticket?.complaint_type === 'Major' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence URL (Required for Major Complaints)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/evidence.pdf"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload evidence to a file hosting service and provide the URL here.
            </p>
          </div>
        )}

        {/* Attachment Upload for Head of Unit / Manager / Director */}
        {['head-of-unit', 'manager', 'director', 'director-general', 'supervisor'].includes(userRole) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                if (file) {
                  // Check file size (10MB = 10 * 1024 * 1024 bytes)
                  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                  if (file.size > MAX_FILE_SIZE) {
                    setError(`File size exceeds the maximum limit of 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`);
                    e.target.value = ''; // Clear the input
                    setAttachment(null);
                    return;
                  }
                  setError(''); // Clear any previous errors
                  setAttachment(file);
                } else {
                  setAttachment(null);
                }
              }}
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {attachment && (
              <p className="mt-1 text-xs text-green-700">
                Selected file: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size: 10MB
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={!action || isLoading}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              !action || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : 'Execute Action'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowActionModal; 