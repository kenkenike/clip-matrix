-- Migration: Add Discord OAuth fields to profiles table
-- This migration adds columns for Discord user data used by the OAuth login system.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index for fast lookup by Discord ID during OAuth callback
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON profiles (discord_id) WHERE discord_id IS NOT NULL;

COMMENT ON COLUMN profiles.discord_id IS 'Unique Discord user ID for OAuth authentication';
COMMENT ON COLUMN profiles.discord_username IS 'Discord username (may change)';
COMMENT ON COLUMN profiles.discord_display_name IS 'Discord global display name';
COMMENT ON COLUMN profiles.discord_avatar IS 'Discord avatar CDN URL';
COMMENT ON COLUMN profiles.discord_email IS 'Discord email (if user consents)';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last login via Discord OAuth';
