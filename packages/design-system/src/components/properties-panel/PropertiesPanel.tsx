import React from "react";
import { Badge, type BadgeStatus } from "../badge/Badge";
import { Button } from "../button/Button";
import styles from "./PropertiesPanel.module.scss";
import { cn } from "../../utils/cn";

export interface WorkflowNode {
  id: string;
  label: string;
  type: string;
  status?: BadgeStatus;
  properties?: Record<string, unknown>;
}

export interface PropertiesPanelProps {
  node?: WorkflowNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ node, onEdit, onDelete, className }) => {
  if (!node) {
    return (
      <div className={cn(styles.panel, styles.empty, className)}>
        <p>Select a node to view properties</p>
      </div>
    );
  }

  return (
    <div className={cn(styles.panel, className)}>
      <div className={styles.header}>
        <h3>{node.label}</h3>
        <Badge status={node.status || "pending"} size="sm" />
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Details</h4>
          <div className={styles.detail}>
            <span className={styles.key}>Type:</span>
            <span className={styles.value}>{node.type}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.key}>ID:</span>
            <span className={styles.value}>{node.id}</span>
          </div>
        </div>

        {node.properties && Object.keys(node.properties).length > 0 && (
          <div className={styles.section}>
            <h4>Properties</h4>
            {Object.entries(node.properties).map(([key, value]) => (
              <div key={key} className={styles.detail}>
                <span className={styles.key}>{key}:</span>
                <span className={styles.value}>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {onEdit && (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

PropertiesPanel.displayName = "PropertiesPanel";
