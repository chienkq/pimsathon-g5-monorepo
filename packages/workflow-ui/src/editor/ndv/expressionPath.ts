const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Builds an n8n-style dot/bracket path (`foo.bar[0]['weird key']`) from a root plus a list of
 *  object keys / array indices, mirroring n8n's own `generatePath` so copied expressions read the
 *  same way n8n's do. */
export function generatePath(root: string, path: Array<string | number>): string {
  return path.reduce<string>((accumulator, part) => {
    if (typeof part === "number") return `${accumulator}[${part}]`;
    if (!IDENTIFIER_RE.test(part)) return `${accumulator}['${part.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}']`;
    return `${accumulator}.${part}`;
  }, root);
}
