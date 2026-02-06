# VAIA Core - Development Instructions

## Project Overview
VAIA Core is an ERP/CRM application for managing articles, deliveries, sales, and inventory. Built with React 19, TypeScript, Vite, and Supabase.

## DB Migrations
Keep DB migrations in sync:
Run the DB migrations directly in Supabase using Supabase MCP
Save each migration script as local SQL file from the Supabase migration history table supabase_migrations.schema_migrations

## Tech Stack
- **React 19** + **TypeScript** + **Vite 7**
- **Supabase** (PostgreSQL backend, auto-generated types)
- **Plain CSS** (no UI frameworks, colocated .css files)
- **jspdf** + **xlsx** (report exports)
- **History API** (no router library - see routing below)

## Architecture Overview

### Three-Layer Structure
```
src/
├── features/          # Domain features (articles, deliveries, sales, etc.)
├── lib/               # Data layer (Supabase client, API functions, shared hooks)
└── shared/            # UI components (Layout, Logo, Tabs) + utilities
```

### Data Layer (`src/lib/`)
- **`lib/supabase/`**: Supabase client + auto-generated TypeScript types from DB schema
- **`lib/api/`**: Feature-specific API functions (articles.ts, deliveries.ts, sales.ts, etc.)
  - Each exports typed async functions (e.g., `getArticles()`, `createArticle()`)
  - Uses Supabase client for CRUD operations
  - Returns domain types with computed fields (e.g., `ArticleWithComputed`)
- **`lib/hooks/`**: Shared data-fetching hooks (useQualities, useArticles, useDeliveries)
  - Used across multiple features for consistent data access

### Feature Module Structure
Each feature follows a strict pattern:

```
features/{feature}/
├── index.ts           # Public exports only
├── types.ts           # TypeScript interfaces (FormData, Filters, etc.)
├── components/        # React components + colocated .css files
│   ├── {Feature}.tsx          # Main component
│   ├── {Feature}Dialog.tsx    # Create/edit modal
│   ├── {Feature}Table.tsx     # Data table
│   └── {Feature}FiltersBar.tsx # Filtering UI
├── hooks/             # Feature-specific custom hooks (use{Feature}.ts, use{Feature}Form.ts)
├── utils/             # Business logic, validation, export functions
└── data/              # Mock data (legacy, being migrated to Supabase)
```

## Key Conventions

### Routing (No Router Library!)
- Uses **History API** directly (window.history.pushState/popstate)
- URL paths map to `TabId` type: `/`, `/articles`, `/deliveries`, `/sales`, etc.
- Navigation handled in [App.tsx](src/App.tsx):
  - `getTabFromUrl()` parses pathname → TabId
  - `handleTabChange()` updates URL + state
  - `popstate` listener handles back/forward navigation
- To add a new route: (1) add to `TabId` in [src/shared/components/Tabs/types.ts](src/shared/components/Tabs/types.ts), (2) add case in `App.tsx` renderContent()

### Styling
- **No CSS preprocessors or UI libraries** - plain CSS only
- Each component has colocated `.css` file (e.g., `Articles.tsx` → `Articles.css`)
- Theme colors in [src/styles/theme.ts](src/styles/theme.ts):
  - Brand: VAIA blue `#0B4F8A`, Core orange `#FF7A00`
  - Dark/light theme via `.theme-dark`/`.theme-light` classes
- Shared styles: [src/styles/buttons.css](src/styles/buttons.css), [src/styles/components.css](src/styles/components.css)

### Component Patterns
- **Dialog components**: Modal forms for create/edit (e.g., `ArticleDialog.tsx`)
  - Props: `isOpen`, `onClose`, `onSubmit`, optional `article` for edit mode
  - Prevent propagation: `onClick={(e) => e.stopPropagation()}`
- **Table components**: Display data in tables with sorting/actions
- **FiltersBar components**: Search + filtering UI (status, date ranges, etc.)
- All feature components exported via `index.ts` (e.g., `export { Articles } from './components/Articles'`)

### Hooks & Data Fetching
- Custom hooks prefixed with `use` (e.g., `useArticles`, `useArticleForm`)
- **Pattern**: Fetch from Supabase in `useEffect`, store in local state, provide CRUD methods
- Example from [useArticles.ts](src/features/articles/hooks/useArticles.ts):
  ```typescript
  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase.from('articles').select('*').order('name');
      if (error) console.error(error);
      setArticles(data || []);
    };
    fetchArticles();
  }, []);
  ```
- Return: data, loading state, CRUD functions, filters

### TypeScript Patterns
- **Database types**: Auto-generated in [src/lib/supabase/types.ts](src/lib/supabase/types.ts) from Supabase schema
- **Feature types**: Defined in each `features/{feature}/types.ts`
  - Domain models (Article, Delivery, Sale)
  - Form data types (ArticleFormData)
  - Filter types (ArticleFilters)
- **Computed fields**: API functions extend DB types with calculations
  - Example: `ArticleWithComputed` adds `kg_per_piece`, `pieces_per_kg` from `grams_per_piece`

### State Management
- **No global state library** - React `useState` + `useContext` only
- **LocalStorage** for client-side persistence:
  - Utilities in [src/shared/utils/storage.ts](src/shared/utils/storage.ts)
  - `saveToStorage()`, `loadFromStorage()` with Date serialization
  - Used for settings, temporary data (migrating to Supabase)

### Environment Variables
- **Supabase config**: `.env` file (git-ignored, see `.env.example`)
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Fallback hardcoded in [src/lib/supabase/client.ts](src/lib/supabase/client.ts) (dev only)
- Access via `import.meta.env.VITE_*`

### Import/Export Utilities
- **CSV/Excel parsing**: [xlsx](https://www.npmjs.com/package/xlsx) library
  - Example: [src/features/deliveries/utils/importDeliveries.ts](src/features/deliveries/utils/importDeliveries.ts)
  - Handles Excel serial dates, currency symbols, flexible formats
- **PDF/Excel export**: jspdf + jspdf-autotable
  - Example: [src/features/reports/utils/exportUtils.ts](src/features/reports/utils/exportUtils.ts)
  - `exportToCSV()`, `exportToExcel()`, `exportToPDF()`

## Development Workflow

### Commands
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint (React hooks rules enabled)
npm run preview  # Preview production build
```

### Adding a New Feature
1. Create `src/features/{feature}/` directory
2. Add `index.ts` (exports), `types.ts` (interfaces), `components/`, `hooks/`, `utils/`
3. Create main component (e.g., `{Feature}.tsx` + `{Feature}.css`)
4. Add to `TabId` type in [src/shared/components/Tabs/types.ts](src/shared/components/Tabs/types.ts)
5. Add case in [App.tsx](src/App.tsx) `renderContent()` switch
6. (If using Supabase) Add API functions in `src/lib/api/{feature}.ts`, export in `src/lib/api/index.ts`

### Common Patterns
- **Validation**: Utility functions in `features/{feature}/utils/` (return `{ isValid: boolean, error?: string }`)
- **Date handling**: Convert DB strings to Date objects, handle localStorage serialization
- **Currency**: Store in EUR, format with `toFixed(2)`
- **Weight**: Store in grams, display as kg (÷ 1000)

## Debugging
- Check browser console for Supabase errors
- Inspect LocalStorage: DevTools → Application → Local Storage
- Common issues:
  - Date deserialization from localStorage (check `storage.ts` reviver)
  - Supabase RLS policies (check DB permissions)
