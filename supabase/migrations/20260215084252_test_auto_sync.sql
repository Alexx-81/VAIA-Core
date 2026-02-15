-- Test migration to demonstrate automatic pre-commit sync
-- This migration will be automatically pushed to Supabase when committed

-- Example: Add a comment to test table (no actual changes)
COMMENT ON TABLE qualities IS 'Product quality categories - updated via auto-sync test';
