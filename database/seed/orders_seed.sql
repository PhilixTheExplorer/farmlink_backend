-- ============================================================================
-- ORDERS SEED DATA
-- Sample orders and order items for testing order functionality
-- ============================================================================

-- ============================================================================
-- SAMPLE COMPLETED ORDERS
-- ============================================================================

-- Sample completed orders
INSERT INTO orders (id, buyer_id, order_number, total_amount, subtotal, delivery_fee, delivery_address, payment_method, payment_status, status, notes) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 'FL20240601-1001', 28.47, 26.47, 2.00, '1234 Sunset Blvd, Los Angeles, CA 90026', 'credit_card', 'completed', 'delivered', 'Great quality products. Fast delivery!'),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014', 'FL20240602-1002', 147.96, 142.96, 5.00, '567 Market St, San Francisco, CA 94102', 'bank_transfer', 'completed', 'delivered', 'Perfect for my weekly meal prep.'),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440013', 'FL20240603-1003', 36.95, 34.95, 2.00, '890 Beach Dr, San Diego, CA 92109', 'bank_transfer', 'completed', 'out_for_delivery', 'Looking forward to fresh orange juice!');

-- ============================================================================
-- ORDER ITEMS FOR COMPLETED ORDERS
-- ============================================================================

-- Order items for completed orders
INSERT INTO order_items (order_id, product_id, farmer_id, product_title, quantity, unit_price, subtotal) VALUES
-- Order 1 items
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Organic Roma Tomatoes', 2, 4.99, 9.98),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Organic Strawberries', 1, 8.99, 8.99),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Fresh Basil', 2, 3.99, 7.98),

-- Order 2 items  
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Premium Jasmine Rice', 10, 12.99, 129.90),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'Mixed Salad Greens', 2, 5.99, 11.98);
