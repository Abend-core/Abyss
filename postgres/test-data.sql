-- ============================================================
-- Abyss — Test Data Insertion
-- Insert test users, categories, and expenses
-- ============================================================

-- Test User 1: alice@example.com
INSERT INTO dbo.users (id, email_hash, email_encrypted, password_hash, auth_salt, key_salt, key_fragment)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  encode(digest('alice@example.com' || '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'sha256'), 'hex'),
  encrypt('alice@example.com', '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'aes'),
  '$2b$10$abcdefghijklmnopqrstuvwx', -- password: "password123"
  'abcdef1234567890abcdef1234567890',
  '1234567890abcdef1234567890abcdef',
  'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
);

-- Test User 2: bob@example.com
INSERT INTO dbo.users (id, email_hash, email_encrypted, password_hash, auth_salt, key_salt, key_fragment)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  encode(digest('bob@example.com' || '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'sha256'), 'hex'),
  encrypt('bob@example.com', '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'aes'),
  '$2b$10$abcdefghijklmnopqrstuvwx', -- password: "password123"
  'abcdef1234567890abcdef1234567890',
  '1234567890abcdef1234567890abcdef',
  'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
);

-- Test User 3: charlie@example.com
INSERT INTO dbo.users (id, email_hash, email_encrypted, password_hash, auth_salt, key_salt, key_fragment)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  encode(digest('charlie@example.com' || '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'sha256'), 'hex'),
  encrypt('charlie@example.com', '060428d9c8d57723e34226edd26729e83c7a46cb3342efb4c9fe4217496e1469', 'aes'),
  '$2b$10$abcdefghijklmnopqrstuvwx', -- password: "password123"
  'abcdef1234567890abcdef1234567890',
  '1234567890abcdef1234567890abcdef',
  'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
);

-- Categories for Alice
INSERT INTO dbo.categories (id, user_id, title, color, icon, parent_id) VALUES
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Alimentation', '#4ade80', 'restaurant', NULL),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Courses', '#facc15', 'shopping_cart', '650e8400-e29b-41d4-a716-446655440011'),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Restaurants', '#f87171', 'local_dining', '650e8400-e29b-41d4-a716-446655440011'),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Transport', '#4f8ef7', 'directions_car', NULL),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Essence', '#6ba4ff', 'local_gas_station', '650e8400-e29b-41d4-a716-446655440014'),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', 'Logement', '#9d4edd', 'home', NULL),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', 'Loyer', '#c77dff', 'apartment', '650e8400-e29b-41d4-a716-446655440016');

-- Categories for Bob
INSERT INTO dbo.categories (id, user_id, title, color, icon, parent_id) VALUES
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Loisirs', '#ff6b6b', 'sports_soccer', NULL),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Cinéma', '#4ecdc4', 'movie', '650e8400-e29b-41d4-a716-446655440021'),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'Sports', '#45b7d1', 'fitness_center', '650e8400-e29b-41d4-a716-446655440021'),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Santé', '#96ceb4', 'local_hospital', NULL),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'Médecin', '#ffeaa7', 'person', '650e8400-e29b-41d4-a716-446655440024');

-- Expenses for Alice
INSERT INTO dbo.items (id, user_id, category_id, title, amount, date, is_recurring, recurrence, description) VALUES
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440017', 'Loyer Mars', 850.00, '2026-03-01', true, 'monthly', 'Loyer appartement'),
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440015', 'Essence', 65.50, '2026-03-15', false, NULL, 'Plein voiture'),
('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440012', 'Courses Supermarché', 127.30, '2026-03-10', false, NULL, 'Courses hebdomadaires'),
('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440013', 'Restaurant Italien', 45.80, '2026-03-12', false, NULL, 'Dîner romantique'),
('750e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440015', 'Essence', 72.40, '2026-03-20', false, NULL, 'Plein voiture');

-- Expenses for Bob
INSERT INTO dbo.items (id, user_id, category_id, title, amount, date, is_recurring, recurrence, description) VALUES
('750e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440022', 'Cinéma Avengers', 12.50, '2026-03-08', false, NULL, 'Séance cinéma'),
('750e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440023', 'Abonnement Salle de Sport', 49.99, '2026-03-01', true, 'monthly', 'Mois de mars'),
('750e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440025', 'Consultation Médecin', 65.00, '2026-03-14', false, NULL, 'Visite de contrôle');

-- Expenses for Charlie (no categories yet)
INSERT INTO dbo.items (id, user_id, title, amount, date, is_recurring, recurrence, description) VALUES
('750e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Café du matin', 3.50, '2026-03-15', false, NULL, 'Café quotidien'),
('750e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'Transport en commun', 8.75, '2026-03-15', false, NULL, 'Ticket de bus');