-- ============================================================================
-- Seed data: achievements + shop items
-- ============================================================================

insert into public.achievements (code, name, description, icon, coin_reward) values
  ('first_win', 'First Blood', 'Win your first match', 'trophy', 50),
  ('win_streak_3', 'On Fire', 'Win 3 matches in a row', 'flame', 100),
  ('win_streak_10', 'Unstoppable', 'Win 10 matches in a row', 'zap', 300),
  ('words_100', 'Wordsmith', 'Solve 100 words across all matches', 'book', 150),
  ('words_1000', 'Lexicon Master', 'Solve 1000 words across all matches', 'sparkles', 500),
  ('big_wager', 'High Roller', 'Win a match with a wager of 500+ coins', 'gem', 200),
  ('first_friend', 'Making Friends', 'Add your first friend', 'users', 25),
  ('daily_streak_7', 'Dedicated', 'Claim your daily reward for 7 days straight', 'calendar', 250)
on conflict (code) do nothing;

insert into public.shop_items (code, name, description, type, price, rarity, asset_ref) values
  ('theme_default', 'Default', 'The classic Gamly look', 'theme', 0, 'common', 'default'),
  ('theme_midnight', 'Midnight', 'Deep purple and indigo gradient theme', 'theme', 200, 'rare', 'midnight'),
  ('theme_sunset', 'Sunset', 'Warm orange and pink gradient theme', 'theme', 200, 'rare', 'sunset'),
  ('theme_neon', 'Neon Arcade', 'Electric cyan and magenta theme', 'theme', 400, 'epic', 'neon'),
  ('theme_gold', 'Champion Gold', 'Luxurious gold and black theme', 'theme', 800, 'legendary', 'gold'),
  ('frame_default', 'Default Frame', 'No frame', 'avatar_frame', 0, 'common', 'default'),
  ('frame_flame', 'Blazing Frame', 'Animated flame border', 'avatar_frame', 250, 'rare', 'flame'),
  ('frame_electric', 'Electric Frame', 'Crackling electric border', 'avatar_frame', 250, 'rare', 'electric'),
  ('frame_royal', 'Royal Frame', 'Ornate gold and jewel border', 'avatar_frame', 600, 'epic', 'royal'),
  ('frame_cosmic', 'Cosmic Frame', 'Animated starfield border', 'avatar_frame', 1000, 'legendary', 'cosmic'),
  ('title_rookie', 'Rookie', 'A humble beginning', 'title', 0, 'common', 'Rookie'),
  ('title_wordsmith', 'Wordsmith', 'For lovers of language', 'title', 150, 'rare', 'Wordsmith'),
  ('title_champion', 'Champion', 'For the very best', 'title', 500, 'epic', 'Champion'),
  ('title_legend', 'Legend', 'A true legend of Gamly', 'title', 1000, 'legendary', 'Legend')
on conflict (code) do nothing;
