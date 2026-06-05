-- Run this in your Supabase SQL editor (https://supabase.com/dashboard > SQL Editor)
-- Adds an is_dev flag to the users table for developer-only access control.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_dev BOOLEAN NOT NULL DEFAULT FALSE;

-- Register a dev account via the /register page first, then promote it:
--   UPDATE users SET is_dev = TRUE WHERE email = 'dev@yourstore.com';
--
-- Or create one directly (password: devadmin123):
--   INSERT INTO users (email, username, password_hash, is_dev)
--   VALUES ('dev@tindahan.dev', 'Developer', '$2b$10$Si..8y3XOrBXUjukQAIvke0Kpe64hBj3akwNxtG5L5Mne9vqjCOeq', TRUE);
