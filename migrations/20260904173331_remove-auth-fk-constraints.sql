-- Remove auth.users FK constraints to allow mock auth IDs
-- These will be re-added when real auth is wired up

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE clips DROP CONSTRAINT IF EXISTS clips_creator_id_fkey;
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_fkey;
ALTER TABLE earnings DROP CONSTRAINT IF EXISTS earnings_user_id_fkey;
ALTER TABLE payout_methods DROP CONSTRAINT IF EXISTS payout_methods_user_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE moderation_reviews DROP CONSTRAINT IF EXISTS moderation_reviews_reviewer_id_fkey;
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS payout_requests_user_id_fkey;
