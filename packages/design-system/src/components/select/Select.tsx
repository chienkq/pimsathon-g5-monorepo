import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/utils/cn";
import styles from "./Select.module.scss";

export type SelectSize = "sm" | "md" | "lg";
export type SelectState = "default" | "error" | "success";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  /** Label text */
  label?: string;
  /** Options to select from */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Size variant */
  size?: SelectSize;
  /** Visual state */
  state?: SelectState;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Help text */
  hint?: string;
  /** Disabled state */
  isDisabled?: boolean;
  /** Full width */
  isFullWidth?: boolean;
  /** Required indicator */
  isRequired?: boolean;
  /** Allow custom className */
  className?: string;
  /** Search/filter support */
  searchable?: boolean;
}

/**
 * Select dropdown component for workflow node selection
 * Used to select node types, conditions, branches, etc.
 *
 * @example
 * <Select
 *   label="Node Type"
 *   options={[
 *     { label: 'Trigger', value: 'trigger' },
 *     { label: 'Action', value: 'action' }
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      size = "md",
      state = "default",
      placeholder = "Select an option...",
      error,
      hint,
      isDisabled = false,
      isFullWidth = false,
      isRequired = false,
      className,
    },
    ref
  ) => {
    const hasError = error || state === "error";
    const actualState = hasError ? "error" : state;

    return (
      <div className={cn(styles["select-wrapper"], isFullWidth && styles["select-wrapper--full-width"], className)}>
        {label && (
          <label className={styles["select-label"]}>
            <span>{label}</span>
            {isRequired && <span className={styles["select-label__required"]}>*</span>}
          </label>
        )}

        <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={isDisabled}>
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              styles["select-trigger"],
              styles[`select-trigger--${size}`],
              styles[`select-trigger--${actualState}`],
              isDisabled && styles["select-trigger--disabled"]
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon className={styles["select-icon"]}>
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className={styles["select-content"]} position="popper" sideOffset={5}>
              <SelectPrimitive.Viewport className={styles["select-viewport"]}>
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={styles["select-item"]}
                  >
                    <span className={styles["select-item__content"]}>
                      {option.icon && <span className={styles["select-item__icon"]}>{option.icon}</span>}
                      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    </span>
                    <SelectPrimitive.ItemIndicator className={styles["select-item__indicator"]}>
                      <svg
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {(error || hint) && (
          <div
            className={cn(
              styles["select-message"],
              error && styles["select-message--error"],
              hint && styles["select-message--hint"]
            )}
          >
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export type { SelectSize, SelectState, SelectOption };
