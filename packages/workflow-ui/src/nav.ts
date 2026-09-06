/**
 * Descriptor for the admin UI's left-hand navigation. The admin UI owns the actual menu rendering
 * (no design for it exists yet) — hand it this object plus the `<WorkflowsApp />` component and it
 * decides how to render the icon/label and where to mount the content.
 */
export interface WorkflowNavItem {
  id: string;
  label: string;
  description: string;
  /** Semantic icon hint, not tied to any icon library — map it to whatever icon set the admin UI uses. */
  icon: string;
}

export const workflowNavItem: WorkflowNavItem = {
  id: "workflows",
  label: "Workflows",
  description: "Build and run automation workflows.",
  icon: "workflow",
};
