import { useState } from "react";

function isCollapsible(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

function entriesOf(value: Record<string, unknown> | unknown[]): [string | number, unknown][] {
  return Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
}

function bracketsFor(value: Record<string, unknown> | unknown[]): [string, string] {
  return Array.isArray(value) ? ["[", "]"] : ["{", "}"];
}

function ScalarValue({ value }: { value: unknown }) {
  if (value === null) return <span className="wf-json__null">null</span>;
  if (typeof value === "string") return <span className="wf-json__string">"{value}"</span>;
  if (typeof value === "number") return <span className="wf-json__number">{value}</span>;
  if (typeof value === "boolean") return <span className="wf-json__boolean">{String(value)}</span>;
  return <span className="wf-json__string">{String(value)}</span>;
}

/** A row's key label — a clickable "chip" that copies `expression` to the clipboard when the caller
 *  supplied a `buildExpression` (n8n's "click a field to copy its expression" affordance), otherwise
 *  a plain label. Kept as its own element (not nested in the collapse-toggle button) so clicking the
 *  key copies without also expanding/collapsing the row. */
function JsonKey({ label, expression }: { label: string | number; expression?: string }) {
  const [copied, setCopied] = useState(false);

  if (!expression) {
    return <span className="wf-json__key">{label}: </span>;
  }

  return (
    <>
      <button
        type="button"
        className={`wf-json__key wf-json__key--copyable${copied ? " wf-json__key--copied" : ""}`}
        title={`Copy expression: ${expression}`}
        onClick={(event) => {
          event.stopPropagation();
          void navigator.clipboard.writeText(expression).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          });
        }}
      >
        {copied ? "Copied!" : label}
      </button>
      {!copied && <span className="wf-json__key-colon">: </span>}
    </>
  );
}

/** One key/value row — collapsible when its value is an object or array, `depth`+2 collapses by
 *  default to keep deep trees compact. `path` is this row's key chain from the tree root, handed to
 *  `buildExpression` (when the caller supplies one) to turn the key label into a copy-expression
 *  button. */
function JsonNode({
  label,
  value,
  depth,
  path,
  buildExpression,
}: {
  label?: string | number;
  value: unknown;
  depth: number;
  path: Array<string | number>;
  buildExpression?: (path: Array<string | number>) => string | undefined;
}) {
  const [collapsed, setCollapsed] = useState(depth >= 2);
  const expression = buildExpression?.(path);

  if (!isCollapsible(value)) {
    return (
      <div className="wf-json__row">
        {label !== undefined && <JsonKey label={label} expression={expression} />}
        <ScalarValue value={value} />
      </div>
    );
  }

  const entries = entriesOf(value);
  const [open, close] = bracketsFor(value);

  if (entries.length === 0) {
    return (
      <div className="wf-json__row">
        {label !== undefined && <JsonKey label={label} expression={expression} />}
        <span className="wf-json__bracket">
          {open}
          {close}
        </span>
      </div>
    );
  }

  return (
    <div className="wf-json__row">
      <button
        type="button"
        className="wf-json__caret-toggle"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        <span className={`wf-json__caret${collapsed ? " wf-json__caret--collapsed" : ""}`}>▾</span>
      </button>
      {label !== undefined && <JsonKey label={label} expression={expression} />}
      <button type="button" className="wf-json__toggle" onClick={() => setCollapsed((current) => !current)}>
        <span className="wf-json__bracket">{open}</span>
        {collapsed && (
          <>
            <span className="wf-json__count">
              {entries.length}{" "}
              {Array.isArray(value)
                ? "item" + (entries.length === 1 ? "" : "s")
                : "key" + (entries.length === 1 ? "" : "s")}
            </span>
            <span className="wf-json__bracket">{close}</span>
          </>
        )}
      </button>
      {!collapsed && (
        <>
          <div className="wf-json__children">
            {entries.map(([key, child]) => (
              <JsonNode
                key={key}
                label={key}
                value={child}
                depth={depth + 1}
                path={[...path, key]}
                buildExpression={buildExpression}
              />
            ))}
          </div>
          <span className="wf-json__bracket wf-json__bracket--close">{close}</span>
        </>
      )}
    </div>
  );
}

export interface JsonTreeProps {
  data: unknown;
  /** When provided, every row's key becomes a clickable button copying the returned expression to
   *  the clipboard (n8n's field-level "copy expression" affordance). Return `undefined` for a path
   *  that shouldn't be copyable (e.g. an item index that isn't part of the JSON shape itself). */
  buildExpression?: (path: Array<string | number>) => string | undefined;
}

/** Collapsible JSON tree — n8n-style output/input viewer, replacing a flat `JSON.stringify` dump. */
export function JsonTree({ data, buildExpression }: JsonTreeProps) {
  return (
    <div className="wf-json-tree">
      <JsonNode value={data} depth={0} path={[]} buildExpression={buildExpression} />
    </div>
  );
}
