-- Seed campaigns
INSERT INTO campaigns (id, brand_id, brand_name, brand_initial, name, category, status, days_remaining, ends_at, rate_per_100k_minor, budget_minor, spent_minor, platforms, creator_count, description, required_hashtags, total_views, total_clips, engagement_rate, cpm_minor) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Nova Media', 'N', 'Nova Podcast Clip Drive', 'Podcast', 'ACTIVE', 24, NOW() + INTERVAL '24 days', 2500, 50000000, 12500000, ARRAY['tiktok','instagram','youtube']::text[], 45, 'Clip the best moments from Nova Podcast episodes.', '["#NovaPodcast","#ClipMatrix"]'::jsonb, 1250000, 89, 5.2, 28),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000008', 'Northbeam Labs', 'N', 'Alpha Arena Trading Clips', 'Finance', 'ACTIVE', 18, NOW() + INTERVAL '18 days', 3500, 75000000, 8000000, ARRAY['youtube','tiktok']::text[], 32, 'Create educational clips about trading strategies.', '["#AlphaArena","#TradingClips"]'::jsonb, 890000, 56, 4.8, 38),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Nova Media', 'N', 'Lumen Sessions Highlights', 'Music', 'ACTIVE', 30, NOW() + INTERVAL '30 days', 2000, 30000000, 5000000, ARRAY['instagram','tiktok']::text[], 28, 'Clip the best live performance moments.', '["#LumenSessions","#LiveMusic"]'::jsonb, 670000, 42, 7.1, 22),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000009', 'Cartel Studios', 'C', 'Cartel Drop 04 Launch', 'Entertainment', 'ENDING_SOON', 3, NOW() + INTERVAL '3 days', 4000, 100000000, 85000000, ARRAY['tiktok','instagram','youtube','x']::text[], 67, 'Promote the Cartel Drop 04 collection launch.', '["#CartelDrop04","#Streetwear"]'::jsonb, 2100000, 134, 8.5, 42),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Nova Media', 'N', 'Statline Sync Dashboard', 'SaaS', 'DRAFT', 45, NOW() + INTERVAL '45 days', 3000, 40000000, 0, ARRAY['youtube','x']::text[], 0, 'Create tutorial clips showing dashboard features.', '["#StatlineSync","#DataAnalytics"]'::jsonb, 0, 0, 0, 32),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000008', 'Northbeam Labs', 'N', 'Ledger Lessons Financial', 'Education', 'ACTIVE', 21, NOW() + INTERVAL '21 days', 2800, 60000000, 15000000, ARRAY['youtube','tiktok','instagram']::text[], 38, 'Create educational clips about personal finance.', '["#LedgerLessons","#FinanceTips"]'::jsonb, 980000, 67, 5.5, 30);

-- Seed clips
INSERT INTO clips (id, campaign_id, campaign_name, brand_name, creator_id, creator_name, creator_handle, platform, url, views, likes, comments, shares, status, earned_minor) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Nova Podcast Clip Drive', 'Nova Media', 'a0000000-0000-0000-0000-000000000002', 'Alex Rivera', 'alexcreates', 'tiktok', 'https://tiktok.com/@alexcreates/video/001', 245000, 18200, 1340, 890, 'approved', 61250),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Nova Podcast Clip Drive', 'Nova Media', 'a0000000-0000-0000-0000-000000000005', 'Maya Chen', 'mayachen', 'instagram', 'https://instagram.com/reel/002', 189000, 14500, 980, 670, 'approved', 47250),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Alpha Arena Trading Clips', 'Northbeam Labs', 'a0000000-0000-0000-0000-000000000006', 'Jordan Blake', 'jordanblake', 'youtube', 'https://youtube.com/watch?v=003', 312000, 22100, 2100, 1500, 'approved', 109200),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Lumen Sessions Highlights', 'Nova Media', 'a0000000-0000-0000-0000-000000000007', 'Priya Sharma', 'priyasharma', 'tiktok', 'https://tiktok.com/@priyasharma/video/004', 156000, 12800, 780, 520, 'pending', 0),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Cartel Drop 04 Launch', 'Cartel Studios', 'a0000000-0000-0000-0000-000000000002', 'Alex Rivera', 'alexcreates', 'instagram', 'https://instagram.com/reel/005', 420000, 35000, 2800, 2100, 'approved', 168000),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Nova Podcast Clip Drive', 'Nova Media', 'a0000000-0000-0000-0000-000000000006', 'Jordan Blake', 'jordanblake', 'youtube', 'https://youtube.com/watch?v=006', 98000, 7200, 540, 320, 'under_review', 0),
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'Ledger Lessons Financial', 'Northbeam Labs', 'a0000000-0000-0000-0000-000000000005', 'Maya Chen', 'mayachen', 'tiktok', 'https://tiktok.com/@mayachen/video/007', 67000, 5100, 380, 210, 'rejected', 0),
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'Cartel Drop 04 Launch', 'Cartel Studios', 'a0000000-0000-0000-0000-000000000007', 'Priya Sharma', 'priyasharma', 'x', 'https://x.com/priyasharma/status/008', 89000, 6300, 420, 280, 'flagged', 0);

-- Seed social accounts
INSERT INTO social_accounts (id, user_id, platform, username, followers, status, connected_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'tiktok', 'alexcreates', 85000, 'verified', NOW()),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'instagram', 'alexcreates', 62000, 'verified', NOW()),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'youtube', 'Alex Rivera', 45000, 'verified', NOW()),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'x', 'alexcreates', 28000, 'not_connected', NULL);

-- Seed earnings
INSERT INTO earnings (id, user_id, campaign_id, campaign_name, views, amount_minor, status, method) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Nova Podcast Clip Drive', 245000, 61250, 'completed', 'bank_transfer'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Cartel Drop 04 Launch', 420000, 168000, 'completed', 'bank_transfer'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Nova Podcast Clip Drive', 189000, 47250, 'pending', 'upi'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Alpha Arena Trading Clips', 312000, 109200, 'completed', 'bank_transfer');

-- Seed payout methods
INSERT INTO payout_methods (id, user_id, kind, label, identifier, is_default) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'bank_transfer', 'HDFC Bank', '****4521', true),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'upi', 'Google Pay', 'alex@upi', false);

-- Seed transactions
INSERT INTO transactions (id, user_id, description, kind, amount_minor, status, method) VALUES
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Earning from Nova Podcast Clip Drive', 'earning', 61250, 'completed', 'bank_transfer'),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Earning from Cartel Drop 04 Launch', 'earning', 168000, 'completed', 'bank_transfer'),
('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Withdrawal to HDFC Bank', 'withdrawal', -100000, 'completed', 'bank_transfer');
