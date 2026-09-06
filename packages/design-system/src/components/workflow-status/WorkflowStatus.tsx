import React from "react";
import { Badge, type BadgeStatus } from "../badge/Badge";
import styles from "./WorkflowStatus.module.scss";
import { cn } from "../../utils/cn";

export interface WorkflowStatusProps {
  status: BadgeStatus;
  executionTime?: number;
  nodesExecuted?: number;
  totalNodes?: number;
  errorMessage?: string;
  className?: string;
}

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({
  status,
  executionTime,
  nodesExecuted,
  totalNodes,
  errorMessage,
  className,
}) => {
  const formatTime = (ms?: number): string => {
    if (!ms) return "0s";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={cn(styles.status, styles[status], className)}>
      <div className={styles.header}>
        <Badge status={status} size="md" />
        <span className={styles.title}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>

      {(executionTime || nodesExecuted || totalNodes) && (
        <div className={styles.stats}>
          {executionTime !== undefined && (
            <div className={styles.stat}>
              <span className={styles.label}>Execution Time</span>
              <span className={styles.value}>{formatTime(executionTime)}</span>
            </div>
          )}
          {nodesExecuted !== undefined && totalNodes !== undefined && (
            <div className={styles.stat}>
              <span className={styles.label}>Nodes Executed</span>
              <span className={styles.value}>
                {nodesExecuted}/{totalNodes}
              </span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

WorkflowStatus.displayName = "WorkflowStatus";
