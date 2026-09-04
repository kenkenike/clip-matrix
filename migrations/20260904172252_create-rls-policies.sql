-- Clip Matrix: RLS Policies + Helper Functions

-- Helper: get current user's role (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.get_user_role() = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

-- Helper: check if user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS boolean AS $$
  SELECT public.get_user_role() IN ('admin', 'moderator');
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

-- Helper: check if user owns a campaign
CREATE OR REPLACE FUNCTION public.owns_campaign(campaign_uuid UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns WHERE id = campaign_uuid AND brand_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

-- Helper: check if user owns a clip
CREATE OR REPLACE FUNCTION public.owns_clip(clip_uuid UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clips WHERE id = clip_uuid AND creator_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- CAMPAIGNS
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Everyone can read active/published campaigns
CREATE POLICY "campaigns_select_public" ON campaigns
  FOR SELECT TO anon, authenticated
  USING (status IN ('ACTIVE', 'ENDING_SOON', 'COMPLETED'));

-- Brand owners can read their own campaigns (any status)
CREATE POLICY "campaigns_select_owner" ON campaigns
  FOR SELECT TO authenticated
  USING (brand_id = (SELECT auth.uid()));

-- Admin/mod can read all campaigns
CREATE POLICY "campaigns_select_admin" ON campaigns
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

-- Brand owners can create campaigns
CREATE POLICY "campaigns_insert_brand" ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (brand_id = (SELECT auth.uid()));

-- Brand owners can update their own campaigns
CREATE POLICY "campaigns_update_owner" ON campaigns
  FOR UPDATE TO authenticated
  USING (brand_id = (SELECT auth.uid()))
  WITH CHECK (brand_id = (SELECT auth.uid()));

-- Admin can update any campaign
CREATE POLICY "campaigns_update_admin" ON campaigns
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Brand owners can delete their own campaigns
CREATE POLICY "campaigns_delete_owner" ON campaigns
  FOR DELETE TO authenticated
  USING (brand_id = (SELECT auth.uid()));

-- Admin can delete any campaign
CREATE POLICY "campaigns_delete_admin" ON campaigns
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- CLIPS
-- ============================================================
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Creators can read their own clips
CREATE POLICY "clips_select_own" ON clips
  FOR SELECT TO authenticated
  USING (creator_id = (SELECT auth.uid()));

-- Campaign owners can read clips submitted to their campaigns
CREATE POLICY "clips_select_campaign_owner" ON clips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = clips.campaign_id
      AND campaigns.brand_id = auth.uid()
    )
  );

-- Admin/mod can read all clips
CREATE POLICY "clips_select_admin" ON clips
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

-- Creators can insert clips (their own submissions)
CREATE POLICY "clips_insert_own" ON clips
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = (SELECT auth.uid()));

-- Creators can update their own clips (limited fields)
CREATE POLICY "clips_update_own" ON clips
  FOR UPDATE TO authenticated
  USING (creator_id = (SELECT auth.uid()))
  WITH CHECK (creator_id = (SELECT auth.uid()));

-- Campaign owners can update clip status (approve/reject)
CREATE POLICY "clips_update_campaign_owner" ON clips
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = clips.campaign_id
      AND campaigns.brand_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = clips.campaign_id
      AND campaigns.brand_id = auth.uid()
    )
  );

-- Admin can update any clip
CREATE POLICY "clips_update_admin" ON clips
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts_select_own" ON social_accounts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "social_accounts_select_admin" ON social_accounts
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "social_accounts_insert_own" ON social_accounts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "social_accounts_update_own" ON social_accounts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "social_accounts_delete_own" ON social_accounts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- EARNINGS
-- ============================================================
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earnings_select_own" ON earnings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "earnings_select_admin" ON earnings
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "earnings_insert_admin" ON earnings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "earnings_update_admin" ON earnings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PAYOUT METHODS
-- ============================================================
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_methods_select_own" ON payout_methods
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "payout_methods_insert_own" ON payout_methods
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "payout_methods_update_own" ON payout_methods
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "payout_methods_delete_own" ON payout_methods
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- TRANSACTIONS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "transactions_select_admin" ON transactions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "transactions_insert_admin" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- MODERATION REVIEWS
-- ============================================================
ALTER TABLE moderation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_reviews_select_admin" ON moderation_reviews
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

CREATE POLICY "moderation_reviews_insert_admin" ON moderation_reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin());

-- ============================================================
-- FRAUD FLAGS
-- ============================================================
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fraud_flags_select_admin" ON fraud_flags
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

CREATE POLICY "fraud_flags_insert_admin" ON fraud_flags
  FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin());

CREATE POLICY "fraud_flags_update_admin" ON fraud_flags
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PLATFORM SETTINGS (admin only)
-- ============================================================
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_select_public" ON platform_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "platform_settings_update_admin" ON platform_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "platform_settings_insert_admin" ON platform_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- PAYOUT REQUESTS
-- ============================================================
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payout_requests_select_own" ON payout_requests
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "payout_requests_select_admin" ON payout_requests
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "payout_requests_insert_own" ON payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "payout_requests_update_admin" ON payout_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

GRANT SELECT ON campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON campaigns TO authenticated;

GRANT SELECT ON clips TO anon, authenticated;
GRANT INSERT, UPDATE ON clips TO authenticated;

GRANT SELECT ON social_accounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON social_accounts TO authenticated;

GRANT SELECT ON earnings TO anon, authenticated;
GRANT INSERT, UPDATE ON earnings TO authenticated;

GRANT SELECT ON payout_methods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON payout_methods TO authenticated;

GRANT SELECT ON transactions TO authenticated;
GRANT INSERT ON transactions TO authenticated;

GRANT SELECT ON notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON notifications TO authenticated;

GRANT SELECT ON moderation_reviews TO authenticated;
GRANT INSERT ON moderation_reviews TO authenticated;

GRANT SELECT ON fraud_flags TO authenticated;
GRANT INSERT, UPDATE ON fraud_flags TO authenticated;

GRANT SELECT ON platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON platform_settings TO authenticated;

GRANT SELECT ON payout_requests TO authenticated;
GRANT INSERT ON payout_requests TO authenticated;
GRANT UPDATE ON payout_requests TO authenticated;
