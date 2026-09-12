import { useState } from "react";

function isCollapsible(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

function entriesOf(value: Record<string, unknown> | unknown[]): [string, unknown][] {
  return Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);
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

/** One key/value row — collapsible when its value is an object or array, `depth`+2 collapses by default to keep deep trees compact. */
function JsonNode({ label, value, depth }: { label?: string; value: unknown; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth >= 2);

  if (!isCollapsible(value)) {
    return (
      <div className="wf-json__row">
        {label !== undefined && <span className="wf-json__key">{label}: </span>}
        <ScalarValue value={value} />
      </div>
    );
  }

  const entries = entriesOf(value);
  const [open, close] = bracketsFor(value);

  if (entries.length === 0) {
    return (
      <div className="wf-json__row">
        {label !== undefined && <span className="wf-json__key">{label}: </span>}
        <span className="wf-json__bracket">
          {open}
          {close}
        </span>
      </div>
    );
  }

  return (
    <div className="wf-json__row">
      <button type="button" className="wf-json__toggle" onClick={() => setCollapsed((current) => !current)}>
        <span className={`wf-json__caret${collapsed ? " wf-json__caret--collapsed" : ""}`}>▾</span>
        {label !== undefined && <span className="wf-json__key">{label}: </span>}
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
              <JsonNode key={key} label={key} value={child} depth={depth + 1} />
            ))}
          </div>
          <span className="wf-json__bracket wf-json__bracket--close">{close}</span>
        </>
      )}
    </div>
  );
}

/** Collapsible JSON tree — n8n-style output/input viewer, replacing a flat `JSON.stringify` dump. */
export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="wf-json-tree">
      <JsonNode value={data} depth={0} />
    </div>
  );
}
