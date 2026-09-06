# Workflow-First Component Roadmap

**Focus:** Build ONLY workflow-related components  
**Approach:** Keep design system structure, skip non-workflow components  
**Timeline:** 2-3 weeks to complete all workflow components  
**Status:** Phase 1 - Workflow Components

---

## 🎯 Essential Workflow Components (10 Total)

### Core Components (Required)

1. ✅ **Button** - Workflow actions (already complete)
2. ✅ **Input** - Node properties (already complete)
3. ⏳ **Badge** - Status indicators (running, success, error, pending)
4. ⏳ **Select** - Dropdowns for node types, conditions, branches
5. ⏳ **Dialog** - Node editor modal, confirmation dialogs
6. ⏳ **Node** - Visual workflow node component

### Composite Sections (Built from Components)

7. ⏳ **NodeEditor** - Form for editing node properties
8. ⏳ **PropertiesPanel** - Right-side node configuration panel
9. ⏳ **Toolbar** - Top workflow controls (save, run, clear, etc.)
10. ⏳ **WorkflowStatus** - Execution status display

### External (Not Building - Use Libraries)

- **Canvas** - Use React Flow library directly
- **Connections** - Use React Flow for edges

---

## 📊 Build Priority Order

```
Week 1:
  ✅ Button         (DONE)
  ✅ Input          (DONE)
  ⏳ Badge          (2 hours)      → Status indicators
  ⏳ Select         (2-3 hours)    → Node type picker

Week 2:
  ⏳ Dialog         (2 hours)      → Node editor modal
  ⏳ Node           (3 hours)      → Workflow node visual
  ⏳ NodeEditor     (2 hours)      → Property form wrapper

Week 3:
  ⏳ PropertiesPanel (2 hours)     → Composition
  ⏳ Toolbar        (1.5 hours)    → Composition
  ⏳ WorkflowStatus (1.5 hours)    → Composition
```

**Total Estimated Time:** 16-18 hours (~2-3 weeks)

---

## 🔄 Component Dependencies

```
Canvas (React Flow)
  ├── Node (workflow node)
  │   ├── Badge (status display)
  │   └── Icon (status icon)
  │
  ├── PropertiesPanel
  │   ├── NodeEditor
  │   │   ├── Input
  │   │   ├── Select
  │   │   └── Button
  │   └── Dialog (open node editor)
  │
  ├── Toolbar
  │   └── Button (actions)
  │
  └── WorkflowStatus
      ├── Badge (workflow status)
      └── Text (execution info)
```

---

## 📋 Component Specifications

### 1. Badge ⏳ NEXT

**Purpose:** Status indicators on nodes and workflows

**Variants:**

- `status-pending` - Awaiting execution
- `status-running` - Currently executing
- `status-success` - Completed successfully
- `status-error` - Failed with error
- `status-cancelled` - Manually stopped
- `status-skipped` - Skipped execution

**Props:**

```typescript
interface BadgeProps {
  variant?: "pending" | "running" | "success" | "error" | "cancelled" | "skipped";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
}
```

**Styling:** Match admin-ui status badge style

- Small pill shape
- Semantic colors (green=success, red=error, yellow=pending)
- Optional icon + text

---

### 2. Select ⏳ (After Badge)

**Purpose:** Dropdowns for node type, conditions, branches

**Use Cases:**

- Select node type (trigger, action, condition, etc.)
- Select condition operator (equals, contains, greater than, etc.)
- Select branch/path (if-then-else options)
- Select existing node/workflow

**Props:**

```typescript
interface SelectProps {
  label?: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  isDisabled?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
}
```

**Build with:** Radix UI `@radix-ui/react-select`

---

### 3. Dialog ⏳ (After Select)

**Purpose:** Modal for node editing, confirmations, settings

**Use Cases:**

- Edit node properties
- Confirm delete node/workflow
- Configure trigger settings
- View execution details

**Props:**

```typescript
interface DialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  actions?: { label: string; onClick: () => void; variant?: "primary" | "danger" }[];
}
```

**Build with:** Radix UI `@radix-ui/react-dialog`

---

### 4. Node ⏳ (After Dialog)

**Purpose:** Visual workflow node component for React Flow

**Properties:**

- Node type (trigger, action, condition, etc.)
- Status (pending, running, success, error)
- Selected state
- Custom data (config, outputs)

**Props:**

```typescript
interface WorkflowNodeProps {
  id: string;
  type: "trigger" | "action" | "condition" | "branch" | "end";
  data: {
    label: string;
    status?: "pending" | "running" | "success" | "error";
    icon?: ReactNode;
    config?: Record<string, any>;
  };
  selected?: boolean;
  isConnecting?: boolean;
}
```

**Visual Design:**

- Rounded rectangle container
- Icon + label
- Status badge (bottom-right)
- Connection ports (top input, bottom outputs)
- Selection highlight border
- Hover effects

---

### 5. NodeEditor ⏳ (After Node)

**Purpose:** Form wrapper for editing node properties

**Features:**

- Dynamic form fields based on node type
- Input, Select, Checkbox, Textarea
- Save/Cancel buttons
- Validation messages
- Section grouping (general, conditions, actions, etc.)

**Props:**

```typescript
interface NodeEditorProps {
  nodeType: string;
  nodeData: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  schema?: FormSchema;
}
```

