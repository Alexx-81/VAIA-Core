# VAIA Core - Development Instructions

## Project Overview
VAIA Core is a CRM application built with React 19, TypeScript, and Vite. It uses CSS modules for styling (no external UI library).

## Tech Stack
- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **CSS** (plain CSS, no preprocessors or UI frameworks)
- **jspdf** + **xlsx** (for exports)

## Project Structure

```
src/
├── features/          # Feature modules (domain-driven)
│   ├── articles/      # Products/articles management
│   ├── dashboard/     # Main dashboard
│   ├── deliveries/    # Delivery tracking
│   ├── inventory/     # Inventory management
│   ├── qualities/     # Quality categories
│   ├── reports/       # Reports & exports
│   ├── sales/         # Sales management
│   └── settings/      # App settings
├── shared/            # Shared/reusable code
│   └── components/    # Layout, Logo, Tabs
└── styles/            # Theme & global styles
```

## Feature Module Structure
Each feature follows a consistent pattern:

```
features/{feature}/
├── index.ts           # Public exports
├── types.ts           # TypeScript types
├── components/        # React components + CSS
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── data/              # Mock data (if any)
```

## Key Conventions

### Routing
- Uses History API (no router library)
- URL path maps to `TabId`: `/`, `/articles`, `/sales`, etc.
- Navigation handled in `App.tsx` via `handleTabChange`

### Styling
- Each component has its own `.css` file
- Theme colors defined in `src/styles/theme.ts`
- Brand colors: VAIA blue `#0B4F8A`, Core orange `#FF7A00`
- Supports dark/light themes via CSS classes

### Components
- Feature components exported via `index.ts`
- Main component named same as feature (e.g., `Articles.tsx`)
- Dialog components for create/edit forms
- Table components for data display
- FiltersBar components for filtering

### Hooks
- Custom hooks prefixed with `use` (e.g., `useArticles`)
- Handle data fetching, state, and business logic

### Types
- Defined in `types.ts` per feature
- Shared types in `shared/` directory
- `TabId` type defines valid navigation tabs

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```
