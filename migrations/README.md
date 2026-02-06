# Database Migrations

This directory contains SQL migration files downloaded from the Supabase database.

## Migration Files

Migrations are named with the format: `{timestamp}_{description}.sql`

Each migration corresponds to a record in the `supabase_migrations.schema_migrations` table.

## Applying Migrations

These migrations have already been applied to the production Supabase database. They are stored here for:
- Version control and history tracking
- Documentation of database schema evolution
- Ability to recreate the schema in a new environment
- Reference for understanding the data model

## Migration Order

Migrations must be applied in chronological order (by timestamp):

1. `20260204193044_create_qualities_table.sql` - Creates qualities table and update trigger
2. `20260204193111_create_articles_table.sql` - Creates articles table
3. `20260204193130_create_deliveries_table.sql` - Creates deliveries table
4. `20260204193141_create_sales_table.sql` - Creates sales header table with enums
5. `20260204193155_create_sale_lines_table.sql` - Creates sale_lines table
6. `20260204193216_create_settings_table.sql` - Creates app_settings singleton table
7. `20260204193236_create_inventory_views.sql` - Creates inventory calculation views
8. `20260204193309_create_sales_summary_view.sql` - Creates sales summary views
9. `20260204193320_enable_rls_policies.sql` - Enables RLS with open policies (dev mode)
10. `20260204193337_create_helper_functions.sql` - Creates helper functions and triggers
11. `20260204193905_fix_security_issues.sql` - Fixes security invoker for views and functions

## Syncing Migrations

To download latest migrations from Supabase:

```sql
SELECT version, name, statements 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

Then save each migration as a separate SQL file in this directory.
