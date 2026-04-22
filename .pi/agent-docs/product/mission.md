# Product Mission

## Problem

Payload CMS, while powerful, has critical limitations:
- **Not Convex-native**: Built for traditional databases, missing real-time subscriptions and Convex's reactive data layer
- **Too heavy/complex**: Overkill for many projects, carries unnecessary weight
- **Admin panel bugs**: Rendering issues with array fields using default values, UX gaps for heavy content editing workflows
- **Tight Next.js coupling**: Core CMS logic shouldn't require Next.js

## Target Users

- **Personal projects**: Developers who want a CMS they fully control
- **Small teams**: 2-5 developers building content-driven apps
- **Agencies/Clients**: Teams building for clients who need intuitive content editing
- **Open source community**: Released publicly for others building on Convex

## Solution

A Convex-native headless CMS that:
- **Real-time by default**: Leverages Convex subscriptions for instant UI updates
- **Leaner architecture**: Only the features you need, no bloat
- **Better admin UX**: Custom-built with shadcn/ui, fixing Payload's pain points
- **Framework-agnostic core**: Schema/hooks/access control work anywhere; admin panel is a separate Next.js package (TanStack Start support planned)
- **Production-ready**: Full test suite with Vitest + Playwright from day one
