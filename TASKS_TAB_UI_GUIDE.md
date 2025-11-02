# TasksTab UI Feature Guide

## Visual Overview

The TasksTab is located in the inbox panel alongside Email, Invoices, Calendar, and Leads tabs.

### Main View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 📧 Email  💰 Invoices  📅 Calendar  👥 Leads  ✅ Tasks     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 [Search tasks...]                          [↻] [⚙️]    │
│                                                             │
│  🔽 [Status: All]  🔽 [Priority: All]  [Clear filters]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐         │
│  │ 12 │  │ 5  │  │ 3  │  │ 4  │  │ 2  │  │ 1  │         │
│  │Tot │  │Todo│  │Prog│  │Done│  │🔥Ur│  │⚠️Ov│         │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ OVERDUE                                         [2]     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Follow up with Hans Jensen                      │   │
│  │ 📝 Call customer about invoice                  ⚠️ │   │
│  │ [urgent] [todo]                        [👁️ View]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📅 TODAY                                           [3]     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟠 Send quote for cleaning service              │   │
│  │ 📋 Review today's appointments                      │   │
│  │ [high] [in_progress]              [✓ Complete]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔜 TOMORROW                                        [1]     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 Prepare monthly report                          │   │
│  │ [medium] [todo]                        [👁️ View]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📆 THIS WEEK                                       [4]     │
│  📝 NO DUE DATE                                     [2]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key UI Features

### 1. Search & Filter Bar
- **Search Input**: Real-time filtering by task title or description
- **Status Filter Dropdown**: Filter by Todo, In Progress, Done, Cancelled
- **Priority Filter Dropdown**: Filter by Low, Medium, High, Urgent
- **Clear Filters Button**: Reset all filters at once

### 2. Statistics Dashboard (6 Cards)
```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Total   │   Todo   │   In     │   Done   │ 🔥 Urgent│ ⚠️ Overdue│
│    12    │    5     │ Progress │    4     │    2     │    1     │
│          │          │    3     │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 3. Task Cards with Priority Colors
- **🔴 Red Border (Urgent)**: Critical tasks requiring immediate attention
- **🟠 Orange Border (High)**: Important tasks with high priority
- **🟡 Yellow Border (Medium)**: Standard priority tasks
- **🔵 Blue Border (Low)**: Low priority tasks

### 4. Task Card Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴│ Task Title Here                                         │
│   │ Optional description text...                            │
│   │ 🕐 Due: Tomorrow, 15:00                                 │
│   │                                                          │
│   │ [urgent] [todo] [lead:123]        [✓ Complete] [👁️ View]│
└─────────────────────────────────────────────────────────────┘
```

### 5. Task Detail Modal

When clicking "View" on a task:

```
┌───────────────────────────────────────────────────────────┐
│  ✅ Task Details                           [✏️ Edit] [🗑️]  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Follow up with Hans Jensen                              │
│  Need to call regarding outstanding invoice payment      │
│                                                           │
│  [todo] [urgent] [⚠️ Overdue]                            │
│                                                           │
│  Created: 25. okt. 2025                                  │
│  Due: 1. nov. 2025                                       │
│  Related to: lead:123                                    │
│                                                           │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  ✨ AI Task Analysis                  [Analyze with AI]  │
│                                                           │
│  Click "Analyze with AI" to get intelligent insights     │
│  about this task.                                        │
│                                                           │
│  ──────────────────────────────────────────────────────  │
│                                                           │
│  [Start Task] [✓ Complete] [✕ Cancel]                    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 6. Edit Mode

When clicking the Edit button:

```
┌───────────────────────────────────────────────────────────┐
│  ✅ Task Details                                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Title                                                    │
│  [Follow up with Hans Jensen________________]            │
│                                                           │
│  Description                                              │
│  [Need to call regarding outstanding_______]             │
│  [invoice payment_________________________]             │
│  [_______________________________________]             │
│                                                           │
│  Priority          Status                                │
│  [Urgent ▾]       [Todo ▾]                              │
│                                                           │
│  Due Date                                                │
│  [2025-11-01]                                           │
│                                                           │
│  [✓ Save Changes]  [✕ Cancel]                           │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 7. Delete Confirmation Dialog

