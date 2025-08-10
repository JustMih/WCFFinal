// Centralized permissions configuration for the WCF system
export const ACTIONS = {
  CREATE_TICKET: 'create_ticket',
  VIEW_TICKET: 'view_ticket',
  EDIT_TICKET: 'edit_ticket',
  DELETE_TICKET: 'delete_ticket',
  RATE_COMPLAINT: 'rate_complaint',
  CHANGE_TYPE: 'change_type',
  ASSIGN_TICKET: 'assign_ticket',
  REVERSE_TICKET: 'reverse_ticket',
  ATTEND_TICKET: 'attend_ticket',
  RECOMMEND: 'recommend',
  REVIEW: 'review',
  UPLOAD_EVIDENCE: 'upload_evidence',
  APPROVE: 'approve',
  CLOSE_TICKET: 'close_ticket',
  DOWNLOAD_ATTACHMENT: 'download_attachment',
  VIEW_WORKFLOW: 'view_workflow',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SECTIONS: 'manage_sections'
};

// Enhanced role permissions with workflow stages and SLA information
export const ROLE_PERMISSIONS = {
  'agent': {
    actions: [ACTIONS.CREATE_TICKET, ACTIONS.VIEW_TICKET, ACTIONS.DOWNLOAD_ATTACHMENT],
    can_assign_to: ['coordinator'],
    workflow_stages: ['initial'],
    can_access_tickets: ['own', 'assigned'],
    sla_hours: 24,
    description: 'Can create tickets and assign to coordinator',
    color: '#2196f3'
  },
  'coordinator': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.RATE_COMPLAINT,
      ACTIONS.CHANGE_TYPE,
      ACTIONS.ASSIGN_TICKET,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW
    ],
    can_assign_to: ['head-of-unit', 'director', 'attendee'], // Added attendee for reassignment
    can_rate: ['minor', 'major'],
    can_close: ['MINOR_UNIT', 'MINOR_DIRECTORATE'], // Can close minor complaints
    can_close_special: ['public-relations', 'directorate-of-operations'], // Special closing for specific sections
    workflow_stages: ['coordinator_review'],
    can_access_tickets: ['all'],
    sla_hours: 48,
    description: 'Can rate complaints, assign to workflow path, and close in special cases',
    color: '#ff9800'
  },
  'head-of-unit': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.ASSIGN_TICKET,
      ACTIONS.REVERSE_TICKET,
      ACTIONS.ATTEND_TICKET,
      ACTIONS.CLOSE_TICKET,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW,
      ACTIONS.VIEW_REPORTS
    ],
    can_assign_to: ['attendee'],
    can_reverse_to: ['coordinator'],
    can_close: ['MINOR_UNIT'],
    workflow_stages: ['head_of_unit_review', 'head_of_unit_final'],
    can_access_tickets: ['all'],
    sla_hours: 24,
    description: 'Can handle Minor Unit workflow - assign, reverse, attend, close',
    color: '#4caf50'
  },
  'director': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.ASSIGN_TICKET,
      ACTIONS.REVERSE_TICKET,
      ACTIONS.ATTEND_TICKET,
      ACTIONS.UPLOAD_EVIDENCE,
      ACTIONS.RECOMMEND,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW,
      ACTIONS.VIEW_REPORTS
    ],
    can_assign_to: ['manager'],
    can_reverse_to: ['coordinator'],
    workflow_stages: ['director_review', 'director_final'],
    can_access_tickets: ['all'],
    sla_hours: 24,
    description: 'Can handle Directorate workflow - assign, reverse, attend, recommend',
    color: '#9c27b0'
  },
  'manager': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.ASSIGN_TICKET,
      ACTIONS.REVERSE_TICKET,
      ACTIONS.ATTEND_TICKET,
      ACTIONS.UPLOAD_EVIDENCE,
      ACTIONS.RECOMMEND,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW,
      ACTIONS.VIEW_REPORTS
    ],
    can_assign_to: ['attendee'],
    can_reverse_to: ['director'],
    workflow_stages: ['manager_review', 'manager_final'],
    can_access_tickets: ['all'],
    sla_hours: 24,
    description: 'Can handle Manager workflow - assign, reverse, attend, recommend',
    color: '#607d8b'
  },
  'attendee': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.ATTEND_TICKET,
      ACTIONS.UPLOAD_EVIDENCE,
      ACTIONS.RECOMMEND,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW
    ],
    can_reverse_to: ['manager', 'head-of-unit'],
    workflow_stages: ['attendee_processing'],
    can_access_tickets: ['assigned', 'own'],
    sla_hours: 72,
    description: 'Can attend tickets and make recommendations',
    color: '#795548'
  },
  'director-general': {
    actions: [
      ACTIONS.VIEW_TICKET,
      ACTIONS.REVIEW,
      ACTIONS.APPROVE,
      ACTIONS.CLOSE_TICKET,
      ACTIONS.REVERSE_TICKET,
      ACTIONS.DOWNLOAD_ATTACHMENT,
      ACTIONS.VIEW_WORKFLOW,
      ACTIONS.VIEW_REPORTS,
      ACTIONS.MANAGE_USERS,
      ACTIONS.MANAGE_SECTIONS
    ],
    can_reverse_to: ['head-of-unit', 'director'],
    can_close: ['MINOR_UNIT', 'MINOR_DIRECTORATE', 'MAJOR_UNIT', 'MAJOR_DIRECTORATE'],
    workflow_stages: ['dg_approval'],
    can_access_tickets: ['all'],
    sla_hours: 24,
    description: 'Final approval authority - can approve, close, or reverse to previous levels',
    color: '#f44336'
  }
};

