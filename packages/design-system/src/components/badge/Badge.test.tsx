import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders with status", () => {
    render(<Badge status="success">Completed</Badge>);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders all status variants", () => {
    const statuses = ["pending", "running", "success", "error", "cancelled", "skipped"] as const;
    statuses.forEach((status) => {
      const { container } = render(
        <Badge status={status} data-testid={`badge-${status}`}>
          {status}
        </Badge>
      );
      expect(container.querySelector(`.badge--${status}`)).toBeInTheDocument();
    });
  });

  it("applies size classes", () => {
    const { container } = render(
      <Badge status="success" size="lg">
        Large
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--lg");
  });

  it("renders icon by default", () => {
    const { container } = render(<Badge status="success" />);
    expect(container.querySelector(".badge__icon")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    render(
      <Badge status="success" icon={<span data-testid="custom-icon">✓</span>}>
        Done
      </Badge>
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies animated class for running status", () => {
    const { container } = render(
      <Badge status="running" animated>
        Running
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--animated");
  });

  it("does not render text if children is not provided", () => {
    const { container } = render(<Badge status="success" />);
    expect(container.querySelector(".badge__text")).not.toBeInTheDocument();
  });

  it("renders text content when provided", () => {
    render(<Badge status="error">Error occurred</Badge>);
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("supports all size variants", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { container } = render(
        <Badge status="success" size={size}>
          Test
        </Badge>
      );
      expect(container.querySelector(".badge")).toHaveClass(`badge--${size}`);
    });
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(
      <Badge ref={ref} status="success">
        Badge
      </Badge>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Badge status="success" className="custom-badge">
        Test
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("custom-badge");
  });

  it("has correct status colors", () => {
    const statuses = ["pending", "running", "success", "error", "cancelled", "skipped"] as const;
    statuses.forEach((status) => {
      const { container } = render(<Badge status={status}>{status}</Badge>);
      const badge = container.querySelector(".badge");
      expect(badge).toHaveClass(`badge--${status}`);
    });
  });

  it("does not animate by default", () => {
    const { container } = render(<Badge status="pending">Pending</Badge>);
    expect(container.querySelector(".badge")).not.toHaveClass("badge--animated");
  });

  it("animates when animated prop is true", () => {
    const { container } = render(
      <Badge status="running" animated>
        Running
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--animated");
  });

  it("contains icon element", () => {
    const { container } = render(<Badge status="success">Success</Badge>);
    const icon = container.querySelector(".badge__icon");
    expect(icon).toBeInTheDocument();
    expect(icon?.querySelector("svg")).toBeInTheDocument();
  });

  it("renders small size correctly", () => {
    const { container } = render(
      <Badge status="success" size="sm">
        Small
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--sm");
  });

  it("renders medium size correctly", () => {
    const { container } = render(
      <Badge status="success" size="md">
        Medium
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--md");
  });

  it("renders large size correctly", () => {
    const { container } = render(
      <Badge status="success" size="lg">
        Large
      </Badge>
    );
    expect(container.querySelector(".badge")).toHaveClass("badge--lg");
  });
});
