-- ============================================================================
-- MASTER SEED FILE
-- Executes all seed files in the correct order
-- ============================================================================

-- Note: This file is designed to be run after the schema has been created
-- Run this file using: psql -d your_database -f master_seed.sql

-- ============================================================================
-- EXECUTE SEED FILES IN ORDER
-- ============================================================================

-- 1. Users (must be first as other tables reference users)
\i 'users_seed.sql'

-- 2. Farmer profiles (depends on users)
\i 'farmer_profiles_seed.sql'

-- 3. Buyer profiles (depends on users)
\i 'buyer_profiles_seed.sql'

-- 4. Products (depends on farmers/users)
\i 'products_seed.sql'

-- 5. Cart items (depends on users and products)
\i 'cart_items_seed.sql'

-- 6. Orders and order items (depends on users and products)
\i 'orders_seed.sql'

-- 7. Final updates (must be last to calculate correct statistics)
\i 'final_updates_seed.sql'

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Seed data has been successfully loaded!' as status;
