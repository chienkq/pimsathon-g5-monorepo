import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "danger", "success"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    isLoading: { control: "boolean" },
    isFullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary variants
export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "md",
    children: "Secondary Button",
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    size: "md",
    children: "Tertiary Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    size: "md",
    children: "Delete Item",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    size: "md",
    children: "Confirm",
  },
};

// Sizes
export const ExtraSmall: Story = {
  args: {
    variant: "primary",
    size: "xs",
    children: "XS",
  },
};

export const Small: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Small",
  },
};

export const Medium: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Medium",
  },
};

export const Large: Story = {
  args: {
    variant: "primary",
    size: "lg",
    children: "Large",
  },
};

export const ExtraLarge: Story = {
  args: {
    variant: "primary",
    size: "xl",
    children: "Extra Large",
  },
};

// States
export const Loading: Story = {
  args: {
    variant: "primary",
    size: "md",
    isLoading: true,
    children: "Loading...",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    size: "md",
    disabled: true,
    children: "Disabled Button",
  },
};

export const FullWidth: Story = {
  args: {
    variant: "primary",
    size: "md",
    isFullWidth: true,
    children: "Full Width Button",
  },
};

// With icons
export const WithIconLeft: Story = {
  args: {
    variant: "primary",
    size: "md",
    icon: (
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    children: "Add Item",
  },
};

export const WithIconRight: Story = {
  args: {
    variant: "primary",
    size: "md",
    iconRight: (
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
    children: "Next",
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
      <Button size="xs">XS</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XL</Button>
    </div>
  ),
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", maxWidth: "600px" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

// Interactive
export const Interactive: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Click Me",
  },
  render: (args) => <Button {...args} onClick={() => alert("Button clicked!")} />,
};
