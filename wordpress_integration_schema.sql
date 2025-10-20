-- WordPress Sites Table
CREATE TABLE IF NOT EXISTS wordpress_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- In production, encrypt this
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Publishing Logs Table
CREATE TABLE IF NOT EXISTS publishing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES wordpress_sites(id) ON DELETE CASCADE NOT NULL,
  content_id TEXT NOT NULL, -- ID of the content from other tables
  content_type TEXT NOT NULL, -- 'content', 'analysis', 'seo_research'
  post_id INTEGER NOT NULL, -- WordPress post ID
  status TEXT NOT NULL DEFAULT 'published', -- 'published', 'scheduled', 'failed'
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;

-- Policies for wordpress_sites
CREATE POLICY "Users can view their own WordPress sites." ON wordpress_sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WordPress sites." ON wordpress_sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WordPress sites." ON wordpress_sites
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WordPress sites." ON wordpress_sites
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for publishing_logs
CREATE POLICY "Users can view their own publishing logs." ON publishing_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publishing logs." ON publishing_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publishing logs." ON publishing_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publishing logs." ON publishing_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column_wordpress()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on each row update
CREATE TRIGGER update_wordpress_sites_updated_at
BEFORE UPDATE ON wordpress_sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_wordpress();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user_id ON wordpress_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_user_id ON publishing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_site_id ON publishing_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_content_id ON publishing_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_published_at ON publishing_logs(published_at DESC);
