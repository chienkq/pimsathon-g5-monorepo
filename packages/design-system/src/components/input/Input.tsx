import React from "react";
import { cn } from "@/utils/cn";
import styles from "./Input.module.scss";

export type InputType = "text" | "email" | "password" | "number" | "search" | "tel" | "url";
export type InputSize = "sm" | "md" | "lg";
export type InputState = "default" | "error" | "success" | "warning";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input type */
  type?: InputType;
  /** Size variant */
  size?: InputSize;
  /** Visual state */
  state?: InputState;
  /** Icon on the left */
  iconLeft?: React.ReactNode;
  /** Icon on the right (e.g., clear button) */
  iconRight?: React.ReactNode;
  /** Error message to display below input */
  error?: string;
  /** Help text to display below input */
  hint?: string;
  /** Label text */
  label?: string;
  /** Required indicator */
  isRequired?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Full width */
  isFullWidth?: boolean;
  /** Callback when clear button clicked (shows when type=search) */
  onClear?: () => void;
}

/**
 * Text input component with support for icons, states, and validation messages
 * Built on native HTML input for accessibility and performance
 *
 * @example
 * <Input placeholder="Enter name" />
 * <Input type="email" label="Email" error="Invalid email" />
 * <Input type="search" iconLeft={<Search />} onClear={() => setValue('')} />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      size = "md",
      state = "default",
      iconLeft,
      iconRight,
      error,
      hint,
      label,
      isRequired = false,
      isDisabled = false,
      isFullWidth = false,
      onClear,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = error || state === "error";
    const actualState = hasError ? "error" : state;

    return (
      <div className={cn(styles["input-wrapper"], isFullWidth && styles["input-wrapper--full-width"], className)}>
        {label && (
          <label className={styles["input-label"]}>
            <span>{label}</span>
            {isRequired && <span className={styles["input-label__required"]}>*</span>}
          </label>
        )}

        <div className={styles["input-container"]}>
          {iconLeft && <span className={cn(styles["input-icon"], styles["input-icon--left"])}>{iconLeft}</span>}

          <input
            ref={ref}
            type={type}
            className={cn(
              styles.input,
              styles[`input--${size}`],
              styles[`input--${actualState}`],
              iconLeft && styles["input--has-icon-left"],
              iconRight && styles["input--has-icon-right"],
              isDisabled && styles["input--disabled"]
            )}
            disabled={isDisabled}
            {...props}
          />

          {iconRight && <span className={cn(styles["input-icon"], styles["input-icon--right"])}>{iconRight}</span>}

          {type === "search" && onClear && props.value && (
            <button
              type="button"
              className={styles["input-clear"]}
              onClick={onClear}
              aria-label="Clear input"
              disabled={isDisabled}
            >
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>

        {(error || hint) && (
          <div
            className={cn(
              styles["input-message"],
              error && styles["input-message--error"],
              hint && styles["input-message--hint"]
            )}
          >
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export type { InputType, InputSize, InputState };
