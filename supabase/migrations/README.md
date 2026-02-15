# Database Migrations

This directory contains SQL migration files managed via Supabase CLI.

## CLI Workflow (REQUIRED)

**Always use Supabase CLI** to ensure zero divergence between local and remote migrations:

### Creating a New Migration

```bash
# 1. Create new migration file
npx supabase migration new <migration_name>

# 2. Edit the generated file in supabase/migrations/ directory
# Example: supabase/migrations/20260215120000_add_feature.sql

# 3. Apply migration to remote database
npx supabase db push

# 4. Commit the migration file to git
git add supabase/migrations/
git commit -m "feat: add feature migration"
```

### Useful Commands

```bash
# View all migrations (local vs remote)
npx supabase migration list

# Compare local vs remote schema
npx supabase db diff

# Repair migration history (if needed)
npx supabase migration repair --status applied <version>

# Generate TypeScript types from database
npx supabase gen types typescript
```

## Migration Format

Migrations are named with the format: `{timestamp}_{description}.sql`
- Timestamp: `YYYYMMDDHHMMSS` (14 digits)
- Example: `20260215120000_add_loyalty_program.sql`

Each migration corresponds to a record in the `supabase_migrations.schema_migrations` table.

## Important Rules

- ✅ **Always use Supabase CLI** - Ensures proper migration tracking
- ✅ **Commit migrations to git** - Keep version history
- ✅ **Run `npx supabase db push`** - Apply to remote after creating migration
- ❌ **Never use Supabase Dashboard SQL Editor** - Breaks sync with local files
- ❌ **Never manually edit migration history** - Use CLI repair commands

## Setup (One-time)

If setting up on a new machine:

```bash
# 1. Initialize Supabase project
npx supabase init

# 2. Link to remote project
npx supabase link --project-ref ptigdekgzraimaepgczt

# 3. Verify sync
npx supabase migration list
```

## Migration History

All migrations have been applied to the production Supabase database:

1. `20260204193044_create_qualities_table.sql` - Creates qualities table and update trigger
2. `20260204193111_create_articles_table.sql` - Creates articles table
3. `20260204193130_create_deliveries_table.sql` - Creates deliveries table
4. `20260204193141_create_sales_table.sql` - Creates sales header table with enums
5. `20260204193155_create_sale_lines_table.sql` - Creates sale_lines table
6. `20260204193216_create_settings_table.sql` - Creates app_settings singleton table
7. `20260204193236_create_inventory_views.sql` - Creates inventory calculation views
8. `20260204193309_create_sales_summary_view.sql` - Creates sales summary views
9. `20260204193320_enable_rls_policies.sql` - Enables RLS with open policies
10. `20260204193337_create_helper_functions.sql` - Creates helper functions and triggers
11. `20260204193905_fix_security_issues.sql` - Fixes security invoker for views and functions
12. `20260206214312_create_employees_and_permissions.sql` - Creates employees and permissions tables
13. `20260207155327_add_demo_role_and_rls.sql` - Adds demo role and RLS policies
14. `20260207181358_add_margin_to_sales_summary.sql` - Adds margin calculations to sales summary
15. `20260207184407_add_no_cash_payment_method.sql` - Adds 'no_cash' payment method
16. `20260207190239_add_revenue_to_inventory.sql` - Adds revenue tracking to inventory views
17. `20260208122453_restrict_delete_to_admin.sql` - Restricts delete operations to admins only
18. `20260209184134_add_statistics_to_permissions.sql` - Adds statistics tab to permission system
19. `20260211174240_create_customers_table.sql` - Creates customers table with GDPR support
20. `20260212140650_add_customer_to_sales.sql` - Adds customer_id to sales table
21. `20260214101531_add_color_to_loyalty_tiers.sql` - Adds color field to loyalty tiers
22. `20260214101554_add_loyalty_to_permissions.sql` - Adds loyalty tab to permissions
23. `20260214101609_alter_sales_loyalty_fields.sql` - Adds voucher and loyalty fields to sales
24. `20260214101749_create_customer_loyalty_status.sql` - Creates customer loyalty status table
25. `20260214101806_create_customer_vouchers.sql` - Creates customer vouchers table
26. `20260214101825_create_loyalty_ledger.sql` - Creates loyalty transaction ledger
27. `20260214101842_create_loyalty_rpc_functions.sql` - Creates loyalty RPC functions
28. `20260214101853_create_loyalty_stats_rpcs.sql` - Creates loyalty statistics RPCs
29. `20260214101934_create_loyalty_tiers.sql` - Creates loyalty tiers table
30. `20260214153821_create_voucher_rules.sql` - Creates voucher rules table
31. `20260214155338_fix_missing_vouchers.sql` - Fixes missing voucher handling
32. `20260214162751_fix_process_loyalty_function.sql` - Fixes loyalty processing logic
33. `20260214172107_loyalty_only_with_barcode.sql` - Restricts loyalty to customers with barcodes
34. `20260214173047_update_sales_summary_loyalty.sql` - Updates sales summary with loyalty data
35. `20260215063314_fix_finalize_sale_voucher_redeem.sql` - Fixes voucher redemption in finalize_sale
36. `20260215075118_fix_profit_with_discounts.sql` - Fixes profit calculations with discounts

## Troubleshooting

If you see "migration history does not match" errors:

1. Check remote history: `npx supabase migration list`
2. If migrations are in remote but not local: Migration files are incomplete
3. If migrations are in local but not remote: Run `npx supabase db push`
4. If versions don't match: Use `npx supabase migration repair --status applied <version>`
