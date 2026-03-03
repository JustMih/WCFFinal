# Frontend Permissions System & Workflow Integration

## Overview

This document describes the comprehensive permissions system implemented in the WCF frontend, which provides role-based access control (RBAC) for workflow actions and ticket management. The system integrates seamlessly with the backend workflow communication service and ensures users can only perform actions appropriate to their role and current workflow stage.

## 🏗️ Architecture

### Core Components

1. **Permissions Utility (`src/utils/permissions.js`)**
   - Centralized permission configuration
   - Role-based action definitions
   - Workflow stage validation
   - PermissionManager class for dynamic permission checking

2. **WorkflowActionButtons (`src/components/workflow/WorkflowActionButtons.js`)**
   - Dynamic action button rendering based on permissions
   - Workflow stage-aware action availability
   - Form validation for required fields
   - Integration with backend workflow service

3. **TicketDetailsModal (`src/components/ticket/TicketDetailsModal.js`)**
   - Enhanced with workflow information display
   - Integrated workflow action buttons
   - Workflow progress visualization
   - SLA information display

## 🔐 Permission Levels

### Role Hierarchy

```
Director General (Highest)
├── Head of Unit
├── Director
├── Manager
├── Coordinator
├── Attendee
└── Agent (Lowest)
```

### Role Capabilities

| Role | Actions | Workflow Access | Ticket Access | SLA Hours |
|------|---------|----------------|---------------|-----------|
| **Agent** | Create, View, Download | Initial | Own + Assigned | 24 |
| **Coordinator** | Rate, Convert, Assign, View | Coordinator Review | All | 48 |
| **Head of Unit** | Assign, Reverse, Attend, Close | Unit Review | All | 24 |
| **Director** | Assign, Reverse, Attend, Evidence, Recommend | Directorate Review | All | 24 |
| **Manager** | Assign, Reverse, Attend, Evidence, Recommend | Manager Review | All | 24 |
| **Attendee** | Attend, Evidence, Recommend | Processing | Assigned + Own | 72 |
| **Director General** | Review, Approve, Close, Reverse | DG Approval | All | 24 |

## 🚀 Workflow Integration

### Workflow Paths

#### Minor Complaint - Unit
```
Agent → Coordinator → Head of Unit → Attendee → Head of Unit (Close)
```
- **Total Steps**: 5
- **SLA**: Coordinator (48h), Head of Unit (24h), Attendee (72h)

#### Minor Complaint - Directorate
```
Agent → Coordinator → Director → Manager → Attendee → Manager → Director
```
- **Total Steps**: 7
- **SLA**: Coordinator (48h), Director (24h), Manager (24h), Attendee (72h)

#### Major Complaint - Unit
```
Agent → Coordinator → Head of Unit → Attendee → Head of Unit → Director General
```
- **Total Steps**: 6
- **SLA**: Coordinator (48h), Head of Unit (24h), Attendee (168h), DG (24h)

#### Major Complaint - Directorate
```
Agent → Coordinator → Director → Manager → Attendee → Manager → Director → Director General
```
- **Total Steps**: 8
- **SLA**: Coordinator (48h), Director (24h), Manager (24h), Attendee (168h), DG (24h)

### Workflow Stages

- **`initial`**: Ticket creation and initial assignment
- **`coordinator_review`**: Complaint rating and workflow path determination
- **`head_of_unit_review`**: Unit-level review and assignment
- **`director_review`**: Directorate-level review and assignment
- **`manager_review`**: Manager-level review and assignment
- **`attendee_processing`**: Ticket processing and recommendation
- **`dg_approval`**: Final approval and closure

## 🎯 Action Permissions

### Action Types

