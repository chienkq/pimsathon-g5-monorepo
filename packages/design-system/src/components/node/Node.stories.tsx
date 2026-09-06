import type { Meta, StoryObj } from "@storybook/react";
import { Node } from "./Node";

const meta = { title: "Workflow/Node", component: Node, tags: ["autodocs"] } satisfies Meta<typeof Node>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Trigger: Story = {
  args: { id: "trigger-1", type: "trigger", label: "Start Workflow", status: "success" },
};

export const Action: Story = {
  args: { id: "action-1", type: "action", label: "Send Email", status: "success" },
};

export const Condition: Story = {
  args: { id: "condition-1", type: "condition", label: "If Status = Active", status: "pending" },
};

export const Branch: Story = {
  args: { id: "branch-1", type: "branch", label: "Split Path", status: "pending" },
};

export const End: Story = {
  args: { id: "end-1", type: "end", label: "End", status: "success" },
};

export const Selected: Story = {
  args: { id: "node-selected", type: "action", label: "Edit Node", selected: true, status: "pending" },
};

export const Running: Story = {
  args: { id: "node-running", type: "action", label: "Processing...", status: "running" },
};

export const Error: Story = {
  args: { id: "node-error", type: "action", label: "Failed Step", status: "error" },
};
