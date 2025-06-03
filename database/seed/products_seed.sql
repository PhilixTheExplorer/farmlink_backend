-- ============================================================================
-- PRODUCTS SEED DATA
-- Sample products integrated from products.js and existing data
-- ============================================================================

-- ============================================================================
-- PHILIX HEIN'S GOLDEN RICE FARM PRODUCTS (from JS data)
-- ============================================================================

INSERT INTO products (id, farmer_id, title, description, price, category, quantity, unit, min_order_quantity, image_url, status, order_count, created_at, updated_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'f1000000-0000-0000-0000-000000000001', 'Premium Jasmine Rice', 'Organic jasmine rice grown using traditional methods. Known for its fragrant aroma and perfect texture.', 45.00, 'rice', 500, 'kg', 1, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', 'available', 23, '2024-01-15T00:00:00.000Z', '2024-05-15T00:00:00.000Z'),
('650e8400-e29b-41d4-a716-446655440002', 'f1000000-0000-0000-0000-000000000001', 'Brown Rice', 'Healthy whole grain brown rice packed with nutrients and fiber.', 38.50, 'rice', 300, 'kg', 1, 'https://images.unsplash.com/photo-1594736797933-d0ac6c9e6e00?w=400&h=300&fit=crop', 'available', 15, '2024-02-01T00:00:00.000Z', '2024-05-20T00:00:00.000Z'),
('650e8400-e29b-41d4-a716-446655440006', 'f1000000-0000-0000-0000-000000000001', 'Organic Mangoes', 'Sweet and juicy organic mangoes, hand-picked at perfect ripeness.', 120.00, 'fruits', 100, 'kg', 1, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=300&fit=crop', 'available', 31, '2024-04-15T00:00:00.000Z', '2024-05-30T00:00:00.000Z');

-- ============================================================================
-- AME SIRI'S FRESH GREENS FARM PRODUCTS (from JS data)
-- ============================================================================

INSERT INTO products (id, farmer_id, title, description, price, category, quantity, unit, min_order_quantity, image_url, status, order_count, created_at, updated_at) VALUES
('650e8400-e29b-41d4-a716-446655440003', 'f2000000-0000-0000-0000-000000000002', 'Fresh Organic Lettuce', 'Crispy and fresh organic lettuce, perfect for salads and sandwiches.', 25.00, 'vegetables', 50, 'pack', 1, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', 'available', 42, '2024-03-10T00:00:00.000Z', '2024-05-25T00:00:00.000Z'),
('650e8400-e29b-41d4-a716-446655440004', 'f2000000-0000-0000-0000-000000000002', 'Cherry Tomatoes', 'Sweet and juicy cherry tomatoes, perfect for snacking or cooking.', 35.00, 'vegetables', 80, 'pack', 1, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop', 'available', 38, '2024-03-15T00:00:00.000Z', '2024-05-28T00:00:00.000Z'),
('650e8400-e29b-41d4-a716-446655440005', 'f2000000-0000-0000-0000-000000000002', 'Fresh Basil', 'Aromatic fresh basil leaves, perfect for Thai cuisine and Italian dishes.', 15.00, 'herbs', 30, 'bunch', 1, 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400&h=300&fit=crop', 'available', 19, '2024-04-01T00:00:00.000Z', '2024-05-29T00:00:00.000Z'),
('650e8400-e29b-41d4-a716-446655440007', 'f2000000-0000-0000-0000-000000000002', 'Farm Fresh Eggs', 'Free-range chicken eggs from happy hens, rich in nutrients.', 8.50, 'dairy', 0, 'dozen', 1, 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400&h=300&fit=crop', 'outOfStock', 67, '2024-02-20T00:00:00.000Z', '2024-05-28T00:00:00.000Z');

-- ============================================================================
-- ADDITIONAL PRODUCTS FROM EXISTING FARMERS
-- ============================================================================

-- Johnson Rice Fields products
INSERT INTO products (id, farmer_id, title, description, price, category, quantity, unit, min_order_quantity, image_url, status, order_count) VALUES
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Premium Short Grain Rice', 'High-quality short grain rice perfect for sushi and Asian cuisine. Grown using sustainable water management.', 6.99, 'rice', 300, 'kg', 5, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400', 'available', 22),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Long Grain White Rice', 'Classic long grain white rice for everyday cooking. Fluffy texture and neutral flavor.', 4.50, 'rice', 500, 'kg', 10, 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=400', 'available', 45),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'Brown Rice', 'Nutritious whole grain brown rice. Higher in fiber and nutrients than white rice.', 5.99, 'rice', 200, 'kg', 5, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', 'available', 18);

-- Kim's Herb Garden products
INSERT INTO products (id, farmer_id, title, description, price, category, quantity, unit, min_order_quantity, image_url, status, order_count) VALUES
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Fresh Rosemary', 'Aromatic fresh rosemary perfect for cooking and seasoning. Grown organically.', 3.99, 'herbs', 40, 'bunch', 1, 'https://images.unsplash.com/photo-1465297034512-555f8c5c1b11?w=400', 'available', 8),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'Organic Oregano', 'Fresh organic oregano with intense flavor. Essential for Italian and Mediterranean cooking.', 3.50, 'herbs', 35, 'bunch', 1, 'https://images.unsplash.com/photo-1628270717899-36a12d6d6451?w=400', 'available', 5),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', 'Fresh Thyme', 'Delicate fresh thyme leaves perfect for seasoning meats and vegetables.', 4.25, 'herbs', 30, 'bunch', 1, 'https://images.unsplash.com/photo-1594736797933-d0ac6c9e6e00?w=400', 'available', 3);

-- Martinez Citrus Grove products
INSERT INTO products (id, farmer_id, title, description, price, category, quantity, unit, min_order_quantity, image_url, status, order_count) VALUES
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Navel Oranges', 'Sweet, juicy navel oranges perfect for eating fresh or juicing. Grown in sunny California.', 3.99, 'fruits', 250, 'kg', 2, 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400', 'available', 35),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'Meyer Lemons', 'Sweet Meyer lemons with thin skin and unique flavor. Perfect for cooking and cocktails.', 5.50, 'fruits', 180, 'kg', 1, 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400', 'available', 28),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440005', 'Ruby Red Grapefruit', 'Large, sweet ruby red grapefruit with beautiful pink flesh. Great for breakfast.', 4.75, 'fruits', 120, 'kg', 2, 'https://images.unsplash.com/photo-1587132677089-3d9a1b8ded17?w=400', 'available', 19),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440005', 'Mixed Citrus Box', 'Variety box containing oranges, lemons, and grapefruits. Perfect for families.', 25.00, 'fruits', 50, 'box', 1, 'https://images.unsplash.com/photo-1557844352-761f2565b576?w=400', 'available', 12);
