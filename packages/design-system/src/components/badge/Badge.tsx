import React from "react";
import { cn } from "@/utils/cn";
import styles from "./Badge.module.scss";

export type BadgeStatus = "pending" | "running" | "success" | "error" | "cancelled" | "skipped";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Status type determines color and icon */
  status: BadgeStatus;
  /** Size of the badge */
  size?: BadgeSize;
  /** Icon to display (optional, status-specific default used if not provided) */
  icon?: React.ReactNode;
  /** Text content */
  children?: React.ReactNode;
  /** Show animated pulse for running status */
  animated?: boolean;
}

/**
 * Badge component for displaying workflow node/execution status
 * Used to show pending, running, success, error, cancelled, or skipped states
 *
 * @example
 * <Badge status="running">Executing</Badge>
 * <Badge status="success" icon={<Check />}>Completed</Badge>
 * <Badge status="error">Failed</Badge>
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ status, size = "md", icon, children, animated = status === "running", className, ...props }, ref) => {
    // Default icons for each status
    const defaultIcons: Record<BadgeStatus, React.ReactNode> = {
      pending: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" opacity="0.3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      running: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      ),
      success: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      error: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      ),
      cancelled: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
      ),
      skipped: (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          styles.badge,
          styles[`badge--${status}`],
          styles[`badge--${size}`],
          animated && status === "running" && styles["badge--animated"],
          className
        )}
        {...props}
      >
        <span className={styles["badge__icon"]}>{icon || defaultIcons[status]}</span>
        {children && <span className={styles["badge__text"]}>{children}</span>}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export type { BadgeStatus, BadgeSize };