| Action | Description | Required Fields | Available To |
|--------|-------------|-----------------|--------------|
| **Rate Complaint** | Rate as Minor/Major | Rating selection | Coordinator |
| **Convert Type** | Convert complaint to inquiry | None | Coordinator |
| **Assign Ticket** | Assign to next role | Target role | All except Attendee |
| **Reverse Ticket** | Send back to previous role | Target role | All except Agent |
| **Attend Ticket** | Mark as in progress | None | Attendee, Head of Unit |
| **Recommend** | Submit recommendation | Notes | Attendee, Manager, Director |
| **Upload Evidence** | Upload supporting documents | Evidence URL | Attendee, Manager, Director, Head of Unit |
| **Close Ticket** | Finalize and close | Closure notes | Head of Unit, Director General |

### Permission Validation

Actions are validated at multiple levels:

1. **Role Permission**: User's role must include the action
2. **Workflow Stage**: User must be at appropriate workflow stage
3. **Ticket State**: Action must be appropriate for current ticket status
4. **Workflow Step**: User must be at current workflow step for certain actions
5. **Required Fields**: All required form fields must be completed

## 💻 Implementation Details

### PermissionManager Class

```javascript
const permissionManager = new PermissionManager(userRole);

// Check specific permissions
if (permissionManager.canPerformAction(ACTIONS.RATE_COMPLAINT)) {
  // Show rating action
}

// Check workflow access
if (permissionManager.canAccessWorkflowStage('coordinator_review')) {
  // Allow access to coordinator review stage
}

// Get available actions for ticket
const actions = permissionManager.getAvailableActions(ticket, workflowStage);
```

### Dynamic Action Rendering

```javascript
const getAvailableActions = () => {
  const currentStage = getCurrentWorkflowStage();
  const availableActions = permissionManager.getAvailableActions(ticket, currentStage);
  
  return availableActions.map(action => ({
    key: action,
    label: getActionLabel(action),
    icon: getActionIcon(action),
    color: getActionColor(action),
    required: isActionRequired(action)
  }));
};
```

### Form Validation

```javascript
const canExecuteAction = () => {
  switch (actionDialog.type) {
    case 'rate':
      return actionData.rating && actionData.rating.trim() !== '';
    case 'assign':
      return actionData.targetRole && actionData.targetRole.trim() !== '';
    case 'recommend':
    case 'close':
      return actionData.notes && actionData.notes.trim() !== '';
    default:
      return true;
  }
};
```

## 🔒 Security Features

### Access Control

- **Ticket Access**: Role-based ticket visibility
- **Action Restrictions**: Workflow stage-aware action availability
- **Field Validation**: Required field enforcement
- **Role Validation**: Backend role verification

### Data Protection

- **Token-based Authentication**: JWT token validation
- **Role Verification**: Server-side role confirmation
- **Workflow State Validation**: Backend workflow state verification
- **Audit Trail**: All actions logged with user and timestamp

## 🎨 UI Components

### WorkflowActionButtons

- **Dynamic Rendering**: Shows only available actions
- **Visual Feedback**: Color-coded action types
- **Tooltips**: Action descriptions and requirements
- **Form Integration**: Modal dialogs for action data

### TicketDetailsModal

- **Workflow Information**: Current stage and progress
- **SLA Display**: Time remaining and deadlines
- **Action Integration**: Embedded workflow action buttons
- **Progress Visualization**: Visual workflow progress bar

### Workflow Progress

- **Step Indicators**: Visual representation of workflow steps
- **Progress Bar**: Percentage completion display
- **Current Step Highlighting**: Active step identification
- **SLA Information**: Time constraints and deadlines

## 📱 Usage Examples

### Basic Permission Check

```javascript
import { hasPermission } from '../utils/permissions';

if (hasPermission(userRole, ACTIONS.RATE_COMPLAINT)) {
  // Show rating interface
}
```

### Workflow Stage Access

```javascript
import { canAccessStage } from '../utils/permissions';

if (canAccessStage(userRole, 'coordinator_review')) {
  // Allow access to coordinator review functionality
}
```

### Role Information

