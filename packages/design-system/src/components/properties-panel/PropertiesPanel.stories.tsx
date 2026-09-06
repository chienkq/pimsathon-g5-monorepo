import type { Meta, StoryObj } from "@storybook/react";
import { PropertiesPanel } from "./PropertiesPanel";

const meta = { title: "Workflow/PropertiesPanel", component: PropertiesPanel, tags: ["autodocs"] } satisfies Meta<
  typeof PropertiesPanel
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { node: undefined },
};

export const WithNode: Story = {
  args: {
    node: {
      id: "node-1",
      label: "Send Email",
      type: "action",
      status: "success",
      properties: { recipient: "user@example.com", subject: "Hello" },
    },
    onEdit: () => console.log("Edit clicked"),
    onDelete: () => console.log("Delete clicked"),
  },
};

export const RunningNode: Story = {
  args: {
    node: {
      id: "node-2",
      label: "Processing Data",
      type: "action",
      status: "running",
      properties: { timeout: "30s" },
    },
  },
};

export const ErrorNode: Story = {
  args: {
    node: {
      id: "node-3",
      label: "Failed Step",
      type: "action",
      status: "error",
      properties: { errorCode: "TIMEOUT", message: "Request exceeded timeout" },
    },
  },
};
