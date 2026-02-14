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
12. `20260206214312_create_employees_and_permissions.sql` - Creates employees and permissions tables
13. `20260207_add_demo_role_and_rls.sql` - Adds demo role and RLS policies
14. `20260207_add_margin_to_sales_summary.sql` - Adds margin calculations to sales summary
15. `20260207_add_no_cash_payment_method.sql` - Adds 'no_cash' payment method
16. `20260207_add_revenue_to_inventory.sql` - Adds revenue tracking to inventory views
17. `20260208_restrict_delete_to_admin.sql` - Restricts delete operations to admins only
18. `20260209_add_statistics_to_permissions.sql` - Adds statistics tab to permission system
19. `20260211_create_customers_table.sql` - Creates customers table with GDPR support
20. `20260212_add_customer_to_sales.sql` - Adds customer_id to sales table
21. `20260214_create_loyalty_tiers.sql` - Creates loyalty tiers table
22. `20260214_add_color_to_loyalty_tiers.sql` - Adds color field to loyalty tiers
23. `20260214_create_customer_loyalty_status.sql` - Creates customer loyalty status table
24. `20260214_create_loyalty_ledger.sql` - Creates loyalty transaction ledger
25. `20260214_create_customer_vouchers.sql` - Creates customer vouchers table
26. `20260214_create_voucher_rules.sql` - Creates voucher rules table
27. `20260214_create_loyalty_rpc_functions.sql` - Creates loyalty RPC functions
28. `20260214_create_loyalty_stats_rpcs.sql` - Creates loyalty statistics RPC functions
29. `20260214_alter_sales_loyalty_fields.sql` - Adds loyalty fields to sales table
30. `20260214_update_sales_summary_loyalty.sql` - Updates sales summary with loyalty data
31. `20260214_add_loyalty_to_permissions.sql` - Adds loyalty tab to permissions
32. **`20260214_loyalty_only_with_barcode.sql`** - ⭐ **ВАЖНО: Автоматично управление - клиенти участват в програмата за лоялност САМО ако имат баркод**

## Important Notes

### Loyalty Program (Migration #32)

**Правило: Клиент участва в програмата за лоялност САМО ако има баркод**

- **Автоматично добавяне**: При създаване на клиент с баркод → автоматично се създава `customer_loyalty_status` със стартово ниво
- **Автоматично премахване**: Премахване на баркод от клиент → автоматично се изтрива `customer_loyalty_status`
- **Прозрачност**: UI показва ясни индикации кои клиенти участват/не участват
- **Функции**: `ensure_customer_loyalty_status()`, `get_customer_loyalty_info()`, `process_loyalty_after_sale()` проверяват за баркод преди обработка
- **Тригер**: `auto_manage_customer_loyalty_trigger` автоматично управлява статуса при INSERT/UPDATE на `customers.barcode`

## Syncing Migrations

To download latest migrations from Supabase:

```sql
SELECT version, name, statements 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

Then save each migration as a separate SQL file in this directory.