```javascript
import { getRolePermissions } from '../utils/permissions';

const roleInfo = getRolePermissions(userRole);
console.log(`Role: ${roleInfo.description}`);
console.log(`SLA: ${roleInfo.sla_hours} hours`);
```

## 🧪 Testing

### Permission Testing

```javascript
// Test role permissions
const testPermissions = () => {
  const coordinator = new PermissionManager('coordinator');
  expect(coordinator.canPerformAction(ACTIONS.RATE_COMPLAINT)).toBe(true);
  expect(coordinator.canPerformAction(ACTIONS.CLOSE_TICKET)).toBe(false);
};

// Test workflow stage access
const testWorkflowAccess = () => {
  const headOfUnit = new PermissionManager('head-of-unit');
  expect(headOfUnit.canAccessWorkflowStage('head_of_unit_review')).toBe(true);
  expect(headOfUnit.canAccessWorkflowStage('coordinator_review')).toBe(false);
};
```

### Integration Testing

```javascript
// Test action availability
const testActionAvailability = () => {
  const ticket = { workflow_path: 'MINOR_UNIT', current_workflow_step: 3 };
  const actions = permissionManager.getAvailableActions(ticket, 'head_of_unit_review');
  expect(actions).toContain(ACTIONS.ASSIGN_TICKET);
};
```

## 🚀 Future Enhancements

### Planned Features

1. **Advanced SLA Management**
   - Dynamic SLA calculation
   - Escalation notifications
   - Performance metrics

2. **Enhanced Workflow Visualization**
   - Interactive workflow diagrams
   - Real-time progress updates
   - Bottleneck identification

3. **Permission Templates**
   - Customizable role definitions
   - Department-specific permissions
   - Temporary permission grants

4. **Audit and Compliance**
   - Detailed action logging
   - Compliance reporting
   - Permission change tracking

## 📚 API Integration

### Backend Endpoints

The frontend integrates with these backend endpoints:

- `POST /coordinator/tickets/:id/rate` - Rate complaints
- `POST /coordinator/tickets/:id/convert-or-forward` - Convert ticket types
- `POST /workflow/:id/assign` - Assign tickets
- `POST /workflow/:id/reverse` - Reverse tickets
- `POST /workflow/:id/attend` - Attend tickets
- `POST /workflow/:id/recommend` - Submit recommendations
- `POST /workflow/:id/upload-evidence` - Upload evidence
- `POST /workflow/:id/close` - Close tickets

### Response Handling

```javascript
const executeAction = async () => {
  try {
    const response = await axios.post(endpoint, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      onActionComplete(response.data);
      // Update UI and workflow state
    }
  } catch (error) {
    setError(error.response?.data?.message || 'An error occurred');
  }
};
```

## 🔧 Configuration

### Environment Variables

```javascript
// config/config.js
export const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const permissionsConfig = {
  enableAuditLogging: process.env.REACT_APP_ENABLE_AUDIT === 'true',
  strictMode: process.env.REACT_APP_STRICT_PERMISSIONS === 'true'
};
```

### Permission Overrides

```javascript
// For development/testing
const DEV_PERMISSIONS = {
  'test-user': {
    actions: Object.values(ACTIONS),
    workflow_stages: Object.values(WORKFLOW_STAGES)
  }
};
```

## 📖 Conclusion

The enhanced permissions system provides a robust, secure, and user-friendly way to manage workflow actions in the WCF system. It ensures that users can only perform actions appropriate to their role and current workflow stage, while providing a clear and intuitive interface for managing tickets through their lifecycle.

The system is designed to be:
- **Secure**: Multi-level permission validation
- **Scalable**: Easy to add new roles and permissions
- **Maintainable**: Centralized configuration and utilities
- **User-Friendly**: Clear visual feedback and intuitive controls
- **Integrated**: Seamless backend integration and real-time updates

For questions or enhancements, please refer to the development team or create an issue in the project repository. 