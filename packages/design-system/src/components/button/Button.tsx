import React from "react";
import { cn } from "@/utils/cn";
import styles from "./Button.module.scss";

// Types
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "success";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Full width button */
  isFullWidth?: boolean;
  /** Icon element (left side) */
  icon?: React.ReactNode;
  /** Icon element (right side) */
  iconRight?: React.ReactNode;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Primary action button component - foundation of the design system
 * Supports multiple variants, sizes, loading states, and icons
 *
 * @example
 * <Button>Click me</Button>
 * <Button variant="secondary" size="lg" icon={<Icon />}>Submit</Button>
 * <Button isLoading>Processing...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      isFullWidth = false,
      icon,
      iconRight,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[`button--${variant}`],
          styles[`button--${size}`],
          isFullWidth && styles["button--full-width"],
          isLoading && styles["button--loading"],
          className
        )}
        disabled={isDisabled}
        type="button"
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className={styles.spinner}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        )}

        {icon && <span className={styles["button__icon--left"]}>{icon}</span>}

        {children && <span className={styles.content}>{children}</span>}

        {iconRight && <span className={styles["button__icon--right"]}>{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
