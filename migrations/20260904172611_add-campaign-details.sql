-- Add missing columns to campaigns
ALTER TABLE campaigns ADD COLUMN brand_initial TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN max_payout_minor INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN min_views INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN long_description TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN rules_summary TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN content_requirements JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN prohibited_content JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN creator_requirements JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN required_hashtags JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN required_mentions JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN required_phrases JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN total_clips INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN engagement_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN cpm_minor INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN example_clips JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN cover_url TEXT DEFAULT '';

-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN followers INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN lifetime_earnings_minor INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN clips_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN engagement_rate NUMERIC(5,2) DEFAULT 0;
