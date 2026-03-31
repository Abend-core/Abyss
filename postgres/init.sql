-- ============================================================
-- Abyss — Database initialization
-- Schema: dbo (all tables live here)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create dbo schema
CREATE SCHEMA IF NOT EXISTS dbo;

-- Set default search path
ALTER DATABASE abyss_db SET search_path TO dbo, public;
SET search_path TO dbo, public;

-- Auto-update updated_at helper
CREATE OR REPLACE FUNCTION dbo.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Table: dbo.users
-- ============================================================
CREATE TABLE IF NOT EXISTS dbo.users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_hash     VARCHAR(64) UNIQUE NOT NULL,   -- HMAC-SHA256(email, MASTER_SECRET) — blind index
  email_encrypted TEXT NOT NULL,                -- AES-256-GCM(email) — pour affichage
  password_hash  TEXT        NOT NULL,
  auth_salt      VARCHAR(32) NOT NULL,           -- 16 bytes hex (pour hash password)
  key_salt       VARCHAR(32) NOT NULL,           -- 16 bytes hex (pour dérivation clé)
  key_fragment   VARCHAR(64) NOT NULL,           -- 32 bytes hex (split-key fragment)
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON dbo.users
  FOR EACH ROW EXECUTE FUNCTION dbo.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_email_hash ON dbo.users(email_hash);

-- ============================================================
-- Table: dbo.items
-- ============================================================
CREATE TABLE IF NOT EXISTS dbo.items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON dbo.items
  FOR EACH ROW EXECUTE FUNCTION dbo.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_items_user_id ON dbo.items(user_id);
