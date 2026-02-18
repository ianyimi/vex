## CSS & Styling Standards (Tailwind + shadcn)

### Styling Stack

- **Tailwind CSS v4**: Utility-first CSS framework
- **shadcn/ui**: Pre-styled components using Tailwind
- **CSS Variables**: Design tokens for theming
- **class-variance-authority (cva)**: Component variant management
- **clsx + tailwind-merge**: Conditional class handling

### Design Tokens (CSS Variables)

shadcn uses CSS variables for theming. Define in your global CSS:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --accent: 210 40% 96%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode values */
}
```

Reference tokens in Tailwind classes:
```tsx
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
```

### Utility Class Patterns

**Use Tailwind utilities directly**:
```tsx
// Good - Tailwind utilities
<div className="flex items-center gap-4 p-4 rounded-lg border">
  <Avatar className="h-10 w-10" />
  <div className="flex-1">
    <p className="text-sm font-medium">Title</p>
    <p className="text-sm text-muted-foreground">Description</p>
  </div>
</div>
```

**Conditional classes with clsx and tailwind-merge**:
```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function (commonly named `cn`)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

### Component Variants with CVA

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

function Badge({ variant, className, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
```

### Dark Mode

Use `next-themes` for dark mode with Tailwind's `dark:` variant:
```tsx
// Wrap app with ThemeProvider
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>

// Components automatically support dark mode via CSS variables
<div className="bg-background text-foreground" />

// Or use dark: variant for specific overrides
<div className="bg-white dark:bg-slate-900" />
```

### Best Practices

- **Use design tokens**: Reference `--background`, `--primary`, etc. instead of hardcoded colors
- **Avoid custom CSS**: Leverage Tailwind utilities; minimize custom stylesheets
- **Don't override component styles**: Extend via `className` prop and `cn()` utility
- **Consistent spacing**: Use Tailwind's spacing scale (`p-4`, `gap-2`, `mt-6`)
- **Responsive prefixes**: Use `sm:`, `md:`, `lg:` for responsive styles
- **Keep specificity low**: Utility classes have low specificity by design

### Animation

Use Tailwind's animation utilities or `tw-animate-css`:
```tsx
// Built-in Tailwind
<div className="animate-spin" />
<div className="transition-all duration-200 hover:scale-105" />

// Custom animations in tailwind.config
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
}
```

### File Organization

```
src/
├── app/
│   └── globals.css          # CSS variables, base styles
├── components/
│   └── ui/                  # shadcn components
├── lib/
│   └── utils.ts             # cn() utility function
```
