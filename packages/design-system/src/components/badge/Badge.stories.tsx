import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "Workflow/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "running", "success", "error", "cancelled", "skipped"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    animated: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Individual status examples
export const Pending: Story = {
  args: {
    status: "pending",
    children: "Pending",
  },
};

export const Running: Story = {
  args: {
    status: "running",
    children: "Running",
    animated: true,
  },
};

export const Success: Story = {
  args: {
    status: "success",
    children: "Success",
  },
};

export const Error: Story = {
  args: {
    status: "error",
    children: "Error",
  },
};

export const Cancelled: Story = {
  args: {
    status: "cancelled",
    children: "Cancelled",
  },
};

export const Skipped: Story = {
  args: {
    status: "skipped",
    children: "Skipped",
  },
};

// All statuses
export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <Badge status="pending">Pending</Badge>
      <Badge status="running" animated>
        Running
      </Badge>
      <Badge status="success">Success</Badge>
      <Badge status="error">Error</Badge>
      <Badge status="cancelled">Cancelled</Badge>
      <Badge status="skipped">Skipped</Badge>
    </div>
  ),
};

// Sizes
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <Badge status="running" size="sm" animated>
        Small
      </Badge>
      <Badge status="running" size="md" animated>
        Medium
      </Badge>
      <Badge status="running" size="lg" animated>
        Large
      </Badge>
    </div>
  ),
};

// Without text (icon only)
export const IconOnly: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px" }}>
      <Badge status="pending" />
      <Badge status="running" animated />
      <Badge status="success" />
      <Badge status="error" />
    </div>
  ),
};

// In a workflow node simulation
export const WorkflowNodeExample: Story = {
  render: () => (
    <div
      style={{
        border: "1px solid #dfe5ef",
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "200px",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <strong>Send Email</strong>
      </div>
      <Badge status="running" animated size="sm">
        Executing
      </Badge>
    </div>
  ),
};

// Running with animation
export const RunningAnimated: Story = {
  args: {
    status: "running",
    children: "Executing",
    animated: true,
  },
};

// Custom icon example
export const CustomIcon: Story = {
  args: {
    status: "success",
    children: "Completed",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    ),
  },
};
