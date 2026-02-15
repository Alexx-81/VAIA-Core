# VAIA Core - Development Instructions

## Project Overview
VAIA Core is an ERP/CRM application for managing articles, deliveries, sales, and inventory. Built with React 19, TypeScript, Vite, and Supabase.

## DB Migrations

### Workflow (Using Supabase CLI)

**Always use Supabase CLI to keep local and remote migrations in perfect sync:**

```bash
# 1. Create new migration file
npx supabase migration new <migration_name>

# 2. Edit the generated file in supabase/migrations/ directory
# Example: supabase/migrations/20260215120000_add_loyalty_program.sql

# 3. Apply migration to remote database
npx supabase db push

# 4. Commit the migration file to git
git add supabase/migrations/
git commit -m "feat: add loyalty program tables"
```

### Benefits of CLI Approach
- ✅ **Zero divergence** - Local files always match remote
- ✅ **No warnings** - Supabase tracks migrations properly
- ✅ **Version control** - All migrations in git history
- ✅ **Rollback support** - Can revert locally with `npx supabase db reset`
- ✅ **Type generation** - Auto-updates TypeScript types

### Setup (One-time)
```bash
# 1. Initialize Supabase project (creates supabase/ directory)
npx supabase init

# 2. Set access token (Option A: Login)
npx supabase login --no-browser
# Follow link and enter verification code

# OR (Option B: Environment variable)
# Get token from https://supabase.com/dashboard/account/tokens
$env:SUPABASE_ACCESS_TOKEN="sbp_your_token_here"  # PowerShell
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"  # Bash

# 3. Link to remote project
npx supabase link --project-ref ptigdekgzraimaepgczt

# 4. Verify sync
npx supabase migration list
```

### Migration File Structure
```sql
-- supabase/migrations/20260215120000_example.sql

-- Create tables
CREATE TABLE ...;

-- Add indexes
CREATE INDEX ...;

-- Set up RLS policies
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;

-- Update functions
CREATE OR REPLACE FUNCTION ...;
```

### Common Commands
```bash
npx supabase migration list              # View all migrations (local vs remote)
npx supabase db diff                     # Compare local vs remote schema
npx supabase db push                     # Apply new migrations to remote
npx supabase db push --dry-run           # Preview what will be applied
npx supabase gen types typescript        # Regenerate TypeScript types
```

### ⚠️ Important Rules
- **Never use Supabase Dashboard SQL Editor** - It breaks sync with local files
- **Always use `npx supabase migration new`** - Creates timestamped files automatically
- **Always commit migrations to git** - Keep version history in supabase/migrations/
- **Always run `npx supabase db push`** - Apply to remote after creating migration
- **Use npx prefix** - Global CLI installation is not supported, always use npx

### 🤖 Automated Git Hooks

**Pre-commit hook automatically syncs migrations** - No need to manually run `npx supabase db push`!

When you commit migration files:
```bash
git add supabase/migrations/20260215120000_new_feature.sql
git commit -m "feat: add new feature"

# Automatically happens:
# 1. Detects migration files in commit
# 2. Runs npx supabase db push
# 3. Shows which migrations are applied
# 4. If successful → allows commit
# 5. If failed → blocks commit
```

**Benefits:**
- ✅ **Zero-effort sync** - No manual `db push` required
- ✅ **100% guarantee** - Cannot commit unsynced migrations
- ✅ **Error prevention** - Blocks commit if migration has errors
- ✅ **Automatic verification** - Always shows what's being applied

**Manual check (optional):**
```bash
npm run check-migrations  # Run sync script manually
```

**Bypass hook (emergency only):**
```bash
git commit --no-verify -m "wip"  # Skip pre-commit hook (not recommended!)
```

**Setup (first time):**
```bash
npm install  # Installs husky and sets up hooks automatically
```

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

## Database Schema

### Core Tables

