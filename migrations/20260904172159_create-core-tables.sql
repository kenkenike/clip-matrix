-- Clip Matrix: Core Tables
-- All tables reference auth.users(id) for ownership

-- 1. User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  handle TEXT UNIQUE NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'brand', 'admin', 'moderator')),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'kicked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Entertainment',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('ACTIVE', 'ENDING_SOON', 'DRAFT', 'PAUSED', 'COMPLETED')),
  days_remaining INTEGER DEFAULT 30,
  ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  rate_per_100k_minor INTEGER DEFAULT 0,
  budget_minor INTEGER DEFAULT 0,
  spent_minor INTEGER DEFAULT 0,
  platforms TEXT[] DEFAULT '{}',
  creator_count INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  rules JSONB DEFAULT '{}',
  faqs JSONB DEFAULT '[]',
  geo_breakdown JSONB DEFAULT '[]',
  spend_history JSONB DEFAULT '[]',
  performance_series JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clips (submitted video clips)
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL DEFAULT '',
  brand_name TEXT NOT NULL DEFAULT '',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL DEFAULT '',
  creator_handle TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'x')),
  url TEXT NOT NULL DEFAULT '',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  posted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'flagged', 'paid')),
  earned_minor INTEGER DEFAULT 0,
  rejection_reason TEXT,
  fraud_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Social accounts (connected platforms)
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'x')),
  username TEXT NOT NULL DEFAULT '',
  followers INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'connecting', 'verified', 'disconnected')),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 5. Earnings
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL DEFAULT '',
  views INTEGER DEFAULT 0,
  amount_minor INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payout methods
CREATE TABLE payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('bank_transfer', 'upi', 'crypto')),
  label TEXT NOT NULL DEFAULT '',
  identifier TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('earning', 'withdrawal', 'refund', 'bonus')),
  amount_minor INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT DEFAULT 'bank_transfer',
  reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  time TIMESTAMPTZ DEFAULT NOW(),
  unread BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Moderation reviews
CREATE TABLE moderation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag')),
  notes TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Fraud flags
CREATE TABLE fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  level TEXT DEFAULT 'LOW' CHECK (level IN ('LOW', 'MEDIUM', 'HIGH')),
  signals JSONB DEFAULT '[]',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Admin platform settings
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Payout requests (admin-managed)
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_minor INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  payment_detail TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_clips_campaign_id ON clips(campaign_id);
CREATE INDEX idx_clips_creator_id ON clips(creator_id);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_clips_platform ON clips(platform);
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
CREATE INDEX idx_moderation_reviews_clip_id ON moderation_reviews(clip_id);
CREATE INDEX idx_fraud_flags_clip_id ON fraud_flags(clip_id);
CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER clips_updated_at BEFORE UPDATE ON clips FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER earnings_updated_at BEFORE UPDATE ON earnings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER payout_methods_updated_at BEFORE UPDATE ON payout_methods FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER fraud_flags_updated_at BEFORE UPDATE ON fraud_flags FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER payout_requests_updated_at BEFORE UPDATE ON payout_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Seed default platform settings
INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_pct', '10'),
  ('min_withdrawal_minor', '500000'),
  ('payout_schedule', '"weekly"'),
  ('auto_approve_clips', 'false'),
  ('instant_payouts', 'false'),
  ('fraud_auto_flag', 'true'),
  ('brand_verification_required', 'false');