// Workflow paths and their step definitions
export const WORKFLOW_PATHS = {
  MINOR_UNIT: {
    name: 'Minor Complaint - Unit',
    steps: ['agent', 'coordinator', 'head-of-unit', 'attendee', 'head-of-unit'],
    totalSteps: 5,
    sla: {
      coordinator: 48,
      'head-of-unit': 24,
      attendee: 72
    },
    description: 'Standard workflow for minor complaints within a unit'
  },
  MINOR_DIRECTORATE: {
    name: 'Minor Complaint - Directorate',
    steps: ['agent', 'coordinator', 'director', 'manager', 'attendee', 'manager', 'director'],
    totalSteps: 7,
    sla: {
      coordinator: 48,
      director: 24,
      manager: 24,
      attendee: 72
    },
    description: 'Standard workflow for minor complaints across directorates'
  },
  MAJOR_UNIT: {
    name: 'Major Complaint - Unit',
    steps: ['agent', 'coordinator', 'head-of-unit', 'attendee', 'head-of-unit', 'director-general'],
    totalSteps: 6,
    sla: {
      coordinator: 48,
      'head-of-unit': 24,
      attendee: 168, // 7 days
      'director-general': 24
    },
    description: 'Extended workflow for major complaints within a unit'
  },
  MAJOR_DIRECTORATE: {
    name: 'Major Complaint - Directorate',
    steps: ['agent', 'coordinator', 'director', 'manager', 'attendee', 'manager', 'director', 'director-general'],
    totalSteps: 8,
    sla: {
      coordinator: 48,
      director: 24,
      manager: 24,
      attendee: 168, // 7 days
      'director-general': 24
    },
    description: 'Extended workflow for major complaints across directorates'
  }
};

// Permission checking utilities
export class PermissionManager {
  constructor(userRole, userUnitSection = null) {
    this.userRole = userRole;
    this.userUnitSection = userUnitSection;
    this.rolePermissions = ROLE_PERMISSIONS[userRole];
  }

  // Check if user can perform a specific action
  canPerformAction(action) {
    if (!this.rolePermissions) return false;
    return this.rolePermissions.actions.includes(action);
  }

  // Check if user can access a specific workflow stage
  canAccessWorkflowStage(workflowStage) {
    if (!this.rolePermissions || !this.rolePermissions.workflow_stages) return false;
    return this.rolePermissions.workflow_stages.includes(workflowStage);
  }

  // Check if user can access a specific ticket
  canAccessTicket(ticket, accessType = 'view') {
    if (!this.rolePermissions) return false;

    // Director General and other high-level roles can access all tickets
    if (this.userRole === 'director-general' || 
        this.userRole === 'head-of-unit' || 
        this.userRole === 'director' || 
        this.userRole === 'manager' || 
        this.userRole === 'coordinator') {
      return true;
    }

    // Check specific access types
    switch (accessType) {
      case 'view':
        if (this.rolePermissions.can_access_tickets.includes('all')) return true;
        if (this.rolePermissions.can_access_tickets.includes('own') && 
            ticket.creator_id === this.getCurrentUserId()) return true;
        if (this.rolePermissions.can_access_tickets.includes('assigned') && 
            ticket.assignee_id === this.getCurrentUserId()) return true;
        break;
      case 'edit':
        // Only allow editing own tickets or assigned tickets
        if (ticket.creator_id === this.getCurrentUserId()) return true;
        if (ticket.assignee_id === this.getCurrentUserId()) return true;
        break;
      case 'delete':
        // Only allow deleting own tickets
        if (ticket.creator_id === this.getCurrentUserId()) return true;
        break;
    }

    return false;
  }

