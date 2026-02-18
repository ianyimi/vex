## Accessibility Standards (Base UI + shadcn)

### Built-in Accessibility

**Base UI and shadcn components are accessible by default**:
- Screen reader support with proper ARIA attributes
- Keyboard navigation for all interactive elements
- Focus management for modals and popovers
- Proper semantic HTML structure

### Keyboard Navigation

All interactive components support keyboard navigation out of the box:

| Component | Keys |
|-----------|------|
| Dialog/Sheet | `Escape` to close, Tab to navigate |
| Menu/Dropdown | Arrow keys to navigate, Enter to select, Escape to close |
| Tabs | Arrow keys to switch tabs |
| Select/Combobox | Arrow keys to navigate, Enter to select |
| Accordion | Enter/Space to toggle |

### Focus Management

**Focus trapping** in overlays:
```tsx
// Dialog automatically traps focus within the modal
<Dialog>
  <DialogContent>
    {/* Focus is trapped here until dialog closes */}
    <Input autoFocus /> {/* First focusable element */}
  </DialogContent>
</Dialog>
```

**Visible focus indicators** - never remove outlines:
```tsx
// Good - visible focus states
<Button className="focus-visible:ring-2 focus-visible:ring-ring" />

// Bad - removing focus indicators
<Button className="outline-none focus:outline-none" />
```

### Semantic HTML

Use appropriate elements for their purpose:
```tsx
// Good - semantic elements
<nav>
  <NavigationMenu>...</NavigationMenu>
</nav>
<main>
  <article>...</article>
</main>
<aside>
  <Sidebar>...</Sidebar>
</aside>

// Bad - div soup
<div className="nav">...</div>
<div className="content">...</div>
```

### Labels and Descriptions

**Always label form inputs**:
```tsx
// Good - associated label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Good - aria-label for icon buttons
<Button size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Good - aria-describedby for help text
<div>
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" aria-describedby="password-help" />
  <p id="password-help" className="text-sm text-muted-foreground">
    Must be at least 8 characters
  </p>
</div>
```

### Color and Contrast

**Maintain sufficient contrast ratios**:
- Normal text: 4.5:1 minimum
- Large text (18px+ or 14px bold): 3:1 minimum
- UI components: 3:1 minimum

**Don't rely solely on color**:
```tsx
// Good - icon + color + text
<Badge variant="destructive">
  <AlertCircle className="h-3 w-3 mr-1" />
  Error
</Badge>

// Bad - only color indicates state
<div className="text-red-500">Error occurred</div>
```

### RTL Support

Base UI provides Direction Provider for RTL languages:
```tsx
import { DirectionProvider } from "@base-ui/react";

<DirectionProvider direction="rtl">
  <App />
</DirectionProvider>
```

### Screen Reader Announcements

**Live regions for dynamic content**:
```tsx
// Toast notifications use aria-live
<Toast>
  <div role="alert" aria-live="polite">
    Changes saved successfully
  </div>
</Toast>

// Loading states
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

### Heading Hierarchy

Maintain logical heading structure:
```tsx
// Good - logical hierarchy
<main>
  <h1>Dashboard</h1>
  <section>
    <h2>Recent Activity</h2>
    <h3>Today</h3>
  </section>
  <section>
    <h2>Statistics</h2>
  </section>
</main>

// Bad - skipped levels
<h1>Dashboard</h1>
<h4>Recent Activity</h4>  {/* Skipped h2, h3 */}
```

### Testing Accessibility

- **Keyboard testing**: Navigate entire UI using only keyboard
- **Screen reader testing**: Test with VoiceOver (Mac) or NVDA (Windows)
- **Automated testing**: Use axe-core in Playwright tests

```typescript
// Playwright accessibility test
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
