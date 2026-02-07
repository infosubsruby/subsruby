
-- Seed data for subscription_plans
-- Based on update-regional-plans/index.ts

INSERT INTO public.subscription_plans (service_name, plan_name, price, currency) VALUES
-- NETFLIX
('Netflix', 'Standard', 15.49, 'USD'),
('Netflix', 'Standart', 229.99, 'TRY'),
('Netflix', 'Standard', 13.99, 'EUR'),
('Netflix', 'Standard', 10.99, 'GBP'),
('Netflix', 'Standard', 16.49, 'CAD'),
('Netflix', 'Estándar', 219.00, 'MXN'),
('Netflix', 'Standard', 16.99, 'AUD'),
('Netflix', 'Standard', 1490, 'JPY'),
('Netflix', 'Standard', 499, 'INR'),
('Netflix', 'Padrão', 44.90, 'BRL'),

-- YOUTUBE PREMIUM
('YouTube Premium', 'Premium', 13.99, 'USD'),
('YouTube Premium', 'Premium', 57.99, 'TRY'),
('YouTube Premium', 'Premium', 12.99, 'EUR'),
('YouTube Premium', 'Premium', 12.99, 'GBP'),
('YouTube Premium', 'Premium', 12.99, 'CAD'),
('YouTube Premium', 'Premium', 139.00, 'MXN'),
('YouTube Premium', 'Premium', 16.99, 'AUD'),
('YouTube Premium', 'Premium', 1280, 'JPY'),
('YouTube Premium', 'Premium', 129.00, 'INR'),
('YouTube Premium', 'Premium', 24.90, 'BRL'),

-- DISNEY+
('Disney+', 'Premium', 13.99, 'USD'),
('Disney+', 'Standart', 134.99, 'TRY'),
('Disney+', 'Standard', 8.99, 'EUR'),
('Disney+', 'Standard', 7.99, 'GBP'),
('Disney+', 'Standard', 11.99, 'CAD'),
('Disney+', 'Standard', 13.99, 'AUD'),

-- AMAZON PRIME
('Amazon Prime', 'Monthly', 14.99, 'USD'),
('Amazon Prime', 'Aylık', 39.00, 'TRY'),
('Amazon Prime', 'Monthly', 8.99, 'EUR'),
('Amazon Prime', 'Monthly', 8.99, 'GBP'),
('Amazon Prime', 'Monthly', 9.99, 'CAD'),
('Amazon Prime', 'Mensual', 99.00, 'MXN'),
('Amazon Prime', 'Monthly', 9.99, 'AUD'),
('Amazon Prime', 'Monthly', 600, 'JPY'),
('Amazon Prime', 'Monthly', 299, 'INR'),
('Amazon Prime', 'Mensal', 19.90, 'BRL'),

-- SPOTIFY
('Spotify', 'Individual', 11.99, 'USD'),
('Spotify', 'Bireysel', 59.99, 'TRY'),
('Spotify', 'Individual', 10.99, 'EUR'),
('Spotify', 'Individual', 11.99, 'GBP'),
('Spotify', 'Individual', 10.99, 'CAD'),
('Spotify', 'Individual', 129.00, 'MXN'),
('Spotify', 'Individual', 13.99, 'AUD'),
('Spotify', 'Individual', 980, 'JPY'),
('Spotify', 'Individual', 119.00, 'INR'),
('Spotify', 'Individual', 21.90, 'BRL'),

-- APPLE MUSIC
('Apple Music', 'Individual', 10.99, 'USD'),
('Apple Music', 'Bireysel', 39.99, 'TRY'),
('Apple Music', 'Individual', 10.99, 'GBP'),
('Apple Music', 'Individual', 10.99, 'EUR'),
('Apple Music', 'Individual', 10.99, 'CAD'),
('Apple Music', 'Individual', 99.00, 'INR'),

-- CANVA / ADOBE / X
('Canva', 'Pro', 15.00, 'USD'),
('Canva', 'Pro', 99.99, 'TRY'),
('Adobe Creative Cloud', 'All Apps', 59.99, 'USD'),
('X Premium', 'Basic', 3.00, 'USD'),
('X Premium', 'Premium', 150.00, 'TRY');