#### `qualities` - Product Categories
```sql
id              SERIAL PRIMARY KEY
name            TEXT NOT NULL UNIQUE
note            TEXT DEFAULT ''
is_active       BOOLEAN NOT NULL DEFAULT true
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- Used to categorize products (e.g., "Premium", "Standard", "Economy")
- Referenced by `deliveries` table
- Soft delete via `is_active` flag

#### `articles` - Product Catalog
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL UNIQUE
grams_per_piece INTEGER NOT NULL CHECK (grams_per_piece > 0)
is_active       BOOLEAN NOT NULL DEFAULT true
last_sold_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- Stores products with weight in grams (converted to kg in UI: kg = grams ÷ 1000)
- Computed fields in API: `kg_per_piece`, `pieces_per_kg`
- Referenced by `sale_lines` table

#### `deliveries` - Incoming Deliveries
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
display_id          TEXT NOT NULL
date                DATE NOT NULL
quality_id          INTEGER NOT NULL REFERENCES qualities(id) ON DELETE RESTRICT
kg_in               NUMERIC(10, 3) NOT NULL CHECK (kg_in > 0)
unit_cost_per_kg    NUMERIC(10, 4) NOT NULL CHECK (unit_cost_per_kg >= 0)
invoice_number      TEXT
supplier_name       TEXT
note                TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- `display_id`: Visual identifier (e.g., "1", "1A", "2") for grouping invoiced/non-invoiced deliveries
- `invoice_number`: If present → invoiced delivery (accounting), else → non-invoiced (real only)
- Referenced by `sale_lines` (real_delivery_id, accounting_delivery_id)

#### `customers` - Customer Management
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                TEXT NOT NULL
barcode             TEXT UNIQUE
phone               TEXT
email               TEXT
address             TEXT
notes               TEXT
gdpr_consent        BOOLEAN NOT NULL DEFAULT false
company_name        TEXT
company_address     TEXT
tax_number          TEXT
bulstat             TEXT
mol_name            TEXT
recipient_name      TEXT
recipient_egn       TEXT
vat_number          TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- Stores customer information for sales tracking and invoicing
- Optional barcode for quick lookup
- GDPR compliance tracking
- Referenced by `sales` table

#### `sales` - Sales Header
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
sale_number     TEXT NOT NULL UNIQUE
date_time       TIMESTAMPTZ NOT NULL DEFAULT NOW()
payment_method  payment_method NOT NULL DEFAULT 'cash'
customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL
note            TEXT
status          sale_status NOT NULL DEFAULT 'draft'
finalized_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- **Enums**: 
  - `payment_method`: 'cash', 'card', 'other', 'no_cash'
  - `sale_status`: 'draft', 'finalized'
- `sale_number`: Auto-generated (e.g., "S-2026-001")
- `customer_id`: Optional link to customer (nullable, preserves sale if customer deleted)
- Status workflow: draft → finalized (finalized sales cannot be edited)
- Has many `sale_lines` (cascade delete)

#### `sale_lines` - Sales Details
```sql
id                              UUID PRIMARY KEY DEFAULT gen_random_uuid()
sale_id                         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE
article_id                      UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT
quantity                        INTEGER NOT NULL CHECK (quantity > 0)
unit_price_eur                  NUMERIC(10, 4) NOT NULL CHECK (unit_price_eur >= 0)
real_delivery_id                UUID NOT NULL REFERENCES deliveries(id) ON DELETE RESTRICT
accounting_delivery_id          UUID REFERENCES deliveries(id) ON DELETE RESTRICT
kg_per_piece_snapshot           NUMERIC(10, 6)
unit_cost_per_kg_real_snapshot  NUMERIC(10, 4)
unit_cost_per_kg_acc_snapshot   NUMERIC(10, 4)
created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- **Real delivery**: Where stock is physically deducted
- **Accounting delivery**: Used when real delivery has no invoice (for accounting purposes)
  - If real delivery is invoiced → accounting_delivery_id is NULL
  - If real delivery is not invoiced → accounting_delivery_id points to an invoiced delivery
- **Snapshots**: Frozen values at finalization time (for historical accuracy)

#### `employees` - User Management
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id    UUID UNIQUE NOT NULL
full_name       TEXT NOT NULL
email           TEXT UNIQUE NOT NULL
role            TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'demo'))
is_former       BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- Linked to Supabase Auth via `auth_user_id`
- **Roles**:
  - `admin`: Full access to all features and data
  - `employee`: Access based on `employee_permissions`
  - `demo`: Read-only access (cannot modify data)

