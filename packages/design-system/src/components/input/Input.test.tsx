import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders required indicator", () => {
    render(<Input label="Name" isRequired />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays error message", () => {
    render(<Input error="Invalid input" />);
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
  });

  it("displays hint message", () => {
    render(<Input hint="Enter a valid email" />);
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
  });

  it("is disabled when isDisabled is true", () => {
    render(<Input isDisabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("updates value on user input", async () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input") as HTMLInputElement;

    await userEvent.type(input, "test");
    expect(input.value).toBe("test");
  });

  it("supports all input types", () => {
    const types = ["text", "email", "password", "number", "search"] as const;
    types.forEach((type) => {
      const { container } = render(<Input type={type} />);
      expect(container.querySelector(`input[type="${type}"]`)).toBeInTheDocument();
    });
  });

  it("applies size classes", () => {
    const { container } = render(<Input size="lg" />);
    expect(container.querySelector("input")).toHaveClass("input--lg");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("calls onClear callback for search input", async () => {
    const handleClear = vi.fn();
    const { container } = render(<Input type="search" value="search term" onClear={handleClear} onChange={() => {}} />);

    const clearButton = container.querySelector(".input-clear") as HTMLButtonElement;
    await userEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalled();
  });

  it("displays error state styling", () => {
    const { container } = render(<Input state="error" />);
    expect(container.querySelector("input")).toHaveClass("input--error");
  });
});
