import type { Meta, StoryObj } from "@storybook/react";
import { Toolbar } from "./Toolbar";

const meta = { title: "Workflow/Toolbar", component: Toolbar, tags: ["autodocs"] } satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    workflowStatus: "idle",
    onRun: () => console.log("Run clicked"),
    onSave: () => console.log("Save clicked"),
  },
};

export const Running: Story = {
  args: {
    workflowStatus: "running",
    onStop: () => console.log("Stop clicked"),
  },
};

export const Error: Story = {
  args: {
    workflowStatus: "error",
    onRun: () => console.log("Run clicked"),
  },
};

export const Paused: Story = {
  args: {
    workflowStatus: "paused",
    onRun: () => console.log("Resume clicked"),
  },
};

export const Disabled: Story = {
  args: {
    workflowStatus: "idle",
    disabled: true,
  },
};
