import React from 'react';

const WorkflowStatusIndicator = ({ ticket }) => {
  if (!ticket.workflow_path) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
        No Workflow
      </div>
    );
  }

  const getWorkflowColor = (workflowPath) => {
    switch (workflowPath) {
      case 'MINOR_UNIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MINOR_DIRECTORATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MAJOR_UNIT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MAJOR_DIRECTORATE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkflowIcon = (workflowPath) => {
    switch (workflowPath) {
      case 'MINOR_UNIT':
        return '🔵';
      case 'MINOR_DIRECTORATE':
        return '🟢';
      case 'MAJOR_UNIT':
        return '🟠';
      case 'MAJOR_DIRECTORATE':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStepLabel = (step, workflowPath) => {
    const stepLabels = {
        'MINOR_UNIT': ['Reviewer', 'Head of Unit', 'Attendee', 'Head of Unit'],
  'MINOR_DIRECTORATE': ['Reviewer', 'Director', 'Manager', 'Attendee', 'Manager'],
  'MAJOR_UNIT': ['Reviewer', 'Head of Unit', 'Attendee', 'Head of Unit', 'DG'],
  'MAJOR_DIRECTORATE': ['Reviewer', 'Director', 'Manager', 'Attendee', 'Manager', 'Director', 'DG']
    };
    
    const labels = stepLabels[workflowPath] || [];
    return labels[step - 1] || `Step ${step}`;
  };

  const getProgressPercentage = () => {
    if (!ticket.current_workflow_step) return 0;
    
    const totalSteps = {
      'MINOR_UNIT': 4,
      'MINOR_DIRECTORATE': 5,
      'MAJOR_UNIT': 5,
      'MAJOR_DIRECTORATE': 7
    };
    
    const total = totalSteps[ticket.workflow_path] || 1;
    return Math.round((ticket.current_workflow_step / total) * 100);
  };

  const progress = getProgressPercentage();
  const currentStep = ticket.current_workflow_step || 1;
  const totalSteps = {
    'MINOR_UNIT': 4,
    'MINOR_DIRECTORATE': 5,
    'MAJOR_UNIT': 5,
    'MAJOR_DIRECTORATE': 7
  }[ticket.workflow_path] || 1;

  return (
    <div className="space-y-2">
      {/* Workflow Path Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkflowColor(ticket.workflow_path)}`}>
        <span className="mr-2">{getWorkflowIcon(ticket.workflow_path)}</span>
        {ticket.workflow_path.replace('_', ' ')}
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step Label */}
      <div className="text-xs text-gray-600">
        <span className="font-medium">Current:</span> {getStepLabel(currentStep, ticket.workflow_path)}
      </div>

      {/* Workflow Status */}
      {ticket.workflow_completed && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Completed
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusIndicator; 