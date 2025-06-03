-- ============================================================================
-- FINAL UPDATES SEED DATA
-- Update statistics and calculated fields based on seeded data
-- ============================================================================

-- ============================================================================
-- UPDATE FARMER STATISTICS
-- ============================================================================

-- Update farmer statistics based on orders
UPDATE farmers SET 
    total_sales = (
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id 
        WHERE oi.farmer_id = farmers.user_id 
        AND o.payment_status = 'completed'
    );

-- ============================================================================
-- UPDATE BUYER STATISTICS
-- ============================================================================

-- Update buyer statistics based on orders
UPDATE buyers SET 
    total_spent = (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM orders o 
        WHERE o.buyer_id = buyers.user_id 
        AND o.payment_status = 'completed'
    ),
    total_orders = (
        SELECT COUNT(*)
        FROM orders o 
        WHERE o.buyer_id = buyers.user_id 
        AND o.status != 'cancelled'
    ),
    loyalty_points = (
        SELECT COALESCE(FLOOR(SUM(o.total_amount)), 0)
        FROM orders o 
        WHERE o.buyer_id = buyers.user_id 
        AND o.payment_status = 'completed'
    );

-- ============================================================================
-- UPDATE PRODUCT STATISTICS
-- ============================================================================

-- Update product order counts
UPDATE products SET 
    order_count = (
        SELECT COALESCE(SUM(oi.quantity), 0)
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id 
        WHERE oi.product_id = products.id 
        AND o.payment_status = 'completed'
    );
