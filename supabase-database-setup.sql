-- CastChain Narratives Supabase数据库完整设置脚本
-- 在Supabase SQL编辑器中执行此脚本以创建所有表、索引和优化

-- ============================================================================
-- 第一部分：启用扩展和创建表结构
-- ============================================================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 叙事表 (narratives)
CREATE TABLE IF NOT EXISTS narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  narrative_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_fid INTEGER NOT NULL,
  creator_username TEXT,
  creator_display_name TEXT,
  creator_pfp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  collaboration_rules TEXT DEFAULT 'open' CHECK (collaboration_rules IN ('open', 'moderated', 'closed')),
  tags TEXT[] DEFAULT '{}',
  branch_count INTEGER DEFAULT 1,
  contribution_count INTEGER DEFAULT 1,
  contributor_count INTEGER DEFAULT 1,
  featured_image_url TEXT,
  cast_hash TEXT
);

-- 2. 贡献表 (contributions)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contribution_id TEXT UNIQUE NOT NULL,
  narrative_id TEXT NOT NULL REFERENCES narratives(narrative_id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  contributor_fid INTEGER NOT NULL,
  contributor_username TEXT,
  contributor_display_name TEXT,
  contributor_pfp TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
  parent_contribution_id TEXT,
  order_index INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  cast_hash TEXT
);

-- 3. 分支表 (branches)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id TEXT UNIQUE NOT NULL,
  narrative_id TEXT NOT NULL REFERENCES narratives(narrative_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  creator_fid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'merged', 'archived')),
  parent_branch_id TEXT,
  contribution_count INTEGER DEFAULT 0,
  is_main_branch BOOLEAN DEFAULT FALSE
);

-- 4. 成就表 (achievements)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_id TEXT UNIQUE NOT NULL,
  user_fid INTEGER NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  narrative_id TEXT REFERENCES narratives(narrative_id),
  contribution_id TEXT,
  metadata JSONB DEFAULT '{}',
  nft_token_id TEXT,
  nft_contract_address TEXT,
  nft_transaction_hash TEXT
);

-- 5. 关注表 (followers)
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER NOT NULL,
  narrative_id TEXT NOT NULL REFERENCES narratives(narrative_id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_fid, narrative_id)
);

-- 6. 通知表 (notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id TEXT UNIQUE NOT NULL,
  user_fid INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  narrative_id TEXT REFERENCES narratives(narrative_id),
  contribution_id TEXT,
  achievement_id TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 第二部分：创建基础索引
-- ============================================================================

-- narratives表的基础索引
CREATE INDEX IF NOT EXISTS idx_narratives_creator_fid ON narratives(creator_fid);
CREATE INDEX IF NOT EXISTS idx_narratives_status ON narratives(status);
CREATE INDEX IF NOT EXISTS idx_narratives_created_at ON narratives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_contribution_count ON narratives(contribution_count DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_tags ON narratives USING GIN(tags);

-- contributions表的基础索引
CREATE INDEX IF NOT EXISTS idx_contributions_narrative_id ON contributions(narrative_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor_fid ON contributions(contributor_fid);
CREATE INDEX IF NOT EXISTS idx_contributions_branch_id ON contributions(branch_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at DESC);

-- branches表的基础索引
CREATE INDEX IF NOT EXISTS idx_branches_narrative_id ON branches(narrative_id);
CREATE INDEX IF NOT EXISTS idx_branches_creator_fid ON branches(creator_fid);

-- achievements表的基础索引
CREATE INDEX IF NOT EXISTS idx_achievements_user_fid ON achievements(user_fid);
CREATE INDEX IF NOT EXISTS idx_achievements_narrative_id ON achievements(narrative_id);

-- followers表的基础索引
CREATE INDEX IF NOT EXISTS idx_followers_user_fid ON followers(user_fid);
CREATE INDEX IF NOT EXISTS idx_followers_narrative_id ON followers(narrative_id);

-- notifications表的基础索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_fid ON notifications(user_fid);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- ============================================================================
-- 第三部分：性能优化索引
-- ============================================================================

-- 复合索引 - 用于常见的查询组合
CREATE INDEX IF NOT EXISTS idx_narratives_status_created_at 
ON narratives(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_narratives_creator_status 
ON narratives(creator_fid, status);

CREATE INDEX IF NOT EXISTS idx_narratives_contribution_count_desc 
ON narratives(contribution_count DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_contributions_narrative_created_at 
ON contributions(narrative_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_contributor_narrative 
ON contributions(contributor_fid, narrative_id);

CREATE INDEX IF NOT EXISTS idx_contributions_branch_order 
ON contributions(branch_id, order_index);

CREATE INDEX IF NOT EXISTS idx_contributions_parent_created_at 
ON contributions(parent_contribution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_branches_narrative_main 
ON branches(narrative_id, is_main_branch);

CREATE INDEX IF NOT EXISTS idx_branches_creator_narrative 
ON branches(creator_fid, narrative_id);

CREATE INDEX IF NOT EXISTS idx_achievements_user_type 
ON achievements(user_fid, achievement_type);

CREATE INDEX IF NOT EXISTS idx_achievements_narrative_earned 
ON achievements(narrative_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_fid, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
ON notifications(user_fid, type);

CREATE INDEX IF NOT EXISTS idx_followers_narrative_followed 
ON followers(narrative_id, followed_at DESC);

-- 部分索引 - 只索引满足特定条件的行
CREATE INDEX IF NOT EXISTS idx_narratives_active_popular 
ON narratives(contribution_count DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_fid, created_at DESC) 
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contributions_active_narrative 
ON contributions(narrative_id, created_at DESC) 
WHERE status = 'active';

-- 表达式索引 - 用于特殊查询
CREATE INDEX IF NOT EXISTS idx_narratives_tags_gin 
ON narratives USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_narratives_title_search 
ON narratives USING GIN(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_contributions_content_search 
ON contributions USING GIN(to_tsvector('english', content));

-- 唯一索引 - 确保数据完整性
CREATE UNIQUE INDEX IF NOT EXISTS idx_followers_unique 
ON followers(user_fid, narrative_id);

-- 覆盖索引 - 包含查询所需的所有列
CREATE INDEX IF NOT EXISTS idx_narratives_list_covering 
ON narratives(status, created_at DESC) 
INCLUDE (narrative_id, title, description, creator_fid, creator_username, 
         creator_display_name, tags, contribution_count, collaboration_rules);

CREATE INDEX IF NOT EXISTS idx_contributions_list_covering 
ON contributions(narrative_id, created_at DESC) 
INCLUDE (contribution_id, contributor_fid, contributor_username, 
         contributor_display_name, content, content_type, like_count);

-- ============================================================================
-- 第四部分：触发器和函数
-- ============================================================================

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON narratives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 第五部分：分析表统计信息
-- ============================================================================

ANALYZE narratives;
ANALYZE contributions;
ANALYZE branches;
ANALYZE achievements;
ANALYZE notifications;
ANALYZE followers;

-- ============================================================================
-- 设置完成
-- ============================================================================

-- 数据库设置完成，所有表、索引和优化已创建
