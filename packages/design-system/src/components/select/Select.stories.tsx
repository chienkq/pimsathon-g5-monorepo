import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";

const nodeTypeOptions = [
  { label: "Trigger", value: "trigger", icon: "⚡" },
  { label: "Action", value: "action", icon: "→" },
  { label: "Condition", value: "condition", icon: "??" },
  { label: "Branch", value: "branch", icon: "⎇" },
  { label: "End", value: "end", icon: "◼" },
];

const conditionOptions = [
  { label: "Equals", value: "eq" },
  { label: "Not Equals", value: "ne" },
  { label: "Contains", value: "contains" },
  { label: "Greater Than", value: "gt" },
  { label: "Less Than", value: "lt" },
];

const meta = {
  title: "Workflow/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    state: { control: "select", options: ["default", "error", "success"] },
    isDisabled: { control: "boolean" },
    isRequired: { control: "boolean" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic select
export const Basic: Story = {
  args: {
    label: "Select Node Type",
    options: nodeTypeOptions,
    placeholder: "Choose a node type...",
  },
};

// With value selected
export const WithValue: Story = {
  args: {
    label: "Node Type",
    options: nodeTypeOptions,
    value: "action",
  },
};

// Required
export const Required: Story = {
  args: {
    label: "Node Type",
    options: nodeTypeOptions,
    isRequired: true,
  },
};

// Error state
export const Error: Story = {
  args: {
    label: "Condition",
    options: conditionOptions,
    state: "error",
    error: "Please select a condition",
  },
};

// Success state
export const Success: Story = {
  args: {
    label: "Node Type",
    options: nodeTypeOptions,
    value: "action",
    state: "success",
    hint: "Node type selected",
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    label: "Node Type",
    options: nodeTypeOptions,
    value: "action",
    isDisabled: true,
  },
};

// Sizes
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Select size="sm" label="Small" options={nodeTypeOptions} />
      <Select size="md" label="Medium" options={nodeTypeOptions} />
      <Select size="lg" label="Large" options={nodeTypeOptions} />
    </div>
  ),
};

// With hint text
export const WithHint: Story = {
  args: {
    label: "Select Condition",
    options: conditionOptions,
    hint: "Choose how to compare values",
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    label: "Node Type",
    options: nodeTypeOptions,
    isFullWidth: true,
  },
};

// Interactive with state management
export const Interactive: Story = {
  render: () => {
    const [nodeType, setNodeType] = useState("");
    const [condition, setCondition] = useState("");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "300px" }}>
        <Select label="Node Type" options={nodeTypeOptions} value={nodeType} onChange={setNodeType} isRequired />
        {nodeType && (
          <Select
            label="Condition"
            options={conditionOptions}
            value={condition}
            onChange={setCondition}
            placeholder="Select a condition..."
          />
        )}
        {nodeType && condition && (
          <div
            style={{
              padding: "12px",
              background: "#f3f6fd",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            Selected: {nodeType} → {condition}
          </div>
        )}
      </div>
    );
  },
};

// With icons in options
export const WithIcons: Story = {
  args: {
    label: "Select Node Type",
    options: nodeTypeOptions,
  },
};

// Long option list
export const LongList: Story = {
  args: {
    label: "Select Workflow",
    options: Array.from({ length: 20 }, (_, i) => ({
      label: `Workflow ${i + 1}`,
      value: `workflow-${i + 1}`,
    })),
  },
};
