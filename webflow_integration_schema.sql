-- Webflow Sites & Publishing Logs
CREATE TABLE IF NOT EXISTS webflow_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  site_id TEXT NOT NULL,
  site_name TEXT,
  site_slug TEXT,
  domain TEXT,
  collection_id TEXT NOT NULL,
  collection_name TEXT,
  token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, site_id, collection_id)
);

CREATE TABLE IF NOT EXISTS webflow_publish_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES webflow_sites(id) ON DELETE CASCADE NOT NULL,
  content_id TEXT,
  content_type TEXT,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  error TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE webflow_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE webflow_publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own Webflow sites" ON webflow_sites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own Webflow logs" ON webflow_publish_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column_webflow()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webflow_sites_updated_at
BEFORE UPDATE ON webflow_sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_webflow();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webflow_sites_user ON webflow_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_webflow_sites_site ON webflow_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_webflow_logs_user ON webflow_publish_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webflow_logs_site ON webflow_publish_logs(site_id);

