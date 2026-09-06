import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders with different variants", () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
      </>
    );

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Secondary")).toBeInTheDocument();
    expect(screen.getByText("Tertiary")).toBeInTheDocument();
    expect(screen.getByText("Danger")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows aria-busy attribute when loading", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("renders spinner when loading", () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const spinner = container.querySelector(".spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("applies variant class correctly", () => {
    const { container } = render(<Button variant="primary">Button</Button>);
    const button = container.querySelector(".button");
    expect(button).toHaveClass("button--primary");
  });

  it("applies size class correctly", () => {
    const { container } = render(<Button size="lg">Button</Button>);
    const button = container.querySelector(".button");
    expect(button).toHaveClass("button--lg");
  });

  it("applies full-width class when isFullWidth is true", () => {
    const { container } = render(<Button isFullWidth>Full Width</Button>);
    const button = container.querySelector(".button");
    expect(button).toHaveClass("button--full-width");
  });

  it("renders with icon", () => {
    render(<Button icon={<span data-testid="icon">📝</span>}>With Icon</Button>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders with right icon", () => {
    render(<Button iconRight={<span data-testid="right-icon">→</span>}>Next</Button>);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    await userEvent.click(screen.getByText("Disabled"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", async () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    await userEvent.click(screen.getByText("Loading"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports all size variants", () => {
    const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
    sizes.forEach((size) => {
      const { container } = render(<Button size={size}>Button</Button>);
      const button = container.querySelector(".button");
      expect(button).toHaveClass(`button--${size}`);
    });
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has correct default button type", () => {
    render(<Button>Button</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts className prop", () => {
    const { container } = render(<Button className="custom-class">Button</Button>);
    expect(container.querySelector(".button")).toHaveClass("custom-class");
  });

  it("renders with content when not loading", () => {
    const { container } = render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
    expect(container.querySelector(".spinner")).not.toBeInTheDocument();
  });

  it("replaces content with spinner when loading", () => {
    const { container } = render(<Button isLoading>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });
});
