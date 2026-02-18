## Responsive Design Standards (Tailwind)

### Breakpoint System

Tailwind's default breakpoints (mobile-first):

| Prefix | Min Width | Target Devices |
|--------|-----------|----------------|
| (none) | 0px | Mobile phones |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops, small desktops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

### Mobile-First Approach

**Start with mobile styles, add breakpoint prefixes for larger screens**:
```tsx
// Good - mobile-first
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>

// Bad - desktop-first (requires more overrides)
<div className="flex flex-row md:flex-col">...</div>
```

### Common Responsive Patterns

**Stack to row layout**:
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <Card className="flex-1">Item 1</Card>
  <Card className="flex-1">Item 2</Card>
  <Card className="flex-1">Item 3</Card>
</div>
```

**Responsive grid**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

**Hide/show elements**:
```tsx
// Mobile navigation
<Button className="md:hidden" onClick={openMobileMenu}>
  <Menu className="h-5 w-5" />
</Button>

// Desktop navigation
<nav className="hidden md:flex gap-4">
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/settings">Settings</Link>
</nav>
```

**Responsive typography**:
```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>
<p className="text-sm sm:text-base">
  Body text that scales with screen size
</p>
```

**Responsive spacing**:
```tsx
<section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
  <Container>...</Container>
</section>
```

### Container Pattern

Use max-width containers for content:
```tsx
// Centered container with responsive padding
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {children}
</div>

// Or use a Container component
function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
```

### Responsive Components (shadcn)

**Sheet for mobile, Dialog for desktop**:
```tsx
// Use Sheet on mobile, Popover/Dialog on desktop
const isMobile = useMediaQuery("(max-width: 768px)");

return isMobile ? (
  <Sheet>
    <SheetTrigger asChild>
      <Button>Open Menu</Button>
    </SheetTrigger>
    <SheetContent side="left">
      <Navigation />
    </SheetContent>
  </Sheet>
) : (
  <nav className="flex gap-4">
    <Navigation />
  </nav>
);
```

**Drawer vs Dialog**:
```tsx
// Drawer slides from bottom on mobile
<Drawer>
  <DrawerTrigger asChild>
    <Button>Open</Button>
  </DrawerTrigger>
  <DrawerContent>
    {/* Full-width bottom sheet on mobile */}
  </DrawerContent>
</Drawer>
```

### Touch-Friendly Design

**Minimum tap targets** (44x44px):
```tsx
// Good - adequate touch target
<Button size="default" className="min-h-11 min-w-11">
  <Plus className="h-5 w-5" />
</Button>

// Bad - too small for touch
<button className="p-1">
  <Plus className="h-3 w-3" />
</button>
```

**Touch-friendly spacing**:
```tsx
// Good - adequate spacing between interactive elements
<div className="flex gap-3">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
```

### Testing Responsive Design

**Browser DevTools**: Test at each breakpoint (320px, 640px, 768px, 1024px, 1280px)

**Playwright viewport testing**:
```typescript
import { test, devices } from '@playwright/test';

// Test specific viewport
test.use({ viewport: { width: 375, height: 667 } });

// Test named device
test.use({ ...devices['iPhone 13'] });

// Multiple viewports in config
projects: [
  { name: 'Mobile', use: { ...devices['iPhone 13'] } },
  { name: 'Tablet', use: { ...devices['iPad'] } },
  { name: 'Desktop', use: { viewport: { width: 1280, height: 720 } } },
]
```

### Best Practices

- **Mobile-first**: Write base styles for mobile, add breakpoint prefixes for larger screens
- **Fluid layouts**: Use `flex`, `grid`, and percentage widths over fixed pixels
- **Relative units**: Use `rem` for typography, Tailwind's spacing scale for layout
- **Test on real devices**: Emulators don't catch all touch and performance issues
- **Content priority**: Show most important content first on small screens
- **Performance**: Optimize images and assets for mobile network conditions
