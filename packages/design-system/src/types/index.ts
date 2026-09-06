// Shared TypeScript types for the design system

export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ComponentVariant = "primary" | "secondary" | "tertiary" | "danger" | "success";
export type ComponentState = "default" | "error" | "success" | "warning" | "info";

// Common props interfaces
export interface BaseComponentProps {
  className?: string;
  "data-testid"?: string;
}

export interface SizeableComponentProps extends BaseComponentProps {
  size?: ComponentSize;
}

export interface VariantComponentProps extends BaseComponentProps {
  variant?: ComponentVariant;
}

export interface StateComponentProps extends BaseComponentProps {
  state?: ComponentState;
}

export interface DisableableComponentProps {
  disabled?: boolean;
  isDisabled?: boolean;
}

export interface LoadableComponentProps {
  isLoading?: boolean;
  loading?: boolean;
}

export interface FullWidthComponentProps {
  fullWidth?: boolean;
  isFullWidth?: boolean;
}
