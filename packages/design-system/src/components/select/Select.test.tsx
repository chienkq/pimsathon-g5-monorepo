import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const mockOptions = [
  { label: "Option 1", value: "opt1" },
  { label: "Option 2", value: "opt2" },
  { label: "Option 3", value: "opt3" },
];

describe("Select", () => {
  it("renders with label", () => {
    render(<Select label="Select an option" options={mockOptions} />);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    render(<Select options={mockOptions} placeholder="Choose one..." />);
    expect(screen.getByText("Choose one...")).toBeInTheDocument();
  });

  it("renders required indicator", () => {
    render(<Select label="Required Field" options={mockOptions} isRequired />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays error message", () => {
    render(<Select options={mockOptions} error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("displays hint message", () => {
    render(<Select options={mockOptions} hint="Select a valid option" />);
    expect(screen.getByText("Select a valid option")).toBeInTheDocument();
  });

  it("is disabled when isDisabled is true", () => {
    render(<Select options={mockOptions} isDisabled />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });

  it("calls onChange when option is selected", async () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    const option = screen.getByText("Option 1");
    await userEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("opt1");
  });

  it("displays selected value", async () => {
    render(<Select options={mockOptions} value="opt2" />);

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("applies size class", () => {
    const { container } = render(<Select options={mockOptions} size="lg" />);
    expect(container.querySelector(".select-trigger")).toHaveClass("select-trigger--lg");
  });

  it("applies error state class", () => {
    const { container } = render(<Select options={mockOptions} state="error" />);
    expect(container.querySelector(".select-trigger")).toHaveClass("select-trigger--error");
  });

  it("applies success state class", () => {
    const { container } = render(<Select options={mockOptions} state="success" />);
    expect(container.querySelector(".select-trigger")).toHaveClass("select-trigger--success");
  });

  it("applies full-width class", () => {
    const { container } = render(<Select options={mockOptions} isFullWidth />);
    expect(container.querySelector(".select-wrapper")).toHaveClass("select-wrapper--full-width");
  });

  it("supports disabled options", async () => {
    const optionsWithDisabled = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2", disabled: true },
      { label: "Option 3", value: "opt3" },
    ];

    render(<Select options={optionsWithDisabled} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    const disabledOption = screen.getByText("Option 2");
    expect(disabledOption.closest("[data-disabled]")).toBeInTheDocument();
  });

  it("renders options with icons", async () => {
    const optionsWithIcons = [
      { label: "Action", value: "action", icon: "→" },
      { label: "Trigger", value: "trigger", icon: "⚡" },
    ];

    render(<Select options={optionsWithIcons} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    expect(screen.getByText("→")).toBeInTheDocument();
    expect(screen.getByText("⚡")).toBeInTheDocument();
  });

  it("renders all options when dropdown is opened", async () => {
    render(<Select options={mockOptions} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Select ref={ref} options={mockOptions} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("accepts custom className", () => {
    const { container } = render(<Select options={mockOptions} className="custom-select" />);
    expect(container.querySelector(".select-wrapper")).toHaveClass("custom-select");
  });
});
