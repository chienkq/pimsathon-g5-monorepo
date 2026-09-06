import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";
import styles from "./Dialog.module.scss";

export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogProps {
  /** Dialog is open */
  open?: boolean;
  /** Called when dialog should close */
  onOpenChange?: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Dialog content */
  children?: React.ReactNode;
  /** Size of dialog */
  size?: DialogSize;
  /** Show close button */
  showClose?: boolean;
  /** Additional className */
  className?: string;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children?: React.ReactNode;
  onClose?: () => void;
}

/**
 * Dialog component for modals using Radix UI
 * Used for node editing, confirmations, and detailed views
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Dialog open={open} onOpenChange={setOpen} title="Edit Node">
 *   <Dialog.Trigger>Edit</Dialog.Trigger>
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Edit Node</Dialog.Title>
 *     </Dialog.Header>
 *     <Dialog.Body>Form content here</Dialog.Body>
 *     <Dialog.Footer>
 *       <Button onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="primary">Save</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onOpenChange, title, subtitle, children, size = "md", showClose = true, className }, ref) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogRoot ref={ref} size={size} showClose={showClose} title={title} subtitle={subtitle} className={className}>
          {children}
        </DialogRoot>
      </DialogPrimitive.Root>
    );
  }
);

Dialog.displayName = "Dialog";

const DialogRoot = React.forwardRef<
  HTMLDivElement,
  {
    children?: React.ReactNode;
    size?: DialogSize;
    showClose?: boolean;
    title?: string;
    subtitle?: string;
    className?: string;
  }
>(({ children, size, showClose, title, subtitle, className }, ref) => (
  <>
    <DialogPrimitive.Overlay className={styles["dialog-overlay"]} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(styles["dialog-content"], styles[`dialog-content--${size}`], className)}
    >
      <div className={styles["dialog-inner"]}>
        {(title || showClose) && (
          <div className={styles["dialog-header"]}>
            <div>
              {title && <DialogPrimitive.Title className={styles["dialog-title"]}>{title}</DialogPrimitive.Title>}
              {subtitle && (
                <DialogPrimitive.Description className={styles["dialog-subtitle"]}>
                  {subtitle}
                </DialogPrimitive.Description>
              )}
            </div>
            {showClose && (
              <DialogPrimitive.Close className={styles["dialog-close"]} aria-label="Close dialog">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </DialogPrimitive.Close>
            )}
          </div>
        )}
        {children}
      </div>
    </DialogPrimitive.Content>
  </>
));

DialogRoot.displayName = "Dialog.Root";

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(({ children, ...props }, ref) => (
  <DialogPrimitive.Trigger ref={ref} asChild {...props}>
    {children || <button>Open</button>}
  </DialogPrimitive.Trigger>
));

DialogTrigger.displayName = "Dialog.Trigger";

const DialogHeader = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(styles["dialog-header"], className)}>
      {children}
    </div>
  )
);

DialogHeader.displayName = "Dialog.Header";

const DialogTitle = React.forwardRef<HTMLHeadingElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn(styles["dialog-title"], className)}>
      {children}
    </DialogPrimitive.Title>
  )
);

DialogTitle.displayName = "Dialog.Title";

const DialogDescription = React.forwardRef<HTMLParagraphElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn(styles["dialog-subtitle"], className)}>
      {children}
    </DialogPrimitive.Description>
  )
);

DialogDescription.displayName = "Dialog.Description";

const DialogBody = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(styles["dialog-body"], className)}>
      {children}
    </div>
  )
);

DialogBody.displayName = "Dialog.Body";

const DialogFooter = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn(styles["dialog-footer"], className)}>
      {children}
    </div>
  )
);

DialogFooter.displayName = "Dialog.Footer";

Dialog.Trigger = DialogTrigger;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;

export type { DialogSize };
