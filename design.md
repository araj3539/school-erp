# School ERP — Product and UI Design System

> **Purpose:** Visual and interaction source of truth.
> The current UI is a functional admin dashboard using React + Tailwind and reusable primitives.
> Future work should evolve this design instead of introducing unrelated visual systems.

---

## 1. Design Goals

The interface should feel:
- professional
- calm
- trustworthy
- fast
- familiar to school office staff
- information-dense without feeling crowded
- usable on desktop first
- responsive for tablets/mobile
- accessible

The primary audience is not software engineers. It is:
- principals
- accountants
- teachers
- office staff

Therefore, clarity is more important than visual novelty.

---

## 2. Current UI Foundation

Current reusable components include:

```text
Button
Input
Select
Card
Modal
Table
Tabs
Badge
Toaster
Header
Sidebar
```

Keep this component system.

Avoid introducing Material UI, Ant Design, Chakra, shadcn, etc. merely for convenience unless there is an explicit architecture decision.

---

## 3. Layout

Current primary layout:

```text
+------------------------------------------------------+
| Header                                               |
+-------------+----------------------------------------+
| Sidebar     | Main content                           |
|             |                                        |
| Dashboard   | Page title                             |
| Students    | Filters / actions                      |
| Teachers    |                                        |
| Classes     | Cards / tables / forms                 |
| Attendance  |                                        |
| Fees        |                                        |
| Reports     |                                        |
| Settings    |                                        |
+-------------+----------------------------------------+
```

Future role-specific navigation should be generated from permissions/modules.

---

## 4. Navigation

Recommended groups:

### Overview
- Dashboard

### People
- Students
- Teachers
- Staff
- Guardians

### Academics
- Classes
- Sections
- Subjects
- Timetable
- Exams
- Results
- Homework

### Operations
- Attendance
- Fees
- Payments
- Library
- Transport
- Inventory

### Communication
- Notices
- Notifications
- SMS

### Reports
- Student reports
- Attendance
- Fees
- Results
- Payroll
- Expenses
- Audit

### Administration
- Users
- School settings
- Academic years
- Modules

Do not show irrelevant modules when a school has not enabled them.

---

## 5. Page Pattern

A standard admin page should generally follow:

```text
Page title
Short context/help text (when useful)
Primary action
--------------------------------
Filters/search
--------------------------------
Summary cards (only when useful)
--------------------------------
Main content/table
--------------------------------
Pagination
```

Avoid putting every possible metric into cards.

---

## 6. Tables

Tables are central to ERP usage.

Required behaviors:
- clear column names
- consistent spacing
- hover state
- row actions
- pagination
- loading skeleton/state
- empty state
- error state
- responsive horizontal scrolling where necessary
- sortable columns where useful

For large tables:
- server-side pagination
- server-side filtering
- debounced search

Do not fetch thousands of records merely to filter in React.

---

## 7. Forms

Forms should:
- group related fields
- use labels
- show validation beside fields
- preserve user input after validation errors
- disable submit while saving
- show success/failure feedback
- use sensible defaults
- avoid unnecessary fields

Example student form groups:

```text
Basic Information
Parent/Guardian Information
Academic Information
Contact Information
Documents
```

---

## 8. Modals

Use modals for:
- short CRUD forms
- confirmations
- quick actions

Use full pages for:
- complex admissions
- long student profiles
- multi-step workflows
- detailed reports

Never place a huge workflow into a small modal.

---

## 9. Destructive Actions

Deletion/deactivation must:
- clearly communicate the effect
- require confirmation
- explain if the operation is irreversible
- prefer deactivation/soft delete for important entities

Financial deletion should generally not exist as a normal UI action.

---

## 10. Status Presentation

Use consistent semantic labels:

```text
Active
Inactive
Pending
Paid
Partial
Overdue
On Leave
Transferred
Graduated
```

Do not rely on color alone.

Each status should have:
- text
- optional icon
- consistent semantic styling

---

## 11. Dashboard

Current dashboard already supports:
- total students
- teachers
- classes
- pending fees
- attendance rate
- collection
- recent admissions
- charts

Future dashboard should be role-aware.

### Principal
- attendance
- fee collection
- pending dues
- student/teacher count
- notices
- alerts

### Accountant
- today's collection
- overdue fees
- pending payments
- collection trend

### Teacher
- today's classes
- attendance
- homework
- notices

### Parent
- children
- attendance
- fees
- homework
- notices

Avoid a one-dashboard-fits-all approach.

---

## 12. Student Detail Design

Student detail should become a high-value page.

Recommended sections:

```text
Header
  Photo
  Name
  Admission No
  Class/Section
  Status
  Quick actions

Tabs
  Overview
  Attendance
  Fees
  Results
  Homework
  Documents
  Activity
```

This prevents one extremely long page.

---

