import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Node } from "./Node";

describe("Node", () => {
  it("renders with label and type", () => {
    render(<Node id="1" type="action" label="Send Email" />);
    expect(screen.getByText("Send Email")).toBeInTheDocument();
  });

  it("renders correct type icon", () => {
    const { container } = render(<Node id="1" type="trigger" label="Start" />);
    expect(container.querySelector(".icon")).toHaveTextContent("▶️");
  });

  it("renders with status badge", () => {
    render(<Node id="1" type="action" label="Test" status="success" />);
    expect(screen.getByTestId("node-1")).toBeInTheDocument();
  });

  it("applies selected class when selected", () => {
    const { container } = render(<Node id="1" type="action" label="Test" selected={true} />);
    expect(container.querySelector(".selected")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Node id="1" type="action" label="Test" onClick={onClick} />);
    await userEvent.click(screen.getByTestId("node-1"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders all node types", () => {
    const types: Array<"trigger" | "action" | "condition" | "branch" | "end"> = [
      "trigger",
      "action",
      "condition",
      "branch",
      "end",
    ];
    types.forEach((type) => {
      const { unmount } = render(<Node id={type} type={type} label={`${type} Node`} />);
      expect(screen.getByText(`${type} Node`)).toBeInTheDocument();
      unmount();
    });
  });

  it("displays all status variants", () => {
    const statuses: Array<"pending" | "running" | "success" | "error" | "cancelled" | "skipped"> = [
      "pending",
      "running",
      "success",
      "error",
      "cancelled",
      "skipped",
    ];
    statuses.forEach((status) => {
      const { unmount } = render(<Node id="1" type="action" label="Test" status={status} />);
      expect(screen.getByTestId("node-1")).toBeInTheDocument();
      unmount();
    });
  });
});