**Built from:** Composition of Input, Select, Button

---

### 6. PropertiesPanel ⏳ (After NodeEditor)

**Purpose:** Right-side panel showing selected node properties

**Features:**

- Node information (type, status, created date)
- Edit button → opens NodeEditor in Dialog
- Node statistics (executions, success rate, last run)
- Advanced options (retry policy, timeout, etc.)
- Delete button

**Composition:**

```
PropertiesPanel
├── Header (node title, close button)
├── NodeInfo (type, status, dates)
├── NodeEditor (properties form)
├── Statistics (executions, success rate)
└── Actions (edit, delete, copy)
```

---

### 7. Toolbar ⏳ (After PropertiesPanel)

**Purpose:** Top workflow control bar

**Buttons:**

- Run/Execute workflow
- Stop/Pause execution
- Save workflow
- Undo/Redo
- Zoom (in/out/fit)
- Delete selected node
- View mode toggle (edit/view)

**Props:**

```typescript
interface ToolbarProps {
  workflowStatus: "idle" | "running" | "paused" | "error";
  canUndo: boolean;
  canRedo: boolean;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  // ... other handlers
}
```

**Built from:** Button components with icons

---

### 8. WorkflowStatus ⏳ (After Toolbar)

**Purpose:** Display workflow execution status and statistics

**Displays:**

- Overall status (success, error, running, etc.)
- Execution time
- Nodes executed / total nodes
- Last execution time
- Error message (if failed)

**Composition:**

```
WorkflowStatus
├── Status Badge
├── Execution Time
├── Nodes Progress (X/Y executed)
├── Last Run Info
└── Error Message (if error)
```

---

## 🛠️ Build Checklist

### Phase 1: Core Components ✅

- ✅ Button (complete with stories + tests)
- ✅ Input (complete with stories + tests)

### Phase 2: UI Components ⏳

- ⏳ Badge (component + stories + tests)
- ⏳ Select (component + stories + tests)
- ⏳ Dialog (component + stories + tests)

### Phase 3: Workflow Components ⏳

- ⏳ Node (component + stories + tests)
- ⏳ NodeEditor (composite + stories)
- ⏳ PropertiesPanel (composite + stories)
- ⏳ Toolbar (composite + stories)
- ⏳ WorkflowStatus (composite + stories)

---

## 📁 Folder Structure (Workflow-Only)

```
packages/design-system/src/components/
├── button/              ✅ DONE
├── input/               ✅ DONE
├── badge/               ⏳ Next
├── select/              ⏳
├── dialog/              ⏳
├── node/                ⏳
├── node-editor/         ⏳
├── properties-panel/    ⏳
├── toolbar/             ⏳
└── workflow-status/     ⏳
```

**Unused (Skip these):**

- Checkbox, Radio, Alert, Card, Tabs, etc.

---

## 🎨 Workflow UI Layout

```
┌─────────────────────────────────────────────────┐
│ Toolbar (Run, Save, Undo, Redo, Zoom, etc.)    │
├───────────────────┬─────────────────────────────┤
│                   │                             │
│   Canvas          │   PropertiesPanel           │
│   (React Flow)    │   ├─ Node Info              │
│                   │   ├─ NodeEditor Form       │
│  ┌─────────────┐  │   │  (Input, Select, etc) │
│  │  [Trigger]──┤  │   ├─ Statistics            │
│  └──────┬──────┘  │   └─ Actions               │
│         │         │                             │
│  ┌──────▼──────┐  │                             │
│  │  [Action] ──┤  │                             │
│  └──────┬──────┘  │                             │
│         │         │                             │
│  ┌──────▼──────┐  │                             │
│  │ [Condition] │  │                             │
│  └─────────────┘  │                             │
│                   │                             │
├───────────────────┴─────────────────────────────┤
│ WorkflowStatus (Execution info, progress, etc) │
└─────────────────────────────────────────────────┘
```

---

## 🔌 Integration with n8n

**What we're building:** Workflow UI components  
**What we're reusing:** React Flow for visualization  
**Pattern:** n8n-inspired component architecture but workflow-focused

Not building:

- Full editor UI (use your existing admin-ui)
- Node library/registry (backend concern)
- Execution engine (backend concern)
- Data transformation (backend concern)

---

## ✅ Success Criteria

- ✅ 10 workflow-focused components built
- ✅ All matching Pimsathon admin-ui design
- ✅ Full Storybook documentation
- ✅ Unit tests (10+ per component)
- ✅ Can build a workflow UI with these components
- ✅ Extensible for future workflow features

---

## 📈 Timeline Summary

```
Week 1:
  Mon-Tue: Badge + Select (4-5 hours)
  Wed-Thu: Dialog (2 hours)
  Fri:     Node (3 hours) = 9-10 hours

Week 2:
  Mon-Tue: NodeEditor + PropertiesPanel (4 hours)
  Wed-Thu: Toolbar + WorkflowStatus (3 hours)
  Fri:     Polish, tests, documentation = 7 hours

Total: ~16-18 hours actual dev time
Actual calendar time: 2-3 weeks (depending on work schedule)
```

---

## 🚀 Ready to Start?

Next component: **Badge** (2 hours)

- Simple display component
- 6 status variants
- Icon + text
- Matches your admin-ui style

Continue to next component? 🎯
