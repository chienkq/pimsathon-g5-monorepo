// Class name utility - similar to clsx
// Conditionally joins classnames together

type ClassName = string | undefined | null | false | Record<string, boolean>;

export function cn(...classes: ClassName[]): string {
  return classes
    .flat()
    .filter((cls): cls is string => typeof cls === "string" && cls.length > 0)
    .join(" ");
}

// Alternative helper for object-based class merging
export function mergeClasses(base: string, ...modifiers: Array<string | undefined | null | false>): string {
  return [base, ...modifiers].filter(Boolean).join(" ");
}
