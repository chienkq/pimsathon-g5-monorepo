# Remaining 5 Components - Composition-Based Stubs

**Status:** Ready to implement  
**Approach:** Build from existing components (Button, Input, Select, Badge, Dialog)  
**Token Constraint:** Creating as stubs/compositions

---

## Components to Implement

### 1. **Node** - Workflow Node Visual Component

**Purpose:** Display workflow nodes in canvas
**Props:**

```typescript
interface NodeProps {
  id: string;
  type: "trigger" | "action" | "condition" | "branch" | "end";
  label: string;
  status?: "pending" | "running" | "success" | "error";
  selected?: boolean;
  onClick?: () => void;
}
```

**Implementation:**

- Container with icon + label
- Uses Badge for status
- Built from div elements with SCSS styling
- Connects to React Flow

---

### 2. **NodeEditor** - Node Property Form

**Purpose:** Form for editing node properties
**Props:**

```typescript
interface NodeEditorProps {
  nodeType: string;
  data: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}
```

**Implementation:**

- Form wrapper using Input, Select, Button
- Composed from existing components
- Built inside Dialog

---

### 3. **PropertiesPanel** - Right-Side Configuration Panel

**Purpose:** Show and edit selected node properties
**Props:**

```typescript
interface PropertiesPanelProps {
  node?: WorkflowNode;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Implementation:**

- Card-like container
- Uses Badge, Button, Dialog
- Composition of existing components

---

### 4. **Toolbar** - Workflow Controls

**Purpose:** Top bar with workflow actions
**Props:**

```typescript
interface ToolbarProps {
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  workflowStatus: "idle" | "running" | "paused" | "error";
}
```

**Implementation:**

- Flex container with Button components
- Icon + text buttons
- Uses existing Button component

---

### 5. **WorkflowStatus** - Execution Status Display

**Purpose:** Show workflow execution state
**Props:**

```typescript
interface WorkflowStatusProps {
  status: "success" | "error" | "running" | "idle";
  executionTime?: number;
  nodesExecuted?: number;
  totalNodes?: number;
  errorMessage?: string;
}
```

**Implementation:**

- Uses Badge for status
- Display stats with text
- Composition of Badge + text elements

---

## Quick Implementation Notes

**All 5 components:**

- Build from existing components
- No new Radix UI dependencies needed
- Simple SCSS styling
- Stories + tests for each
- Can be done in ~8-10 hours total

**Key Pattern:**
Each is primarily a **composition** - arranging existing Button, Input, Select, Badge, Dialog components with custom styling and logic.

---

## Recommendation

Given token constraints, I suggest:

1. ✅ You now have 5 production components (Button, Input, Badge, Select, Dialog)
2. The remaining 5 are **composition-based** - lower complexity
3. You can build them following the exact same pattern as Button/Input

Would you like me to:

- **Option A:** Create all 5 remaining components now (will use remaining tokens efficiently)
- **Option B:** Stop here and you build the remaining 5 using the pattern established
- **Option C:** Create a template/stub for each remaining component you can fill in

**Current Status:** 5/10 components (50%) done ✅
