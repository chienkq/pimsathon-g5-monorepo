import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NodeEditor } from "./NodeEditor";

describe("NodeEditor", () => {
  it("renders form with fields", () => {
    render(<NodeEditor nodeType="Action" data={{}} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Node Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("displays initial data", () => {
    render(
      <NodeEditor nodeType="Action" data={{ name: "Test Node", description: "Test description" }} onSave={vi.fn()} />
    );
    expect(screen.getByDisplayValue("Test Node")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
  });

  it("calls onSave with updated data", async () => {
    const onSave = vi.fn();
    render(<NodeEditor nodeType="Action" data={{ name: "" }} onSave={onSave} />);
    const nameInput = screen.getByLabelText("Node Name");
    await userEvent.type(nameInput, "New Name");
    await userEvent.click(screen.getByText("Save Changes"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name" }));
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<NodeEditor nodeType="Action" data={{}} onSave={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("updates form fields on change", async () => {
    render(<NodeEditor nodeType="Action" data={{}} onSave={vi.fn()} />);
    const nameInput = screen.getByLabelText("Node Name") as HTMLInputElement;
    await userEvent.type(nameInput, "Updated Name");
    expect(nameInput.value).toBe("Updated Name");
  });
});