  // Check if user can assign to a specific role
  canAssignToRole(targetRole) {
    if (!this.rolePermissions || !this.rolePermissions.can_assign_to) return false;
    return this.rolePermissions.can_assign_to.includes(targetRole);
  }

  // Check if user can reverse to a specific role
  canReverseToRole(targetRole) {
    if (!this.rolePermissions || !this.rolePermissions.can_reverse_to) return false;
    return this.rolePermissions.can_reverse_to.includes(targetRole);
  }

  // Check if user can close a specific workflow path
  canCloseWorkflow(workflowPath) {
    if (!this.rolePermissions || !this.rolePermissions.can_close) return false;
    return this.rolePermissions.can_close.includes(workflowPath);
  }

  // Get available actions for a specific ticket and workflow stage
  getAvailableActions(ticket, workflowStage) {
    if (!this.rolePermissions) return [];

    const actions = [];
    
    // Check if user can access current workflow stage
    if (!this.canAccessWorkflowStage(workflowStage)) {
      return actions;
    }

    // Add actions based on role permissions and workflow context
    this.rolePermissions.actions.forEach(action => {
      if (this.isActionAvailableForTicket(action, ticket, workflowStage)) {
        actions.push(action);
      }
    });

    return actions;
  }

  // Check if a specific action is available for a ticket
  isActionAvailableForTicket(action, ticket, workflowStage) {
    switch (action) {
      case ACTIONS.RATE_COMPLAINT:
        return ticket?.category === 'Complaint' && 
               !ticket?.complaint_type && 
               workflowStage === 'coordinator_review';
      
      case ACTIONS.CHANGE_TYPE:
        return ticket?.category === 'Complaint' && 
               workflowStage === 'coordinator_review';
      
      case ACTIONS.ASSIGN_TICKET:
        return this.rolePermissions.can_assign_to && 
               this.rolePermissions.can_assign_to.length > 0 &&
               this.isUserAtCurrentWorkflowStep(ticket);
      
      case ACTIONS.REVERSE_TICKET:
        return this.rolePermissions.can_reverse_to && 
               this.rolePermissions.can_reverse_to.length > 0 &&
               this.isUserAtCurrentWorkflowStep(ticket);
      
      case ACTIONS.ATTEND_TICKET:
        return workflowStage === 'attendee_processing' || 
               (workflowStage === 'head_of_unit_review' && this.userRole === 'head-of-unit');
      
      case ACTIONS.RECOMMEND:
        return ['attendee_processing', 'manager_review', 'director_review'].includes(workflowStage);
      
      case ACTIONS.UPLOAD_EVIDENCE:
        return ticket?.complaint_type === 'Major' && 
               ['attendee_processing', 'manager_review', 'director_review', 'head_of_unit_review'].includes(workflowStage);
      
      case ACTIONS.CLOSE_TICKET:
        // Check if user can close this workflow
        if (!this.canCloseWorkflow(ticket?.workflow_path)) return false;
        
        // Check if user can close at current step
        if (!this.canCloseAtCurrentStep(ticket)) return false;
        
        // Special case: Coordinator can close in specific scenarios
        if (this.userRole === 'coordinator') {
          // Check if coordinator's unit_section matches the ticket's section
          if (this.userUnitSection && 
              this.userUnitSection.toLowerCase().replace(/\s+/g, '-') === 
              (ticket?.section || ticket?.unit_section)?.toLowerCase().replace(/\s+/g, '-')) {
            
            // Can close if it's public relations unit
            if (this.userUnitSection.toLowerCase().includes('public relation')) {
              return true;
            }
            
            // Can close if it's minor complaint in allowed workflows
            if (ticket?.complaint_type === 'minor' && 
                this.rolePermissions.can_close?.includes(ticket?.workflow_path)) {
              return true;
            }
          }
          
          // Reversed tickets
          if (ticket?.reversed_count > 0 || ticket?.status === 'Reversed') {
            return true;
          }
          
          // If none of the special cases apply, coordinator cannot close
          return false;
        }
        
        // For other roles, check if they can close at current step
        return this.canCloseAtCurrentStep(ticket);
      
      default:
        return true;
    }
  }

