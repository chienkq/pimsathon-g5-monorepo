import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "./Toolbar";

describe("Toolbar", () => {
  it("renders toolbar with default buttons", () => {
    render(<Toolbar />);
    expect(screen.getByText(/Run/)).toBeInTheDocument();
    expect(screen.getByText(/Undo/)).toBeInTheDocument();
    expect(screen.getByText(/Save/)).toBeInTheDocument();
  });

  it("calls onRun when run button is clicked", async () => {
    const onRun = vi.fn();
    render(<Toolbar onRun={onRun} />);
    await userEvent.click(screen.getByText(/Run/));
    expect(onRun).toHaveBeenCalled();
  });

  it("shows stop button when running", () => {
    render(<Toolbar workflowStatus="running" />);
    expect(screen.getByText(/Stop/)).toBeInTheDocument();
  });

  it("calls onStop when stop button is clicked", async () => {
    const onStop = vi.fn();
    render(<Toolbar workflowStatus="running" onStop={onStop} />);
    await userEvent.click(screen.getByText(/Stop/));
    expect(onStop).toHaveBeenCalled();
  });

  it("displays status indicator", () => {
    render(<Toolbar workflowStatus="running" />);
    expect(screen.getByText(/Running/)).toBeInTheDocument();
  });

  it("disables buttons when disabled prop is true", () => {
    render(<Toolbar disabled={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("calls onUndo and onRedo", async () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    render(<Toolbar onUndo={onUndo} onRedo={onRedo} />);
    await userEvent.click(screen.getByText(/Undo/));
    await userEvent.click(screen.getByText(/Redo/));
    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
  });
});
