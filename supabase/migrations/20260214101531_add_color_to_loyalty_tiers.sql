-- Add color column to loyalty_tiers table
-- Created: 2026-02-14

ALTER TABLE loyalty_tiers 
ADD COLUMN color TEXT NOT NULL DEFAULT '#6B7280';

-- Update existing tiers with nice colors
UPDATE loyalty_tiers SET color = '#10B981' WHERE name = 'START';   -- Green
UPDATE loyalty_tiers SET color = '#9CA3AF' WHERE name = 'SILVER';  -- Silver
UPDATE loyalty_tiers SET color = '#F59E0B' WHERE name = 'GOLD';    -- Gold
UPDATE loyalty_tiers SET color = '#8B5CF6' WHERE name = 'VIP';     -- Purple
UPDATE loyalty_tiers SET color = '#EF4444' WHERE name = 'ELITE';   -- Red

COMMENT ON COLUMN loyalty_tiers.color IS 'Hex color code for tier badge display';
