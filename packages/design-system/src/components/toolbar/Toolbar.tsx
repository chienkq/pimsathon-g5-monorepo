import React from "react";
import { Button } from "../button/Button";
import styles from "./Toolbar.module.scss";
import { cn } from "../../utils/cn";

export interface ToolbarProps {
  onRun?: () => void;
  onStop?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  workflowStatus?: "idle" | "running" | "paused" | "error";
  disabled?: boolean;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onRun,
  onStop,
  onSave,
  onUndo,
  onRedo,
  workflowStatus = "idle",
  disabled = false,
  className,
}) => {
  const isRunning = workflowStatus === "running";
  const isError = workflowStatus === "error";

  return (
    <div className={cn(styles.toolbar, className)}>
      <div className={styles.group}>
        <Button variant="primary" size="md" onClick={onRun} disabled={disabled || isRunning} title="Run workflow">
          ▶️ Run
        </Button>
        {isRunning && (
          <Button variant="danger" size="md" onClick={onStop} disabled={disabled} title="Stop workflow">
            ⏹️ Stop
          </Button>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <Button variant="secondary" size="md" onClick={onUndo} disabled={disabled} title="Undo">
          ↶ Undo
        </Button>
        <Button variant="secondary" size="md" onClick={onRedo} disabled={disabled} title="Redo">
          ↷ Redo
        </Button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <Button
          variant={isError ? "danger" : "secondary"}
          size="md"
          onClick={onSave}
          disabled={disabled}
          title="Save workflow"
        >
          💾 Save
        </Button>
      </div>

      <div className={cn(styles.status, styles[workflowStatus])}>
        <span className={styles.indicator} />
        {workflowStatus.charAt(0).toUpperCase() + workflowStatus.slice(1)}
      </div>
    </div>
  );
};

Toolbar.displayName = "Toolbar";
