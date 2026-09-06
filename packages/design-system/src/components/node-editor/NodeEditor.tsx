import React, { useState } from "react";
import { Input } from "../input/Input";
import { Select, type SelectOption } from "../select/Select";
import { Button } from "../button/Button";
import styles from "./NodeEditor.module.scss";
import { cn } from "../../utils/cn";

export interface NodeEditorProps {
  nodeType: string;
  data?: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onCancel?: () => void;
  className?: string;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ nodeType, data = {}, onSave, onCancel, className }) => {
  const [formData, setFormData] = useState<Record<string, string>>(data);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className={cn(styles.editor, className)}>
      <div className={styles.header}>
        <h3>Edit {nodeType} Node</h3>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <Input
            label="Node Name"
            placeholder="Enter node name"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Input
            label="Description"
            placeholder="What does this node do?"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Select
            label="Condition"
            value={formData.condition || ""}
            onChange={(value) => handleChange("condition", value)}
            options={
              [
                { label: "Equals", value: "equals" },
                { label: "Contains", value: "contains" },
                { label: "Greater Than", value: "gt" },
                { label: "Less Than", value: "lt" },
              ] as SelectOption[]
            }
          />
        </div>

        <div className={styles.field}>
          <Input
            label="Value"
            placeholder="Enter value to compare"
            value={formData.value || ""}
            onChange={(e) => handleChange("value", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

NodeEditor.displayName = "NodeEditor";
