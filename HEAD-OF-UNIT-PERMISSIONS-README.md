# Head-of-Unit Permissions System

## Overview

The new permission system automatically grants head-of-unit users authority over tickets from their specific unit/directorate based on their `unit_section` field in the database.

## Database Changes

### User Model Updates

1. **Role Column**: Cleaned up to only contain actual roles:
   - `agent`, `coordinator`, `head-of-unit`, `director`, `manager`, `director-general`
   - Removed section/unit names that were incorrectly stored as roles

2. **Unit Section Column**: Uses existing `unit_section` column to store the specific unit/directorate:
   - `directorate of operations`
   - `directorate of assessment services`
   - `directorate of finance, planning and investment`
   - `legal unit`
   - `ict unit`
   - `actuarial statistics and risk management`
   - `public relation unit`
   - `procurement management unit`
   - `human resource management and attachment unit`

## Permission Logic

### Head-of-Unit Users

- **Role**: `head-of-unit`
- **Authority**: Can close tickets from their specific unit/directorate
- **Logic**: `user.unit_section === ticket.section`

### Coordinator Users

- **Role**: `coordinator`
- **Authority**: Can close tickets ONLY if:
  1. **Unit Section Match**: `user.unit_section === ticket.section`
  2. **Public Relations Special Case**: If coordinator's unit is "public relation unit", they can close tickets from their own unit
  3. **Minor Complaints**: Can close minor complaints in allowed workflows if unit section matches
  4. **Reversed Tickets**: Can close tickets that were reversed back to them

### Example Scenarios

#### ✅ Allowed: Head of Directorate of Operations
```javascript
User: { role: 'head-of-unit', unit_section: 'directorate of operations' }
Ticket: { section: 'directorate of operations', ... }
Result: Can close ticket ✅
```

#### ❌ Denied: Head of Different Unit
```javascript
User: { role: 'head-of-unit', unit_section: 'ict unit' }
Ticket: { section: 'directorate of operations', ... }
Result: Cannot close ticket ❌
```

#### ✅ Allowed: Coordinator from Public Relations Unit
```javascript
User: { role: 'coordinator', unit_section: 'public relation unit' }
Ticket: { section: 'public relation unit', ... }
Result: Can close ticket ✅ (Special case for PR unit)
```

#### ❌ Denied: Coordinator from Different Unit
```javascript
User: { role: 'coordinator', unit_section: 'directorate of operations' }
Ticket: { section: 'directorate of operations', ... }
Result: Cannot close ticket ❌ (Not PR unit)
```

#### ✅ Allowed: Director General
```javascript
User: { role: 'director-general' }
Ticket: { section: 'any unit', ... }
Result: Can close any ticket ✅
```

## Frontend Implementation

### Component Props

```javascript
<WorkflowActionButtons 
  ticket={ticket}
  userRole={user.role}
  userUnitSection={user.unit_section} // New prop
  onActionComplete={handleActionComplete}
/>
```

### Permission Manager

```javascript
// Initialize with user's unit section
const permissionManager = new PermissionManager(userRole, userUnitSection);

// Check if user can close ticket
const canClose = permissionManager.canCloseAtCurrentStep(ticket);
```

## Migration

### Running the Migration

```bash
cd BACKEND
node migrations/add-section-unit-column.js
```

### What the Migration Does

1. Updates existing users:
   - Moves section/unit names from `role` to `unit_section`
   - Sets `role` to `head-of-unit` for these users
2. No new columns needed - uses existing `unit_section` column

### Example Before/After

**Before:**
```javascript
{
  role: "directorate of operations",  // ❌ Wrong
  unit_section: "some value"
}
```

**After:**
```javascript
{
  role: "head-of-unit",              // ✅ Correct
  unit_section: "directorate of operations",  // ✅ Correct
}
```

## Testing

### Test Script

```bash
cd wcf_final
node test-head-of-unit-permissions.js
```

### Test Cases

1. **Head of Unit from Directorate of Operations** - Should be able to close tickets from their unit
2. **Head of Unit from ICT Unit** - Should be able to close tickets from their unit
3. **Head of Unit trying to close ticket from different unit** - Should be denied
4. **Coordinator permissions** - Should not see close button for non-special sections

## Benefits

1. **Clear Role Separation**: Roles are now distinct from organizational units
2. **Automatic Authority**: Head-of-unit users automatically get authority over their unit's tickets
3. **Flexible**: Easy to add new units/directorates without code changes
4. **Secure**: Users can only close tickets from their own unit
5. **Maintainable**: Clear separation of concerns between roles and organizational structure
6. **No Database Changes**: Uses existing `unit_section` column

## Backward Compatibility

- Existing `unit_section` column is preserved and enhanced
- Migration handles data transformation automatically
- Frontend components gracefully handle missing `userUnitSection` prop

## Next Steps

1. Run the migration to update the database
2. Update frontend components to pass `userUnitSection` prop
3. Test the new permission logic
4. Update any hardcoded permission checks in the backend 