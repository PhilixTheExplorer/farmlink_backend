-- ============================================================================
-- USERS SEED DATA
-- Sample user accounts for farmers and buyers
-- ============================================================================

-- Note: Password hashes are for 'password123' using bcrypt
-- In production, always use proper password hashing

-- ============================================================================
-- SAMPLE FARMERS (USERS)
-- ============================================================================

-- Insert sample farmers (integrated from farmers.js)
INSERT INTO users (id, email, password_hash, name, phone, location, role, profile_image_url) VALUES
('f1000000-0000-0000-0000-000000000001', 'philix@farmlink.th', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Philix Hein', '+66 81 234 5678', 'Chiang Mai', 'farmer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('f2000000-0000-0000-0000-000000000002', 'ame@farmlink.th', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Ame Siri', '+66 82 345 6789', 'Nakhon Pathom', 'farmer', NULL),
('550e8400-e29b-41d4-a716-446655440003', 'robert.johnson@farmlink.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Robert Johnson', '+1-555-0103', 'Stockton, California', 'farmer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('550e8400-e29b-41d4-a716-446655440004', 'sarah.kim@farmlink.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Sarah Kim', '+1-555-0104', 'Modesto, California', 'farmer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
('550e8400-e29b-41d4-a716-446655440005', 'david.martinez@farmlink.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'David Martinez', '+1-555-0105', 'Bakersfield, California', 'farmer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');

-- ============================================================================
-- SAMPLE BUYERS (USERS)
-- ============================================================================

-- Insert sample buyers (integrated from buyers.js)
INSERT INTO users (id, email, password_hash, name, phone, location, role, profile_image_url) VALUES
('b1000000-0000-0000-0000-000000000001', 'emma@email.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Emma Johnson', '+66 91 234 5678', 'Bangkok', 'buyer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('b2000000-0000-0000-0000-000000000002', 'farm@email.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Linky Linky', '+66 92 345 6789', 'Bangkok', 'buyer', NULL),
('b3000000-0000-0000-0000-000000000003', 'alex@email.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Alex Chen', '+66 93 456 7890', 'Bangkok', 'buyer', NULL),
('550e8400-e29b-41d4-a716-446655440013', 'james.miller@email.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'James Miller', '+1-555-0204', 'Sacramento, California', 'buyer', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
('550e8400-e29b-41d4-a716-446655440014', 'jennifer.garcia@email.com', '$2b$10$rOvHI4S9Qs1YQgp1XkyZkeCBVQcFOqrk9Z1g9X5VK8YQD8oHwLjGG', 'Jennifer Garcia', '+1-555-0205', 'Oakland, California', 'buyer', 'https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=150');