#### `employee_permissions` - Tab-Level Access Control
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
tab_id          TEXT NOT NULL CHECK (tab_id IN ('dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'customers', 'inventory', 'reports', 'statistics', 'settings'))
can_access      BOOLEAN NOT NULL DEFAULT false
UNIQUE (employee_id, tab_id)
```
- Granular permissions per feature/tab
- Only applies to 'employee' role (admins bypass, demo gets read-only)

#### `app_settings` - Application Configuration (Singleton)
```sql
id                              TEXT PRIMARY KEY DEFAULT 'default'
currency                        TEXT NOT NULL DEFAULT 'EUR'
timezone                        TEXT NOT NULL DEFAULT 'Europe/Sofia'
sale_number_format              TEXT NOT NULL DEFAULT 'auto-mmyyyy'
decimals_eur                    INTEGER NOT NULL DEFAULT 2
decimals_kg                     INTEGER NOT NULL DEFAULT 2
kg_rounding                     TEXT NOT NULL DEFAULT 'none'
cost_rounding                   TEXT NOT NULL DEFAULT 'standard'
min_kg_threshold                NUMERIC(10, 3) NOT NULL DEFAULT 5.0
block_sale_on_insufficient_real BOOLEAN NOT NULL DEFAULT false
block_sale_on_insufficient_accounting BOOLEAN NOT NULL DEFAULT false
allow_zero_price_sales          BOOLEAN NOT NULL DEFAULT false
delivery_edit_mode              TEXT NOT NULL DEFAULT 'note-only'
allow_article_kg_edit           BOOLEAN NOT NULL DEFAULT true
default_export_format           TEXT NOT NULL DEFAULT 'excel'
[...many export settings...]
company_name                    TEXT NOT NULL DEFAULT ''
eik                             TEXT NOT NULL DEFAULT ''
[...company info fields...]
created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
- Single row (id='default')
- Controls app behavior, export formats, company info for reports

### Database Views

#### `delivery_sales_real` - Real Inventory Calculation
```sql
SELECT 
  d.id as delivery_id,
  COALESCE(SUM(sl.quantity * sl.kg_per_piece_snapshot), 0) as kg_sold_real
FROM deliveries d
LEFT JOIN sale_lines sl ON sl.real_delivery_id = d.id
LEFT JOIN sales s ON s.id = sl.sale_id AND s.status = 'finalized'
GROUP BY d.id;
```
- Tracks physical stock depletion per delivery

#### `delivery_sales_accounting` - Accounting Inventory Calculation
```sql
SELECT 
  d.id as delivery_id,
  COALESCE(SUM(
    CASE 
      WHEN sl.accounting_delivery_id = d.id THEN sl.quantity * sl.kg_per_piece_snapshot
      WHEN sl.accounting_delivery_id IS NULL AND sl.real_delivery_id = d.id THEN sl.quantity * sl.kg_per_piece_snapshot
      ELSE 0
    END
  ), 0) as kg_sold_acc
FROM deliveries d
LEFT JOIN sale_lines sl ON sl.real_delivery_id = d.id OR sl.accounting_delivery_id = d.id
LEFT JOIN sales s ON s.id = sl.sale_id AND s.status = 'finalized'
GROUP BY d.id;
```
- Tracks accounting stock (uses accounting_delivery_id when present, else falls back to real)

#### `delivery_inventory` - Complete Inventory View
Combines deliveries with sales calculations to show:
- `kg_in`: Initial delivery amount
- `kg_sold_real`, `kg_remaining_real`: Real stock tracking
- `kg_sold_acc`, `kg_remaining_acc`: Accounting stock tracking
- `total_cost_eur`: Total cost of delivery
- `is_invoiced`: Whether delivery has invoice

### Relationships & Constraints

```
qualities (1) ----< (N) deliveries
articles (1) ----< (N) sale_lines
deliveries (1) ----< (N) sale_lines [real_delivery_id]
deliveries (1) ----< (N) sale_lines [accounting_delivery_id, optional]
sales (1) ----< (N) sale_lines [CASCADE DELETE]
customers (1) ----< (N) sales [ON DELETE SET NULL]
employees (1) ----< (N) employee_permissions [CASCADE DELETE]
```

**Delete Behaviors:**
- `ON DELETE RESTRICT`: qualities, articles, deliveries (cannot delete if referenced)
- `ON DELETE CASCADE`: sale_lines delete when parent sale is deleted
- `ON DELETE SET NULL`: customer_id in sales becomes NULL if customer deleted

### Security & RLS Policies

#### Helper Functions
```sql
get_my_role()           -- Returns current user's role ('admin', 'employee', 'demo')
is_admin()              -- Returns true if current user is admin
is_demo()               -- Returns true if current user is demo
```

#### RLS Policy Pattern (Core Tables)

**All authenticated users can SELECT:**
```sql
ON qualities/articles/deliveries/sales/sale_lines FOR SELECT
USING (auth.uid() IS NOT NULL);
```

**Non-demo users can INSERT/UPDATE:**
```sql
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
FOR UPDATE USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
```

**Only admins can DELETE:**
```sql
FOR DELETE USING (public.is_admin());
```

#### Employee & Permission Policies

**Employees table:**
- Admins: Full access (SELECT/INSERT/UPDATE/DELETE)
- Employees: Can view own record only

**Employee_permissions table:**
- Admins: Full access
- Employees: Can view own permissions only

**Customers table:**
- Admins: Full access
- Employees: Access if `employee_permissions.tab_id = 'customers'` and `can_access = true`

**App_settings table:**
- All authenticated: SELECT
- Admins only: UPDATE

## Application Structure

### Complete Feature List

#### `features/admin/` - Admin Panel
```
├── components/
│   ├── Admin.tsx                    # Main admin panel
│   ├── Admin.css
│   ├── EmployeeDialog.tsx           # Add/edit employee modal
│   ├── EmployeeDialog.css
│   ├── EmployeeRow.tsx              # Employee table row
│   ├── EmployeeRow.css
│   ├── EmployeeTable.tsx            # Employee list table
│   └── EmployeeTable.css
├── hooks/
│   ├── useAdmin.ts                  # Employee CRUD operations
│   └── useEmployeeForm.ts           # Form state management
├── types.ts                         # EmployeeFormData, PermissionsMap
└── index.ts
```
- Manage employees, roles, and tab permissions
- Only accessible to admins

#### `features/articles/` - Product Catalog
```
├── components/
│   ├── Articles.tsx                 # Main articles page
│   ├── Articles.css
│   ├── ArticleDialog.tsx            # Add/edit article modal
│   ├── ArticleDialog.css
│   ├── ArticleTable.tsx             # Articles table with sorting
│   ├── ArticleTable.css
│   ├── ArticleFiltersBar.tsx        # Search + active filter
│   └── ArticleFiltersBar.css
├── hooks/
│   ├── useArticles.ts               # Fetch/CRUD articles
│   └── useArticleForm.ts            # Form validation
├── utils/
│   └── validation.ts                # validateArticle()
├── types.ts                         # Article, ArticleFormData, ArticleFilters
├── data/                            # (Legacy mock data - phased out)
└── index.ts
```
- Manage articles with name and weight (grams_per_piece)
- Auto-update `last_sold_at` when sold

#### `features/auth/` - Authentication
```
├── components/
│   ├── AuthPage.tsx                 # Login/register page
│   ├── AuthPage.css
│   ├── LoginForm.tsx                # Login form
│   ├── LoginForm.css
│   ├── RegisterForm.tsx             # Registration form
│   └── RegisterForm.css
└── index.ts
```
- Supabase Auth integration
- Login/register with email & password
- Automatic session management

#### `features/customers/` - Customer Management
```
├── components/
│   ├── Customers.tsx                # Main customers page
│   ├── Customers.css
│   ├── CustomerDialog.tsx           # Add/edit customer modal
│   ├── CustomerDialog.css
│   ├── CustomerTable.tsx            # Customer list with search
│   ├── CustomerTable.css
│   ├── CustomerFiltersBar.tsx       # Search bar
│   └── CustomerFiltersBar.css
├── hooks/
│   ├── useCustomers.ts              # Fetch/CRUD customers
│   └── useCustomerForm.ts           # Form validation
├── utils/
│   └── validation.ts                # validateCustomer()
├── types.ts                         # Customer, CustomerFormData, CustomerFilters
└── index.ts
```
- Manage customer database
- Optional barcode for quick lookup
- GDPR compliance tracking
- Company info for invoicing

#### `features/dashboard/` - Home Dashboard
```
├── components/
│   ├── Dashboard.tsx                # Main dashboard
│   ├── Dashboard.css
│   ├── RecentSales.tsx              # Recent sales widget
│   ├── RecentSales.css
│   ├── LowStockAlert.tsx            # Low inventory alert
│   ├── LowStockAlert.css
│   ├── QuickStats.tsx               # KPI cards
│   └── QuickStats.css
└── index.ts
```
- Overview of recent activity
- Quick stats (total sales, inventory levels)
- Low stock warnings

#### `features/deliveries/` - Delivery Management
```
├── components/
│   ├── Deliveries.tsx               # Main deliveries page
│   ├── Deliveries.css
│   ├── DeliveryDialog.tsx           # Add/edit delivery modal
│   ├── DeliveryDialog.css
│   ├── DeliveryTable.tsx            # Deliveries table
│   ├── DeliveryTable.css
│   ├── DeliveryFiltersBar.tsx       # Date range + quality filter
│   └── DeliveryFiltersBar.css
├── hooks/
│   ├── useDeliveries.ts             # Fetch/CRUD deliveries
│   └── useDeliveryForm.ts           # Form validation
├── utils/
│   ├── validation.ts                # validateDelivery()
│   ├── importDeliveries.ts          # Excel import logic
│   └── exportDeliveries.ts          # Export to CSV/Excel
├── types.ts                         # Delivery, DeliveryFormData, DeliveryFilters
├── data/                            # (Legacy mock data)
└── index.ts
```
- Manage incoming deliveries with quantities and costs
- `display_id` groups related deliveries (invoiced vs non-invoiced)
- Import/export via Excel

#### `features/inventory/` - Stock Management
```
├── components/
│   ├── Inventory.tsx                # Main inventory page
│   ├── Inventory.css
│   ├── InventoryTable.tsx           # Stock levels per delivery
│   ├── InventoryTable.css
│   ├── InventoryFiltersBar.tsx      # Quality + low stock filter
│   └── InventoryFiltersBar.css
├── hooks/
│   └── useInventory.ts              # Fetch delivery_inventory view
├── utils/
│   └── exportInventory.ts           # Export current stock
├── types.ts                         # InventoryItem, InventoryFilters
└── index.ts
```
- View real vs accounting stock per delivery
- Highlight low stock warnings (based on `min_kg_threshold`)
- Uses `delivery_inventory` view

#### `features/qualities/` - Product Categories
```
├── components/
│   ├── QualityBadge.tsx             # Reusable quality badge
│   ├── QualityBadge.css
│   ├── QualityDialog.tsx            # Add/edit quality modal
│   ├── QualityDialog.css
│   ├── QualityList.tsx              # Simple list view
│   └── QualityList.css
├── utils/
│   └── validation.ts                # validateQuality()
└── index.ts
```
- Simple CRUD for qualities (used in deliveries dropdown)
- Soft delete via `is_active` flag

#### `features/reports/` - Reports & Analytics
```
├── components/
│   ├── Reports.tsx                  # Main reports page
│   ├── Reports.css
│   ├── ReportFilters.tsx            # Date range + report type selector
│   ├── ReportFilters.css
│   ├── ReportPreview.tsx            # Data preview before export
│   └── ReportPreview.css
├── hooks/
│   └── useReports.ts                # Fetch aggregated data
├── utils/
│   ├── exportUtils.ts               # exportToCSV(), exportToExcel(), exportToPDF()
│   ├── calculations.ts              # Profit margins, totals
│   └── formatters.ts                # Currency, date formatting
├── types.ts                         # ReportType, ReportFilters, ReportData
└── index.ts
```
- Generate sales/inventory reports
- Export to CSV, Excel (xlsx), PDF (jspdf)
- Date range filtering
- Real vs Accounting views

#### `features/sales/` - Sales Management
```
├── components/
│   ├── Sales.tsx                    # Main sales page
│   ├── Sales.css
│   ├── SaleDialog.tsx               # Create/edit sale modal
│   ├── SaleDialog.css
│   ├── SaleTable.tsx                # Sales list
│   ├── SaleTable.css
│   ├── SaleLineForm.tsx             # Add line item to sale
│   ├── SaleLineForm.css
│   ├── SaleFiltersBar.tsx           # Date + status + payment filter
│   └── SaleFiltersBar.css
├── hooks/
│   ├── useSales.ts                  # Fetch/CRUD sales
│   ├── useSaleForm.ts               # Sale header form
│   └── useSaleLines.ts              # Line items CRUD
├── utils/
│   ├── validation.ts                # validateSale(), validateSaleLine()
│   ├── calculations.ts              # Calculate totals, margins
│   ├── saleNumberGenerator.ts       # Auto-generate sale numbers
│   └── importSales.ts               # Import from Excel
├── types.ts                         # Sale, SaleLine, SaleFormData, SaleFilters
├── data/                            # (Legacy)
└── index.ts
```
- Create sales with multiple line items
- Draft → Finalized workflow (finalized sales are locked)
- Snapshots frozen at finalization time
- Real + Accounting delivery selection per line
- Optional customer assignment

#### `features/settings/` - Application Settings
```
├── components/
│   ├── Settings.tsx                 # Main settings page
│   ├── Settings.css
│   ├── GeneralSettings.tsx          # Currency, timezone, formats
│   ├── GeneralSettings.css
│   ├── ExportSettings.tsx           # CSV/Excel/PDF defaults
│   ├── ExportSettings.css
│   ├── CompanySettings.tsx          # Company info for reports
│   └── CompanySettings.css
├── hooks/
│   └── useSettings.ts               # Fetch/update app_settings
├── utils/
│   └── validation.ts                # validateSettings()
├── types.ts                         # AppSettings, SettingsFormData
└── index.ts
```
- Manage app configuration (singleton table)
- Export format defaults
- Company information for invoices/reports

#### `features/statistics/` - Statistics & KPIs
```
├── components/
│   ├── Statistics.tsx               # Main statistics page
│   ├── Statistics.css
│   ├── SalesChart.tsx               # Sales over time chart
│   ├── SalesChart.css
│   ├── TopArticles.tsx              # Best-selling products
│   ├── TopArticles.css
│   ├── ProfitMargins.tsx            # Margin analysis
│   └── ProfitMargins.css
├── hooks/
│   └── useStatistics.ts             # Aggregate data queries
├── utils/
│   └── chartHelpers.ts              # Chart data formatting
├── types.ts                         # StatisticsData, ChartData
└── index.ts
```
- Sales trends analysis
- Top-performing articles
- Profit margin calculations
- Date range filtering

### Shared Components (`src/shared/components/`)
```
├── Layout/
│   ├── Layout.tsx                   # App-level layout (header, tabs, content)
│   └── Layout.css
├── Tabs/
│   ├── Tabs.tsx                     # Navigation tabs
│   ├── Tabs.css
│   └── types.ts                     # TabId type
├── Logo/
│   ├── Logo.tsx                     # VAIA logo component
│   └── Logo.css
├── Button/
│   ├── Button.tsx                   # Reusable button
│   └── Button.css
├── Input/
│   ├── Input.tsx                    # Form input
│   └── Input.css
├── Select/
│   ├── Select.tsx                   # Dropdown select
│   └── Select.css
├── DatePicker/
│   ├── DatePicker.tsx               # Date input
│   └── DatePicker.css
├── Modal/
│   ├── Modal.tsx                    # Dialog/modal wrapper
│   └── Modal.css
└── LoadingSpinner/
    ├── LoadingSpinner.tsx           # Loading indicator
    └── LoadingSpinner.css
```

### Shared Utilities (`src/shared/utils/`)
```
├── storage.ts                       # localStorage helpers (saveToStorage, loadFromStorage)
├── date.ts                          # Date formatting utilities
├── currency.ts                      # Currency formatting (EUR)
└── validation.ts                    # Common validation helpers
```

### Context Providers (`src/shared/context/`)
```
├── AuthContext.tsx                  # Authentication state
├── SettingsContext.tsx              # App settings state
└── PermissionsContext.tsx           # User permissions state
```

### API Layer (`src/lib/api/`)
```
├── articles.ts                      # getArticles(), createArticle(), updateArticle(), deleteArticle()
├── deliveries.ts                    # getDeliveries(), createDelivery(), updateDelivery(), deleteDelivery()
├── sales.ts                         # getSales(), createSale(), updateSale(), deleteSale(), finalizeSale()
├── saleLines.ts                     # getSaleLines(), createSaleLine(), updateSaleLine(), deleteSaleLine()
├── qualities.ts                     # getQualities(), createQuality(), updateQuality(), deleteQuality()
├── customers.ts                     # getCustomers(), createCustomer(), updateCustomer(), deleteCustomer()
├── employees.ts                     # getEmployees(), createEmployee(), updateEmployee(), deleteEmployee()
├── permissions.ts                   # getPermissions(), updatePermissions()
├── settings.ts                      # getSettings(), updateSettings()
├── inventory.ts                     # getInventory() - queries delivery_inventory view
└── index.ts                         # Re-exports all API functions
```

Each API file exports typed async functions that use `lib/supabase/client.ts` for database operations.

### Shared Hooks (`src/lib/hooks/`)
```
├── useQualities.ts                  # Fetch all qualities (cached)
├── useArticles.ts                   # Fetch all articles
├── useDeliveries.ts                 # Fetch deliveries with filters
├── useAuth.ts                       # Authentication state
└── usePermissions.ts                # Current user permissions
```
These hooks are reused across features for consistent data fetching.
