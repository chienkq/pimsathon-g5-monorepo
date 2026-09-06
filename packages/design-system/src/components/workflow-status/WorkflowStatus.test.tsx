import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowStatus } from "./WorkflowStatus";

describe("WorkflowStatus", () => {
  it("renders status badge and title", () => {
    render(<WorkflowStatus status="success" />);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("displays execution time", () => {
    render(<WorkflowStatus status="success" executionTime={5234} />);
    expect(screen.getByText("5.2s")).toBeInTheDocument();
  });

  it("displays nodes executed", () => {
    render(<WorkflowStatus status="success" nodesExecuted={5} totalNodes={5} />);
    expect(screen.getByText("5/5")).toBeInTheDocument();
  });

  it("displays error message", () => {
    render(<WorkflowStatus status="error" errorMessage="Step 4 failed: Timeout" />);
    expect(screen.getByText("Step 4 failed: Timeout")).toBeInTheDocument();
  });

  it("renders all status variants", () => {
    const statuses: Array<"pending" | "running" | "success" | "error" | "cancelled" | "skipped"> = [
      "pending",
      "running",
      "success",
      "error",
      "cancelled",
      "skipped",
    ];
    statuses.forEach((status) => {
      const { unmount } = render(<WorkflowStatus status={status} />);
      expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
      unmount();
    });
  });

  it("formats execution time correctly", () => {
    const { unmount } = render(<WorkflowStatus status="success" executionTime={500} />);
    expect(screen.getByText("500ms")).toBeInTheDocument();
    unmount();

    render(<WorkflowStatus status="success" executionTime={1500} />);
    expect(screen.getByText("1.5s")).toBeInTheDocument();
  });
});
