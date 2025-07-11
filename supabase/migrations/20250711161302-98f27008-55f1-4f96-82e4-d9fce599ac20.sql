-- Clear existing plans and add new ones as requested
DELETE FROM plans;

-- Insert Hourly Plans
INSERT INTO plans (name, price_kes, speed_limit_mbps, validity_days, description, is_active) VALUES
('1 Hour Plan', 5, 5, 0, '1 hour internet access at 5 Mbps', true),
('3 Hours Plan', 10, 5, 0, '3 hours internet access at 5 Mbps', true),
('6 Hours Plan', 20, 10, 0, '6 hours internet access at 10 Mbps', true),
('12 Hours Plan', 30, 10, 0, '12 hours internet access at 10 Mbps', true);

-- Insert Weekly Plans
INSERT INTO plans (name, price_kes, speed_limit_mbps, validity_days, description, is_active) VALUES
('Weekly 1 Device', 150, 20, 7, '1 week unlimited internet for 1 device', true),
('Weekly 2 Devices', 200, 20, 7, '1 week unlimited internet for 2 devices', true);

-- Insert Monthly Plans  
INSERT INTO plans (name, price_kes, speed_limit_mbps, validity_days, description, is_active) VALUES
('Monthly 1 Device', 500, 100, 30, '1 month unlimited internet for 1 device', true),
('Monthly 2 Devices', 700, 100, 30, '1 month unlimited internet for 2 devices', true);