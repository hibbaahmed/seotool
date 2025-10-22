-- Onboarding Process and Keyword Management Schema

-- User onboarding profiles table
CREATE TABLE IF NOT EXISTS user_onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  target_audience TEXT,
  business_description TEXT,
  onboarding_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  analysis_progress JSONB DEFAULT '{}', -- Track progress of different analysis steps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Keywords table for storing discovered keywords
CREATE TABLE IF NOT EXISTS discovered_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty_score INTEGER DEFAULT 0, -- 0-100 scale
  opportunity_level TEXT NOT NULL CHECK (opportunity_level IN ('low', 'medium', 'high')),
  cpc DECIMAL(10,2) DEFAULT 0.00,
  source TEXT NOT NULL, -- 'competitor', 'site_analysis', 'google_trends', 'serp_analysis'
  competitor_domain TEXT, -- If sourced from competitor analysis
  serp_position INTEGER, -- If found in SERP analysis
  keyword_intent TEXT, -- 'informational', 'commercial', 'navigational', 'transactional'
  related_keywords TEXT[], -- Array of related keywords
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor analysis results
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  analysis_type TEXT NOT NULL, -- 'domain_analysis', 'keyword_gap', 'content_analysis'
  analysis_data JSONB NOT NULL, -- Store detailed analysis results
  keywords_found TEXT[], -- Keywords discovered from this competitor
  domain_authority INTEGER,
  monthly_traffic INTEGER,
  top_pages JSONB, -- Top performing pages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site analysis results
CREATE TABLE IF NOT EXISTS site_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'technical_seo', 'content_audit', 'keyword_analysis'
  analysis_data JSONB NOT NULL,
  current_keywords TEXT[], -- Keywords currently ranking for
  missing_keywords TEXT[], -- Keywords competitors rank for but site doesn't
  technical_issues JSONB, -- Technical SEO issues found
  content_gaps JSONB, -- Content gaps identified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google trends and SERP analysis
CREATE TABLE IF NOT EXISTS trends_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'google_trends', 'serp_analysis', 'related_searches'
  search_term TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  trending_keywords TEXT[],
  related_queries TEXT[],
  search_volume_data JSONB, -- Historical search volume data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword opportunities with detailed scoring
CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES discovered_keywords(id) ON DELETE CASCADE,
  opportunity_score INTEGER NOT NULL CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  ranking_potential INTEGER NOT NULL CHECK (ranking_potential >= 0 AND ranking_potential <= 100),
  content_opportunity INTEGER NOT NULL CHECK (content_opportunity >= 0 AND content_opportunity <= 100),
  competition_level INTEGER NOT NULL CHECK (competition_level >= 0 AND competition_level <= 100),
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  recommended_action TEXT, -- 'create_content', 'optimize_existing', 'build_links', 'technical_fix'
  estimated_traffic_potential INTEGER DEFAULT 0,
  estimated_conversion_potential DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_onboarding_profiles_user_id ON user_onboarding_profiles(user_id);
CREATE INDEX idx_discovered_keywords_user_id ON discovered_keywords(user_id);
CREATE INDEX idx_discovered_keywords_opportunity_level ON discovered_keywords(opportunity_level);
CREATE INDEX idx_discovered_keywords_source ON discovered_keywords(source);
CREATE INDEX idx_competitor_analysis_user_id ON competitor_analysis(user_id);
CREATE INDEX idx_site_analysis_user_id ON site_analysis(user_id);
CREATE INDEX idx_trends_analysis_user_id ON trends_analysis(user_id);
CREATE INDEX idx_keyword_opportunities_user_id ON keyword_opportunities(user_id);
CREATE INDEX idx_keyword_opportunities_priority ON keyword_opportunities(priority_level);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE user_onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE trends_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding_profiles
CREATE POLICY "Users can view their own onboarding profiles" ON user_onboarding_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding profiles" ON user_onboarding_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding profiles" ON user_onboarding_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding profiles" ON user_onboarding_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discovered_keywords
CREATE POLICY "Users can view their own discovered keywords" ON discovered_keywords
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discovered keywords" ON discovered_keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discovered keywords" ON discovered_keywords
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discovered keywords" ON discovered_keywords
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for competitor_analysis
CREATE POLICY "Users can view their own competitor analysis" ON competitor_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitor analysis" ON competitor_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analysis" ON competitor_analysis
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analysis" ON competitor_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for site_analysis
CREATE POLICY "Users can view their own site analysis" ON site_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own site analysis" ON site_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own site analysis" ON site_analysis
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own site analysis" ON site_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trends_analysis
CREATE POLICY "Users can view their own trends analysis" ON trends_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trends analysis" ON trends_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trends analysis" ON trends_analysis
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trends analysis" ON trends_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for keyword_opportunities
CREATE POLICY "Users can view their own keyword opportunities" ON keyword_opportunities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword opportunities" ON keyword_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword opportunities" ON keyword_opportunities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword opportunities" ON keyword_opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at on each row update
CREATE TRIGGER update_user_onboarding_profiles_updated_at
BEFORE UPDATE ON user_onboarding_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovered_keywords_updated_at
BEFORE UPDATE ON discovered_keywords
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_analysis_updated_at
BEFORE UPDATE ON competitor_analysis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_analysis_updated_at
BEFORE UPDATE ON site_analysis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trends_analysis_updated_at
BEFORE UPDATE ON trends_analysis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_opportunities_updated_at
BEFORE UPDATE ON keyword_opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
