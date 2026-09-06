import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "../button/Button";

const meta = { title: "Workflow/Dialog", component: Dialog, tags: ["autodocs"] } satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Edit Node" size="md">
          <Dialog.Body>Dialog content goes here</Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary">Save</Button>
          </Dialog.Footer>
        </Dialog>
      </>
    );
  },
};

export const WithSubtitle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Edit Node</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Configure Node" subtitle="Set up node properties">
          <Dialog.Body>Configure your node settings here</Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary">Save</Button>
          </Dialog.Footer>
        </Dialog>
      </>
    );
  },
};

export const LargeSize: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Large Dialog</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Workflow Details" size="lg">
          <Dialog.Body>Large dialog content</Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Dialog.Footer>
        </Dialog>
      </>
    );
  },
};
