-- Create a default admin user 
-- This will create an admin user that can access the admin dashboard

INSERT INTO public.users (id, name, email, phone, role, status) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Admin PrimeBill',
  'admin@primebill.com',
  '+254700000000',
  'admin',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;