## 13. Fee UX

Fees are high-risk and should be visually clear.

Show:

```text
Total Due
Paid
Balance
Overdue
```

Payment flow:

```text
Select student
  ↓
Show outstanding fees
  ↓
Select fee
  ↓
Enter amount
  ↓
Select payment mode
  ↓
Confirm
  ↓
Create payment
  ↓
Generate receipt
```

The final amount must come from the server.

---

## 14. Attendance UX

Teacher workflow should be extremely fast:

```text
Select class
Select section
Select date
      ↓
Student list
      ↓
Present / Absent / Late / Leave
      ↓
Save Attendance
```

Include:
- mark all present
- quick status changes
- absent-only review
- save indicator
- correction history for authorized users

---

## 15. Notifications UX

Every async operation needs visible feedback.

Examples:
- "Student created successfully."
- "Attendance saved."
- "Payment collected. Receipt generated."
- "Upload failed. Try again."

Do not rely only on console logs.

---

## 16. Responsive Design

Desktop is the primary admin target.

Tablet:
- collapsible sidebar
- responsive tables
- touch-friendly controls

Mobile:
- parent/teacher experiences should eventually use the mobile app
- web should remain usable for basic access

Minimum touch target should be comfortable for touch users.

---

## 17. Accessibility

Required:
- semantic HTML
- labels
- keyboard navigation
- visible focus
- accessible modal behavior
- proper table headers
- meaningful error messages
- alt text for images
- no color-only status communication

---

## 18. Branding

Each school can eventually configure:
- logo
- school name
- primary color
- report header
- receipt header
- contact information

Do not hardcode school identity.

The platform itself should retain a neutral base visual identity.

---

## 19. Empty States

Every data page should distinguish:

### Loading
"Loading students..."

### Empty
"No students found."

### Filtered empty
"No students match these filters."

### Error
"Unable to load students. Try again."

Do not display a blank table and leave users guessing.

---

## 20. Mobile App Design Direction

Use the same product language as the web app.

Parent home:

```text
Child selector
      ↓
Attendance
Fees
Homework
Results
Notices
Timetable
```

Teacher home:

```text
Today's classes
Attendance
Homework
Marks
Notices
Timetable
```

Keep mobile actions task-oriented rather than dashboard-heavy.

---

## 21. Design Anti-Patterns

Avoid:
- excessive gradients
- decorative animations
- oversized dashboard cards
- tiny text
- hidden primary actions
- inconsistent button colors
- different modal styles
- different table styles
- uncontrolled browser alerts
- giant forms with no grouping
- unnecessary confirmation dialogs
- color-only status indicators

---

## 22. Current UI Technical Notes

The current pages use many inline utility classes and some page-specific markup.

As the product grows:
- extract repeated patterns
- create design tokens
- create shared page header
- create shared filter bar
- create shared data table states
- create shared confirmation dialog
- create shared form sections

Do not abstract every `<div>` into a component. Abstract repeated behavior, not every HTML element.

---

## Documentation Lifecycle & Design Governance

This design document is a **living UI/UX source of truth**. It must evolve with the actual product interface while preserving consistency.

### Status Metadata

- **Document version:** 1.1.0
- **Lifecycle status:** Living / actively maintained
- **Baseline verified:** 11 August 2026
- **Current implementation state:** Functional admin-oriented interface under active development
- **Next mandatory review:** After major screen/module additions, navigation changes, design-system changes, or responsive/accessibility changes

### Current vs Target Design

Clearly distinguish:
- **CURRENT:** verified UI behavior/styles/components already present
- **TARGET:** approved design that has not yet been implemented
- **DEPRECATED:** old pattern that should not be extended

Do not describe target screens or components as if users can already access them.

### Update Triggers

Update this document when:
- a new major screen/workflow is added
- navigation, role-specific dashboards, or information architecture changes
- design tokens/components change
- responsive behavior changes
- accessibility requirements are discovered
- forms, tables, dialogs, notifications, or destructive-action patterns change

### UI Verification Rule

A design requirement is considered implemented only after the corresponding UI exists and has been manually or automatically verified at the relevant viewport/role.

### AI Rule

AI agents must reuse the established component and interaction patterns before introducing new ones. If a new pattern is genuinely required, document the decision here and implement it consistently.

### Versioning

- **MAJOR:** fundamental visual language or information-architecture change
- **MINOR:** new screen/workflow/component family or meaningful UX rule
- **PATCH:** copy, spacing, documentation, or clarification correction

### Changelog

| Version | Date | Change | Verified By |
|---|---|---|---|
| 1.1.0 | 2026-08-11 | Added living design lifecycle, CURRENT/TARGET states, verification, and versioning. | AI-assisted repository review |
| 1.0.0 | 2026-08-11 | Initial design-system documentation. | AI-assisted repository review |

