import React from "react";
import { Badge, type BadgeStatus } from "../badge/Badge";
import styles from "./Node.module.scss";
import { cn } from "../../utils/cn";

export interface NodeProps {
  id: string;
  type: "trigger" | "action" | "condition" | "branch" | "end";
  label: string;
  status?: BadgeStatus;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const typeIcons: Record<NodeProps["type"], string> = {
  trigger: "▶️",
  action: "⚙️",
  condition: "◆",
  branch: "🔀",
  end: "⏹️",
};

export const Node: React.FC<NodeProps> = ({
  id,
  type,
  label,
  status = "pending",
  selected = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(styles.node, styles[type], selected && styles.selected, className)}
      onClick={onClick}
      data-testid={`node-${id}`}
    >
      <div className={styles.icon}>{typeIcons[type]}</div>
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <Badge status={status} size="sm" />
      </div>
    </div>
  );
};

Node.displayName = "Node";
