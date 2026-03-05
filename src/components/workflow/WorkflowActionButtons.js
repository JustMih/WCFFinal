import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Assignment,
  ArrowBack,
  CheckCircle,
  Send,
  Upload,
  Visibility,
  Edit,
  RateReview,
  ChangeCircle,
  Close
} from '@mui/icons-material';
import { 
  ACTIONS, 
  ROLE_PERMISSIONS, 
  WORKFLOW_PATHS, 
  PermissionManager 
} from '../../utils/permissions';
import {
  useRateComplaint,
  useChangeTicketType,
  useAssignTicket,
  useReverseTicket,
  useAttendTicket,
  useRecommendTicket,
  useUploadEvidence,
  useApproveTicket,
  useCloseTicket
} from '../../api/ticketApi';

const WorkflowActionButtons = ({ 
  ticket, 
  userRole, 
  userUnitSection, // Add this prop to receive user's unit_section
  onActionComplete,
  showLabels = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionDialog, setActionDialog] = useState(null);
  const [actionData, setActionData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Dialog states for different actions
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [typeChangeDialogOpen, setTypeChangeDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [recommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  // TanStack Query mutations
  const rateComplaintMutation = useRateComplaint();
  const changeTypeMutation = useChangeTicketType();
  const assignTicketMutation = useAssignTicket();
  const reverseTicketMutation = useReverseTicket();
  const attendTicketMutation = useAttendTicket();
  const recommendTicketMutation = useRecommendTicket();
  const uploadEvidenceMutation = useUploadEvidence();
  const approveTicketMutation = useApproveTicket();
  const closeTicketMutation = useCloseTicket();

  // Initialize permission manager with user unit section info
  const permissionManager = new PermissionManager(userRole, userUnitSection);

  // Get current workflow stage based on ticket state
  const getCurrentWorkflowStage = () => {
    if (!ticket?.workflow_path) return 'initial';
    
    const workflow = WORKFLOW_PATHS[ticket.workflow_path];
    if (!workflow) return 'initial';
    
    const currentStep = ticket.current_workflow_step || 1;
    const currentRole = ticket.workflow_current_role;
    
    // Map workflow step to stage
    if (currentRole === 'reviewer') return 'reviewer_review';
    if (currentRole === 'head-of-unit') return 'head_of_unit_review';
    if (currentRole === 'director') return 'director_review';
    if (currentRole === 'manager') return 'manager_review';
    if (currentRole === 'attendee') return 'attendee_processing';
    if (currentRole === 'director-general') return 'dg_approval';
    
    return 'initial';
  };

  // Check if ticket is closed
  const isTicketClosed = ticket?.status === 'Closed';

  // Get available actions based on user role, ticket status, and workflow stage
  const getAvailableActions = () => {
    if (isTicketClosed) return []; // No actions for closed tickets

    const currentStage = getCurrentWorkflowStage();
    
    // Debug close permission for reviewers
    if (userRole === 'reviewer' && ticket?.category === 'Complaint') {
      permissionManager.debugClosePermission(ticket);
    }
    
    // Use permission manager to get available actions
    const availableActions = permissionManager.getAvailableActions(ticket, currentStage);
    
    // Convert action keys to action objects with UI properties
    return availableActions.map(action => {
      switch (action) {
        case ACTIONS.RATE_COMPLAINT:
          return {
            key: 'rate',
            label: 'Rate Complaint',
            icon: <RateReview />,
            color: 'primary',
            action: ACTIONS.RATE_COMPLAINT,
            description: 'Rate complaint as Minor or Major',
            required: true
          };

        case ACTIONS.CHANGE_TYPE:
          return {
            key: 'change-type',
            label: 'Convert to Inquiry',
            icon: <ChangeCircle />,
            color: 'secondary',
            action: ACTIONS.CHANGE_TYPE,
            description: 'Convert complaint to inquiry',
            required: false
          };

        case ACTIONS.ASSIGN_TICKET:
          return {
            key: 'assign',
            label: 'Assign Ticket',
            icon: <Assignment />,
            color: 'info',
            action: ACTIONS.ASSIGN_TICKET,
            description: `Assign to ${ROLE_PERMISSIONS[userRole]?.can_assign_to?.join(' or ') || 'appropriate role'}`,
            required: true
          };

        case ACTIONS.REVERSE_TICKET:
          return {
            key: 'reverse',
            label: 'Reverse Ticket',
            icon: <ArrowBack />,
            color: 'warning',
            action: ACTIONS.REVERSE_TICKET,
            description: `Reverse to ${ROLE_PERMISSIONS[userRole]?.can_reverse_to?.join(' or ') || 'previous role'}`,
            required: true
          };

        case ACTIONS.ATTEND_TICKET:
          return {
            key: 'attend',
            label: 'Attend Ticket',
            icon: <Visibility />,
            color: 'success',
            action: ACTIONS.ATTEND_TICKET,
            description: 'Mark ticket as in progress',
            required: false
          };

        case ACTIONS.RECOMMEND:
          return {
            key: 'recommend',
            label: 'Recommend',
            icon: <Send />,
            color: 'primary',
            action: ACTIONS.RECOMMEND,
            description: 'Submit recommendation to next step',
            required: true
          };

        case ACTIONS.UPLOAD_EVIDENCE:
          return {
            key: 'upload-evidence',
            label: 'Upload Evidence',
            icon: <Upload />,
            color: 'secondary',
            action: ACTIONS.UPLOAD_EVIDENCE,
            description: 'Upload evidence for major complaint',
            required: true
          };

        case ACTIONS.CLOSE_TICKET:
          return {
            key: 'close',
            label: 'Close Ticket',
            icon: <CheckCircle />,
            color: 'success',
            action: ACTIONS.CLOSE_TICKET,
            description: 'Close and finalize ticket',
            required: true
          };

        default:
          return null;
      }
    }).filter(Boolean); // Remove null actions
  };

  // Check if action can be executed based on required fields
  const canExecuteAction = () => {
    if (!actionDialog) return false;
    
    const action = getAvailableActions().find(a => a.key === actionDialog.type);
    if (!action) return false;
    
    // Check required fields based on action type
    switch (actionDialog.type) {
      case 'rate':
        return actionData.rating && actionData.rating.trim() !== '';
      case 'assign':
        return actionData.targetRole && actionData.targetRole.trim() !== '';
      case 'recommend':
      case 'close':
        return actionData.notes && actionData.notes.trim() !== '';
      case 'upload-evidence':
        return actionData.evidenceUrl && actionData.evidenceUrl.trim() !== '';
      default:
        return true; // Other actions don't require additional data
    }
  };

  const availableActions = getAvailableActions();

  // If ticket is closed, show closed status
  if (isTicketClosed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label="Ticket Closed"
          color="success"
          icon={<CheckCircle />}
          variant="outlined"
        />
        <Typography variant="caption" color="text.secondary">
          No actions available for closed tickets
        </Typography>
      </Box>
    );
  }

  // If no actions available, show message
  if (availableActions.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label="No Actions Available"
          color="default"
          variant="outlined"
        />
        <Typography variant="caption" color="text.secondary">
          Your role doesn't have permissions for this ticket
        </Typography>
      </Box>
    );
  }

  // Handle action button click
  const handleAction = async (action) => {
    try {
      setLoading(true);
      setError(null);
      
      // Execute the action
      const result = await executeAction(action);
      
      if (result.success) {
        // Show success message
        setSuccessMessage(`Action "${action}" completed successfully`);
        
        // Call the callback to refresh ticket data
        if (onActionComplete) {
          onActionComplete(result);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action execution error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Execute the specific action
  const executeAction = async (action) => {
    const ticketId = ticket.id;
    
    try {
      switch (action) {
        case ACTIONS.RATE_COMPLAINT:
          return await handleRateComplaint(ticketId);
          
        case ACTIONS.CHANGE_TYPE:
          return await handleChangeType(ticketId);
          
        case ACTIONS.ASSIGN_TICKET:
          return await handleAssignTicket(ticketId);
          
        case ACTIONS.REVERSE_TICKET:
          return await handleReverseTicket(ticketId);
          
        case ACTIONS.ATTEND_TICKET:
          return await handleAttendTicket(ticketId);
          
        case ACTIONS.RECOMMEND:
          return await handleRecommend(ticketId);
          
        case ACTIONS.UPLOAD_EVIDENCE:
          return await handleUploadEvidence(ticketId);
          
        case ACTIONS.APPROVE:
          return await handleApprove(ticketId);
          
        case ACTIONS.CLOSE_TICKET:
          return await handleCloseTicket(ticketId);
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
      throw error;
    }
  };

  // Individual action handlers
  const handleRateComplaint = async (ticketId) => {
    // Open rating dialog
    setRatingDialogOpen(true);
    return { success: true, message: 'Rating dialog opened' };
  };

  const handleChangeType = async (ticketId) => {
    // Open type change dialog
    setTypeChangeDialogOpen(true);
    return { success: true, message: 'Type change dialog opened' };
  };

  const handleAssignTicket = async (ticketId) => {
    // Open assignment dialog
    setAssignmentDialogOpen(true);
    return { success: true, message: 'Assignment dialog opened' };
  };

  const handleReverseTicket = async (ticketId) => {
    // Open reversal dialog
    setReversalDialogOpen(true);
    return { success: true, message: 'Reversal dialog opened' };
  };

  const handleAttendTicket = async (ticketId) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await attendTicketMutation.mutateAsync({
        ticketId: ticket.id,
        notes: actionData.notes || '',
        status: 'In Progress'
      });
      
      setSuccessMessage('Ticket attended successfully!');
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('attend', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error attending ticket:', error);
      setError(error.response?.data?.message || 'Failed to attend ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async (ticketId) => {
    // Open recommendation dialog
    setRecommendationDialogOpen(true);
    return { success: true, message: 'Recommendation dialog opened' };
  };

  const handleUploadEvidence = async (ticketId) => {
    // Open evidence upload dialog
    setEvidenceDialogOpen(true);
    return { success: true, message: 'Evidence upload dialog opened' };
  };

  const handleApprove = async (ticketId) => {
    try {
      const result = await approveTicketMutation.mutateAsync({
        ticketId: ticketId,
        approved_by: userRole,
        approved_at: new Date().toISOString()
      });
      
      return { success: true, message: 'Ticket approved successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve ticket');
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const result = await closeTicketMutation.mutateAsync({
        ticketId: ticketId,
        closed_by: userRole,
        closed_at: new Date().toISOString()
      });
      
      return { success: true, message: 'Ticket closed successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to close ticket');
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (rating) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await rateComplaintMutation.mutateAsync({
        ticketId: ticket.id,
        rating: rating.rating,
        complaintType: rating.complaintType
      });
      
      setSuccessMessage('Complaint rated successfully!');
      setRatingDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('rate', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error rating complaint:', error);
      setError(error.response?.data?.message || 'Failed to rate complaint');
    } finally {
      setLoading(false);
    }
  };

  // Handle type change submission
  const handleTypeChangeSubmit = async (newType) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await changeTypeMutation.mutateAsync({
        ticketId: ticket.id,
        newType: newType
      });
      
      setSuccessMessage('Ticket type changed successfully!');
      setTypeChangeDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('changeType', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error changing ticket type:', error);
      setError(error.response?.data?.message || 'Failed to change ticket type');
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment submission
  const handleAssignmentSubmit = async (assignmentData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await assignTicketMutation.mutateAsync({
        ticketId: ticket.id,
        assigneeId: assignmentData.assigneeId,
        assigneeRole: assignmentData.assigneeRole,
        notes: assignmentData.notes
      });
      
      setSuccessMessage('Ticket assigned successfully!');
      setAssignmentDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('assign', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setError(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  // Handle reversal submission
  const handleReversalSubmit = async (reversalData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await reverseTicketMutation.mutateAsync({
        ticketId: ticket.id,
        reason: reversalData.reason,
        previousRole: reversalData.previousRole,
        notes: reversalData.notes
      });
      
      setSuccessMessage('Ticket reversed successfully!');
      setReversalDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('reverse', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error reversing ticket:', error);
      setError(error.response?.data?.message || 'Failed to reverse ticket');
    } finally {
      setLoading(false);
    }
  };

  // Handle recommendation submission
  const handleRecommendationSubmit = async (recommendationData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await recommendTicketMutation.mutateAsync({
        ticketId: ticket.id,
        recommendation: recommendationData.recommendation,
        nextRole: recommendationData.nextRole,
        notes: recommendationData.notes
      });
      
      setSuccessMessage('Recommendation submitted successfully!');
      setRecommendationDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('recommend', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      setError(error.response?.data?.message || 'Failed to submit recommendation');
    } finally {
      setLoading(false);
    }
  };

  // Handle evidence upload submission
  const handleEvidenceSubmit = async (evidenceData) => {
    try {
      setLoading(true);
      setError('');
      
      const result = await uploadEvidenceMutation.mutateAsync({
        ticketId: ticket.id,
        evidenceFile: evidenceData.evidenceFile,
        description: evidenceData.description
      });
      
      setSuccessMessage('Evidence uploaded successfully!');
      setEvidenceDialogOpen(false);
      
      // Call callback to refresh parent component
      if (onActionComplete) {
        onActionComplete('evidence', result);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error uploading evidence:', error);
      setError(error.response?.data?.message || 'Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 1 }}>
            {successMessage}
          </Alert>
        )}

        {compact ? (
          // Compact button group
          <ButtonGroup size="small" variant="outlined">
            {availableActions.map((action) => (
              <Tooltip key={action.key} title={action.description}>
                <Button
                  onClick={() => handleAction(action.action)}
                  startIcon={action.icon}
                  color={action.color}
                  disabled={loading}
                >
                  {showLabels ? action.label : ''}
                </Button>
              </Tooltip>
            ))}
          </ButtonGroup>
        ) : (
          // Full button layout
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {availableActions.map((action) => (
              <Button
                key={action.key}
                variant="contained"
                onClick={() => handleAction(action.action)}
                startIcon={action.icon}
                color={action.color}
                disabled={loading}
                size="medium"
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        )}

        {/* Action Dialog */}
        {actionDialog && (
          <Dialog 
            open={Boolean(actionDialog)} 
            onClose={() => setActionDialog(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {actionDialog.title}
              <IconButton
                onClick={() => setActionDialog(null)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {actionDialog.description}
              </Typography>

              {/* Dynamic form fields based on action type */}
              {actionDialog.type === 'rate' && (
                <TextField
                  fullWidth
                  select
                  label="Complaint Rating"
                  value={actionData.rating || ''}
                  onChange={(e) => setActionData({ ...actionData, rating: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="minor">Minor</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                </TextField>
              )}

              {actionDialog.type === 'assign' && (
                <TextField
                  fullWidth
                  select
                  label="Assign To Role"
                  value={actionData.targetRole || ''}
                  onChange={(e) => setActionData({ ...actionData, targetRole: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {ROLE_PERMISSIONS[userRole]?.can_assign_to?.map(role => (
                    <MenuItem key={role} value={role}>
                      {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {(actionDialog.type === 'recommend' || actionDialog.type === 'close') && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={actionDialog.type === 'recommend' ? 'Recommendation Notes' : 'Closure Notes'}
                  value={actionData.notes || ''}
                  onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                  sx={{ mb: 2 }}
                  required
                />
              )}

              {actionDialog.type === 'upload-evidence' && (
                <TextField
                  fullWidth
                  label="Evidence URL"
                  value={actionData.evidenceUrl || ''}
                  onChange={(e) => setActionData({ ...actionData, evidenceUrl: e.target.value })}
                  placeholder="https://example.com/evidence.pdf"
                  sx={{ mb: 2 }}
                  required
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog(null)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                variant="contained"
                disabled={loading || !canExecuteAction()}
              >
                {loading ? <CircularProgress size={20} /> : 'Execute'}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Rating Dialog */}
        <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Rate Complaint</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please rate this complaint as Minor or Major
            </Typography>
            <TextField
              fullWidth
              select
              label="Complaint Rating"
              value={actionData.rating || ''}
              onChange={(e) => setActionData({ ...actionData, rating: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="minor">Minor</MenuItem>
              <MenuItem value="major">Major</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleRatingSubmit(actionData)} 
              variant="contained"
              disabled={!actionData.rating}
            >
              Submit Rating
            </Button>
          </DialogActions>
        </Dialog>

        {/* Type Change Dialog */}
        <Dialog open={typeChangeDialogOpen} onClose={() => setTypeChangeDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Ticket Type</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Change the ticket type or convert to inquiry
            </Typography>
            <TextField
              fullWidth
              select
              label="New Type"
              value={actionData.newType || ''}
              onChange={(e) => setActionData({ ...actionData, newType: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="inquiry">Inquiry</MenuItem>
              <MenuItem value="complaint">Complaint</MenuItem>
              <MenuItem value="request">Request</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTypeChangeDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleTypeChangeSubmit(actionData.newType)} 
              variant="contained"
              disabled={!actionData.newType}
            >
              Change Type
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assign this ticket to the next role in the workflow
            </Typography>
            <TextField
              fullWidth
              select
              label="Assign To Role"
              value={actionData.targetRole || ''}
              onChange={(e) => setActionData({ ...actionData, targetRole: e.target.value })}
              sx={{ mb: 2 }}
            >
              {ROLE_PERMISSIONS[userRole]?.can_assign_to?.map(role => (
                <MenuItem key={role} value={role}>
                  {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Assignment Notes"
              value={actionData.notes || ''}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
              placeholder="Optional notes about this assignment"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleAssignmentSubmit(actionData)} 
              variant="contained"
              disabled={!actionData.targetRole}
            >
              Assign Ticket
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reversal Dialog */}
        <Dialog open={reversalDialogOpen} onClose={() => setReversalDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reverse Ticket</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reverse this ticket to a previous role in the workflow
            </Typography>
            <TextField
              fullWidth
              select
              label="Reverse To Role"
              value={actionData.targetRole || ''}
              onChange={(e) => setActionData({ ...actionData, targetRole: e.target.value })}
              sx={{ mb: 2 }}
            >
              {ROLE_PERMISSIONS[userRole]?.can_reverse_to?.map(role => (
                <MenuItem key={role} value={role}>
                  {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reversal Reason"
              value={actionData.reason || ''}
              onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
              placeholder="Reason for reversing this ticket"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReversalDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleReversalSubmit(actionData)} 
              variant="contained"
              disabled={!actionData.targetRole || !actionData.reason}
            >
              Reverse Ticket
            </Button>
          </DialogActions>
        </Dialog>

        {/* Recommendation Dialog */}
        <Dialog open={recommendationDialogOpen} onClose={() => setRecommendationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Submit Recommendation</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Submit your recommendation for the next step
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Recommendation"
              value={actionData.recommendation || ''}
              onChange={(e) => setActionData({ ...actionData, recommendation: e.target.value })}
              placeholder="Detailed recommendation for next steps"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRecommendationDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleRecommendationSubmit(actionData)} 
              variant="contained"
              disabled={!actionData.recommendation}
            >
              Submit Recommendation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Evidence Upload Dialog */}
        <Dialog open={evidenceDialogOpen} onClose={() => setEvidenceDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Evidence</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload evidence for this major complaint
            </Typography>
            <TextField
              fullWidth
              label="Evidence URL"
              value={actionData.evidenceUrl || ''}
              onChange={(e) => setActionData({ ...actionData, evidenceUrl: e.target.value })}
              placeholder="https://example.com/evidence.pdf"
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Evidence Description"
              value={actionData.description || ''}
              onChange={(e) => setActionData({ ...actionData, description: e.target.value })}
              placeholder="Description of the evidence"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEvidenceDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleEvidenceSubmit(actionData)} 
              variant="contained"
              disabled={!actionData.evidenceUrl || !actionData.description}
            >
              Upload Evidence
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default WorkflowActionButtons; 