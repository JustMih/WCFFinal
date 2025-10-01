// Test script for head-of-unit permissions
import { PermissionManager, ACTIONS } from './src/utils/permissions.js';

console.log('🧪 Testing Head-of-Unit and Coordinator Permissions...\n');

// Test Case 1: Head of Unit from Directorate of Operations
console.log('📋 Test Case 1: Head of Unit from Directorate of Operations');
const headOfOperations = new PermissionManager('head-of-unit', 'directorate of operations');

const ticketFromOperations = {
  section: 'directorate of operations',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'head-of-unit',
  complaint_type: 'minor'
};

console.log('User Role:', headOfOperations.userRole);
console.log('User Unit Section:', headOfOperations.userUnitSection);
console.log('Ticket Section:', ticketFromOperations.section);
console.log('Is User Head of Ticket Unit:', headOfOperations.isUserHeadOfTicketUnit(ticketFromOperations));
console.log('Can Close at Current Step:', headOfOperations.canCloseAtCurrentStep(ticketFromOperations));
console.log('---');

// Test Case 2: Head of Unit from ICT Unit
console.log('📋 Test Case 2: Head of Unit from ICT Unit');
const headOfICT = new PermissionManager('head-of-unit', 'ict unit');

const ticketFromICT = {
  section: 'ict unit',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'head-of-unit',
  complaint_type: 'minor'
};

console.log('User Role:', headOfICT.userRole);
console.log('User Unit Section:', headOfICT.userUnitSection);
console.log('Ticket Section:', ticketFromICT.section);
console.log('Is User Head of Ticket Unit:', headOfICT.isUserHeadOfTicketUnit(ticketFromICT));
console.log('Can Close at Current Step:', headOfICT.canCloseAtCurrentStep(ticketFromICT));
console.log('---');

// Test Case 3: Head of Unit trying to close ticket from different unit
console.log('📋 Test Case 3: Head of Unit trying to close ticket from different unit');
const ticketFromDifferentUnit = {
  section: 'public relation unit',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'head-of-unit',
  complaint_type: 'minor'
};

console.log('User Role:', headOfOperations.userRole);
console.log('User Unit Section:', headOfOperations.userUnitSection);
console.log('Ticket Section:', ticketFromDifferentUnit.section);
console.log('Is User Head of Ticket Unit:', headOfOperations.isUserHeadOfTicketUnit(ticketFromDifferentUnit));
console.log('Can Close at Current Step:', headOfOperations.canCloseAtCurrentStep(ticketFromDifferentUnit));
console.log('---');

// Test Case 4: Coordinator from Public Relations Unit - should be able to close
console.log('📋 Test Case 4: Coordinator from Public Relations Unit');
const coordinatorFromPR = new PermissionManager('coordinator', 'public relation unit');

const ticketFromPR = {
  section: 'public relation unit',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'coordinator',
  complaint_type: 'minor'
};

console.log('User Role:', coordinatorFromPR.userRole);
console.log('User Unit Section:', coordinatorFromPR.userUnitSection);
console.log('Ticket Section:', ticketFromPR.section);
console.log('Can Close at Current Step:', coordinatorFromPR.canCloseAtCurrentStep(ticketFromPR));
console.log('---');

// Test Case 5: Coordinator from Directorate of Operations - should NOT be able to close
console.log('📋 Test Case 5: Coordinator from Directorate of Operations');
const coordinatorFromOperations = new PermissionManager('coordinator', 'directorate of operations');

const ticketFromOperationsForCoordinator = {
  section: 'directorate of operations',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'coordinator',
  complaint_type: 'minor'
};

console.log('User Role:', coordinatorFromOperations.userRole);
console.log('User Unit Section:', coordinatorFromOperations.userUnitSection);
console.log('Ticket Section:', ticketFromOperationsForCoordinator.section);
console.log('Can Close Workflow:', coordinatorFromOperations.canCloseWorkflow(ticketFromOperationsForCoordinator.workflow_path));
console.log('Can Close at Current Step:', coordinatorFromOperations.canCloseAtCurrentStep(ticketFromOperationsForCoordinator));
console.log('Available Actions:', coordinatorFromOperations.getAvailableActions(ticketFromOperationsForCoordinator, 'coordinator_review'));
console.log('---');

// Test Case 6: Coordinator from different unit trying to close ticket from Public Relations
console.log('📋 Test Case 6: Coordinator from different unit trying to close PR ticket');
const ticketFromPRForOtherCoordinator = {
  section: 'public relation unit',
  workflow_path: 'MINOR_UNIT',
  workflow_current_role: 'coordinator',
  complaint_type: 'minor'
};

console.log('User Role:', coordinatorFromOperations.userRole);
console.log('User Unit Section:', coordinatorFromOperations.userUnitSection);
console.log('Ticket Section:', ticketFromPRForOtherCoordinator.section);
console.log('Can Close at Current Step:', coordinatorFromOperations.canCloseAtCurrentStep(ticketFromPRForOtherCoordinator));

console.log('\n✅ Testing completed!'); 