-- ============================================================================
-- BUYER PROFILES SEED DATA
-- Buyer-specific profile information
-- ============================================================================

-- Buyer profiles integrated from buyers.js and existing data
INSERT INTO buyers (user_id, delivery_address, delivery_instructions, total_spent, total_orders, loyalty_points, preferred_payment_methods) VALUES
('b1000000-0000-0000-0000-000000000001', '123 Sukhumvit Road, Bangkok 10110', 'Please call before delivery. Building security required.', 590.00, 3, 59, ARRAY['credit_card', 'promptpay']::payment_method[]),
('b2000000-0000-0000-0000-000000000002', '456 Rama IV Road, Bangkok 10500', 'Leave with front desk if not available.', 245.00, 1, 25, ARRAY['bank_transfer', 'mobile_banking']::payment_method[]),
('b3000000-0000-0000-0000-000000000003', '789 Sathorn Road, Bangkok 10120', 'New customer - no previous orders yet.', 0.00, 0, 0, ARRAY['credit_card', 'cash_on_delivery']::payment_method[]),
('550e8400-e29b-41d4-a716-446655440013', '123 Capitol Ave, Sacramento, CA 95814', 'Please call before delivery. Gate code: 1234', 2100.00, 25, 210, ARRAY['credit_card', 'qr_code_payment', 'promptpay']::payment_method[]),
('550e8400-e29b-41d4-a716-446655440014', '456 Broadway, Oakland, CA 94607', 'Side entrance preferred. Dog friendly.', 450.80, 7, 45, ARRAY['cash_on_delivery', 'mobile_banking']::payment_method[]);
