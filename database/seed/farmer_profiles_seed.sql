-- ============================================================================
-- FARMER PROFILES SEED DATA
-- Farmer-specific profile information
-- ============================================================================

-- Farmer profiles integrated from farmers.js and existing data
INSERT INTO farmers (user_id, farm_name, farm_address, farm_description, established_year, total_sales, is_verified) VALUES
('f1000000-0000-0000-0000-000000000001', 'Golden Rice Farm', '123 Organic Valley, Chiang Mai 50200', 'Traditional organic rice farm in Northern Thailand specializing in premium jasmine and brown rice varieties.', 2015, 53.00, true),
('f2000000-0000-0000-0000-000000000002', 'Fresh Greens Farm', '456 Green Valley, Nakhon Pathom 73000', 'Modern vegetable farm focusing on organic lettuce, tomatoes, and fresh herbs using sustainable growing methods.', 2018, 91.00, true),
('550e8400-e29b-41d4-a716-446655440003', 'Johnson Rice Fields', '789 Rice Field Rd, Stockton, CA 95202', 'Traditional rice farming operation growing premium short and long grain rice varieties. Sustainable water management practices.', 1998, 78000.00, true),
('550e8400-e29b-41d4-a716-446655440004', 'Kim''s Herb Garden', '321 Herb Lane, Modesto, CA 95351', 'Specialized herb and spice cultivation. Growing over 30 varieties of culinary and medicinal herbs using organic methods.', 2015, 18000.00, true),
('550e8400-e29b-41d4-a716-446655440005', 'Martinez Citrus Grove', '654 Citrus Ave, Bakersfield, CA 93301', 'Third-generation citrus farm producing oranges, lemons, and grapefruits. Known for exceptional fruit quality and sustainable practices.', 1987, 95000.00, true);
