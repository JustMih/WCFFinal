import React from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Typography,
  Chip,
  Paper
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Pending as PendingIcon
} from '@mui/icons-material';

const WorkflowStepper = ({ workflowStatus, currentStep, totalSteps, ticket }) => {
  if (!workflowStatus) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading workflow status...
        </Typography>
      </Paper>
    );
  }

  const getStepIcon = (stepIndex) => {
    if (stepIndex < currentStep - 1) {
      return <CheckCircleIcon color="success" />;
    } else if (stepIndex === currentStep - 1) {
      return <PendingIcon color="primary" />;
    } else {
      return <RadioButtonUncheckedIcon color="disabled" />;
    }
  };

  const getStepColor = (stepIndex) => {
    if (stepIndex < currentStep - 1) {
      return 'success';
    } else if (stepIndex === currentStep - 1) {
      return 'primary';
    } else {
      return 'disabled';
    }
  };

  const renderWorkflowSteps = () => {
    const steps = [];
    
    if (ticket?.complaint_type === 'Minor') {
      if (ticket?.responsible_unit_name?.toLowerCase().includes('directorate')) {
        // Minor Directorate workflow
        steps.push(
          { label: 'Reviewer Review', description: 'Initial review and rating' },
          { label: 'Director Assignment', description: 'Assigned to director' },
          { label: 'Manager Review', description: 'Manager processes and closes' },
          { label: 'Attendee Action', description: 'Attendee attends and recommends' },
          { label: 'Manager Final Review', description: 'Manager reviews and closes' }
        );
      } else {
        // Minor Unit workflow
        steps.push(
          { label: 'Reviewer Review', description: 'Initial review and rating' },
          { label: 'Head of Unit', description: 'Head of unit processes' },
          { label: 'Attendee Action', description: 'Attendee attends and recommends' },
          { label: 'Head of Unit Final', description: 'Head of unit closes' }
        );
      }
    } else if (ticket?.complaint_type === 'Major') {
      if (ticket?.responsible_unit_name?.toLowerCase().includes('directorate')) {
        // Major Directorate workflow
        steps.push(
          { label: 'Reviewer Review', description: 'Initial review and rating' },
          { label: 'Director Assignment', description: 'Assigned to director' },
          { label: 'Manager Review', description: 'Manager processes with evidence' },
          { label: 'Attendee Action', description: 'Attendee attends with evidence' },
          { label: 'Manager Review', description: 'Manager reviews and recommends' },
          { label: 'Director Review', description: 'Director reviews and recommends' },
          { label: 'DG Approval', description: 'Director General approves and closes' }
        );
      } else {
        // Major Unit workflow
        steps.push(
          { label: 'Reviewer Review', description: 'Initial review and rating' },
          { label: 'Head of Unit', description: 'Head of unit processes with evidence' },
          { label: 'Attendee Action', description: 'Attendee attends with evidence' },
          { label: 'Head of Unit Review', description: 'Head of unit reviews and recommends' },
          { label: 'DG Approval', description: 'Director General approves and closes' }
        );
      }
    } else {
      // Default workflow for unrated complaints
      steps.push(
        { label: 'Reviewer Review', description: 'Awaiting reviewer rating' },
        { label: 'Processing', description: 'Will be determined after rating' }
      );
    }

    return steps;
  };

  const steps = [
    { label: 'Reviewer Review', description: 'Initial review and rating' },
    { label: 'Head of Unit', description: 'Unit review and processing' },
    { label: 'Attendee', description: 'Final processing and resolution' },
    { label: 'Head of Unit', description: 'Final review and closure' }
  ];

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">Workflow Progress</Typography>
        <Chip 
          label={workflowStatus.workflowName || 'Pending Rating'} 
          color={ticket?.complaint_type ? 'primary' : 'default'}
          size="small"
        />
      </Box>
      
      <Stepper activeStep={currentStep - 1} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel 
              icon={getStepIcon(index)}
              StepIconProps={{
                sx: { color: getStepColor(index) }
              }}
            >
              <Typography variant="subtitle2" color={getStepColor(index)}>
                {step.label}
              </Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
              {index === currentStep - 1 && (
                <Chip 
                  label="Current Step" 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Current Status:</strong> {ticket?.status || 'Open'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Assigned to:</strong> {ticket?.assigned_to_role || 'Coordinator'}
        </Typography>
        {ticket?.complaint_type && (
          <Typography variant="body2" color="text.secondary">
            <strong>Complaint Type:</strong> {ticket.complaint_type}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WorkflowStepper; 