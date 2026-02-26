# VAIA Core

**ERP/CRM application for managing articles, deliveries, sales, inventory, and customer loyalty.**

Built with React 19 · TypeScript · Vite 7 · Supabase · Deployed on Netlify

---

## Table of Contents

- [Project Description](#project-description)
- [Architecture](#architecture)
- [Database Schema Design](#database-schema-design)
- [Features](#features)
- [Business Logic Rules](#business-logic-rules)
- [Local Development Setup Guide](#local-development-setup-guide)
- [Key Folders and Files](#key-folders-and-files)
- [Migration Workflow](#migration-workflow)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## Project Description

VAIA Core is a full-featured **ERP/CRM system** designed for businesses that manage product deliveries from suppliers, maintain stock (inventory), sell products through a POS-style interface, and track customer loyalty. The entire user interface is in **Bulgarian** and all monetary values are in **EUR**.

### What It Does

- **Product catalog management** — define articles with weight (grams per piece), discounts, and active/inactive status
- **Delivery tracking** — record incoming deliveries with cost, quantity (kg), supplier, invoice number, and quality category
- **Point-of-Sale (POS)** — create sales with multiple line items, each linked to a specific delivery for real and accounting stock tracking
- **Dual inventory model** — track both **real** (physical) and **accounting** (invoiced) stock levels per delivery
- **Customer loyalty program** — automatic tier upgrades based on 12-month turnover, voucher issuance rules, and discount application at POS
- **Reporting & statistics** — generate reports grouped by deliveries, qualities, articles, or individual transactions; export to CSV, Excel, or PDF
- **Employee management** — role-based access control with granular tab-level permissions

### Who Can Do What

| Role | Access Level |
|------|-------------|
| **Admin** | Full access to all features. Can create/edit/delete employees, manage permissions, delete any record, configure all settings. |
| **Employee** | Access only to tabs explicitly granted by an admin via the Permissions dialog. Cannot delete records (enforced by database RLS policies). |
| **Demo** | Read-only access to all tabs. Cannot create, edit, or delete any data. Useful for demonstrations and evaluations. |

### Demo Access

A built-in demo mode is available on the login screen with pre-configured credentials:
- **Email:** `demo@vaia.bg`
- **Password:** `demo123`

---

## Architecture

### High-Level Overview

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────────────┐
│              │     │              │     │           Supabase              │
│   Browser    │────▶│  Netlify CDN │────▶│                                 │
│  (React SPA) │     │  (static)    │     │  ┌─────────┐  ┌─────────────┐  │
│              │     │              │     │  │  Auth    │  │ PostgreSQL  │  │
└──────────────┘     └──────────────┘     │  └─────────┘  └─────────────┘  │
                                          │  ┌─────────┐  ┌─────────────┐  │
                                          │  │ Storage  │  │   Edge Fns  │  │
                                          │  └─────────┘  └─────────────┘  │
                                          └─────────────────────────────────┘
```

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with functional components and hooks |
| **TypeScript 5.9** | Type safety across the entire codebase |
| **Vite 7** | Build tool and dev server with HMR |
| **Plain CSS** | Styling — no preprocessors or UI frameworks; each component has a colocated `.css` file |
| **History API** | Client-side routing — no router library; `pushState`/`popstate` map URL paths to `TabId` values |
| **pdfmake** | PDF report generation |
| **xlsx (SheetJS)** | Excel/CSV import and export |

### Backend (Supabase — no custom server)

| Service | Purpose |
|---------|---------|
| **PostgreSQL** | Primary database — 14 tables, 4 views, custom functions, triggers, enums |
| **Auth** | Email + password authentication with session management |
| **Row-Level Security (RLS)** | Fine-grained access control enforced at the database level per role |
| **Edge Functions** | Deno-based serverless functions for privileged operations (employee create/delete) |
| **Storage** | File storage for documents (e.g., GDPR declarations) |
| **Realtime** | Auto-generated REST API via PostgREST (used by `@supabase/supabase-js`) |

### Deployment

- **Hosting:** Netlify (static SPA)
- **Build command:** `npm run build` (TypeScript check + Vite production build)
- **SPA routing:** All paths redirect to `index.html` (configured in `netlify.toml`)
- **Database migrations:** Applied via Supabase CLI (`npx supabase db push`), auto-synced on commit via Husky git hook

### State Management

- **No global state library** — React `useState` + `useContext` only
- **Single AuthContext** provides: `user`, `session`, `employee`, `permissions`, `isAdmin`, `isReadOnly`, auth methods
- **LocalStorage** used for client-side settings persistence (via `shared/utils/storage.ts`)
- **Data fetching** follows a consistent pattern: `useEffect` → Supabase query → local `useState`

---

## Database Schema Design

### Entity-Relationship Diagram

```
┌──────────────┐         ┌───────────────────┐         ┌──────────────────┐
│  qualities   │────1:N──▶│    deliveries      │◀──1:N───│    sale_lines    │
│──────────────│         │───────────────────│         │──────────────────│
│ id (PK)      │         │ id (PK)           │         │ id (PK)          │
│ name         │         │ display_id        │         │ sale_id (FK)     │
│ note         │         │ date              │         │ article_id (FK)  │
│ is_active    │         │ quality_id (FK)   │         │ quantity         │
│ created_at   │         │ kg_in             │         │ unit_price_eur   │
│ updated_at   │         │ unit_cost_per_kg  │         │ real_delivery_id │
└──────────────┘         │ invoice_number    │         │ acc_delivery_id  │
                         │ supplier_name     │         │ kg_per_piece_snp │
                         │ note              │         │ cost_real_snp    │
                         │ created_at        │         │ cost_acc_snp     │
                         │ updated_at        │         │ discount_pct_snp │
                         └───────────────────┘         │ discount_fix_snp │
                                                       │ is_regular_price │
┌──────────────┐         ┌───────────────────┐         │ created_at       │
│  articles    │────1:N──▶│      (FK)         │─────────│ updated_at       │
│──────────────│         └───────────────────┘         └────────┬─────────┘
│ id (PK)      │                                                │
│ name         │                                                │ N:1
│ grams_piece  │                                                ▼
│ is_active    │         ┌───────────────────┐         ┌──────────────────┐
│ discount_pct │         │    customers      │──1:N──▶ │      sales       │
│ discount_fix │         │───────────────────│         │──────────────────│
│ last_sold_at │         │ id (PK)           │         │ id (PK)          │
│ created_at   │         │ name              │         │ sale_number      │
│ updated_at   │         │ barcode           │         │ date_time        │
└──────────────┘         │ phone, email      │         │ payment_method   │
                         │ address, notes    │         │ note             │
                         │ gdpr_consent      │         │ status           │
                         │ company_name      │         │ customer_id (FK) │
                         │ company_address   │         │ loyalty_mode     │
                         │ tax_number        │         │ tier_discount_%  │
                         │ bulstat           │         │ tier_discount_€  │
                         │ mol_name          │         │ voucher_id       │
                         │ recipient_name    │         │ voucher_amount   │
                         │ recipient_egn     │         │ total_paid_eur   │
                         │ vat_number        │         │ finalized_at     │
                         │ created_at        │         │ created_at       │
                         │ updated_at        │         │ updated_at       │
                         └───────┬───────────┘         └──────────────────┘
                                 │
          ┌──────────────────────┼─────────────────────────┐
          │ 1:1                  │ 1:N                     │ 1:N
          ▼                     ▼                         ▼
┌────────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│ customer_loyalty   │ │ customer_vouchers│ │  loyalty_ledger   │
│    _status         │ │──────────────────│ │───────────────────│
│────────────────────│ │ id (PK)          │ │ id (PK)           │
│ id (PK)            │ │ customer_id (FK) │ │ customer_id (FK)  │
│ customer_id (FK)   │ │ rule_id (FK)     │ │ sale_id (FK)      │
│ current_tier_id(FK)│ │ amount_eur       │ │ entry_type        │
│ tier_reached_at    │ │ min_purchase_eur │ │ amount_eur        │
│ tier_locked_until  │ │ status           │ │ posted_at         │
│ turnover_12m_eur   │ │ issued_at        │ │ note              │
│ last_recalc_at     │ │ expires_at       │ └───────────────────┘
│ created_at         │ │ redeemed_at      │
│ updated_at         │ │ redeemed_sale_id │
└────────────────────┘ │ cycle_key        │
          ▲            └──────────────────┘
          │ N:1                ▲ N:1
          │                    │
┌────────────────────┐ ┌──────────────────┐
│  loyalty_tiers     │ │  voucher_rules   │
│────────────────────│ │──────────────────│
│ id (PK)            │ │ id (PK)          │
│ name               │ │ trigger_turnover │
│ sort_order         │ │ voucher_amount   │
│ min_turnover_12m   │ │ valid_days       │
│ discount_percent   │ │ min_purchase_eur │
│ color              │ │ is_active        │
│ is_active          │ │ created_at       │
│ created_at         │ │ updated_at       │
│ updated_at         │ └──────────────────┘
└────────────────────┘

┌──────────────┐         ┌───────────────────────┐
│  employees   │────1:N──▶│ employee_permissions  │
│──────────────│         │───────────────────────│
│ id (PK)      │         │ id (PK)               │
│ auth_user_id │         │ employee_id (FK)      │
│ full_name    │         │ tab_id                │
│ email        │         │ can_access            │
│ role         │         └───────────────────────┘
│ is_former    │
│ created_at   │         ┌───────────────────────┐
│ updated_at   │         │    app_settings       │
└──────────────┘         │───────────────────────│
                         │ id = 'default' (PK)   │
                         │ currency, timezone    │
                         │ formatting options    │
                         │ inventory thresholds  │
                         │ export settings       │
                         │ company info          │
                         │ (40+ columns)         │
                         └───────────────────────┘
```

### Tables Summary

| Table | PK Type | Description |
|-------|---------|-------------|
| `qualities` | `SERIAL` | Product categories (e.g., Premium, Standard). Soft delete via `is_active`. |
| `articles` | `UUID` | Product catalog. Weight in grams, discounts (% and fixed EUR). |
| `deliveries` | `UUID` | Incoming deliveries with kg, cost/kg, supplier, invoice. `display_id` groups related deliveries. |
| `sales` | `UUID` | Sale headers. Auto-generated `sale_number` (S-YYYY-MM-NNN). Status: draft → finalized. |
| `sale_lines` | `UUID` | Sale line items. Links article + real delivery + optional accounting delivery. Snapshot fields frozen at finalization. |
| `customers` | `UUID` | Customer data: personal, contact, company/invoicing, GDPR consent, unique barcode. |
| `employees` | `UUID` | Linked to Supabase Auth via `auth_user_id`. Roles: admin, employee, demo. |
| `employee_permissions` | `UUID` | Tab-level access control per employee. 10 permissioned tabs. |
| `app_settings` | `TEXT` | Singleton row (id='default'). 40+ configuration columns. |
| `loyalty_tiers` | `SERIAL` | Loyalty tiers with name, min 12-month turnover, discount %. |
| `voucher_rules` | `SERIAL` | Automatic voucher generation rules (trigger amount, voucher value, validity). |
| `customer_loyalty_status` | `UUID` | Per-customer loyalty state: current tier, turnover, lock date. One row per customer. |
| `customer_vouchers` | `UUID` | Issued vouchers with status (issued/redeemed/expired/void), amount, expiry. |
| `loyalty_ledger` | `UUID` | Immutable record of every loyalty-relevant transaction (sale, refund, adjustment). |

### Enums

| Enum | Values |
|------|--------|
| `payment_method` | `cash`, `card`, `other`, `no_cash` |
| `sale_status` | `draft`, `finalized` |
| `voucher_status` | `issued`, `redeemed`, `expired`, `void` |
| `ledger_entry_type` | `sale`, `refund`, `adjustment` |

### Database Views

| View | Purpose |
|------|---------|
| `delivery_sales_real` | Total kg sold (real) per delivery from finalized sales |
| `delivery_sales_accounting` | Total kg sold (accounting) per delivery — uses `accounting_delivery_id` when present, falls back to `real_delivery_id` |
| `delivery_inventory` | Complete inventory view joining deliveries + qualities + both sales views. Shows `kg_in`, `kg_sold_real`, `kg_remaining_real`, `kg_sold_acc`, `kg_remaining_acc`, `total_cost_eur`, `is_invoiced` |
| `sale_lines_computed` | Per-line computed fields: `revenue_eur`, `kg_line`, `cogs_real_eur`, `cogs_acc_eur`, `profit_real_eur`, `profit_acc_eur` |
| `sales_summary` | Per-sale aggregates: `lines_count`, `total_pieces`, `total_kg`, `total_revenue_eur`, `total_cogs_real/acc_eur`, `total_profit_real/acc_eur` |

### Key Database Functions

| Function | Description |
|----------|-------------|
| `generate_sale_number()` | Returns auto-incremented `S-YYYY-MM-NNN` sale number |
| `set_sale_number()` | BEFORE INSERT trigger on `sales` — auto-fills `sale_number` if null |
| `update_article_last_sold_at()` | AFTER INSERT trigger on `sale_lines` — updates `articles.last_sold_at` |
| `finalize_sale(p_sale_id)` | Freezes all snapshot fields from current article/delivery data, sets `status='finalized'`, `finalized_at=NOW()` |
| `get_my_role()` | Returns current authenticated user's role |
| `is_admin()` / `is_demo()` | Role check helper functions used in RLS policies |
| `ensure_customer_loyalty_status(p_customer_id)` | Creates loyalty status record if not exists |
| `get_customer_loyalty_info(p_customer_id)` | Returns JSONB with tier info, turnover, active vouchers |
| `process_loyalty_after_sale(p_sale_id)` | Atomic: records ledger entry → recalculates turnover → upgrades/downgrades tier → issues earned vouchers |
| `redeem_voucher(p_voucher_id, p_sale_id)` | Marks voucher as redeemed |
| `expire_vouchers()` | Bulk-expires past-due vouchers |

### Relationships & Delete Behaviors

```
qualities (1) ────< (N) deliveries           ON DELETE RESTRICT
articles  (1) ────< (N) sale_lines           ON DELETE RESTRICT
deliveries(1) ────< (N) sale_lines           ON DELETE RESTRICT  (both real + accounting FK)
sales     (1) ────< (N) sale_lines           ON DELETE CASCADE
customers (1) ────< (N) sales                ON DELETE SET NULL
customers (1) ──── (1) customer_loyalty_status  ON DELETE CASCADE
customers (1) ────< (N) customer_vouchers    ON DELETE CASCADE
customers (1) ────< (N) loyalty_ledger       ON DELETE CASCADE
employees (1) ────< (N) employee_permissions ON DELETE CASCADE
loyalty_tiers  (1) ────< (N) customer_loyalty_status
voucher_rules  (1) ────< (N) customer_vouchers    ON DELETE SET NULL
```

**Key constraint rules:**
- Cannot delete a quality, article, or delivery that is referenced by sales (RESTRICT)
- Deleting a sale automatically removes all its line items (CASCADE)
- Deleting a customer nullifies `customer_id` in sales but preserves sale data (SET NULL)
- Deleting a customer removes all their loyalty data (CASCADE)

### Row-Level Security (RLS) Policies

| Operation | Core Tables (qualities, articles, deliveries, sales, sale_lines) | employees / permissions | app_settings |
|-----------|----------------------------------------------------------------|------------------------|--------------|
| **SELECT** | All authenticated users | Admins: all; Employees: own record only | All authenticated |
| **INSERT** | Non-demo users | Admins only (via Edge Functions) | — |
| **UPDATE** | Non-demo users | Admins only | Admins only |
| **DELETE** | Admins only | Admins only (via Edge Functions) | — |

---

## Features

### 1. Authentication (`features/auth/`)

- Email + password login via Supabase Auth
- **Demo mode** button on login screen (hardcoded credentials: `demo@vaia.bg` / `demo123`)
- Automatic session persistence and token refresh
- 5-second safety timeout — if no auth event fires, clears stale session
- Former employee detection — automatically signs out deactivated accounts with a message
- No self-registration — employees are created exclusively by admins

### 2. Dashboard (`features/dashboard/`)

The landing page after login, providing a business overview.

- **Date range filter** — presets: today, this week, this month, last month, this year, custom range
- **Ledger toggle** — switch between Real and Accounting views
- **Quality filter** — multi-select dropdown to narrow by product category
- **KPI cards** — revenue, COGS, profit, margin %, total kg, total pieces, sales count
- **Recent sales table** — last 10 finalized sales with sale number, datetime, payment method, line count, pieces, kg, revenue, COGS, profit, margin
- **Low stock alerts** — deliveries with remaining kg ≤ threshold (default 5.0 kg), showing delivery ID, date, quality, invoiced status, kg in/out/remaining, cost/kg

### 3. Qualities (`features/qualities/`)

Manage product categories used to classify deliveries.

- **CRUD** — create, edit, delete qualities with a name and optional note
- **Soft delete** — toggle `is_active` with confirmation dialog
- **Hard delete** — admin-only, with dependency check (shows count of linked deliveries)
- **Search** — filter by name
- **Status filter** — all / active / inactive
- **Delivery tracking** — each quality shows its delivery count and last delivery date
- **Excel import** — bulk import qualities from `.xlsx`/`.xls` files via ImportQualitiesDialog

### 4. Articles (`features/articles/`)

Manage the product catalog.

- **CRUD** — create, edit, deactivate, delete articles
- **Weight system** — stored as `grams_per_piece` in DB; displayed as `pieces_per_kg` in UI (1000 ÷ grams)
- **Discounts** — per-article discount percentage (0–100%) and/or fixed EUR discount
- **Active/inactive toggle** — soft deactivation
- **Hard delete** — admin-only, with dependency check (shows count of linked sales)
- **Search & sort** — filter by name; sort by name (asc/desc), most used, newest
- **Status filter** — all / active / inactive
- **Excel import** — import articles from spreadsheet with validation; downloadable template
- **Auto-tracking** — `last_sold_at` updated automatically by DB trigger when article is sold

### 5. Deliveries (`features/deliveries/`)

Track incoming product deliveries from suppliers.

- **CRUD** — full create/edit/delete with fields: date, quality, kg, cost/kg, supplier, invoice number, note
- **display_id system** — groups related deliveries: base number (e.g., "1") for invoiced, variant (e.g., "1A") for non-invoiced
- **Invoiced vs. non-invoiced** — presence of `invoice_number` determines invoiced status
- **Detail view** — expanded view showing delivery info + table of all linked sales with revenue/cost/profit breakdowns
- **URL integration** — `?new=true` query parameter opens the create dialog directly
- **Filters** — date range (presets + custom), search, quality, delivery type (invoiced/non-invoiced), stock status (in-stock/depleted/below-minimum)
- **Stats header** — in-stock and depleted delivery counts
- **Excel import** — bulk import deliveries from spreadsheet via ImportDeliveriesDialog
- **Hard delete** — admin-only; cascading delete removes linked sales (with confirmation showing affected count)

### 6. Sales / POS (`features/sales/`)

The core point-of-sale module for creating and managing sales.

- **Three views** — list (table), editor (POS), detail (read-only)
- **Keyboard shortcut** — `Ctrl+N` creates a new sale from the list view
- **URL integration** — `?new=true` opens the editor directly
- **Sale editor (POS):**
  - **Header** — date/time, payment method (cash/card/other/no cash), note, customer selector with barcode search
  - **Line items** — for each line: article selector, real delivery selector, accounting delivery (auto-shown if real delivery is non-invoiced), quantity, unit price, regular price flag
  - **Auto-computed per line** — revenue, kg, COGS (real + accounting), profit, margin
  - **Article discounts** — percentage and fixed EUR discounts applied to base price
  - **Loyalty panel** — apply tier discount (automatic %) or redeem a voucher
  - **Inline editing** — edit any line item directly in the editor
- **Finalization** — triggers `finalize_sale()` DB function:
  - Freezes snapshot values (kg_per_piece, unit_cost_per_kg_real, unit_cost_per_kg_acc, discount snapshots)
  - Sets `status = 'finalized'` and `finalized_at = NOW()`
  - Processes loyalty after sale (ledger entry, tier recalc, voucher issuance)
  - **Finalized sales cannot be edited or re-opened**
- **Sale number** — auto-generated format `S-YYYY-MM-NNN` (e.g., S-2026-02-001)
- **Stats** — total sales count and total revenue displayed in header
- **Excel import** — import sales from spreadsheet + downloadable template
- **Delete** — admin-only

### 7. Customers (`features/customers/`)

Manage the customer database for sales and loyalty tracking.

- **CRUD** — full create/edit/delete with two-tab dialog:
  - **Personal tab** — name, barcode (unique, for quick POS lookup), phone, email, address, notes, GDPR consent
  - **Company tab** — company name, company address, tax number, bulstat, MOL name, recipient name/EGN, VAT number
- **Loyalty badge** — each customer row displays their current loyalty tier
- **GDPR compliance** — consent tracking flag
- **Filters** — search, GDPR consent (all/yes/no), has company data (all/yes/no)
- **Hard delete** — admin-only; sales referencing this customer will have `customer_id` set to NULL

### 8. Loyalty Program (`features/loyalty/`)

A comprehensive loyalty system with tiers, vouchers, and automatic processing.

**Three sub-tabs:**

#### 8a. Tiers (🏆)
Configure loyalty tiers based on 12-month rolling turnover:

| Default Tier | Discount | Min Turnover (12 months) |
|-------------|----------|-------------------------|
| START | 0% | €0 |
| SILVER | 5% | €120 |
| GOLD | 8% | €240 |
| VIP | 12% | €420 |
| ELITE | 15% | €600 |

- **Tier upgrades** — immediate when turnover reaches the next tier's threshold
- **Tier downgrades** — only after the 12-month lock period expires (customer keeps tier for 12 months even if turnover drops)
- **Requires barcode** — loyalty only processes for customers who have a barcode assigned

#### 8b. Voucher Rules (🎟️)
Configure automatic voucher generation:

| Default Rule | Trigger Turnover | Voucher Amount | Validity | Min Purchase |
|-------------|-----------------|----------------|----------|-------------|
| Rule 1 | €150 | €5 | 30 days | €20 |
| Rule 2 | €300 | €10 | 30 days | €35 |

- After each finalized sale, `process_loyalty_after_sale()` checks all active rules
- If turnover ≥ trigger threshold and no voucher for that rule+cycle exists → issues a new voucher
- `cycle_key` prevents duplicate vouchers per rule per tier cycle

#### 8c. Vouchers (📋)
- View all issued vouchers with filtering by status (issued/redeemed/expired/void)
- Stats: total issued, active, redeemed, expired
- Vouchers are redeemed at the POS via the loyalty panel

### 9. Inventory (`features/inventory/`)

View and monitor stock levels with dual real/accounting tracking.

- **Four sub-tabs:**
  - **All** — shows both real and accounting stock tables
  - **Real** — physical stock per delivery (kg in, kg sold, kg remaining)
  - **Accounting** — accounting stock per delivery (follows invoiced deliveries)
  - **Comparison** — side-by-side real vs. accounting with difference and status indicators (ok/warning/critical)
- **Stats header** — in-stock count, below-minimum count, depleted count, total kg remaining, EUR value remaining
- **Filters** — search, quality, supplier, delivery type, stock status (all/in-stock/below-minimum/depleted/negative), min kg threshold
- **Export** — CSV and Excel for the current view
- **Data source** — reads from the `delivery_inventory` database view

### 10. Reports (`features/reports/`)

Generate business reports with flexible grouping and export options.

- **Report types:**
  - **By Deliveries** — one row per delivery with revenue, COGS, profit, margin
  - **By Qualities** — aggregated by product category
  - **By Articles** — aggregated by article/product
  - **Detailed** — individual transaction rows
- **Ledger mode** — Real or Accounting (with info panel explaining the difference)
- **Period filter** — this month, last month, or custom date range
- **Additional filters** — quality, delivery, supplier, payment method
- **Summary panel** — KPIs: revenue, COGS, profit, margin %, total kg, total pieces, sales count
- **Export** — CSV, Excel, PDF buttons always visible in the header

### 11. Statistics (`features/statistics/`)

Analyze sales trends and business performance over time.

- **Four sub-tabs:**
  - **Daily** — day-by-day breakdown
  - **Monthly** — month-by-month breakdown
  - **Yearly** — year-by-year breakdown
  - **Loyalty (🏆)** — customer loyalty statistics
- **Cost mode toggle** — Real, Accounting, or both simultaneously
- **Per-row metrics** — period, revenue, cost (real/acc), profit (real/acc), kg sold, margin (real/acc)
- **Date range & payment method filters**
- **Summary totals** — aggregated KPIs for the selected period
- **Export** — CSV, Excel, PDF for all sub-tabs including loyalty

### 12. Settings (`features/settings/`)

Configure application behavior, formatting, export defaults, and company information.

**Setting sections:**

| Section | Key Options |
|---------|------------|
| **General** | Currency (EUR, read-only), timezone (Europe/Sofia, London, Berlin), sale number format |
| **Formatting** | EUR decimal places (0/2/3), kg decimal places (2/3), kg rounding (none/0.01/0.05), cost rounding (standard/banker's) |
| **Inventory & Validation** | Min kg threshold (default 5.0), block sale on insufficient real/accounting stock, allow zero-price sales, delivery edit mode (forbidden/note-only/allow-all), allow article kg edit |
| **Export** | Default format (CSV/Excel/PDF), file name templates, CSV separator (;/,), CSV encoding, Excel options (summary, auto-width, bold header, freeze row, number formats), PDF options (orientation, page size, logo, footer) |
| **Report Header** | Company name, EIK, address, contact info, accounting/real report titles, signature text |

**Additional capabilities:**
- Reset all settings to defaults
- Import/export settings as JSON
- **Data backup** — export all Supabase data as JSON backup; restore from backup file
- Clear all localStorage data

### 13. Admin Panel (`features/admin/`)

Manage employees and their access permissions. **Admin-only access.**

- **Employee list** — searchable table with filters (active/former/all)
- **Create employee** — via Supabase Edge Function (`create-employee`): creates Auth user + `employees` DB record
- **Edit employee** — update name, email, role (admin/employee)
- **Toggle status** — deactivate (mark as former) / reactivate employees
- **Delete employee** — via Edge Function (`delete-employee`): removes DB record + Auth user. Prevents self-deletion.
- **Permissions dialog** — per-employee tab access control with checkboxes for 10 tabs:
  `dashboard`, `qualities`, `articles`, `deliveries`, `sales`, `customers`, `inventory`, `reports`, `statistics`, `settings`
- Permissions only apply to the `employee` role (admins bypass all checks)

---

## Business Logic Rules

### Sales & Finalization
1. **Finalized sales are immutable** — once finalized, a sale cannot be edited or re-opened
2. **Snapshots are frozen at finalization** — `kg_per_piece`, `unit_cost_per_kg` (real + accounting), and discount values are captured from current article/delivery data and stored permanently on the sale line
3. **Sale numbers** — auto-generated by DB trigger in format `S-YYYY-MM-NNN` (e.g., S-2026-02-001), incrementing per month

### Real vs. Accounting Deliveries
4. **Dual delivery model** — each sale line links to a **real delivery** (physical stock source) and optionally an **accounting delivery** (for invoicing purposes)
5. **Accounting delivery rule** — if the real delivery has no invoice, an invoiced delivery must be selected as the accounting delivery; if the real delivery is invoiced, accounting delivery is NULL
6. **display_id convention** — base number (e.g., "1") for invoiced delivery, suffix "A" (e.g., "1A") for non-invoiced variant of the same batch

### Products & Weight
7. **Weight stored in grams** — `grams_per_piece` in the database, displayed as `pieces_per_kg` (1000 ÷ grams) or `kg_per_piece` (grams ÷ 1000) in the UI
8. **Currency** — all monetary values in EUR, formatted to configurable decimal places (default 2)

### Deletion Behavior
9. **RESTRICT pattern** — cannot delete qualities, articles, or deliveries that are referenced by existing sales
10. **CASCADE pattern** — deleting a sale automatically removes all its line items
11. **SET NULL pattern** — deleting a customer preserves their sales but nullifies the `customer_id` reference
12. **Soft delete pattern** — qualities use `is_active` flag; employees use `is_former` flag

### Loyalty
13. **Loyalty requires barcode** — loyalty processing only applies to customers who have a barcode assigned
14. **Tier lock** — customers keep their tier for 12 months after reaching it, even if turnover drops below the threshold
15. **Voucher deduplication** — `cycle_key` on `customer_vouchers` prevents issuing the same voucher rule twice per tier cycle
16. **Auto-processing** — after each sale finalization, the system automatically records the ledger entry, recalculates turnover, evaluates tier changes, and issues any earned vouchers

### Access Control
17. **Article last_sold_at** — automatically updated by database trigger whenever a sale line is inserted
18. **Demo users** are enforced at the database level (RLS policies check `is_demo()`) — not just UI restrictions
19. **Admin-only deletes** — hard deletes are restricted to admins at the database level via RLS

---

## Local Development Setup Guide

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Supabase account** ([supabase.com](https://supabase.com))
- **Git**

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd vaia-core

# 2. Install dependencies
npm install

# 3. Configure environment variables
#    Copy the example file and fill in your Supabase credentials
cp .env.example .env
#    Edit .env with your values:
#      VITE_SUPABASE_URL=https://your-project.supabase.co
#      VITE_SUPABASE_ANON_KEY=your-anon-key
#      SUPABASE_ACCESS_TOKEN=your-access-token (for CLI migrations)

# 4. Set up Supabase CLI and apply migrations
npx supabase init                                    # Creates supabase/ directory (already exists)
npx supabase link --project-ref <your-project-ref>   # Link to your Supabase project
npx supabase db push                                 # Apply all migrations to the remote database

# 5. Verify migration sync
npx supabase migration list

# 6. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### First-Time User Setup

After deploying the database, you'll need to:

1. Create an initial admin user through Supabase Auth dashboard
2. Insert a corresponding row in the `employees` table with `role = 'admin'`
3. Log in with the admin credentials
4. Use the Admin panel to create additional employees

---

## Key Folders and Files

```
vaia-core/
├── public/                           # Static assets served as-is
│   └── _redirects                    # Netlify SPA redirect rules
├── scripts/
│   └── sync-migrations.js           # Migration sync script for git hook
├── src/
│   ├── main.tsx                      # App entry point — React 19 createRoot
│   ├── App.tsx                       # Root component — routing, theme, auth gate
│   ├── App.css                       # Root layout styles
│   ├── index.css                     # Global CSS reset and base styles
│   │
│   ├── features/                     # Domain feature modules (13 total)
│   │   ├── admin/                    # Employee management & permissions (admin-only)
│   │   │   ├── components/           #   Admin, EmployeeDialog, EmployeeTable, PermissionsDialog
│   │   │   ├── hooks/                #   useAdmin, useEmployeeForm
│   │   │   ├── types.ts              #   EmployeeFormData, EmployeeFilters, PermissionsMap
│   │   │   └── index.ts
│   │   ├── articles/                 # Product catalog management
│   │   │   ├── components/           #   Articles, ArticleDialog, ArticleTable, ArticleFiltersBar
│   │   │   ├── hooks/                #   useArticles, useArticleForm
│   │   │   ├── utils/                #   validation.ts
│   │   │   ├── types.ts              #   Article, ArticleFormData, ArticleFilters
│   │   │   └── index.ts
│   │   ├── auth/                     # Login page & demo access
│   │   │   ├── components/           #   LoginPage (email+password form, demo button)
│   │   │   └── index.ts
│   │   ├── customers/                # Customer database & company data
│   │   │   ├── components/           #   Customers, CustomerDialog, CustomerTable, CustomerFiltersBar
│   │   │   ├── hooks/                #   useCustomers, useCustomerForm
│   │   │   ├── utils/                #   validation.ts
│   │   │   ├── types.ts              #   Customer, CustomerFormData, CustomerFilters
│   │   │   └── index.ts
│   │   ├── dashboard/                # Home dashboard with KPIs & alerts
│   │   │   ├── components/           #   Dashboard (KPI cards, recent sales, low stock alerts)
│   │   │   └── index.ts
│   │   ├── deliveries/               # Delivery management & import
│   │   │   ├── components/           #   Deliveries, DeliveryDialog, DeliveryTable, DeliveryDetail
│   │   │   ├── hooks/                #   useDeliveries, useDeliveryForm
│   │   │   ├── utils/                #   validation.ts, importDeliveries.ts, exportDeliveries.ts
│   │   │   ├── types.ts              #   Delivery, DeliveryFormData, DeliveryFilters
│   │   │   └── index.ts
│   │   ├── inventory/                # Stock monitoring (real + accounting)
│   │   │   ├── components/           #   Inventory, InventoryTable, InventoryFiltersBar, InventoryComparison
│   │   │   ├── hooks/                #   useInventory
│   │   │   ├── utils/                #   exportInventory.ts
│   │   │   ├── types.ts              #   InventoryItem, InventoryFilters, InventoryTab
│   │   │   └── index.ts
│   │   ├── loyalty/                  # Loyalty program (tiers, voucher rules, vouchers)
│   │   │   ├── components/           #   Loyalty, TiersConfig, VoucherRulesConfig, VouchersList
│   │   │   ├── hooks/                #   useLoyaltyConfig, useVouchers
│   │   │   ├── types.ts              #   LoyaltySection, TierFormData, VoucherRuleFormData
│   │   │   └── index.ts
│   │   ├── qualities/                # Product categories
│   │   │   ├── components/           #   Qualities, QualityDialog, QualityList, QualityBadge
│   │   │   ├── utils/                #   validation.ts
│   │   │   └── index.ts
│   │   ├── reports/                  # Report generation & export (CSV/Excel/PDF)
│   │   │   ├── components/           #   Reports, ReportsFiltersBar, ReportsSummary, ReportsTable
│   │   │   ├── hooks/                #   useReports
│   │   │   ├── utils/                #   exportUtils.ts, calculations.ts, formatters.ts
│   │   │   ├── types.ts              #   ReportType, ReportMode, ReportFilters, ReportData
│   │   │   └── index.ts
│   │   ├── sales/                    # POS / sales management
│   │   │   ├── components/           #   Sales, SaleEditor, SaleDetail, SalesTable, SaleLoyaltyPanel
│   │   │   ├── hooks/                #   useSales, useSaleForm, useSaleLines
│   │   │   ├── utils/                #   validation.ts, calculations.ts, saleNumberGenerator.ts
│   │   │   ├── types.ts              #   Sale, SaleLine, SaleFormData, SaleFilters
│   │   │   └── index.ts
│   │   ├── settings/                 # App configuration & data backup
│   │   │   ├── components/           #   Settings, SettingsSection
│   │   │   ├── hooks/                #   useSettings
│   │   │   ├── utils/                #   validation.ts
│   │   │   ├── types.ts              #   AppSettings, SettingsFormData
│   │   │   └── index.ts
│   │   └── statistics/               # Sales analytics & charts
│   │       ├── components/           #   Statistics, StatisticsFiltersBar, LoyaltyStatistics
│   │       ├── hooks/                #   useStatistics
│   │       ├── utils/                #   chartHelpers.ts
│   │       ├── types.ts              #   StatisticsTab, CostMode, StatisticsRow
│   │       └── index.ts
│   │
│   ├── lib/                          # Data layer
│   │   ├── api/                      # Supabase API functions (12 modules)
│   │   │   ├── articles.ts           #   getArticles, createArticle, updateArticle, deleteArticle
│   │   │   ├── backup.ts             #   exportAllData, importAllData (12 tables)
│   │   │   ├── customers.ts          #   getCustomers, createCustomer, updateCustomer, deleteCustomer
│   │   │   ├── deliveries.ts         #   getDeliveries, createDelivery, importDeliveries, getNextDisplayId
│   │   │   ├── documents.ts          #   getGdprDeclarationUrl, uploadGdprDeclaration
│   │   │   ├── employees.ts          #   getEmployees, createEmployee (Edge Fn), deleteEmployee (Edge Fn)
│   │   │   ├── inventory.ts          #   getInventory, getInventoryStats, getInventoryComparison
│   │   │   ├── loyalty.ts            #   getLoyaltyTiers, getVoucherRules, processLoyaltyAfterSale (RPC)
│   │   │   ├── qualities.ts          #   getQualities, createQuality, updateQuality, deleteQuality
│   │   │   ├── sales.ts              #   getSales, createSale, finalizeSale (RPC), generateSaleNumber (RPC)
│   │   │   ├── settings.ts           #   getSettings, updateSettings
│   │   │   └── index.ts              #   Re-exports all API modules
│   │   ├── hooks/                    # Shared data-fetching hooks
│   │   │   ├── useQualities.ts       #   Cached qualities list
│   │   │   ├── useArticles.ts        #   Articles data
│   │   │   └── useDeliveries.ts      #   Deliveries with filters
│   │   ├── supabase/
│   │   │   ├── client.ts             #   Supabase client instance (env vars + fallback)
│   │   │   └── types.ts              #   Auto-generated TypeScript types from DB schema
│   │   └── fonts/                    # Custom fonts for PDF generation
│   │
│   ├── shared/                       # Reusable UI components & utilities
│   │   ├── components/
│   │   │   ├── Layout/               #   App shell — header, nav tabs, content area, responsive menu
│   │   │   ├── Tabs/                 #   Navigation tab bar, TabId type, tabsConfig.ts
│   │   │   ├── Logo/                 #   VAIA Core branding logo
│   │   │   ├── ConfirmDialog/        #   Modal for dangerous actions (danger/warning/info/success)
│   │   │   ├── Toast/                #   Toast notifications (success/error/warning/info, auto-dismiss)
│   │   │   └── DataCards/            #   Reusable KPI card grid
│   │   ├── context/
│   │   │   └── AuthContext.tsx        #   Authentication state, permissions, role checks
│   │   └── utils/
│   │       └── storage.ts            #   localStorage helpers with Date serialization
│   │
│   └── styles/
│       ├── index.css                 # Global style imports
│       ├── buttons.css               # Shared button styles
│       ├── components.css            # Shared component styles
│       └── theme.ts                  # Theme colors (VAIA blue #0B4F8A, Core orange #FF7A00, dark/light)
│
├── supabase/
│   ├── config.toml                   # Supabase CLI configuration
│   ├── functions/
│   │   └── delete-employee/          # Edge Function: delete employee (Auth + DB record)
│   └── migrations/                   # 39 SQL migration files (chronological)
│       ├── 20260204..._create_qualities_table.sql
│       ├── 20260204..._create_articles_table.sql
│       ├── 20260204..._create_deliveries_table.sql
│       ├── 20260204..._create_sales_table.sql
│       ├── 20260204..._create_sale_lines_table.sql
│       ├── 20260204..._create_settings_table.sql
│       ├── 20260204..._create_inventory_views.sql
│       ├── 20260204..._create_sales_summary_view.sql
│       ├── 20260204..._enable_rls_policies.sql
│       ├── 20260204..._create_helper_functions.sql
│       ├── ...                       # 29 more migration files
│       └── 20260219..._create_documents_bucket.sql
│
├── .env.example                      # Environment variable template
├── eslint.config.js                  # ESLint 9 flat config
├── index.html                        # SPA entry HTML
├── netlify.toml                      # Netlify deployment config (SPA redirect)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript base config
├── tsconfig.app.json                 # App-specific TS config (strict, ES2022, react-jsx)
├── tsconfig.node.json                # Node/Vite TS config
└── vite.config.ts                    # Vite config (React plugin, SPA mode)
```

---

## Migration Workflow

All database changes are managed through Supabase CLI migration files, tracked in Git, and auto-synced via a Husky pre-commit hook.

### Creating a New Migration

```bash
# 1. Create a timestamped migration file
npx supabase migration new <migration_name>
# Creates: supabase/migrations/YYYYMMDDHHMMSS_<migration_name>.sql

# 2. Write your SQL in the generated file
# Example: CREATE TABLE, ALTER TABLE, CREATE POLICY, etc.

# 3. Commit — the pre-commit hook auto-runs `npx supabase db push`
git add supabase/migrations/
git commit -m "feat: add new table"
# Automatically: detects migration files → applies to remote → blocks commit on failure
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npx supabase migration list` | View all migrations (local vs. remote status) |
| `npx supabase db diff` | Compare local schema vs. remote |
| `npx supabase db push` | Apply new migrations to remote database |
| `npx supabase db push --dry-run` | Preview changes without applying |
| `npx supabase gen types typescript` | Regenerate TypeScript types from DB schema |
| `npm run check-migrations` | Run migration sync script manually |

### Rules

- **Never use Supabase Dashboard SQL Editor** — it breaks sync with local migration files
- **Always use `npx supabase migration new`** — ensures proper timestamped filenames
- **Always commit migration files** — keeps history in `supabase/migrations/`
- **Use `npx` prefix** — global Supabase CLI installation is not supported

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `SUPABASE_ACCESS_TOKEN` | For CLI | Personal access token for Supabase CLI operations ([get one here](https://supabase.com/dashboard/account/tokens)) |

Copy `.env.example` to `.env` and fill in your values. The `.env` file is git-ignored.

> **Note:** The Supabase client has a hardcoded fallback for development convenience. For production, always set proper environment variables.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start Vite dev server with HMR at `http://localhost:5173` |
| **build** | `npm run build` | TypeScript type-check (`tsc -b`) + Vite production build to `dist/` |
| **lint** | `npm run lint` | Run ESLint with React hooks rules |
| **preview** | `npm run preview` | Preview the production build locally |
| **prepare** | `npm run prepare` | Set up Husky git hooks (runs automatically on `npm install`) |
| **check-migrations** | `npm run check-migrations` | Manually run the migration sync script |

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build Tool | Vite | 7.2 |
| Backend/DB | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| PDF Export | pdfmake | 0.3 |
| Excel/CSV | SheetJS (xlsx) | 0.18 |
| Linting | ESLint | 9.39 |
| Git Hooks | Husky | 9.1 |
| Hosting | Netlify | — |
