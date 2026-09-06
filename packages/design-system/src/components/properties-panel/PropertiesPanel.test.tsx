import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertiesPanel } from "./PropertiesPanel";

describe("PropertiesPanel", () => {
  it("renders empty state when no node", () => {
    render(<PropertiesPanel />);
    expect(screen.getByText("Select a node to view properties")).toBeInTheDocument();
  });

  it("renders node information", () => {
    render(
      <PropertiesPanel
        node={{
          id: "node-1",
          label: "Test Node",
          type: "action",
          status: "success",
        }}
      />
    );
    expect(screen.getByText("Test Node")).toBeInTheDocument();
    expect(screen.getByText("action")).toBeInTheDocument();
  });

  it("renders node properties", () => {
    render(
      <PropertiesPanel
        node={{
          id: "node-1",
          label: "Test",
          type: "action",
          properties: { key1: "value1", key2: "value2" },
        }}
      />
    );
    expect(screen.getByText("value1")).toBeInTheDocument();
    expect(screen.getByText("value2")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<PropertiesPanel node={{ id: "node-1", label: "Test", type: "action" }} onEdit={onEdit} />);
    await userEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<PropertiesPanel node={{ id: "node-1", label: "Test", type: "action" }} onDelete={onDelete} />);
    await userEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalled();
  });
});
