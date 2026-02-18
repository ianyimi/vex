## UI Component Standards (shadcn + Base UI)

### Component Architecture

This project uses **shadcn/ui** built on top of **Base UI** (`@base-ui/react`) primitives:
- **Base UI**: Provides headless, accessible component primitives (styling-agnostic)
- **shadcn/ui**: Adds beautiful defaults with Tailwind CSS styling on top of primitives

### Using shadcn Components

**Installing components** via CLI:
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

**Components are copied to your codebase** - you own the code and can customize freely:
```
src/components/ui/
├── button.tsx
├── dialog.tsx
├── input.tsx
└── ...
```

### Component Categories

**Form & Input**: Button, Input, Textarea, Checkbox, Radio Group, Select, Switch, Slider, Calendar, Date Picker, Combobox, Form, Field, Label

**Layout & Navigation**: Accordion, Breadcrumb, Navigation Menu, Sidebar, Tabs, Separator, Scroll Area, Resizable

**Overlays & Dialogs**: Dialog, Alert Dialog, Sheet, Drawer, Popover, Tooltip, Hover Card, Context Menu, Dropdown Menu, Command

**Feedback & Status**: Alert, Toast, Progress, Skeleton, Badge

**Display**: Avatar, Card, Table, Data Table, Carousel, Aspect Ratio

### Composition Patterns

**Prefer composition over configuration**:
```tsx
// Good - composable parts
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Avoid - monolithic prop-based
<Dialog
  title="Title"
  description="Description"
  footer={<Button>Save</Button>}
/>
```

### Styling with Variants

Use `class-variance-authority` (cva) for component variants:
```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Base UI Utilities

**mergeProps** - Combine props intelligently:
```tsx
import { mergeProps } from "@base-ui/react";

// Merges event handlers and classNames correctly
const combinedProps = mergeProps(propsFromParent, localProps);
```

### Best Practices

- **Single Responsibility**: Each component should have one clear purpose
- **Composability**: Build complex UIs by combining smaller components
- **Clear Interface**: Define explicit props with TypeScript and sensible defaults
- **Encapsulation**: Keep internal implementation private, expose only necessary APIs
- **Consistent Naming**: Follow shadcn naming conventions (`DialogTrigger`, `DialogContent`, etc.)
- **State Management**: Keep state local; lift only when needed by multiple components
- **Minimal Props**: If a component needs many props, consider composition or splitting

### Related Standards

For detailed guidance on specific patterns, see:

- **[forms.md](./forms.md)** - TanStack Form integration with shadcn components, validation patterns, dynamic fields
- **[data-fetching.md](./data-fetching.md)** - TanStack Query with Convex for data fetching, caching, mutations
- **[tables.md](./tables.md)** - TanStack Table with shadcn for data tables, sorting, filtering, pagination
- **[css.md](./css.md)** - Tailwind CSS patterns, design tokens, dark mode
- **[accessibility.md](./accessibility.md)** - Keyboard navigation, screen readers, ARIA patterns
- **[responsive.md](./responsive.md)** - Breakpoints, mobile-first patterns, responsive components
