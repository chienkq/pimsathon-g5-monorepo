import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";
import { Button } from "../button/Button";

describe("Dialog", () => {
  it("renders when open is true", () => {
    render(
      <Dialog open={true} title="Test Dialog">
        <Dialog.Body>Content</Dialog.Body>
      </Dialog>
    );
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Dialog open={true} title="Test" onOpenChange={handleOpenChange}>
        <Dialog.Body>Content</Dialog.Body>
      </Dialog>
    );
    const closeButton = screen.getByLabelText("Close dialog");
    await userEvent.click(closeButton);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders subtitle when provided", () => {
    render(
      <Dialog open={true} title="Test" subtitle="Subtitle">
        <Dialog.Body>Content</Dialog.Body>
      </Dialog>
    );
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("renders body content", () => {
    render(
      <Dialog open={true} title="Test">
        <Dialog.Body>Test content</Dialog.Body>
      </Dialog>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders footer with buttons", async () => {
    const handleClose = vi.fn();
    render(
      <Dialog open={true} title="Test" onOpenChange={handleClose}>
        <Dialog.Body>Content</Dialog.Body>
        <Dialog.Footer>
          <Button onClick={() => handleClose(false)}>Cancel</Button>
          <Button variant="primary">Save</Button>
        </Dialog.Footer>
      </Dialog>
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
