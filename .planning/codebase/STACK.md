# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- TypeScript 5.x - All source code (`.ts`, `.tsx` files)
- CSS - Styling via Tailwind CSS and CSS custom properties

**Secondary:**
- JavaScript (ECMAScript 2017+) - Build configuration files

## Runtime

**Environment:**
- Node.js (version not pinned, determined by Next.js 16.1.6 requirements)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - React meta-framework for SSR/SSG, file-based routing, and built-in optimization
- React 19.2.3 - UI component library
- React DOM 19.2.3 - DOM rendering for React components

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- @tailwindcss/postcss 4.x - PostCSS plugin for Tailwind
- Tailwind CSS v4 uses PostCSS under the hood for processing

**Icons:**
- lucide-react 0.577.0 - Icon library (used for all UI icons: Wheat, ClipboardList, Truck, Activity, Search, Bell, Settings, CheckCircle, Package, AlertTriangle, Factory, ShoppingCart, FlaskConical)

**Build/Dev:**
- Next.js built-in tooling (webpack under the hood)

## Key Dependencies

**Critical:**
- lucide-react 0.577.0 - Provides icon components throughout the dashboard UI
- Tailwind CSS 4.x - Entire visual presentation layer depends on this for styling

**Infrastructure:**
- @types/node 20.x - TypeScript types for Node.js APIs
- @types/react 19.x - TypeScript types for React
- @types/react-dom 19.x - TypeScript types for React DOM

## Linting & Code Quality

**Linting:**
- ESLint 9.x - JavaScript/TypeScript linting
- eslint-config-next 16.1.6 - Next.js official ESLint configuration
  - Includes core web vitals rules
  - Includes TypeScript support

## Configuration

**Environment:**
- No `.env` file detected - Application uses hardcoded mock data (no external service dependencies)
- No secrets management currently required

**Build:**
- `tsconfig.json` - TypeScript compiler configuration
  - Target: ES2017
  - Module: ESNext
  - Strict mode enabled
  - Path alias: `@/*` maps to `./src/*`
  - Bundler module resolution
  - Incremental compilation enabled

- `next.config.ts` - Next.js configuration (minimal, uses defaults)

- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS v4 processing

- `eslint.config.mjs` - ESLint configuration
  - Uses flat config format (ESLint 9+)
  - Applies Next.js core web vitals rules
  - Applies Next.js TypeScript rules
  - Excludes: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Platform Requirements

**Development:**
- Node.js (latest compatible with Next.js 16.1.6)
- npm package manager
- macOS, Linux, or Windows compatible (no platform-specific dependencies)

**Production:**
- Node.js runtime environment
- Deployment target: Any environment supporting Node.js
- Recommended: Vercel (Next.js creators' platform, mentioned in README)
- Can deploy to any Node.js hosting provider

---

*Stack analysis: 2026-03-11*