```
┌─────────────────────────────────────┐
│  Er du sikker?                      │
│                                     │
│  Denne handling kan ikke fortrydes. │
│  Dette vil permanent slette         │
│  opgaven.                           │
│                                     │
│  [Annuller]     [Slet opgave]      │
└─────────────────────────────────────┘
```

### 8. AI Analysis Feature

After clicking "Analyze with AI":

```
┌───────────────────────────────────────────────────────────┐
│  ✨ AI Task Analysis                                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  **Priority Assessment**: This is an urgent task that    │
│  requires immediate attention due to overdue status.     │
│                                                           │
│  **Recommended Actions**:                                │
│  1. Contact Hans Jensen today via phone                  │
│  2. Send follow-up email with payment reminder           │
│  3. Check if invoice was received correctly              │
│                                                           │
│  **Risk Factors**: Payment delay may impact cash flow.  │
│  Consider offering payment plan if needed.               │
│                                                           │
│  **Related Context**: This is linked to lead:123 which  │
│  shows a history of timely payments.                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Color Coding Reference

### Priority Colors (Left Border)
- 🔴 **Red** (`border-l-red-500`): Urgent - Requires immediate action
- 🟠 **Orange** (`border-l-orange-500`): High - Important, high priority
- 🟡 **Yellow** (`border-l-yellow-500`): Medium - Standard priority
- 🔵 **Blue** (`border-l-blue-500`): Low - Can be done later

### Status Colors (Badge)
- ⚪ **Gray** (`bg-gray-100`): Todo - Not started
- 🔵 **Blue** (`bg-blue-100`): In Progress - Currently working on it
- 🟢 **Green** (`bg-green-100`): Done - Completed
- 🔴 **Red** (`bg-red-100`): Cancelled - No longer needed

### Special Indicators
- ⚠️ **Overdue Badge**: Red badge for tasks past due date
- 🔥 **Urgent Stat**: Red highlight in statistics
- ✨ **AI Feature**: Purple sparkles icon for AI analysis

## Responsive Design

### Mobile View (< 640px)
- Single column layout
- Stats cards in 2-column grid
- Simplified task cards
- Full-screen modal

### Tablet View (640px - 1024px)
- Stats in 3-column grid
- Compact filters
- Side-by-side layout where applicable

### Desktop View (> 1024px)
- Full 6-column stats grid
- All filters visible
- Optimized spacing
- Hover effects enabled

## Interaction Patterns

1. **Hover**: Task cards slightly elevate and change background
2. **Click on Card**: Opens task detail modal
3. **Click "Complete"**: Instantly marks task as done (green badge)
4. **Click "View"**: Opens full detail modal with all info
5. **Click "Edit"**: Switches modal to edit mode
6. **Click "Delete"**: Shows confirmation dialog
7. **Click "Analyze with AI"**: Shows loading state, then AI insights
8. **Search typing**: Real-time filtering with debounce
9. **Filter selection**: Instant re-grouping of tasks

## Empty States

### No Tasks
```
     ✅
    
  No tasks found
```

### No Filtered Results
```
     ✅
    
  Ingen opgaver matcher din søgning
```

### Loading State
```
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (animated)
  ▓▓▓▓▓▓▓▓▓  (animated)
  ▓▓▓▓▓▓▓▓▓▓▓▓  (animated)
```

## Accessibility Features

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators
- ✅ Screen reader friendly
- ✅ High contrast mode compatible
- ✅ Proper heading hierarchy

## Integration with Other Tabs

The TasksTab follows the same UI patterns as:
- **Email Tab**: Search bar, date grouping, detail modal
- **Invoices Tab**: AI analysis with Sparkles icon, stats cards
- **Calendar Tab**: Date-based organization
- **Leads Tab**: Statistics dashboard, filter bar, color coding
