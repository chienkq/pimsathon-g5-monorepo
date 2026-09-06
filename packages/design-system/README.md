# @pimsathon/design-system

Pimsathon's component library and design system built with React, TypeScript, and Tailwind CSS.

## Overview

A comprehensive, production-ready component library with 120+ components based on n8n's proven UI/UX architecture patterns, adapted for React.

**Status:** 🚀 In active development (Phase 1: Foundation)

## Quick Start

### Installation

```bash
# From monorepo root
pnpm install

# Start development
cd packages/design-system
pnpm dev
```

### Usage

```typescript
import { Button } from '@pimsathon/design-system';
import '@pimsathon/design-system/css';

export function App() {
  return (
    <Button variant="primary" size="lg">
      Click me
    </Button>
  );
}
```

## Architecture

### Directory Structure

```
src/
├── components/           # 120+ UI components
│   ├── button/
│   ├── input/
│   ├── checkbox/
│   └── ... (more)
├── css/                  # Global styles & tokens
│   ├── _variables.scss   # Design tokens
│   ├── _global.scss      # Reset & base styles
│   └── index.scss
├── hooks/                # Custom React hooks
├── types/                # Shared TypeScript types
├── utils/                # Utility functions
└── index.ts              # Main export
```

### Component Structure

Each component follows this pattern:

```
components/button/
├── Button.tsx            # React component
├── Button.module.scss    # Scoped styles
├── Button.stories.tsx    # Storybook docs
├── Button.test.tsx       # Unit tests
└── index.ts             # Exports
```

## Development

### Available Scripts

```bash
# Development server
pnpm dev

# Type checking
pnpm type-check

# Storybook (component documentation)
pnpm storybook

# Unit tests
pnpm test
pnpm test:watch

# Linting
pnpm lint

# Building
pnpm build
```

### Component Checklist

When building new components, ensure:

- ✅ TypeScript types (Props interface)
- ✅ React component (TSX file)
- ✅ CSS module styles (SCSS)
- ✅ Storybook stories (all variants)
- ✅ Unit tests (3+ test cases)
- ✅ Accessibility support (a11y)
- ✅ Dark mode support
- ✅ Named export in index.ts
- ✅ Type export in index.ts

## Design Tokens

All components use CSS custom properties for theming:

```scss
:root {
  --color-primary-500: #2563eb;
  --color-gray-900: #111827;
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
  /* ... more tokens ... */
}

/* Dark mode automatically supported via media queries */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-primary-500: #3b82f6;
    /* ... inverted colors ... */
  }
}
```

## Theme Support

Components automatically support:

1. **Light mode** (default)
2. **Dark mode** (via `prefers-color-scheme` or `data-theme="dark"` attribute)
3. **System preference** (respects OS theme)

```html
<!-- Set explicit theme -->
<html data-theme="dark">
  <!-- Components will use dark mode colors -->
</html>
```

## Migration Phase

**Current Phase:** Phase 1 - Foundation (Week 1-2)

### Tier 1 Components (Core Foundations)

- [ ] Button ← In progress
- [ ] Input
- [ ] Checkbox
- [ ] Radio
- [ ] Select
- [ ] Badge
- [ ] Alert
- [ ] Card
- [ ] Tabs
- [ ] Dialog

### Future Phases

- **Phase 2:** Advanced components (40+ more)
- **Phase 3:** State management (Zustand)
- **Phase 4:** Admin-UI integration
- **Phase 5:** Polish & optimization

## Key Principles

1. **TypeScript First** - Full type safety
2. **Accessibility** - Built on Radix UI primitives
3. **Composition** - Small, focused, composable components
4. **CSS Variables** - Theme switching at runtime
5. **Storybook** - Component documentation
6. **Tested** - Unit and visual tests

## Documentation

- [Implementation Guide](../../scratchpad/COMPONENT-GUIDE.md) - How to build components
- [Setup Guide](../../scratchpad/design-system-setup.md) - Folder structure
- [Pattern Translation](../../scratchpad/N8N-PATTERNS-TO-REACT.md) - Vue → React patterns
- [Migration Plan](../../scratchpad/n8n-migration-plan.html) - Full roadmap

## Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **SCSS** - Styling with CSS Modules
- **Tailwind CSS** - Utility classes (optional)
- **Radix UI** - Headless component primitives
- **Storybook** - Component documentation
- **Vitest** - Unit testing

## Dependencies

### Runtime

- `react` ^19.0.0
- `@radix-ui/*` - Headless components
- `clsx` - Class name utility
- `zod` - Schema validation

### Development

- `typescript` - Type checking
- `vite` - Build tool
- `@vitejs/plugin-react` - React support
- `storybook` - Component docs
- `vitest` - Testing
- `sass` - SCSS compilation

## Building

```bash
# Build for production
pnpm build

# Output
dist/
├── index.js              # ESM build
├── index.umd.js          # UMD build
├── index.d.ts            # TypeScript declarations
├── css/
│   └── index.css         # Compiled styles
└── ...
```

## Publishing

To npm:

```bash
# From monorepo root
pnpm --filter @pimsathon/design-system publish
```

## Contributing

1. Follow component structure
2. Add TypeScript types
3. Write tests
4. Add Storybook stories
5. Support dark mode
6. Document in JSDoc

## License

MIT

## Related Packages

- `@pimsathon/stores` - State management (Zustand)
- `@pimsathon/hooks` - Custom React hooks
- `pimsathon-g5-monorepo` - Main monorepo

---

**Status:** Phase 1 🚀  
**Next:** Implement remaining Tier 1 components
