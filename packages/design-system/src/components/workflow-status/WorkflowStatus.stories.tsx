import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowStatus } from "./WorkflowStatus";

const meta = { title: "Workflow/WorkflowStatus", component: WorkflowStatus, tags: ["autodocs"] } satisfies Meta<
  typeof WorkflowStatus
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { status: "pending" },
};

export const Running: Story = {
  args: {
    status: "running",
    executionTime: 2500,
    nodesExecuted: 2,
    totalNodes: 5,
  },
};

export const Success: Story = {
  args: {
    status: "success",
    executionTime: 5234,
    nodesExecuted: 5,
    totalNodes: 5,
  },
};

export const Error: Story = {
  args: {
    status: "error",
    executionTime: 3100,
    nodesExecuted: 3,
    totalNodes: 5,
    errorMessage: "Step 4 failed: Timeout waiting for API response",
  },
};

export const Cancelled: Story = {
  args: {
    status: "cancelled",
    executionTime: 1500,
    nodesExecuted: 2,
    totalNodes: 5,
  },
};

export const Skipped: Story = {
  args: {
    status: "skipped",
  },
};