  // Check if user is at the current workflow step
  isUserAtCurrentWorkflowStep(ticket) {
    return ticket?.workflow_current_role === this.userRole;
  }

  // Check if user can close at the current step
  canCloseAtCurrentStep(ticket) {
    const currentRole = ticket?.workflow_current_role;
    
    // Director General can close at any step
    if (this.userRole === 'director-general') return true;
    
    // Head of Unit can close Minor Unit workflow at final step
    if (this.userRole === 'head-of-unit' && 
        ticket?.workflow_path === 'MINOR_UNIT' && 
        currentRole === 'head-of-unit') return true;
    
    // Head of Unit can close tickets from their specific unit/directorate
    if (this.userRole === 'head-of-unit' && currentRole === 'head-of-unit') {
      // Check if ticket belongs to the user's unit/directorate
      if (this.isUserHeadOfTicketUnit(ticket)) {
        return true;
      }
    }
    
    // Coordinator special closing scenarios
    if (this.userRole === 'coordinator' && currentRole === 'coordinator') {
      // Check if coordinator's unit_section matches the ticket's section
      if (this.userUnitSection && 
          this.userUnitSection.toLowerCase().replace(/\s+/g, '-') === 
          (ticket?.section || ticket?.unit_section)?.toLowerCase().replace(/\s+/g, '-')) {
        
        // Can close if it's public relations unit
        if (this.userUnitSection.toLowerCase().includes('public relation')) {
          return true;
        }
        
        // Can close if it's minor complaint in allowed workflows
        if (ticket?.complaint_type === 'minor' && 
            this.rolePermissions.can_close?.includes(ticket?.workflow_path)) {
          return true;
        }
      }
      
      // Can close if ticket was reversed (indicating it came back)
      if (ticket?.reversed_count > 0 || ticket?.status === 'Reversed') {
        return true;
      }
      
      // If none of the special cases apply, coordinator cannot close
      return false;
    }
    
    return false;
  }

  // Check if user is the head of the ticket's unit/directorate
  isUserHeadOfTicketUnit(ticket) {
    // This would need to be passed from the backend or stored in user context
    // For now, we'll check if the user's section_unit matches the ticket's section
    const userUnitSection = this.getCurrentUserUnitSection();
    const ticketSection = ticket?.section || ticket?.unit_section;
    
    if (!userUnitSection || !ticketSection) return false;
    
    // Normalize section names for comparison
    const normalizedUserSection = userUnitSection.toLowerCase().replace(/\s+/g, '-');
    const normalizedTicketSection = ticketSection.toLowerCase().replace(/\s+/g, '-');
    
    return normalizedUserSection === normalizedTicketSection;
  }

  // Get current user's section_unit (this should come from user context)
  getCurrentUserUnitSection() {
    // Return the section_unit passed to the constructor
    return this.userUnitSection;
  }

  // Get current user ID from localStorage/sessionStorage
  getCurrentUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }

  // Get role color for UI display
  getRoleColor() {
    return this.rolePermissions?.color || '#666';
  }

  // Get role description
  getRoleDescription() {
    return this.rolePermissions?.description || 'No description available';
  }

  // Get SLA hours for the role
  getSLAHours() {
    return this.rolePermissions?.sla_hours || 24;
  }

  // Debug method to help troubleshoot permission issues
  debugClosePermission(ticket) {
    const debug = {
      userRole: this.userRole,
      ticketSection: ticket?.section,
      ticketComplaintType: ticket?.complaintType,
      ticketWorkflowPath: ticket?.workflow_path,
      ticketStatus: ticket?.status,
      reversedCount: ticket?.reversed_count,
      canCloseWorkflow: this.canCloseWorkflow(ticket?.workflow_path),
      canCloseAtCurrentStep: this.canCloseAtCurrentStep(ticket),
      rolePermissions: this.rolePermissions,
      specialSections: this.rolePermissions?.can_close_special
    };
    
    console.log('🔍 Close Permission Debug:', debug);
    return debug;
  }
}

// Export utility functions
export const hasPermission = (userRole, action) => {
  const permissionManager = new PermissionManager(userRole);
  return permissionManager.canPerformAction(action);
};

export const canAccessStage = (userRole, workflowStage) => {
  const permissionManager = new PermissionManager(userRole);
  return permissionManager.canAccessWorkflowStage(workflowStage);
};

export const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || null;
};

export const getWorkflowPath = (workflowPath) => {
  return WORKFLOW_PATHS[workflowPath] || null;
}; 