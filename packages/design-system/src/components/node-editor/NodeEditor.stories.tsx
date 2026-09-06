import type { Meta, StoryObj } from "@storybook/react";
import { NodeEditor } from "./NodeEditor";

const meta = { title: "Workflow/NodeEditor", component: NodeEditor, tags: ["autodocs"] } satisfies Meta<
  typeof NodeEditor
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    nodeType: "Action",
    data: { name: "Send Email", description: "", condition: "equals", value: "" },
    onSave: (data) => console.log("Saved:", data),
  },
};

export const WithCondition: Story = {
  args: {
    nodeType: "Condition",
    data: {
      name: "Check Status",
      description: "Verify if status is active",
      condition: "equals",
      value: "active",
    },
    onSave: (data) => console.log("Saved:", data),
  },
};

export const Empty: Story = {
  args: {
    nodeType: "New Node",
    data: {},
    onSave: (data) => console.log("Saved:", data),
  },
};
