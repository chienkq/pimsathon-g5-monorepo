# Node icons

SVG icons for workflow nodes, bundled inside this package (not the consuming app).

## Adding an icon

1. Save an SVG here named after the node type: `{nodeType}.svg` (e.g. `slack.svg` for the `slack` node type in `@chienkq/workflow-core`'s registry).
2. Optimize it: strip the XML declaration and hardcoded `width`/`height`, keep `viewBox`, and use `fill="currentColor"` so it inherits the node's color.
3. Run `pnpm build` in this package. `SvgNodeIcon` resolves `../../assets/icons/{nodeType}.svg` relative to its own compiled module (`import.meta.url`), so no other code needs to change, and the file ships inside this package's `dist/` — never copied into an app's `public/` folder.

If no matching SVG exists, `SvgNodeIcon` falls back to the Unicode glyph in `../nodeIcons.ts`.
