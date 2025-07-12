-- Create admin user for testing (replace with your actual auth user ID)
-- First, let's check if there are any existing users
INSERT INTO users (id, name, email, phone, role, status) VALUES 
('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', '+254700000000', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET role = 'admin';